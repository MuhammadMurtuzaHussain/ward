// The viewer's checks must agree with the engine's: run the <verify> block from
// ward-viewer.html against reports the engine builds, untouched and tampered.
// Run: node --test --experimental-strip-types viewer/viewer.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { analyze, buildReport, checkReport as engineCheck, digestText as engineDigestText, fingerprintMessages, parseChat, verifyReport, type Chat, type Judge, type ModelJudgement, type WardReport } from "../packages/engine/src/index.ts";

const html = readFileSync(new URL("./ward-viewer.html", import.meta.url), "utf8");
const block = html.match(/\/\* <verify>[\s\S]*?\/\* <\/verify> \*\//)![0];
const { checkReport, problem, digestText } = new Function(`${block}; return { checkReport, problem, digestText };`)() as {
  checkReport: (r: WardReport) => Promise<{ digestOk: boolean; perMessage: boolean[]; unconfirmed: boolean[] }>;
  problem: (r: unknown) => string | null;
  digestText: (r: WardReport) => string;
};
const sample = (): WardReport => JSON.parse(readFileSync(new URL("./sample-report.json", import.meta.url), "utf8"));

test("an untouched report checks out, the same as the engine says", async () => {
  const r = sample();
  const c = await checkReport(r);
  assert.equal(c.digestOk, true);
  assert.ok(c.perMessage.length > 0 && c.perMessage.every(Boolean));
  assert.equal(await verifyReport(r), true);
});

test("an edited message fails both the digest and its own fingerprint", async () => {
  const r = sample();
  r.incidents[1]!.text = "hi";
  const c = await checkReport(r);
  assert.equal(c.digestOk, false);
  assert.deepEqual(c.perMessage.map((ok, i) => ok || i), c.perMessage.map((_, i) => (i === 1 ? 1 : true)));
  assert.equal(await verifyReport(r), false);
});

test("a changed count or a removed message fails the digest", async () => {
  const more = sample();
  more.conversation.days = 1;
  assert.equal((await checkReport(more)).digestOk, false);
  const fewer = sample();
  fewer.incidents.pop();
  assert.equal((await checkReport(fewer)).digestOk, false);
});

test("files that aren't Ward reports get a plain reason", () => {
  assert.match(problem(null)!, /isn't a Ward report/);
  assert.match(problem({ schema: "other/v9" })!, /schema: other\/v9/);
  assert.match(problem({ schema: "ward.report/v2", conversation: {}, incidents: [], safety: {} })!, /integrity/);
  assert.equal(problem(sample()), null);
});

test("the child's answers are covered, the same as the engine says", async () => {
  for (const edit of [(r: WardReport) => (r.safety.inDangerNow = true), (r: WardReport) => r.wants.pop(), (r: WardReport) => (r.reporter.city = "Karachi")]) {
    const r = sample();
    edit(r);
    assert.equal((await checkReport(r)).digestOk, false);
    assert.equal(await verifyReport(r), false);
  }
});

test("a v1 report still opens and checks its messages", async () => {
  const r = sample();
  r.schema = "ward.report/v1";
  r.integrity.digest = createHash("sha256").update(JSON.stringify({ conversation: r.conversation, incidents: r.incidents })).digest("hex");
  assert.equal(problem(r), null);
  assert.equal((await checkReport(r)).digestOk, true);
  assert.equal(await verifyReport(r), true);
});

// A small model flags one message, with nothing in the group chat to back it up: Ward isn't
// sure of it, so it goes in the report's "unconfirmed" list.
const lite: Judge = {
  name: "Ward Lite",
  async judge(c: Chat) {
    const out = new Map<number, ModelJudgement>();
    for (const m of c.messages)
      if (m.text.includes("dhoondh")) out.set(m.id, { hostile: true, severity: 3, categories: ["threat"], why: "Ward Lite reads this", model: "Ward Lite", authority: "raise-only" });
    return out;
  },
};
async function withUnconfirmed(): Promise<WardReport> {
  const chat = parseChat("Bilal: ayesha moti bhains\nZara: kal test hai\nHira: kal cricket?\nAyesha: haan\nZara: main bhi\nHira: theek hai\nAyesha: ok\nHamza: dhoondh lunga tujhe mele me\nAyesha: haha ok");
  const analysis = await analyze(chat, { self: "Ayesha", judges: [lite] });
  const r = await buildReport({ chat, analysis, fingerprints: await fingerprintMessages(chat), savedAt: new Date("2026-10-15T10:00:00Z"), title: "t", platform: "WhatsApp", reporter: {}, inDangerNow: null, wants: [], recipient: "helpline" });
  return JSON.parse(JSON.stringify(r));
}

test("the committed sample has no unconfirmed list and its digest text is unchanged", async () => {
  const r = sample();
  assert.ok(!("unconfirmed" in r));
  const { createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents } = r;
  const before = JSON.stringify({ createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents, savedAt: r.integrity.savedAt });
  assert.equal(digestText(r), before);
  assert.equal(engineDigestText(r), before);
  assert.equal(createHash("sha256").update(before).digest("hex"), r.integrity.digest);
});

test("unconfirmed messages are checked the same as the engine checks them", async () => {
  const r = await withUnconfirmed();
  assert.equal(r.unconfirmed!.length, 1);
  assert.equal(digestText(r), engineDigestText(r));
  assert.deepEqual(await checkReport(r), await engineCheck(r));
  assert.deepEqual((await checkReport(r)).unconfirmed, [true]);
  assert.equal(problem(r), null);

  const edited = await withUnconfirmed();
  edited.unconfirmed![0]!.text = "see you at the fair";
  const c = await checkReport(edited);
  assert.equal(c.digestOk, false);
  assert.deepEqual(c.unconfirmed, [false]);
  assert.deepEqual(c, await engineCheck(edited));

  const dropped = await withUnconfirmed();
  delete dropped.unconfirmed;
  assert.equal((await checkReport(dropped)).digestOk, false);
  assert.equal(await verifyReport(dropped), false);

  assert.match(problem({ ...r, unconfirmed: {} })!, /unconfirmed/);
});
