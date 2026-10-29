// The scorecard: does Ward catch abuse that an English-first safety model misses?
// Each system sees the same balanced sample from three public datasets and says, per message,
// "abusive or not". Results go to eval/results/scorecard.{json,md}.
//
//   pnpm eval                          200 per language (the published numbers)
//   pnpm eval -- 40                    a quick run
//   pnpm eval -- --only="Ward Lite"    rerun named systems; keep the rest from the last run
//
// Ward Lite's predictions come from train/score.py (it runs the exported ONNX model), written to
// results/ward-lite.preds.json; run that first.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GemmaJudge, PackMatcher, ShieldGemmaJudge, type Chat } from "../packages/engine/src/index.ts";
import { loadSets, type Item } from "./data.ts";

const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 200);
// --only=a,b: rerun just these systems and keep the others' results from the last run.
// --packs-only is kept as shorthand for --only="Slang packs".
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? (process.argv.includes("--packs-only") ? "Slang packs" : null);
const ONLY = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const sets = await loadSets(N);
const packs = new PackMatcher();
const shield = new ShieldGemmaJudge();

type System = { name: string; about: string; run: (items: Item[]) => Promise<boolean[]> };

function asChat(items: Item[]): Chat {
  return {
    source: "paste",
    events: [],
    participants: items.map((_, i) => `user${i}`),
    messages: items.map((it, i) => ({ id: i, at: null, sender: `user${i}`, text: it.text, media: false })),
  };
}

async function gemma(model: string, items: Item[], batch = 20) {
  const j = new GemmaJudge({ model, batch, context: 0 });
  const got = await j.judge(asChat(items), {
    self: null,
    onProgress: (d, t) => process.stderr.write(`\r  ${model} ${d}/${t}   `),
  });
  process.stderr.write("\n");
  return items.map((_, i) => got.get(i)?.hostile ?? false);
}

const systems: System[] = [
  { name: "Slang packs", about: "Ward's word lists alone: no model, works on any phone", run: async (items) => items.map((i) => packs.match(i.text).some((h) => h.severity >= 1)) },
  {
    name: "ShieldGemma 2B",
    about: "Google's open safety classifier, harassment policy",
    run: async (items) => {
      const out: boolean[] = [];
      for (const [k, i] of items.entries()) {
        out.push(await shield.violates(i.text));
        process.stderr.write(`\r  shieldgemma ${k + 1}/${items.length}   `);
      }
      process.stderr.write("\n");
      return out;
    },
  },
  { name: "Gemma 4 E4B", about: "Ward's judge prompt, one message at a time, no chat context (the computer tier)", run: (items) => gemma("gemma4:e4b", items) },
  { name: "Gemma 4 E2B", about: "The same prompt on the phone-sized Gemma 4, 5 messages per request (it loses track of longer lists); scored through Ollama, on a phone it runs through LiteRT-LM", run: (items) => gemma("gemma4:e2b", items, 5) },
  {
    name: "Ward Lite",
    about: "The small classifier distilled for any phone (train/), int8 ONNX, flagged when hurtful or dangerous >= 0.5",
    run: async (items) => litePreds(items),
  },
  {
    name: "Phone: packs + Ward Lite",
    about: "What a phone without a big model does: a message counts if the word lists or Ward Lite flag it (Ward Lite can only add)",
    run: async (items) => {
      const lite = litePreds(items);
      return items.map((it, i) => lite[i]! || packs.match(it.text).some((h) => h.severity >= 1));
    },
  },
];

let liteFile: Record<string, Record<string, boolean>> | null = null;
function litePreds(items: Item[]): boolean[] {
  liteFile ??= JSON.parse(readFileSync(new URL("./results/ward-lite.preds.json", import.meta.url), "utf8"));
  return items.map((it) => {
    const p = liteFile![it.set]?.[it.text];
    if (p === undefined) throw new Error("ward-lite.preds.json is from a different sample: rerun train/score.py");
    return p;
  });
}

function score(pred: boolean[], items: Item[]) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  pred.forEach((p, i) => {
    const b = items[i]!.bad;
    if (p && b) tp++;
    else if (p) fp++;
    else if (b) fn++;
    else tn++;
  });
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  return { tp, fp, fn, tn, precision, recall, f1, accuracy: (tp + tn) / items.length };
}

const results: Record<string, Record<string, ReturnType<typeof score> & { seconds: number }>> = {};
const raw: Record<string, Record<string, boolean[]>> = {};
const prev = ONLY ? JSON.parse(readFileSync(new URL("./results/scorecard.raw.json", import.meta.url), "utf8")) : null;
for (const [set, items] of Object.entries(sets)) {
  results[set] = {};
  raw[set] = {};
  for (const sys of systems) {
    if (ONLY && !ONLY.has(sys.name)) {
      const pred = prev.raw[set]?.[sys.name] as boolean[] | undefined;
      if (!pred) continue;
      raw[set]![sys.name] = pred;
      results[set]![sys.name] = { ...score(pred, items), seconds: 0 };
      continue;
    }
    console.error(`${set} / ${sys.name}`);
    const t = Date.now();
    const pred = await sys.run(items);
    raw[set]![sys.name] = pred;
    results[set]![sys.name] = { ...score(pred, items), seconds: (Date.now() - t) / 1000 };
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const md = [
  `# Ward scorecard`,
  ``,
  `${N} messages per language, half abusive and half not by each dataset's own labels, same sample for every system (seed 26).`,
  `Run on ${new Date().toISOString().slice(0, 10)}, Apple M-series laptop, Ollama, nothing sent off the machine.`,
  ``,
  `Recall is the share of abusive messages caught. Precision is the share of flags that were right.`,
  ``,
  ...Object.entries(results).flatMap(([set, r]) => [
    `## ${set}`,
    ``,
    `| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |`,
    `| --- | --- | --- | --- | --- |`,
    ...Object.entries(r).map(([s, v]) => `| ${s} | ${pct(v.recall)} | ${pct(v.precision)} | ${v.f1.toFixed(2)} | ${pct(v.accuracy)} |`),
    ``,
  ]),
  `## Systems`,
  ``,
  ...systems.map((s) => `- **${s.name}**: ${s.about}`),
  ``,
  `## Datasets`,
  ``,
  `- Roman Urdu: [community-datasets/roman_urdu_hate_speech](https://huggingface.co/datasets/community-datasets/roman_urdu_hate_speech), Coarse_Grained validation split (Abusive/Offensive vs Normal).`,
  `- Bangla: [yamin401533/bangla-cyberbullying-blindspot](https://huggingface.co/datasets/yamin401533/bangla-cyberbullying-blindspot), test split, labels Personal and Gender abusive vs Non-abusive (political and geopolitical rants left out, as they aren't aimed at a person).`,
  `- English: [surrey-nlp/Cyberbullying-Detection-CB1](https://huggingface.co/datasets/surrey-nlp/Cyberbullying-Detection-CB1), test split, classes not_cyberbullying vs gender and other_cyberbullying.`,
  ``,
  `These are public social-media datasets with noisy labels, not children's chats. They test language coverage; the pattern engine (pile-ons, repeated targeting, ghost accounts) is tested on the chats in packages/engine/fixtures.`,
].join("\n");

mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
writeFileSync(new URL("./results/scorecard.json", import.meta.url), JSON.stringify({ n: N, results }, null, 2));
writeFileSync(new URL("./results/scorecard.raw.json", import.meta.url), JSON.stringify({ sets, raw }));
writeFileSync(new URL("./results/scorecard.md", import.meta.url), md + "\n");
console.log(md);
