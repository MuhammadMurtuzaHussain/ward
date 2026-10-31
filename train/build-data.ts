// Builds Ward Lite's training data from public train splits and Gemma-written synthetic chats.
// Nothing the scorecard tests on goes in: every row is checked against the eval sets' text.
//   node --experimental-strip-types build-data.ts
// Writes data/train.jsonl, data/dev.jsonl and DATA.md (the data card).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PackMatcher, normalize } from "../packages/engine/src/index.ts";

type Row = { text: string; hurtful: 0 | 1; danger: 0 | 1; lang: string; source: string };

const RAW = new URL("./data/raw/", import.meta.url);
mkdirSync(RAW, { recursive: true });

async function rows(dataset: string, config: string, split: string, max = 40000): Promise<Record<string, unknown>[]> {
  const file = new URL(`${dataset.replace("/", "__")}__${config}__${split}.json`, RAW);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; offset < max; offset += 100) {
    let j: { rows?: { row: Record<string, unknown> }[]; num_rows_total?: number } = {};
    for (let a = 0; a < 5; a++) {
      const r = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=100`);
      if (r.ok) {
        j = await r.json();
        break;
      }
      await new Promise((res) => setTimeout(res, 2000 * (a + 1)));
    }
    out.push(...(j.rows ?? []).map((r) => r.row));
    if (!j.rows?.length || out.length >= (j.num_rows_total ?? 0)) break;
  }
  writeFileSync(file, JSON.stringify(out));
  return out;
}

// Deterministic shuffle so the data never changes between runs.
function shuffle<T>(xs: T[], seed = 7): T[] {
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const key = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Everything the scorecard can draw from, so none of it is trained on.
const evalDir = new URL("../eval/data/", import.meta.url);
const evalTexts = new Set<string>();
for (const [file, field] of [
  ["community-datasets__roman_urdu_hate_speech__Coarse_Grained__validation.json", "tweet"],
  ["yamin401533__bangla-cyberbullying-blindspot__default__test.json", "text"],
  ["surrey-nlp__Cyberbullying-Detection-CB1__default__test.json", "tweet_text"],
] as const) {
  const p = new URL(file, evalDir);
  if (!existsSync(p)) throw new Error(`Run pnpm eval once first so ${file} is cached: the leak check needs it.`);
  for (const r of JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>[]) evalTexts.add(key(String(r[field])));
}

const packs = new PackMatcher();
const danger = (t: string): 0 | 1 => (packs.match(t).some((h) => h.severity >= 3) ? 1 : 0);
const balanced = (pos: Row[], neg: Row[], n: number) => [...shuffle(pos).slice(0, n / 2), ...shuffle(neg).slice(0, n / 2)];

const sources: Record<string, Row[]> = {};

// Roman Urdu: the train split only (the scorecard uses validation).
const ru = await rows("community-datasets/roman_urdu_hate_speech", "Coarse_Grained", "train");
sources["Roman Urdu (roman_urdu_hate_speech, train)"] = ru
  .filter((r) => r.label === 0 || r.label === 1)
  .map((r) => ({ text: String(r.tweet), hurtful: r.label === 0 ? 1 : 0, danger: danger(String(r.tweet)), lang: "ur-Latn", source: "roman_urdu_hate_speech" }));

// English: CB1's train split, the same classes the scorecard uses (targeted vs not).
const en = await rows("surrey-nlp/Cyberbullying-Detection-CB1", "default", "train");
const enRows = en
  .filter((r) => ["not_cyberbullying", "gender", "other_cyberbullying"].includes(String(r.cyberbullying_type)))
  .map((r) => ({ text: String(r.tweet_text), hurtful: (r.cyberbullying_type === "not_cyberbullying" ? 0 : 1) as 0 | 1, danger: danger(String(r.tweet_text)), lang: "en", source: "cb1" }));
sources["English (Cyberbullying-Detection-CB1, train)"] = balanced(enRows.filter((r) => r.hurtful), enRows.filter((r) => !r.hurtful), 6000);

// Hinglish and Hindi: PRISM's train split.
const hi = await rows("pankajbiswas6/prism-hinglish-hate-speech", "default", "train");
const hiRows = hi
  .filter((r) => r.lang === "hinglish" || r.lang === "hindi")
  .map((r) => ({ text: String(r.text), hurtful: (Number(r.label) === 1 ? 1 : 0) as 0 | 1, danger: danger(String(r.text)), lang: r.lang === "hindi" ? "hi" : "hi-Latn", source: "prism-hinglish" }));
sources["Hinglish and Hindi (prism-hinglish-hate-speech, train)"] = balanced(hiRows.filter((r) => r.hurtful), hiRows.filter((r) => !r.hurtful), 6000);

// Bangla: personal and gender abuse only (political rants aren't aimed at a child).
const bn = [...(await rows("mteb/bengali_hate_speech", "default", "train")), ...(await rows("mteb/bengali_hate_speech", "default", "test"))];
sources["Bangla (mteb/bengali_hate_speech, personal and gender labels)"] = bn
  .filter((r) => r.label === 0 || r.label === 4)
  .map((r) => ({ text: String(r.text), hurtful: 1, danger: danger(String(r.text)), lang: "bn", source: "mteb-bengali" }));

// Bangla non-abusive: real social-media comments (SentNoB, neutral and positive only). Without
// these, every non-abusive Bangla example would be synthetic, and the model learns that real
// Bangla comment text means "hurtful".
const sentnob = await rows("khondoker/SentNoB", "default", "train");
sources["Bangla non-abusive (SentNoB, neutral and positive comments)"] = shuffle(sentnob.filter((r) => r.Label === 0 || r.Label === 1))
  .slice(0, 2500)
  .map((r) => ({ text: String(r.Data), hurtful: 0, danger: danger(String(r.Data)), lang: "bn", source: "sentnob" }));

// Synthetic kid-style chats from gen-synthetic.ts.
const synth = new URL("./data/synthetic.jsonl", import.meta.url);
if (existsSync(synth)) {
  sources["Synthetic chats (Gemma 4 on this machine)"] = readFileSync(synth, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .map((r) => ({ text: r.text, hurtful: r.hurtful, danger: r.danger, lang: r.lang, source: `synthetic:${r.kind}` }));
}

// Dedupe, drop anything the scorecard could test on, drop empties.
const seen = new Set<string>();
let leaks = 0;
const all: Row[] = [];
for (const rs of Object.values(sources)) {
  for (const r of rs) {
    const k = key(r.text);
    if (k.length < 3 || seen.has(k)) continue;
    if (evalTexts.has(k)) {
      leaks++;
      continue;
    }
    seen.add(k);
    all.push(r);
  }
}

const shuffled = shuffle(all, 26);
const dev = shuffled.filter((_, i) => i % 10 === 0);
const train = shuffled.filter((_, i) => i % 10 !== 0);
writeFileSync(new URL("./data/train.jsonl", import.meta.url), train.map((r) => JSON.stringify(r)).join("\n") + "\n");
writeFileSync(new URL("./data/dev.jsonl", import.meta.url), dev.map((r) => JSON.stringify(r)).join("\n") + "\n");

const by = (rs: Row[], f: (r: Row) => string) => rs.reduce<Record<string, number>>((m, r) => ((m[f(r)] = (m[f(r)] ?? 0) + 1), m), {});
const table = Object.entries(by(all, (r) => r.lang))
  .map(([lang]) => {
    const rs = all.filter((r) => r.lang === lang);
    return `| ${lang} | ${rs.length} | ${rs.filter((r) => r.hurtful).length} | ${rs.filter((r) => r.danger).length} |`;
  })
  .join("\n");
writeFileSync(
  new URL("./DATA.md", import.meta.url),
  `# Ward Lite training data

Built by \`build-data.ts\`. ${all.length} messages after removing duplicates and **${leaks} that also appear in the scorecard's eval sets** (dropped so the scorecard stays honest). 90% train, 10% dev (for choosing the checkpoint; the scorecard is separate).

## Sources

${Object.entries(sources)
  .map(([name, rs]) => `- **${name}**: ${rs.length} rows before dedupe`)
  .join("\n")}

The scorecard's own splits (Roman Urdu validation, Bangla blindspot test, CB1 test) are never used for training.

The red-team set (\`eval/redteam/\`, see [docs/REDTEAM.md](../docs/REDTEAM.md)) is a test set too. **Nothing in \`train/\` may read \`eval/redteam/\`**, and no red-team message may be copied or paraphrased into training data or the synthetic-data prompts. \`eval/redteam/leak.test.ts\`, part of \`pnpm test\`, fails if any red-team text turns up in \`train/data\` or the training scripts, or if code here opens that folder.

## Labels

- **hurtful**: the dataset's own abusive/bullying label, or the kind the synthetic message was written as.
- **danger**: threats, telling someone to hurt themselves, sexual pressure, or threats to expose. From the synthetic kind, or (for public data) a severity-3 slang-pack hit, which is a weak label.

| Language | Messages | Hurtful | Danger |
| --- | --- | --- | --- |
${table}

## Known weaknesses

- Public data is tweets and comments, not children's chats; synthetic chats fill that gap but were written by a model.
- Bangla non-abusive examples are SentNoB comments (neutral and positive sentiment), which are a different source from the abusive Bangla rows; the model could partly learn source style rather than abuse.
- The danger label on public data is weak (slang-pack hits only).
`,
);
console.log({ total: all.length, train: train.length, dev: dev.length, leaks, byLang: by(all, (r) => r.lang) });
