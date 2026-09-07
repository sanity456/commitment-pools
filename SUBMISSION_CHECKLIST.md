# Submission and activation checklist

Publication update, September 7: the owner approved making this repository public. The [public release checkpoint](PUBLIC-RELEASE.md) records 57/57 anonymous access checks and the actual GenLayer Builders → Projects form. Submission itself still requires the owner's final approval. Earlier private-access statements below are historical; broader coverage and operational limitations are not silently marked passed.

## Completed in this checkout

- Versioned v3 core and evidence helper; deployed v2 source preserved.
- Complete-source size enforcement and consistent authoritative URL policy.
- Per-client wallet login quotas without unsigned wallet-address lockouts.
- Nonce-based script CSP and defensive document headers.
- Security regressions, project-local Python requirements and a safe contract-check command.
- Wallet-only sign-in and the two-product separation preserved.
- Refresh-safe pool/evidence review, wallet/core-scoped emergency recovery and minutes/hours/days formation inputs.
- Exact top-level dependencies, lockfile, runner hash and Ubuntu workflow runtime/Action pins.
- Chain-timestamp tests print the stored state, exact inputs, checked times, observed payload and expected reason prefixes.

## Required before calling the live product security-fixed

- [x] Run the contract check script, frontend tests, lint, both type checks, formatting and both supported builds on the release source (2026-09-06). Re-run after further code edits.
- [x] Deploy a v3 core plus its own v3 evidence helper on Studionet. Verify successful execution as well as finality, exact source bytes, owner, fee, helper link and protocol version.
- [x] Preserve the old protected deployment/data for existing-record recovery and isolate the v3 product schema by product and core address without silent record reassignment.
- [x] Update both manifests consistently and pass `node scripts/verify-security-release.mjs --expected-fee-bps 500` from `frontend/`.
- [x] Publish and verify a new private Vercel preview on the approved account without enabling a public alias.
- [x] Verify production headers and browser execution after deployment, including fresh document nonces, wallet-only UI, no console errors and no horizontal overflow.
- [x] Complete automated signed-wallet/session and two-wallet live lifecycle paths, including separate payout-child delivery verification.
- [x] Complete the both-pass human two-wallet lifecycle, including the subsequent two scheduled rounds, exact settlement credits and independently delivered withdrawals. [Completion evidence](frontend/verification/human-consent-2r-completion-2026-09-07.md). Earlier login/rejection, account/network reset and reload checks retain their individually recorded scopes; the new run also covers a reconciled network cancellation and successful replacement.
- [x] Document and exercise the supported injected Chrome/MetaMask combination: pre-run Chrome `152.0.7977.83` (64-bit), MetaMask `13.46.1`. Do not claim WalletConnect, mobile deep-link or smart-contract-wallet support.
- [ ] Resolve any additional program-required human coverage against the actual rules. Unobserved branches are disclosed in [the human coverage record](HUMAN-WALLET-TEST.md); completion of the both-pass lifecycle is not exhaustive manual branch coverage.

The older browser-rendering observations describe the August private release. The September preview passed its production-header and synthetic wallet HTTP checks, followed by the completed real Chrome/MetaMask [two-round human run](frontend/verification/human-consent-2r-completion-2026-09-07.md). Both wallets passed 2/2, 100 wei was delivered back to each, and both credits and fees are zero. No new full-suite run or public CI result is implied by these evidence-only updates.

## Submission access and program rules

- [x] Publish the approved demo and source. GitHub is public; the canonical demo and current source/evidence/CI bundle passed the recorded anonymous access checks. Wallet sign-in is still required to browse pools.
- [ ] Obtain the actual program rules and confirm network, eligibility, deadline, public-source/license, video and other required artifacts.
- [ ] Include a concise walkthrough, contract addresses, tested commit, setup instructions and an honest limitations statement.
- [x] Describe this as an implementation-assisted review, not an independent security certification.
- [x] Pass the complete configured pinned Ubuntu pipeline on release/evidence candidate `b4ca7a4`: [run 34126789440](https://github.com/sanity456/commitment-pools/actions/runs/34126789440). Any follow-up commit must pass the full workflow too. The optional legacy v2 live-value probe is outside this pipeline; see the exact scope in [the release record](frontend/verification/release-ubuntu-2026-09-07.md).
- [x] Pin the current source/test/human-evidence links to immutable candidate `b4ca7a409523d8063d1c19e99e690f98d2b3e75a` and compare both deployed source hashes from that Ubuntu checkout. Private links do not satisfy public access.
- [x] Make the passing CI and enumerated current source/evidence bundle publicly accessible after owner approval. All 57 recorded link checks returned HTTP 200 without authentication. Protected historical preview URLs are not the reviewer entry point.
- [ ] Open the demo, repository, CI run and every evidence link without a signed-in session. Record the result, not just the URL.
- [x] Prepare one concise `STEWARD-RESPONSE.md` answering all nine items with actual evidence and explicit unmet gates, not invented results or a false ready-to-submit claim.

The current [private Ubuntu run at `b4ca7a4`](https://github.com/sanity456/commitment-pools/actions/runs/34126789440) passed. Keep the public-CI item unchecked until signed-out evaluators can actually open the reviewed final commit and its passing run. Following the owner's approval, the canonical public demo returns 200 without Vercel sign-in; thirteen fresh HTTP checks passed again. Generated previews still redirect to Vercel, and GitHub remains private. The [release-link audit](frontend/verification/release-access-2026-09-07.json) recorded 57 checks: two public URLs accessible, 55 GitHub URLs inaccessible. Source/CI/evidence publication remains unapproved; historical links outside the enumerated current bundle still need the publication-time audit.

The published npm metadata still lists `image-size 2.0.2` as latest; the advisory's `2.0.3` fix is not published there as of this review. Existing parser patches and regression tests are retained. Full dependency scans therefore still flag two dev-tool advisories; do not suppress them or pretend the dependency scan is clean. If the submission requires a zero-advisory scan, resolve that policy with the program or wait for a verified compatible upstream release.

No production-money readiness is claimed. Studionet test assets only.
