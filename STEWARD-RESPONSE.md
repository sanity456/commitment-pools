# Commitment Pools — submission verification draft

Not ready to submit: public evaluator access, clean hosted CI and the human two-wallet trial remain gates. This is a separate, wallet-only Studionet product; no real-money or independent-audit claim is made.

| Requested item | Evidence/status |
| --- | --- |
| 1. Complete clean Ubuntu suite | Pinned [workflow](.github/workflows/ubuntu-clean-suite.yml) runs all direct/app tests, both builds, isolated v2/v3 smoke tests and read-only deployed-source verification. Hosted result pending. |
| 2. Stored chain timestamps | [Boundary tests](tests/test_chain_timestamps_v3.py) derive formation, round and settlement checks from stored contract records; malformed model retries cannot extend the deadline. |
| 3. Public passing GitHub Actions | Pending run and approval to make the private repository public. |
| 4. Dependency and GenVM pins | [Pin checker](scripts/check_reproducibility.py), exact top-level requirements, frozen pnpm lockfile, immutable Action SHAs and runner hashes. Python transitive packages are not fully hash-locked. |
| 5. Immutable commit links | Pending final tested commit. Relative draft links must be replaced with immutable reviewer-accessible evidence. |
| 6. Deployed source matches | Both v3 byte comparisons pass in the [readiness record](frontend/verification/readiness-2026-09-06.md); CI repeats them against its checkout. |
| 7. Inputs, times, payloads, reasons | Verbose chain-time tests emit exact inputs, stored times, observed payloads and expected `[EXPECTED]` / `[LLM_ERROR]` reason prefixes. Human transaction evidence still pending. |
| 8. Signed-out evidence access | Not passed: repository and preview currently private. |
| 9. One concise response | This draft; finalize after the above gates and [human trial](HUMAN-WALLET-TEST.md). |

Existing live two-wallet automated verification is documented in the [August report](frontend/verification/end-to-end-2026-08-30.md), including independent native payout delivery. It is not a human browser-extension trial. Two locally patched development-only parser advisories remain disclosed; the production dependency audit is clean. Only injected EVM EOA wallets are supported.
