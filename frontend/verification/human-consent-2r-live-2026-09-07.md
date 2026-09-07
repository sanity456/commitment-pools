# Commitment Pools — live two-round consent test

Current status: **COMPLETE — both wallets independently verified successful at 2/2; pool settled with zero fees; both 100-wei native payouts credited and finalized, conserving all 200 wei; both remaining credits zero. No wallet approval is pending.** See the [concise completion record](human-consent-2r-completion-2026-09-07.md).

- Preview: [Commitment Pools](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app/).
- Proposed pool ID: `human-consent-2r-20260907-093128`.
- Exact intended terms: [approved proposal](human-consent-draft-2026-09-07.json), including two one-hour rounds, a 60-minute formation window, two participants, 100 wei per participant and the displayed 500 bps forfeiture fee. Creation value is zero.
- The owner approved this setup with `yes`, interrupted before any creation action, and subsequently requested `start now`. The app was then signed out; a new user-approved login restored Wallet A (`0xab99…bad4`).
- Before creation, Activity still showed `1–10 of 10 saved requests`, with no request for this pool ID. The restored review displayed the exact approved terms and 5% fee.
- At `2026-09-07T09:54:03Z` (tool observation time), the agent checked the approved review acknowledgement and clicked `Confirm & open wallet` once. The UI entered `Waiting for wallet / finality…`, with review controls disabled. No MetaMask confirmation was performed by the agent.

At the initial request checkpoint, no hash or successful execution had yet been verified. The subsequent user reply `done` was reconciled against the app and chain instead of repeating creation.

## Verified creation

- Independent read-only verification completed at `2026-09-07T09:59:52.114Z`: [creation receipt and stored state](human-consent-2r-creation-2026-09-07.json), [verification script](verify-human-consent-2r-creation-2026-09-07.mjs).
- Transaction: `0xeb5a03b84e781ece582a8861f6b85518604bfe4359d36022c18dcdbf0945cc44`.
- Sender: Wallet A, `0xAb99c741494bEF91FAE66144dda31Be93180baD4`; target: core `0x7279B4A7821c96489c0b086021F3E6944d343bFB`; chain: `61999`; value: `0` wei.
- Status: `FINALIZED`; execution: `success`; decoded VM result code: `0` (`return`). Exact decoded inputs match the approved proposal. Finality alone was not treated as successful execution.
- Independently recomputed immutable terms SHA-256: `bcfe61d8c235494c4f85bb37cbceb612897c08dd1e9d9c33bd9c78d68f0bed10`, matching the stored contract, transaction output and visible UI.
- Pre-join chain snapshot: forming, zero participants, zero total staked, two required rounds, 100 wei per participant and 500 bps forfeiture fee.

The schedule below comes from stored contract timestamps, not the browser's device-time display. Actual eligibility still depends on chain execution time.

| Event                          | UTC, September 7, 2026 | Nigeria, September 7, 2026 |
| ------------------------------ | ---------------------- | -------------------------- |
| Stored creation                | 09:54:47.004041        | 10:54:47.004041            |
| Join deadline / round 1 opens  | 10:54:47               | 11:54:47                   |
| Round 1 closes / round 2 opens | 11:54:47               | 12:54:47                   |
| Round 2 closes                 | 12:54:47               | 13:54:47                   |

## Live pre-join consent checks

Observed by `2026-09-07T10:06:13Z` in the private preview, authenticated as Wallet A. [Structured checkpoint](human-consent-2r-prejoin-consent-2026-09-07.json).

1. Explicitly checking the exact-stake acknowledgement enabled the join action. No join was clicked during this check.
2. Refreshing unchanged terms retained the checked acknowledgement. During fresh reads the checkbox and join action were disabled; once refreshed, the checked acknowledgement and enabled join returned with the same terms hash.
3. Switching from the checked new pool to the old settled pool `human-wallet-60m-20260906-131207` removed the old workspace and join controls during loading. The settled pool displayed its own rules and one-round result. Returning to the new two-round pool reset the checkbox to unchecked and left join disabled. Its terms hash was rechecked and unchanged.

These are live UI observations, not an additional automated suite or completed round-transition test. A selector evaluation and a bounded locator wait timed out during browser tooling; fresh snapshots confirmed the loaded UI, without resending any transaction. No join, stake transfer, activation or proof had been initiated at this pre-join checkpoint.

## Wallet A join request

At `2026-09-07T10:07:40Z` (tool observation time), after announcing the exact amount and rechecking the unchanged rules, hash, two-round schedule and Wallet A identity, the agent checked the acknowledgement and clicked `Confirm terms & stake 0.0000000000000001 GEN` exactly once. This requests 100 wei on Studionet, within the previously approved two-wallet test. The UI immediately disabled wallet actions, Refresh and the join checkbox/button. The agent did not interact with MetaMask's confirmation controls.

The subsequent live status confirmed: `Join pool: request saved. Review the wallet confirmation. Never repeat a pending request.`

At the request checkpoint no join hash, successful execution or participant state change had yet been verified. The user's subsequent `done` was reconciled with the existing request; it was not repeated.

## Wallet A join verified

- Independent verification completed at `2026-09-07T10:12:13.366Z`: [exact receipt, output and stored state](human-consent-2r-join-a-2026-09-07.json), [read-only join verifier](verify-human-consent-2r-join-2026-09-07.mjs).
- Transaction: `0xe251fe6acfb538033372581a439acb68ad7117d8e055b1df1fba19152609ac85`.
- Sender: `0xAb99c741494bEF91FAE66144dda31Be93180baD4`; target: `0x7279B4A7821c96489c0b086021F3E6944d343bFB`; chain `61999`; exact value `100` wei.
- Exact input: `join("human-consent-2r-20260907-093128")`; status `FINALIZED`; execution `success`; expected and observed VM result code `0` (`return`).
- Receipt creation and stored participant join time both equal `2026-09-07T10:09:01.200999+00:00`, within the stored formation window. The observation clock was not used to assert eligibility.
- Output records Wallet A, the expected pool, `stake_wei: "100"` and `participant_count: "1"`. The finalized pool has exactly one participant and `total_staked_wei: "100"`; every other pool field is unchanged from the verified creation checkpoint.
- Participant state: active, 0/2 rounds passed, no attempt ID, no refund or settlement credit. Current contract withdrawal credit is zero.
- A full browser reload retained Wallet A's sign-in, selected pool and 0/2 participant state. After fresh reads, the UI showed `1 joined · minimum 2 · max 2`, no join controls for A, no proof submission or activation action during formation, and a disabled zero-credit withdrawal button. The current tab's error-log check returned no entries. These reload observations were recorded by `2026-09-07T10:12:37Z`.

The integration-testing skill's execution-success requirement was applied alongside finality and decoded output checks. The receipt verifier used no wallet, account creation, signing or on-chain write. No transaction rejection, early-proof contract call or successful round transition is claimed by this checkpoint.

At the A-join checkpoint, the next action was the human switch to Wallet B. B had not joined this pool. The join deadline remains `2026-09-07T10:54:47Z` / `11:54:47` Nigerian time.

