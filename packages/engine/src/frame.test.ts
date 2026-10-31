import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, needsSupport, parseChat } from "./index.ts";

test("someone quoting abuse to ask for help may need support, in every language", () => {
  for (const t of [
    "someone told me to kys and I can't stop thinking about it",
    "he keeps telling me to kill myself, what do i do",
    "they keep calling me a fat pig and i feel sick",
    "she said i should just die 😭",
    "usne mujhe bola mar ja, kya karun",
    "wo mujhe roz gaali deta hai, dar lagta hai",
    "আমাকে বলেছে মরে যা, কী করব",
    "amake boleche more ja, ki korbo",
  ])
    assert.equal(needsSupport(t), true, t);
});

test("a report with no sign of hurt or help-seeking, a bare \"someone said\", quotation marks or a threat never count", () => {
  for (const t of [
    "someone told me to kys",
    "someone said kys, what do i do lol",
    '"kys" 😭',
    "kys 😭",
    "someone told me to tell you to kys, what do i do",
    "send me pics or else, i'm scared you'll say no",
    "usne mujhe bola tu mar ja warna, kya karun",
  ])
    assert.equal(needsSupport(t), false, t);
});

test("in a checked chat, the person asking for help isn't counted as hostile, and may need support", async () => {
  const chat = parseChat("Sara: hamza told me to kys and i can't stop thinking about it\nMe: omg sara\nHamza: kys sara");
  const a = await analyze(chat, { self: "Me" });
  assert.deepEqual(a.support, [0]);
  assert.equal(a.findings[0]!.severity, 0);
  assert.equal(a.findings[0]!.support, true);
  assert.equal(a.senders.find((s) => s.name === "Sara")!.hostile, 0);
  assert.equal(a.findings[2]!.severity, 3, "the bully's own message stays dangerous");
  assert.equal(a.senders.find((s) => s.name === "Hamza")!.hostile, 1);
});

test("the child's own message quoting abuse isn't someone else needing support", async () => {
  const a = await analyze(parseChat("Me: he told me to kys, what do i do\nSam: block him and tell your mum"), { self: "Me" });
  assert.equal(a.findings[0]!.support, true, "so it never reads as the child being mean");
  assert.deepEqual(a.support, []);
});
