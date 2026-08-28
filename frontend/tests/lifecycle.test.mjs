import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePool,
  normalizeParticipant,
  poolActions,
  roundState,
} from "../lib/lifecycle.ts";
const pool = normalizePool({
  id: "pool",
  creator: "0xa",
  status: "forming",
  join_deadline: 100,
  participant_count: 0,
  max_players: 2,
  rounds_required: 1,
  activity_starts_at: 100,
  round_window_seconds: 3600,
});
test("joining, activation, and cancellation honor wallet, deadline, and creator", () => {
  assert.equal(poolActions(pool, null, "", 99, false).join, false);
  assert.equal(poolActions(pool, null, "0xb", 99, false).join, true);
  assert.equal(poolActions(pool, null, "0xb", 100, false).join, false);
  assert.equal(poolActions(pool, null, "0xb", 100, false).activate, true);
  assert.equal(poolActions(pool, null, "0xb", 99, false).cancel, false);
  assert.equal(poolActions(pool, null, "0xa", 99, false).cancel, true);
});
test("round timing and attempt limits gate submissions", () => {
  const active = { ...pool, status: "active" };
  const participant = normalizeParticipant({
    address: "0xb",
    status: "active",
    rounds_passed: 0,
    last_attempt_id: "pool:0xb:1:2",
  });
  assert.equal(roundState(active, participant, 100).open, true);
  assert.equal(roundState(active, participant, 3700).open, false);
  assert.equal(
    roundState(active, { ...participant, last_attempt_id: "pool:0xb:1:3" }, 100)
      .open,
    false,
  );
  assert.equal(roundState(active, null, 100).open, false);
});
test("refund and settlement are only shown for valid states", () => {
  const p = normalizeParticipant({ address: "0xb", status: "active" });
  assert.equal(
    poolActions({ ...pool, status: "refunding" }, p, "0xb", 200, false).refund,
    true,
  );
  assert.equal(
    poolActions(
      { ...pool, status: "refunding" },
      { ...p, refund_claimed: true },
      "0xb",
      200,
      false,
    ).refund,
    false,
  );
  assert.equal(
    poolActions({ ...pool, status: "active" }, p, "0xb", 200, true).settle,
    true,
  );
});
