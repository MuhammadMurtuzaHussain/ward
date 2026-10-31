import { test } from "node:test";
import assert from "node:assert/strict";
import { b64, derive, open, seal, unb64 } from "./vaultSeal.ts";

// A long class group: 2,000 messages, mixed English, Urdu and emoji, like a real export.
function longChat() {
  const lines = ["kal test hai kya?", "یہ مذاق نہیں تھا 😂", "nobody likes you here", "ok see you tomorrow", "کس نے یہ تصویر بھیجی؟"];
  const messages = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    at: new Date(Date.UTC(2026, 9, 1, 8, 0, i)).toISOString(),
    sender: `Classmate ${i % 37}`,
    text: `${lines[i % lines.length]} (${i})`,
    media: i % 50 === 0,
  }));
  return { id: "long-1", savedAt: 1790000000000, title: "Class 7B", self: "Classmate 0", chat: { source: "whatsapp", messages, events: [], participants: [] }, fingerprints: messages.map((m) => "f".repeat(64) + m.id) };
}

test("a 2,000-message chat seals and opens again", async () => {
  const k = await derive("2580", crypto.getRandomValues(new Uint8Array(16)));
  const json = JSON.stringify(longChat());
  const sealed = await seal(k, json);
  // Well past the ~120 KB where the old one-shot encoder threw.
  assert.ok(unb64(sealed.split(".")[1]!).length > 300_000, `${sealed.length} chars sealed`);
  assert.equal(await open(k, sealed), json);
});

test("the chunked encoder writes exactly what the old one did", () => {
  const old = (b: Uint8Array) => btoa(String.fromCharCode(...b));
  for (const n of [0, 1, 2, 3, 12, 16, 0x7fff, 0x8000, 0x8001, 0x8000 * 2 + 5]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 131 + 7) & 0xff);
    assert.equal(b64(bytes), old(bytes), `${n} bytes`);
    assert.deepEqual(unb64(b64(bytes)), bytes);
  }
});

// Sealed with the vault.ts code from before the fix, PIN 2580. Rows like these are already on
// children's phones; they have to keep opening.
const OLD = {
  salt: "4oRB/8PTo6dKLU9KPPaVaQ==",
  check: "Os2p4O1KdvL5yTZx.fVJrjBvx3KE3Kaz2NUwLn+10BN0=",
  row: "oZeeK8/x0yBuCwP7.NpW01GHUV/dEDIUjk9x8Voj2C8243Fbe7WTK5eB0KbF7SIWuYrMwENMafAlxfRKsL/M3PpXgN6ex3m33jWMAPwTvlRmJi3HHqpOLv5BCS3oe6kdBGuhF+hPFYGQaZQDcv+rTncLEE4WU9nmqxbEJSEtPSH6iMBeW/6gBtu0vgEWvhVzVU9aEVDjVUccjDotpHuuZEePuXTXX5PQTSpNNyvpBrLDXJi0kul9hxCs5PvQUVa5ZV1PFhQzUyL7+svLKT6NbBNnfvj9rLXvPTvqUuRoY/m6cqKbN6vfLAUvv9Y5TKXyqB6ZGkxDR0K4=",
};

test("a vault saved in the old format still unlocks and opens", async () => {
  const k = await derive("2580", unb64(OLD.salt));
  assert.equal(await open(k, OLD.check), "ward");
  const item = JSON.parse(await open(k, OLD.row));
  assert.equal(item.id, "old-1");
  assert.equal(item.chat.messages[0].text, "یہ مذاق نہیں تھا 😂");
});

test("the wrong PIN still can't open it", async () => {
  const k = await derive("1111", unb64(OLD.salt));
  await assert.rejects(open(k, OLD.check));
});
