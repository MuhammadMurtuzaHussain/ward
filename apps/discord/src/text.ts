// What Ward says in Discord. Written for 13 to 17 year olds: short, warm, specific, never
// lecturing. Discord has no Urdu locale, so this is English; the engine still reads Roman Urdu,
// Hinglish and Bangla in the messages themselves.

import type { Category, Severity } from "@ward/engine";
import type { Alert } from "./server.ts";
import type { Reading } from "./ward.ts";

export const ALERTS = "ward-alerts";

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
  if (r.unsure)
    return {
      title: "Ward isn't sure about this one",
      description: [
        "Only Ward's small model noticed something here, and Ward can't see enough of the chat around it to be sure. You know how it was meant better than Ward does.",
        r.severity >= 3 ? "\nIf it was meant seriously, it **is** serious: tell an adult you trust, and `/ward help` lists free, private helplines." : "",
        "\nIf it hurt: right-click it → **Apps** → **Save as evidence**, and block or report them on Discord.",
      ].join("\n"),
      color: COLOR[1],
      footer: { text: `Read by ${r.readBy.join(" + ")}, on Ward's own server. Only you can see this. Nothing was kept. Message from ${author}.`.slice(0, 2048) },
    };
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

const ALERT_FOOTER = { text: "Ward never acts on its own. A person decides. Ward can be wrong. This alert stays here until a moderator deletes it." };

/** What moderators see in #ward-alerts. Only "full" alerts copy the words or name the sender. */
export function alertEmbed(r: Reading, kind: Alert, m: { channel: string; url: string; from: string; text: string }) {
  const kinds = r.categories.map((c) => CATEGORY[c]).join(", ") || "not sure (only Ward Lite flagged it)";
  if (kind === "full")
    return {
      title: `${VERDICT[r.severity]} in #${m.channel}`,
      description: `> ${m.text.slice(0, 1500).replace(/\n/g, "\n> ")}`,
      color: COLOR[3],
      fields: [
        { name: "From", value: m.from, inline: true },
        { name: "Kind", value: kinds, inline: true },
        { name: "Message", value: m.url },
        { name: "Why", value: (r.why || "-").slice(0, 1024) },
      ],
      footer: ALERT_FOOTER,
    };
  if (kind === "support")
    return {
      title: `Someone in #${m.channel} may need support`,
      description:
        "This looks like someone telling what happened to them, or standing up for someone. Ward hasn't copied the words or named anyone, and it sent nobody a DM about it. Open the link to read it in place, and please don't ask them to delete it.",
      color: COLOR[3],
      fields: [
        { name: "Channel", value: `#${m.channel}`, inline: true },
        { name: "What it mentions", value: kinds, inline: true },
        { name: "Message", value: m.url },
      ],
      footer: ALERT_FOOTER,
    };
  return {
    title: `${VERDICT[r.severity]} in #${m.channel}`,
    description:
      "Ward doesn't copy the words or name anyone when a message may be about self-harm: it could be someone asking for help. Open the link to read it in place. If it is someone telling what happened to them, please don't ask them to delete it.",
    color: COLOR[3],
    fields: [
      { name: "Channel", value: `#${m.channel}`, inline: true },
      { name: "Kind", value: kinds, inline: true },
      { name: "Message", value: m.url },
    ],
    footer: ALERT_FOOTER,
  };
}

/** `/ward server`: what server mode is, for moderators. Under Discord's 2,000 characters. */
export function serverInfo(o: { hostOn: boolean; inServer: boolean; alertsId?: string }): string {
  const status = !o.hostOn
    ? "Server mode is **off** in this copy of Ward: whoever hosts it hasn't switched it on (`WARD_SERVER_MODE=on`), so Ward doesn't read this server's messages. Personal mode (right-click → Apps) still works."
    : !o.inServer
      ? "Ward isn't added to this server, so server mode is off here. Personal mode (right-click → Apps) still works for you."
      : o.alertsId
        ? `Server mode is **on** here: dangerous messages go to <#${o.alertsId}>.`
        : `Server mode is **off** here. To switch it on, create a private text channel called **#${ALERTS}** that only moderators and Ward can see.`;
  return [
    status,
    "",
    "**What it is.** A tool for moderators of teen communities who choose it. The Ward app never alerts adults; this is the one exception, so it's off unless the host and the server both switch it on.",
    "**What it does**",
    `• Reads new messages as they arrive, on the computer that runs Ward. Ward keeps no copy, but its alerts are ordinary messages: they stay in #${ALERTS} until you delete them.`,
    "• Dangerous messages (threats, urging self-harm, sexual pressure, threats to share private images or details) get an alert with a link. For self-harm, only the link, channel and kind: it may be someone asking for help.",
    "• Someone telling what happened to them, or standing up for someone, is never named as the sender: the alert only says someone may need support, without their name, and nobody gets a DM. So open the link. If the message also says \"you\" or \"or else\", Ward can't tell it from a threat and alerts as usual.",
    "• The sender of a hurtful (not dangerous) message gets a private nudge to edit or delete it. `ward: no-nudge` in the alerts channel's topic turns this off.",
    "• Whoever it was aimed at gets a short, kind check-in. `ward: no-checkin` turns this off.",
    "**What it never does.** Delete, mute, ban or punish anyone. Nudge the sender of a dangerous message. Ask anyone to delete a message telling what happened to them.",
    "**Its limits.** Ward can be wrong both ways, and someone can test messages until Ward stops noticing. A person decides, every time. Its safeguarding review isn't done yet.",
    "Tell your members: pin the notice below where everyone can read it.",
  ].join("\n");
}

/** For moderators to pin, so members know what Ward reads and sends. */
export const MEMBER_NOTICE = [
  "This server uses Ward, a free, open-source helper for bullying online: https://github.com/MuhammadMurtuzaHussain/ward",
  "",
  "• Ward reads new messages here as they arrive. It keeps no copy and never deletes, mutes or bans anyone.",
  "• If a message looks dangerous (threats, telling someone to hurt themselves, sexual pressure, threats to share private photos or details), Ward tells our moderators in a private channel. Those alerts stay there until a moderator deletes them. A person decides what happens, and Ward can be wrong.",
  "• If you tell us what happened to you, or stand up for someone, you won't get in trouble. Ward won't ask you to delete it.",
  "• If something rough is sent your way, Ward may DM you a short check-in. If a message of yours might hurt someone, it may DM you a private nudge.",
  "• To check or save any message yourself: right-click it → Apps → Check with Ward, or Save as evidence.",
  "• Free, private people to talk to: /ward help",
].join("\n");

export const SAVED_DM_FAILED =
  "Ward couldn't DM you, so here's the saved copy instead. Download the file to keep it. To let Ward keep evidence in your DMs, allow direct messages from apps in Discord's privacy settings.";

export const ABOUT = [
  "**Ward** is a free, open-source helper for bullying online: https://github.com/MuhammadMurtuzaHussain/ward",
  "• **Right-click a message → Apps → Check with Ward**: is it bullying, and what can you do about it? Only you see the answer.",
  "• **Right-click → Apps → Save as evidence**: Ward DMs you a copy with a fingerprint, so you can prove later what was said.",
  "• **/ward report**: turns everything you saved into a report a counsellor, helpline or the Ward app can check.",
  "• **/ward help**: people you can talk to, free and private.",
  "Ward reads only the message you pick. It keeps nothing: no logs, no database. Your saved evidence lives in your own DMs.",
  "In a server whose moderators chose Ward's server mode, Ward also reads new messages there and tells moderators about dangerous ones. `/ward server` explains.",
].join("\n");
