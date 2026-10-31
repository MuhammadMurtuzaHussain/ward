import { test } from "node:test";
import assert from "node:assert/strict";
import { warmReader } from "./warm.ts";

test("Ward Lite starts loading when Check opens, unless Gemma will read instead", async () => {
  let loads = 0;
  const lite = async () => void loads++;
  assert.equal(await warmReader({ gemma: async () => false, lite }), true);
  assert.equal(loads, 1);
  assert.equal(await warmReader({ gemma: async () => true, lite }), false);
  assert.equal(loads, 1, "no Ward Lite where Gemma reads");
});
