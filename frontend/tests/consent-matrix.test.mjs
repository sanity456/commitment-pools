import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeParticipant,
  normalizePool,
  poolActions,
  roundState,
} from "../lib/lifecycle.ts";
import {
  detailIsFresh,
  poolReviewKey,
  workspaceIdentity,
} from "../lib/workspace-review.ts";

// Read immutable human evidence, but never change it or call the chain.
// Changed records below are explicit regression fixtures, not new live events.
const evidence = JSON.parse(
  readFileSync(
    new URL(
      "../verification/human-wallet-lifecycle-60m-2026-09-06.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const pool = normalizePool(evidence.withdrawalA.successVerification.storedPool);
const participant = normalizeParticipant(
  evidence.settlement.successVerification.participants.items[0],
);
const session = {
  wallet: participant.address,
  coreAddress: evidence.captureAPreflight.coreAddress,
  captureAddress: evidence.captureAPreflight.helper,
  chainId: 61999,
};
const otherWallet =
  evidence.settlement.successVerification.participants.items[1].address;
const reviewedKey = poolReviewKey(pool, participant);
const identity = workspaceIdentity(session);

test("consent fixtures retain the recorded pool hash and original chain deadlines", () => {
  assert.equal(pool.id, "human-wallet-60m-20260906-131207");
  assert.equal(
    pool.terms_hash,
    "f822901b2e7587245dd33e709f79940353769c33d94961579b67cb12c330495d",
  );
  assert.equal(pool.join_deadline, evidence.chainTimes.joinDeadlineUnix);
  assert.equal(
    pool.activity_starts_at,
    evidence.chainTimes.activityStartsAtUnix,
  );
  assert.equal(pool.activity_ends_at, evidence.chainTimes.activityEndsAtUnix);
  assert.equal(pool.activity_starts_at, 1788704114);
  assert.equal(pool.activity_ends_at, 1788707714);
});

const poolChanges = {
  id: "different-regression-pool",
  title: "Different reviewed title",
  description: "Different reviewed description",
  rules: "Different required evidence",
  creator: otherWallet,
  verification_mode: "self_attested",
  stake_wei: "101",
  rounds_required: 2,
  min_players: 3,
  max_players: 3,
  participant_count: 3,
  status: "refunding",
  join_deadline: pool.join_deadline + 1,
  activity_starts_at: pool.activity_starts_at + 1,
  activity_ends_at: pool.activity_ends_at + 1,
  round_window_seconds: pool.round_window_seconds + 1,
  fee_bps: 600,
  terms_hash: "different-regression-terms-hash",
  fee_recipient: otherWallet,
  activation_failure: "minimum_not_met",
  winner_count: 1,
  loser_count: 1,
  fee_wei: "1",
};
for (const [field, value] of Object.entries(poolChanges)) {
  test(`recorded ${field} change invalidates the prior consent key`, () => {
    assert.notEqual(
      pool[field],
      value,
      "The fixture must actually change this field",
    );
    const changed = { ...pool, [field]: value };
    assert.notEqual(poolReviewKey(changed, participant), reviewedKey);
    assert.equal(
      poolReviewKey({ ...changed }, { ...participant }),
      poolReviewKey(changed, participant),
    );
  });
}

test("all combined pool, terms, round and wallet-domain changes invalidate prior consent", () => {
  for (let mask = 1; mask < 128; mask++) {
    const nextPool = {
      ...pool,
      ...(mask & 1 ? { id: poolChanges.id } : {}),
      ...(mask & 2 ? { terms_hash: poolChanges.terms_hash } : {}),
    };
    const nextParticipant = {
      ...participant,
      ...(mask & 4 ? { rounds_passed: participant.rounds_passed + 1 } : {}),
    };
    const nextSession = {
      ...session,
      ...(mask & 8 ? { wallet: otherWallet } : {}),
      ...(mask & 16 ? { chainId: 1 } : {}),
      ...(mask & 32 ? { coreAddress: otherWallet } : {}),
      ...(mask & 64 ? { captureAddress: otherWallet } : {}),
    };
    const sameWorkspace = workspaceIdentity(nextSession) === identity;
    const sameRecord = poolReviewKey(nextPool, nextParticipant) === reviewedKey;
    assert.equal(
      sameWorkspace && sameRecord,
      false,
      `Combination ${mask} retained stale consent`,
    );
  }
});

test("freshness gates every changed context until a matching successful revision arrives", () => {
  const detail = { key: pool.id, revision: 7 };
  assert.equal(detailIsFresh(detail, pool.id, 7, ""), true);
  for (const selected of [pool.id, poolChanges.id]) {
    for (const revision of [7, 8]) {
      for (const error of ["", "RPC unavailable"]) {
        assert.equal(
          detailIsFresh(detail, selected, revision, error),
          selected === pool.id && revision === 7 && error === "",
        );
      }
    }
  }
  assert.equal(
    detailIsFresh({ key: poolChanges.id, revision: 8 }, poolChanges.id, 8, ""),
    true,
  );
  assert.equal(detailIsFresh(null, pool.id, 7, ""), false);
});

test("unchanged refreshed records retain consent while revision freshness stays separate", () => {
  const reordered = Object.fromEntries(Object.entries(pool).reverse());
  const reorderedParticipant = Object.fromEntries(
    Object.entries(participant).reverse(),
  );
  assert.equal(poolReviewKey(reordered, reorderedParticipant), reviewedKey);
  assert.equal(
    workspaceIdentity({ ...session, wallet: session.wallet.toLowerCase() }),
    identity,
  );
  assert.equal(
    detailIsFresh({ key: pool.id, revision: 7 }, pool.id, 8, ""),
    false,
  );
  assert.equal(
    detailIsFresh({ key: pool.id, revision: 8 }, pool.id, 8, ""),
    true,
  );
});

test("stored round boundaries disable expired proof without silently extending time or consent", () => {
  const activePool = {
    ...pool,
    status: evidence.captureAPreflight.pool.status,
  };
  const beforeProof = normalizeParticipant(
    evidence.captureAPreflight.participant,
  );
  const start = evidence.chainTimes.activityStartsAtUnix;
  const end = evidence.chainTimes.activityEndsAtUnix;
  const key = poolReviewKey(activePool, beforeProof);
  for (const [chainTimestamp, expected] of [
    [start - 1, false],
    [start, true],
    [end - 1, true],
    [end, false],
    [end + 1, false],
  ]) {
    assert.equal(
      roundState(activePool, beforeProof, chainTimestamp).open,
      expected,
    );
    assert.equal(
      poolActions(
        activePool,
        beforeProof,
        session.wallet,
        chainTimestamp,
        false,
      ).submit,
      expected,
    );
    assert.equal(
      poolReviewKey(activePool, beforeProof),
      key,
      "Time alone must not erase a draft or manufacture consent",
    );
  }
});

test("a simulated second round requires new review using a schedule derived from stored chain time", () => {
  const start = evidence.chainTimes.activityStartsAtUnix;
  const simulatedTwoRoundPool = {
    ...pool,
    status: "active",
    rounds_required: 2,
    activity_ends_at: start + 2 * pool.round_window_seconds,
  };
  const first = normalizeParticipant(evidence.captureAPreflight.participant);
  const second = {
    ...first,
    rounds_passed: 1,
    last_attempt_id: `${pool.id}:${session.wallet.toLowerCase()}:1:1`,
  };
  const nextRoundStart = start + pool.round_window_seconds;
  assert.notEqual(
    poolReviewKey(simulatedTwoRoundPool, first),
    poolReviewKey(simulatedTwoRoundPool, second),
  );
  assert.equal(
    roundState(simulatedTwoRoundPool, second, nextRoundStart - 1).open,
    false,
  );
  assert.equal(
    roundState(simulatedTwoRoundPool, second, nextRoundStart).open,
    true,
  );
  assert.equal(
    roundState(simulatedTwoRoundPool, second, nextRoundStart).number,
    2,
  );
  assert.equal(
    roundState(simulatedTwoRoundPool, second, nextRoundStart).attempts,
    0,
  );
});

test("attempt progression and three-attempt exhaustion invalidate review and gate proof", () => {
  const activePool = { ...pool, status: "active" };
  const beforeProof = normalizeParticipant(
    evidence.captureAPreflight.participant,
  );
  const keys = new Set([poolReviewKey(activePool, beforeProof)]);
  for (const attempt of [1, 2, 3]) {
    const attempted = {
      ...beforeProof,
      last_attempt_id: `${pool.id}:${session.wallet.toLowerCase()}:1:${attempt}`,
    };
    keys.add(poolReviewKey(activePool, attempted));
    assert.equal(
      roundState(activePool, attempted, pool.activity_starts_at).open,
      attempt < 3,
    );
  }
  assert.equal(keys.size, 4);
});

test("terminal participant states cannot retain an actionable proof form", () => {
  const activePool = { ...pool, status: "active" };
  const beforeProof = normalizeParticipant(
    evidence.captureAPreflight.participant,
  );
  for (const status of ["success", "failed", "refunded"]) {
    const terminal = { ...beforeProof, status };
    assert.notEqual(
      poolReviewKey(activePool, terminal),
      poolReviewKey(activePool, beforeProof),
    );
    assert.equal(
      poolActions(
        activePool,
        terminal,
        session.wallet,
        pool.activity_starts_at,
        false,
      ).submit,
      false,
    );
  }
});

test("actual component wiring clears pool switches and binds evidence review to the record context", () => {
  const workspace = readFileSync(
    new URL("../components/ProductHome.tsx", import.meta.url),
    "utf8",
  );
  const capture = readFileSync(
    new URL("../components/EvidenceCapture.tsx", import.meta.url),
    "utf8",
  );
  assert.match(workspace, /key=\{workspaceIdentity\(protocol\.session\)\}/);
  assert.match(workspace, /onChange=\{\(e\) => openPool\(e\.target\.value\)\}/);
  assert.match(
    workspace,
    /function openPool\(id: string\) \{[\s\S]*?setReviewedKey\(null\);[\s\S]*?setEvidenceKey\(null\);/,
  );
  assert.match(workspace, /key=\{pool.id \+ "\|" \+ round\?\.number\}/);
  assert.match(workspace, /reviewContext=\{reviewKey\}/);
  assert.match(workspace, /const poolDisabled = disabled \|\| !detailFresh/);
  assert.match(capture, /reviewedContext === reviewContext/);
  assert.match(capture, /setCapture\(null\);\s+setReviewedContext\(null\);/);
  assert.match(
    capture,
    /setReviewedContext\(e.target.checked \? reviewContext : null\)/,
  );
});
