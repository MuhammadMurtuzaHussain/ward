import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_AUTO_LOCK, PICKER_GRACE, shouldLock } from "./autoLock.ts";

const away = (setting: "now" | "minute" | "off", awayFor: number, more: { hasPin?: boolean; picking?: boolean } = {}) =>
  shouldLock({ setting, awayFor, hasPin: more.hasPin ?? true, picking: more.picking ?? false });

test("on by default once there's a PIN", () => {
  assert.notEqual(DEFAULT_AUTO_LOCK, "off");
  assert.equal(away(DEFAULT_AUTO_LOCK, 10 * 60_000), true);
});

test("no PIN, nothing to lock with", () => {
  assert.equal(away("now", 10 * 60_000, { hasPin: false }), false);
});

test("right away locks after any time away", () => {
  assert.equal(away("now", 0), true);
  assert.equal(away("now", 1500), true);
});

test("after a minute: a quick look at another app keeps the check open", () => {
  assert.equal(away("minute", 20_000), false);
  assert.equal(away("minute", 59_999), false);
  assert.equal(away("minute", 60_000), true);
});

test("off never locks", () => {
  assert.equal(away("off", 24 * 3_600_000), false);
});

test("picking the chat file isn't leaving, unless it takes ages", () => {
  assert.equal(away("now", 90_000, { picking: true }), false);
  assert.equal(away("now", PICKER_GRACE, { picking: true }), true);
});
