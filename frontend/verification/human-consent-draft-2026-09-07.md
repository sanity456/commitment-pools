# Commitment Pools — unsigned consent checks and live-test proposal

Status: **six bounded creation-review checks passed; the live two-round proposal is unsigned and awaits approval**.

- Site: the existing [protected preview](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app/), source `363d79e1245725c57ec1c874f0b0675cf0dca1a6` from the previous release record.
- Observed wallet: `0xab99…bad4`. The retained tab initially showed `/auth/sign-in`; using its normal back link restored the existing A session without requesting another signature. This was not treated as a failed or expired session.
- Final observation: `2026-09-07T09:36:19Z`, an observation timestamp, not chain time.
- Exact draft fields and outcomes: [JSON record](human-consent-draft-2026-09-07.json).

## Completed without a transaction

1. Initial review: consent unchecked, confirmation disabled.
2. Check consent: confirmation enabled, but not clicked.
3. Back to edit; change one scheduled round to two: the new schedule appeared, consent was unchecked and confirmation disabled.
4. Acknowledge, return to edit, change the rule text and reopen review: the new rules appeared with consent unchecked and confirmation disabled.
5. Acknowledge, return to edit, change pool ID and title together and reopen review: the new identity appeared with consent unchecked and confirmation disabled.
6. Check and then uncheck the final draft's acknowledgement: confirmation became enabled and then disabled again.

These observations establish that an unsigned edited draft cannot carry its old acknowledgement through the review-dialog reopening flow. They do not isolate each field's invalidation logic from the dialog remount. They are not changes to published terms, which are immutable, and do not close the distinct live join/proof-consent or round-transition gaps.

One scoped checkbox evaluation timed out before a mutation. A fresh DOM snapshot confirmed the unchanged initial state; a directly named supported checkbox control then succeeded. No browser, clock or wallet state was injected or mocked to obtain these results.

## Proposed live test — not started

The deployed v3 source requires at least two participants and round windows of at least `3600` seconds. The prepared draft uses the existing human wallets A and B, two one-hour rounds and a 60-minute formation window. Allow roughly three hours of availability, with separate human approvals when needed. No exact deadlines can be claimed until creation successfully finalizes and the stored schedule is read.

- Pool ID: `human-consent-2r-20260907-093128`.
- Stake: `0.0000000000000001 GEN` (100 wei) per participant, 200 wei total, using Studionet test GEN only.
- Creation transfers zero value and would publish the sandbox rules permanently on-chain. Each wallet must separately join and approve its own stake.
- Source-verified exercise: check the two stated facts on `https://example.com` in each round. This tests the interface and source-content workflow, not real-world effort or identity.
- Current displayed forfeiture fee: 5%, snapshotted at creation. Both passing participants recover their stakes without a forfeiture fee; failed/missed rounds follow the displayed forfeiture policy. If all fail, the contract's refund-minus-fee policy applies; underfilled formation returns full refund credit.

After separately approved creation and joins, the planned checks are: review a forming pool and switch away/back; test changed wallet/network context with the owner making those switches; distinguish unchanged refreshes from real recorded-state changes; complete first-round proofs; confirm progression removes old proof/review state and blocks the next proof until the stored round opens; complete the second round, settle and independently verify any credited withdrawals. Every transaction remains subject to human wallet approval. A finalized status alone is not a successful execution; receipt verification must check both.

The final review is left open with its consent unchecked and `Confirm & open wallet` disabled. That button was never clicked. No wallet prompt, new journal request, transaction, on-chain pool or terms hash was created by these draft checks. No app/contract code, dependency, deployment, access policy or GitHub remote was changed. The original lifecycle and rejection snapshots remain untouched.
