// Accountless, read-only checkpoint after activation and before any proof.
// Usage: node verification/verify-human-consent-2r-activation-2026-09-07.mjs <observed-hash>
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

try {
  const [hash, ...extra] = process.argv.slice(2);
  assert.match(hash ?? "", /^0x[0-9a-fA-F]{64}$/);
  assert.equal(extra.length, 0);
  const checkpoint = (filename) =>
    JSON.parse(readFileSync(new URL(filename, import.meta.url), "utf8"));
  const creation = checkpoint("human-consent-2r-creation-2026-09-07.json");
  const joined = checkpoint("human-consent-2r-join-b-2026-09-07.json");
  const poolId = "human-consent-2r-20260907-093128";
  const contract = "0x7279B4A7821c96489c0b086021F3E6944d343bFB";
  const wallet = "0xE6E7bfFA242d2900fad7067012564d441F735c43";
  const rpc = "https://studio.genlayer.com/api";
  assert.equal(creation.passed, true);
  assert.equal(joined.passed, true);
  assert.equal(creation.contract, contract);
  assert.equal(joined.contract, contract);
  assert.equal(creation.storedPool.id, poolId);
  assert.equal(joined.storedPool.id, poolId);
  const outputFile = new URL(
    "human-consent-2r-activation-2026-09-07.json",
    import.meta.url,
  );
  assert.equal(
    existsSync(outputFile),
    false,
    "Refusing to overwrite checkpoint",
  );

  stage = "chain and receipt fetch";
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

  stage = "receipt, calldata and VM result assertions";
  assert.equal(receipt.hash, hash);
  assert.equal(transactionStatus(receipt), "FINALIZED");
  assert.equal(executionState(receipt), "success");
  assert.equal(receipt.from_address.toLowerCase(), wallet.toLowerCase());
  assert.equal(receipt.to_address.toLowerCase(), contract.toLowerCase());
  assert.equal(String(receipt.value), "0");
  const input = plain(
    abi.calldata.decode(Buffer.from(receipt.data.calldata, "base64")),
  );
  assert.deepEqual(input, { args: [poolId], method: "activate_pool" });
  const leaders = receipt.consensus_data.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  const resultBytes = Buffer.from(leader.result, "base64");
  assert.equal(resultBytes[0], 0, "Expected VM return, not rollback/error");
  const output = plain(abi.calldata.decode(resultBytes.subarray(1)));

  stage = "finalized pool, cohort and schedule reads";
  const read = (functionName, args) =>
    client.readContract({
      address: contract,
      functionName,
      args,
      jsonSafeReturn: true,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
  const [pool, cohort, round1, round2, credit] = await Promise.all([
    read("get_pool", [poolId]),
    read("list_participants", [poolId, 0n, 2n]),
    read("get_round", [poolId, 1n]),
    read("get_round", [poolId, 2n]),
    read("get_credit", [wallet]),
  ]);

  stage = "stored activation timestamp and unchanged terms assertions";
  const activatedMillis = Date.parse(pool.activated_at);
  assert.ok(Number.isFinite(activatedMillis));
  assert.equal(activatedMillis, Date.parse(receipt.created_at));
  assert.ok(activatedMillis >= creation.storedPool.join_deadline * 1000);
  assert.ok(
    activatedMillis <
      (creation.storedPool.activity_starts_at +
        creation.storedPool.round_window_seconds) *
        1000,
  );
  assert.deepEqual(pool, {
    ...joined.storedPool,
    status: "active",
    activated_at: pool.activated_at,
  });
  assert.deepEqual(cohort, joined.cohort);
  assert.deepEqual(credit, joined.credit);
  assert.deepEqual(round1, {
    round: 1,
    opens_at: 1788778487,
    closes_at: 1788782087,
  });
  assert.deepEqual(round2, {
    round: 2,
    opens_at: 1788782087,
    closes_at: 1788785687,
  });
  const summaryKeys = [
    "id",
    "title",
    "verification_mode",
    "stake_wei",
    "rounds_required",
    "min_players",
    "max_players",
    "participant_count",
    "status",
    "join_deadline",
    "activity_starts_at",
    "activity_ends_at",
    "fee_bps",
    "terms_hash",
  ];
  assert.deepEqual(
    output,
    Object.fromEntries(
      summaryKeys.map((key) => [
        key,
        typeof pool[key] === "number" ? String(pool[key]) : pool[key],
      ]),
    ),
  );

  stage = "write new immutable local checkpoint";
  const report = {
    product: "commitment-pools",
    passed: true,
    verifiedAtUtc: new Date().toISOString(),
    scope: "Read-only independent activation verification before any proof",
    chainId: 61999,
    rpc,
    contract,
    poolId,
    walletLabel: "B",
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
      output,
    },
    storedPool: pool,
    cohort,
    rounds: [round1, round2],
    credit,
    checks: {
      exactInputSenderTargetAndZeroValue: true,
      finalizedAndSuccessfulExecution: true,
      outputIsExactActivePoolSummary: true,
      storedActivationMatchesReceiptTimestamp: true,
      storedActivationWithinOriginalGraceWindow: true,
      termsAndScheduleUnchanged: true,
      participantsUnchangedAndNoProofProgress: true,
      walletBCreditUnchanged: true,
    },
    limits:
      "No account, key, signature, wallet-provider call or on-chain write used. Eligibility uses stored chain timestamps, not observation time. This does not verify human interaction inside MetaMask, later proofs, round transitions, settlement or payouts.",
  };
  writeFileSync(outputFile, JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
  });
  console.log(
    JSON.stringify(
      {
        passed: true,
        verifiedAtUtc: report.verifiedAtUtc,
        transaction: report.transaction,
        activatedAt: pool.activated_at,
        checks: report.checks,
        reportFile: outputFile.pathname,
      },
      null,
      2,
    ),
  );
} catch {
  // Raw RPC errors can contain unrelated upstream diagnostics: never dump them.
  console.error(
    `Activation checkpoint failed during: ${stage}. No retry sent.`,
  );
  process.exitCode = 1;
}
