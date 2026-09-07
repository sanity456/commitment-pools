# Commitment Pools — protected preview Wallet A sign-in

Status: **passed for the bounded human sign-in and read-only recovery checks below**. Full human acceptance remains partial.

- Preview: [Commitment Pools](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app/).
- Deployed app source: `363d79e1245725c57ec1c874f0b0675cf0dca1a6`, as recorded in the [protected release evidence](private-preview-2026-09-07.md). This check did not redeploy or repeat source verification.
- Wallet A: `0xab99c741494bef91fae66144dda31be93180bad4`; UI network label: `Studionet · sandbox`.
- Environment: Chrome `152.0.7977.83` (64-bit), MetaMask `13.46.1`, from [owner-supplied About screenshots](wallet-environment-2026-09-07.md) collected before this sign-in check.
- Observation checkpoints: login started `2026-09-07T09:10:27Z`; authenticated UI observed `09:12:03Z`; final pool-reload state verified `09:15:46Z`. These are observation times, not exact signature or chain timestamps.
- Structured observations: [JSON record](private-preview-wallet-a-2026-09-07.json).

## Observed result

The owner approved starting sign-in, completed the MetaMask step personally and replied `done`. Chrome-control then observed Wallet A signed in on the exact new deployment origin. No wallet popup was approved by the agent; no raw signature, session cookie, token or private key was inspected or saved.

1. The authenticated home loaded both historical pools: the settled two-person pool and the cancelled underfilled pool.
2. Activity loaded all ten A requests with its optional `Current wallet only` filter unchecked. The saved current-trial payout displayed the exact A recipient, `0.0000000000000001 GEN`, its parent and native-child hashes, and delivered/finalized labels.
3. A full home reload restored the same authenticated A session without another sign-in request. Reopening Activity returned ten cards whose complete text matched the pre-reload cards exactly.
4. `Refresh saved history` completed and returned the same ten cards, again with identical text. Their observed parent hashes are recorded in the JSON; the prior independent receipts and actual exports remain separate evidence.
5. Opening the settled pool from Activity loaded the correct ID, two successful participants, A's `1/1` successful position and recorded passing attempt.
6. The deployed workspace showed `0 GEN` available credit, the neutral `No credit to withdraw` guide, and a disabled withdrawal button. Reloading that direct pool URL retained the same authenticated identity and zero-credit state.

The pool's historical settlement allocation is displayed separately from current available credit. No withdrawal, transfer, import, proof, contract write or new export was initiated in this check. The displayed payout is saved evidence, not a new independent RPC delivery verification.

An offline consistency check of the new JSON passed: the deployment identity matches the protected-release record, and all ten observed parent hashes/titles, the A payout parent/child/recipient and the pool ID/status match the preserved A export evidence. JSON/Markdown formatting and Git whitespace checks also passed. These checks validate the record without relabeling the historical receipts as new transactions.

## Diagnostics and limits

Chrome had restarted after its update, so its old browser handle was unavailable. The supported runtime reconnected to the current Chrome instance and reclaimed the existing exact preview tab. The earlier restriction on internal/MetaMask screens was not bypassed.

One heading wait after the direct pool reload reported a deadline failure while its own diagnostic showed the heading visible. A subsequent DOM snapshot and direct visibility/enabled-state checks confirmed the loaded pool without another reload. This tooling warning is retained rather than described as a flawless automation run. Captured error-level browser logs returned no entries at the completed pool checks; this is limited to this tab's captured logs, not a server-log audit or a claim that earlier RPC errors cannot recur.

This closes the updated origin's **Wallet A sign-in, reload recovery and zero-credit UI checkpoint**. It does not add new Wallet B/account-switch/network-switch coverage or close the outstanding live checked-consent/round transitions, cancellation retry, early-activation rejection, all-fail or submission gates. The previous full suites and payout tests were not rerun or relabeled as new tests here.

Only local evidence and rolling status documents were updated. No application source, dependency, contract, environment, access policy, deployment or GitHub remote was changed. The authenticated pool tab was left open for the owner. Historical lifecycle, rejection and initial protected-release snapshots remain unchanged.
