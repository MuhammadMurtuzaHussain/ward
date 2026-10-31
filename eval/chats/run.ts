// The chat-level benchmark: runs the whole engine (word lists, context rules, pattern engine) on
// each labelled chat in eval/chats/, per tier, and compares the level it reaches with the label.
// Writes eval/results/chats.{json,md}. Report only: nothing here tunes the engine.
//
//   pnpm eval:chats:lite             Ward Lite's scores (rerun when the model or the set changes)
//   pnpm eval:chats                  word lists and the phone tier; the computer tier from the last --gemma run
//   pnpm eval:chats -- --gemma       also asks Gemma 4 E4B through Ollama again
//
// Gemma's per-message judgements are kept in chats.json, so a rerun without --gemma still runs
// today's engine on them: an engine change is measured without asking Gemma again.

import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { analyze, GemmaJudge, type Analysis, type Chat, type Judge, type Level, type ModelJudgement } from "../../packages/engine/src/index.ts";
import { LANGS, LEVELS, SCENARIOS, loadChats, toChat, type Lang, type LabelledChat, type Scenario } from "./set.ts";
import { wilson } from "../stats.ts";

const GEMMA = process.argv.includes("--gemma");
const chats = loadChats();

const RESULTS = new URL("../results/", import.meta.url);
const OUT_JSON = new URL("chats.json", RESULTS);
const LITE_PREDS = new URL("chats-lite.preds.json", RESULTS);
const LITE_DIR = new URL("../../apps/web/public/models/ward-lite/", import.meta.url);

// ---- Ward Lite: raw scores from score-lite.py, turned into judgements exactly as apps/web/src/lib/lite.ts does.
interface LiteMeta {
  threshold: number;
  thresholds?: Partial<Record<"bengali" | "devanagari" | "latin", number>>;
  danger_threshold?: number;
}
function script(text: string): "bengali" | "devanagari" | "latin" {
  if (/[ঀ-৿]/.test(text)) return "bengali";
  if (/[ऀ-ॿ]/.test(text)) return "devanagari";
  return "latin";
}
function liteJudge(): Judge {
  const again = "run `pnpm eval:chats:lite` first";
  if (!existsSync(LITE_PREDS)) throw new Error(`No Ward Lite scores for the chat set: ${again}.`);
  const file = JSON.parse(readFileSync(LITE_PREDS, "utf8")) as { model_sha256: string; probs: Record<string, [number, number]> };
  const sha = createHash("sha256").update(readFileSync(new URL("onnx/model_quantized.onnx", LITE_DIR))).digest("hex");
  if (file.model_sha256 !== sha) throw new Error(`Ward Lite's scores are from a different model: ${again}.`);
  const meta = JSON.parse(readFileSync(new URL("ward-lite.json", LITE_DIR), "utf8")) as LiteMeta;
  return {
    name: "Ward Lite",
    async judge(chat) {
      const out = new Map<number, ModelJudgement>();
      for (const m of chat.messages.filter((m) => !m.media && m.text.trim())) {
        const p = file.probs[m.text];
        if (!p) throw new Error(`Ward Lite's scores are from an older chat set (no score for "${m.text}"): ${again}.`);
        const [hurtful, danger] = p;
        const t = meta.thresholds?.[script(m.text)] ?? meta.threshold;
        const isDanger = danger >= (meta.danger_threshold ?? meta.threshold);
        const hostile = hurtful >= t || isDanger;
        out.set(m.id, {
          hostile,
          severity: isDanger ? 3 : hurtful >= 0.8 ? 2 : hurtful >= t ? 1 : 0,
          categories: [],
          why: isDanger ? `danger ${danger.toFixed(2)}` : hostile ? `hurtful ${hurtful.toFixed(2)}` : undefined,
          model: "Ward Lite",
          authority: "raise-only",
        });
      }
      return out;
    },
  };
}

// ---- Gemma 4 E4B, the computer tier, called the way apps/web/src/lib/run.ts calls it (16 per
// request, the 5 messages before as context). Judgements are cached per chat.
type GemmaCache = Record<string, { hash: string; ran: string; judgements: [number, ModelJudgement][] }>;
const hash = (c: LabelledChat) => createHash("sha256").update(JSON.stringify([c.self, c.messages])).digest("hex").slice(0, 16);
const prev = existsSync(OUT_JSON) ? (JSON.parse(readFileSync(OUT_JSON, "utf8")) as { gemma?: GemmaCache }) : null;
const gemmaCache: GemmaCache = {};
const today = new Date().toISOString().slice(0, 10);