## Reported Wallet B switch and login request

- After the user reported `done` to the instruction to switch to B, the live page at `2026-09-07T10:16:31Z` showed `Wallet or network changed. Sign in again to continue.` No browser reload, agent-initiated sign-out or new login preceded this observation.
- Wallet A's signed-in identity and participant workspace were absent. The pool selector contained only its disabled placeholder; the workspace required sign-in, credit showed `Sign in to view`, and withdrawal was disabled. There were no stale join or proof controls.
- Opening the visible Activity tab preserved the signed-out boundary: `Sign in to view activity`, with no saved request cards or A's transaction data exposed.
- The page's generic change notice alone does not establish which account or network is now selected. Wallet B's exact authenticated identity and Studionet connection remain to be verified after the user's fresh login; no broader network-switch or completed B-session isolation result is claimed yet.
- After explaining that the next action was a login signature without a fund transfer, the agent clicked the unique `Sign in with wallet →` button once. By `2026-09-07T10:17:29Z`, sign-in and Refresh controls were disabled while the Activity view remained gated. No MetaMask approval was performed by the agent, and no join was initiated for B.

At that request checkpoint the user still needed to sign the B login request. The subsequent `done` was reconciled without opening a duplicate login.

## Wallet B sign-in and pre-join UI verified

The live page at `2026-09-07T10:18:58Z` showed `Signed in · 0xe6e7…5c43` and the Studionet sandbox label. The new pool loaded as forming, with one participant (A), while B's own position correctly showed `Not a participant`. A appeared only as a separate public cohort member, not as B's own position. The join acknowledgement started unchecked and the exact-stake join button was disabled. Zero credit continued to disable withdrawal.

By `2026-09-07T10:20:34Z`, B's Activity showed exactly seven historical requests, all labelled B, even with the optional `Current wallet only` checkbox unchecked. The existing payout card displayed the full historical recipient `0xe6e7bffa242d2900fad7067012564d441f735c43`. All seven card texts were identical after `Refresh saved history`, and none contained a request for the new pool. A's saved creation/join requests were not shown. Returning to the pool workspace kept B's consent unchecked and join disabled; the displayed immutable hash matched the verified creation hash. See [the structured pre-join checkpoint](human-consent-2r-wallet-b-prejoin-2026-09-07.json).

These are visible signed-in UI and private-history checks. The login signature itself was not captured or independently inspected; the exact sender and chain of B's upcoming join must still be checked from its receipt. No new network-switch, completed proof-round transition or payout is claimed. B's previously approved 100-wei join is the next action; activation, both scheduled rounds and payout remain outstanding.

## Wallet B join request

At `2026-09-07T10:21:55Z` (tool observation time), after announcing the exact 100-wei amount, Studionet and unchanged approved terms, the agent checked B's fresh acknowledgement. The join button became enabled. The agent clicked `Confirm terms & stake 0.0000000000000001 GEN` once. Wallet actions, Refresh and the join controls then disabled while the app remained signed in as B. No MetaMask confirmation was performed by the agent.

The join remained unverified at the request checkpoint. The user's subsequent `done` was reconciled with that existing request, without a retry. The first live observation at `2026-09-07T10:23:06Z` showed accepted with a saved hash and writes still disabled; that intermediate state was not treated as final success. The app subsequently showed successful finalized execution.

## Wallet B join verified / formation wait

- Independent verification completed at `2026-09-07T10:23:55.225Z`: [exact receipt, output and stored state](human-consent-2r-join-b-2026-09-07.json), using the same read-only join verifier as A.
- Transaction: `0xdf7149ff33ad5c19647ab4094175a2140697b18c7f0eae7b98899791c15fea6a`.
- Sender: `0xE6E7bfFA242d2900fad7067012564d441F735c43`; target: `0x7279B4A7821c96489c0b086021F3E6944d343bFB`; chain `61999`; exact value `100` wei.
- Exact input: `join("human-consent-2r-20260907-093128")`; status `FINALIZED`; execution `success`; expected and observed VM result code `0` (`return`). The receipt now independently establishes B's exact transaction sender and chain, in addition to the earlier bounded sign-in UI observations.
- Receipt creation and stored B join time both equal `2026-09-07T10:22:46.899390+00:00`. Both A's and B's stored join timestamps are inside the formation window.
- Output records B, the expected pool, `stake_wei: "100"` and `participant_count: "2"`. The finalized cohort contains exactly A and B, 100 wei each, both active with zero rounds passed. Total staked is 200 wei. All other pool fields, including rules, fee, hash and schedule, are unchanged from creation; B's withdrawal credit is zero.
- By `2026-09-07T10:24:29Z`, a full browser reload retained B's session, the selected pool and the correctly labelled B `you` position. Both participants displayed 0/2 rounds, no join form remained, no activation/proof action was exposed during formation, and zero-credit withdrawal stayed disabled. The current tab's error-log check returned no entries.

Next eligible workflow step is activation once the stored formation deadline `2026-09-07T10:54:47Z` is reached (11:54:47 AM in Nigeria). Keep Wallet B selected. No further wallet request is pending now, and no early activation transaction was submitted. The two rounds still run on their original stored intervals; this successful formation checkpoint is not a completed round-transition test. The user will need to return for activation and subsequent human approvals; no background reminder or automatic signing has been configured.

The historical unsigned-draft record remains unchanged as an earlier checkpoint. No GitHub push, redeployment, visibility change, app code change or contract code change accompanies this request.

## Activation preflight and Wallet B request

After the user returned with `ready`, the browser was observed showing the previous settled one-round pool. Before initiating any transaction, the agent reopened the exact two-round pool `human-consent-2r-20260907-093128` through the visible pool-ID control and confirmed Wallet B's signed-in identity, the correct title and both participants at 0/2 rounds. No action was taken on the old settled pool.

An accountless, read-only RPC preflight completed at `2026-09-07T11:02:52.545Z`. Chain ID was `61999`; target was `0x7279B4A7821c96489c0b086021F3E6944d343bFB`. The finalized pool was still forming with an empty activation timestamp/failure, exactly A and B, 100 wei each and 200 wei total. Every pool field matched the verified creation checkpoint except the expected participant count and total stake. Both participants remained active with zero rounds passed. The two `get_round` views returned the original stored boundaries: round 1 `[1788778487, 1788782087)`, round 2 `[1788782087, 1788785687)`. No signing, account creation, write simulation or on-chain mutation was performed by this preflight.

The observation clock indicated that the stored first-round window had opened. This was used only to schedule the request, not to assert successful activation or its execution-time eligibility; those must be verified from the eventual receipt and stored `activated_at`.

At `2026-09-07T11:03:18Z` (tool observation time), after announcing Wallet B, Studionet and a zero-value transaction with no additional stake, the agent clicked `Activate or enable refunds` exactly once. Intended input: `activate_pool("human-consent-2r-20260907-093128")`, value `0` wei. The UI disabled the activation button, wallet actions and Refresh while retaining the correct pool and B session. The agent did not inspect or operate MetaMask's approval controls.

