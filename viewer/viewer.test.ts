// The viewer's checks must agree with the engine's: run the <verify> block from
// ward-viewer.html against reports the engine builds, untouched and tampered.
// Run: node --test --experimental-strip-types viewer/viewer.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { verifyReport, type WardReport } from "../packages/engine/src/index.ts";

const html = readFileSync(new URL("./ward-viewer.html", import.meta.url), "utf8");
const block = html.match(/\/\* <verify>[\s\S]*?\/\* <\/verify> \*\//)![0];
const { checkReport, problem } = new Function(`${block}; return { checkReport, problem };`)() as {
  checkReport: (r: WardReport) => Promise<{ digestOk: boolean; perMessage: boolean[] }>;
  problem: (r: unknown) => string | null;
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