async function gemmaJudgements(c: LabelledChat, chat: Chat): Promise<Map<number, ModelJudgement> | null> {
  const old = prev?.gemma?.[c.id];
  if (!GEMMA) {
    if (!old || old.hash !== hash(c)) return null;
    gemmaCache[c.id] = old;
    return new Map(old.judgements);
  }
  const got = await new GemmaJudge({ model: "gemma4:e4b", batch: 16 }).judge(chat, { self: c.self });
  gemmaCache[c.id] = { hash: hash(c), ran: today, judgements: [...got] };
  return got;
}
const fixed = (name: string, m: Map<number, ModelJudgement>): Judge => ({ name, judge: async () => m });

// ---- Running every tier on every chat
const TIERS = ["Word lists", "Phone: lists + Ward Lite", "Computer: lists + Gemma 4 E4B"] as const;
type Tier = (typeof TIERS)[number];
interface Outcome {
  level: Level;
  /** A dangerous message from someone else that Ward showed as "not sure" (helplines, no urgent level). */
  unsureDanger: boolean;
  /** The flagged messages, for the failure lists. */
  flagged: string[];
  /** Gemma returned no verdict for these messages, even after being asked again. */
  unanswered?: number;
}
function outcome(c: LabelledChat, a: Analysis, extra: Partial<Outcome> = {}): Outcome {
  const others = a.findings.filter((f) => f.severity > 0 && f.message.sender !== c.self);
  return {
    level: a.level,
    unsureDanger: others.some((f) => f.unsure && f.severity >= 3),
    flagged: others.map((f) => `${f.message.sender}: “${f.message.text}” → severity ${f.severity}${f.unsure ? ", unsure" : ""}${f.atSelf ? "" : ", not at the child"} (${f.why || f.model?.why || "word list"})`),
    ...extra,
  };
}

const lite = liteJudge();
const results: Record<string, Partial<Record<Tier, Outcome>>> = {};
let gemmaRan = 0;
for (const [k, c] of chats.entries()) {
  const chat = toChat(c);
  const r: Partial<Record<Tier, Outcome>> = {};
  r["Word lists"] = outcome(c, await analyze(chat, { self: c.self }));
  r["Phone: lists + Ward Lite"] = outcome(c, await analyze(chat, { self: c.self, judges: [lite] }));
  const g = await gemmaJudgements(c, chat);
  if (g) {
    gemmaRan++;
    const unanswered = chat.messages.filter((m) => !g.has(m.id)).length;
    r["Computer: lists + Gemma 4 E4B"] = outcome(c, await analyze(chat, { self: c.self, judges: [fixed("gemma4:e4b", g)] }), { unanswered });
  }
  results[c.id] = r;
  if (GEMMA) process.stderr.write(`\r  ${k + 1}/${chats.length} chats   `);
}
if (GEMMA) process.stderr.write("\n");
const tiers = TIERS.filter((t) => chats.every((c) => results[c.id]![t]));
if (gemmaRan && gemmaRan < chats.length) console.error(`Gemma judgements cover only ${gemmaRan} of ${chats.length} chats (the set changed): rerun with --gemma.`);

// ---- Scoring
const rank = (l: Level) => LEVELS.indexOf(l as (typeof LEVELS)[number]);
interface Score {
  n: number;
  exact: number;
  /** Confusion matrix: [labelled][predicted]. */
  matrix: Record<Level, Record<Level, number>>;
  urgent: number;
  missedUrgent: number;
  /** Missed urgent chats where Ward at least showed a dangerous message as "not sure". */
  missedButUnsure: number;
  notUrgent: number;
  falseUrgent: number;
  /** Labelled calm, shown as anything else. */
  calm: number;
  calmFlagged: number;
  under: number;
  over: number;
}
function scoreOf(tier: Tier, pick: (c: LabelledChat) => boolean): Score {
  const s: Score = {
    n: 0, exact: 0, urgent: 0, missedUrgent: 0, missedButUnsure: 0, notUrgent: 0, falseUrgent: 0, calm: 0, calmFlagged: 0, under: 0, over: 0,
    matrix: Object.fromEntries(LEVELS.map((a) => [a, Object.fromEntries(LEVELS.map((b) => [b, 0]))])) as Score["matrix"],
  };
  for (const c of chats.filter(pick)) {
    const o = results[c.id]![tier]!;
    s.n++;
    s.matrix[c.level][o.level]++;
    if (o.level === c.level) s.exact++;
    if (rank(o.level) < rank(c.level)) s.under++;
    if (rank(o.level) > rank(c.level)) s.over++;
    if (c.level === "urgent") {
      s.urgent++;
      if (o.level !== "urgent") {
        s.missedUrgent++;
        if (o.unsureDanger) s.missedButUnsure++;
      }
    } else {
      s.notUrgent++;
      if (o.level === "urgent") s.falseUrgent++;
    }
    if (c.level === "calm") {
      s.calm++;
      if (o.level !== "calm") s.calmFlagged++;
    }
  }
  return s;
}
const langs = Object.keys(LANGS) as Lang[];
const all = Object.fromEntries(tiers.map((t) => [t, scoreOf(t, () => true)]));
const byLang = Object.fromEntries(tiers.map((t) => [t, Object.fromEntries(langs.map((l) => [l, scoreOf(t, (c) => c.lang === l)]))]));
const scenarios = Object.keys(SCENARIOS) as Scenario[];
const byScenario = Object.fromEntries(tiers.map((t) => [t, Object.fromEntries(scenarios.map((s) => [s, scoreOf(t, (c) => c.scenario === s)]))]));

