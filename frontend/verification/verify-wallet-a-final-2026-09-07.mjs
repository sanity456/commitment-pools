import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Offline comparison only: no wallet, session, network or transaction access.
const [activityPath, poolPath, outputPath] = process.argv.slice(2);
assert(
  activityPath && poolPath,
  "Provide the actual Activity and pool downloads.",
);
const evidenceDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(evidenceDir, "..");
const walletA = "0xab99c741494bef91fae66144dda31be93180bad4";
const poolId = "human-wallet-60m-20260906-131207";
const core = "0x7279b4a7821c96489c0b086021f3e6944d343bfb";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => {
  const bytes = readFileSync(path);
  return {
    path: resolve(path).replaceAll("\\", "/"),
    byteCount: bytes.length,
    sha256: sha256(bytes),
    data: JSON.parse(bytes.toString("utf8")),
  };
};
const currentEvidence = readJson(
  resolve(evidenceDir, "human-wallet-lifecycle-60m-2026-09-06.json"),
);
const previousEvidence = readJson(
  resolve(evidenceDir, "human-wallet-lifecycle-2026-09-06.json"),
);
const activity = readJson(activityPath);
const pool = readJson(poolPath);
const current = currentEvidence.data;
const previous = previousEvidence.data;

// Journal timestamps can use UTC while the independent receipt uses -07:00.
// Compare the same instant without discarding the six-digit chain precision.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, canonical(item)]),
    );
  if (typeof value === "string") {
    const iso =
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/.exec(
        value,
      );
    if (iso) {
      const milliseconds = Date.parse(iso[1] + iso[3]);
      assert(Number.isFinite(milliseconds), "Invalid recorded timestamp");
      return (
        "unix-microseconds:" +
        (BigInt(milliseconds) * 1000n + BigInt((iso[2] || "").padEnd(6, "0")))
      );
    }
  }
  return value;
}

function intentArguments(row) {
  const args = JSON.parse(row.args_json);
  // The UI stores these five bounded create_pool integers as JSON numbers;
  // GenLayer's decoded receipt serializes them as decimal strings.
  if (row.method === "create_pool") {
    for (const index of [6, 7, 8, 9, 10]) {
      if (typeof args[index] === "number") {
        assert(Number.isSafeInteger(args[index]) && args[index] >= 0);
        args[index] = String(args[index]);
      }
    }
  }
  return args;
}

const allReceipts = [...current.transactions, ...previous.transactions];
const receiptByHash = new Map(
  allReceipts.map((receipt) => [receipt.hash, receipt]),
);
const expectedA = allReceipts.filter(
  (receipt) => receipt.sender.toLowerCase() === walletA,
);
assert.equal(expectedA.length, 10);

function verifyTransaction(transaction) {
  const receipt = receiptByHash.get(transaction.hash);
  assert(receipt, `Unknown exported transaction ${transaction.hash}`);
  assert.equal(transaction.wallet.toLowerCase(), receipt.sender.toLowerCase());
  assert.equal(transaction.target.toLowerCase(), receipt.target.toLowerCase());
  assert.equal(transaction.method, receipt.method);
  assert.equal(transaction.value_wei, receipt.valueWei);
  assert.equal(transaction.status, "FINALIZED");
  assert.equal(transaction.execution, "success");
  assert.equal(transaction.error, "");
  assert.equal(receipt.status, "FINALIZED");
  assert.equal(receipt.execution, "success");
  assert.equal(receipt.resultCode, 0);
  assert.equal(receipt.resultCodeName, "return");
  assert.equal(transaction.method, receipt.decodedInput.method);
  // Empty withdrawal args are intentionally absent in the decoded calldata.
  assert.deepEqual(
    JSON.parse(transaction.args_json),
    receipt.decodedInput.args ?? [],
  );
  assert.deepEqual(
    canonical(JSON.parse(transaction.result_json)),
    canonical(receipt.output),
  );
  // The journal stores milliseconds, unlike the full timestamp in the receipt.
  assert.equal(transaction.created_at, Date.parse(receipt.createdAt));
  return receipt;
}

assert.equal(activity.data.scope, "This page only");
assert.equal(activity.data.total, 10);
assert.equal(activity.data.offset, 0);
assert.equal(activity.data.items.length, 10);
assert.deepEqual(
  activity.data.items.map((row) => row.tx_hash).sort(),
  expectedA.map((receipt) => receipt.hash).sort(),
);
for (const row of activity.data.items) {
  assert.equal(row.wallet, walletA);
  assert.equal(row.user_id, `wallet:commitment-pools:61999:${walletA}`);
  assert.equal(row.status, "success");
  assert.equal(row.error, "");
  assert.equal(row.tx_hash, row.transaction.hash);
  const receipt = verifyTransaction(row.transaction);
  assert.equal(row.target.toLowerCase(), receipt.target.toLowerCase());
  assert.equal(row.method, receipt.method);
  assert.equal(row.value_wei, receipt.valueWei);
  assert.deepEqual(intentArguments(row), receipt.decodedInput.args ?? []);
}

