// One Discord message through Ward's engine: the word lists for every language Ward reads, plus
// Ward Lite when it loads. Nothing is stored; the text lives only for the length of the call.

import { analyze, type Category, type Chat, type Judge, type SecondLook, type Severity } from "@ward/engine";

export interface Reading {
  severity: Severity;
  categories: Category[];
  why: string;
  /** Threats, urging self-harm, sexual pressure, sharing private images or details. */
  dangerous: boolean;
  /** Only Ward Lite flagged it, and nothing around it (if Ward could see anything) backs it up. */
  unsure: boolean;
  /** Which layers read it, for "how Ward knows". */
  readBy: string[];
}

export const DANGER: Category[] = ["threat", "selfharm", "sexual", "exposure"];

export interface Around {
  sender: string;
  text: string;
  at: Date;
}

/**
 * Reads one message. With the messages before it (server mode, or a check in a server Ward is
 * in), a flag only Ward Lite raised needs that context to back it up, or Ward says it isn't
 * sure; with a second look (Gemma on the host), Gemma re-reads it with that context.
 */
export async function read(text: string, sender: string, at: Date, judges: Judge[] = [], opts: { before?: Around[]; secondLook?: SecondLook } = {}): Promise<Reading> {
  const before = opts.before ?? [];
  const msgs = [...before, { sender, text, at }];
  const chat: Chat = {
    source: "discord",
    messages: msgs.map((m, id) => ({ id, at: m.at, sender: m.sender, text: m.text, media: false })),
    events: [],
    participants: [...new Set(msgs.map((m) => m.sender))],
  };
  const a = await analyze(chat, { self: null, judges, secondLook: opts.secondLook });
  const f = a.findings.at(-1)!;
  return {
    severity: f.severity,
    categories: f.categories,
    why: f.secondLook ? (f.secondLook.why ?? f.why) : f.why,
    // A word like "after school" is only a possible threat on its own (severity 1); one message
    // in a server is all Ward sees, so it takes more than that to alert moderators. And a flag
    // Ward isn't sure about never does.
    dangerous: !f.unsure && (f.severity >= 3 || (f.severity >= 2 && f.categories.some((c) => DANGER.includes(c)))),
    unsure: Boolean(f.unsure),
    readBy: ["word lists", ...a.layers.models, ...(f.secondLook ? [`${f.secondLook.by} (second look)`] : [])],
  };
}
