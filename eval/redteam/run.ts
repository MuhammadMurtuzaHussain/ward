// The red-team run: scores Ward on the hand-written red-team set (eval/redteam/*.jsonl) the same
// way eval/run.ts scores the scorecard, per language and per trick, and writes
// eval/results/redteam.{json,md} and docs/REDTEAM.md. Report only: nothing here tunes the engine.
//
//   pnpm redteam:lite        Ward Lite's scores (train/.venv; rerun when the model or the set changes)
//   pnpm redteam             word lists, Ward Lite, and the phone's combination
//   pnpm redteam -- --gemma  also Gemma 4 E4B through Ollama (kept for later runs while the set is unchanged)
//   pnpm redteam -- --packs-only   skip Ward Lite (no Python environment)

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { GemmaJudge, PackMatcher, type Chat } from "../../packages/engine/src/index.ts";
import { CLASSES, CLASS_NAMES, LANGS, loadRedteam, type Lang, type RedClass, type RedItem } from "./set.ts";

const GEMMA = process.argv.includes("--gemma");
const PACKS_ONLY = process.argv.includes("--packs-only");

const items = loadRedteam();
const packs = new PackMatcher();

const RESULTS = new URL("../results/", import.meta.url);
const OUT_JSON = new URL("redteam.json", RESULTS);
const LITE_PREDS = new URL("redteam-lite.preds.json", RESULTS);
const LITE_DIR = new URL("../../apps/web/public/models/ward-lite/", import.meta.url);
const DOC = new URL("../../docs/REDTEAM.md", import.meta.url);

/** One system's call on one message. */
interface Pred {
  flag: boolean;
  /** Marked dangerous (severity 3, or Ward Lite's danger output). */
  danger: boolean;
  /** Why, in a few words, for the failure lists. */
  why: string;
  /** The model skipped this message; counted as not flagged, as the app and the scorecard do. */
  noAnswer?: boolean;
}
interface System {
  name: string;
  about: string;
  run: () => Promise<Pred[]>;
}

// ---- Word lists: exactly what eval/run.ts counts (any hit of severity 1 or more).
function packPreds(): Pred[] {
  return items.map((it) => {
    const hits = packs.match(it.text).filter((h) => h.severity >= 1);
    return {
      flag: hits.length > 0,
      danger: hits.some((h) => h.severity >= 3),
      why: hits.length ? `word list: ${hits.map((h) => `"${h.term}" (${h.category}, ${h.severity})`).join(", ")}` : "no word-list hit",
    };
  });
}

// ---- Ward Lite: raw scores from score-lite.py, thresholds applied the way apps/web/src/lib/lite.ts does.
interface LiteMeta {
  threshold: number;
  thresholds?: Partial<Record<"bengali" | "devanagari" | "latin", number>>;
}
function script(text: string): "bengali" | "devanagari" | "latin" {
  if (/[ঀ-৿]/.test(text)) return "bengali";
  if (/[ऀ-ॿ]/.test(text)) return "devanagari";
  return "latin";
}
let liteCache: Pred[] | null = null;
function litePreds(): Pred[] {
  if (liteCache) return liteCache;
  const again = "run `pnpm redteam:lite` first (or pass --packs-only)";
  if (!existsSync(LITE_PREDS)) throw new Error(`No Ward Lite scores for the red-team set: ${again}.`);
  const file = JSON.parse(readFileSync(LITE_PREDS, "utf8")) as { model_sha256: string; probs: Record<string, [number, number]> };
  const sha = createHash("sha256").update(readFileSync(new URL("onnx/model_quantized.onnx", LITE_DIR))).digest("hex");
  if (file.model_sha256 !== sha) throw new Error(`Ward Lite's scores are from a different model: ${again}.`);
  const meta = JSON.parse(readFileSync(new URL("ward-lite.json", LITE_DIR), "utf8")) as LiteMeta;
  liteCache = items.map((it) => {
    const p = file.probs[it.text];
    if (!p) throw new Error(`Ward Lite's scores are from an older red-team set (no score for ${it.id}): ${again}.`);
    const [hurt, danger] = p;
    const t = meta.thresholds?.[script(it.text)] ?? meta.threshold;
    const isDanger = danger >= meta.threshold;
    return { flag: hurt >= t || isDanger, danger: isDanger, why: `Ward Lite: hurtful ${hurt.toFixed(2)} (flags at ${t}), danger ${danger.toFixed(2)} (at ${meta.threshold})` };
  });
  return liteCache;
}

