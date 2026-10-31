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

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GemmaJudge, PackMatcher, ShieldGemmaJudge, type Chat } from "../packages/engine/src/index.ts";
import { loadSets, type Item } from "./data.ts";
import { bootstrap, wilson } from "./stats.ts";

const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 200);
// --only=a,b: rerun just these systems and keep the others' results from the last run.
// --packs-only is kept as shorthand for --only="Slang packs".
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? (process.argv.includes("--packs-only") ? "Slang packs" : null);
const ONLY = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const sets = await loadSets(N);
const packs = new PackMatcher();
const shield = new ShieldGemmaJudge();

type System = { name: string; about: string; run: (items: Item[]) => Promise<boolean[]> };

/** Messages a model returned no verdict for, even after being asked again: counted as not flagged. */
const skipped: Record<string, number> = {};

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
  skipped[model] = (skipped[model] ?? 0) + items.filter((_, i) => !got.has(i)).length;
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
  { name: "Gemma 4 E4B", about: "Ward's judge prompt (the computer tier's model), 20 unrelated messages per request with no chat context around them; any it skips are asked again in groups of 5", run: (items) => gemma("gemma4:e4b", items) },
  { name: "Gemma 4 E2B", about: "The same prompt on the phone-sized Gemma 4, 5 messages per request (it loses track of longer lists), skipped ones asked again; scored through Ollama, on a phone it runs through LiteRT-LM. Ollama gives it no structured output here, so it answers in plain JSON, and one malformed entry loses its whole request", run: (items) => gemma("gemma4:e2b", items, 5) },
  {
    name: "Ward Lite",
    about: "The small classifier distilled for any phone (train/), int8 ONNX, flagged when hurtful or dangerous >= 0.5. Trained on the train splits of the Roman Urdu and English datasets below (never their test messages), so those two rows are in distribution; its Bangla came from other datasets",
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

/** 95% intervals: Wilson for recall and precision, a bootstrap over the messages for F1. */
function intervals(pred: boolean[], items: Item[]) {
  const s = score(pred, items);
  const pairs = pred.map((p, i) => [p, items[i]!.bad] as const);
  const f1 = bootstrap(pairs, (xs) => {
    let tp = 0, fp = 0, fn = 0;
    for (const [p, b] of xs) if (p && b) tp++; else if (p) fp++; else if (b) fn++;
    return (2 * tp) / Math.max(1, 2 * tp + fp + fn);
  });
  return { recallCI: wilson(s.tp, s.tp + s.fn), precisionCI: wilson(s.tp, s.tp + s.fp), f1CI: f1 };
}

type Row = ReturnType<typeof score> & ReturnType<typeof intervals> & { seconds: number; ran: string; commit?: string; skipped?: number };

/** The last commit that changed the engine (word lists, Gemma's prompt), which is what a row measures. */
function engineCommit(): string | undefined {
  try {
    const dirty = execSync("git status --porcelain -- packages/engine", { encoding: "utf8" }).trim() !== "";
    return execSync("git log -1 --format=%h -- packages/engine", { encoding: "utf8" }).trim() + (dirty ? "+changes" : "");
  } catch {
    return undefined;
  }
}
const commit = engineCommit();

const today = new Date().toISOString().slice(0, 10);
const results: Record<string, Record<string, Row>> = {};
const raw: Record<string, Record<string, boolean[]>> = {};
const prev = ONLY ? JSON.parse(readFileSync(new URL("./results/scorecard.raw.json", import.meta.url), "utf8")) : null;
// Kept rows keep their own run date, time and skip count from the last scorecard.
const prevRows = ONLY ? (JSON.parse(readFileSync(new URL("./results/scorecard.json", import.meta.url), "utf8")).results as Record<string, Record<string, Partial<Row>>>) : {};
for (const [set, items] of Object.entries(sets)) {
  results[set] = {};
  raw[set] = {};
  for (const sys of systems) {
    if (ONLY && !ONLY.has(sys.name)) {
      const pred = prev.raw[set]?.[sys.name] as boolean[] | undefined;
      if (!pred) continue;
      raw[set]![sys.name] = pred;
      const old = prevRows[set]?.[sys.name] ?? {};
      results[set]![sys.name] = { ...score(pred, items), ...intervals(pred, items), seconds: old.seconds ?? 0, ran: old.ran ?? "unknown", ...(old.commit ? { commit: old.commit } : {}), ...(old.skipped !== undefined ? { skipped: old.skipped } : {}) };
      continue;
    }
    console.error(`${set} / ${sys.name}`);
    const t = Date.now();
    const before = { ...skipped };
    const pred = await sys.run(items);
    raw[set]![sys.name] = pred;
    const model = sys.name.startsWith("Gemma 4 ") ? `gemma4:${sys.name.slice(8).toLowerCase()}` : null;
    results[set]![sys.name] = {
      ...score(pred, items),
      ...intervals(pred, items),
      seconds: (Date.now() - t) / 1000,
      ran: today,
      ...(commit ? { commit } : {}),
      ...(model ? { skipped: (skipped[model] ?? 0) - (before[model] ?? 0) } : {}),
    };
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const ci = (x: number, [lo, hi]: [number, number]) => `${pct(x)} (${Math.round(lo * 100)}–${Math.round(hi * 100)})`;
const f1ci = (x: number, [lo, hi]: [number, number]) => `${x.toFixed(2)} (${lo.toFixed(2)}–${hi.toFixed(2)})`;
const IN_DIST = new Set(["Roman Urdu/Ward Lite", "Roman Urdu/Phone: packs + Ward Lite", "English/Ward Lite", "English/Phone: packs + Ward Lite"]);
const md = [
  `# Ward scorecard`,
  ``,
  `${N} messages per language, half abusive and half not by each dataset's own labels, same sample for every system (seed 26).`,
  `Apple M-series laptop, Ollama, nothing sent off the machine. Each row says when it was run, and on which engine commit (the word lists and Gemma's prompt): \`pnpm eval -- --only=...\` reruns some systems and keeps the others.`,
  ``,
  `Recall is the share of abusive messages caught. Precision is the share of flags that were right. In brackets: the 95% interval (Wilson for recall and precision, 2,000 bootstrap resamples of the messages for F1). With 100 messages on each side, two systems whose intervals overlap may not really differ.`,
  ``,
  `† In distribution: Ward Lite was trained on the train split of the same dataset (never these test messages). The other systems never saw it. Bangla is the out-of-distribution check for Ward Lite.`,
  ``,
  ...Object.entries(results).flatMap(([set, r]) => [
    `## ${set}`,
    ``,
    `| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy | Run |`,
    `| --- | --- | --- | --- | --- | --- |`,
    ...Object.entries(r).map(
      ([s, v]) =>
        `| ${s}${IN_DIST.has(`${set}/${s}`) ? " †" : ""} | ${ci(v.recall, v.recallCI)} | ${ci(v.precision, v.precisionCI)} | ${f1ci(v.f1, v.f1CI)} | ${pct(v.accuracy)} | ${v.ran}${v.commit ? ` \`${v.commit}\`` : ""}${v.skipped ? `, ${v.skipped} unanswered` : ""} |`,
    ),
    ``,
  ]),
  `## Systems`,
  ``,
  ...systems.map((s) => `- **${s.name}**: ${s.about}`),
  ``,
  `"Unanswered" counts messages a Gemma model returned no verdict for even after being asked again; they count as not flagged, as in the app.`,
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
