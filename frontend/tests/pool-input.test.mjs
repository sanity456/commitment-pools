import test from "node:test";
import assert from "node:assert/strict";
import { formationSeconds } from "../lib/pool-input.ts";

test("formation units support a short human trial without changing contract clocks", () => {
  assert.equal(formationSeconds("15", "minutes"), 900);
  assert.equal(formationSeconds("2", "hours"), 7200);
  assert.equal(formationSeconds("3", "days"), 259200);
  assert.equal(formationSeconds("90", "days"), 7776000);
});

test("formation validation rejects fractions, coercion, overflow and invalid units", () => {
  for (const [length, unit] of [
    ["", "days"],
    ["0", "minutes"],
    ["91", "days"],
    ["1.5", "hours"],
    ["1e2", "minutes"],
    ["-1", "days"],
    ["1", "__proto__"],
    ["1", "toString"],
    ["1", "seconds"],
    ["9999999999999999999", "minutes"],
  ])
    assert.throws(() => formationSeconds(length, unit));
});