// ---- Gemma 4 E4B, the computer tier: the same call as eval/run.ts (no chat context).
async function gemmaPreds(): Promise<Pred[]> {
  const chat: Chat = {
    source: "paste",
    events: [],
    participants: items.map((_, i) => `user${i}`),
    messages: items.map((it, i) => ({ id: i, at: null, sender: `user${i}`, text: it.text, media: false })),
  };
  const got = await new GemmaJudge({ model: "gemma4:e4b", batch: 20, context: 0 }).judge(chat, {
    self: null,
    onProgress: (d, t) => process.stderr.write(`\r  gemma4:e4b ${d}/${t}   `),
  });
  process.stderr.write("\n");
  return items.map((_, i) => {
    const j = got.get(i);
    if (!j) return { flag: false, danger: false, why: "Gemma skipped this message (no verdict)", noAnswer: true };
    return { flag: j.hostile, danger: j.severity >= 3, why: `Gemma: ${j.why ?? (j.hostile ? "hostile" : "fine")}` };
  });
}

const GEMMA_NAME = "Gemma 4 E4B";
const prev = existsSync(OUT_JSON) ? (JSON.parse(readFileSync(OUT_JSON, "utf8")) as { items?: { text: string; preds: Record<string, Pred> }[] }) : null;
function cachedGemma(): Pred[] | null {
  const byText = new Map((prev?.items ?? []).map((i) => [i.text, i.preds[GEMMA_NAME]]));
  const out = items.map((it) => byText.get(it.text));
  return out.every((p) => p) ? (out as Pred[]) : null;
}

const systems: System[] = [
  { name: "Slang packs", about: "Ward's word lists alone: no model, works on any phone", run: async () => packPreds() },
];
if (!PACKS_ONLY) {
  systems.push(
    { name: "Ward Lite", about: "The small classifier (train/), int8 ONNX, flagged when hurtful or dangerous passes its threshold, as in the app", run: async () => litePreds() },
    {
      name: "Phone: packs + Ward Lite",
      about: "What a phone without a big model does: flagged if the word lists or Ward Lite flag it (Ward Lite can only add)",
      run: async () => {
        const p = packPreds();
        const l = litePreds();
        return items.map((_, i) => ({
          flag: p[i]!.flag || l[i]!.flag,
          danger: p[i]!.danger || l[i]!.danger,
          why: [p[i]!.flag || !l[i]!.flag ? p[i]!.why : "", l[i]!.flag || !p[i]!.flag ? l[i]!.why : ""].filter(Boolean).join("; "),
        }));
      },
    },
  );
}
const cached = GEMMA ? null : cachedGemma();
if (GEMMA || cached) {
  systems.push({
    name: GEMMA_NAME,
    about: `Ward's judge prompt on a computer, through Ollama, no chat context${GEMMA ? "" : " (kept from an earlier run with --gemma on this same set)"}`,
    run: async () => cached ?? gemmaPreds(),
  });
}

const preds: Record<string, Pred[]> = {};
for (const s of systems) {
  console.error(s.name);
  preds[s.name] = await s.run();
}

// ---- Scoring
interface Tally {
  hurtful: number;
  caught: number;
  harmless: number;
  falseAlarms: number;
  dangerous: number;
  dangerCaught: number;
  /** Harmless messages marked dangerous: in the app, one of these makes a whole chat "urgent". */
  falseDanger: number;
}
function tally(sys: string, pick: (it: RedItem) => boolean): Tally {
  const t: Tally = { hurtful: 0, caught: 0, harmless: 0, falseAlarms: 0, dangerous: 0, dangerCaught: 0, falseDanger: 0 };
  items.forEach((it, i) => {
    if (!pick(it)) return;
    const p = preds[sys]![i]!;
    if (it.severity > 0) {
      t.hurtful++;
      if (p.flag) t.caught++;
    } else {
      t.harmless++;
      if (p.flag) t.falseAlarms++;
      if (p.danger) t.falseDanger++;
    }
    if (it.severity === 3) {
      t.dangerous++;
      if (p.danger) t.dangerCaught++;
    }
  });
  return t;
}