At the initial request checkpoint, no activation hash, execution success or activated state had been verified. The next browser observation exposed a submitted hash before a further user message, so the existing request was reconciled rather than requesting another approval. The pool's original schedule was not extended, and round 1 still closes at `2026-09-07T11:54:47Z` / `12:54:47` Nigerian time.

## Activation independently verified

- Verification completed at `2026-09-07T11:06:18.785Z`: [receipt, exact output and stored state](human-consent-2r-activation-2026-09-07.json), [read-only verifier](verify-human-consent-2r-activation-2026-09-07.mjs).
- Transaction: `0x82dd0665f3f2f989ff406878981705568dd42cb2b55315a5cca88ff6f2ec7585`.
- Exact sender B, core target, chain `61999`, `activate_pool("human-consent-2r-20260907-093128")` and value `0` wei independently matched the intended action.
- Status `FINALIZED`, execution `success`, expected and observed VM result code `0` (`return`). Decoded output is the exact active-pool summary, not a refunding result.
- Stored `activated_at` and receipt creation time both equal `2026-09-07T11:03:53.041736+00:00`, inside the original stored activation interval `[2026-09-07T10:54:47Z, 2026-09-07T11:54:47Z)`. Eligibility was verified against these chain timestamps, not the observation clock.
- All pool fields except `status` and `activated_at` remain identical to the B-join checkpoint. Both participants, their 100-wei stakes, zero proof progress, the two stored round intervals and B's zero withdrawal credit are unchanged. No activation failure, fee, refund or settlement was recorded.
- The app displayed the same successful finalized hash, active pool, both participants at 0/2 and B's initially empty round-one statement/source form. Proof submission remained disabled until evidence and fresh review were provided.

The agent never operated MetaMask. This record verifies the signed transaction and its result, not direct observation of the human's wallet-confirmation click. No proof, round transition, settlement or payout for this new pool is yet claimed.

## Wallet B round-one evidence review and proof request

The visible `Load saved capture` control recovered B's previously verified capture `2ed13b21-2dfe-4c23-a61e-506e3e5638b5` without a new capture transaction. The original URL, complete 127-byte public text, digest `8c1e8564424fdb68b8b7bdff3e16173a2e3599e9b71620637251486c5c4d5ed6` and original September 6 capture time were preserved. This is deliberately reused source content, not a claim of a fresh capture or real-world work; the contract re-fetches the public URL when checking proof.

After loading, source-review consent was unchecked and proof submission was disabled, despite the complete statement and capture being present. The full recovered source was reviewed again and supports both fixture facts. Exact statement:

> Round 1 sandbox check: https://example.com has the heading Example Domain and states that this domain is for use in documentation examples without needing permission. This is a technical public-page check, not a claim of real-world work or identity.

At `2026-09-07T11:08:31Z` (tool observation time), after announcing B's zero-value proof, the agent checked fresh source-review consent and clicked `Submit round 1 proof` exactly once. The immediate `isEnabled` read after checking consent returned false; the standard locator click subsequently completed without force, so this is not recorded as a separately observed enabled-state test. The resulting UI retained the exact statement/capture, with checked-but-disabled review, disabled proof submission and disabled wallet actions. The earlier activation-success toast/hash was not treated as proof evidence.

See the [exact proof request checkpoint](human-consent-2r-proof-b-round-1-request-2026-09-07.json). The intended core method is `submit_checkin`, value `0` wei, with the new pool ID, the statement above, `https://example.com`, the verified digest and an app-generated attempt nonce. The nonce and actual full input must be verified from the eventual signed receipt. No MetaMask control was operated by the agent; no extra stake or fresh capture was requested.

At this checkpoint, B's proof hash, successful execution, verdict and round transition are not yet verified. Reconcile the existing request before any retry or account switch. Both participants' round-one proofs must be processed within the original round interval; the later round-two transition and fresh review are still outstanding.

The subsequent visible status explicitly confirmed `Submit check-in: request saved. Review the wallet confirmation. Never repeat a pending request.` No proof hash was displayed. The wallet-test tab was handed back to the user for the existing B proof approval and a `done` reply.

## Wallet B round-one proof independently verified

The user's `done` was reconciled against the existing request without a retry. At `2026-09-07T11:11:21Z`, the app showed `accepted` and the distinct proof hash below, with writes still disabled and old progress still visible during refresh. That intermediate status was not treated as a passing verdict or final execution.

- Independent verification completed at `2026-09-07T11:15:08.707Z`: [complete signed input, result and stored state](human-consent-2r-proof-b-round-1-2026-09-07.json), [read-only proof verifier](verify-human-consent-2r-proof-2026-09-07.mjs).
- Transaction: `0xb106c6900f157e7db5e09d5644d94a39451191b5b09db467e04d9243d7527187`.
- Exact sender B, core target, chain `61999` and value `0` wei. The signed input matches the recorded pool ID, complete proof text, URL and evidence digest. The app-generated fifth argument is UUID `10dffc11-1a6d-412b-8500-31d899c680c6`, recorded from the signed calldata rather than inferred from hidden UI state.
- Status `FINALIZED`, execution `success`, expected and observed VM result code `0` (`return`). Exact decision fields: round `1`, attempt `1`, verdict `pass`, rounds passed `1`, participant status `active`, retriable `false`. This method has no separate success `reason_code` field; no such code was invented. The full returned explanation is retained as non-authoritative leader metadata.
- Attempt ID: `human-consent-2r-20260907-093128:0xe6e7bffa242d2900fad7067012564d441f735c43:1:1`.
- Receipt creation and stored attempt submission both equal `2026-09-07T11:11:06.065803+00:00`, inside the original stored round-one interval `[2026-09-07T10:54:47Z, 2026-09-07T11:54:47Z)`. Eligibility uses the stored timestamps, not the observation clock.
- The stored proof SHA-256 matches the exact statement. Both expected and freshly observed source digests equal the reviewed capture's digest. The capture itself remains the historical September 6 record; this passing proof independently records matching re-fetched source content.
- B alone progressed to 1/2 and its new attempt ID. A remains active at 0/2. Every pool field and all other participant fields match the activation checkpoint, including both 100-wei stakes, 200 total, immutable terms and schedule. B's current withdrawal credit is zero. No settlement, fee or payout occurred.

The natural browser transition, observed without a reload or navigation, showed the same successful finalized hash, B at 1/2, `Next round: 2`, zero attempts used for round two and `Your next round opens soon`. The old statement, capture-review checkbox and proof-submit controls disappeared; the UI displayed `Check-in is not available`. This confirms old round-one controls are not available while round two is closed. It does **not** yet establish the fresh unchecked review state when round two actually opens; that remains to be observed at the original `2026-09-07T11:54:47Z` / `12:54:47` Nigerian time. No early round-two transaction or clock override was sent.

