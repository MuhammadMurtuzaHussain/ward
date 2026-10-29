import { test } from "node:test";
import assert from "node:assert/strict";
import { STORIES, STORIES_UR, UNITS, storiesFor, type Story } from "./index.ts";

/** Every path from the start reaches an ending, with no loops and no dead links. */
function walk(s: Story) {
  const seen = new Set<string>();
  const go = (id: string, path: string[]) => {
    const scene = s.scenes[id];
    assert.ok(scene, `${s.id}: "${path.at(-1)}" leads to missing scene "${id}"`);
    assert.ok(!path.includes(id), `${s.id}: loop through "${id}"`);
    seen.add(id);
    assert.ok(!!scene.end !== !!scene.choices?.length, `${s.id}/${id}: a scene has choices or an ending, not both or neither`);
    for (const c of scene.choices ?? []) go(c.next, [...path, id]);
  };
  go(s.start, []);
  assert.deepEqual([...seen].sort(), Object.keys(s.scenes).sort(), `${s.id}: unreachable scenes`);
}

test("every story is a well-formed branching path", () => {
  for (const s of STORIES) {
    walk(s);
    const ends = Object.values(s.scenes).flatMap((x) => (x.end ? [x.end.tone] : []));
    assert.ok(ends.includes("kind"), `${s.id}: needs at least one kind ending`);
    assert.ok(UNITS.some((u) => u.id === s.unit), `${s.id}: unknown unit ${s.unit}`);
  }
});

test("every age band has a story", () => {
  for (const age of ["8", "11", "14"] as const) assert.ok(storiesFor(age).length >= 1, `no story for ${age}`);
});

test("the reader is never named or gendered", () => {
  for (const s of STORIES)
    for (const [id, scene] of Object.entries(s.scenes))
      for (const l of scene.lines.filter((l) => !l.me && !l.from))
        assert.doesNotMatch(l.text, /\b(he|she|him|her|boy|girl)\b.*\byou\b|\byou(r)? (son|daughter)\b/i, `${s.id}/${id}`);
});

test("Urdu stories match the English ones exactly in structure", () => {
  const shape = (xs: Story[]) =>
    xs.map((s) => [s.id, s.unit, s.ages, s.start, Object.entries(s.scenes).map(([id, x]) => [id, x.lines.map((l) => [!!l.me, l.from ?? null]), x.choices?.map((c) => c.next) ?? null, x.end?.tone ?? null])]);
  assert.deepEqual(shape(STORIES_UR), shape(STORIES));
  for (const xs of [STORIES, STORIES_UR]) assert.ok(!JSON.stringify(xs).includes("—"), "no em dashes");
});
