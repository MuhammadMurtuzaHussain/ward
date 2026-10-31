import { test } from "node:test";
import assert from "node:assert/strict";
import { GatewayIntentBits } from "discord.js";
import { checkReport } from "@ward/engine";
import { COMMANDS } from "./commands.ts";
import { fingerprint, fromEmbed, reportFrom, toEmbed, type Evidence } from "./evidence.ts";
import { frameOf } from "./frame.ts";
import { intentsFor, plan, serverModeOn } from "./server.ts";
import { CATEGORY, MEMBER_NOTICE, alertEmbed, checkEmbed, serverInfo, steps } from "./text.ts";
import { read } from "./ward.ts";

function saved(from: string, at: string, text: string): Evidence {
  return { from, shown: from.toUpperCase(), where: "Year 9 #general", at, text, link: "https://discord.com/channels/1/2/3", savedAt: "2026-10-31T12:00:00.000Z", sha256: fingerprint(from, at, text) };
}

test("Ward reads Discord messages with the app's engine", async () => {
  const r = await read("tu mar kyun nahi jati", "bilal_07", new Date());
  assert.equal(r.severity, 3);
  assert.ok(r.dangerous && r.categories.includes("selfharm"));
  assert.match(steps(r).join(" "), /helpline/);
  assert.equal((await read("see you at practice tomorrow", "zara", new Date())).severity, 0);
  assert.equal((await read("ok bye, see you at the gate after school", "zara", new Date())).dangerous, false);
  assert.equal((await read("kal school ke baad bahar milna", "bilal_07", new Date())).dangerous, true);
  assert.match(checkEmbed(r, "Bilal").footer.text, /Nothing was kept/);
});

