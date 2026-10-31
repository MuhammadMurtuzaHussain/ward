// One Discord message through Ward's engine: the word lists for every language Ward reads, plus
// Ward Lite when it loads. Nothing is stored; the text lives only for the length of the call.

import { analyze, type Category, type Chat, type Judge, type Severity } from "@ward/engine";

export interface Reading {
  severity: Severity;
  categories: Category[];
  why: string;
  /** Threats, urging self-harm, sexual pressure, sharing private images or details. */
  dangerous: boolean;
  /** Which layers read it, for "how Ward knows". */
  readBy: string[];
}

export const DANGER: Category[] = ["threat", "selfharm", "sexual", "exposure"];

export async function read(text: string, sender: string, at: Date, judges: Judge[] = []): Promise<Reading> {
  const chat: Chat = { source: "discord", messages: [{ id: 0, at, sender, text, media: false }], events: [], participants: [sender] };
  const a = await analyze(chat, { self: null, judges });
  const f = a.findings[0]!;
  return {
    severity: f.severity,
    categories: f.categories,
    why: f.why,
    // A word like "after school" is only a possible threat on its own (severity 1); one message
    // in a server is all Ward sees, so it takes more than that to alert moderators.
    dangerous: f.severity >= 3 || (f.severity >= 2 && f.categories.some((c) => DANGER.includes(c))),
    readBy: ["word lists", ...a.layers.models],
  };
}
