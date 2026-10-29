import { test } from "node:test";
import assert from "node:assert/strict";
import { UNITS, nextLesson, unitsFor } from "./index.ts";

const lessons = UNITS.flatMap((u) => u.lessons);

test("lesson ids are unique", () => {
  assert.equal(new Set(lessons.map((l) => l.id)).size, lessons.length);
});

test("every exercise can be answered", () => {
  for (const l of lessons) {
    assert.ok(l.exercises.length >= 2, `${l.id} is too short`);
    for (const ex of l.exercises) {
      if (ex.kind === "choose") assert.equal(ex.options.filter((o) => o.right).length, 1, `${l.id}: one right option`);
      if (ex.kind === "spot") assert.ok(ex.chat.some((c) => c.flag), `${l.id}: spot needs a flagged line`);
      if (ex.kind === "sort") {
        assert.ok(ex.items.some((i) => i.bin === 0) && ex.items.some((i) => i.bin === 1), `${l.id}: both bins used`);
      }
    }
  }
});

test("no em dashes in anything a child reads", () => {
  assert.ok(!JSON.stringify(UNITS).includes("—"));
});

test("every age band has a path, and the teen-only lesson stays teen-only", () => {
  for (const age of ["8", "11", "14"] as const) assert.ok(unitsFor(age).length >= 6);
  assert.ok(!unitsFor("8").some((u) => u.lessons.some((l) => l.id === "lock-2")));
  assert.equal(nextLesson("11", [])?.lesson.id, "spot-1");
});

test("Urdu lessons match the English ones exactly in structure", async () => {
  const { UNITS_UR } = await import("./index.ts");
  assert.deepEqual(
    UNITS_UR.map((u) => [u.id, u.lessons.map((l) => [l.id, l.ages, l.exercises.map((e) => e.kind)])]),
    UNITS.map((u) => [u.id, u.lessons.map((l) => [l.id, l.ages, l.exercises.map((e) => e.kind)])]),
  );
  assert.ok(!JSON.stringify(UNITS_UR).includes("\u2014"));
});
