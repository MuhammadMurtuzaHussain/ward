import { test } from "node:test";
import assert from "node:assert/strict";
import { KEEP_MAX, neutral, recorded } from "./history.ts";

const NOW = Date.UTC(2026, 9, 31, 12);
const day = 86_400_000;

test("an old list loses its chat names and verdicts", () => {
  const old = [
    { id: "a", at: NOW - day, title: "Bilal", level: "urgent", hostile: 4, saved: true },
    { id: "b", at: NOW - 2 * day, title: "Class 7B", level: "bullying", hostile: 2, saved: false },
  ];
  const out = neutral(old as never, NOW);
  assert.deepEqual(out, [
    { id: "a", at: NOW - day, saved: true },
    { id: "b", at: NOW - 2 * day, saved: false },
  ]);
  const stored = JSON.stringify(out);
  for (const word of ["Bilal", "7B", "urgent", "bullying", "title", "level", "hostile"]) assert.ok(!stored.includes(word), word);
});

test("lines older than 30 days drop off; the list stays short", () => {
  const list = Array.from({ length: 80 }, (_, i) => ({ id: String(i), at: NOW - i * 3_600_000, saved: false }));
  assert.equal(neutral(list, NOW).length, KEEP_MAX);
  assert.deepEqual(neutral([{ id: "x", at: NOW - 31 * day, saved: true }], NOW), []);
});

test("a new check goes on top, with nothing but when", () => {
  const out = recorded([{ id: "a", at: NOW - day, saved: true }], "b", NOW);
  assert.deepEqual(out[0], { id: "b", at: NOW, saved: false });
  assert.equal(out.length, 2);
});

test("broken rows are dropped instead of crashing Home", () => {
  assert.deepEqual(neutral([{ id: "a" }, { at: NOW }, null as never].filter(Boolean), NOW), []);
  assert.deepEqual(neutral(undefined, NOW), []);
});
