// Ward Lite: the small classifier distilled from Gemma 4 (train/), run on the device with
// transformers.js and ONNX Runtime Web. Loaded from the app bundle, never from the network.
// It has raise-only authority: it can catch what the word lists miss, but never clear a warning.

import { AutoModelForSequenceClassification, AutoTokenizer, env, type PreTrainedModel, type PreTrainedTokenizer } from "@huggingface/transformers";
import type { Chat, Judge, ModelJudgement } from "@ward/engine";

const BASE = new URL("./models/", document.baseURI).href;
env.allowRemoteModels = false;
env.allowLocalModels = true;
// Relative on purpose: transformers.js skips its local-file check for http(s) URLs.
env.localModelPath = "./models/";
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = new URL("./ort/", document.baseURI).href;
  // No cross-origin isolation in Capacitor or Electron's custom scheme, so one thread.
  env.backends.onnx.wasm.numThreads = 1;
}

let loaded: Promise<{ tok: PreTrainedTokenizer; model: PreTrainedModel; threshold: number }> | null = null;

export function loadLite() {
  loaded ??= (async () => {
    const meta = await fetch(`${BASE}ward-lite/ward-lite.json`).then((r) => {
      if (!r.ok) throw new Error("Ward Lite isn't in this build");
      return r.json() as Promise<{ threshold: number }>;
    });
    const [tok, model] = await Promise.all([
      AutoTokenizer.from_pretrained("ward-lite"),
      AutoModelForSequenceClassification.from_pretrained("ward-lite", { dtype: "q8", device: "wasm" }),
    ]);
    return { tok, model, threshold: meta.threshold };
  })();
  loaded.catch(() => (loaded = null));
  return loaded;
}

export async function liteAvailable() {
  try {
    await loadLite();
    return true;
  } catch {
    return false;
  }
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export class WardLiteJudge implements Judge {
  readonly name = "Ward Lite";

  async judge(chat: Chat, { onProgress }: { self: string | null; onProgress?: (d: number, t: number) => void }) {
    const { tok, model, threshold } = await loadLite();
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
        const hostile = hurtful >= threshold || danger >= threshold;
        out.set(m.id, {
          hostile,
          severity: danger >= threshold ? 3 : hurtful >= 0.8 ? 2 : hurtful >= threshold ? 1 : 0,
          categories: [],
          why: danger >= threshold ? "Reads as dangerous: a threat, pressure, or telling someone to hurt themselves." : hostile ? "Reads as hurtful." : undefined,
          model: this.name,
          authority: "raise-only",
        });
      });
      onProgress?.(Math.min(i + 16, msgs.length), msgs.length);
    }
    return out;
  }
}
