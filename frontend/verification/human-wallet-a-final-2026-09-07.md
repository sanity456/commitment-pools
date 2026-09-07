# Commitment Pools — Wallet A final UI/history follow-up

Status: **passed for this bounded local follow-up**. Wallet A's authenticated zero-credit guide, Activity refresh/reload and actual downloads were observed and compared successfully. This is not a new withdrawal, a deployed-release claim or completion of the full human acceptance checklist.

- Successful target: `http://localhost:4195/pools/human-wallet-60m-20260906-131207`, in the user's Chrome browser. The initial `127.0.0.1` attempt and its failure are retained below.
- Source: the uncommitted UI working tree after `cd79acc2c7216231d1cba810a2ef32d390e01f58`; see [the UI verification record](ui-polish-2026-09-07.md).
- User replied `ready` after being asked to select Wallet A on Studionet. At that initial checkpoint, the reply alone did not confirm the authenticated wallet or its active chain.
- At 2026-09-07 07:29:10 UTC, the app had received one sign-in-button click. Sign-in and Refresh were disabled while the wallet flow was pending. The MetaMask extension was not inspected or controlled.
- Expected human action: approve only the Commitment Pools login message for the local origin using Wallet A on Studionet. No transaction, value transfer, withdrawal, wallet export or private-key access was requested.

Planned scope, now completed below: verify the authenticated A context, settled pool, fresh zero credit, disabled withdrawal and corrected guide. Refresh/reload Activity and download its actual exports; compare the saved withdrawal and linked native payout with the prior independent evidence. Preserve the earlier B downloads and historical lifecycle evidence.

No push, deployment, visibility change or submission is authorized by this checkpoint.

## First login attempt did not authenticate

After the user replied `done`, the page still showed “This action must come from this product.” Sign-in remained absent and withdrawal stayed disabled. Server diagnostics showed `POST /api/auth/challenge` and the cleanup logout both returned 403; this is not evidence of a completed login signature or accepted app session.

The local Next URL adapter normalizes loopback hostnames to `localhost`. The browser had been opened at `127.0.0.1:4195`, so the existing exact same-origin guard rejected its POST. Two invalid, unsigned `{}` challenge probes confirmed the boundary: an origin of `http://127.0.0.1:4195` returned 403 `origin_mismatch`; `http://localhost:4195` passed that check and returned 400 for a missing valid wallet address. No challenge, signature or wallet session was fabricated by these probes.

Recovery uses `http://localhost:4195` in the same Chrome tab, with the local process's `PORT` and public site origin set explicitly. No origin check, authentication rule, production configuration or contract was changed. The user must complete a fresh app login before the remaining history/export checks can proceed.

At 2026-09-07 07:35:21 UTC, initiated one fresh sign-in from the completed-pool URL at `localhost:4195`. The app again disabled sign-in and Refresh while awaiting the wallet flow. Authentication, A's identity and the history/export checks remain unverified at this checkpoint. No withdrawal was requested.

After the next `done`, at 07:36:58 UTC the app was still signed out and busy, with its wallet/network-change notice visible. The local server now showed a successful 200 response to the challenge request, confirming the earlier origin rejection was resolved. No verification POST had yet arrived in the inspected log, and the app did not show an authenticated wallet. Kept the existing login pending without another click, refresh or signature request. The human still needs to complete the pending login message; no Activity/export or payout result is claimed.

At 07:40:11 UTC, after another `done`, the prior Chrome test tab no longer existed. Reopened the exact completed-pool URL in the same Chrome browser; its saved app session remained signed out. No verification POST was observed for the earlier attempt. At 07:41:40 UTC, initiated one fresh login and explicitly retained the restored tab for the human handoff. No wallet extension was inspected, no signature was automated, and no transaction was sent. Authentication and the final history/export checks remain pending.

## Successful authenticated follow-up

At 2026-09-07 07:43:32 UTC, the app showed `Signed in · 0xab99…bad4`. Once its protected pool and credit reads completed, the app showed the settled 60-minute pool, both successful participants, zero available wallet credit and the updated guide. The exported private journal confirms the full A address, `0xab99c741494bef91fae66144dda31be93180bad4`, and the product/chain-bound account `wallet:commitment-pools:61999:<A>`. This is app-session evidence; the wallet extension itself was not inspected.

Between 07:49 and 07:52 UTC, observed these checks in the local Chrome tab:

| Check | Actual result |
| --- | --- |
| Available credit | `0 GEN`; `Withdraw credit` disabled. |
| Corrected next step | `No credit to withdraw`, with a separate instruction to check Activity for delivery. |
| Historical allocation | `Settlement credit: 0.0000000000000001 GEN` remains labeled as settlement history, distinct from current zero credit. |
| Private Activity | Ten A-only requests with the optional `Current wallet only` checkbox unchecked: six from the completed 60-minute trial and four from the earlier formation-refund trial. No B requests appeared. |
| Refresh saved history | `Activity refreshed. This did not resend any transaction.` Same ten requests and payout hashes remained. |
| Browser reload | A's login restored without another signature request. The settled pool, fresh zero credit, disabled withdrawal and neutral guide returned. |
| Activity after reload | Same ten A requests, including the current-trial parent withdrawal and separately credited/finalized native child. Both pagination buttons disabled; all ten requests fit this exported page. |
| Pool download | Native `Export record` download completed from the restored workspace. It intentionally includes both public participants and seven pool-scoped core calls. |
| Activity download | Native `Export this page` download completed after reload; ten A requests. |

