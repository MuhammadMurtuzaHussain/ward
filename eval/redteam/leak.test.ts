// Keeps the red-team set and the chat-level benchmark (eval/chats) honest: well-formed, covering
// every trick or scenario in every language, and never trained on. Ward Lite's training data (train/data) is gitignored, so the leak check runs wherever
// that folder exists (the machine that trains) and is skipped elsewhere. WARD_TRAIN_DATA points it
// at another copy.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CLASSES, LANGS, key, loadRedteam, plainKey, problems, type Lang } from "./set.ts";
import { LANGS as CHAT_LANGS, LEVELS, SCENARIOS, loadChats, messageTexts, problems as chatProblems, type Lang as ChatLang, type Scenario } from "../chats/set.ts";

const TRAIN = new URL("../../train/", import.meta.url);
const DATA = process.env.WARD_TRAIN_DATA ? new URL(`file://${process.env.WARD_TRAIN_DATA.replace(/\/?$/, "/")}`) : new URL("data/", TRAIN);

test("the red-team set is well-formed", () => {
  assert.deepEqual(problems(), []);
});

test("every language has hurtful items and harmless look-alikes for every trick", () => {
  const items = loadRedteam();
  for (const lang of Object.keys(LANGS) as Lang[]) {
    const mine = items.filter((i) => i.lang === lang);
    assert.ok(mine.length >= 30, `${lang} has only ${mine.length} items`);
    for (const c of CLASSES) {
      const inClass = mine.filter((i) => i.class === c);
      assert.ok(inClass.some((i) => i.severity === 0), `${lang} / ${c} has no harmless look-alike`);
      if (c !== "hard-negative") assert.ok(inClass.some((i) => i.severity > 0), `${lang} / ${c} has no hurtful item`);
    }
  }
});

test("the chat set is well-formed", () => {
  assert.deepEqual(chatProblems(), []);
});

test("every language has 30 to 40 chats, covering every level and scenario", () => {
  const chats = loadChats();
  for (const lang of Object.keys(CHAT_LANGS) as ChatLang[]) {
    const mine = chats.filter((c) => c.lang === lang);
    assert.ok(mine.length >= 30 && mine.length <= 40, `${lang} has ${mine.length} chats`);
    for (const l of LEVELS) assert.ok(mine.some((c) => c.level === l), `${lang} has no ${l} chat`);
    for (const s of Object.keys(SCENARIOS) as Scenario[]) assert.ok(mine.some((c) => c.scenario === s), `${lang} has no ${s} chat`);
  }
});

// Code in train/ may mention the red-team set (the data card says to keep away from it) but never
// open, import or glob anything with that name.
const READS = /readFileSync|readdirSync|createReadStream|new URL|\bimport\b|\bfrom\s+["']|require\(|\bopen\(|Path\(|\.glob\(|read_text|load_dataset|json\.load/;
test("nothing in train/ reads the red-team set", () => {
  const offenders: string[] = [];
  for (const f of readdirSync(TRAIN)) {
    const p = new URL(f, TRAIN);
    if (!statSync(p).isFile() || !/\.(ts|js|mjs|py|toml|json|sh)$/.test(f)) continue;
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (/red-?team/i.test(l) && READS.test(l)) offenders.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(offenders, [], `train/ must never read eval/redteam: ${offenders.join(", ")}`);
});

test("nothing in train/ reads the chat set", () => {
  const offenders: string[] = [];
  for (const f of readdirSync(TRAIN)) {
    const p = new URL(f, TRAIN);
    if (!statSync(p).isFile() || !/\.(ts|js|mjs|py|toml|json|sh)$/.test(f)) continue;
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (/(eval\/|\.\.\/)chats\b/.test(l) && READS.test(l)) offenders.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(offenders, [], `train/ must never read eval/chats: ${offenders.join(", ")}`);
});

/** Chat messages long enough to be telling: "ok" or "gg" turn up everywhere and prove nothing. */
const chatLines = () => [...new Set(messageTexts())].filter((t) => key(t).length >= 20);

test("no red-team text is written into the training scripts", () => {
  const items = loadRedteam().filter((i) => key(i.text).length >= 15);
  for (const f of readdirSync(TRAIN).filter((f) => /\.(ts|py)$/.test(f))) {
    const src = key(readFileSync(new URL(f, TRAIN), "utf8"));
    const found = items.filter((i) => src.includes(key(i.text)));
    assert.deepEqual(found.map((i) => i.id), [], `train/${f} contains red-team text`);
    const chatFound = chatLines().filter((t) => src.includes(key(t)));
    assert.deepEqual(chatFound, [], `train/${f} contains chat-set text`);
  }
});

/** Every text in a training file: the "text" of JSONL rows, every string field of raw dataset rows. */
function texts(path: URL): string[] {
  const raw = readFileSync(path, "utf8");
  if (path.pathname.endsWith(".jsonl")) return raw.split("\n").filter(Boolean).map((l) => String(JSON.parse(l).text ?? ""));
  const rows = JSON.parse(raw) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => (r && typeof r === "object" ? Object.values(r).filter((v): v is string => typeof v === "string") : []));
}

function trainingTexts(): Map<string, string> {
  const files = [
    ...["train.jsonl", "dev.jsonl", "synthetic.jsonl"].map((f) => new URL(f, DATA)),
    ...(existsSync(new URL("raw/", DATA)) ? readdirSync(new URL("raw/", DATA)).filter((f) => f.endsWith(".json")).map((f) => new URL(`raw/${f}`, DATA)) : []),
  ].filter((p) => existsSync(p));
  assert.ok(files.length > 0, `no training files found in ${fileURLToPath(DATA)}`);
  const seen = new Map<string, string>();
  for (const f of files) {
    for (const s of texts(f)) {
      seen.set(key(s), fileURLToPath(f));
      seen.set(plainKey(s), fileURLToPath(f));
    }
  }
  return seen;
}

test("no red-team text is in Ward Lite's training data", (t) => {
  if (!existsSync(DATA)) {
    t.skip(`${fileURLToPath(DATA)} isn't here (it's gitignored); the check runs where Ward Lite is trained`);
    return;
  }
  const seen = trainingTexts();
  const leaks = loadRedteam().flatMap((i) => {
    const where = seen.get(key(i.text)) ?? seen.get(plainKey(i.text));
    return where ? [`${i.id} "${i.text}" is in ${where}`] : [];
  });
  assert.deepEqual(leaks, [], "red-team text found in training data: the set only measures anything while the model has never seen it");
});

test("no chat-set message is in Ward Lite's training data", (t) => {
  if (!existsSync(DATA)) {
    t.skip(`${fileURLToPath(DATA)} isn't here (it's gitignored); the check runs where Ward Lite is trained`);
    return;
  }
  const seen = trainingTexts();
  const leaks = chatLines().flatMap((s) => {
    const where = seen.get(key(s)) ?? seen.get(plainKey(s));
    return where ? [`"${s}" is in ${where}`] : [];
  });
  assert.deepEqual(leaks, [], "chat-set text found in training data: the benchmark only measures anything while the model has never seen it");
});
