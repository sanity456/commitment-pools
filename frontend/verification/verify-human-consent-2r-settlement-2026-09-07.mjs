// Accountless settlement verification, before either participant withdraws.
// Usage: node verification/verify-human-consent-2r-settlement-2026-09-07.mjs <observed-hash>
// Reads only; never signs, submits, retries or overwrites a completed report.
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
function isoMicros(value) {
  const parts =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  assert.ok(parts, "Expected a stored ISO timestamp");
  const milliseconds = Date.parse(parts[1] + parts[3]);
  assert.ok(Number.isFinite(milliseconds));
  return BigInt(milliseconds) * 1000n + BigInt((parts[2] ?? "").padEnd(6, "0"));
}
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

try {
  const [hash, ...extra] = process.argv.slice(2);
  assert.match(hash ?? "", /^0x[0-9a-fA-F]{64}$/);
  assert.equal(extra.length, 0);
  const readCheckpoint = (name) =>
    JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
  const requestName = "human-consent-2r-settlement-request-2026-09-07.json";
  const priorName = "human-consent-2r-proof-b-round-2-2026-09-07.json";
  const request = readCheckpoint(requestName);
  const prior = readCheckpoint(priorName);
  const proofNames = [
    "human-consent-2r-proof-a-round-1-2026-09-07.json",
    "human-consent-2r-proof-b-round-1-2026-09-07.json",
    "human-consent-2r-proof-a-round-2-2026-09-07.json",
    priorName,
  ];
  const proofs = proofNames.map(readCheckpoint);
  const poolId = "human-consent-2r-20260907-093128";
  const contract = "0x7279B4A7821c96489c0b086021F3E6944d343bFB";
  const wallets = {
    A: "0xAb99c741494bEF91FAE66144dda31Be93180baD4",
    B: "0xE6E7bfFA242d2900fad7067012564d441F735c43",
  };
  const rpc = "https://studio.genlayer.com/api";
  const outputFile = new URL(
    "human-consent-2r-settlement-2026-09-07.json",
    import.meta.url,
  );
  assert.equal(
    existsSync(outputFile),
    false,
    "Refusing to overwrite checkpoint",
  );
  assert.equal(prior.passed, true);
  assert.equal(prior.poolId, poolId);
  assert.equal(prior.contract, contract);
  assert.equal(prior.storedPool.status, "active");
  assert.equal(prior.storedPool.total_staked_wei, "200");
  assert.equal(prior.cohort.items.length, 2);
  assert.deepEqual(
    prior.cohort.items.map((item) => item.address).sort(),
    Object.values(wallets).sort(),
  );
  for (const participant of prior.cohort.items) {
    assert.equal(participant.status, "success");
    assert.equal(participant.rounds_passed, 2);
    assert.equal(participant.stake_wei, "100");
    assert.equal(participant.settlement_credit_wei, "0");
  }
  for (const proof of proofs) {
    assert.equal(proof.passed, true);
    assert.equal(proof.poolId, poolId);
    assert.equal(proof.contract, contract);
    assert.equal(proof.attempt.verdict, "pass");
  }
  assert.equal(request.poolId, poolId);
  assert.equal(request.contract, contract);
  assert.equal(request.chainId, 61999);
  assert.equal(request.expectedSender, wallets.B);
  assert.equal(request.walletLabel, "B");
  assert.equal(request.valueWei, "0");
  assert.equal(request.intendedMethod, "settle");
  assert.deepEqual(request.intendedArgs, [poolId]);
  assert.equal(request.priorCheckpoint, priorName);
  assert.equal(request.termsHash, prior.storedPool.terms_hash);
  assert.equal(request.readOnlyPreflight.passed, true);
  assert.equal(request.readOnlyPreflight.creditA.credit_wei, "0");
  assert.equal(request.readOnlyPreflight.creditB.credit_wei, "0");

  stage = "chain and signed settlement receipt";
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
  assert.equal(receipt.hash, hash);
  assert.equal(transactionStatus(receipt), "FINALIZED");
  assert.equal(executionState(receipt), "success");
  assert.equal(receipt.from_address.toLowerCase(), wallets.B.toLowerCase());
  assert.equal(receipt.to_address.toLowerCase(), contract.toLowerCase());
  assert.equal(String(receipt.value), "0");
  const input = plain(
    abi.calldata.decode(Buffer.from(receipt.data.calldata, "base64")),
  );
  assert.deepEqual(input, { method: "settle", args: [poolId] });
  const leaders = receipt.consensus_data.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  const bytes = Buffer.from(leader.result, "base64");
  assert.equal(bytes[0], 0, "Expected VM return, not rollback/error");
  const output = plain(abi.calldata.decode(bytes.subarray(1)));
  const expectedOutput = {
    pool_id: poolId,
    winner_count: "2",
    loser_count: "0",
    forfeited_pot_wei: "0",
    fee_wei: "0",
    share_wei: "0",
    all_fail_refund: false,
    conservation_wei: "200",
  };
  assert.deepEqual(request.expectedOutput, expectedOutput);
  assert.deepEqual(output, expectedOutput);

  stage = "finalized pool, participants, credits and historical proof reads";
  const read = (functionName, args) =>
    client.readContract({
      address: contract,
      functionName,
      args,
      jsonSafeReturn: true,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
  const [
    pool,
    cohort,
    creditA,
    creditB,
    feeRecipientCredit,
    canSettle,
    ...attempts
  ] = await Promise.all([
    read("get_pool", [poolId]),
    read("list_participants", [poolId, 0n, 2n]),
    read("get_credit", [wallets.A]),
    read("get_credit", [wallets.B]),
    read("get_credit", [prior.storedPool.fee_recipient]),
    read("can_settle", [poolId]),
    ...proofs.map((proof) =>
      read("get_attempt", [
        poolId,
        wallets[proof.walletLabel],
        BigInt(proof.round),
        1n,
      ]),
    ),
  ]);

  stage = "exact allocation, unchanged terms/proofs and stored time assertions";
  const settledMicros = isoMicros(pool.settled_at);
  assert.equal(settledMicros, isoMicros(receipt.created_at));
  assert.ok(settledMicros >= isoMicros(pool.activated_at));
  proofs.forEach((proof, index) => {
    assert.deepEqual(attempts[index], proof.attempt);
    assert.ok(settledMicros >= isoMicros(proof.attempt.submitted_at));
  });
  assert.deepEqual(pool, {
    ...prior.storedPool,
    status: "settled",
    winner_count: 2,
    loser_count: 0,
    forfeited_pot_wei: "0",
    fee_wei: "0",
    settled_at: pool.settled_at,
  });
  assert.deepEqual(cohort, {
    ...prior.cohort,
    items: prior.cohort.items.map((participant) => ({
      ...participant,
      settlement_credit_wei: "100",
    })),
  });
  assert.deepEqual(creditA, {
    ...request.readOnlyPreflight.creditA,
    account: wallets.A.toLowerCase(),
    credit_wei: "100",
  });
  assert.deepEqual(creditB, {
    ...request.readOnlyPreflight.creditB,
    account: wallets.B.toLowerCase(),
    credit_wei: "100",
  });
  assert.deepEqual(
    feeRecipientCredit,
    request.readOnlyPreflight.feeRecipientCredit,
  );
  assert.equal(canSettle, false);
  const allocatedWei = cohort.items.reduce(
    (sum, participant) => sum + BigInt(participant.settlement_credit_wei),
    0n,
  );
  assert.equal(
    allocatedWei + BigInt(pool.fee_wei),
    BigInt(pool.total_staked_wei),
  );
  assert.equal(allocatedWei.toString(), "200");
  const settledBeforeActivityEnd =
    settledMicros < BigInt(pool.activity_ends_at) * 1000000n;

  stage = "write new local settlement checkpoint";
  const report = {
    product: "commitment-pools",
    passed: true,
    verifiedAtUtc: new Date().toISOString(),
    scope:
      "Accountless independent settlement verification before either withdrawal",
    priorCheckpoint: priorName,
    requestCheckpoint: requestName,
    chainId: 61999,
    rpc,
    contract,
    poolId,
    transaction: {
      hash,
      sender: receipt.from_address,
      target: receipt.to_address,
      valueWei: String(receipt.value),
      status: transactionStatus(receipt),
      execution: executionState(receipt),
      receiptCreatedAt: receipt.created_at,
      resultCode: bytes[0],
      expectedResultCode: 0,
      resultCodeName: "return",
      decodedInput: input,
      output,
    },
    expectedOutput,
    storedPool: pool,
    cohort,
    credits: { A: creditA, B: creditB, feeRecipient: feeRecipientCredit },
    unchangedProofs: proofs.map((proof, index) => ({
      checkpoint: proofNames[index],
      attempt: attempts[index],
    })),
    eligibility: {
      basis:
        "Both participants were terminal success in the independently verified pre-settlement state.",
      settledAt: pool.settled_at,
      settledAtUnixMicroseconds: settledMicros.toString(),
      activityEndsAt: pool.activity_ends_at,
      settledBeforeActivityEnd,
      usedLocalClockForEligibility: false,
    },
    conservation: {
      totalStakedWei: pool.total_staked_wei,
      allocatedWei: allocatedWei.toString(),
      feeWei: pool.fee_wei,
    },
    checks: {
      exactSenderTargetZeroValueAndInput: true,
      finalizedAndSuccessfulExecution: true,
      exactExpectedReturnPayload: true,
      bothParticipantsTerminalBeforeSettlement: true,
      storedSettlementAndReceiptTimestampsEqualAtMicrosecondPrecision: true,
      settlementAfterAllFourStoredProofTimestamps: true,
      allFourProofRecordsUnchanged: true,
      onlyExpectedPoolAndParticipantAllocationFieldsChanged: true,
      originalTermsScheduleAndStakesUnchanged: true,
      bothCurrentCreditsExactly100Wei: true,
      zeroFeeAndFeeRecipientCreditUnchanged: true,
      total200WeiConserved: true,
      repeatSettlementUnavailable: true,
    },
    evidenceSha256: Object.fromEntries(
      [requestName, ...proofNames].map((name) => [
        name,
        sha256(readFileSync(new URL(name, import.meta.url))),
      ]),
    ),
    verificationScriptSha256: sha256(readFileSync(new URL(import.meta.url))),
    limits: [
      "No wallet, account, key, signing, write simulation or on-chain write used by this verifier.",
      "Settlement allocates credits only; neither wallet payout is proven by this receipt. Verify each withdrawal's linked finalized native child and value_credited separately.",
      "Receipt created_at and contract settled_at are stored execution-context timestamps, not an independently recorded finalization-completion timestamp.",
      "No separate success reason_code exists in this method. VM return code 0 and the exact output/state above are the checked result.",
      "This is a new local checkpoint, not a GitHub-published immutable-commit submission or a rerun of the Ubuntu suite.",
    ],
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
        eligibility: report.eligibility,
        credits: report.credits,
        conservation: report.conservation,
        checks: report.checks,
        reportFile: outputFile.pathname,
      },
      null,
      2,
    ),
  );
} catch {
  // Never expose raw upstream diagnostics or validator configuration.
  console.error(
    `Settlement checkpoint failed during: ${stage}. No transaction or retry sent.`,
  );
  process.exitCode = 1;
}