Next action is the human switch from B to A (`0xAb99c741494bEF91FAE66144dda31Be93180baD4`), keeping Studionet selected. A must still submit its round-one proof before the original deadline. There is no pending B transaction to approve or repeat. No agent sign-out or reload preceded the requested account switch, so its session invalidation can be observed naturally. No GitHub push, visibility change, deployment, app/contract edit or extra full-suite run accompanies this checkpoint.

## Reported switch to A and fresh login request

After the user replied `done` to the account-switch instruction, the original test tab at `2026-09-07T11:18:13Z` showed `Wallet or network changed. Sign in again to continue.` This was observed before any agent reload, sign-out or login. B's signed-in identity, pool/participant workspace and proof controls were absent. The pool selector contained only its disabled placeholder, credit required sign-in, and withdrawal was disabled.

Opening the visible Activity tab preserved the signed-out boundary: `Sign in to view activity`, with no saved request cards or B's private history displayed. This is a bounded UI observation of session invalidation, not yet proof of the newly selected account or network. The intended account remains A (`0xAb99c741494bEF91FAE66144dda31Be93180baD4`) on Studionet; its authenticated identity must be verified after sign-in.

At `2026-09-07T11:19:07Z` (tool observation time), after explaining that only a login signature was being requested and no funds would move, the agent clicked the unique `Sign in with wallet →` button once. Sign-in and Refresh controls disabled while Activity remained gated. The test tab was handed back for the human's signature and `done` reply. No MetaMask control was inspected or operated by the agent, and no duplicate login, A proof, stake transfer or early round-two transaction was initiated.

## Wallet A sign-in, fresh evidence review and round-one request

After the user's `done`, the original test page at `2026-09-07T11:20:13Z` displayed `Signed in · 0xab99…bad4`. The selected two-round pool correctly labelled A as `you`, active at 0/2, and B as the separate public cohort member at 1/2. A's round-one statement and source were initially empty, with no retained B capture or review acknowledgement. During the initial fresh reads submission stayed disabled; after loading, A still had zero credit and no withdrawal action. These are UI sign-in observations; the exact proof sender and chain must still be established from its signed receipt.

The visible recovery control loaded A's own historical capture `8b6ed2c4-fb65-4c1d-8389-e90defbaba1a`, originating from transaction `0x36849798ec1bf247e2bb6a9a742205dd1f17674fc18ef2adadb8de91ce8103ed` at stored capture time `1788706687` (September 6, `14:58:07` UTC). No new capture transaction was sent. Its full 127-byte source text and digest matched the previously verified record. The expanded pool terms hash matched the immutable creation hash. Recovery left source-review consent unchecked and proof submission disabled even after the complete statement was supplied.

Exact statement, reviewed against the full recovered public text:

> Round 1 sandbox check: https://example.com has the heading Example Domain and states that this domain is for use in documentation examples without needing permission. This is a technical public-page check, not a claim of real-world work or identity.

Freshly checking source review enabled `Submit round 1 proof`, as observed in the subsequent snapshot and an explicit enabled check. At `2026-09-07T11:22:22Z` (tool observation time), after announcing Wallet A, zero value and no additional stake, the agent clicked that button exactly once. The exact statement and A-owned capture remained visible; review was checked and disabled, with account, Refresh and proof submission also disabled. The test tab was handed back for the human wallet approval. No MetaMask control was operated by the agent.

See the [exact A round-one request checkpoint](human-consent-2r-proof-a-round-1-request-2026-09-07.json). Intended input is `submit_checkin` to the existing core, value `0` wei, with the new pool ID, statement above, `https://example.com`, verified digest and a fresh app-generated nonce. The actual complete signed input, execution, verdict and stored attempt timestamp remain unverified. The correct verification baseline is B's completed round-one checkpoint, not the earlier activation snapshot. No retry or account switch should precede reconciliation, and the original round-one deadline remains `2026-09-07T11:54:47Z` / `12:54:47` Nigerian time.

## Wallet A round-one proof independently verified / round-two wait

The user's `done` was reconciled against the existing A proof request. At `2026-09-07T11:25:10Z`, the app showed `committing` with the distinct hash below while writes remained disabled and A's old 0/2 state was still visible during refresh. No retry was sent, and that intermediate lifecycle state was not counted as successful execution.

- Independent verification completed at `2026-09-07T11:26:34.419Z`: [complete signed input, output and stored state](human-consent-2r-proof-a-round-1-2026-09-07.json), using the [read-only proof verifier](verify-human-consent-2r-proof-2026-09-07.mjs) against the prior B round-one checkpoint.
- Transaction: `0xe5a91efe92f7ee66256cd770c9871372ee79f0d348dc72133117cbaeddf44c9a`.
- Exact sender A (`0xAb99c741494bEF91FAE66144dda31Be93180baD4`), existing core target, chain `61999` and value `0` wei. The complete proof statement, pool ID, URL and digest match the recorded request. The signed app-generated nonce is `bce6b946-1bb8-4055-abdd-a8b369a95a1c`.
- Status `FINALIZED`, execution `success`, expected and observed VM result code `0` (`return`). Exact decision: round `1`, attempt `1`, verdict `pass`, rounds passed `1`, participant status `active`, retriable `false`. No separate success reason-code field exists in this method; the full leader explanation is retained as non-authoritative metadata rather than invented as a deterministic reason code.
- Attempt ID: `human-consent-2r-20260907-093128:0xab99c741494bef91fae66144dda31be93180bad4:1:1`.
- Receipt creation and stored attempt submission both equal `2026-09-07T11:24:53.378177+00:00`, inside the original stored round-one interval `[2026-09-07T10:54:47Z, 2026-09-07T11:54:47Z)`. These timestamps establish execution-time eligibility; the observation clock was not substituted for contract time.
- The stored proof SHA-256 matches the exact statement, and expected/observed source digests match the reviewed public capture. The old capture's provenance and timestamp remain unchanged; no fresh capture is claimed.
- A alone progressed from 0/2 to 1/2 with its new attempt ID. B's verified 1/2 participant record is unchanged. All pool fields, stake amounts, fee fields and original schedule match the previous checkpoint. Both participants remain active with 100 wei each, 200 wei total, no settlement credit, and A's current withdrawal credit is zero.

After finality, without a reload or navigation, the app displayed both wallets at 1/2 and A's successful round-one attempt. A's next position became round two with 0/3 attempts used; the old statement, capture-review checkbox and proof-submit controls disappeared. The UI displayed `Your next round opens soon` and `Check-in is not available`, matching the closed round-two interval. As with B, this verifies the natural progress transition and removal of old controls, not yet the fresh-review state when the next round's form becomes available.

No wallet action is pending now. Keep A selected and return for round two at `2026-09-07T11:54:47Z` / **12:54:47 PM Nigerian time on September 7**. Its original closing time is `2026-09-07T12:54:47Z` / **1:54:47 PM Nigerian time**. Both wallets still need round-two proofs, followed by settlement and verified payouts. No early round-two call, new pool, clock override, automatic wallet approval or background reminder was created. The prior one-round lifecycle remains a separate completed historical test.

## Round-two opening, A's fresh review and final proof request

