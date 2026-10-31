import { test } from "node:test";
import assert from "node:assert/strict";
import { correctedView, correctionsFile, isDangerous, MAX_CORRECTIONS, withCorrection, type Correction } from "./corrections.ts";

const said = (kind: Correction["kind"], at = 1, category?: Correction["category"]): Correction => ({
  kind,
  ...(category ? { category } : {}),
  at,
  ward: { severity: 2, categories: ["insult"], by: "word lists" },
});

test("\"not mean\" quiets an ordinary insult", () => {
  const v = correctedView({ severity: 2, categories: ["insult"] }, said("fine"));
  assert.deepEqual(v, { softened: true, gated: false, keepWarning: false });
});

test("the safety gate: \"not mean\" never hides a dangerous message", () => {
  const dangerous = [
    { severity: 3 as const, categories: ["insult" as const] },
    { severity: 2 as const, categories: ["threat" as const] },
    { severity: 1 as const, categories: ["selfharm" as const] },
    { severity: 2 as const, categories: ["mockery" as const, "sexual" as const] },
    { severity: 2 as const, categories: ["exposure" as const] },
  ];
  for (const f of dangerous) {
    assert.ok(isDangerous(f));
    for (const c of [said("fine"), said("kind", 1, "insult"), said("worse")]) {
      const v = correctedView(f, c);
      assert.equal(v.softened, false, `${c.kind} softened ${JSON.stringify(f)}`);
      assert.equal(v.keepWarning, true);
    }
    assert.equal(correctedView(f, said("fine")).gated, true, "the child is told why the help stays");
  }
});

test("other corrections keep Ward's note and never soften", () => {
  for (const c of [said("worse"), said("kind", 1, "appearance")]) assert.deepEqual(correctedView({ severity: 1, categories: ["insult"] }, c), { softened: false, gated: false, keepWarning: true });
  assert.deepEqual(correctedView({ severity: 1, categories: ["insult"] }, undefined), { softened: false, gated: false, keepWarning: true });
});

test("corrections are kept newest first, capped, and can be undone", () => {
  let all: Record<string, Correction> = {};
  for (let i = 0; i < MAX_CORRECTIONS + 5; i++) all = withCorrection(all, `fp${i}`, said("fine", i));
  assert.equal(Object.keys(all).length, MAX_CORRECTIONS);
  assert.ok(!("fp0" in all) && "fp504" in all, "the oldest go first");
  all = withCorrection(all, "fp504", null);
  assert.ok(!("fp504" in all));
});

test("the shared file has no words unless the child asks, and never names, times or fingerprints", () => {
  const items = [
    { correction: said("fine", 5), text: "lol you're so slow" },
    { correction: said("kind", 6, "appearance"), text: "moti" },
  ];
  const plain = correctionsFile(items, { includeText: false, language: "en", wordLists: ["en"] });
  const json = JSON.stringify(plain);
  assert.ok(!json.includes("slow") && !json.includes("moti"));
  assert.ok(!/"at"|sender|fp|sha|time/i.test(json), json);
  assert.deepEqual(plain.corrections[1], { childSaid: "kind", category: "appearance", ward: { severity: 2, categories: ["insult"], by: "word lists" } });
  assert.equal(plain.corrections[0]!.category, undefined);

  const withText = correctionsFile(items, { includeText: true, language: "en", wordLists: ["en"] });
  assert.equal(withText.corrections[0]!.text, "lol you're so slow");
});