const langs = Object.keys(LANGS) as Lang[];
const names = systems.map((s) => s.name);
const byLang = Object.fromEntries(names.map((s) => [s, Object.fromEntries([...langs.map((l) => [l, tally(s, (it) => it.lang === l)]), ["all", tally(s, () => true)]])]));
const byClass = Object.fromEntries(names.map((s) => [s, Object.fromEntries(CLASSES.map((c) => [c, tally(s, (it) => it.class === c)]))]));
const usedCategories = [...new Set(items.flatMap((it) => (it.category ? [it.category] : [])))];
const byCategory = Object.fromEntries(names.map((s) => [s, Object.fromEntries(usedCategories.map((c) => [c, tally(s, (it) => it.category === c)]))]));
const PHONE = names.includes("Phone: packs + Ward Lite") ? "Phone: packs + Ward Lite" : "Slang packs";
const byLangClass = Object.fromEntries(langs.map((l) => [l, Object.fromEntries(CLASSES.map((c) => [c, tally(PHONE, (it) => it.lang === l && it.class === c)]))]));

// ---- Writing
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
const frac = (a: number, b: number) => (b ? `${a}/${b} (${pct(a, b)})` : "–");
const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
const head = (cells: string[]) => [row(cells), row(cells.map(() => "---"))];
const date = new Date().toISOString().slice(0, 10);

function table(rows: [string, (s: string) => string][]): string[] {
  return [...head(["", ...names]), ...rows.map(([label, cell]) => row([label, ...names.map(cell)]))];
}
const langRows = (f: (t: Tally) => string): [string, (s: string) => string][] => [
  ...langs.map((l): [string, (s: string) => string] => [LANGS[l], (s) => f(byLang[s]![l]!)]),
  ["**All**", (s) => `**${f(byLang[s]!.all!)}**`],
];
const classRows = (f: (t: Tally) => string, only = CLASSES as readonly RedClass[]): [string, (s: string) => string][] =>
  only.map((c) => [CLASS_NAMES[c], (s) => f(byClass[s]![c]!)]);

/** Misses and false alarms for one system, round-robin over tricks so a sample shows variety. */
function failures(sys: string, lang: Lang | null, kind: "miss" | "false", limit = Infinity) {
  const all = items
    .map((it, i) => ({ it, p: preds[sys]![i]! }))
    .filter(({ it, p }) => (lang === null || it.lang === lang) && (kind === "miss" ? it.severity > 0 && !p.flag : it.severity === 0 && p.flag));
  const queues = CLASSES.map((c) => all.filter((f) => f.it.class === c));
  const out: typeof all = [];
  while (out.length < Math.min(limit, all.length)) for (const q of queues) if (q.length && out.length < limit) out.push(q.shift()!);
  return { total: all.length, shown: out };
}
const failLine = ({ it, p }: { it: RedItem; p: Pred }) =>
  `- \`${it.id}\` ${it.class}/${it.kind}${it.severity ? `, severity ${it.severity} ${it.category}` : ""}: “${it.text}”. *Tests:* ${it.note}. *Why:* ${p.why}.`;

const counts = [
  ...head(["", ...CLASSES.map((c) => c), "Total"]),
  ...langs.map((l) => {
    const mine = items.filter((it) => it.lang === l);
    return row([LANGS[l], ...CLASSES.map((c) => {
      const inC = mine.filter((it) => it.class === c);
      return `${inC.filter((it) => it.severity > 0).length} + ${inC.filter((it) => it.severity === 0).length}`;
    }), `${mine.length}`]);
  }),
  row(["**All**", ...CLASSES.map((c) => {
    const inC = items.filter((it) => it.class === c);
    return `**${inC.filter((it) => it.severity > 0).length} + ${inC.filter((it) => it.severity === 0).length}**`;
  }), `**${items.length}**`]),
];

const ANALYSIS_START = "<!-- analysis: written by hand, kept by the runner -->";
const ANALYSIS_END = "<!-- /analysis -->";
const oldDoc = existsSync(DOC) ? readFileSync(DOC, "utf8") : "";
const analysis = oldDoc.includes(ANALYSIS_START) && oldDoc.includes(ANALYSIS_END)
  ? oldDoc.slice(oldDoc.indexOf(ANALYSIS_START) + ANALYSIS_START.length, oldDoc.indexOf(ANALYSIS_END)).trim()
  : "_Not written yet: after a run, describe the failure classes here. The runner keeps this section._";

