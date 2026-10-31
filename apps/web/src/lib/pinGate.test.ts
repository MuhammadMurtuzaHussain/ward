import { test } from "node:test";
import assert from "node:assert/strict";
import { needsPin, pinOpens, profilePinHash, type Locks } from "./pinGate.ts";
import { b64, derive, seal } from "./vaultSeal.ts";

const salt = () => b64(crypto.getRandomValues(new Uint8Array(16)));

async function profileLock(pin: string) {
  const s = salt();
  return { salt: s, hash: await profilePinHash(pin, s) };
}

// The same steps as vault.ts createPin: a sealed "ward" the right PIN opens.
async function vaultLock(pin: string) {
  const s = crypto.getRandomValues(new Uint8Array(16));
  return { salt: b64(s), check: await seal(await derive(pin, s), "ward") };
}

test("no PIN anywhere: nothing to ask for", () => {
  assert.equal(needsPin({}), false);
});

test("a profile PIN guards it", async () => {
  const l: Locks = { profile: await profileLock("1234") };
  assert.equal(needsPin(l), true);
  assert.equal(await pinOpens("1234", l), true);
  assert.equal(await pinOpens("4321", l), false);
});

test("a vault PIN alone guards it", async () => {
  const l: Locks = { vault: await vaultLock("2580") };
  assert.equal(needsPin(l), true);
  assert.equal(await pinOpens("2580", l), true);
  assert.equal(await pinOpens("0000", l), false);
});

test("with both, either of the child's PINs works and nothing else does", async () => {
  const l: Locks = { profile: await profileLock("1111"), vault: await vaultLock("2222") };
  assert.equal(await pinOpens("1111", l), true);
  assert.equal(await pinOpens("2222", l), true);
  assert.equal(await pinOpens("3333", l), false);
});

test("a damaged vault marker is a wrong PIN, not a crash", async () => {
  assert.equal(await pinOpens("2580", { vault: { salt: salt(), check: "not.sealed" } }), false);
});
