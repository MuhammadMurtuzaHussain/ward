import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyze, normalize, PackMatcher, parseChat } from "./index.ts";

const fixture = (name: string) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");

test("normalize folds the ways kids dodge filters", () => {
  assert.equal(normalize("L00SER"), "looser");
  assert.equal(normalize("kuttaaaaa"), "kuttaa");
  assert.equal(normalize("s.t.u.p.i.d"), "stupid");
  assert.equal(normalize("b​itch"), "bitch");
  assert.equal(normalize("score 100"), "score 100");
});

test("packs match spelling variants, phrases, and other scripts", () => {
  const p = new PackMatcher();
  assert.deepEqual(p.match("tu kutte jaisa hai").map((h) => h.term), ["kutta"]);
  assert.deepEqual(p.match("bewkuf ladka").map((h) => h.term), ["bewakoof"]);
  assert.deepEqual(p.match("you fat pig").map((h) => h.term), ["fat pig"]);
  assert.deepEqual(p.match("তুই মরে যা").map((h) => h.category), ["selfharm"]);
  assert.deepEqual(p.match("I'll post it tonight").map((h) => h.category), ["exposure"]);
  assert.equal(p.match("my kitty is cute").length, 0);
  assert.equal(p.match("this lemon is sour").length, 0);
});

test("parses an Android WhatsApp export with group events", () => {
  const chat = parseChat(fixture("pileon-roman-urdu.txt"));
  assert.equal(chat.source, "whatsapp");
  assert.equal(chat.messages.length, 16);
  assert.deepEqual(chat.events.filter((e) => e.kind === "added").map((e) => e.who), ["Shadow_786", "xx.ghost.xx"]);
  assert.equal(chat.messages[0]!.at!.getDate(), 12);
  assert.equal(chat.messages[0]!.at!.getMonth(), 9);
});

test("parses iPhone and 12-hour US exports", () => {
  const ios = parseChat(fixture("banter-friends.txt"));
  assert.equal(ios.messages.length, 5);
  assert.equal(ios.messages[0]!.at!.getHours(), 16);
  const us = parseChat(fixture("dm-english.txt"));
  assert.equal(us.messages.length, 7);
  assert.equal(us.messages[3]!.at!.getHours(), 23);
  assert.equal(us.messages[3]!.at!.getDate(), 3);
});

test("pasted text without timestamps still works", () => {
  const chat = parseChat("Ali: hi\nSara: you're so dumb\nAli: why");
  assert.equal(chat.source, "paste");
  assert.deepEqual(chat.participants.sort(), ["Ali", "Sara"]);
});

test("a Roman Urdu pile-on is bullying, with danger, ghosts, and the night pattern", async () => {
  const a = await analyze(parseChat(fixture("pileon-roman-urdu.txt")), { self: "Ayesha" });
  assert.equal(a.level, "urgent");
  const kinds = a.patterns.map((p) => p.kind);
  for (const k of ["danger", "pileon", "ghosts", "exclusion", "nightwatch", "campaign"]) assert.ok(kinds.includes(k as never), `missing ${k}`);
  assert.deepEqual(a.patterns.find((p) => p.kind === "ghosts")!.senders.sort(), ["Shadow_786", "xx.ghost.xx"]);
  // Zara stood up for Ayesha: she must not show up as a bully.
  assert.equal(a.senders.find((s) => s.name === "Zara")!.hostile, 0);
});

test("friends teasing each other stays calm without a pattern", async () => {
  const a = await analyze(parseChat(fixture("banter-friends.txt")), { self: "Saad" });
  assert.ok(a.level === "watch" || a.level === "calm", a.level);
  assert.equal(a.patterns.length, 0);
});

test("an English DM with sextortion and kys is urgent", async () => {
  const a = await analyze(parseChat(fixture("dm-english.txt")), { self: "Sam" });
  assert.equal(a.level, "urgent");
  const danger = a.patterns.find((p) => p.kind === "danger")!;
  assert.match(danger.summary, /share photos|hurt yourself/);
});

test("a model that reads banter as friendly turns the pack hits off", async () => {
  const chat = parseChat(fixture("banter-friends.txt"));
  const friendly = {
    name: "test",
    async judge() {
      return new Map(chat.messages.map((m) => [m.id, { hostile: false, severity: 0 as const, categories: [], model: "test" }]));
    },
  };
  const a = await analyze(chat, { self: "Saad", judges: [friendly] });
  assert.equal(a.level, "calm");
});

test("everyday Roman Urdu and English words don't trip the pack", () => {
  const p = new PackMatcher();
  for (const s of ["is saal exam mushkil tha", "kal chuti hai", "kapre gande ho gaye", "big sale this weekend", "load ho raha hai", "kal milte hain", "ammi ne khana banaya"]) {
    assert.deepEqual(p.match(s), [], s);
  }
});
