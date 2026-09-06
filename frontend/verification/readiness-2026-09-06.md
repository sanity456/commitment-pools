# Commitment Pools readiness — 2026-09-06

Scope: September implementation, local verification, clean Ubuntu CI and protected-preview HTTP acceptance; not a human wallet trial or an independent audit. This release preserves the deployed v3 source and the separate Dispute Court product.

## Changes

- Pool forms survive ordinary state refreshes. Fresh wallet/contract/detail reads gate actions; recorded terms and participant progress determine when review must be repeated.
- Recovery hashes are scoped to product, wallet and core. Unscoped historical entries are retained separately for manual verification, never automatically resent or assigned to a new deployment.
- Evidence review is explicit, complete-source and context-bound. Wallet rejection copy is concise. Wallet-only authentication is unchanged.
- Formation inputs support minutes/hours/days with exact integer conversion and contract-compatible bounds.
- All top-level tool/dependency versions, GenVM runners and GitHub Actions are pinned. JavaScript's transitive graph uses the frozen pnpm lockfile; Python top-level pins are not a claim of a fully hash-locked transitive graph.
- Native development and production build output are isolated and excluded from deployment uploads. Obsolete local provider-login checks and cross-product documentation were removed.

## Verified locally

Windows; Node 24.18.0, pnpm 11.19.0, Python 3.12.14. Python checks used the existing sibling virtual environment containing the pinned tooling, with this repository as the working directory; no sibling source was changed. GitHub's clean Ubuntu install pins Python 3.12.13 and is the independent fresh-environment gate.

| Check | Observed result |
| --- | --- |
| GenVM lint and every direct regression (`check_contracts.py --legacy`) | Both v3 contracts pass; 159 tests pass, 3 opt-in deployment cases deselected |
| Application suite | 109 pass, no skipped tests |
| Formatting, zero-warning lint, both TypeScript targets | Pass |
| Sites/Vinext and native Next/Vercel production builds | Pass |
| Production document checks at `http://localhost:4193` | Three HTTP 200 responses; fresh nonces; every executable script matches; strict production CSP and defensive headers |
| Wallet HTTP checks at development `http://localhost:4192` | 26 checks pass with fresh synthetic signers; no chain transaction sent |
| Real Neon disposable verification | 13 groups pass; exact random schema removed; contract-bound initialization idempotent; legacy counts unchanged |
| Read-only deployed-source check, expected fee 500 bps | Both exact byte comparisons, finalized-success receipts, owner, chain/version and helper linkage pass |
| Production dependency audit | Zero reported vulnerabilities |
| Full development dependency audit | Two high version-based `image-size@2.0.2` advisories; existing mitigation patches and parser regressions retained |

The wallet harness correctly cannot issue a challenge on an unrecognized local **production** host: without trusted hosting client identity, it returns `503 client_identity_unavailable`. No forwarding-header bypass or weaker production authentication was added. The development-loopback path is separately supported. All 26 wallet checks were subsequently passed on the actual trusted Vercel host, as recorded below.

The direct chain-time tests print their creation inputs, stored chain records, boundary timestamps, observed output and asserted reason prefixes in the dedicated verbose CI step. Model/network responses are mocked; these are boundary proofs, not live consensus or human signatures. The historical public 1-wei value probe is intentionally not run by ordinary or isolated CI. The isolated v2/v3 deployment smoke tests do not cover live AI adjudication.

The initial Ubuntu run exposed GLSim 0.29.2's schema-extraction incompatibility with this pinned runner: deployment succeeded but the SDK wrapper had no generated methods. The harness now supplies explicit read/write binding metadata while still executing the real source and asserting successful consensus receipts. This does not mock results or weaken the contract. A separate local Windows GLSim attempt hit upstream character-decoding and temporary-file locking errors; it is not reported as a passing integration run. The supported clean integration gate remains Ubuntu.

Core SHA-256: `e17b75f5e172db9f123f8f96c1110525d626fefa9c5f5b3e5c977a08844a9dbb`.

Helper SHA-256: `8eaa893c58927830a307763138dba45a5f77e4d31ead90e8d3688e0c7a6b123c`.

## External release gates

- App implementation: [immutable commit `ace5d3f78968dc8bf06a333f2c65c1ee37baee6e`](https://github.com/sanity456/commitment-pools/tree/ace5d3f78968dc8bf06a333f2c65c1ee37baee6e).
- Complete clean Ubuntu suite: [run 34028377487](https://github.com/sanity456/commitment-pools/actions/runs/34028377487), **success** at [`dfa4132d87a5a584ff35264730d7c8092a28eb73`](https://github.com/sanity456/commitment-pools/tree/dfa4132d87a5a584ff35264730d7c8092a28eb73). This includes 159 direct tests, 2 isolated simulator integration tests, 109 app tests, both builds and deployed source verification. Later commits must pass the same workflow; this link is not a claim about untested future changes.
- September [private Vercel preview](https://commitment-pools-studionet-28cvvvtta-sanity3.vercel.app): `dpl_9LEadK7GttSxVi9CLDdbY5QpJAVM`, READY, preview target, deployed app commit `ace5d3f78968dc8bf06a333f2c65c1ee37baee6e`. Generated builds, local data and `.env.local` were excluded from the 167-file upload. Subsequent test-harness/documentation edits do not alter app runtime or contract bytes.
- Hosted verification used authenticated `vercel curl` transport to run the checked-in `tests/hosted-wallet-checks.mjs` with synthetic, in-memory signers/cookies. All 26 checks pass, including secure host-only HttpOnly cookies, replay/wrong-signer/CSRF rejection, wallet isolation, session restore, logout and revocation. No transaction sent. Three hosted document responses passed fresh CSP nonces, executable-script matching and defensive headers.
- Anonymous access checks: the September and historical August previews return 302 to Vercel authentication; the canonical demo and private GitHub repository return 404. Historical previews were not opened to the public.
- Public repository/canonical demo: awaiting explicit owner approval; historical previews remain protected.
- Signed-out evidence-link audit and concise final steward response: pending public access and immutable evidence.
- Human two-wallet browser lifecycle: not yet run; see `HUMAN-WALLET-TEST.md` at the repository root.

One final local read-only source check received an unexpected HTML RPC response and failed closed. The next bounded chain-ID/source check succeeded with the exact hashes above; the clean Ubuntu source-check step also passed. No failed read was replaced with sample data or interpreted as deployment success.

The [August automated lifecycle](end-to-end-2026-08-30.md) remains valid historical evidence, not a fresh September human trial. No public contract write was made during this readiness pass. Studionet test assets only; no mainnet, guaranteed verdict accuracy, unsupported mobile wallet, or independent security certification is claimed.
