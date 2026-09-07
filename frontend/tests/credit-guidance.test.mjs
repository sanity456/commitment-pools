import test from "node:test";
import assert from "node:assert/strict";
import { freshWalletCredit } from "../lib/credit-guidance.ts";
import { nextStep } from "../lib/reminders.ts";

const wallet = "0xabc";
const participant = {
  address: wallet,
  status: "success",
  refund_claimed: true,
};
const snapshot = {
  wallet,
  session: { signedIn: true, wallet },
  ready: true,
  busy: "",
  credit: "0",
  creditError: "",
};
const settled = { status: "settled" };

test("settled pools stop prompting another withdrawal when fresh credit is zero", () => {
  const guide = nextStep(
    settled,
    wallet,
    100,
    participant,
    freshWalletCredit(snapshot),
  );
  assert.equal(guide.title, "No credit to withdraw");
  assert.match(guide.detail, /Check Activity to confirm/);
  assert.doesNotMatch(guide.title, /paid|delivered|complete/i);
  assert.equal(guide.deadline, 0);
});

test("positive credit is wallet-wide and is not attributed to one pool", () => {
  const credit = "100000000000000000000000000000000000001";
  assert.equal(freshWalletCredit({ ...snapshot, credit }), credit);
  const guide = nextStep(settled, wallet, 100, participant, credit);
  assert.equal(guide.title, "Withdraw available credit");
  assert.match(guide.detail, /all your pools/);
});

test("loading, stale, failed and in-flight credit cannot produce payout guidance", () => {
  for (const change of [
    { ready: false },
    { busy: "Withdraw credit" },
    { creditError: "Read failed" },
    { credit: null },
    { wallet: "" },
    { session: null },
    { session: { signedIn: false, wallet } },
    { session: { signedIn: true, wallet: "0xdef" } },
  ]) {
    const credit = freshWalletCredit({ ...snapshot, ...change });
    assert.equal(credit, null);
    const guide = nextStep(settled, wallet, 100, participant, credit);
    assert.equal(guide.title, "Check your available credit");
  }
  assert.equal(freshWalletCredit({ ...snapshot, wallet: "0xABC" }), "0");
});

test("malformed credit is unknown rather than an invented zero or payable amount", () => {
  for (const credit of [
    "",
    " ",
    "-1",
    "NaN",
    "Infinity",
    "0.0",
    "1e2",
    "0x1",
    "01",
    " 1",
  ]) {
    assert.equal(freshWalletCredit({ ...snapshot, credit }), null);
    assert.equal(
      nextStep(settled, wallet, 100, participant, credit).title,
      "Check your available credit",
    );
  }
});

test("visitors do not receive participant withdrawal instructions", () => {
  for (const credit of [null, "0", "100"]) {
    assert.equal(
      nextStep(settled, "", 100, null, credit).title,
      "Pool settled",
    );
    assert.equal(
      nextStep(settled, wallet, 100, null, credit).title,
      "Pool settled",
    );
  }
});

test("unclaimed formation refunds remain the priority regardless of current credit", () => {
  const pool = { status: "refunding" };
  for (const credit of [null, "0", "100"]) {
    assert.equal(
      nextStep(
        pool,
        wallet,
        100,
        { ...participant, refund_claimed: false },
        credit,
      ).title,
      "Claim your formation refund",
    );
  }
  assert.equal(
    nextStep(pool, wallet, 100, participant, "0").title,
    "No credit to withdraw",
  );
  assert.equal(
    nextStep(pool, wallet, 100, participant, "100").title,
    "Withdraw available credit",
  );
  assert.equal(
    nextStep(pool, "", 100).title,
    "Formation refunds are available",
  );
});

test("closed and active pools retain their lifecycle guidance regardless of credit", () => {
  assert.equal(
    nextStep({ status: "cancelled" }, wallet, 100, participant, "100").title,
    "This pool is closed",
  );
  assert.equal(
    nextStep({ status: "active" }, wallet, 100, participant, "0").title,
    "Your rounds are complete",
  );
});
