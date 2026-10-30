// A report a helpline, school or police officer can act on without a back-and-forth: who, what,
// when, how bad, what the child wants, and proof the messages weren't edited after saving.
// The format is versioned (ward.report/v2) and documented in docs/REPORT.md so a helpline can
// import it, not just read it. v1 reports, whose digest covered only the messages, still check.

import type { Analysis, Category, Chat, PatternKind, Severity } from "./types.ts";

export const WANTS = {
  stop: "Make it stop",
  remove: "Get something taken down",
  talk: "Talk to someone about how I feel",
  school: "Tell my school",
  police: "Report it to the police",
} as const;

export type Want = keyof typeof WANTS;

export interface ReportInput {
  chat: Chat;
  analysis: Analysis;
  /** SHA-256 per message, in chat order, taken when the evidence was saved. */
  fingerprints: string[];
  savedAt: Date;
  title: string;
  platform: string;
  /** Everything about the child is optional; the child decides what to share. */
  reporter: { firstName?: string; ageBand?: string; city?: string; country?: string };
  inDangerNow: boolean | null;
  wants: Want[];
  /** Who the report is for, so the wording can fit (helpline, school, police, parent). */
  recipient: "helpline" | "school" | "police" | "adult";
  appVersion?: string;
}

export interface ReportIncident {
  at: string | null;
  from: string;
  text: string;
  severity: Severity;
  categories: Category[];
  why: string;
  sha256: string;
}

export const REPORT_SCHEMA = "ward.report/v2";
const SCHEMAS = ["ward.report/v1", REPORT_SCHEMA];

export interface WardReport {
  schema: "ward.report/v1" | typeof REPORT_SCHEMA;
  createdAt: string;
  recipient: ReportInput["recipient"];
  tool: { name: "Ward"; version: string; models: string[]; languages: string[] };
  reporter: ReportInput["reporter"];
  safety: { inDangerNow: boolean | null; level: Analysis["level"]; dangerous: Category[] };
  wants: { id: Want; label: string }[];
  conversation: {
    title: string;
    platform: string;
    source: Chat["source"];
    messages: number;
    participants: number;
    firstIncident: string | null;
    lastIncident: string | null;
    days: number;
  };
  accounts: { name: string; hurtfulMessages: number; worstSeverity: Severity; addedDuringChat: boolean; onlyAttacked: boolean }[];
  patterns: { kind: PatternKind; fact: string }[];
  incidents: ReportIncident[];
  integrity: { algorithm: "SHA-256"; savedAt: string; perMessage: true; digest: string };
}

async function sha256(s: string) {
  const h = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * The text the digest is taken over. v2 covers everything a reader relies on, the child's own
 * answers included (in danger now, what they want, who it's for, their details), in a fixed
 * order so key order in the file doesn't matter. v1 covered only the conversation and incidents.
 */
export function digestText(r: WardReport): string {
  if (r.schema === "ward.report/v1") return JSON.stringify({ conversation: r.conversation, incidents: r.incidents });
  const { createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents } = r;
  return JSON.stringify({ createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents, savedAt: r.integrity.savedAt });
}

const DANGER: Category[] = ["threat", "selfharm", "sexual", "exposure"];

export async function buildReport(input: ReportInput): Promise<WardReport> {
  const { chat, analysis: a, fingerprints } = input;
  const self = a.self;
  const hurtful = a.findings.filter((f) => f.severity > 0 && f.message.sender !== self);
  const fp = new Map(chat.messages.map((m, i) => [m.id, fingerprints[i] ?? ""]));
  const incidents: ReportIncident[] = hurtful.map((f) => ({
    at: f.message.at?.toISOString() ?? null,
    from: f.message.sender,
    text: f.message.text,
    severity: f.severity,
    categories: f.categories,
    why: f.why,
    sha256: fp.get(f.message.id) ?? "",
  }));
  const times = incidents.map((i) => i.at).filter((t): t is string => !!t).sort();
  const ghosts = new Set(a.patterns.find((p) => p.kind === "ghosts")?.senders ?? []);
  const added = new Set(chat.events.filter((e) => e.kind === "added" || e.kind === "joined").map((e) => e.who));
  const conversation = {
    title: input.title,
    platform: input.platform,
    source: chat.source,
    messages: chat.messages.length,
    participants: chat.participants.length,
    firstIncident: times[0] ?? null,
    lastIncident: times.at(-1) ?? null,
    days: new Set(times.map((t) => t.slice(0, 10))).size,
  };
  const report: WardReport = {
    schema: REPORT_SCHEMA,
    createdAt: new Date().toISOString(),
    recipient: input.recipient,
    tool: { name: "Ward", version: input.appVersion ?? "0.1.0", models: a.layers.models, languages: a.layers.packs },
    reporter: Object.fromEntries(Object.entries(input.reporter).filter(([, v]) => v && String(v).trim())) as ReportInput["reporter"],
    safety: {
      inDangerNow: input.inDangerNow,
      level: a.level,
      dangerous: [...new Set(hurtful.flatMap((f) => f.categories).filter((c) => DANGER.includes(c)))],
    },
    wants: input.wants.map((id) => ({ id, label: WANTS[id] })),
    conversation,
    accounts: a.senders
      .filter((s) => s.hostile > 0 && s.name !== self)
      .map((s) => ({ name: s.name, hurtfulMessages: s.hostile, worstSeverity: s.worst, addedDuringChat: added.has(s.name), onlyAttacked: ghosts.has(s.name) })),
    patterns: a.patterns.map((p) => ({ kind: p.kind, fact: p.fact ?? p.summary })),
    incidents,
    integrity: { algorithm: "SHA-256", savedAt: input.savedAt.toISOString(), perMessage: true, digest: "" },
  };
  report.integrity.digest = await sha256(digestText(report));
  return report;
}

/** Recompute the digest of a received report, so a helpline can check it wasn't altered. */
export async function verifyReport(r: WardReport): Promise<boolean> {
  return (await sha256(digestText(r))) === r.integrity.digest;
}

/**
 * The full check a caseworker or counsellor needs: the digest, plus each incident against the
 * fingerprint taken when the child saved it, so an edit can be pinned to the message it touched.
 * The case viewer (viewer/ward-viewer.html) carries the same check inline.
 */
export async function checkReport(r: WardReport): Promise<{ digestOk: boolean; perMessage: boolean[] }> {
  const digestOk = await verifyReport(r);
  const perMessage = await Promise.all(r.incidents.map(async (i) => (await sha256(`${i.from}|${i.at ?? ""}|${i.text}`)) === i.sha256));
  return { digestOk, perMessage };
}

/** A reason the object isn't a report this version of Ward can read, or null. */
export function reportProblem(r: unknown): string | null {
  const o = r as Partial<WardReport> | null;
  if (!o || typeof o !== "object" || !("schema" in o)) return "not-report";
  if (!SCHEMAS.includes(o.schema as string)) return "schema";
  if (!o.conversation || !o.integrity || !o.safety || !Array.isArray(o.incidents)) return "incomplete";
  return null;
}

export async function fingerprintMessages(chat: Chat): Promise<string[]> {
  return Promise.all(chat.messages.map((m) => sha256(`${m.sender}|${m.at?.toISOString() ?? ""}|${m.text}`)));
}
