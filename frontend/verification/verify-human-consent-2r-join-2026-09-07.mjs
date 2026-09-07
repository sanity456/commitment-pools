// Read-only checkpoint for a human-approved join. No wallet, signing or writes.
// Usage: node verification/verify-human-consent-2r-join-2026-09-07.mjs A|B <observed-hash>
// Run immediately after each join, before activation; outputs never overwrite.
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { abi, createClient, chains } from "../vendor/genlayer-js/index.js";
import { TransactionHashVariant } from "../vendor/genlayer-js/types/index.js";
import { executionState, transactionStatus } from "../lib/receipt.ts";

const [walletLabel, joinHash, ...extra] = process.argv.slice(2);
assert.ok(["A", "B"].includes(walletLabel), "Expected wallet A or B");
assert.match(joinHash ?? "", /^0x[0-9a-fA-F]{64}$/);
assert.equal(extra.length, 0);
const creation = JSON.parse(
  readFileSync(
    new URL("human-consent-2r-creation-2026-09-07.json", import.meta.url),
    "utf8",
  ),
);
const deployment = JSON.parse(
  readFileSync(new URL("../lib/deployment.json", import.meta.url), "utf8"),
);
const wallets = {
  A: "0xAb99c741494bEF91FAE66144dda31Be93180baD4",
  B: "0xE6E7bfFA242d2900fad7067012564d441F735c43",
};
const expectedWallet = wallets[walletLabel];
const expectedCount = walletLabel === "A" ? 1 : 2;
const expectedParticipants = Object.values(wallets).slice(0, expectedCount);
const poolId = creation.storedPool.id;
assert.equal(creation.passed, true);
assert.equal(poolId, "human-consent-2r-20260907-093128");
assert.equal(deployment.rpcUrl, "https://studio.genlayer.com/api");
assert.equal(deployment.chainId, 61999);
assert.equal(deployment.protocolVersion, 3);
assert.equal(deployment.contractAddress, creation.contract);
assert.equal(creation.contract, "0x7279B4A7821c96489c0b086021F3E6944d343bFB");
const outputFile = new URL(
  `human-consent-2r-join-${walletLabel.toLowerCase()}-2026-09-07.json`,
  import.meta.url,
);
assert.equal(
  existsSync(outputFile),
  false,
  "Refusing to overwrite a checkpoint",
);
const client = createClient({
  chain: chains.studionet,
  endpoint: deployment.rpcUrl,
});
assert.equal(Number(await client.getChainId()), 61999);
const response = await fetch(deployment.rpcUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getTransactionByHash",
    params: [joinHash],
  }),
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 200);
const envelope = await response.json();
assert.ok(!envelope.error && envelope.result, "Join receipt unavailable");
const receipt = envelope.result;
assert.equal(receipt.hash, joinHash);
assert.equal(transactionStatus(receipt), "FINALIZED");
assert.equal(executionState(receipt), "success");
assert.equal(receipt.from_address.toLowerCase(), expectedWallet.toLowerCase());
assert.equal(
  receipt.to_address.toLowerCase(),
  deployment.contractAddress.toLowerCase(),
);
assert.equal(String(receipt.value), "100");
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
assert.equal(typeof receipt.data.calldata, "string");
const input = plain(
  abi.calldata.decode(Buffer.from(receipt.data.calldata, "base64")),
);
assert.deepEqual(input, { args: [poolId], method: "join" });
const leaders = receipt.consensus_data.leader_receipt;
const leader = Array.isArray(leaders) ? leaders[0] : leaders;
assert.equal(typeof leader.result, "string");
const resultBytes = Buffer.from(leader.result, "base64");
assert.equal(
  resultBytes[0],
  0,
  "Expected VM return code 0, not rollback/error",
);
const output = plain(abi.calldata.decode(resultBytes.subarray(1)));
assert.deepEqual(output, {
  participant_count: String(expectedCount),
  player: receipt.from_address,
  pool_id: poolId,
  stake_wei: "100",
});
async function read(functionName, args) {
  return client.readContract({
    address: deployment.contractAddress,
    functionName,
    args,
    jsonSafeReturn: true,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}
const [pool, participant, cohort, credit] = await Promise.all([
  read("get_pool", [poolId]),
  read("get_participant", [poolId, expectedWallet]),
  read("list_participants", [poolId, 0n, 2n]),
  read("get_credit", [expectedWallet]),
]);
assert.deepEqual(pool, {
  ...creation.storedPool,
  participant_count: expectedCount,
  total_staked_wei: String(expectedCount * 100),
});
assert.equal(cohort.total, expectedCount);
assert.equal(cohort.items.length, expectedCount);
assert.deepEqual(
  cohort.items.map((item) => item.address.toLowerCase()).sort(),
  expectedParticipants.map((address) => address.toLowerCase()).sort(),
);
assert.equal(participant.address.toLowerCase(), expectedWallet.toLowerCase());
assert.equal(participant.stake_wei, "100");
assert.equal(participant.status, "active");
assert.equal(participant.rounds_passed, 0);
assert.equal(participant.refund_claimed, false);
assert.equal(participant.settlement_credit_wei, "0");
assert.equal(participant.last_attempt_id, "");
assert.equal(credit.account.toLowerCase(), expectedWallet.toLowerCase());
assert.equal(credit.credit_wei, "0");
for (const item of cohort.items) {
  assert.equal(item.stake_wei, "100");
  assert.equal(item.rounds_passed, 0);
  assert.equal(item.status, "active");
  const joinedMillis = Date.parse(item.joined_at);
  assert.ok(Number.isFinite(joinedMillis));
  assert.ok(joinedMillis >= Date.parse(pool.created_at));
  assert.ok(
    joinedMillis < pool.join_deadline * 1000,
    "Stored join timestamp must precede the deadline",
  );
}
assert.equal(Date.parse(participant.joined_at), Date.parse(receipt.created_at));
const report = {
  product: "commitment-pools",
  passed: true,
  verifiedAtUtc: new Date().toISOString(),
  scope: `Read-only independent verification immediately after Wallet ${walletLabel}'s human-approved join`,
  chainId: 61999,
  rpc: deployment.rpcUrl,
  contract: deployment.contractAddress,
  poolId,
  walletLabel,
  transaction: {
    hash: receipt.hash,
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
    output,
  },
  storedPool: pool,
  participant,
  cohort,
  credit,
  scheduleUtc: creation.scheduleUtc,
  checks: {
    exactApprovedInputSenderTargetAndValue: true,
    finalizedAndSuccessfulExecution: true,
    expectedCohortAndStakeTotal: true,
    allOtherPoolFieldsUnchangedFromCreation: true,
    storedJoinTimestampsWithinFormationWindow: true,
    zeroProofProgressAndNoCredit: true,
  },
  limits:
    "No account, key, signature, wallet-provider call or on-chain write used. Eligibility checked against stored chain timestamps, not observation time. This checkpoint does not verify activation, round transitions, future proofs or payouts.",
};
writeFileSync(outputFile, JSON.stringify(report, null, 2) + "\n", {
  flag: "wx",
});
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      verifiedAtUtc: report.verifiedAtUtc,
      transaction: report.transaction,
      participant,
      participantCount: pool.participant_count,
      totalStakedWei: pool.total_staked_wei,
      checks: report.checks,
      reportFile: outputFile.pathname,
    },
    null,
    2,
  ),
);
