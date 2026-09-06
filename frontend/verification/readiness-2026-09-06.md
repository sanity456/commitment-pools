# Commitment Pools readiness — 2026-09-06

Scope: September implementation and local verification; not a human wallet trial or an independent audit. The working release preserves the deployed v3 source and the separate Dispute Court product. Hosted CI, deployment and immutable links are recorded below when verified.

## Changes

- Pool forms survive ordinary state refreshes. Fresh wallet/contract/detail reads gate actions; recorded terms and participant progress determine when review must be repeated.
- Recovery hashes are scoped to product, wallet and core. Unscoped historical entries are retained separately for manual verification, never automatically resent or assigned to a new deployment.
- Evidence review is explicit, complete-source and context-bound. Wallet rejection copy is concise. Wallet-only authentication is unchanged.
- Formation inputs support minutes/hours/days with exact integer conversion and contract-compatible bounds.
- All top-level tool/dependency versions, GenVM runners and GitHub Actions are pinned. JavaScript's transitive graph uses the frozen pnpm lockfile; Python top-level pins are not a claim of a fully hash-locked transitive graph.
- Native development and production build output are isolated and excluded from deployment uploads. Obsolete local provider-login checks and cross-product documentation were removed.

## Verified locally

Windows; Node 24.18.0, pnpm 11.19.0, Python 3.12.13. Python checks used the existing sibling virtual environment containing the pinned tooling, with this repository as the working directory; no sibling source was changed. GitHub's clean Ubuntu install is the independent fresh-environment gate.

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

The wallet harness correctly cannot issue a challenge on an unrecognized local **production** host: without trusted hosting client identity, it returns `503 client_identity_unavailable`. No forwarding-header bypass or weaker production authentication was added. The development-loopback path is separately supported. Actual Vercel wallet authentication must still be checked on its trusted host.

The direct chain-time tests print their creation inputs, stored chain records, boundary timestamps, observed output and asserted reason prefixes in the dedicated verbose CI step. Model/network responses are mocked; these are boundary proofs, not live consensus or human signatures. The historical public 1-wei value probe is intentionally not run by ordinary or isolated CI. The isolated v2/v3 deployment smoke tests do not cover live AI adjudication.

Core SHA-256: `e17b75f5e172db9f123f8f96c1110525d626fefa9c5f5b3e5c977a08844a9dbb`.

Helper SHA-256: `8eaa893c58927830a307763138dba45a5f77e4d31ead90e8d3688e0c7a6b123c`.

## External release gates

- Tested implementation commit and Ubuntu CI: pending the private repository push/run.
- September Vercel preview and hosted checks: pending deployment.
- Public repository/canonical demo: awaiting explicit owner approval; historical previews remain protected.
- Signed-out evidence-link audit and concise final steward response: pending public access and immutable evidence.
- Human two-wallet browser lifecycle: not yet run; see `HUMAN-WALLET-TEST.md` at the repository root.

The [August automated lifecycle](end-to-end-2026-08-30.md) remains valid historical evidence, not a fresh September human trial. No public contract write was made during this readiness pass. Studionet test assets only; no mainnet, guaranteed verdict accuracy, unsupported mobile wallet, or independent security certification is claimed.