After the user's `ready`, the original test tab at `2026-09-07T11:57:18Z` remained signed in as A with the same pool selected. Without an agent reload, navigation or account switch, it now displayed `Round 2`, 0/3 attempts used and `Your proof window is open`. Its new statement and source fields were empty, and no round-one source-review acknowledgement was present. Submission stayed disabled while the automatic fresh reads completed. This is an observation after the opening time, not a claim of continuous monitoring at the exact boundary.

An accountless read-only preflight completed at `2026-09-07T11:58:43.017Z`. Chain `61999`, the existing core, all pool fields and the complete cohort exactly matched the verified A round-one checkpoint: both wallets active at 1/2, 100 wei each, 200 total, unchanged rules, fee and hash. `get_round(poolId, 2)` returned the original interval `[1788782087, 1788785687)` / `[11:54:47Z, 12:54:47Z)`. No write simulation, signing or transaction was used by this check. The observation clock was used only to schedule the request; actual eligibility still requires the eventual receipt and stored attempt timestamp.

The visible recovery control loaded A's same historical public capture, preserving its original September 6 timestamp, full 127-byte text, URL and digest. No new capture transaction was sent. With the new complete round-two statement and recovered capture present, the review checkbox was unchecked and `Submit round 2 proof` remained disabled. This confirms that A's prior round approval was not sufficient for the newly opened round.

Exact new statement:

> Round 2 sandbox check: https://example.com has the heading Example Domain and states that this domain is for use in documentation examples without needing permission. This is a technical public-page check, not a claim of real-world work or identity.

The complete public source was reviewed again against that statement. At `2026-09-07T12:00:00Z` (tool observation time), after announcing A's final proof, zero value and no additional stake, the agent checked fresh review. A bounded wait and explicit enabled-state check confirmed `Submit round 2 proof` was enabled, then it was clicked exactly once without force. The app retained the new statement and A-owned capture while disabling account, Refresh, review and proof controls. No MetaMask confirmation was performed by the agent; the test tab was handed back for the human approval.

See the [exact A round-two request and UI-transition checkpoint](human-consent-2r-proof-a-round-2-request-2026-09-07.json). Intended method is `submit_checkin` to the current core with value `0` wei, the new pool ID, round-two statement above, reviewed URL/digest and an app-generated nonce. The actual signed input and round-two result remain unverified. The visible old round-one success toast/hash was not treated as a new result. Reconcile this request before retrying or switching to B; the verification baseline is the completed A round-one checkpoint. No extra stake, capture, test pool or full repeat was initiated.

## Unexpected network cancellation and one reconciled replacement

Before a further user message, the app reported the submitted round-two request as `CANCELED`, with hash `0xb287c6ae8b8f7f1303ef78a8caa38782c927eb50707e458fb6f382a8067e34e5`. The agent paused submission and explicitly told the user not to repeat it until checked. The original request was not mislabeled as a wallet rejection, passing proof or planned rejection test.

The [cancellation reconciliation record](human-consent-2r-proof-a-round-2-canceled-2026-09-07.json) retains its full signed calldata, exact A sender, core target, zero value and receipt creation time `2026-09-07T12:00:33.868816+00:00`. The actual first nonce was `3edb0b02-9ee8-4f5e-b1d5-f6e02015e9ee`. Independent RPC inspection confirmed `CANCELED`, execution `unknown`, and no leader receipt/VM return or proof verdict. Safe consensus metadata reported three recovery attempts and `max_recovery_exhausted_at = 1788782468` (`12:01:08Z`). The underlying runner/provider cause is not established; raw upstream error/validator diagnostics were not copied into evidence.

At `2026-09-07T12:05:09.530Z`, accountless latest-final reads of the complete pool and participant list were deep-compared with the verified A round-one checkpoint and were identical. Both wallets remained active at 1/2, both stakes remained 100 wei, total stake 200 wei, and both last attempt IDs remained in round one. Terms, schedule, fee/refund and settlement fields were unchanged. The UI still showed 0/3 attempts used for round two. This establishes no observed pool/participant mutation from the canceled request, not successful proof execution.

Activity preserved the same A hash as `Cancelled by the network · check wallet history before retrying`, separately from the successful A round-one request. After reviewing that saved entry and the independent state check, the agent returned to the pool workspace. Its proof form was empty; reloading the same historical A capture and exact round-two statement again left review unchecked and submission disabled. Only the already-reconciled banner was dismissed; the saved cancellation and original evidence were preserved.

The user was told that one replacement would add one approval, not another test cycle. At `2026-09-07T12:09:57Z` (tool observation time), after announcing A and zero value again, the agent freshly reviewed the full source, checked consent, confirmed the enabled round-two submit button and clicked it exactly once. Wallet, Refresh, review and proof controls disabled. The agent did not operate MetaMask. The [separate replacement request checkpoint](human-consent-2r-proof-a-round-2-retry-1-request-2026-09-07.json) links to the canceled hash and unchanged baseline. No second automatic replacement has been requested.

The read-only proof verifier now accepts an optional matching request-checkpoint basename so a successful replacement can be linked to this retry rather than overwriting or obscuring the original request. It also requires a different signed nonce from the canceled request. Syntax checking passed; actual replacement receipt verification remains pending. Use A / round 2 with the verified A round-one baseline and the explicit retry request file. There is still no verified second-round verdict, settlement or payout for this new pool.

## A's replacement verified / both A rounds complete

After the user's `done`, the original tab at `2026-09-07T12:13:26Z` showed the replacement as `committing`, with its new hash and writes still disabled. The old 1/2 state remained while consensus completed. No additional copy was submitted, and the intermediate state was not treated as a verdict.

- Independent verification completed at `2026-09-07T12:14:47.570Z`: [complete replacement receipt, input, output and stored state](human-consent-2r-proof-a-round-2-2026-09-07.json). The [proof verifier](verify-human-consent-2r-proof-2026-09-07.mjs) used the explicit retry request file and A's completed round-one baseline.
- Successful replacement hash: `0xff899814e6943ed21872ab45b2718b259e9895a8524db9a26fe418596dbf753f`.
- Exact sender A, core target, chain `61999` and value `0` wei; the signed pool ID, round-two statement, URL and digest match the replacement request. Its nonce `860dc097-5f23-427d-8af8-5e4e129ae610` is distinct from the canceled request's nonce. The original canceled hash and request remain separate and unchanged.
- Status `FINALIZED`, execution `success`, expected and observed VM result code `0` (`return`). Exact decision: round `2`, attempt `1`, verdict `pass`, rounds passed `2`, participant status `success`, retriable `false`. The canceled network request did not consume a recorded proof attempt; this successful attempt is round two's first stored attempt.
- Stored attempt ID: `human-consent-2r-20260907-093128:0xab99c741494bef91fae66144dda31be93180bad4:2:1`.
- Stored submission and receipt creation both equal `2026-09-07T12:13:08.958794+00:00`, inside the original second-round interval `[2026-09-07T11:54:47Z, 2026-09-07T12:54:47Z)`. Eligibility was checked with stored chain timestamps, not the observation clock.
- The stored proof SHA-256 and re-fetched source digest match the exact statement and reviewed evidence. No new historical capture timestamp or authoritative free-text reason code was fabricated; complete output and leader explanation remain in the JSON.
- Only A's proof progress, terminal status and last attempt ID changed. B remains active at 1/2 with its previous attempt record. All pool fields, terms, original schedule and both 100-wei stakes are unchanged; total stake remains 200 wei. A's settlement and current withdrawal credit remain zero.