const withdrawal = activity.data.items.find(
  (row) => row.tx_hash === current.withdrawalA.transactionHash,
);
assert(withdrawal, "Wallet A's current-trial withdrawal must be present");
const payout = JSON.parse(withdrawal.transaction.payout_json);
const nativeChild = current.withdrawalA.nativeChild;
assert.equal(withdrawal.transaction.payout_state, "delivered");
assert.equal(payout.id, "payout-00000006");
assert.equal(payout.amount_wei, "100");
assert.equal(payout.recipient.toLowerCase(), walletA);
assert.equal(payout.children.length, 1);
const exportedChild = payout.children[0];
assert.equal(exportedChild.hash, nativeChild.hash);
assert.equal(exportedChild.status, "FINALIZED");
assert.equal(exportedChild.delivered, true);
assert.equal(exportedChild.value, nativeChild.valueWei);
assert.equal(exportedChild.value, "100");
assert.equal(exportedChild.recipient.toLowerCase(), walletA);
assert.equal(nativeChild.parentHash, withdrawal.tx_hash);
assert.equal(nativeChild.sender.toLowerCase(), core);
assert.equal(nativeChild.recipient.toLowerCase(), walletA);
assert.equal(nativeChild.type, 0);
assert.equal(nativeChild.status, "FINALIZED");
assert.equal(nativeChild.valueCredited, true);

assert.equal(pool.data.product, "commitment-pools");
assert.equal(pool.data.network, "studionet");
assert.equal(pool.data.contract.toLowerCase(), core);
assert.equal(pool.data.url, `http://localhost:4195/pools/${poolId}`);
assert.equal(pool.data.record.id, poolId);
assert.deepEqual(
  pool.data.record,
  current.withdrawalA.successVerification.storedPool,
);
assert.deepEqual(
  pool.data.participants,
  current.settlement.successVerification.participants.items,
);
assert.equal(pool.data.participants.length, 2);
const expectedPoolCalls = current.transactions.filter(
  (receipt) =>
    receipt.target.toLowerCase() === core && receipt.method !== "withdraw",
);
assert.equal(expectedPoolCalls.length, 7);
assert.equal(pool.data.history.transactions.length, 7);
assert.deepEqual(
  pool.data.history.transactions.map((transaction) => transaction.hash).sort(),
  expectedPoolCalls.map((receipt) => receipt.hash).sort(),
);
for (const transaction of pool.data.history.transactions) {
  assert.equal(transaction.record_id, poolId);
  verifyTransaction(transaction);
}
assert.equal(
  pool.data.coverage,
  "Observed state changes and tracked transactions, not a complete blockchain archive.",
);

const checks = {
  activityOnlyWalletA: true,
  allTenObservedARequestsMatchBothHistoricalTrials: true,
  allSixCurrentTrialAReceiptsPresent: true,
  exactTargetsValuesAndDecodedArgumentsMatch: true,
  allSavedExecutionsFinalizedAndSuccessful: true,
  fullReturnPayloadsMatchWithMicrosecondPreservingTimezoneNormalization: true,
  journalTransactionTimestampsMatchReceiptsAtJournalMillisecondPrecision: true,
  currentTrialPayoutMatchesPriorIndependentFinalizedCreditedNativeChild: true,
  poolRecordIncludingStoredDeadlinesAndTermsHashUnchanged: true,
  bothPublicParticipantsMatchPriorSettlement: true,
  sevenPoolScopedCoreCallsMatchExactHistoricalReceipts: true,
};
const sourceFiles = [
  "components/ProductHome.tsx",
  "components/ActivityPanel.tsx",
  "components/DirectoryPanel.tsx",
  "components/RecordTools.tsx",
  "components/WalletAuthScreen.tsx",
  "components/Brand.tsx",
  "lib/credit-guidance.ts",
  "lib/reminders.ts",
  "app/globals.css",
  "app/product-tools.css",
  "app/layout.tsx",
];
const report = {
  product: "commitment-pools",
  scope:
    "Local authenticated A Activity recovery/export and zero-credit UI follow-up; no new payout or deployment",
  passed: true,
  comparedAtUtc: new Date().toISOString(),
  sourceBaselineCommit: "cd79acc2c7216231d1cba810a2ef32d390e01f58",
  sourceState: "Uncommitted working tree; not immutable submission evidence",
  observedUiRecord: "human-wallet-a-final-2026-09-07.md",
  workingTreeSourceSha256: Object.fromEntries(
    sourceFiles.map((path) => [
      path,
      sha256(readFileSync(resolve(frontendDir, path))),
    ]),
  ),
  comparisonScriptSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
  historicalEvidence: [currentEvidence, previousEvidence].map(
    ({ path, byteCount, sha256 }) => ({ path, byteCount, sha256 }),
  ),
  checks,
  normalizationNotes: [
    "Only the five bounded create_pool integer argument positions are normalized from safe JSON numbers to decoded decimal strings for the intent comparison.",
    "Raw exported transaction arguments match decoded receipt arguments; an absent args field for withdraw is equivalent to the exported empty list.",
    "ISO offsets are compared as UTC microsecond instants; raw input files and historical timestamps are retained unchanged.",
    "Journal created_at is explicitly compared at its stored millisecond precision; no local clock determines contract eligibility.",
  ],
  limits: [
    "This is an offline comparison to prior independent chain evidence, not a new independent RPC payout verification.",
    "Activity is A's private page; the separate pool export intentionally includes both public cohort participants.",
    "Pool history contains seven pool-scoped core calls, not helper captures or account-scoped withdrawals. The full historical lifecycle retains those separately.",
    "This does not rerun the contract suite, live early rejection, all-fail lifecycle, cancellation retry, complete consent matrix, or public Ubuntu CI.",
  ],
  activityExport: activity,
  poolRecordExport: pool,
};
if (outputPath) {
  // Refuse to overwrite an existing evidence checkpoint.
  writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
  });
}
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      comparedAtUtc: report.comparedAtUtc,
      checks,
      activity: {
        byteCount: activity.byteCount,
        sha256: activity.sha256,
        exportedAt: activity.data.exportedAt,
      },
      pool: {
        byteCount: pool.byteCount,
        sha256: pool.sha256,
        exportedAt: pool.data.exportedAt,
      },
      reportPath: outputPath ? resolve(outputPath) : null,
    },
    null,
    2,
  ),
);
