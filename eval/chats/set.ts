// The chat-level benchmark: hand-written, synthetic chats, each labelled with the level a child
// should see for the whole chat. The scorecard and the red-team set score single messages; this
// scores what the child actually sees, after the context rules and the pattern engine.
// One JSONL file per language in this folder. Test set only: train/ must never read it, and
// eval/redteam/leak.test.ts fails if any of it turns up in Ward Lite's training data.
//
// Labels are one author's judgement, written before any system was run on them, pending review
// by native speakers of each language. The rule for each level:
//   urgent    someone else sends the child a dangerous message: a threat of violence, telling them
//             to hurt or kill themselves, sexual messages or pressure for photos, a threat to share
//             photos or private things. One is enough.
//   bullying  nothing dangerous, but a pattern: three or more people joining in, one person going
//             after the child again and again, or the child being shut out on purpose.
//   watch     nothing dangerous and no pattern, but at least one hurtful message aimed at the child.
//   calm      nothing hurtful aimed at the child: friends' banter (swearing included), ordinary
//             chat, game trash talk, or the child or a friend quoting abuse to ask for help.

import { readdirSync, readFileSync } from "node:fs";
import type { Chat, Level } from "../../packages/engine/src/types.ts";
import { key } from "../redteam/set.ts";

export const LEVELS = ["calm", "watch", "bullying", "urgent"] as const satisfies readonly Level[];

export const LANGS = { en: "English", "ur-Latn": "Roman Urdu", "hi-Latn": "Hinglish", bn: "Bangla" } as const;
export type Lang = keyof typeof LANGS;

/** What each chat was written to test. */
export const SCENARIOS = {
  "banter-group": "calm",
  "banter-dm": "calm",
  everyday: "calm",
  "quoting-for-help": "calm",
  "friend-quoting": "calm",
  "game-talk": "calm",
  "one-off-insult": "watch",
  "banter-crosses-line": "watch",
  sarcasm: "watch",
  pileon: "bullying",
  exclusion: "bullying",
  repeated: "bullying",
  "lone-threat-dm": "urgent",
  "lone-threat-dm-reply": "urgent",
  "image-pressure": "urgent",
  "exposure-threat": "urgent",
  "selfharm-urging": "urgent",
  "threat-group": "urgent",
} as const satisfies Record<string, Level>;
export type Scenario = keyof typeof SCENARIOS;

export interface LabelledChat {
  id: string;
  lang: Lang;
  /** What the child should see for the whole chat. */
  level: Level;
  scenario: Scenario;
  /** The child using Ward. */
  self: string;
  /** "Name: message", in order. Names have no spaces or colons. */
  messages: string[];
  /** What it tests, in English. */
  note: string;
}

const DIR = new URL("./", import.meta.url);

export function readRaw(): { file: string; line: number; chat: LabelledChat }[] {
  const out: { file: string; line: number; chat: LabelledChat }[] = [];
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".jsonl")).sort()) {
    readFileSync(new URL(file, DIR), "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (l.trim()) out.push({ file, line: i + 1, chat: JSON.parse(l) as LabelledChat });
      });
  }
  return out;
}

const LINE = /^([^\s:]+): (.+)$/;

/** Every problem with the set, as readable strings. Empty means it is well-formed. */
export function problems(rows = readRaw()): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  const keys = new Map<string, string>();
  for (const { file, line, chat: c } of rows) {
    const at = `${file}:${line} (${c.id})`;
    if (!c.id || ids.has(c.id)) bad.push(`${at}: missing or duplicate id`);
    ids.add(c.id);
    if (!(c.lang in LANGS)) bad.push(`${at}: unknown lang ${c.lang}`);
    if (!file.startsWith(`${c.lang}.`)) bad.push(`${at}: lang ${c.lang} in the wrong file`);
    if (!LEVELS.includes(c.level)) bad.push(`${at}: unknown level ${c.level}`);
    if (!(c.scenario in SCENARIOS)) bad.push(`${at}: unknown scenario ${c.scenario}`);
    else if (SCENARIOS[c.scenario] !== c.level) bad.push(`${at}: a ${c.scenario} chat should be ${SCENARIOS[c.scenario]}, not ${c.level}`);
    if (!c.note?.trim() || !c.self?.trim()) bad.push(`${at}: self and note are required`);
    if (!c.messages?.length) bad.push(`${at}: no messages`);
    for (const m of c.messages ?? []) if (!LINE.test(m)) bad.push(`${at}: "${m}" isn't "Name: message"`);
    const k = key((c.messages ?? []).join(" "));
    if (keys.has(k)) bad.push(`${at}: same chat as ${keys.get(k)}`);
    keys.set(k, c.id);
  }
  return bad;
}

export function loadChats(): LabelledChat[] {
  const rows = readRaw();
  const bad = problems(rows);
  if (bad.length) throw new Error(`The chat set has problems:\n${bad.join("\n")}`);
  return rows.map((r) => r.chat);
}

/** Every message text in the set, for the leak check and Ward Lite's scorer. */
export function messageTexts(chats = loadChats()): string[] {
  return chats.flatMap((c) => c.messages.map((m) => LINE.exec(m)![2]!));
}

/** The engine's view of a labelled chat: pasted, untimed, everyone who spoke plus the child. */
export function toChat(c: LabelledChat): Chat {
  const messages = c.messages.map((m, id) => {
    const [, sender, text] = LINE.exec(m)!;
    return { id, at: null, sender: sender!, text: text!, media: false };
  });
  return { source: "paste", events: [], participants: [...new Set([c.self, ...messages.map((m) => m.sender)])], messages };
}
