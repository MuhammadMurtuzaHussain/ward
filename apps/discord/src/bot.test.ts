import { test } from "node:test";
import assert from "node:assert/strict";
import { checkReport } from "@ward/engine";
import { COMMANDS } from "./commands.ts";
import { fingerprint, fromEmbed, reportFrom, toEmbed, type Evidence } from "./evidence.ts";
import { checkEmbed, steps } from "./text.ts";
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

test("every command works installed to an account or a server", () => {
  for (const c of COMMANDS) {
    assert.deepEqual(c.integration_types, [0, 1]);
    assert.ok(c.name.length <= 32);
  }
});
