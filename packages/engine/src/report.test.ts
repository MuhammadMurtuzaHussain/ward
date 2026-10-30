import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { analyze, buildReport, checkReport, fingerprintMessages, parseChat, reportProblem, verifyReport } from "./index.ts";

const chat = parseChat(readFileSync(new URL("../fixtures/pileon-roman-urdu.txt", import.meta.url), "utf8"));

async function report() {
  const analysis = await analyze(chat, { self: "Ayesha" });
  return buildReport({
    chat,
    analysis,
    fingerprints: await fingerprintMessages(chat),
    savedAt: new Date("2026-10-15T10:00:00Z"),
    title: "8B Science",
    platform: "WhatsApp",
    reporter: { firstName: "Ayesha", ageBand: "11", city: "  " },
    inDangerNow: false,
    wants: ["stop", "school"],
    recipient: "helpline",
  });
}

test("a report has what a helpline needs to act", async () => {
  const r = await report();
  assert.equal(r.schema, "ward.report/v2");
  assert.equal(r.safety.level, "urgent");
  assert.ok(r.safety.dangerous.includes("selfharm"));
  assert.deepEqual(r.wants.map((w) => w.id), ["stop", "school"]);
  assert.equal(r.conversation.days, 3);
  assert.ok(r.incidents.every((i) => /^[0-9a-f]{64}$/.test(i.sha256)));
  assert.ok(!r.incidents.some((i) => i.from === "Ayesha" || i.from === "Zara"), "the child and the upstander aren't incidents");
  const ghost = r.accounts.find((x) => x.name === "xx.ghost.xx")!;
  assert.ok(ghost.addedDuringChat && ghost.onlyAttacked);
  // Written for a caseworker, not to the child.
  for (const p of r.patterns) assert.doesNotMatch(p.fact, /\byou(r)?\b/i, p.fact);
});

test("blank details the child left empty are dropped", async () => {
  const r = await report();
  assert.deepEqual(r.reporter, { firstName: "Ayesha", ageBand: "11" });
});

test("the digest catches an edited message", async () => {
  const r = await report();
  assert.ok(await verifyReport(r));
  r.incidents[0]!.text = "something nicer";
  assert.ok(!(await verifyReport(r)));
});

test("checkReport pins an edit to the message it touched", async () => {
  const r = await report();
  const clean = await checkReport(r);
  assert.ok(clean.digestOk && clean.perMessage.every(Boolean));
  r.incidents[2]!.text += "!";
  const c = await checkReport(r);
  assert.equal(c.digestOk, false);
  assert.deepEqual(c.perMessage.map((ok, i) => ok || i), c.perMessage.map((_, i) => (i === 2 ? 2 : true)));
  assert.equal(reportProblem(r), null);
  assert.equal(reportProblem({ schema: "x" }), "schema");
  assert.equal(reportProblem(null), "not-report");
  assert.equal(reportProblem({ hello: 1 }), "not-report");
});

test("the digest covers the child's own answers too", async () => {
  const edits: ((r: Awaited<ReturnType<typeof report>>) => void)[] = [
    (r) => (r.safety.inDangerNow = true),
    (r) => (r.safety.level = "calm"),
    (r) => r.wants.pop(),
    (r) => (r.recipient = "police"),
    (r) => (r.reporter.firstName = "Someone"),
    (r) => (r.accounts[0]!.hurtfulMessages = 9),
    (r) => r.patterns.pop(),
    (r) => (r.integrity.savedAt = "2026-10-20T10:00:00.000Z"),
  ];
  for (const edit of edits) {
    const r = await report();
    edit(r);
    assert.ok(!(await verifyReport(r)), String(edit));
  }
  // Key order in the file doesn't matter, only the values.
  const r = await report();
  const shuffled = Object.fromEntries(Object.entries(r).reverse()) as typeof r;
  assert.ok(await verifyReport(JSON.parse(JSON.stringify(shuffled))));
});

test("a v1 report, whose digest covers only the messages, still checks", async () => {
  const r = await report();
  r.schema = "ward.report/v1";
  r.integrity.digest = createHash("sha256").update(JSON.stringify({ conversation: r.conversation, incidents: r.incidents })).digest("hex");
  assert.equal(reportProblem(r), null);
  assert.ok(await verifyReport(r));
  r.safety.inDangerNow = true; // not covered in v1
  assert.ok(await verifyReport(r));
  r.incidents[0]!.text = "x";
  assert.ok(!(await verifyReport(r)));
});
