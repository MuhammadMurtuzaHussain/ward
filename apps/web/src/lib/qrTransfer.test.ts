import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeFrames, FrameCollector } from "./qrTransfer.ts";

const sample = readFileSync(new URL("../../../../viewer/sample-report.json", import.meta.url), "utf8");

test("a report survives the QR hand-over in any order, with repeats", async () => {
  const json = JSON.stringify(JSON.parse(sample));
  const frames = await encodeFrames(json);
  assert.ok(frames.length > 1 && frames.length < 12, `${frames.length} frames for ${json.length} chars`);
  const c = new FrameCollector();
  // The camera sees the loop out of order and catches some frames twice.
  for (const f of [...frames].reverse().concat(frames)) c.accept(f);
  assert.ok(c.done);
  assert.equal(await c.text(), json);
});

test("Urdu text and emoji come through intact", async () => {
  const json = JSON.stringify({ text: "یہ مذاق نہیں تھا 😂", n: 1 });
  const c = new FrameCollector();
  for (const f of await encodeFrames(json, 8)) c.accept(f);
  assert.equal(await c.text(), json);
});

test("a new session restarts collection; junk is ignored", async () => {
  const c = new FrameCollector();
  const a = await encodeFrames(JSON.stringify({ a: "x".repeat(2000) }), 100);
  c.accept(a[0]!);
  assert.equal(c.accept("https://example.com"), false);
  const b = await encodeFrames(JSON.stringify({ b: 1 }));
  for (const f of b) c.accept(f);
  assert.ok(c.done);
  assert.equal(await c.text(), JSON.stringify({ b: 1 }));
});

test("every frame of a real report decodes from a rendered QR code with jsQR", async () => {
  const QRCode = (await import("qrcode")).default;
  const jsQR = (await import("jsqr")).default;
  const frames = await encodeFrames(JSON.stringify(JSON.parse(sample)));
  const c = new FrameCollector();
  for (const f of frames) {
    const { modules } = QRCode.create(f, { errorCorrectionLevel: "M" });
    // Render at 4 px a module with a 4-module quiet zone, black on white, like the screen shows it.
    const px = 4, q = 4, side = (modules.size + q * 2) * px;
    const img = new Uint8ClampedArray(side * side * 4).fill(255);
    for (let y = 0; y < modules.size; y++)
      for (let x = 0; x < modules.size; x++)
        if (modules.get(y, x))
          for (let dy = 0; dy < px; dy++)
            for (let dx = 0; dx < px; dx++) {
              const o = (((y + q) * px + dy) * side + (x + q) * px + dx) * 4;
              img[o] = img[o + 1] = img[o + 2] = 0;
            }
    const code = jsQR(img, side, side);
    assert.ok(code, `frame unreadable (QR version ${modules.size})`);
    c.accept(code!.data);
  }
  assert.ok(c.done);
  assert.deepEqual(JSON.parse(await c.text()), JSON.parse(sample));
});