The natural final UI displayed the matching successful hash, A at `2/2 rounds passed · success`, B at `1/2 rounds passed · active`, and `Your rounds are complete`. A's proof form and review controls were removed; `Check-in is not available` correctly identified its terminal participant status. Withdrawal remained disabled with zero credit, and no premature settlement was offered while B was still active.

No wallet action is pending for A. The next step is the human switch to B (`0xE6E7bfFA242d2900fad7067012564d441F735c43`), keeping Studionet selected, followed by fresh sign-in and B's round-two proof. B's successful proof verification must use this completed A round-two checkpoint as its baseline. B's proof, settlement and two withdrawals remain; no further full test cycle or repeat A proof is planned. No app/contract change, deployment, GitHub push or visibility change accompanies this checkpoint.

## Second A-to-B switch / fresh login requested

After the human reported the switch with `done`, the original tab naturally displayed `Wallet or network changed. Sign in again to continue.` before any agent reload, sign-out or navigation. A's identity and selected pool were cleared, the workspace required sign-in, available credit read `Sign in to view`, and withdrawal remained disabled. No A proof controls or participant details were retained in the visible workspace. The active B address is not yet verified by an authenticated app session.

The agent clicked the unique `Sign in with wallet →` control once. The app disabled sign-in and Refresh while awaiting the human signature; the subsequent observation clock was `2026-09-07T12:22:25Z`. The original tab was handed back to the human. This requests login only, not a proof transaction or additional stake. No MetaMask control was operated by the agent. Verify the resulting B address before preparing its final proof; no B round-two request has been sent yet.

## B login verified / final round-two proof requested

After the human's next `done`, the original tab at `2026-09-07T12:23:47Z` displayed `Signed in · 0xe6e7…5c43`, the correct two-round pool and B marked `you`. A remained successful at 2/2 and B active at 1/2, with round two open and 0/3 attempts used. B's statement and source fields were initially empty; no A statement, capture or source-review acknowledgement was carried into B's authenticated workspace. Credit was zero and withdrawal disabled.

An accountless finalized-state preflight passed at `2026-09-07T12:25:45.390Z`: the complete pool and cohort exactly matched the verified A round-two checkpoint, total stake remained the string `"200"` wei, and the original round-two interval remained `[1788782087, 1788785687)`. An initial inline diagnostic incorrectly expected that wei string as a number; its assertion was corrected to the actual documented string type before the successful check. No product code or chain state was changed by either read-only probe. The observation clock only schedules the request; actual eligibility still requires the eventual stored attempt timestamp.

The agent entered the exact round-two public-page statement and recovered B's historical capture `2ed13b21-2dfe-4c23-a61e-506e3e5638b5`. The UI retained its original September 6 capture time, full 127-byte text, URL and digest. No new capture transaction was sent. With the complete statement and capture loaded, the review checkbox was unchecked and submission stayed disabled. The full public source was reviewed again, and fresh review explicitly enabled submission. This is B's post-login fresh-consent check; A's separately recorded natural round transition is not attributed to B.

At `2026-09-07T12:26:05Z` (tool observation time immediately before the click), after announcing B and zero value with no added stake, the enabled `Submit round 2 proof` button was clicked exactly once. The same pool and B identity remained visible while account, Refresh, statement, review and submit controls disabled. The original test tab was handed back to the human; the agent did not operate MetaMask.

See the [exact B round-two request checkpoint](human-consent-2r-proof-b-round-2-request-2026-09-07.json). Its intended call is `submit_checkin` to the existing core, value `0` wei, with the exact statement, source URL/digest and an app-generated nonce. No signed hash, nonce, execution outcome or second-round B attempt is verified yet. After human approval, verify with B / round 2 and `human-consent-2r-proof-a-round-2-2026-09-07.json` as the baseline before requesting settlement. No repeat A proof, new test cycle, settlement, withdrawal, deployment or GitHub change was initiated here.

## B final proof verified / both wallets complete

After the human's `done`, the original tab at `2026-09-07T12:28:03Z` showed the new request as `accepted`, its hash recorded, and writes disabled while the previously finalized B position remained 1/2. Accepted status alone was not treated as a passing result, and no duplicate was sent.

- Independent verification completed at `2026-09-07T12:28:49.327Z`: [complete B round-two receipt, exact input, output and stored state](human-consent-2r-proof-b-round-2-2026-09-07.json), using the existing accountless proof verifier and A's completed round-two checkpoint as the baseline.
- Hash: `0x3af7ea59af3365651874ec323afc0b128e88207c9c6aa90a5249cafc9d1c2e17`.
- Exact sender B, existing core target, chain `61999`, value `0` wei and matching round-two statement, source URL and digest. The app-generated signed nonce was `13452931-16a1-421f-9492-881a5a8fdb1e`.
- Status `FINALIZED`, execution `success`, expected and observed VM result `0` (`return`). Exact decision: round `2`, attempt `1`, verdict `pass`, rounds passed `2`, participant status `success`, retriable `false`. Full leader explanation is retained as non-authoritative metadata; this method does not emit a separate success reason code.
- Stored attempt ID: `human-consent-2r-20260907-093128:0xe6e7bffa242d2900fad7067012564d441f735c43:2:1`.
- Stored submission and receipt creation both equal `2026-09-07T12:27:34.621314+00:00`, inside the original round-two interval `[2026-09-07T11:54:47Z, 2026-09-07T12:54:47Z)`. Eligibility uses these stored chain timestamps, not the observation clock.
- Stored proof hash and expected/re-fetched evidence digest match the exact statement and reviewed public text. B's capture remains historical; no new capture timestamp was claimed.
- Only B's progress, status and last attempt changed. A remains successful at 2/2. The complete pool, original schedule, terms, 200-wei total stake and both 100-wei stakes are unchanged. No settlement credit had yet been allocated.

The natural final UI showed the matching successful B hash, both wallets at `2/2 rounds passed · success`, and `Your rounds are complete`. B's proof and review controls were removed. `Settle & allocate credits` became enabled, while withdrawal stayed disabled at zero credit. Browser error logs were empty. No reload, account switch or repeat proof was required.

## Settlement requested from B / allocation only

Read-only preflight at `2026-09-07T12:30:08.578Z` confirmed both participants' terminal-success baseline, zero current credits for A, B and the fee recipient, and `can_settle = true`. The eligibility basis is the contract's all-terminal branch, not a local clock assumption: both participants have finished, so settlement need not wait for the original activity end. No write simulation was used.

