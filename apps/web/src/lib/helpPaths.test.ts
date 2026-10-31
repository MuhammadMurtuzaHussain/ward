import { test } from "node:test";
import assert from "node:assert/strict";
import type { Category, Level, PatternKind, Severity } from "@ward/engine";
import { correctionHelp, helpPlan, historyLevel, unsureDanger, type AnalysisLike } from "./helpPaths.ts";
import type { Correction } from "./corrections.ts";

const f = (sender: string, severity: Severity, opts: { unsure?: boolean; categories?: Category[] } = {}) => ({
  message: { sender },
  severity,
  categories: opts.categories ?? [],
  ...(opts.unsure ? { unsure: true } : {}),
});
const chat = (level: Level, findings: ReturnType<typeof f>[], patterns: PatternKind[] = []): AnalysisLike => ({ level, findings, patterns: patterns.map((kind) => ({ kind })) });
const said = (kind: Correction["kind"], category?: Category): Correction => ({ kind, ...(category ? { category } : {}), at: 1, ward: { severity: 2, categories: ["insult"], by: "Ward Lite" } });

// A lone threat only Ward Lite caught: no categories, unsure, level stays calm.
const loneThreat = chat("calm", [f("Sam", 0), f("Sam", 3, { unsure: true }), f("Me", 0)]);

test("an unconfirmed danger gets the full help, labelled unconfirmed", () => {
  for (const age of ["8", "11", "14"] as const) {
    const p = helpPlan(loneThreat, { self: "Me", age, refining: false });
    assert.equal(p.verdict, "unsure");
    assert.equal(p.helpNow, true, "HelpNow is never hidden");
    assert.equal(p.unconfirmed, true);
    assert.equal(p.images, true, "Ward Lite gives no categories, so Take It Down is offered");
    assert.equal(p.coach, true);
    assert.equal(p.practise, false, "never \"practise\" over a possible danger");
    assert.equal(p.stillWrong, true);
    assert.equal(p.plan, age === "14");
  }
  assert.equal(helpPlan(loneThreat, { self: null, age: "14", refining: false }).plan, false, "the safety plan is for the child's own chat");
});

test("the child's own unsure message isn't an unconfirmed danger from someone else", () => {
  const own = chat("calm", [f("Me", 3, { unsure: true })]);
  assert.equal(unsureDanger(own, "Me"), false);
  assert.equal(helpPlan(own, { self: "Me", age: "11", refining: false }).verdict, "calm");
});

test("a confirmed danger shows HelpNow without the unconfirmed label, Take It Down only for images", () => {
  const threat = chat("urgent", [f("Sam", 3, { categories: ["threat"] })], ["danger"]);
  const p = helpPlan(threat, { self: "Me", age: "11", refining: false });
  assert.deepEqual([p.verdict, p.helpNow, p.unconfirmed, p.images, p.coach, p.stillWrong], ["urgent", true, false, false, true, false]);
  const photos = chat("urgent", [f("Sam", 3, { categories: ["sexual"] })], ["danger"]);
  assert.equal(helpPlan(photos, { self: "Me", age: "11", refining: false }).images, true);
});

test("a calm or watch verdict is held while the deeper read runs; bullying and urgent show at once", () => {
  for (const level of ["calm", "watch"] as const) {
    const p = helpPlan(chat(level, [f("Sam", level === "watch" ? 1 : 0)]), { self: "Me", age: "8", refining: true });
    assert.equal(p.verdict, "hold");
    assert.equal(p.practise, false, "no \"practise\" before Ward has finished");
    assert.equal(p.stillWrong, true, "the door to help stays open while Ward reads");
  }
  for (const level of ["bullying", "urgent"] as const) assert.equal(helpPlan(chat(level, [f("Sam", 2)]), { self: "Me", age: "8", refining: true }).verdict, level);
  assert.equal(helpPlan(loneThreat, { self: "Me", age: "8", refining: true }).verdict, "unsure", "an unsure danger is never held back as \"reading\"");
});

test("every calm and watch result keeps the quiet \"It still feels wrong\" door", () => {
  const calm = helpPlan(chat("calm", [f("Sam", 0)]), { self: "Me", age: "8", refining: false });
  assert.deepEqual([calm.verdict, calm.stillWrong, calm.practise, calm.coach, calm.helpNow], ["calm", true, true, false, false]);
  const watch = helpPlan(chat("watch", [f("Sam", 1)]), { self: null, age: "14", refining: false });
  assert.deepEqual([watch.stillWrong, watch.coach], [true, true]);
});

test("a correction only adds help: \"worse\" and the dangerous kinds, never the ordinary ones", () => {
  assert.deepEqual(correctionHelp(said("worse"), false), { help: true, images: false });
  for (const k of ["threat", "selfharm"] as const) assert.deepEqual(correctionHelp(said("kind", k), false), { help: true, images: false });
  for (const k of ["sexual", "exposure"] as const) assert.deepEqual(correctionHelp(said("kind", k), false), { help: true, images: true });
  for (const k of ["insult", "appearance", "exclusion"] as const) assert.equal(correctionHelp(said("kind", k), false).help, false);
  assert.equal(correctionHelp(said("fine"), false).help, false);
  assert.equal(correctionHelp(said("fine"), true).help, true, "\"not mean\" on a dangerous message keeps the help close");
  assert.equal(correctionHelp(undefined, false).help, false);
});

test("a correction about images brings Take It Down to the top HelpNow, and never changes the verdict", () => {
  const p = helpPlan(loneThreat, { self: "Me", age: "11", refining: false, corrections: [said("fine")] });
  assert.equal(p.verdict, "unsure");
  assert.equal(p.helpNow, true);
  const threat = chat("urgent", [f("Sam", 3, { categories: ["threat"] })], ["danger"]);
  const q = helpPlan(threat, { self: "Me", age: "11", refining: false, corrections: [said("kind", "exposure")] });
  assert.deepEqual([q.verdict, q.images], ["urgent", true]);
});

test("history never remembers an unconfirmed danger as \"Looks okay\"", () => {
  assert.equal(historyLevel(loneThreat, "Me"), "watch");
  assert.equal(historyLevel(chat("calm", [f("Sam", 0)]), "Me"), "calm");
  assert.equal(historyLevel(chat("watch", [f("Sam", 3, { unsure: true })]), "Me"), "watch");
  assert.equal(historyLevel(chat("urgent", [f("Sam", 3)], ["danger"]), "Me"), "urgent");
});