// ---- Writing
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
const fracCI = (a: number, b: number) => {
  if (!b) return "–";
  const [lo, hi] = wilson(a, b);
  return `${a}/${b} (${pct(a, b)}, ${Math.round(lo * 100)}–${Math.round(hi * 100)})`;
};
const frac = (a: number, b: number) => (b ? `${a}/${b}` : "–");
const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
const head = (cells: string[]) => [row(cells), row(cells.map(() => "---"))];

let commit = "unknown";
let dirty = false;
try {
  commit = execSync("git log -1 --format=%h -- packages/engine", { encoding: "utf8" }).trim();
  dirty = execSync("git status --porcelain -- packages/engine", { encoding: "utf8" }).trim() !== "";
} catch {}
const gemmaDates = [...new Set(Object.values(gemmaCache).map((g) => g.ran))].sort();

function failures(tier: Tier, kind: "missed" | "false") {
  return chats.filter((c) => {
    const o = results[c.id]![tier]!;
    return kind === "missed" ? c.level === "urgent" && o.level !== "urgent" : c.level !== "urgent" && o.level === "urgent";
  });
}
const chatBlock = (c: LabelledChat, tier: Tier) => {
  const o = results[c.id]![tier]!;
  return [
    `- \`${c.id}\` ${c.scenario}, labelled **${c.level}**, Ward said **${o.level}**${o.unsureDanger ? " (with a dangerous message shown as \"not sure\")" : ""}. ${c.note}.`,
    ...c.messages.map((m) => `  - ${m}`),
    ...(o.flagged.length ? [`  - *Flagged:* ${o.flagged.join("; ")}`] : [`  - *Flagged:* nothing`]),
  ];
};

