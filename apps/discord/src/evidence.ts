// Evidence without a database. When a teen saves a message, Ward sends it to them as a DM with its
// fingerprint, taken at that moment the same way the app's vault does (sender|time|text). The DMs
// are the store: only the teen and Ward can see them, and nobody can edit a message Ward sent.
// `/ward report` reads them back and builds a ward.report/v2 that counsellor mode, the case viewer
// and helplines already know how to check.

import { createHash } from "node:crypto";
import { analyze, buildReport, type Chat, type Judge, type ReportInput, type Want } from "@ward/engine";

export const EVIDENCE = "ward.evidence/v1";

export interface Evidence {
  /** The sender's Discord username (unique), which the fingerprint is taken over. */
  from: string;
  /** Display name and server, for a person reading the DM. */
  shown: string;
  where: string;
  at: string;
  text: string;
  link: string;
  savedAt: string;
  sha256: string;
}

export const fingerprint = (from: string, at: string, text: string) => createHash("sha256").update(`${from}|${at}|${text}`).digest("hex");

/** The DM body: readable for the teen, and parseable by `/ward report`. */
export function toEmbed(e: Evidence) {
  return {
    title: "Saved as evidence",
    description: e.text.slice(0, 4000),
    color: 0x7c6cf0,
    fields: [
      { name: "From", value: `${e.shown} (@${e.from})`.slice(0, 1024), inline: true },
      { name: "Sent", value: e.at, inline: true },
      { name: "Where", value: e.where.slice(0, 1024) || "a DM", inline: true },
      { name: "Link", value: e.link },
      { name: "Fingerprint (SHA-256)", value: e.sha256 },
    ],
    footer: { text: `${EVIDENCE} · saved ${e.savedAt}` },
  };
}

interface EmbedLike {
  description?: string | null;
  fields?: { name: string; value: string }[];
  footer?: { text: string } | null;
}

export function fromEmbed(m: EmbedLike): Evidence | null {
  const foot = m.footer?.text ?? "";
  if (!foot.startsWith(EVIDENCE)) return null;
  const f = (name: string) => m.fields?.find((x) => x.name === name)?.value ?? "";
  const from = /\(@([^)]+)\)$/.exec(f("From"))?.[1];
  if (!from) return null;
  return {
    from,
    shown: f("From").replace(/\s*\(@[^)]+\)$/, ""),
    where: f("Where"),
    at: f("Sent"),
    text: m.description ?? "",
    link: f("Link"),
    savedAt: foot.split("saved ")[1] ?? "",
    sha256: f("Fingerprint (SHA-256)"),
  };
}

export interface ReportOptions {
  self: string;
  recipient: ReportInput["recipient"];
  inDangerNow: boolean | null;
  wants: Want[];
  reporter: ReportInput["reporter"];
  judges?: Judge[];
}

/**
 * Builds the report from saved evidence, oldest first. Each incident keeps the fingerprint taken
 * when it was saved, so the report's per-message check proves the text wasn't changed since.
 */
export async function reportFrom(saved: Evidence[], o: ReportOptions) {
  // The teen's own messages never go in a report, the same as in the app.
  const items = saved.filter((e) => e.from !== o.self).sort((a, b) => a.at.localeCompare(b.at));
  const chat: Chat = {
    source: "discord",
    messages: items.map((e, id) => ({ id, at: new Date(e.at), sender: e.from, text: e.text, media: false })),
    events: [],
    participants: [...new Set(items.map((e) => e.from))],
  };
  // No "self": the teen saved each of these because it was aimed at them, so all of it counts.
  const analysis = await analyze(chat, { self: null, judges: o.judges });
  const savedAt = items.map((e) => e.savedAt).sort()[0] ?? new Date().toISOString();
  return buildReport({
    chat,
    analysis,
    fingerprints: items.map((e) => e.sha256),
    savedAt: new Date(savedAt),
    title: `Discord: ${[...new Set(items.map((e) => e.where))].join(", ")}`.slice(0, 200),
    platform: "Discord",
    reporter: o.reporter,
    inDangerNow: o.inDangerNow,
    wants: o.wants,
    recipient: o.recipient,
  });
}