const systemList = systems.map((s) => {
  const skipped = preds[s.name]!.map((p, i) => ({ p, it: items[i]! })).filter(({ p }) => p.noAnswer);
  const note = skipped.length
    ? ` **It returned no verdict for ${skipped.length} of ${items.length} messages** (${skipped.filter(({ it }) => it.severity > 0).length} of them hurtful), even though the prompt asks for every one; like the app and the scorecard, a missing verdict counts as not flagged.`
    : "";
  return `- **${s.name}**: ${s.about}.${note}`;
});
const notRun = [
  ...(PACKS_ONLY ? ["Ward Lite (run without --packs-only after `pnpm redteam:lite`)"] : []),
  ...(names.includes(GEMMA_NAME) ? [] : ["Gemma 4 E4B (pass --gemma with Ollama running)"]),
];

const doc = [
  `# Ward red-team set`,
  ``,
  `Messages written to slip past Ward (disguised insults, coded slang, sarcasm, polite exclusion, indirect threats) and harmless look-alikes written to trip it (banter between friends, reclaimed words, a child quoting abuse to ask for help, game trash talk), in every language Ward reads. Rerun on every release next to the [scorecard](../eval/results/scorecard.md). Failures are published on purpose: they say where Ward is weak today.`,
  ``,
  `Last run: ${date}. Regenerate with \`pnpm redteam:lite && pnpm redteam\` (add \`-- --gemma\` with Ollama running). Everything below except "What fails, and why" is written by the runner, [eval/redteam/run.ts](../eval/redteam/run.ts); every miss and false alarm is in [eval/results/redteam.md](../eval/results/redteam.md).`,
  ``,
  `## Method`,
  ``,
  `- **The set.** ${items.length} short messages in [eval/redteam/](../eval/redteam/), one JSONL file per language, written by hand for this purpose. All synthetic: no real children's messages, no scraped chats. Each has the engine's severity (0 harmless, 1 rude, 2 bullying, 3 dangerous), its category, the trick it tests and a note. Self-harm and sexual items stay non-graphic (no methods; image pressure only as "send pics"). The Roman Urdu, Hinglish and Bangla items still need review by native speakers of each; labels are one author's judgement.`,
  `- **Never trained on.** \`eval/redteam/leak.test.ts\` (part of \`pnpm test\`) fails if any red-team text is in Ward Lite's training data (\`train/data\`, when present) or its scripts, and if any code in \`train/\` opens this folder. See [train/DATA.md](../train/DATA.md).`,
  `- **Not tuned against.** Word lists and Ward Lite were not changed to pass this set. A fix should come from new, different examples or pack entries justified on their own, and the set should gain new items after each fix, or these numbers stop meaning anything.`,
  `- **Scoring, as in the scorecard.** A message counts as flagged when the system calls it hurtful at all: any word-list hit of severity 1 or more, Ward Lite over its threshold. *Caught* is the share of hurtful messages flagged; *false alarms* is the share of harmless look-alikes flagged; *dangerous* is the share of severity-3 messages marked dangerous (a severity-3 word-list hit, or Ward Lite's danger output). Each message is read alone, without the chat around it, which is harder than what Ward sees in a real chat.`,
  `- **Small numbers.** A language has 14 to 36 messages on each side and a language-and-trick cell as few as 2: read them as where to look, not as rates.`,
  `- **Each system alone.** As in the scorecard, the Gemma row is Gemma by itself. In the app, the computer tier also keeps a severity-3 word-list hit visible (at severity 2) when Gemma reads it as a joke.`,
  ``,
  `Systems:`,
  ``,
  ...systemList,
  ...(notRun.length ? [``, `Not in this run: ${notRun.join("; ")}.`] : []),
  ``,
  `### What's in the set`,
  ``,
  `Hurtful + harmless messages per trick:`,
  ``,
  ...counts,
  ``,
  `## Results by language`,
  ``,
  `### Hurtful messages caught`,
  ``,
  ...table(langRows((t) => frac(t.caught, t.hurtful))),
  ``,
  `### Harmless look-alikes flagged (false alarms)`,
  ``,
  ...table(langRows((t) => frac(t.falseAlarms, t.harmless))),
  ``,
  `### Dangerous messages (severity 3) marked dangerous`,
  ``,
  ...table(langRows((t) => frac(t.dangerCaught, t.dangerous))),
  ``,
  `### Harmless messages marked dangerous`,
  ``,
  `In the app, one message from someone else marked dangerous makes the whole chat "urgent".`,
  ``,
  ...table(langRows((t) => frac(t.falseDanger, t.harmless))),
  ``,
  `## Results by trick (all languages)`,
  ``,
  `### Hurtful messages caught`,
  ``,
  ...table(classRows((t) => frac(t.caught, t.hurtful), CLASSES.filter((c) => c !== "hard-negative"))),
  ``,
  `### Harmless look-alikes flagged`,
  ``,
  ...table(classRows((t) => frac(t.falseAlarms, t.harmless))),
  ``,
  `### By the engine's category (hurtful messages caught)`,
  ``,
  ...table(usedCategories.map((c) => [c, (s: string) => frac(byCategory[s]![c]!.caught, byCategory[s]![c]!.hurtful)])),
  ``,
  `## ${PHONE}, by language and trick`,
  ``,
  `Each cell: hurtful caught, then harmless flagged.`,
  ``,
  ...head(["", ...langs.map((l) => LANGS[l])]),
  ...CLASSES.map((c) => row([c, ...langs.map((l) => {
    const t = byLangClass[l]![c]!;
    return `${t.hurtful ? `${t.caught}/${t.hurtful}` : "–"} · ${t.falseAlarms}/${t.harmless}`;
  })])),
  ``,
  `## What fails, and why`,
  ``,
  ANALYSIS_START,
  analysis,
  ANALYSIS_END,
  ``,
  `## Failures, a sample per language (${PHONE})`,
  ``,
  `Up to six misses and four false alarms per language, spread across tricks. *Tests* is what the item was written to test; *why* is what the systems said.`,
  ``,
  ...langs.flatMap((l) => {
    const m = failures(PHONE, l, "miss", 6);
    const f = failures(PHONE, l, "false", 4);
    return [
      `### ${LANGS[l]}`,
      ``,
      `Missed (${m.shown.length} of ${m.total}):`,
      ``,
      ...(m.shown.length ? m.shown.map(failLine) : ["- none"]),
      ``,
      `False alarms (${f.shown.length} of ${f.total}):`,
      ``,
      ...(f.shown.length ? f.shown.map(failLine) : ["- none"]),
      ``,
    ];
  }),
].join("\n");

