import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyze, parseChat, selfDistress } from "./index.ts";

interface Case {
  id: string;
  lang: string;
  distress: boolean;
  text: string;
  note: string;
  review?: "native-speaker";
}

const cases: Case[] = readFileSync(new URL("../../../eval/distress/cases.jsonl", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

test("the first-person distress set: every disclosure is heard, every near miss is left alone", () => {
  for (const c of cases) assert.equal(!!selfDistress(c.text), c.distress, `${c.id}: ${c.text} (${c.note})`);
});

test("the distress set covers every language, both ways, and marks what needs a native speaker", () => {
  for (const lang of ["en", "ur-Latn", "ur", "hi-Latn", "bn", "bn-Latn"]) {
    assert.ok(cases.some((c) => c.lang === lang && c.distress), `${lang} has no disclosure`);
    assert.ok(cases.some((c) => c.lang === lang && !c.distress), `${lang} has no near miss`);
  }
  for (const c of cases) if (c.lang !== "en") assert.equal(c.review, "native-speaker", `${c.id} isn't marked for review`);
});

test("the child's own distress is its own signal: no level, no pattern, nobody counted as hostile", async () => {
  const chat = parseChat("Sam: how was school\nMe: honestly i just want to die\nSam: what? are you ok\nMe: i dont know");
  const a = await analyze(chat, { self: "Me" });
  assert.deepEqual(a.selfDistress, [1]);
  assert.equal(a.findings[1]!.distress?.lang, "en");
  assert.equal(a.level, "calm");
  assert.deepEqual(a.patterns, []);
  assert.ok(a.senders.every((s) => s.hostile === 0));
});

test("someone else's distress is marked on their message, but isn't the child's", async () => {
  const chat = parseChat("Sam: i want to kill myself\nMe: sam please talk to me");
  const a = await analyze(chat, { self: "Me" });
  assert.equal(a.findings[0]!.distress?.lang, "en");
  assert.deepEqual(a.selfDistress, []);
  assert.deepEqual((await analyze(chat, { self: null })).selfDistress, [], "checking for a friend: there is no \"own\" message");
});