test("a flag only a small model raised needs the chat around it", async () => {
  // A stand-in for Ward Lite that flags one friendly message as dangerous.
  const lite = {
    name: "Ward Lite",
    async judge(chat: { messages: { id: number; text: string }[] }) {
      return new Map(chat.messages.filter((m) => m.text.includes("find you")).map((m) => [m.id, { hostile: true, severity: 3 as const, categories: [], model: "Ward Lite", authority: "raise-only" as const }]));
    },
  };
  const alone = await read("ill find you at the mela", "zara", new Date(), [lite]);
  assert.ok(alone.unsure && !alone.dangerous);
  assert.match(checkEmbed(alone, "Zara").title, /isn't sure/);
  const t = new Date();
  const pileOn = await read("ill find you at the mela", "zara", t, [lite], { before: [{ sender: "bilal", text: "ugly loser nobody wants you here", at: t }] });
  assert.ok(!pileOn.unsure && pileOn.dangerous);
});

test("evidence survives the round trip through a DM", () => {
  const e = saved("bilal_07", "2026-10-30T19:02:11.000Z", "nobody wants you here\nleave the server");
  assert.deepEqual(fromEmbed(toEmbed(e)), e);
  assert.equal(fromEmbed({ description: "hi", fields: [], footer: { text: "something else" } }), null);
});

test("saved evidence becomes a ward.report/v2 a counsellor can verify", async () => {
  const items = [
    saved("bilal_07", "2026-10-30T19:02:11.000Z", "nobody wants you here"),
    saved("me_myself", "2026-10-30T19:03:00.000Z", "stop it"),
    saved("xx.shadow", "2026-10-30T19:04:30.000Z", "kys"),
    saved("bilal_07", "2026-10-29T20:00:00.000Z", "ugly loser"),
  ];
  const r = await reportFrom(items, { self: "me_myself", recipient: "school", inDangerNow: false, wants: ["stop"], reporter: { ageBand: "14" } });
  assert.equal(r.schema, "ward.report/v2");
  assert.equal(r.conversation.source, "discord");
  assert.equal(r.incidents.length, 3, "the teen's own message stays out");
  assert.deepEqual(r.incidents.map((x) => x.at), ["2026-10-29T20:00:00.000Z", "2026-10-30T19:02:11.000Z", "2026-10-30T19:04:30.000Z"]);
  assert.equal(r.safety.level, "urgent");
  const c = await checkReport(r);
  assert.ok(c.digestOk && c.perMessage.every(Boolean));
  r.incidents[0]!.text = "u ok?";
  assert.equal((await checkReport(r)).perMessage[0], false);
});

test("server mode is off unless the host sets WARD_SERVER_MODE=on", () => {
  for (const v of [undefined, "", "off", "OFF", "yes", "true", "1", "no"]) assert.equal(serverModeOn({ WARD_SERVER_MODE: v }), false, String(v));
  assert.equal(serverModeOn({}), false);
  assert.equal(serverModeOn({ WARD_SERVER_MODE: "on" }), true);
  assert.equal(serverModeOn({ WARD_SERVER_MODE: " On " }), true);
  // Without it, Ward never asks Discord for server messages or what they say.
  assert.ok(!intentsFor(false).includes(GatewayIntentBits.MessageContent));
  assert.ok(!intentsFor(false).includes(GatewayIntentBits.GuildMessages));
  assert.ok(intentsFor(true).includes(GatewayIntentBits.MessageContent));
  assert.ok(intentsFor(false).includes(GatewayIntentBits.DirectMessages));
});

const where = { channel: "general", url: "https://discord.com/channels/1/2/3", from: "<@42> (@bilal_07)" };

test("a self-harm alert carries the link, channel and kind, never the words", async () => {
  const text = "tu mar kyun nahi jati";
  const r = await read(text, "bilal_07", new Date());
  const p = plan(r, text);
  assert.equal(p.alert, "withheld");
  const json = JSON.stringify(alertEmbed(r, p.alert, { ...where, text }));
  assert.ok(!json.includes("mar kyun"), "no message text, and no 'why' that quotes it");
  assert.ok(!json.includes("bilal_07") && !json.includes("<@42>"), "nobody named");
  assert.ok(json.includes(where.url) && json.includes("#general") && json.includes(CATEGORY.selfharm));
  // A danger Ward can't name a kind for may be self-harm too.
  const lite = { ...r, categories: [] };
  assert.equal(plan(lite, "something only Ward Lite caught").alert, "withheld");

  // Other dangerous messages alert as before: the words, the sender and the link.
  const threat = "kal school ke baad bahar milna";
  const t = await read(threat, "bilal_07", new Date());
  const pt = plan(t, threat);
  assert.equal(pt.alert, "full");
  const full = JSON.stringify(alertEmbed(t, pt.alert!, { ...where, text: threat }));
  assert.ok(full.includes(threat) && full.includes("bilal_07") && full.includes(where.url));
  assert.ok(!pt.nudge, "never a nudge on a dangerous message");
});

test("someone telling what happened, or standing up for someone, is never treated as the sender", async () => {
  const reports = [
    "someone told me to kys",
    "someone told me to kys and I can't stop thinking about it",
    "he keeps telling me to kill myself",
    "they sent me this: kys",
    "he said i should just die",
    "she's threatening to post my pics",
    "usne mujhe bola mar ja",
    "mujhe kaha tu mar ja",
    "wo mujhe roz gaali deta hai",
    "আমাকে বলেছে মরে যা",
    "ও আমাকে হুমকি দিয়েছে",
    "amake boleche more ja",
  ];
  const upstanders = ["@Bilal stop telling Sara to kys", "stop calling her an ugly loser", "leave him alone, nobody deserves that", "Sara ko kys mat bolo", "aisa mat bolo yaar", "ওকে মরে যা বলিস না", "বলা বন্ধ কর"];
  for (const t of reports) assert.equal(frameOf(t), "reporting", t);
  for (const t of upstanders) assert.equal(frameOf(t), "upstanding", t);
  // A bare "someone said", quotation marks, or the ways a bully asks or threatens never count.
  for (const t of [
    "kys",
    "someone said kys",
    '"kys" lol',
    "tell me where you live or else",
    "send me nudes or i post your pics",
    "someone told me to tell you to kys",
    "mujhe pics bhej warna",
    "kisi ko mat bolo warna mar ja",
    "তোকে মেরে ফেলবো কাউকে বলিস না",
    "stop crying and kys",
  ])
    assert.equal(frameOf(t), null, t);

  // End to end: the words are dangerous, so moderators hear that someone may need support, with
  // the link only. No nudge to the writer, no check-in for anyone they mention.
  for (const text of ["someone told me to kys", "@Bilal stop telling Sara to kys", "usne mujhe bola mar ja", "আমাকে বলেছে মরে যা"]) {
    const r = await read(text, "sara", new Date());
    assert.ok(r.dangerous, text);
    const p = plan(r, text);
    assert.deepEqual([p.alert, p.nudge, p.checkIn], ["support", false, false], text);
    const json = JSON.stringify(alertEmbed(r, p.alert!, { ...where, from: "<@7> (@sara)", text }));
    assert.match(json, /may need support/);
    assert.ok(!json.includes("@sara") && !json.includes('"From"') && !json.includes(text), text);
  }
  // A hurtful report sends nothing at all; the same words aimed at someone still get a nudge.
  const told = "he called me an ugly loser again";
  const tr = { ...(await read(told, "sara", new Date())), severity: 2 as const };
  assert.deepEqual(plan(tr, told), { frame: "reporting", alert: null, nudge: false, checkIn: false });
  const sent = "ur an ugly loser";
  const sr = { ...(await read(sent, "bilal", new Date())), severity: 2 as const };
  assert.deepEqual(plan(sr, sent), { frame: null, alert: null, nudge: true, checkIn: true });
  assert.ok(!plan(sr, sent, "Alerts. Ward: No-Nudge").nudge);
});

test("/ward server explains server mode and gives moderators a notice for members", () => {
  const on = serverInfo({ hostOn: true, inServer: true, alertsId: "9" });
  assert.match(on, /<#9>/);
  assert.match(on, /moderators of teen communities/);
  assert.match(on, /only the link, channel and kind/);
  assert.match(on, /stay in #ward-alerts/);
  assert.match(serverInfo({ hostOn: false, inServer: true, alertsId: "9" }), /\*\*off\*\* in this copy/);
  assert.match(MEMBER_NOTICE, /^This server uses Ward/);
  assert.match(MEMBER_NOTICE, /won't get in trouble/);
  for (const s of [on, serverInfo({ hostOn: true, inServer: true }), `**A notice to pin for members**\n\`\`\`\n${MEMBER_NOTICE}\n\`\`\``]) {
    assert.ok(s.length <= 2000, `${s.length} characters`);
    assert.ok(!s.includes("—"), "no em dashes");
  }
});

test("every command works installed to an account or a server", () => {
  for (const c of COMMANDS) {
    assert.deepEqual(c.integration_types, [0, 1]);
    assert.ok(c.name.length <= 32);
  }
});