The user was told that settlement should allocate 100 wei to each wallet, with no forfeited stake or fees, and that withdrawals are separate. At `2026-09-07T12:30:22Z` (tool observation time immediately before the click), the enabled `Settle & allocate credits` control was clicked exactly once from B's authenticated workspace. The correct pool remained selected, and wallet, Refresh and settlement controls disabled. The original tab was handed back for the human approval; the agent did not operate MetaMask. The still-visible B proof success toast and hash were not mistaken for a settlement result.

See the [settlement request and expected output/state checkpoint](human-consent-2r-settlement-request-2026-09-07.json). Intended call: `settle("human-consent-2r-20260907-093128")`, existing core, B sender, value `0` wei. Verify the actual signed input, finalized successful execution, exact output, stored settlement timestamp, unchanged terms/proof records and resulting credits before requesting either withdrawal. Settlement only allocates credits; neither a wallet payout nor a new settlement result has been verified at this checkpoint. No new test pool, app/contract change, deployment, GitHub push or visibility change was made.

## Settlement independently verified / 200 wei allocated

After the human's `done`, the original tab at `2026-09-07T12:33:22Z` showed settlement as `accepted`, with its new hash and writes disabled. Accepted status and the old active pool view were not treated as finalized settlement. No duplicate was sent.

- Verification completed at `2026-09-07T12:36:22.299Z`: [complete settlement receipt, exact output, stored credits and unchanged proof records](human-consent-2r-settlement-2026-09-07.json).
- Hash: `0x55f935adf8124a650733474f3c1da9623a10eb8f5055e5b297190679e2dd4534`.
- Exact sender B, existing core target, chain `61999`, value `0` wei and calldata `settle` with the single approved pool ID.
- Status `FINALIZED`, execution `success`, expected and observed VM result `0` (`return`). Exact output: two winners, zero losers, zero forfeited pot, zero fee, zero additional share, `all_fail_refund = false`, and `conservation_wei = "200"`.
- Stored `settled_at` and receipt creation both equal `2026-09-07T12:33:07.256741+00:00`, checked at microsecond precision (`1788784387256741`). This is before the original activity end, with eligibility supplied by both participants' already-terminal success, not a local-clock assumption. Settlement is after all four stored proof timestamps.
- Pool is `settled`; only the expected status, winner count and settlement timestamp changed. The complete original terms, schedule, stakes and other pool fields remain unchanged. All four stored proof attempts exactly match their independent pre-settlement checkpoints.
- Both participant allocations and both current wallet credits equal `100` wei. A and B remain successful at 2/2. Fee-recipient credit remains zero, total allocated is 200 wei, and `can_settle` is now false.

The new [accountless settlement verifier](verify-human-consent-2r-settlement-2026-09-07.mjs) passed syntax checking and its actual receipt/state verification. It records input/checkpoint hashes, refuses to overwrite a completed report, and performs no signing, simulation or transaction. Its receipt creation/stored settlement timestamp is not mislabeled as an exact finalization-completion timestamp. No separate success reason code is fabricated.

Without a reload or account switch, the UI displayed the matching successful settlement hash, `settled`, `2 successful · 0 failed · 0 GEN fee`, both successful participants, and B's available credit `0.0000000000000001 GEN` (100 wei). The settlement control disappeared and `Withdraw credit` became enabled. Historical allocation and current withdrawable credit are shown separately. Settlement alone does not establish delivery to either wallet.

## B withdrawal requested / native delivery still pending

After announcing a withdrawal of 100 wei back to B, at `2026-09-07T12:37:05Z` (tool observation time immediately before the click), the enabled `Withdraw credit` button was clicked exactly once in B's authenticated workspace. The app kept the correct settled pool and B identity while disabling account, Refresh and withdrawal controls. The prior settlement success toast was not treated as a withdrawal result. The original tab was handed back to the human; the agent did not approve MetaMask.

See the [B withdrawal request checkpoint](human-consent-2r-withdraw-b-request-2026-09-07.json). The intended outer call is `withdraw()` to the existing core, sender B, value `0` wei; the expected resulting native transfer is 100 wei from the core back to B. The independently verified settlement checkpoint supplies the exact 100-wei pre-withdrawal credit, with A's credit also 100 wei.

After approval, verify the actual signed input, finalized successful execution, returned payout ID and stored payout, then the linked native child with exact B recipient, value 100 wei, finality and `value_credited = true`. A zero contract credit or emitted payout record alone is not delivery evidence. Confirm B's credit becomes zero while A's remains 100 wei and the settled pool/cohort allocations stay unchanged. No native child, successful B withdrawal or A withdrawal has been verified at this request checkpoint. A's withdrawal is the last planned transaction in this two-round run; no additional full test cycle was initiated.

## B withdrawal delivered / A's 100 wei remains

After the human's `done`, the original tab at `2026-09-07T12:39:12Z` displayed the withdrawal as `accepted`, with its new hash recorded and writes disabled. Neither acceptance nor the old allocation display was treated as delivery. No duplicate withdrawal was requested.

- Full independent verification passed at `2026-09-07T12:43:16.435Z`: [exact B withdrawal, payout and native-delivery checkpoint](human-consent-2r-withdraw-b-2026-09-07.json).
- Parent hash: `0x678f73c9f7b57554cbe672e83a63cbe56da707afd535147de731a1fe15956356`. Exact sender B, existing core target, chain `61999`, outer value `0` wei, method `withdraw` and no arguments. The decoded calldata omits an empty `args` field; this is recorded rather than fabricated.
- Parent is `FINALIZED` with execution `success` and VM result `0` (`return`). Actual returned and stored payout ID is `payout-00000008`, recipient `0xe6e7bffa242d2900fad7067012564d441f735c43`, amount `100` wei and status `emitted_for_finalization`. The full delivery warning is retained; this contract-record status alone is not delivery proof.
- Parent creation and stored payout emission both equal `2026-09-07T12:38:50.676204+00:00`, checked at microsecond precision and after the stored settlement timestamp.
- Exactly one linked native child: `0x80bfe41e82abc983ef82615df2300a63e8e635a1a3e0a8db0f46b4ea73ffc629`. The parent's child list and the child's `triggered_by` both establish the relationship to the exact withdrawal hash.
- Child is native type `0`, `FINALIZED`, with `value_credited = true`, sender the existing core, recipient B, and exact value `100` wei. Its stored creation time is `2026-09-07T12:39:24.844838+00:00`. These creation/emission times are not mislabeled as exact finalization-completion times.
- B's current credit is zero; A's remains exactly 100 wei and fee-recipient credit remains zero. The entire settled pool and cohort are unchanged, including both historical 100-wei settlement allocations and both successful 2/2 results. Delivered 100 wei plus remaining 100 wei credit conserves the original 200 wei.

The new [read-only withdrawal verifier](verify-human-consent-2r-withdraw-2026-09-07.mjs) passed syntax checking and the actual B receipt/state/native-child verification. It supports B against the settlement baseline and the eventual A withdrawal against this completed B checkpoint, refuses to overwrite reports, and never signs or submits. A's branch has not yet been exercised; it must run only after the human authorizes and approves A's actual withdrawal.