const full = [
  `# Red-team run, every failure`,
  ``,
  `${date}. ${items.length} messages. Summary and method: [docs/REDTEAM.md](../../docs/REDTEAM.md).`,
  ``,
  ...names.flatMap((s) => {
    const m = failures(s, null, "miss");
    const f = failures(s, null, "false");
    return [`## ${s}`, ``, `### Missed (${m.total})`, ``, ...m.shown.map(failLine), ``, `### False alarms (${f.total})`, ``, ...f.shown.map(failLine), ``];
  }),
].join("\n");

mkdirSync(RESULTS, { recursive: true });
writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      date,
      n: items.length,
      systems: systems.map((s) => ({ name: s.name, about: s.about })),
      byLang,
      byClass,
      byCategory,
      items: items.map((it, i) => ({ id: it.id, lang: it.lang, class: it.class, severity: it.severity, text: it.text, preds: Object.fromEntries(names.map((s) => [s, preds[s]![i]!])) })),
    },
    null,
    1,
  ) + "\n",
);
writeFileSync(new URL("redteam.md", RESULTS), full + "\n");
writeFileSync(DOC, doc + "\n");

console.log(`Red-team set: ${items.length} messages`);
for (const s of names) {
  const a = byLang[s]!.all!;
  console.log(`${s.padEnd(26)} caught ${frac(a.caught, a.hurtful).padEnd(14)} false alarms ${frac(a.falseAlarms, a.harmless).padEnd(14)} dangerous ${frac(a.dangerCaught, a.dangerous).padEnd(13)} harmless marked dangerous ${frac(a.falseDanger, a.harmless)}`);
}
console.log("Wrote eval/results/redteam.json, eval/results/redteam.md and docs/REDTEAM.md");
