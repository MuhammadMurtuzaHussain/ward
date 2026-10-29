import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyTally, score, totalsCsv, type KitClass } from "./kitResults.ts";

function klass(): KitClass {
  const before = emptyTally(), after = emptyTally();
  before.sheets = after.sheets = 20;
  before.a[0] = [8, 10, 2]; after.a[0] = [5, 14, 1]; // picked on: 40% -> 25%
  before.tell = [3, 9, 8]; after.tell = [6, 6, 8]; // of those it happened to: 25% -> 50%
  before.b[3] = [4, 6, 6, 4]; after.b[3] = [1, 3, 8, 8]; // knows an adult: 50% -> 80%
  after.used = [12, 8];
  return { id: "x", name: "7B, \"blue\"", taught: [], before, after };
}

test("each row is the share giving the answer that matters", () => {
  const rows = Object.fromEntries(score(klass()).map((r) => [r.id, r]));
  assert.deepEqual([rows.a1!.before, rows.a1!.after, rows.a1!.lowerIsBetter], [40, 25, true]);
  assert.deepEqual([rows.tell!.before, rows.tell!.after], [25, 50], "\"nothing happened\" is left out");
  assert.deepEqual([rows.b4!.before, rows.b4!.after, rows.b4!.lowerIsBetter], [50, 80, false]);
  assert.deepEqual([rows.used!.before, rows.used!.after], [null, 60]);
  assert.equal(rows.b1!.before, null, "no answers yet means no number, not 0%");
});

test("the CSV holds only totals, quoted safely", () => {
  const csv = totalsCsv([klass()]);
  assert.match(csv.split("\n")[0]!, /^class,round,sheets,question,option,count$/);
  assert.ok(csv.includes('"7B, ""blue""",before,20,a1,0,8'));
  assert.ok(!csv.includes("parts") || csv.split("\n").filter((l) => l.includes(",parts,")).every((l) => l.includes(",after,")));
});
