// Getting a chat into Ward. Kids share a WhatsApp export (the .txt from "Export chat") or paste
// text. Both phone formats are handled:
//   Android: 12/10/2026, 21:14 - Ali: text
//   iPhone:  [12/10/2026, 21:14:05] Ali: text
// plus 12-hour times ("9:14 pm"), dotted dates, multi-line messages and group events.

import type { Chat, ChatEvent, Message } from "./types.ts";

const ANDROID = /^(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),? (\d{1,2}:\d{2}(?::\d{2})?)(?:\s?([ap]\.?m\.?))? - (.*)$/i;
const IOS = /^‎?\[(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),? (\d{1,2}:\d{2}(?::\d{2})?)(?:\s?([ap]\.?m\.?))?\] (.*)$/i;
const MEDIA = /^(?:‎)?(?:<media omitted>|<attached: .*>|image omitted|video omitted|sticker omitted|gif omitted|audio omitted|this message was deleted|you deleted this message)$/i;

interface Dated {
  date: string;
  time: string;
  ampm?: string;
  rest: string;
}

/** Day/month order varies by phone locale; decide once per chat from dates that can only be read one way. */
function dayFirst(heads: Dated[]): boolean {
  for (const { date } of heads) {
    const [a, b] = date.split(/[./-]/).map(Number);
    if (a! > 12) return true;
    if (b! > 12) return false;
  }
  // Nothing settles it: 12-hour clocks with slashes are almost always US phones (month first).
  return !heads.some((h) => h.ampm && h.date.includes("/"));
}

function toDate(d: Dated, df: boolean): Date | null {
  const parts = d.date.split(/[./-]/).map(Number);
  let [a, b, c] = parts as [number, number, number];
  let year: number, month: number, day: number;
  if (a > 31) [year, month, day] = [a, b, c];
  else [day, month, year] = df ? [a, b, c] : [b, a, c];
  if (year < 100) year += 2000;
  const [h, m, s] = d.time.split(":").map(Number) as [number, number, number?];
  let hour = h;
  const ap = d.ampm?.toLowerCase().replace(/\./g, "");
  if (ap === "pm" && hour < 12) hour += 12;
  if (ap === "am" && hour === 12) hour = 0;
  const date = new Date(year, month - 1, day, hour, m, s ?? 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function event(rest: string): Omit<ChatEvent, "at" | "before"> | null {
  const r = rest.replace(/‎/g, "");
  let m = r.match(/^(.+?) joined using this group's invite link$/i);
  if (m) return { kind: "joined", who: m[1]! };
  m = r.match(/^(.+?) joined$/i);
  if (m) return { kind: "joined", who: m[1]! };
  m = r.match(/^(.+?) added (.+)$/i);
  if (m) return { kind: "added", who: m[2]!, by: m[1]! };
  m = r.match(/^(.+?) removed (.+)$/i);
  if (m) return { kind: "removed", who: m[2]!, by: m[1]! };
  m = r.match(/^(.+?) left$/i);
  if (m) return { kind: "left", who: m[1]! };
  return null;
}

export function parseWhatsApp(text: string): Chat | null {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const dated: (Dated | string)[] = lines.map((line) => {
    const m = line.match(IOS) ?? line.match(ANDROID);
    return m ? { date: m[1]!, time: m[2]!, ampm: m[3], rest: m[4]! } : line;
  });
  const heads = dated.filter((d): d is Dated => typeof d !== "string");
  if (heads.length < 2 || heads.length < lines.filter((l) => l.trim()).length * 0.3) return null;
  const df = dayFirst(heads);

  const messages: Message[] = [];
  const events: ChatEvent[] = [];
  let last: Message | null = null;
  for (const d of dated) {
    if (typeof d === "string") {
      if (last && d.trim()) last.text += "\n" + d;
      continue;
    }
    const at = toDate(d, df);
    const colon = d.rest.indexOf(": ");
    if (colon === -1) {
      const ev = event(d.rest);
      if (ev) events.push({ ...ev, at, before: messages.length });
      last = null; // system lines ("Messages are end-to-end encrypted") have no continuation
      continue;
    }
    const sender = d.rest.slice(0, colon).replace(/‎/g, "").trim();
    const body = d.rest.slice(colon + 2);
    last = { id: messages.length, at, sender, text: body, media: MEDIA.test(body.trim()) };
    messages.push(last);
  }
  return { source: "whatsapp", messages, events, participants: participantsOf(messages, events) };
}

/** Pasted text: "Name: message" per line where it can, otherwise one message per line. */
export function parsePasted(text: string): Chat {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim());
  const named = lines.filter((l) => /^[^:\n]{1,40}: \S/.test(l)).length;
  const messages: Message[] = [];
  for (const line of lines) {
    const m = named >= lines.length / 2 ? line.match(/^([^:\n]{1,40}): (.*)$/) : null;
    if (!m && named >= lines.length / 2 && messages.length) {
      messages[messages.length - 1]!.text += "\n" + line;
      continue;
    }
    const text = m ? m[2]! : line;
    messages.push({ id: messages.length, at: null, sender: m ? m[1]!.trim() : "Someone", text, media: MEDIA.test(text.trim()) });
  }
  return { source: "paste", messages, events: [], participants: participantsOf(messages, []) };
}

export function parseChat(text: string): Chat {
  return parseWhatsApp(text) ?? parsePasted(text);
}

function participantsOf(messages: Message[], events: ChatEvent[]): string[] {
  const count = new Map<string, number>();
  for (const m of messages) count.set(m.sender, (count.get(m.sender) ?? 0) + 1);
  for (const e of events) if (!count.has(e.who)) count.set(e.who, 0);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
}
