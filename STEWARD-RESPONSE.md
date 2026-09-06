# Commitment Pools — submission verification draft

Not ready to submit: public evaluator access and the human two-wallet trial remain gates. The complete private Ubuntu suite and protected-preview HTTP checks pass. Every final evidence commit must also pass the workflow. This is a separate, wallet-only Studionet product; no real-money or independent-audit claim is made.

| Requested item | Evidence/status |
| --- | --- |
| 1. Complete clean Ubuntu suite | [Passing run 34028377487](https://github.com/sanity456/commitment-pools/actions/runs/34028377487): 159 direct tests, 2 isolated v2/v3 smoke tests, 109 app tests, both builds and read-only deployed-source verification. |
| 2. Stored chain timestamps | [Boundary tests](https://github.com/sanity456/commitment-pools/blob/dfa4132d87a5a584ff35264730d7c8092a28eb73/tests/test_chain_timestamps_v3.py) derive formation, round and settlement checks from stored contract records; malformed model retries cannot extend the deadline. |
| 3. Public passing GitHub Actions | Private CI is green; public access still requires approval and signed-out verification. |
| 4. Dependency and GenVM pins | [Pin checker](https://github.com/sanity456/commitment-pools/blob/dfa4132d87a5a584ff35264730d7c8092a28eb73/scripts/check_reproducibility.py), exact top-level requirements, frozen pnpm lockfile, immutable Action SHAs and runner hashes. Python transitive packages are not fully hash-locked. |
| 5. Immutable commit links | [Tested commit `dfa4132`](https://github.com/sanity456/commitment-pools/tree/dfa4132d87a5a584ff35264730d7c8092a28eb73); deployed app source is its ancestor `ace5d3f78968dc8bf06a333f2c65c1ee37baee6e`, with unchanged runtime/contract bytes. Final human evidence remains pending. |
| 6. Deployed source matches | Both exact v3 byte comparisons pass in the linked CI run. [Verifier](https://github.com/sanity456/commitment-pools/blob/dfa4132d87a5a584ff35264730d7c8092a28eb73/frontend/scripts/verify-security-release.mjs) checks finalized-success receipts, source, owner, fee, chain/version and helper linkage. |
| 7. Inputs, times, payloads, reasons | Verbose chain-time tests emit exact inputs, stored times, observed payloads and expected `[EXPECTED]` / `[LLM_ERROR]` reason prefixes. Human transaction evidence still pending. |
| 8. Signed-out evidence access | Not passed: GitHub returns 404; [September preview](https://commitment-pools-studionet-28cvvvtta-sanity3.vercel.app) redirects to Vercel login. No public alias was added. |
| 9. One concise response | This draft; finalize after the above gates and [human trial](HUMAN-WALLET-TEST.md). |

Existing live two-wallet automated verification is documented in the [August report](frontend/verification/end-to-end-2026-08-30.md), including independent native payout delivery. It is not a human browser-extension trial. Two locally patched development-only parser advisories remain disclosed; the production dependency audit is clean. Only injected EVM EOA wallets are supported.
