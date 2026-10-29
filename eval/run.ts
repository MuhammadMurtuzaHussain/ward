// The scorecard: does Ward catch abuse that an English-first safety model misses?
// Each system sees the same balanced sample from three public datasets and says, per message,
// "abusive or not". Results go to eval/results/scorecard.{json,md}.
//
//   pnpm eval            200 per language (the published numbers)
//   pnpm eval -- 40      a quick run

import { mkdirSync, writeFileSync } from "node:fs";
import { GemmaJudge, PackMatcher, ShieldGemmaJudge, type Chat } from "../packages/engine/src/index.ts";
import { loadSets, type Item } from "./data.ts";

const N = Number(process.argv[2] ?? 200);
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

async function gemma(model: string, items: Item[]) {
  const j = new GemmaJudge({ model, batch: 20, context: 0 });
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
  { name: "Gemma 4 E4B", about: "Ward's judge prompt, one message at a time, no chat context", run: (items) => gemma("gemma4:e4b", items) },
];

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
for (const [set, items] of Object.entries(sets)) {
  results[set] = {};
  raw[set] = {};
  for (const sys of systems) {
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
