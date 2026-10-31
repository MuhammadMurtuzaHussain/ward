// The red-team set: hand-written, synthetic messages that try to slip past Ward (disguised
// insults, coded slang, sarcasm, polite exclusion, indirect threats) and harmless look-alikes that
// try to trip it (banter, reclaimed words, a child quoting abuse to ask for help, game talk).
// One JSONL file per language in this folder. It is a test set only: train/ must never read it,
// and leak.test.ts fails if any of it turns up in Ward Lite's training data.

import { readdirSync, readFileSync } from "node:fs";
import { normalize } from "../../packages/engine/src/normalize.ts";
import { CATEGORIES, type Category, type Severity } from "../../packages/engine/src/types.ts";

export const CLASSES = ["disguise", "coded", "sarcasm", "exclusion", "indirect", "hard-negative"] as const;
export type RedClass = (typeof CLASSES)[number];

export const CLASS_NAMES: Record<RedClass, string> = {
  disguise: "Spelling disguises (leetspeak, spacing, stretched letters, emoji, mixed scripts)",
  coded: "Coded and new slang, initialisms",
  sarcasm: "Sarcasm and backhanded compliments",
  exclusion: "Exclusion said politely",
  indirect: "Indirect threats, exposure, self-harm urging, image pressure",
  "hard-negative": "Hard negatives: banter, reclaimed words, quoting to ask for help, game talk",
};

export const LANGS = {
  en: "English",
  "ur-Latn": "Roman Urdu",
  "hi-Latn": "Hinglish",
  bn: "Bangla (Bangla script)",
  "bn-Latn": "Bangla (romanised)",
} as const;
export type Lang = keyof typeof LANGS;

export interface RedItem {
  id: string;
  lang: Lang;
  /** Which trick it tests. Every class except hard-negative has hurtful items and harmless look-alikes. */
  class: RedClass;
  /** Finer trick: leetspeak, spacing, emoji, polite, threat, banter, quoting, ... */
  kind: string;
  /** The engine's scale: 0 nothing, 1 rude, 2 bullying, 3 dangerous. */
  severity: Severity;
  /** The engine's category for hurtful items; null when harmless. */
  category: Category | null;
  text: string;
  /** What it tests, in English. */
  note: string;
}

export const DIR = new URL("./", import.meta.url);

/** The same key build-data.ts uses to spot duplicates: case, leetspeak and punctuation folded. */
export const key = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Case and punctuation only. normalize() turns a trailing "!" into an "i", so "monday!" and
 * "monday" get different keys; the leak check compares both ways. */
export const plainKey = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function readRaw(): { file: string; line: number; item: RedItem }[] {
  const out: { file: string; line: number; item: RedItem }[] = [];
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".jsonl")).sort()) {
    readFileSync(new URL(file, DIR), "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (l.trim()) out.push({ file, line: i + 1, item: JSON.parse(l) as RedItem });
      });
  }
  return out;
}

/** Every problem with the set, as readable strings. Empty means it is well-formed. */
export function problems(rows = readRaw()): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  const keys = new Map<string, string>();
  for (const { file, line, item: it } of rows) {
    const at = `${file}:${line} (${it.id})`;
    if (!it.id || ids.has(it.id)) bad.push(`${at}: missing or duplicate id`);
    ids.add(it.id);
    if (!(it.lang in LANGS)) bad.push(`${at}: unknown lang ${it.lang}`);
    if (!CLASSES.includes(it.class)) bad.push(`${at}: unknown class ${it.class}`);
    if (![0, 1, 2, 3].includes(it.severity)) bad.push(`${at}: severity must be 0 to 3`);
    if (it.severity > 0 && !CATEGORIES.includes(it.category as Category)) bad.push(`${at}: hurtful items need an engine category`);
    if (it.severity === 0 && it.category !== null) bad.push(`${at}: harmless items have category null`);
    if (it.class === "hard-negative" && it.severity > 0) bad.push(`${at}: hard negatives are harmless by definition`);
    if (!it.text?.trim() || !it.note?.trim() || !it.kind?.trim()) bad.push(`${at}: text, kind and note are required`);
    const k = key(it.text ?? "");
    if (keys.has(k)) bad.push(`${at}: same text as ${keys.get(k)}`);
    keys.set(k, it.id);
  }
  return bad;
}

export function loadRedteam(): RedItem[] {
  const rows = readRaw();
  const bad = problems(rows);
  if (bad.length) throw new Error(`The red-team set has problems:\n${bad.join("\n")}`);
  return rows.map((r) => r.item);
}