The natural final UI displayed `Payout delivered: the exact amount and recipient were verified in the finalized native transfer`, with the matching B parent hash. Available credit was `0 GEN`, withdrawal was disabled, and the next-step heading read `No credit to withdraw`. The historical settlement allocation remained 100 wei, separate from current credit. Opening Activity showed B's matching saved withdrawal as `Payout delivered`, exact recipient and amount, and `Credited & finalized` for the matching native-child hash. The view had 13 cards; this check inspected the matching withdrawal card, not a new audit of all historical entries. Browser error logs were empty.

No further wallet action is pending for B. Return to the pool workspace, then have the human switch to A (`0xAb99c741494bEF91FAE66144dda31Be93180baD4`) while keeping Studionet selected. Verify session invalidation and fresh A sign-in, then request A's remaining 100-wei withdrawal. Do not repeat B's withdrawal or settlement. This is the last planned transaction of the two-round run; it is not a claim that every submission requirement is complete. No app/contract edit, deployment, GitHub push or visibility change accompanied this verification.

## Final B-to-A switch / login requested

After the human reported the switch with `done`, the original pool-workspace tab at `2026-09-07T12:46:26Z` naturally displayed `Wallet or network changed. Sign in again to continue.` before any agent reload, sign-out or navigation. B's identity, payout toast and selected pool details were cleared; available credit required sign-in, and withdrawal stayed disabled. This verifies the visible session reset, not yet the new authenticated A address.

The unique `Sign in with wallet →` button was clicked once. Sign-in and Refresh disabled while awaiting the human signature; the immediate post-request observation clock was `2026-09-07T12:46:41Z`. The original test tab was handed back. This is login only, with no funds transfer, withdrawal request or MetaMask approval by the agent. Verify the restored A identity and remaining 100-wei credit before requesting the final withdrawal. B's delivered payout and the settled pool remain the completed baseline; neither was repeated.

## Final A login verified / last withdrawal requested

After the human's `done`, the original tab at `2026-09-07T12:47:34Z` displayed `Signed in · 0xab99…bad4`, with A marked `you` in the correct settled pool. Both participants remained successful at 2/2. A's available credit was `0.0000000000000001 GEN` (100 wei), with withdrawal enabled. No B payout toast was retained in the freshly authenticated A workspace, and no proof or settlement action was offered.

Accountless latest-final preflight passed at `2026-09-07T12:48:12.934Z`. Chain `61999`, the complete pool/cohort and all three credits matched the completed B-withdrawal checkpoint exactly: A 100 wei, B zero and fee recipient zero. B's verified delivery was preserved, not repeated. No write, simulation, wallet or local-clock eligibility assumption was used for this check.

After announcing the 100-wei return to A as the last planned transaction in this run, at `2026-09-07T12:48:29Z` (tool observation time immediately before the click), the enabled `Withdraw credit` button was clicked once. The correct settled pool and A identity remained visible while account, Refresh and withdrawal controls disabled. The original tab was handed back to the human; the agent did not approve MetaMask.

See the [exact A withdrawal request and fresh preflight](human-consent-2r-withdraw-a-request-2026-09-07.json). Intended outer call: `withdraw()` from A to the existing core, no arguments, value `0` wei. Expected native transfer: exactly 100 wei from the core to A. The actual payout ID and emission timestamp are not assumed in advance.

After approval, run the existing read-only withdrawal verifier for A with the observed hash; its fixed baseline is `human-consent-2r-withdraw-b-2026-09-07.json`. Require successful finalized parent execution, exact returned/stored payout, a correctly linked finalized native child with `value_credited = true`, zero remaining credits for both wallets, unchanged settled state and 200 wei conserved across both deliveries. This request checkpoint is not a successful withdrawal or completion claim. No further pool, round, settlement, B withdrawal, deployment or GitHub change was initiated.

## Final A delivery verified / two-round run closed

After the human's final `done`, the original tab at `2026-09-07T12:50:27Z` displayed the new A hash with `Payout delivered`, zero available credit and withdrawal disabled. This was followed by independent chain verification, not accepted solely from the UI.

- Full verification passed at `2026-09-07T12:50:44.137Z`: [A withdrawal and final conservation checkpoint](human-consent-2r-withdraw-a-2026-09-07.json). The existing read-only withdrawal verifier's A branch ran successfully against the completed B checkpoint; no new transaction was sent by it.
- Parent `0xeb6785b64028deb2d3fda9ec9eaf41ba7f179e98ddb589bdea9e92bb069dce98`: A sender, existing core target, zero outer value, `withdraw` with no arguments, `FINALIZED`, execution `success`, VM result `0` (`return`).
- Returned and stored payout `payout-00000009`: exact A recipient, 100 wei, `emitted_for_finalization`, full delivery warning retained. Parent creation and stored emission both equal `2026-09-07T12:49:13.154945+00:00`, checked at microsecond precision and after settlement.
- Exactly one native child `0x37fa18816bd59f5d7890d5a5be5f8526fddfdf5cf824a2f217adf26ce27d6693`, linked to that parent in both directions. Type `0`, core sender, exact A recipient, value 100 wei, `FINALIZED` and `value_credited = true`. Its stored creation time is `2026-09-07T12:49:49.041731+00:00`.
- A and B now both have zero current contract credit; fee-recipient credit remains zero. The entire settled pool and cohort remain unchanged, with both historical 100-wei allocations and successful 2/2 positions preserved. B's prior independently delivered 100 wei plus A's newly delivered 100 wei equals the original 200 wei, with no fee or residual credit.

The UI naturally showed A's matching delivered hash, `No credit to withdraw` and disabled withdrawal, while preserving its historical settlement allocation separately. A's saved Activity card showed the exact 100-wei recipient, `Payout delivered` and `Credited & finalized` for the matching child. Among 16 visible cards, the separate earlier A round-two network cancellation and successful replacement were also still present with their distinct hashes and accurate states. Browser error logs were empty. This was a bounded saved-card check, not a claim of a new full reload/export audit of every historical entry.

The [completion record](human-consent-2r-completion-2026-09-07.md) closes this two-round human test: eleven successful finalized parents, one separately preserved canceled request and two delivered native transfers. No further wallet approval or test cycle is needed for this run. Submission remains distinct: final program-specific requirements, approved source/CI publication, the complete pinned Ubuntu run on the final commit, exact deployed-source comparison and signed-out evidence-link checks are not silently marked complete. No app/contract change, deployment, GitHub push or repository-visibility change accompanied this closeout.

Closeout file checks passed: eleven unique successful finalized parent checkpoints, the separate canceled hash excluded from that count, two credited native payouts, exact 200-wei conservation, and matching recorded verifier/checkpoint SHA-256 hashes. All 85 relative evidence links in the six updated Markdown documents resolved locally. Formatting and Git whitespace checks passed (Git emitted only LF-to-CRLF notices). These are offline evidence-consistency checks, not a new contract/application suite or signed-out HTTP evidence-access test.
