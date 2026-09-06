# Commitment Pools — human wallet acceptance

Status: partially verified on the September release. Human login/rejection, account/network resets, two-way populated Activity UI isolation and the underfilled-pool full-refund path passed. The full two-participant proof/settlement lifecycle remains incomplete; see the [private observation record](frontend/verification/human-wallet-2026-09-06.md). A script signing an ephemeral account is not this test. Use Studionet only for transactions, with the user's own approvals at every wallet popup. Switching away is a read-only safety check: never send a transaction on the other network. Never request, export or record private keys or session credentials.

## Release and actors

- Record the tested commit, exact Vercel URL, browser/extension versions and UTC start time.
- Confirm chain 61999, core `0x7279B4A7821c96489c0b086021F3E6944d343bFB` and helper `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D`.
- Confirm two distinct participant wallets A and B with enough test GEN. Prior Dispute Court approvals are not approvals for this product.
- Initial trial: 100 wei each (`0.0000000000000001 GEN`), two participants, one one-hour round, 15-minute formation. Only A joined before formation ended; the full stake was subsequently returned through the independently verified formation-refund path. Propose a 60-minute formation window for the retry, subject to the owner's approval; do not silently create a replacement. Review the exact terms and snapshotted fee before creation. The creator must separately join if participating.
- All-fail policy is `refund_minus_fee`: at a 500 bps snapshot, two failed 100-wei participants receive 95 wei each and the fee recipient receives 10 wei. If both pass, each receives 100 wei and the fee is zero. These are expectations, not observed payouts.

## Wallet and recovery checks

1. Open the intended release in Chrome with the supported injected EVM wallet. Confirm there is no email registration/password form.
2. Reject the first login signature. Verify the user remains signed out and sees a cancellation message. Approve a fresh origin/product-bound login signature; confirm no transaction or value transfer was requested.
3. Reload and restore the same wallet session. Prepare an unsent draft and test network and account changes separately. In MetaMask, keep the Commitment Pools tab active, select the network control beside that site's connection, and change that connection to Ethereum without sending anything. In the user's September screenshot, this was the `G` dropdown in the bottom connection bar; other versions expose it through a connected-site icon. Changing the portfolio's network filter alone does not test the site's connection; MetaMask manages networks per website ([official instructions](https://support.metamask.io/configure/networks/how-to-change-networks/)). Record the site-specific network shown. Before reloading, verify private views and pending form approvals clear and writes stay blocked until a matching login and fresh state read succeed. Return the site's connection to Studionet and sign in again, then prepare another unsent draft and repeat the account-change check with the other participant wallet. Do not mark either check passed solely from a reported switch or a draft cleared by a browser reload.
4. Prepare creation, reject its wallet transaction, and confirm Activity records an unsigned cancellation with no hash. Review and retry deliberately; preserve the actual transaction hash and final execution result.
5. During a subsequent form, switch browser focus and refresh chain data. Unchanged recorded terms must retain drafts and evidence review. Changed wallet, pool, round or recorded terms must require fresh consent. Never repeat an uncertain transaction; reconcile its hash first.

## Full pool lifecycle

1. Approve a new pool with a unique clearly labeled test ID. Export the stored creation record, `terms_hash`, `join_deadline`, `activity_starts_at` and `activity_ends_at`.
2. A and B each review terms and approve the exact 100-wei join. Verify both receipts are finalized **and successful**, and the recorded cohort/stake values agree.
3. Wait for the stored chain formation deadline. Confirm activation is denied before it and accepted on/after it, but before the first round closes. Do not change a local clock or infer eligibility solely from elapsed wall time.
4. Use a deliberately low-sensitivity, public source and `source_verified` rules. Capture and review the complete text for each wallet, recording URL, normalized byte count, digest, capture ID and transaction. Submit each proof during its stored round window, recording exact proof/nonce inputs, attempt payloads and actual verdicts. Do not claim a technical source-content fixture proves a real person's off-chain work; if using real progress notes, the rules must explicitly bind the participant and round.
5. Once all participants are terminal or the stored activity deadline has elapsed, approve settlement. Record the actual settlement payload, fee, per-wallet credits and conservation total. If a model/source call fails, retain the hash/result, retry only within the original attempt/time limits, and use deterministic deadline settlement if needed.
6. A and B separately approve withdrawal of their actual available credits. Verify each successful parent and each finalized, credited native child: sender, intended recipient and exact wei. A successful withdrawal call alone is not proof of delivery.
7. Reload Activity and export the pool, attempts, settlement and delivery evidence. Reconnect each wallet and confirm private data remains isolated. Redact only secrets, not failures or inconvenient outcomes.

## Completion record

Save the exact inputs, stored timestamps, transaction hashes, output payloads, expected versus actual errors/verdicts and independent payout checks at an immutable private commit. Public access and submission remain deferred until the owner separately approves them; keeping the repository and preview private does not make on-chain records private. Record rejected prompts as human observations, never fabricate rejected transaction hashes. Retain honest notes for unsupported wallet types and failed/retried steps. Do not mark this checklist passed until every required step is actually observed.
