// Read-only human withdrawal and linked native-delivery check; no wallet access.
// Usage: node verification/verify-human-consent-2r-withdraw-2026-09-07.mjs B|A <observed-hash>
// B is verified against settlement; A is verified against the completed B payout.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import { abi, createClient, chains } from "../vendor/genlayer-js/index.js";
import { TransactionHashVariant } from "../vendor/genlayer-js/types/index.js";
import { executionState, transactionStatus } from "../lib/receipt.ts";
import { nativePayoutDelivered } from "../lib/payout.ts";

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
  assert.ok(parts, "Expected stored ISO timestamp");
  const milliseconds = Date.parse(parts[1] + parts[3]);
  assert.ok(Number.isFinite(milliseconds));
  return BigInt(milliseconds) * 1000n + BigInt((parts[2] ?? "").padEnd(6, "0"));
}
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

try {
  const [label, hash, ...extra] = process.argv.slice(2);
  assert.ok(["B", "A"].includes(label));
  assert.match(hash ?? "", /^0x[0-9a-fA-F]{64}$/);
  assert.equal(extra.length, 0);
  const wallets = {
    A: "0xAb99c741494bEF91FAE66144dda31Be93180baD4",
    B: "0xE6E7bfFA242d2900fad7067012564d441F735c43",
  };
  const wallet = wallets[label];
  const otherLabel = label === "B" ? "A" : "B";
  const poolId = "human-consent-2r-20260907-093128";
  const contract = "0x7279B4A7821c96489c0b086021F3E6944d343bFB";
  const rpc = "https://studio.genlayer.com/api";
  const priorName =
    label === "B"
      ? "human-consent-2r-settlement-2026-09-07.json"
      : "human-consent-2r-withdraw-b-2026-09-07.json";
  const requestName = `human-consent-2r-withdraw-${label.toLowerCase()}-request-2026-09-07.json`;
  const checkpoint = (name) =>
    JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
  const prior = checkpoint(priorName);
  const request = checkpoint(requestName);
  const outputFile = new URL(
    `human-consent-2r-withdraw-${label.toLowerCase()}-2026-09-07.json`,
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
  assert.equal(prior.storedPool.status, "settled");
  assert.equal(prior.storedPool.total_staked_wei, "200");
  assert.equal(prior.credits[label].account, wallet.toLowerCase());
  assert.equal(prior.credits[label].credit_wei, "100");
  if (label === "A") {
    assert.equal(prior.walletLabel, "B");
    assert.equal(prior.nativeChild.delivered, true);
    assert.equal(prior.credits.B.credit_wei, "0");
  }
  assert.equal(request.priorCheckpoint, priorName);
  assert.equal(request.poolId, poolId);
  assert.equal(request.contract, contract);
  assert.equal(request.chainId, 61999);
  assert.equal(request.walletLabel, label);
  assert.equal(request.expectedSender, wallet);
  assert.equal(request.expectedRecipient, wallet.toLowerCase());
  assert.equal(request.intendedMethod, "withdraw");
  assert.deepEqual(request.intendedArgs, []);
  assert.equal(request.valueWei, "0");
  assert.equal(request.preWithdrawalCreditWei, "100");
  assert.equal(request.expectedPayoutAmountWei, "100");

  stage = "chain and successful withdrawal receipt";
  const client = createClient({ chain: chains.studionet, endpoint: rpc });
  assert.equal(Number(await client.getChainId()), 61999);
  const fetchReceipt = async (transactionHash) => {
    const response = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [transactionHash],
      }),
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 200);
    const envelope = await response.json();
    assert.ok(!envelope.error && envelope.result, "Receipt unavailable");
    assert.equal(envelope.result.hash, transactionHash);
    return envelope.result;
  };
  const receipt = await fetchReceipt(hash);
  assert.equal(transactionStatus(receipt), "FINALIZED");
  assert.equal(executionState(receipt), "success");
  assert.equal(receipt.from_address.toLowerCase(), wallet.toLowerCase());
  assert.equal(receipt.to_address.toLowerCase(), contract.toLowerCase());
  assert.equal(String(receipt.value), "0");
  const input = plain(
    abi.calldata.decode(Buffer.from(receipt.data.calldata, "base64")),
  );
  assert.equal(input.method, "withdraw");
  assert.deepEqual(input.args ?? [], []);
  assert.deepEqual(
    Object.keys(input).sort(),
    input.args === undefined ? ["method"] : ["args", "method"],
  );
  const leaders = receipt.consensus_data.leader_receipt;
  const leader = Array.isArray(leaders) ? leaders[0] : leaders;
  const resultBytes = Buffer.from(leader.result, "base64");
  assert.equal(resultBytes[0], 0, "Expected VM return, not rollback/error");
  const output = plain(abi.calldata.decode(resultBytes.subarray(1)));
  assert.match(output.id, /^payout-[0-9]{8,}$/);
  const expectedFields = {
    recipient: wallet.toLowerCase(),
    amount_wei: "100",
    status: "emitted_for_finalization",
    delivery_note:
      "Emission is not confirmation; verify the finalized child transaction.",
  };
  assert.deepEqual(request.expectedOutput, expectedFields);
  assert.deepEqual(output, {
    ...expectedFields,
    id: output.id,
    emitted_at: output.emitted_at,
  });
  assert.equal(isoMicros(output.emitted_at), isoMicros(receipt.created_at));
  assert.ok(
    isoMicros(output.emitted_at) >= isoMicros(prior.storedPool.settled_at),
  );

  // Continue only after parent execution succeeded; emission alone is not delivery.
  stage = "exact linked native child and credited delivery";
  assert.ok(Array.isArray(receipt.triggered_transactions));
  assert.equal(receipt.triggered_transactions.length, 1);
  const childHash = receipt.triggered_transactions[0];
  assert.match(childHash, /^0x[0-9a-fA-F]{64}$/);
  const child = await fetchReceipt(childHash);
  assert.equal(child.triggered_by, hash);
  assert.equal(
    nativePayoutDelivered(child, { contract, recipient: wallet, amount: 100n }),
    true,
  );
  assert.equal(transactionStatus(child), "FINALIZED");
  assert.equal(child.type, 0);
  assert.equal(child.value_credited, true);
  assert.equal(child.from_address.toLowerCase(), contract.toLowerCase());
  assert.equal(child.to_address.toLowerCase(), wallet.toLowerCase());
  assert.equal(String(child.value), "100");
  assert.ok(isoMicros(child.created_at) >= isoMicros(receipt.created_at));

  stage = "finalized payout and unchanged settled state reads";
  const read = (functionName, args) =>
    client.readContract({
      address: contract,
      functionName,
      args,
      jsonSafeReturn: true,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
  const [payout, pool, cohort, creditA, creditB, feeRecipientCredit] =
    await Promise.all([
      read("get_payout", [output.id]),
      read("get_pool", [poolId]),
      read("list_participants", [poolId, 0n, 2n]),
      read("get_credit", [wallets.A]),
      read("get_credit", [wallets.B]),
      read("get_credit", [prior.storedPool.fee_recipient]),
    ]);
  assert.deepEqual(payout, output);
  assert.deepEqual(pool, prior.storedPool);
  assert.deepEqual(cohort, prior.cohort);
  const credits = { A: creditA, B: creditB, feeRecipient: feeRecipientCredit };
  assert.deepEqual(credits[label], {
    ...prior.credits[label],
    credit_wei: "0",
  });
  assert.deepEqual(credits[otherLabel], prior.credits[otherLabel]);
  assert.deepEqual(credits.feeRecipient, prior.credits.feeRecipient);

  stage = "cumulative delivery and remaining credit conservation";
  const nativeChild = {
    hash: child.hash,
    parentHash: child.triggered_by,
    sender: child.from_address,
    recipient: child.to_address,
    type: child.type,
    valueWei: String(child.value),
    status: transactionStatus(child),
    valueCredited: child.value_credited,
    receiptCreatedAt: child.created_at,
    delivered: true,
  };
  const earlierPayouts = prior.deliveredPayouts ?? [];
  assert.equal(earlierPayouts.length, label === "B" ? 0 : 1);
  if (label === "A") {
    assert.equal(earlierPayouts[0].walletLabel, "B");
    assert.equal(earlierPayouts[0].childHash, prior.nativeChild.hash);
    assert.equal(earlierPayouts[0].delivered, true);
  }
  const deliveredPayouts = [
    ...earlierPayouts,
    {
      walletLabel: label,
      parentHash: hash,
      childHash: child.hash,
      payoutId: output.id,
      amountWei: "100",
      recipient: wallet.toLowerCase(),
      delivered: true,
    },
  ];
  assert.equal(
    new Set(deliveredPayouts.map((item) => item.parentHash)).size,
    deliveredPayouts.length,
  );
  assert.equal(
    new Set(deliveredPayouts.map((item) => item.childHash)).size,
    deliveredPayouts.length,
  );
  assert.equal(
    new Set(deliveredPayouts.map((item) => item.payoutId)).size,
    deliveredPayouts.length,
  );
  const deliveredWei = deliveredPayouts.reduce(
    (sum, item) => sum + BigInt(item.amountWei),
    0n,
  );
  const remainingParticipantCreditWei =
    BigInt(creditA.credit_wei) + BigInt(creditB.credit_wei);
  assert.equal(pool.fee_wei, "0");
  assert.equal(
    deliveredWei + remainingParticipantCreditWei,
    BigInt(pool.total_staked_wei),
  );

  stage = "write new local withdrawal checkpoint";
  const report = {
    product: "commitment-pools",
    passed: true,
    verifiedAtUtc: new Date().toISOString(),
    scope: `Accountless independent Wallet ${label} withdrawal and finalized native delivery verification`,
    priorCheckpoint: priorName,
    requestCheckpoint: requestName,
    chainId: 61999,
    rpc,
    contract,
    poolId,
    walletLabel: label,
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
      triggeredTransactionIds: [...receipt.triggered_transactions],
    },
    expectedOutput: expectedFields,
    payout,
    nativeChild,
    storedPool: pool,
    cohort,
    credits,
    deliveredPayouts,
    conservation: {
      totalStakedWei: pool.total_staked_wei,
      deliveredWei: deliveredWei.toString(),
      remainingParticipantCreditWei: remainingParticipantCreditWei.toString(),
      feeWei: pool.fee_wei,
    },
    checks: {
      exactSenderTargetZeroValueAndNoArguments: true,
      parentFinalizedAndSuccessfulExecution: true,
      exactPayoutReturnAndStoredRecordMatch: true,
      emissionTimestampMatchesReceiptAtMicrosecondPrecision: true,
      withdrawalAfterStoredSettlementTimestamp: true,
      exactlyOneNativeChildLinkedInBothDirections: true,
      correctCoreSenderWalletRecipientAnd100Wei: true,
      nativeChildFinalizedAndValueCredited: true,
      currentWalletCreditZeroAndOtherWalletCreditUnchanged: true,
      settledPoolCohortAllocationsAndFeeRecipientCreditUnchanged: true,
      deliveredPlusRemainingCreditsConserve200Wei: true,
    },
    evidenceSha256: Object.fromEntries(
      [requestName, priorName].map((name) => [
        name,
        sha256(readFileSync(new URL(name, import.meta.url))),
      ]),
    ),
    verificationScriptSha256: sha256(readFileSync(new URL(import.meta.url))),
    limits: [
      "No wallet, account, key, signing, simulation or on-chain write used by this verifier.",
      "Delivery is proven by the separately linked FINALIZED native child with value_credited=true, not merely the emitted payout status or zero credit.",
      "Stored parent/child creation and payout emission timestamps are retained; none is mislabeled as an exact finalization-completion timestamp.",
      "No separate success reason_code exists for withdraw. VM return code 0 and the exact payout/native-delivery fields are checked instead.",
      "The earlier payout in an A checkpoint is preserved from its prior independently verified checkpoint; this does not request or repeat either withdrawal.",
      "This local record does not claim publication to an immutable GitHub commit, a new Ubuntu suite run, or completion of all submission requirements.",
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
        nativeChild,
        credits,
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
    `Withdrawal checkpoint failed during: ${stage}. No transaction or retry sent.`,
  );
  process.exitCode = 1;
}
