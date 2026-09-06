import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeParticipant, normalizePool } from "../lib/lifecycle.ts";
import {
  detailIsFresh,
  poolReviewKey,
  workspaceIdentity,
} from "../lib/workspace-review.ts";
import { userFacingError } from "../lib/recovery.ts";

const session = {
  wallet: "0xAA",
  coreAddress: "0xBB",
  captureAddress: "0xCC",
  chainId: 61999,
};
const pool = normalizePool({
  id: "review-1",
  terms_hash: "terms-1",
  status: "active",
  verification_mode: "source_verified",
  rounds_required: 2,
  stake_wei: "1000",
  join_deadline: 100,
  activity_starts_at: 100,
  activity_ends_at: 300,
  round_window_seconds: 100,
});
const participant = normalizeParticipant({
  address: session.wallet,
  status: "active",
  rounds_passed: 0,
  stake_wei: "1000",
});

test("workspace identity isolates wallet, core, helper and chain, not unrelated refreshes", () => {
  assert.equal(
    workspaceIdentity({ ...session, wallet: "0xaa" }),
    workspaceIdentity(session),
  );
  for (const change of [
    { wallet: "0xDD" },
    { coreAddress: "0xDD" },
    { captureAddress: "0xDD" },
    { chainId: 1 },
  ])
    assert.notEqual(
      workspaceIdentity({ ...session, ...change }),
      workspaceIdentity(session),
    );
  assert.equal(workspaceIdentity(null), "signed-out");
});

test("the same recorded pool and participant retain consent across reload order", () => {
  assert.equal(
    poolReviewKey({ ...pool }, { ...participant }),
    poolReviewKey(pool, participant),
  );
  assert.equal(
    poolReviewKey(
      Object.fromEntries(Object.entries(pool).reverse()),
      participant,
    ),
    poolReviewKey(pool, participant),
  );
});

test("changed terms, schedule, cohort or status require a fresh pool review", () => {
  const key = poolReviewKey(pool, participant);
  for (const change of [
    { id: "review-2" },
    { terms_hash: "terms-2" },
    { status: "settled" },
    { stake_wei: "2000" },
    { fee_bps: 600 },
    { rules: "different rule" },
    { join_deadline: 101 },
    { activity_ends_at: 301 },
    { participant_count: 3 },
    { verification_mode: "self_attested" },
  ])
    assert.notEqual(poolReviewKey({ ...pool, ...change }, participant), key);
});

test("a new participant round, attempt or terminal status invalidates old evidence consent", () => {
  const key = poolReviewKey(pool, participant);
  for (const change of [
    { address: "0xDD" },
    { rounds_passed: 1 },
    { last_attempt_id: "pool:player:1:2" },
    { status: "failed" },
    { refund_claimed: true },
  ])
    assert.notEqual(poolReviewKey(pool, { ...participant, ...change }), key);
  assert.notEqual(poolReviewKey(pool, null), key);
  assert.equal(poolReviewKey(undefined, null), "");
});

test("retained detail is actionable only after the current revision loads successfully", () => {
  const detail = { key: pool.id, revision: 1 };
  assert.equal(detailIsFresh(detail, pool.id, 1, ""), true);
  assert.equal(detailIsFresh(detail, pool.id, 2, ""), false);
  assert.equal(detailIsFresh(detail, "another-pool", 1, ""), false);
  assert.equal(detailIsFresh(detail, pool.id, 1, "RPC unavailable"), false);
  assert.equal(detailIsFresh(null, pool.id, 1, ""), false);
});

test("workspace preserves forms during refresh and gates pool actions and evidence on fresh state", () => {
  const source = readFileSync(
    new URL("../components/ProductHome.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /detail\?\.key === poolId \? detail : null/);
  assert.doesNotMatch(source, /\[poolId, wallet, protocol\.revision\]\.join/);
  assert.match(source, /reviewedKey === reviewKey/);
  assert.match(source, /evidenceKey === reviewKey/);
  assert.match(source, /reviewContext=\{reviewKey\}/);
  assert.match(source, /const poolDisabled = disabled \|\| !detailFresh/);
  assert.match(source, /key=\{pool.id \+ "\|" \+ round\?\.number\}/);
  assert.doesNotMatch(source, /setAcceptedTerms\(false\)/);
});

test("wallet refresh fails closed and preserves the specific sign-in failure", () => {
  const source = readFileSync(
    new URL("../lib/useProtocol.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /sessionRevision === revision/);
  assert.match(source, /dataRevision === revision/);
  assert.match(source, /sessionReasonRef\.current = reason/);
  assert.match(source, /setSessionError\(reason\)/);
});

test("a real wallet rejection has concise copy without misclassifying network failures", () => {
  assert.equal(
    userFacingError({ code: 4001, message: "long provider error" }),
    "Wallet request cancelled. Nothing was sent.",
  );
  assert.equal(
    userFacingError(new Error("Request timed out")),
    "Request timed out",
  );
});
