// Read-only Studionet receipt/state verification. No accounts, keys or writes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { abi, createClient, chains } from "../vendor/genlayer-js/index.js";
import { TransactionHashVariant } from "../vendor/genlayer-js/types/index.js";
import { executionState, transactionStatus } from "../lib/receipt.ts";

const proposalFile = new URL(
  "human-consent-draft-2026-09-07.json",
  import.meta.url,
);
const proposal = JSON.parse(readFileSync(proposalFile, "utf8")).proposal;
const deployment = JSON.parse(
  readFileSync(new URL("../lib/deployment.json", import.meta.url), "utf8"),
);
const creationHash =
  "0xeb5a03b84e781ece582a8861f6b85518604bfe4359d36022c18dcdbf0945cc44";
const walletA = "0xAb99c741494bEF91FAE66144dda31Be93180baD4";
assert.equal(deployment.rpcUrl, "https://studio.genlayer.com/api");
assert.equal(deployment.chainId, 61999);
assert.equal(deployment.protocolVersion, 3);
assert.equal(
  deployment.contractAddress,
  "0x7279B4A7821c96489c0b086021F3E6944d343bFB",
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
    params: [creationHash],
  }),
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 200);
const envelope = await response.json();
assert.ok(!envelope.error && envelope.result, "Creation receipt unavailable");
const receipt = envelope.result;
assert.equal(receipt.hash, creationHash);
assert.equal(transactionStatus(receipt), "FINALIZED");
assert.equal(executionState(receipt), "success");
assert.equal(receipt.from_address.toLowerCase(), walletA.toLowerCase());
assert.equal(
  receipt.to_address.toLowerCase(),
  deployment.contractAddress.toLowerCase(),
);
assert.equal(String(receipt.value), "0");
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
assert.equal(input.method, "create_pool");
assert.deepEqual(input.args, [
  proposal.poolId,
  proposal.title,
  proposal.description,
  proposal.rules,
  proposal.verificationMode,
  proposal.stakeWeiPerParticipant,
  String(proposal.roundsRequired),
  String(proposal.minimumPlayers),
  String(proposal.maximumPlayers),
  String(proposal.joinWindowSeconds),
  String(proposal.roundWindowSeconds),
]);
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
async function read(method, args) {
  return client.readContract({
    address: deployment.contractAddress,
    functionName: method,
    args,
    jsonSafeReturn: true,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}
const [pool, round1, round2] = await Promise.all([
  read("get_pool", [proposal.poolId]),
  read("get_round", [proposal.poolId, 1n]),
  read("get_round", [proposal.poolId, 2n]),
]);
assert.equal(pool.id, proposal.poolId);
assert.equal(pool.creator.toLowerCase(), walletA.toLowerCase());
assert.equal(pool.title, proposal.title);
assert.equal(pool.description, proposal.description);
assert.equal(pool.rules, proposal.rules);
assert.equal(pool.verification_mode, proposal.verificationMode);
assert.equal(pool.stake_wei, proposal.stakeWeiPerParticipant);
assert.equal(pool.rounds_required, 2);
assert.equal(pool.min_players, 2);
assert.equal(pool.max_players, 2);
assert.equal(pool.round_window_seconds, 3600);
assert.equal(pool.fee_bps, 500);
assert.equal(
  pool.fee_recipient.toLowerCase(),
  deployment.ownerAddress.toLowerCase(),
);
assert.equal(pool.status, "forming");
assert.equal(pool.participant_count, 0);
assert.equal(pool.total_staked_wei, "0");
const createdSecond = Math.floor(Date.parse(pool.created_at) / 1000);
assert.ok(Number.isSafeInteger(createdSecond));
assert.equal(pool.join_deadline, createdSecond + 3600);
assert.equal(pool.activity_starts_at, pool.join_deadline);
assert.equal(pool.activity_ends_at, pool.activity_starts_at + 7200);
assert.equal(round1.opens_at, pool.activity_starts_at);
assert.equal(round1.closes_at, round1.opens_at + 3600);
assert.equal(round2.opens_at, round1.closes_at);
assert.equal(round2.closes_at, pool.activity_ends_at);
for (const [key, value] of Object.entries(output))
  assert.equal(String(pool[key]), String(value), `Creation output ${key}`);
const termKeys = [
  "protocol_version",
  "max_source_bytes",
  "evidence_policy",
  "id",
  "title",
  "description",
  "rules",
  "verification_mode",
  "stake_wei",
  "rounds_required",
  "min_players",
  "max_players",
  "join_deadline",
  "activity_starts_at",
  "activity_ends_at",
  "round_window_seconds",
  "fee_bps",
  "fee_recipient",
  "all_fail_policy",
];
const terms = Object.fromEntries(
  termKeys.sort().map((key) => [key, pool[key]]),
);
assert.ok(termKeys.every((key) => pool[key] !== undefined));
const termsHash = createHash("sha256")
  .update(JSON.stringify(terms))
  .digest("hex");
assert.equal(termsHash, pool.terms_hash);
assert.equal(
  termsHash,
  "bcfe61d8c235494c4f85bb37cbceb612897c08dd1e9d9c33bd9c78d68f0bed10",
);
const iso = (seconds) => new Date(seconds * 1000).toISOString();
const report = {
  product: "commitment-pools",
  passed: true,
  verifiedAtUtc: new Date().toISOString(),
  scope:
    "Read-only independent verification of human-approved creation before any join",
  chainId: 61999,
  rpc: deployment.rpcUrl,
  contract: deployment.contractAddress,
  creation: {
    hash: creationHash,
    sender: receipt.from_address,
    target: receipt.to_address,
    valueWei: String(receipt.value),
    status: transactionStatus(receipt),
    execution: executionState(receipt),
    receiptCreatedAt: receipt.created_at,
    resultCode: resultBytes[0],
    resultCodeName: "return",
    decodedInput: input,
    output,
  },
  storedPool: pool,
  rounds: [round1, round2],
  verifiedTermsSha256: termsHash,
  scheduleUtc: {
    storedCreatedAt: pool.created_at,
    joinDeadline: iso(pool.join_deadline),
    round1Opens: iso(round1.opens_at),
    round1Closes: iso(round1.closes_at),
    round2Opens: iso(round2.opens_at),
    round2Closes: iso(round2.closes_at),
  },
  limits:
    "No wallet, signature or write used by this verifier. Creation is not proof of joins, activation, round transition or payout. Stored contract timestamps, not local clock eligibility assumptions, determine this schedule.",
};
const outputFile = new URL(
  "human-consent-2r-creation-2026-09-07.json",
  import.meta.url,
);
writeFileSync(outputFile, JSON.stringify(report, null, 2) + "\n", {
  flag: "wx",
});
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      verifiedAtUtc: report.verifiedAtUtc,
      creation: report.creation,
      scheduleUtc: report.scheduleUtc,
      termsHash,
      reportFile: outputFile.pathname,
    },
    null,
    2,
  ),
);