No withdrawal, transaction import, payout retry or new pool operation was initiated. This followed the user's human login; no wallet signature was automated and no session credential was inspected or fabricated.

The inspected app-tab error log was empty. Its warning log included MetaMask content-script liveness/multiplexer and listener-count warnings. These did not prevent the observed login, reload or exports; they are retained as a diagnostic caveat, not silently described as a warning-free wallet run. Exact Chrome/MetaMask versions remain unrecorded.

## Download verification

The [offline comparison script](verify-wallet-a-final-2026-09-07.mjs) passed at **2026-09-07T07:55:29.499Z**. The [structured result](human-wallet-a-final-2026-09-07.json) preserves both actual downloaded payloads, their byte counts/hashes, the historical evidence hashes and the relevant local UI source hashes. The earlier lifecycle JSON files were read, not rewritten.

- Activity: `C:/Users/user/Downloads/activity-page (2).json`, 21,999 bytes; exported at `2026-09-07T07:51:55.328Z`; SHA-256 `4bd0017d6793b1917f5cf1006b7087d2ab40990dd0304c33c4bd682ece135846`.
- Pool: `C:/Users/user/Downloads/human-wallet-60m-20260906-131207-record (1).json`, 12,245 bytes; exported at `2026-09-07T07:51:21.563Z`; SHA-256 `e315c0a4ac15f53e56d3acab319bb87147f7c7588b5bdc25d9eed31b4f3ee594`.
- The original B downloads remain intact: Activity SHA-256 `027b0868f4c365441135ea1f8705d82c364cbc36af7a1dca0f895a002f0bff45`; pool SHA-256 `9d3dbeb1315c0567abacdef50eb1e97f728031d4a3c2ff8727dceb7b5b507d4b`. The pre-existing `activity-page (1).json` was also preserved, with SHA-256 `4bb46b8d06cb7017555130d30812883f85cac47123622319d858d9b4e3512d2c`.

All ten A intent/transaction pairs match their previously verified sender, target, method, arguments and value. Every saved transaction is `FINALIZED` with `execution: success`; each prior receipt has result code `0` / `return`. Full exported return payloads match, allowing only equivalent timestamp offsets; the comparison retains microsecond precision. The UI stores five bounded creation integers as numbers while decoded calldata uses decimal strings; this documented representation difference is normalized only at those argument positions. Empty withdrawal arguments are intentionally omitted in the decoded calldata and exported as `[]`.

The latest A withdrawal remains:

- Parent: `0xba12f18e690c8429025cd34eca00082d6a02c47aa3cc4e24e271d90b2ee57efc`.
- Payout ID: `payout-00000006`; amount `100` wei; recipient A.
- Credited/finalized native child: `0xa5eaa5fcf74a3e5b44d085b0eb7b296df1ba70d4350868140aa8187cf376f118`.
- Exported emission time `2026-09-07T03:49:48.970518+00:00` is the exact same instant as the prior receipt's `2026-09-06T20:49:48.970518-07:00`.

The comparison links the exported child to the earlier independently verified core sender, A recipient, 100-wei value, parent relation, native transaction type, finality and credited state. This follow-up does **not** claim a new independent RPC verification or fresh transfer.

The full stored pool and both participant records match the earlier verified settlement, including terms hash `f822901b2e7587245dd33e709f79940353769c33d94961579b67cb12c330495d`, join/start Unix timestamp `1788704114`, end `1788707714`, two successful participants and zero fee. The seven pool-scoped core calls match exactly. Helper captures and account-scoped withdrawals have different scopes and remain in the full lifecycle evidence; the pool download is not a complete chain archive.

Re-run the comparison without creating or overwriting evidence, from `frontend`:

```powershell
node verification/verify-wallet-a-final-2026-09-07.mjs 'C:/Users/user/Downloads/activity-page (2).json' 'C:/Users/user/Downloads/human-wallet-60m-20260906-131207-record (1).json'
```

## Remaining scope

This closes A's final Activity reload/export gap and confirms `CP-HUMAN-UX-01` on the authenticated **local** UI. A separately authorized protected-preview release/review remains outstanding. Changed-pool/round/terms consent combinations, exact browser/extension versions, any explicitly approved successful cancellation retry, and the other unobserved human branches remain distinct gaps in [the checklist](../../HUMAN-WALLET-TEST.md). No new full-suite run, public CI, immutable commit, deployment, source-hash re-attestation, visibility change or submission is claimed by this evidence-only follow-up.

Final teardown: retained the user's Chrome test tab and stopped only the temporary local development session on port 4195. Its final diagnostic output included a successful `POST /api/auth/verify` and successful session, protected read, Activity and pool-history responses. The deployed preview and its access policy were unchanged. The local URL requires restarting that development server before further interactive testing.
