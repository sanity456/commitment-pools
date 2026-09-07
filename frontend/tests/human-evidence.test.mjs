// Offline integrity checks for an already completed human MetaMask trial.
// These do not sign, send transactions, or replace the original live evidence.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const root = new URL("../verification/", import.meta.url);
const poolId = "human-consent-2r-20260907-093128";
const core = "0x7279b4a7821c96489c0b086021f3e6944d343bfb";
const wallets = {
  A: "0xab99c741494bef91fae66144dda31be93180bad4",
  B: "0xe6e7bffa242d2900fad7067012564d441f735c43",
};
const phases = [
  ["creation", "create_pool", "A", "0"],
  ["join-a", "join", "A", "100"],
  ["join-b", "join", "B", "100"],
  ["activation", "activate_pool", "B", "0"],
  ["proof-b-round-1", "submit_checkin", "B", "0"],
  ["proof-a-round-1", "submit_checkin", "A", "0"],
  ["proof-a-round-2", "submit_checkin", "A", "0"],
  ["proof-b-round-2", "submit_checkin", "B", "0"],
  ["settlement", "settle", "B", "0"],
  ["withdraw-b", "withdraw", "B", "0"],
  ["withdraw-a", "withdraw", "A", "0"],
];
const nameFor = (phase) => `human-consent-2r-${phase}-2026-09-07.json`;
const read = (name) => {
  assert.match(name, /^human-consent-2r-[a-z0-9-]+-2026-09-07\.json$/);
  return JSON.parse(readFileSync(new URL(name, root), "utf8"));
};
const report = (phase) => read(nameFor(phase));
const transaction = (value) => value.transaction ?? value.creation;
const digest = (value) => createHash("sha256").update(value).digest("hex");
function micros(value) {
  const match =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  assert.ok(match);
  const milliseconds = Date.parse(match[1] + match[3]);
  assert.ok(Number.isFinite(milliseconds));
  return BigInt(milliseconds) * 1000n + BigInt((match[2] ?? "").padEnd(6, "0"));
}

test("Human evidence contains eleven distinct successful parents for the exact approved pool and wallets", () => {
  const hashes = new Set();
  for (const [phase, method, wallet, value] of phases) {
    const checkpoint = report(phase);
    const tx = transaction(checkpoint);
    assert.equal(checkpoint.passed, true);
    assert.equal(checkpoint.chainId, 61999);
    assert.equal(checkpoint.contract.toLowerCase(), core);
    assert.equal(checkpoint.poolId ?? checkpoint.storedPool.id, poolId);
    assert.equal(tx.status, "FINALIZED");
    assert.equal(tx.execution, "success");
    assert.equal(tx.resultCode, 0);
    assert.equal(tx.sender.toLowerCase(), wallets[wallet]);
    assert.equal(tx.target.toLowerCase(), core);
    assert.equal(tx.valueWei, value);
    assert.equal(tx.decodedInput.method, method);
    assert.match(tx.hash, /^0x[0-9a-f]{64}$/);
    hashes.add(tx.hash);
  }
  assert.equal(hashes.size, 11);
});

test("All four human proofs use the original stored round timestamps and exact reviewed input digests", () => {
  for (const [phase] of phases.filter((item) => item[1] === "submit_checkin")) {
    const checkpoint = report(phase);
    const request = read(checkpoint.requestCheckpoint);
    const { attempt, schedule, storedPool, transaction: tx } = checkpoint;
    assert.equal(
      schedule.opens_at,
      storedPool.activity_starts_at + (checkpoint.round - 1) * 3600,
    );
    assert.equal(schedule.closes_at, schedule.opens_at + 3600);
    const submitted = micros(attempt.submitted_at);
    assert.equal(submitted, micros(tx.receiptCreatedAt));
    assert.ok(submitted >= BigInt(schedule.opens_at) * 1000000n);
    assert.ok(submitted < BigInt(schedule.closes_at) * 1000000n);
    assert.equal(attempt.verdict, "pass");
    assert.equal(attempt.attempt, 1);
    assert.equal(attempt.proof_digest, digest(request.proofText));
    assert.equal(
      attempt.expected_evidence_digest,
      digest(request.capture.fullText),
    );
    assert.equal(
      attempt.observed_evidence_digest,
      attempt.expected_evidence_digest,
    );
    assert.deepEqual(tx.decodedInput.args.slice(0, 4), [
      poolId,
      request.proofText,
      request.capture.url,
      request.capture.digest,
    ]);
    assert.equal(tx.output.verdict, "pass");
    assert.equal(tx.output.rounds_passed, String(checkpoint.round));
  }
});

