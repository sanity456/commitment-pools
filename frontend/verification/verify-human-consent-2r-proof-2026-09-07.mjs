// Accountless receipt/state check immediately after one expected passing proof.
// Usage: node verification/verify-human-consent-2r-proof-2026-09-07.mjs A|B 1|2 <observed-hash> <prior-checkpoint-basename> [request-checkpoint-basename]
// Reads only; never signs, retries, submits or overwrites a completed checkpoint.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import { abi, createClient, chains } from "../vendor/genlayer-js/index.js";
import { TransactionHashVariant } from "../vendor/genlayer-js/types/index.js";
import { executionState, transactionStatus } from "../lib/receipt.ts";

let stage = "checkpoint setup";
function plain(value) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Map)
    return Object.fromEntries(
      [...value].map(([key, item]) => [key, plain(item)]),
    );
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, plain(item)]),
    );
  return value;
}
const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");

try {
  const [label, roundArg, hash, priorName, requestOverride, ...extra] =
    process.argv.slice(2);
  assert.ok(["A", "B"].includes(label));
  assert.ok(["1", "2"].includes(roundArg));
  assert.match(hash ?? "", /^0x[0-9a-fA-F]{64}$/);
  assert.match(
    priorName ?? "",
    /^human-consent-2r-(activation|proof-[ab]-round-[12])-2026-09-07\.json$/,
  );
  assert.equal(extra.length, 0);
  const round = Number(roundArg);
  const checkpoint = (name) =>
    JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
  const prior = checkpoint(priorName);
  const requestPrefix = `human-consent-2r-proof-${label.toLowerCase()}-round-${round}`;
  const requestName =
    requestOverride ?? `${requestPrefix}-request-2026-09-07.json`;
  assert.match(
    requestName,
    new RegExp(
      `^${requestPrefix}(?:-retry-[1-9][0-9]*)?-request-2026-09-07\\.json$`,
    ),
  );
  const request = checkpoint(requestName);
  const outputFile = new URL(
    `human-consent-2r-proof-${label.toLowerCase()}-round-${round}-2026-09-07.json`,
    import.meta.url,
  );
  assert.equal(
    existsSync(outputFile),
    false,
    "Refusing to overwrite checkpoint",
  );
  const wallets = {
    A: "0xAb99c741494bEF91FAE66144dda31Be93180baD4",
    B: "0xE6E7bfFA242d2900fad7067012564d441F735c43",
  };
  const wallet = wallets[label];
  const poolId = "human-consent-2r-20260907-093128";
  const contract = "0x7279B4A7821c96489c0b086021F3E6944d343bFB";
  const rpc = "https://studio.genlayer.com/api";
  assert.equal(prior.passed, true);
  assert.equal(prior.poolId, poolId);
  assert.equal(prior.contract, contract);
  assert.equal(request.poolId, poolId);
  assert.equal(request.contract, contract);
  assert.equal(request.chainId, 61999);
  assert.equal(request.expectedSender, wallet);
  assert.equal(request.walletLabel, label);
  assert.equal(request.round, round);
  assert.equal(request.valueWei, "0");
  assert.equal(request.intendedMethod, "submit_checkin");
  assert.equal(request.termsHash, prior.storedPool.terms_hash);
  assert.equal(sha256(request.capture.fullText), request.capture.digest);
  assert.equal(
    Buffer.byteLength(request.capture.fullText, "utf8"),
    request.capture.byteLength,
  );
  const previousParticipant = prior.cohort.items.find(
    (item) => item.address.toLowerCase() === wallet.toLowerCase(),
  );
  assert.ok(previousParticipant);
  assert.equal(previousParticipant.status, "active");
  assert.equal(previousParticipant.rounds_passed, round - 1);

  stage = "chain and signed receipt fetch";
  const client = createClient({ chain: chains.studionet, endpoint: rpc });
  assert.equal(Number(await client.getChainId()), 61999);
  const response = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionByHash",
      params: [hash],
    }),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.ok(!envelope.error && envelope.result, "Receipt unavailable");
  const receipt = envelope.result;

  stage = "execution, sender, target, value and exact input assertions";
  assert.equal(receipt.hash, hash);
  assert.equal(transactionStatus(receipt), "FINALIZED");
  assert.equal(executionState(receipt), "success");
  assert.equal(receipt.from_address.toLowerCase(), wallet.toLowerCase());
  assert.equal(receipt.to_address.toLowerCase(), contract.toLowerCase());
  assert.equal(String(receipt.value), "0");
  const input = plain(
    abi.calldata.decode(Buffer.from(receipt.data.calldata, "base64")),
  );
  assert.equal(input.method, "submit_checkin");
  assert.equal(input.args.length, 5);
  assert.deepEqual(input.args.slice(0, 4), [
    poolId,
    request.proofText,
    request.capture.url,
    request.capture.digest,
  ]);
  assert.match(
    input.args[4],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  if (request.retryOf) {
    assert.equal(
      request.cancellationCheckpoint,
      `${requestPrefix}-canceled-2026-09-07.json`,
    );
    const canceled = checkpoint(request.cancellationCheckpoint);
    assert.equal(canceled.reconciliationPassed, true);
    assert.equal(canceled.transaction.hash, request.retryOf);
    assert.equal(canceled.transaction.status, "CANCELED");
    assert.notEqual(
      input.args[4],
      canceled.transaction.appGeneratedAttemptNonce,
    );
  }
  const leaders = receipt.consensus_data.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  const resultBytes = Buffer.from(leader.result, "base64");
  assert.equal(resultBytes[0], 0, "Expected VM return, not rollback/error");
  const output = plain(abi.calldata.decode(resultBytes.subarray(1)));
  const attemptId = `${poolId}:${wallet.toLowerCase()}:${round}:1`;
  const expectedStatus = round === 2 ? "success" : "active";
  assert.equal(typeof output.reasoning, "string");
  assert.ok(output.reasoning.length > 0);
  assert.deepEqual(output, {
    attempt: "1",
    attempt_id: attemptId,
    participant_status: expectedStatus,
    reasoning: output.reasoning,
    retriable: false,
    round: roundArg,
    rounds_passed: roundArg,
    verdict: "pass",
  });

  stage = "finalized attempt, pool, participants and schedule reads";
  const read = (functionName, args) =>
    client.readContract({
      address: contract,
      functionName,
      args,
      jsonSafeReturn: true,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
  const [pool, cohort, attempt, schedule, credit] = await Promise.all([
    read("get_pool", [poolId]),
    read("list_participants", [poolId, 0n, 2n]),
    read("get_attempt", [poolId, wallet, BigInt(round), 1n]),
    read("get_round", [poolId, BigInt(round)]),
    read("get_credit", [wallet]),
  ]);

  stage = "stored proof, timestamp, progress and unchanged stake assertions";
  assert.deepEqual(pool, prior.storedPool);
  assert.deepEqual(schedule, {
    round,
    opens_at: request.storedRoundOpensAt,
    closes_at: request.storedRoundClosesAt,
  });
  assert.equal(
    schedule.opens_at,
    pool.activity_starts_at + (round - 1) * pool.round_window_seconds,
  );
  assert.equal(
    schedule.closes_at,
    schedule.opens_at + pool.round_window_seconds,
  );
  const submittedMillis = Date.parse(attempt.submitted_at);
  assert.ok(Number.isFinite(submittedMillis));
  assert.equal(submittedMillis, Date.parse(receipt.created_at));
  assert.ok(submittedMillis >= schedule.opens_at * 1000);
  assert.ok(submittedMillis < schedule.closes_at * 1000);
  assert.ok(submittedMillis >= Date.parse(pool.activated_at));
  assert.ok(Number.isInteger(attempt.confidence));
  assert.ok(attempt.confidence >= 0 && attempt.confidence <= 100);
  assert.deepEqual(attempt, {
    id: attemptId,
    round,
    attempt: 1,
    player: receipt.from_address,
    proof_digest: sha256(request.proofText),
    evidence_url: request.capture.url,
    expected_evidence_digest: request.capture.digest,
    observed_evidence_digest: request.capture.digest,
    verdict: "pass",
    confidence: attempt.confidence,
    reasoning: output.reasoning,
    reasoning_provenance: "leader_output_non_authoritative",
    submitted_at: attempt.submitted_at,
  });
  assert.deepEqual(cohort, {
    ...prior.cohort,
    items: prior.cohort.items.map((item) =>
      item.address.toLowerCase() === wallet.toLowerCase()
        ? {
            ...item,
            last_attempt_id: attemptId,
            rounds_passed: round,
            status: expectedStatus,
          }
        : item,
    ),
  });
  assert.equal(credit.account.toLowerCase(), wallet.toLowerCase());
  assert.equal(credit.credit_wei, "0");
  const participant = cohort.items.find(
    (item) => item.address.toLowerCase() === wallet.toLowerCase(),
  );

  stage = "write new immutable local checkpoint";
  const report = {
    product: "commitment-pools",
    passed: true,
    verifiedAtUtc: new Date().toISOString(),
    scope: `Read-only independent Wallet ${label} round ${round} proof verification`,
    priorCheckpoint: priorName,
    requestCheckpoint: requestName,
    chainId: 61999,
    rpc,
    contract,
    poolId,
    walletLabel: label,
    round,
    transaction: {
      hash,
      sender: receipt.from_address,
      target: receipt.to_address,
      valueWei: String(receipt.value),
      status: transactionStatus(receipt),
      execution: executionState(receipt),
      receiptCreatedAt: receipt.created_at,
      resultCode: resultBytes[0],
      expectedResultCode: 0,
      resultCodeName: "return",
      decodedInput: input,
      appGeneratedAttemptNonce: input.args[4],
      output,
    },
    expectedDecision: {
      verdict: "pass",
      round,
      attempt: 1,
      roundsPassed: round,
      participantStatus: expectedStatus,
      retriable: false,
      reasonCode:
        "Not a separate field in this method's success payload. The observed decision code is verdict=pass; VM return code is 0. Free-text reasoning is recorded, not treated as an authoritative reason code.",
    },
    storedPool: pool,
    cohort,
    participant,
    attempt,
    schedule,
    credit,
    captureProvenance: request.capture,
    checks: {
      exactPoolProofUrlDigestSenderTargetAndZeroValue: true,
      appGeneratedNonceRecordedFromSignedInput: true,
      finalizedAndSuccessfulExecution: true,
      exactExpectedPassingOutput: true,
      storedProofHashAndFetchedSourceDigestMatch: true,
      storedAttemptTimestampMatchesReceiptWithinRound: true,
      onlyExpectedParticipantProgressChanged: true,
      otherParticipantUnchanged: true,
      poolTermsScheduleStakeAndFeesUnchanged: true,
      currentWalletHasZeroWithdrawalCredit: true,
    },
    limits:
      "No wallet, account, key, signing, write simulation or on-chain write used. Eligibility uses stored receipt/attempt and round timestamps, not observation time. Capture provenance remains historical; this successful proof independently records the re-fetched source digest. No future round opening, fresh-review UI, other wallet proof, settlement or payout is proven by this receipt alone. Leader reasoning/confidence are non-authoritative metadata.",
  };
  writeFileSync(
    outputFile,
    await format(JSON.stringify(report), { parser: "json" }),
    { flag: "wx" },
  );
  console.log(
    JSON.stringify(
      {
        passed: true,
        verifiedAtUtc: report.verifiedAtUtc,
        transaction: report.transaction,
        participant,
        submittedAt: attempt.submitted_at,
        schedule,
        checks: report.checks,
        reportFile: outputFile.pathname,
      },
      null,
      2,
    ),
  );
} catch {
  // Never dump upstream diagnostics or validator configuration.
  console.error(`Proof checkpoint failed during: ${stage}. No retry sent.`);
  process.exitCode = 1;
}
