import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseRegion, OTHER, regionById, regionForZone, REGIONS } from "./help.ts";

test("a child in Dubai never gets Pakistan's numbers", () => {
  assert.notEqual(regionForZone("Asia/Dubai"), "PK");
  assert.notEqual(chooseRegion(null, "Asia/Dubai"), "PK");
});

test("America/* is not all the United States", () => {
  for (const tz of ["America/Toronto", "America/Vancouver", "America/Mexico_City", "America/Sao_Paulo", "America/Bogota", "America/Halifax"]) {
    assert.notEqual(regionForZone(tz), "US", tz);
  }
  for (const tz of ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"]) {
    assert.equal(regionForZone(tz), "US", tz);
  }
});

test("an unknown time zone guesses no country", () => {
  for (const tz of ["", "Etc/UTC", "UTC", "Europe/Berlin", "Europe/Dublin", "Asia/Kathmandu", "Asia/Muscat", "Asia/Kuwait", "Africa/Lagos", "Australia/Sydney", "Not/AZone"]) {
    assert.equal(regionForZone(tz), OTHER, tz);
    assert.equal(chooseRegion(null, tz), OTHER, tz);
  }
  assert.equal(regionById(OTHER), null);
});

test("the known zones still find their country", () => {
  assert.equal(regionForZone("Asia/Karachi"), "PK");
  assert.equal(regionForZone("Asia/Kolkata"), "IN");
  assert.equal(regionForZone("Asia/Dhaka"), "BD");
  assert.equal(regionForZone("Europe/London"), "GB");
});

test("the child's saved choice wins over the time zone", () => {
  assert.equal(chooseRegion("GB", "Asia/Karachi"), "GB");
  assert.equal(chooseRegion(OTHER, "Asia/Karachi"), OTHER);
  assert.equal(chooseRegion("PK", "Etc/UTC"), "PK");
  // A pick from an older build that no longer exists falls back to the guess, never a crash.
  assert.equal(chooseRegion("ZZ", "Asia/Dhaka"), "BD");
  assert.equal(chooseRegion("ZZ", "Etc/UTC"), OTHER);
});

test("every country has a line to call, and an emergency number that is digits or left out", () => {
  const ids = new Set<string>();
  for (const r of REGIONS) {
    assert.ok(!ids.has(r.id), `duplicate ${r.id}`);
    ids.add(r.id);
    assert.notEqual(r.id, OTHER);
    assert.ok(r.lines.length > 0, r.id);
    for (const l of r.lines) assert.match(l.number, /^[0-9][0-9 -]*$/, `${r.id} ${l.name}`);
    if (r.emergency !== null) assert.match(r.emergency, /^[0-9]+$/, r.id);
  }
});