test("Network cancellation is preserved separately from its successful fresh-nonce replacement", () => {
  const canceled = report("proof-a-round-2-canceled");
  const replacement = report("proof-a-round-2");
  const request = read(replacement.requestCheckpoint);
  assert.equal(canceled.reconciliationPassed, true);
  assert.equal(canceled.transaction.status, "CANCELED");
  assert.equal(canceled.transaction.execution, "unknown");
  assert.equal(canceled.transaction.vmResultCode, null);
  assert.equal(canceled.transaction.vmOutputPayload, null);
  assert.equal(canceled.transaction.leaderReceiptPresent, false);
  assert.equal(request.retryOf, canceled.transaction.hash);
  assert.notEqual(replacement.transaction.hash, canceled.transaction.hash);
  assert.notEqual(
    replacement.transaction.appGeneratedAttemptNonce,
    canceled.transaction.appGeneratedAttemptNonce,
  );
  assert.equal(replacement.attempt.attempt, 1);
  assert.ok(
    phases.every(
      ([phase]) =>
        transaction(report(phase)).hash !== canceled.transaction.hash,
    ),
  );
});

test("Both separately credited native payouts conserve all 200 wei with no remaining credits or fee", () => {
  const settlement = report("settlement");
  const final = report("withdraw-a");
  assert.equal(settlement.eligibility.settledBeforeActivityEnd, true);
  assert.equal(
    micros(settlement.storedPool.settled_at),
    micros(settlement.transaction.receiptCreatedAt),
  );
  for (const label of ["A", "B"]) {
    const checkpoint = report(`withdraw-${label.toLowerCase()}`);
    const { transaction: tx, nativeChild: child, payout } = checkpoint;
    assert.equal(child.parentHash, tx.hash);
    assert.deepEqual(tx.triggeredTransactionIds, [child.hash]);
    assert.equal(child.sender.toLowerCase(), core);
    assert.equal(child.recipient.toLowerCase(), wallets[label]);
    assert.equal(child.valueWei, "100");
    assert.equal(child.type, 0);
    assert.equal(child.status, "FINALIZED");
    assert.equal(child.valueCredited, true);
    assert.equal(child.delivered, true);
    assert.deepEqual(payout, tx.output);
    assert.equal(payout.recipient, wallets[label]);
    assert.equal(payout.amount_wei, "100");
    assert.equal(micros(payout.emitted_at), micros(tx.receiptCreatedAt));
    assert.deepEqual(checkpoint.storedPool, settlement.storedPool);
    assert.deepEqual(checkpoint.cohort, settlement.cohort);
    assert.equal(final.credits[label].credit_wei, "0");
  }
  assert.equal(final.credits.feeRecipient.credit_wei, "0");
  assert.deepEqual(final.conservation, {
    totalStakedWei: "200",
    deliveredWei: "200",
    remainingParticipantCreditWei: "0",
    feeWei: "0",
  });
  assert.equal(
    new Set(final.deliveredPayouts.map((item) => item.childHash)).size,
    2,
  );
});

test("Final human evidence retains exact hashes of its source checkpoints and verification scripts", () => {
  for (const [name, expected] of [
    [
      "chrome-before-update.png",
      "dad4ae66951292e726f2a4739bf5d2bb9bbbb78e6dbca2f68855ca6e924c79c5",
    ],
    [
      "chrome-after-update.png",
      "7414ed70d5d4bd9022d42c6d2674c51f1b3b1c007c60a0de2a0923c1db64379b",
    ],
    [
      "metamask-about.png",
      "c24a652825c546331093ecafcb0d7868f4ba5d1c1499d19e72e214601f697440",
    ],
  ]) {
    assert.equal(
      digest(readFileSync(new URL(`environment/${name}`, root))),
      expected,
    );
  }
  for (const phase of ["settlement", "withdraw-b", "withdraw-a"]) {
    const checkpoint = report(phase);
    const script =
      phase === "settlement"
        ? "verify-human-consent-2r-settlement-2026-09-07.mjs"
        : "verify-human-consent-2r-withdraw-2026-09-07.mjs";
    assert.equal(
      checkpoint.verificationScriptSha256,
      digest(readFileSync(new URL(script, root))),
    );
    for (const [name, expected] of Object.entries(checkpoint.evidenceSha256)) {
      read(name);
      assert.equal(digest(readFileSync(new URL(name, root))), expected);
    }
  }
});
