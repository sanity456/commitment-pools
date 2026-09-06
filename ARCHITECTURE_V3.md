# Commitment Pools v3 security boundary

v3 is a new immutable contract release. The v2 source and its deployed addresses remain unchanged for historical verification and recovery.

## Authority

- The app owns wallet authentication, discovery, user preferences, private support records, and non-authoritative previews.
- The core contract owns accepted economic terms, eligibility, evidence verification, validator comparison, settlement, and credits.
- The evidence helper prepares a public immutable source snapshot. It is neither a judge nor a funds custodian.
- External pages are untrusted facts, never instructions. The core re-fetches and normalizes them before checking the committed digest.

## Complete evidence

Every v3 core and helper enforces a maximum of 6,000 normalized UTF-8 bytes per source. Accepted source text is passed to the model in full, never sliced. Oversize capture is rejected. The app validates recovered capture bytes, digest, product linkage, URL policy and size before enabling proof submission.

All authoritative URL entrypoints use the same public-DNS HTTPS rules and reject IP shorthand, private suffixes, address aliases, credentials, fragments, backslashes, control characters and custom ports. This lexical policy is not a network sandbox: the renderer must independently protect DNS resolution and redirect destinations.

## Pool settlement

The original schedule, immutable stake/fee/all-fail terms, per-round attempt budget, settlement conservation and withdrawal-credit rules remain intact. Oversize evidence causes an execution error before an attempt/nonce is consumed; the participant can submit a supported complete source within the original round window.

Self-attested pools retain their explicitly limited verification mode. v3 does not relabel a self-attested statement as independently verified proof.

## Wallet authentication and web boundary

Wallet-only sign-in is preserved; email and password login are not reintroduced. Challenges are rate-limited by infrastructure-supplied client identity, not a wallet address that an unauthenticated caller can claim. The global challenge circuit breaker runs only after valid input and per-client checks and cannot prevent verification of an already issued challenge.

Vercel uses its protected forwarding header; Workers use the platform connecting-IP header. Unknown hosting identity fails closed. Local development accepts only loopback hosts. IPv6 clients are grouped by /64; IPv4-mapped addresses normalize to IPv4. Rate keys contain a daily-rotated digest, not the raw IP. Shared-NAT users still share a network quota; distributed abuse remains an edge-protection/operations concern. [Vercel request headers](https://vercel.com/docs/headers/request-headers).

Documents receive fresh script nonces, strict-dynamic CSP, no-store responses, anti-framing and other defensive headers. Rendering is dynamic so cached HTML cannot reuse a nonce. Styles permit inline styling for the existing UI; production scripts do not permit unsafe-inline or unsafe-eval. [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy).

## Activation boundary

The app requires protocol version 3 and the expected evidence limit before reserving new actions. A v3 helper must point at the same v3 core. Explicit deterministic recovery methods remain usable on the historical core. This gate protects the app; direct callers can still reach immutable old contracts.

For release, verify new source bytes against successful finalized deployment receipts. Preserve the old protected app link and old data for recovery. Use a separate v3 product database schema, or implement explicit contract-scoped data migration, before pointing the new app at v3; never mix old directory IDs and new contract state silently. Do not reassign old agreements, balances, or private records.

The application manifests now contain the verified v3 core and helper. Historical v2 manifests remain in the repository as `*-v2.json`; no old records were reassigned. Vercel uses a separate product/core-bound v3 Neon namespace. Run `node scripts/verify-security-release.mjs --expected-fee-bps 500` from `frontend/` to compare both deployed sources with this checkout. See the submission checklist for the remaining external steps.
