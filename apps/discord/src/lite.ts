// Ward Lite in Node: the same small classifier the app runs in the browser (apps/web/src/lib/lite.ts),
// loaded from the app's own copy of the model, on the CPU, with no network. Raise-only: it can
// catch what the word lists miss, but never clears a warning.

import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { AutoModelForSequenceClassification, AutoTokenizer, env, type PreTrainedModel, type PreTrainedTokenizer } from "@huggingface/transformers";
import type { Chat, Judge, ModelJudgement } from "@ward/engine";

const MODELS = fileURLToPath(new URL("../../web/public/models/", import.meta.url));
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = MODELS;

interface Meta {
  threshold: number;
  thresholds?: Partial<Record<"bengali" | "devanagari" | "latin", number>>;
}

function script(text: string): "bengali" | "devanagari" | "latin" {
  if (/[ঀ-৿]/.test(text)) return "bengali";
  if (/[ऀ-ॿ]/.test(text)) return "devanagari";
  return "latin";
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

let loaded: Promise<{ tok: PreTrainedTokenizer; model: PreTrainedModel; meta: Meta }> | null = null;

export function loadLite() {
  loaded ??= (async () => {
    const meta = JSON.parse(readFileSync(`${MODELS}ward-lite/ward-lite.json`, "utf8")) as Meta;
    const [tok, model] = await Promise.all([
      AutoTokenizer.from_pretrained("ward-lite"),
      AutoModelForSequenceClassification.from_pretrained("ward-lite", { dtype: "q8" }),
    ]);
    return { tok, model, meta };
  })();
  return loaded;
}

export class WardLiteJudge implements Judge {
  readonly name = "Ward Lite";

  async judge(chat: Chat) {
    const { tok, model, meta } = await loadLite();
    const out = new Map<number, ModelJudgement>();
    const msgs = chat.messages.filter((m) => !m.media && m.text.trim());
    for (let i = 0; i < msgs.length; i += 16) {
      const batch = msgs.slice(i, i + 16);
      const inputs = await tok(batch.map((m) => m.text), { padding: true, truncation: true, max_length: 96 });
      const { logits } = await model(inputs);
      const data = logits.data as Float32Array;
      batch.forEach((m, k) => {
        const hurtful = sigmoid(data[k * 2]!);
        const danger = sigmoid(data[k * 2 + 1]!);
        const t = meta.thresholds?.[script(m.text)] ?? meta.threshold;
        const isDanger = danger >= meta.threshold;
        const hostile = hurtful >= t || isDanger;
        out.set(m.id, {
          hostile,
          severity: isDanger ? 3 : hurtful >= 0.8 ? 2 : hurtful >= t ? 1 : 0,
          categories: [],
          why: isDanger ? "Ward Lite reads this as dangerous" : hurtful >= 0.8 ? "Ward Lite reads this as hurtful" : hostile ? "Ward Lite thinks this may be unkind" : undefined,
          model: this.name,
          authority: "raise-only",
        });
      });
    }
    return out;
  }
}