const md = [
  `# Ward chat-level benchmark`,
  ``,
  `The scorecard and the red-team set score messages one at a time. A child sees one verdict for a whole chat, after Ward's context rules and pattern engine: **calm**, **watch**, **bullying** or **urgent**. This scores that verdict on ${chats.length} hand-written synthetic chats, ${langs.map((l) => `${chats.filter((c) => c.lang === l).length} ${LANGS[l]}`).join(", ")}.`,
  ``,
  `Run ${today} on the engine as of commit \`${commit}\` (the last one to change packages/engine)${dirty ? " (with uncommitted engine changes)" : ""}. Computer-tier judgements from Gemma 4 E4B: ${gemmaDates.length ? gemmaDates.join(", ") : "not run"}. Regenerate with \`pnpm eval:chats:lite && pnpm eval:chats\` (add \`-- --gemma\` with Ollama running to ask Gemma again).`,
  ``,
  `## Method`,
  ``,
  `- **The chats** are in [eval/chats/](../chats/), one JSONL file per language: friends' sweary banter in groups and one to one, ordinary chat, game trash talk, a child or a friend quoting abuse to ask for help, one-off insults, pile-ons, exclusion, one person going after the child again and again, and dangerous messages, including a lone threat in a one-to-one chat with and without a reply. Every chat is synthetic: no real children's messages. Pasted, so no timestamps.`,
  `- **Labels are one author's judgement**, written before any system was run on them, **pending review by native speakers** of Roman Urdu, Hinglish and Bangla. The rule for each level is at the top of [eval/chats/set.ts](../chats/set.ts). The same scenarios recur across languages, so this tests language coverage of known situations more than variety.`,
  `- **Never trained on.** \`eval/redteam/leak.test.ts\` (part of \`pnpm test\`) also fails if a chat message turns up in Ward Lite's training data or scripts, or if code in \`train/\` opens \`eval/chats\`.`,
  `- **Tiers, as the app runs them** ([apps/web/src/lib/run.ts](../../apps/web/src/lib/run.ts)): *word lists* alone (any phone, instantly); a *phone*: word lists plus Ward Lite, raise-only, so a flag only Ward Lite raised needs the chat to back it up (without the optional confirm-only second look by the phone's Gemma 4 E2B); a *computer*: word lists plus Gemma 4 E4B through Ollama, 16 messages per request with the 5 before as context, with authority to clear banter.`,
  `- **Missed urgent** is the share of chats labelled urgent where Ward showed a lower level. Some of those still show a dangerous message as "I'm not sure about one message" with helplines: counted in brackets. **False urgent** is the share of chats labelled anything else where Ward said urgent. Both with the 95% Wilson interval. With 28 urgent chats and 100 others, these are rough.`,
  ``,
  `## Summary`,
  ``,
  ...head(["", ...tiers]),
  row(["Exact level", ...tiers.map((t) => fracCI(all[t]!.exact, all[t]!.n))]),
  row(["**Missed urgent**", ...tiers.map((t) => `**${fracCI(all[t]!.missedUrgent, all[t]!.urgent)}**${all[t]!.missedButUnsure ? ` (${all[t]!.missedButUnsure} shown as "not sure")` : ""}`)]),
  row(["**False urgent**", ...tiers.map((t) => `**${fracCI(all[t]!.falseUrgent, all[t]!.notUrgent)}**`)]),
  row(["Calm chats not shown as calm", ...tiers.map((t) => fracCI(all[t]!.calmFlagged, all[t]!.calm))]),
  row(["Level too low", ...tiers.map((t) => fracCI(all[t]!.under, all[t]!.n))]),
  row(["Level too high", ...tiers.map((t) => fracCI(all[t]!.over, all[t]!.n))]),
  ...(tiers.includes("Computer: lists + Gemma 4 E4B")
    ? [``, `Gemma returned no verdict for ${chats.reduce((s, c) => s + (results[c.id]!["Computer: lists + Gemma 4 E4B"]!.unanswered ?? 0), 0)} of ${chats.reduce((s, c) => s + c.messages.length, 0)} messages even after being asked again; an unanswered message falls back to the word lists.`]
    : [``, `The computer tier wasn't run: pass \`--gemma\` with Ollama running.`]),
  ``,
  `## Confusion matrices`,
  ``,
  `Rows: the label. Columns: what Ward showed.`,
  ``,
  ...tiers.flatMap((t) => [
    `### ${t}`,
    ``,
    ...head(["Labelled \\ Ward said", ...LEVELS]),
    ...LEVELS.map((a) => row([`**${a}**`, ...LEVELS.map((b) => (a === b ? `**${all[t]!.matrix[a][b]}**` : `${all[t]!.matrix[a][b]}`))])),
    ``,
  ]),
  `## By language`,
  ``,
  `Each cell: exact level · missed urgent · false urgent.`,
  ``,
  ...head(["", ...tiers]),
  ...langs.map((l) => row([LANGS[l], ...tiers.map((t) => {
    const s = byLang[t]![l]!;
    return `${frac(s.exact, s.n)} · ${frac(s.missedUrgent, s.urgent)} · ${frac(s.falseUrgent, s.notUrgent)}`;
  })])),
  ``,
  `## By scenario`,
  ``,
  `Chats where Ward showed exactly the labelled level.`,
  ``,
  ...head(["Scenario", "Label", ...tiers]),
  ...scenarios.map((s) => row([s, SCENARIOS[s], ...tiers.map((t) => frac(byScenario[t]![s]!.exact, byScenario[t]![s]!.n))])),
  ``,
  ...tiers.flatMap((t) => {
    const m = failures(t, "missed");
    const f = failures(t, "false");
    return [
      `## ${t}: urgent chats missed (${m.length})`,
      ``,
      ...(m.length ? m.flatMap((c) => chatBlock(c, t)) : ["None."]),
      ``,
      `## ${t}: false urgent (${f.length})`,
      ``,
      ...(f.length ? f.flatMap((c) => chatBlock(c, t)) : ["None."]),
      ``,
    ];
  }),
].join("\n");

mkdirSync(RESULTS, { recursive: true });
writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      date: today,
      commit,
      n: chats.length,
      tiers,
      all,
      byLang,
      byScenario,
      chats: chats.map((c) => ({ id: c.id, lang: c.lang, scenario: c.scenario, level: c.level, results: results[c.id] })),
      gemma: gemmaCache,
    },
    null,
    1,
  ) + "\n",
);
writeFileSync(new URL("chats.md", RESULTS), md + "\n");

console.log(`Chat-level benchmark: ${chats.length} chats, engine at ${commit}${dirty ? " (dirty)" : ""}`);
for (const t of tiers) {
  const s = all[t]!;
  console.log(`${t.padEnd(32)} exact ${fracCI(s.exact, s.n).padEnd(22)} missed urgent ${fracCI(s.missedUrgent, s.urgent).padEnd(22)} false urgent ${fracCI(s.falseUrgent, s.notUrgent)}`);
}
console.log("Wrote eval/results/chats.json and eval/results/chats.md");
