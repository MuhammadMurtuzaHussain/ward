// From messages to what's happening. One mean message is rude; bullying is a pattern:
// the same person again and again, many people at once, accounts that show up only to attack.
// This file turns per-message judgements into those patterns and one overall level.

import { PackMatcher } from "./packs.ts";
import type { Analysis, Category, Chat, Finding, Level, Message, ModelJudgement, Pattern, Severity } from "./types.ts";

export interface Judge {
  /** Shown in "how Ward knows", e.g. "gemma4:e4b". */
  name: string;
  judge(chat: Chat, opts: { self: string | null; onProgress?: (done: number, total: number) => void }): Promise<Map<number, ModelJudgement>>;
}

export interface AnalyzeOptions {
  /** Which participant is the child using Ward. */
  self: string | null;
  packs?: PackMatcher;
  judges?: Judge[];
  onProgress?: (done: number, total: number) => void;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function firstName(name: string): string {
  return name.split(/\s+/)[0]!.toLowerCase();
}

function mentions(text: string, name: string): boolean {
  const n = firstName(name);
  if (n.length < 2) return false;
  return new RegExp(`(^|[^\\p{L}])@?${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu").test(text);
}

function aimedAtSelf(chat: Chat, m: Message, self: string | null, model?: ModelJudgement): boolean {
  if (!self || m.sender === self) return false;
  if (model?.target && firstName(model.target) === firstName(self)) return true;
  if (mentions(m.text, self)) return true;
  // A one-to-one chat: everything the other person says is to the child.
  if (chat.participants.filter((p) => p !== self).length <= 1) return true;
  // A group talking about the child: they spoke or were named in the last few messages, and this
  // message doesn't name anyone else. Catches "you" replies and "she looked so fat" alike.
  const others = chat.participants.filter((p) => p !== self && p !== m.sender);
  if (others.some((o) => mentions(m.text, o))) return false;
  const recent = chat.messages.slice(Math.max(0, m.id - 6), m.id);
  return recent.some((r) => r.sender === self || mentions(r.text, self));
}

function combine(m: Message, matcher: PackMatcher, model: ModelJudgement | undefined) {
  const hits = matcher.match(m.text);
  const packSev = hits.reduce<Severity>((s, h) => (h.severity > s ? h.severity : s), 0);
  let severity: Severity = packSev;
  let why = hits.length ? hits.map((h) => `"${h.term}" (${h.gloss})`).join(", ") : "";
  if (model?.authority === "raise-only") {
    // A small model can catch what the word lists missed, but never talk Ward out of a warning.
    if (model.hostile && model.severity > packSev) {
      severity = model.severity;
      why = model.why ?? why;
    }
  } else if (model) {
    if (model.hostile) {
      severity = Math.max(model.severity, packSev >= 3 ? 3 : 1) as Severity;
      why = model.why ?? why;
    } else if (packSev >= 3) {
      // The model reads it as a joke, but the words are dangerous ones: keep it visible, don't panic.
      severity = 2;
      why = `${why}. It may be a joke, but these words are serious. How did it feel?`;
    } else {
      severity = 0;
    }
  }
  const categories = [...new Set<Category>([...hits.map((h) => h.category), ...(model?.hostile ? model.categories : [])])];
  return { hits, severity, categories, why };
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export async function analyze(chat: Chat, opts: AnalyzeOptions): Promise<Analysis> {
  const matcher = opts.packs ?? new PackMatcher();
  const judgements = new Map<number, ModelJudgement>();
  const models: string[] = [];
  for (const j of opts.judges ?? []) {
    const got = await j.judge(chat, { self: opts.self, onProgress: opts.onProgress });
    models.push(j.name);
    // A later judge fills gaps; where both judged, the more worried one wins.
    for (const [id, v] of got) {
      const prev = judgements.get(id);
      if (!prev || (v.hostile && (!prev.hostile || v.severity > prev.severity))) judgements.set(id, v);
    }
  }

  const findings: Finding[] = chat.messages.map((m) => {
    const model = judgements.get(m.id);
    const c = combine(m, matcher, model);
    const atSelf = c.severity > 0 && aimedAtSelf(chat, m, opts.self, model);
    return { message: m, ...c, model, atSelf };
  });

  const hostile = findings.filter((f) => f.severity > 0 && f.message.sender !== opts.self);
  const toSelf = hostile.filter((f) => f.atSelf || !opts.self);
  const patterns = findPatterns(chat, hostile, toSelf, opts.self);

  const bySender = new Map<string, { name: string; hostile: number; worst: Severity; total: number }>();
  for (const m of chat.messages) {
    const s = bySender.get(m.sender) ?? { name: m.sender, hostile: 0, worst: 0 as Severity, total: 0 };
    s.total++;
    bySender.set(m.sender, s);
  }
  for (const f of hostile) {
    const s = bySender.get(f.message.sender)!;
    s.hostile++;
    if (f.severity > s.worst) s.worst = f.severity;
  }

  return {
    level: levelOf(patterns, toSelf),
    self: opts.self,
    findings,
    patterns,
    senders: [...bySender.values()].sort((a, b) => b.worst - a.worst || b.hostile - a.hostile),
    layers: { packs: matcher.langs, models },
  };
}

function levelOf(patterns: Pattern[], toSelf: Finding[]): Level {
  if (patterns.some((p) => p.kind === "danger")) return "urgent";
  if (patterns.some((p) => ["campaign", "pileon", "ghosts", "exclusion"].includes(p.kind))) return "bullying";
  if (toSelf.filter((f) => f.severity >= 2).length >= 3) return "bullying";
  if (toSelf.length > 0) return "watch";
  return "calm";
}

function ids(fs: Finding[]) {
  return fs.map((f) => f.message.id);
}

function uniq(xs: string[]) {
  return [...new Set(xs)];
}

export function findPatterns(chat: Chat, hostile: Finding[], toSelf: Finding[], self: string | null): Pattern[] {
  const out: Pattern[] = [];
  const timed = chat.messages.every((m) => m.at);

  const danger = hostile.filter((f) => f.severity >= 3);
  if (danger.length) {
    const kinds = uniq(danger.flatMap((f) => f.categories).filter((c) => ["threat", "selfharm", "sexual", "exposure"].includes(c)));
    const words: Record<string, string> = {
      threat: "threats to hurt you",
      selfharm: "messages telling you to hurt yourself",
      sexual: "sexual messages or pressure to send photos",
      exposure: "threats to share your photos or private things",
    };
    const said = kinds.map((k) => words[k]).filter(Boolean);
    const list = said.length > 1 ? `${said.slice(0, -1).join(", ")} and ${said.at(-1)}` : (said[0] ?? "messages that could put you in danger");
    out.push({
      kind: "danger",
      senders: uniq(danger.map((f) => f.message.sender)),
      messageIds: ids(danger),
      summary: `This chat has ${list}. That is never okay, and it's not your fault.`,
      fact: `Dangerous messages: ${kinds.map((k) => ({ threat: "threats of violence", selfharm: "telling the child to hurt or kill themselves", sexual: "sexual messages or pressure for photos", exposure: "threats to share photos or private information" })[k]).filter(Boolean).join("; ")}.`,
    });
  }

  // The same person, again and again.
  const perSender = new Map<string, Finding[]>();
  for (const f of toSelf) perSender.set(f.message.sender, [...(perSender.get(f.message.sender) ?? []), f]);
  const repeaters: { sender: string; fs: Finding[]; days: number }[] = [];
  for (const [sender, fs] of perSender) {
    const days = timed ? uniq(fs.map((f) => f.message.at!.toDateString())).length : 0;
    if (fs.length >= 3 && (days >= 2 || (!timed && fs.length >= 4))) repeaters.push({ sender, fs, days });
  }
  if (repeaters.length) {
    repeaters.sort((a, b) => b.fs.length - a.fs.length);
    const top = repeaters[0]!;
    const others = repeaters.slice(1).map((r) => r.sender);
    const lead = timed
      ? `${top.sender} has gone after you ${top.fs.length} times over ${top.days} days`
      : `${top.sender} has gone after you ${top.fs.length} times`;
    const also = others.length ? `, and ${others.length === 1 ? others[0] : `${others.slice(0, -1).join(", ")} and ${others.at(-1)}`} ${others.length === 1 ? "keeps" : "keep"} doing it too` : "";
    out.push({
      kind: "campaign",
      senders: repeaters.map((r) => r.sender),
      messageIds: ids(repeaters.flatMap((r) => r.fs)),
      summary: `${lead}${also}. When it keeps happening, it's bullying, not a joke.`,
      fact: `Repeated targeting: ${repeaters.map((r) => `${r.sender} (${r.fs.length} messages${timed ? ` over ${r.days} days` : ""})`).join(", ")}.`,
    });
  }

  // Many people at once: 3+ different senders inside an hour (or 15 messages, untimed).
  for (let i = 0; i < toSelf.length; i++) {
    const start = toSelf[i]!;
    const window = toSelf.filter((f, j) =>
      j >= i &&
      (timed ? f.message.at!.getTime() - start.message.at!.getTime() <= HOUR : f.message.id - start.message.id <= 15),
    );
    const senders = uniq(window.map((f) => f.message.sender));
    if (senders.length >= 3) {
      out.push({
        kind: "pileon",
        senders,
        messageIds: ids(window),
        summary: `${senders.length} people joined in on you at once. A pile-on can feel like everyone is against you. They aren't everyone.`,
        fact: `Pile-on: ${senders.length} people sent hurtful messages ${timed ? "within one hour" : "in quick succession"} (${senders.join(", ")}).`,
      });
      break;
    }
  }

  // Accounts that turned up and only attacked.
  const arrived = new Set(chat.events.filter((e) => e.kind === "joined" || e.kind === "added").map((e) => e.who));
  const ghosts: string[] = [];
  for (const name of chat.participants) {
    if (name === self) continue;
    const mine = chat.messages.filter((m) => m.sender === name && !m.media);
    const bad = hostile.filter((f) => f.message.sender === name);
    if (!mine.length || !bad.length) continue;
    const ratio = bad.length / mine.length;
    if ((arrived.has(name) && ratio >= 0.6 && mine.length <= 8) || (!arrived.size && bad.length >= 2 && ratio === 1 && mine.length <= 5 && chat.participants.length > 3)) {
      ghosts.push(name);
    }
  }
  if (ghosts.length) {
    out.push({
      kind: "ghosts",
      senders: ghosts,
      messageIds: ids(hostile.filter((f) => ghosts.includes(f.message.sender))),
      summary:
        ghosts.length === 1
          ? `${ghosts[0]} showed up and only said mean things. Accounts like that are often made just to hurt someone.`
          : `${ghosts.length} accounts showed up and only said mean things. Accounts like that are often made just to hurt someone, and they can be blocked and reported.`,
      fact: `Accounts that only sent hurtful messages${arrived.size ? " after being added to the group" : ""}: ${ghosts.join(", ")}.`,
    });
  }

  // Shutting someone out.
  const excl = hostile.filter((f) => f.categories.includes("exclusion"));
  const removedSelf = self ? chat.events.filter((e) => e.kind === "removed" && e.who === self) : [];
  if (excl.length || removedSelf.length) {
    out.push({
      kind: "exclusion",
      senders: uniq([...excl.map((f) => f.message.sender), ...removedSelf.map((e) => e.by ?? "")].filter(Boolean)),
      messageIds: ids(excl),
      summary: removedSelf.length
        ? "You were removed from the group, and people talked about keeping you out. Leaving someone out on purpose is a kind of bullying."
        : "People in this chat talked about keeping someone out. Leaving someone out on purpose is a kind of bullying.",
      fact: removedSelf.length ? "Exclusion: the child was removed from the group, and members talked about keeping them out." : "Exclusion: members talked about keeping someone out of the group.",
    });
  }

  if (timed) {
    const night = toSelf.filter((f) => {
      const h = f.message.at!.getHours();
      return h >= 23 || h < 5;
    });
    if (night.length >= 2) {
      out.push({
        kind: "nightwatch",
        senders: uniq(night.map((f) => f.message.sender)),
        messageIds: ids(night),
        summary: `${night.length} of these came after 11 at night. You can mute this chat at night, and sleep is not giving up.`,
        fact: `${night.length} hurtful messages were sent between 11pm and 5am.`,
      });
    }
  }

  if (toSelf.length >= 4) {
    const half = Math.floor(toSelf.length / 2);
    const avg = (fs: Finding[]) => fs.reduce((s, f) => s + f.severity, 0) / fs.length;
    const first = toSelf.slice(0, half);
    const second = toSelf.slice(half);
    const spanOk = !timed || (sameDay(first[0]!.message.at!, second.at(-1)!.message.at!) ? true : second.at(-1)!.message.at!.getTime() - first[0]!.message.at!.getTime() >= DAY);
    if (spanOk && avg(second) >= avg(first) + 0.5) {
      out.push({
        kind: "escalating",
        senders: uniq(second.map((f) => f.message.sender)),
        messageIds: ids(second),
        summary: "It's getting worse over time. This is a good moment to tell someone you trust.",
        fact: "The messages became more severe over time.",
      });
    }
  }

  return out;
}
