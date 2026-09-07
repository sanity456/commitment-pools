# Commitment Pools — public Studionet release

On September 7, 2026, the owner explicitly approved making `sanity456/commitment-pools` public and preparing the GenLayer Builders → Projects application. The application must not be submitted until the owner separately approves it. Dispute Court remains a separate product and was not changed.

## Reviewer entry points

- [Live demo](https://commitment-pools-studionet.vercel.app/). Use Chrome and MetaMask on Studionet, chain `61999`. Wallet sign-in is required to browse pools; a login signature does not move funds.
- [Tested source/evidence commit](https://github.com/sanity456/commitment-pools/tree/c67890366cb01bc13107f4cfeaed31ce6991482d) and its [successful complete Ubuntu run](https://github.com/sanity456/commitment-pools/actions/runs/34128109148).
- [Human test index](https://github.com/sanity456/commitment-pools/blob/c67890366cb01bc13107f4cfeaed31ce6991482d/frontend/verification/human-consent-2r-completion-2026-09-07.md). Pool `human-consent-2r-20260907-093128` is settled; both wallets passed 2/2 rounds and received their 100-wei stakes back, with zero remaining recorded credits or fees. The index preserves the separately canceled request and successful replacement.
- [Core](https://explorer-studio.genlayer.com/address/0x7279B4A7821c96489c0b086021F3E6944d343bFB) and [evidence helper](https://explorer-studio.genlayer.com/address/0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D). Their exact deployed source bytes matched the tested repository checkout in CI.

## Publication checks

The GitHub repository was already synchronized to the passing commit. Before changing visibility, a high-confidence credential-pattern scan read 450 historical blobs, including 443 text blobs across 607 reachable Git objects. The four flagged blob versions contained seven explicit dummy database URLs in test fixtures; no unresolved findings remained. This limited scan is not a guarantee that no undiscovered secret or vulnerability exists.

GitHub independently reported `private: false` and `visibility: public` after the change. The [signed-out access checkpoint](frontend/verification/release-access-public-2026-09-07.json) at `2026-09-07T14:13:48.575Z` returned HTTP 200 for **57/57 enumerated links**, including the repository, immutable checkout, passing CI, current human evidence, version screenshots and public demo URLs. It supersedes the private-access failure only for that enumerated bundle. Historical generated Vercel preview URLs remain protected and are provenance, not the current reviewer entry point.

The portal form was inspected in the owner's Chrome session. It requires seven project fields plus GitHub repository evidence; a website is required. A YouTube video and contract-explorer links are explicitly optional. At inspection it showed 0 of 2 Project slots used that week. This records the visible form, not a promise of acceptance or an exhaustive statement of all programme policies.

The approved black-background logo is `brand/submission/commitment-pools-logo-black-1024.png`: 1024 × 1024, 592,528 bytes, SHA-256 `d01ac33f7b6d646f555ee263377ff07137b8fb8ef55910ea17f444b0fa78bd70`. It meets the displayed PNG/JPEG/WebP, 128–2048 px, maximum 2 MB limits.

## Scope

Publication changed repository visibility and documentation only; it did not deploy new app/contract code or initiate wallet transactions. The documentation/evidence follow-up must pass the full Ubuntu workflow before handoff. The canonical demo is public, while wallet/private APIs still require authentication. No wallet sign-in on the public alias was performed during this publication check; the completed human trial used the protected preview of the same deployed app.

Only injected EVM EOA wallets are supported. The optional legacy v2 live-value probe was not rerun, Python transitives are not fully hash-locked, and the previously documented development-only parser advisories remain disclosed. No new vulnerability scan, independent security certification, production-money readiness, open-source licence grant or submission acceptance is claimed.
