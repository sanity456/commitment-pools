# Submission and activation checklist

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
- [ ] Complete a human two-wallet injected-browser trial: first sign-in, signature rejection, account/network change, reload/session restore, failure/retry, credit and withdrawal.
- [ ] Test the supported injected EVM wallet/browser combination. Do not claim WalletConnect, mobile deep-link, or smart-contract-wallet support without implementing and testing it.

The browser-rendering observations above describe the August private release. The September preview is deployed and passed production-header checks and all 26 synthetic wallet HTTP checks. The actual extension UI remains part of the [human trial](HUMAN-WALLET-TEST.md).

## Submission access and program rules

- [ ] Give evaluators approved access to the protected demo and private source, or explicitly approve an appropriate public submission.
- [ ] Obtain the actual program rules and confirm network, eligibility, deadline, public-source/license, video and other required artifacts.
- [ ] Include a concise walkthrough, contract addresses, tested commit, setup instructions and an honest limitations statement.
- [ ] Describe this as an implementation-assisted review, not an independent security certification.
- [ ] Require the complete pinned Ubuntu GitHub Actions run to pass on the final release commit. Private green CI does not meet the public-evidence gate.
- [ ] Pin each source, test and report link to an immutable commit; compare both deployed source hashes from that checkout.
- [ ] Open the demo, repository, CI run and every evidence link without a signed-in session. Record the result, not just the URL.
- [ ] Finalize one concise `STEWARD-RESPONSE.md` answering the nine requested verification items without unresolved placeholders or invented results.

The complete [private Ubuntu run at `dfa4132`](https://github.com/sanity456/commitment-pools/actions/runs/34028377487) passed. Keep the public-CI item unchecked until the reviewed final commit is green and signed-out evaluators can actually open it. Current anonymous checks return GitHub 404, protected-preview 302 to Vercel, and canonical-demo 404; public access has not been authorized.

The published npm metadata still lists `image-size 2.0.2` as latest; the advisory's `2.0.3` fix is not published there as of this review. Existing parser patches and regression tests are retained. Full dependency scans therefore still flag two dev-tool advisories; do not suppress them or pretend the dependency scan is clean. If the submission requires a zero-advisory scan, resolve that policy with the program or wait for a verified compatible upstream release.

No production-money readiness is claimed. Studionet test assets only.
