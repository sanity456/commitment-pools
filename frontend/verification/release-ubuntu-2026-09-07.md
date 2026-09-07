# Commitment Pools — private release verification

Verified September 7, 2026. The configured clean Ubuntu pipeline passed for the immutable release/evidence candidate below. This is not a public-submission pass or an independent security certification.

## Exact candidate and run

- Candidate: [`b4ca7a409523d8063d1c19e99e690f98d2b3e75a`](https://github.com/sanity456/commitment-pools/tree/b4ca7a409523d8063d1c19e99e690f98d2b3e75a).
- [Ubuntu Actions run 34126789440](https://github.com/sanity456/commitment-pools/actions/runs/34126789440), successful, created `2026-09-07T13:19:50Z`; job completed `2026-09-07T13:24:08Z`.
- Job `Full repository suite`, Ubuntu `24.04`, runner image `20260831.293.1`; clean checkout of the exact candidate, not an uncommitted Windows tree.
- Node `24.18.0`, pnpm `11.19.0`, Python `3.12.13`, pip `26.2.1`; workflow Actions are pinned by commit SHA.
- GenVM: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.
- [Exact workflow and commands](https://github.com/sanity456/commitment-pools/blob/b4ca7a409523d8063d1c19e99e690f98d2b3e75a/.github/workflows/ubuntu-clean-suite.yml).
- [Saved CI metadata, all six exact timestamp-case payloads and deployed-source output](release-ubuntu-2026-09-07.json), extracted from this successful run by the [read-only collector](capture-ubuntu-run-2026-09-07.mjs). Direct-mode fixtures are explicitly marked as mocked, separate from the human receipts.

## Observed results

| Check | Result |
| --- | --- |
| Dependency/runtime/Action/runner pin checker | Passed |
| Both submitted GenVM contracts linted before tests | Passed |
| All direct contract tests, including historical coverage | 159 passed; 3 integration-marked cases deselected in this phase |
| Stored-chain-time boundary evidence, separately printed in verbose mode | 6 passed; these are included in the 159, not six additional unique tests |
| Isolated five-validator GLSim v2/v3 creation smoke tests | Both passed, explicitly executed after the direct phase |
| Complete application suite | 158 passed, zero failures, skips or cancellations |
| Formatting, zero-warning lint and both TypeScript targets | Passed |
| Sites/Vinext and native Next/Vercel production builds | Both passed |
| Deployed source, finality, execution and configuration | Passed from the Ubuntu checkout |
| Tracked checkout unchanged by checks/builds | Passed |

The third integration-marked case is the opt-in **legacy v2 Studionet native-value probe** (`tests/test_studionet_value_v2.py`). It was not rerun: it writes to a separately configured live deployment. The two isolated smoke tests are not a live GenVM consensus lifecycle. Actual v3 runtime, scheduled proofs and native value delivery are established separately by the [completed human run](human-consent-2r-completion-2026-09-07.md), not fabricated by this CI run. If a steward requires the legacy probe specifically, that is an additional scoped live check, not a result claimed here.

Five offline application tests now validate the saved human evidence: eleven distinct successful parents, original chain windows, exact inputs/digests, the separate canceled attempt and replacement nonce, both credited native children, zero remaining credit, 200-wei conservation, report/verifier hashes and unchanged version screenshots. They do not request new signatures or substitute for the original human observations. Evidence JSON/verifier scripts use LF checkout rules so their byte hashes survive Windows and Ubuntu checkouts.

## Deployed identity

Both deployment receipts were finalized **and execution-successful**, and their complete deployed source bytes matched the candidate. Studionet chain `61999`, protocol v3, owner `0x91B1b2D1f2De66400fcbeAEbadB8a5330eB28DC0`, fee `500` bps, 6,000-byte source policy, matching helper/core link and a non-funding helper were checked.

| Component | Address | SHA-256 of exact source bytes |
| --- | --- | --- |
| Core | `0x7279B4A7821c96489c0b086021F3E6944d343bFB` | `e17b75f5e172db9f123f8f96c1110525d626fefa9c5f5b3e5c977a08844a9dbb` |
| Helper | `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D` | `8eaa893c58927830a307763138dba45a5f77e4d31ead90e8d3688e0c7a6b123c` |

The deployed UI remains at `363d79e1245725c57ec1c874f0b0675cf0dca1a6`. The candidate differs from that UI commit only in documentation, verification tooling/evidence, offline tests and evidence line-ending rules; app and contract implementation bytes were not changed. No Vercel deployment or new wallet transaction was performed for this release-verification phase.

## Access and remaining gates

- [Fresh public-demo checks](public-demo-access-release-2026-09-07.json) passed all 13 checks at `2026-09-07T13:21:04.358Z`: public documents, distinct nonces, strict script policy, wallet-only markup, private-API denial including spoofed headers, exact brand assets and protected generated previews.
- [Anonymous release-link audit](release-access-2026-09-07.json) at `2026-09-07T13:23:35.080Z`: **57 checked, 2 accessible public demo/pool URLs, 55 inaccessible GitHub URLs**. Required files were independently confirmed in the candidate Git tree; signed-out HTTP returned 404 while GitHub access remains private. This audit does not establish public reviewer access.
- The unchanged [version screenshots](wallet-environment-2026-09-07.md) are now packaged with relative links and verified hashes; they no longer depend on the owner's local Windows directory.
- Repository visibility remains **private**, as requested. A normal private push synchronized the local product/evidence commits to `sanity456/commitment-pools`; it did not publish source or change hosting access.
- Obtain the actual programme's rules, approve GitHub publication when ready, and then verify every final source/CI/evidence link signed out, including historical evidence outside this audit's enumerated bundle. Check licensing, eligibility, deadline, video and any extra mandatory test coverage before submission.
- Exact top-level Python dependencies are pinned, but their complete transitive graph is not hash-locked. The documented development-only parser advisories and unsupported wallets remain disclosed. No new dependency vulnerability scan or independent security audit is claimed here.

This report is a follow-up to the tested candidate. Its own documentation/evidence commit must also pass the full workflow before handoff; a passing ancestor run must never be presented as a test of later edits. The final [steward response](../../STEWARD-RESPONSE.md) uses the tested candidate's immutable source/evidence links and its paired run, without relying only on `main`.
