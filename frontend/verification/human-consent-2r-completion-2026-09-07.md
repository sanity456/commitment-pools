# Commitment Pools — two-round human test complete

Status: **passed**, final independent verification `2026-09-07T12:50:44.137Z`. No further wallet approval or transaction is needed to close this run.

Pool: `human-consent-2r-20260907-093128`. Studionet `61999`, core `0x7279B4A7821c96489c0b086021F3E6944d343bFB`, helper `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D`. Human-approved MetaMask transactions used the [existing protected preview](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app/pools/human-consent-2r-20260907-093128), deployed from local UI commit `363d79e1245725c57ec1c874f0b0675cf0dca1a6`. The pre-run documented environment was Chrome `152.0.7977.83` (64-bit) and MetaMask `13.46.1`.

| Wallet            | Rounds passed | Stake   | Native delivery                                                               | Remaining credit |
| ----------------- | ------------- | ------- | ----------------------------------------------------------------------------- | ---------------- |
| A · `0xAb99…baD4` | 2/2           | 100 wei | [100 wei credited and finalized](human-consent-2r-withdraw-a-2026-09-07.json) | 0 wei            |
| B · `0xE6E7…5c43` | 2/2           | 100 wei | [100 wei credited and finalized](human-consent-2r-withdraw-b-2026-09-07.json) | 0 wei            |

Pool settled with two winners, no losers and no fee. **200 wei in = 200 wei delivered**, with zero participant or fee-recipient credit remaining. Each withdrawal's exact recipient/amount, native type, parent-child linkage, finality and `value_credited = true` were independently verified; parent success or payout emission alone was not accepted as delivery.

## Exact evidence

Eleven successful finalized parent transactions are recorded in these checkpoints:

1. [Creation and original terms/schedule](human-consent-2r-creation-2026-09-07.json).
2. [A's 100-wei join](human-consent-2r-join-a-2026-09-07.json).
3. [B's 100-wei join](human-consent-2r-join-b-2026-09-07.json).
4. [Activation](human-consent-2r-activation-2026-09-07.json).
5. [B round one](human-consent-2r-proof-b-round-1-2026-09-07.json).
6. [A round one](human-consent-2r-proof-a-round-1-2026-09-07.json).
7. [A round two, reconciled replacement](human-consent-2r-proof-a-round-2-2026-09-07.json).
8. [B round two](human-consent-2r-proof-b-round-2-2026-09-07.json).
9. [Settlement and exact allocations](human-consent-2r-settlement-2026-09-07.json).
10. [B withdrawal and native child](human-consent-2r-withdraw-b-2026-09-07.json).
11. [A withdrawal, native child and final conservation](human-consent-2r-withdraw-a-2026-09-07.json).

Stored round windows were `[10:54:47Z, 11:54:47Z)` and `[11:54:47Z, 12:54:47Z)` on September 7. All four stored proof timestamps fell inside their respective original windows. Settlement's stored timestamp was `12:33:07.256741Z`: both participants were already terminal, so the all-terminal branch allowed settlement before the original activity end. No local clock override or shortened round was used.

The [live chronology](human-consent-2r-live-2026-09-07.md) records human approvals, exact request checkpoints, account/session resets, live join consent, A's natural round transition, fresh source review for both wallets, completed-state controls and saved payout UI. Historical public captures were reused transparently; each proof re-fetched the source. This fixture tests public-page facts, not a person's identity or real-world work.

## Preserved exception and limits

One additional A round-two request was [canceled by the network](human-consent-2r-proof-a-round-2-canceled-2026-09-07.json), with no VM result or recorded proof attempt. The complete pool/cohort were verified unchanged before one deliberate replacement with a new nonce passed. Both records remain visible in Activity. The underlying runner/provider cause is unresolved; this is not relabeled as a user rejection, proof failure or clean first-attempt run.

The successful both-pass human lifecycle is complete. Unobserved all-fail/early-live-rejection branches, a deliberate retry of the separately rejected creation and exhaustive human consent permutations remain coverage limits, not new tests automatically started here. Confirm any additional required coverage against the actual program rules. The human wallet run used the protected origin; real-wallet login on the public alias was not observed.

At this run's original closeout the evidence was local and no new Ubuntu run was claimed. The subsequent [release verification](release-ubuntu-2026-09-07.md) committed this complete human bundle at `b4ca7a409523d8063d1c19e99e690f98d2b3e75a`, pushed it to the existing **private** repository and passed its complete configured Ubuntu pipeline, including deployed-source byte comparison. Those automated checks did not initiate another human test or wallet transaction. Public source/CI access still requires the owner's approval and signed-out verification. See [submission checklist](../../SUBMISSION_CHECKLIST.md) and [steward response](../../STEWARD-RESPONSE.md). No app/contract code, deployment or repository visibility was changed by this evidence closeout.
