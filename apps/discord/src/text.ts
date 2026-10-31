// What Ward says in Discord. Written for 13 to 17 year olds: short, warm, specific, never
// lecturing. Discord has no Urdu locale, so this is English; the engine still reads Roman Urdu,
// Hinglish and Bangla in the messages themselves.

import type { Category, Severity } from "@ward/engine";
import type { Reading } from "./ward.ts";

export const VERDICT: Record<Severity, string> = {
  0: "Ward doesn't see anything hurtful here",
  1: "This is unkind",
  2: "This looks like bullying",
  3: "This is dangerous",
};

export const CATEGORY: Record<Category, string> = {
  insult: "insults",
  appearance: "about how someone looks",
  identity: "about who someone is (religion, race, gender, disability)",
  exclusion: "leaving someone out",
  threat: "a threat",
  selfharm: "telling someone to hurt themselves",
  sexual: "sexual pressure",
  exposure: "threatening to share private photos or details",
  mockery: "mocking",
};

const COLOR: Record<Severity, number> = { 0: 0x5fb98a, 1: 0xe0b44c, 2: 0xe08a4c, 3: 0xe05c5c };

/** What to do about it, on Discord, in the order that helps most. */
export function steps(r: Reading): string[] {
  const s: string[] = [];
  if (r.dangerous) s.push("**Tell an adult you trust today.** You don't have to handle this alone, and you won't get in trouble for what someone else sent.");
  if (r.categories.includes("selfharm")) s.push("If it's got into your head, talk to someone now: `/ward help` lists free, private helplines.");
  if (r.categories.includes("exposure") || r.categories.includes("sexual"))
    s.push("Don't send anything, and don't pay. If a photo of you is out there or threatened, **Take It Down** can help remove it: https://takeitdown.ncmec.org");
  s.push("Keep proof first: right-click the message → **Apps** → **Save as evidence**. Then you can delete or leave without losing it.");
  s.push("Report it to Discord: hover the message → **⋯** → **Report Message**. They don't tell the sender who reported.");
  s.push("Block them: click their name → **⋯** → **Block**. In a server, you can also mute the channel or leave.");
  if (!r.dangerous) s.push("Don't reply in the heat of it. Ward's lessons in the app have words for the next time.");
  return s;
}

export function checkEmbed(r: Reading, author: string) {
  const kinds = r.categories.map((c) => CATEGORY[c]);
  const lines =
    r.severity === 0
      ? ["Nothing in the words Ward knows, in English, Roman Urdu, Hinglish or Bangla. If it still hurt, that counts: tone and history matter, and Ward only sees this one message."]
      : [
          kinds.length ? `What it is: ${kinds.join(", ")}.` : "",
          r.why ? `Why Ward thinks so: ${r.why}` : "",
          "",
          "**What you can do**",
          ...steps(r).map((x) => `• ${x}`),
        ].filter((x, i, a) => x || (i > 0 && a[i - 1]));
  return {
    title: VERDICT[r.severity],
    description: lines.join("\n").slice(0, 4000),
    color: COLOR[r.severity],
    footer: { text: `Read by ${r.readBy.join(" + ")}, on Ward's own server. Only you can see this. Nothing was kept. Message from ${author}.`.slice(0, 2048) },
  };
}

export const SAVED_DM_FAILED =
  "Ward couldn't DM you, so here's the saved copy instead. Download the file to keep it. To let Ward keep evidence in your DMs, allow direct messages from apps in Discord's privacy settings.";

export const ABOUT = [
  "**Ward** is a free, open-source helper for bullying online: https://github.com/MuhammadMurtuzaHussain/ward",
  "• **Right-click a message → Apps → Check with Ward**: is it bullying, and what can you do about it? Only you see the answer.",
  "• **Right-click → Apps → Save as evidence**: Ward DMs you a copy with a fingerprint, so you can prove later what was said.",
  "• **/ward report**: turns everything you saved into a report a counsellor, helpline or the Ward app can check.",
  "• **/ward help**: people you can talk to, free and private.",
  "Ward reads only the message you pick. It keeps nothing: no logs, no database. Your saved evidence lives in your own DMs.",
].join("\n");
