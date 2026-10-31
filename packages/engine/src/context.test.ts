import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, buildReport, parseChat, type Chat, type Judge, type ModelJudgement, type SecondLook } from "./index.ts";

/** A stand-in for Ward Lite: flags exactly the messages given, raise-only, dangerous by default. */
function smallModel(flag: (text: string) => boolean, severity: 2 | 3 = 3): Judge {
  return {
    name: "Ward Lite",
    async judge(chat: Chat) {
      const out = new Map<number, ModelJudgement>();
      for (const m of chat.messages)
        if (flag(m.text)) out.set(m.id, { hostile: true, severity, categories: [], why: "Ward Lite reads this", model: "Ward Lite", authority: "raise-only" });
      return out;
    },
  };
}

// A group chat: in a one-to-one chat a dangerous flag needs no backing (see below).
const friendly = parseChat(`Zara: kal school ke baad cricket?
Hira: main bhi aaungi
Ayesha: haan pakka
Zara: dhoondh lunga tujhe mele me 😂
Ayesha: ok see you tomorrow`);

test("a small-model flag in friendly chat is unsure: shown, but no alarm and no report", async () => {
  const a = await analyze(friendly, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))] });
  const f = a.findings.find((x) => x.message.text.includes("dhoondh"))!;
  assert.equal(f.severity, 3);
  assert.equal(f.unsure, true);
  assert.equal(a.level, "calm");
  assert.ok(!a.patterns.some((p) => p.kind === "danger"));
  const r = await buildReport({ chat: friendly, analysis: a, fingerprints: [], savedAt: new Date(), title: "t", platform: "WhatsApp", reporter: {}, inDangerNow: null, wants: [], recipient: "adult" });
  assert.equal(r.incidents.length, 0);
});

test("the chat backs a small-model flag up: hurtful words nearby, or the child reacting", async () => {
  const pileOn = parseChat(`Bilal: ayesha moti bhains
Hamza: dhoondh lunga tujhe kal
Ayesha: ok`);
  const a = await analyze(pileOn, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))] });
  assert.equal(a.findings[1]!.unsure, undefined);
  assert.equal(a.level, "urgent");

  const hurt = parseChat(`Hamza: dhoondh lunga tujhe kal
Ayesha: please stop`);
  const b = await analyze(hurt, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))] });
  assert.equal(b.findings[0]!.unsure, undefined);
  assert.equal(b.level, "urgent");
});

test("a second look with context can clear a small-model flag, never the word lists", async () => {
  const asked: number[][] = [];
  const look = (hostile: boolean, canClear = true): SecondLook => ({
    name: "Gemma 4 E4B",
    canClear,
    async review(_chat, ids) {
      asked.push(ids);
      return new Map(ids.map((id) => [id, { hostile, why: hostile ? "A threat to find them." : "Friends planning to meet at the fair." }]));
    },
  });
  const chat = parseChat(`Bilal: ayesha moti bhains
Zara: dhoondh lunga tujhe mele me 😂`);
  const a = await analyze(chat, { self: "Ayesha", judges: [smallModel(() => true, 2)], secondLook: look(false) });
  assert.deepEqual(asked.at(-1), [1], "only the message with no word-list hit is asked about");
  assert.ok(a.findings[0]!.severity > 0 && !a.findings[0]!.secondLook, "the word lists' finding stands, unasked");
  assert.equal(a.findings[1]!.severity, 0);
  assert.equal(a.findings[1]!.secondLook?.hostile, false);

  const b = await analyze(friendly, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))], secondLook: look(true) });
  const f = b.findings.find((x) => x.message.text.includes("dhoondh"))!;
  assert.equal(f.unsure, undefined, "a bigger model's yes counts as backing");
  assert.equal(b.level, "urgent");

  // A model that may only confirm (the phone's E2B): its "no" changes nothing.
  const c = await analyze(friendly, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))], secondLook: look(false, false) });
  const g = c.findings.find((x) => x.message.text.includes("dhoondh"))!;
  assert.equal(g.severity, 3);
  assert.equal(g.secondLook, undefined);
  assert.equal(g.unsure, true, "the context rules still decide");
});

test("a lone dangerous message one to one is never 'unsure', even if the child didn't reply", async () => {
  const dm = parseChat(`Kai: send pics or everyone sees the screenshots
Kai: 1 hour`);
  const a = await analyze(dm, { self: "Sam", judges: [smallModel((t) => t.startsWith("send pics"))] });
  assert.equal(a.findings[0]!.unsure, undefined);
  assert.equal(a.level, "urgent");
});

test("a second look can make Ward unsure of a dangerous flag, never clear it", async () => {
  const look: SecondLook = { name: "Gemma 4 E4B", canClear: true, review: async (_c, ids) => new Map(ids.map((id) => [id, { hostile: false }])) };
  const a = await analyze(friendly, { self: "Ayesha", judges: [smallModel((t) => t.includes("dhoondh"))], secondLook: look });
  const f = a.findings.find((x) => x.message.text.includes("dhoondh"))!;
  assert.equal(f.severity, 3);
  assert.equal(f.unsure, true);
});

test("messages the child picked on purpose don't need context", async () => {
  const one = parseChat(`Kai: dhoondh lunga tujhe`);
  const a = await analyze(one, { self: null, judges: [smallModel(() => true)], requireContext: false });
  assert.equal(a.findings[0]!.unsure, undefined);
  const b = await analyze(one, { self: null, judges: [smallModel(() => true)] });
  assert.equal(b.findings[0]!.unsure, true);
});
