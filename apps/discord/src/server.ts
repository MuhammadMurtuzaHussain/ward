// Server mode's decisions, apart from the Discord client so tests can check them. Server mode is
// a moderator tool, off unless the host sets WARD_SERVER_MODE=on (docs/SAFEGUARDING.md section
// 13): the Ward app never alerts adults, and this is the one place Ward does.

import { GatewayIntentBits } from "discord.js";
import { frameOf, type Frame } from "./frame.ts";
import type { Reading } from "./ward.ts";

/** Only an explicit "on" switches it on. Unset, empty, "off" or anything else: personal mode only. */
export function serverModeOn(env: Record<string, string | undefined> = process.env): boolean {
  return env.WARD_SERVER_MODE?.trim().toLowerCase() === "on";
}

/** Without server mode Ward never asks Discord for server messages or their content. */
export function intentsFor(serverMode: boolean): GatewayIntentBits[] {
  const base = [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages];
  return serverMode ? [...base, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] : base;
}

/**
 * How moderators hear about a dangerous message:
 *   full: the words, the sender, the kind and a link (threats, sexual pressure, exposure).
 *   withheld: link, channel and kind only. Self-harm messages, and ones Ward can't name a kind
 *     for, may be someone asking for help, so their words never leave the channel.
 *   support: "someone may need support", with the link. The writer is telling what happened to
 *     them or standing up for someone, so Ward never names them as the sender.
 */
export type Alert = "full" | "withheld" | "support";

export interface Plan {
  frame: Frame | null;
  alert: Alert | null;
  /** A private nudge to the sender to edit or delete. Never for a dangerous message or a report. */
  nudge: boolean;
  /** A kind check-in for whoever it was aimed at. Not for a report: the people it names are often the bully. */
  checkIn: boolean;
}

export function plan(r: Reading, text: string, topic = ""): Plan {
  const frame = r.severity > 0 ? frameOf(text) : null;
  const t = topic.toLowerCase();
  const alert: Alert | null = !r.dangerous ? null : frame ? "support" : r.categories.includes("selfharm") || !r.categories.length ? "withheld" : "full";
  // A flag Ward isn't sure about sends nothing to members; a report or an upstander gets no DM
  // that treats them as the sender, and nobody they mention gets a check-in.
  const act = r.severity >= 2 && !r.unsure && !frame;
  return {
    frame,
    alert,
    // Never nudge on a dangerous message: it would tip off someone making threats.
    nudge: act && !r.dangerous && !t.includes("ward: no-nudge"),
    checkIn: act && !t.includes("ward: no-checkin"),
  };
}
