# Commitment Pools — consent regression and private-preview preflight

Date: September 7, 2026 (UTC). Scope: Commitment Pools only. The owner approved the remaining consent checks and an update to the existing protected Vercel preview. No public access, GitHub push, new on-chain transaction, contract migration, new wallet or Sites/D1 release is part of this checkpoint.

## Verification completed

- Complete frontend suite: **153 passed, 0 failed, 0 skipped**, including the 32 new tests in [consent-matrix.test.mjs](../tests/consent-matrix.test.mjs).
- Strict lint and formatting: passed.
- Both TypeScript configurations: passed after the production build finished generating its types.
- Both production builds: native Next/Vercel and Sites/Vinext passed. Only Vercel is an authorized deployment target for this release.
- Read-only deployed-source check: passed for chain `61999`, protocol v3, owner `0x91B1b2D1f2De66400fcbeAEbadB8a5330eB28DC0` and fee `500` bps.
  - Core `0x7279B4A7821c96489c0b086021F3E6944d343bFB`: SHA-256 `e17b75f5e172db9f123f8f96c1110525d626fefa9c5f5b3e5c977a08844a9dbb`.
  - Helper `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D`: SHA-256 `8eaa893c58927830a307763138dba45a5f77e4d31ead90e8d3688e0c7a6b123c`.

The source verifier checked successful finalized deployment receipts, exact source bytes, helper/core linkage and the helper's no-funds policy. It did not deploy or execute a write.

## Consent coverage and limits

The new tests use the real production `poolReviewKey`, `workspaceIdentity`, `detailIsFresh`, `roundState` and `poolActions` helpers, plus source-wiring assertions for the React workspace and evidence component. They cover every normalized pool field, all **127 non-empty combinations** of pool ID, terms, participant round, wallet, chain, core and helper changes, loading/error revisions, equivalent refreshed records, attempt exhaustion and terminal participants.

The fixture reads the unchanged [human lifecycle evidence](human-wallet-lifecycle-60m-2026-09-06.json). Round-boundary inputs are derived from the recorded chain schedule: start `1788704114`, end `1788707714`. They check start minus one second, exact start, end minus one second, exact end and end plus one second. The hypothetical second-round case is explicitly labeled simulated and derives its boundary from the stored start and round-window length. No local wall clock, browser-clock override or live record mutation determines those assertions.

These are **regression tests, not a browser simulation or a new human multi-round lifecycle**. They do not prove that a human checked an approval box during a live round transition or changed-term event. No authorization session, wallet or chain result was mocked into the user's app.

## Actual Chrome observations

Using the saved A session on `http://localhost:4195`, the app restored `Signed in · 0xab99…bad4` without another wallet signature. The read-only pool selector was exercised in both directions:

1. From `human-wallet-60m-20260906-131207` to `human-wallet-20260906-122644`: the old detail and participant cards disappeared immediately; `Loading pool…` appeared. The earlier pool then loaded its own one-person cohort, minimum-cohort failure, cancelled state and A's refunded position.
2. Back to `human-wallet-60m-20260906-131207`: the prior cards again cleared during loading. The two-person settled pool, A's successful position and recorded passing proof returned.
3. Current wallet credit remained `0 GEN`, withdrawal stayed disabled, and no join/proof consent or transaction control was shown for either terminal pool. No request was signed or broadcast.

Both existing human pools are closed, so this cannot establish a live checked-consent or multi-round transition. That human coverage remains explicitly incomplete. Exact Chrome and MetaMask version numbers were requested from the owner and are not guessed.

One transient upstream `gen_call` diagnostic during initial page metadata loading reported HTML instead of JSON at `2026-09-07T08:15:09.313Z`. The subsequent protected pool reads and both observed switches completed. This is not claimed to be an error-free upstream run.

## Recoverable local validation failures

The first development start and first native production build encountered Windows `EPERM` while clearing their generated Next directories. Both generated caches were moved recoverably into this repository's ignored `work/` directory, outside `frontend`; no source, dependency, user record or environment file was removed. Fresh development compilation and the native production build then passed. An overlapping TypeScript check initially saw generated files disappear during the failed build; both TypeScript targets passed when rerun after the successful build. Existing middleware-deprecation and Vinext route-classification notices remain non-blocking and are not test passes.

## Hosting preflight

- CLI identity: `sanity456`; selected Vercel scope: `sanity3`.
- Existing project: `commitment-pools-studionet`, ID `prj_ZoCSmpHDcVEDdBCK0Ojhi4FRY8mf`, team `team_kr7BHqYFRB4WJPSmgtQKznCz`.
- Existing protection: `ssoProtection.deploymentType = all_except_custom_domains`. Generated preview links must still be tested anonymously; this setting alone is not a claim that every alias is private.
- The required database configuration includes the Preview environment. No environment value was changed.
- GitHub independently reports `sanity456/commitment-pools` as private. No GitHub push or access change was performed by this preflight.
- Existing `.openai/hosting.json`, historical Sites contracts/D1 data and Dispute Court remain unchanged. The repository's Vercel operating guide prohibits sending the v3 checkout to the historical Sites/D1 deployment without separate isolation approval.

Deployment status and the new exact URL are recorded after the protected preview finishes. A public Ubuntu CI run, full live consent lifecycle and submission readiness are not claimed by these local checks.
