# Private human wallet rejection test

Status: **human creation-transaction rejection passed**. The exact request is saved as cancelled with no hash or linked transaction; the cancellation survived refresh and full reload. No pool was created, and all tested contract statistics, credits and native balances were unchanged. Commitment Pools only; repository and preview stay private. No UI/source change, deployment, Git push or submission occurred. Full human acceptance is still partial; no successful retry after this cancellation was requested or attempted.

The owner asked to start rejection testing before UI editing. The completed two-wallet lifecycle stays frozen at local commit `f8c64aaa688bb2c9ebf3eae56badfd84de0b5c85`; neither settled pool is reused. The tested deployed app remains `ace5d3f78968dc8bf06a333f2c65c1ee37baee6e`.

## Exact intended request

- Human actor: B, `0xE6E7bfFA242d2900fad7067012564d441F735c43`, observed signed in as `0xe6e7…5c43`.
- Studionet 61999; existing core `0x7279B4A7821c96489c0b086021F3E6944d343bFB`.
- Method `create_pool`; additional transaction value **0 GEN**. The human must **reject**, not approve.
- Unique prospective pool ID `human-wallet-reject-20260907-043503`; title `Wallet rejection test - DO NOT APPROVE`.
- Prospective terms retain the earlier technical public-page source-verification rules, 100-wei per-participant stake, two-person cohort, one one-hour round and 60-minute formation. These are draft terms only: no joining, staking, source capture or payout is requested or authorized.
- All eleven exact arguments, public read-only baselines and expected results are in [the machine-readable record](human-wallet-rejection-2026-09-07.json).

## Preflight and review

Before opening Create, B's Activity showed six B-only saved requests, no pending request and the already-delivered B withdrawal. At `2026-09-07T04:37:08.023Z`, independent finalized reads verified chain 61999, core protocol 3, fee 500 bps and complete enumeration of all five existing pools; the prospective test ID is absent. Both current credits are zero. Native balances are A `999999999999998980` wei, B `980` wei and core `2000` wei. No transaction was submitted by these checks.

At `2026-09-07 04:37:43 UTC`, the review dialog displayed the exact ID, cancellation-only title/promise, rules, source-verified mode, stake, 2/2 cohort, one-hour round, 60-minute formation, 5% forfeiture fee and failure consequences. It explicitly says creation moves no funds. Consent was initially unchecked and `Confirm & open wallet` disabled. The MetaMask extension was not inspected or controlled.

## Expected verification after rejection

At `2026-09-07 04:39:07 UTC`, checked the reviewed-draft consent and observed the confirmation button enable. At `04:39:12 UTC`, clicked `Confirm & open wallet` once. The unchanged review remains visible with `Waiting for wallet / finality…`; account, Refresh, consent, close and edit controls disabled. This opens the request for the human to reject, not an approval of creation. No hash or outcome is yet observed. The human must choose **Reject**, not Confirm, in B's MetaMask request and reply `done`, keeping B selected.

After the human rejects and replies `done`, inspect the app's cancellation feedback, preserved draft and re-enabled controls; verify the saved intent is cancelled/unsigned with no hash. Refresh/reload its saved history and compare the exact draft inputs. Independently check that the prospective pool still does not exist and credits/balances are unchanged. A provider 4001 rejection is expected, not yet observed. Never fabricate a rejected transaction receipt, repeat an uncertain request or treat a local timestamp as chain execution evidence. If the human accidentally approves, reconcile the actual hash and chain result instead of claiming this rejection test passed.

## Observed cancellation

After the human replied `done`, at `2026-09-07 04:40:58 UTC` the app displayed `Wallet request cancelled. Nothing was sent. Open Activity to review the saved request before submitting again.` The exact draft and review remained intact, with the unchanged review consent checked; account, Refresh, close/edit and confirmation controls re-enabled. No confirmation/retry was clicked. Closed the review through its enabled Close control and inspected Activity.

Activity showed seven B-only saved requests with the optional wallet filter unchecked: the prior six successful requests and one new `Create pool` entry for `human-wallet-reject-20260907-043503`, labelled `Wallet request cancelled`. It showed no hash and the recorded message `User confirmed the wallet request was rejected or never submitted.` The generic warning that absence of a hash alone does not prove non-broadcast was retained; that absence was not used alone to pass the test.

At `2026-09-07T04:41:53.788Z`, independent finalized-state checks enumerated all five existing pools and verified the prospective ID remained absent. The complete pool-ID list and all contract statistics were identical to preflight. A/B credits remained zero; native balances remained A `999999999999998980`, B `980` and core `2000` wei. These are public read-only postconditions, not a fabricated failed-execution receipt.

## Exact saved record and recovery

At `04:42:43 UTC`, refreshed saved history. The same seven entries returned; the app stated that no transaction was resent. Exported the page at `2026-09-07T04:43:26.658Z` to `C:/Users/user/Downloads/activity-page (1).json`, preserving the earlier export. The actual file is 14,300 bytes, SHA-256 `4bb46b8d06cb7017555130d30812883f85cac47123622319d858d9b4e3512d2c`.

At `2026-09-07T04:44:19.559Z`, parsed that downloaded file and verified one matching cancellation, exact B/core/method, all eleven reviewed arguments and zero value. The saved intent has status `cancelled`, `tx_hash = null`, `transaction = null`, and the exact cancellation message above. Its application-journal creation timestamp is `2026-09-07T04:39:16.074Z`; its update timestamp is `2026-09-07T04:40:08.251Z`. Both raw millisecond values and the allow-listed complete saved request are in the JSON evidence. These are application timestamps, not chain execution timestamps. The other six successful hashes were unchanged, and every exported request belonged to B.

Reloaded the known settled pool URL without reopening or submitting the rejected creation request. B's session restored without another signature. At `2026-09-07 04:45:00 UTC`, Activity again showed the same seven requests, with the cancellation still hashless and the earlier six results intact. No pending request, duplicate request or automatic retry was observed.

## Reason codes and scope

The expected wallet-provider rejection code is 4001. The reviewed shipped app recognizes that code in up to five nested causes, maps it to the observed cancellation feedback and requests an unsigned-cancellation journal update. The raw provider response was not captured or inspected; code 4001 is therefore a code-supported inference, not claimed as directly observed. The actual observed saved result is `cancelled` with no linked transaction. There is no chain return payload, execution reason code or execution timestamp for this unsigned request, and none is invented.

The requested rejection/cancellation test is complete. A successful retry following this cancellation was neither authorized nor attempted; previous successful creation and payout evidence remains a separate immutable checkpoint. Other human-consent/recovery/version checks and the post-payout wording issue are still documented in the main acceptance checklist. This test did not edit UI or wallet/contract logic. Save the evidence locally; keep GitHub push, deployment, evaluator access and submission deferred.
