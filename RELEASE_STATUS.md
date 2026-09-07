# Commitment Pools — private v3 Studionet release

Updated: 2026-09-07

## Current release

Commitment Pools is a standalone, wallet-only Studionet product. Dispute Court remains a separate product and repository.

- Private preview: [Commitment Pools](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app)
- Current UI source: `363d79e1245725c57ec1c874f0b0675cf0dca1a6` (local commit, directly uploaded to the existing Vercel project; not pushed to GitHub by this release).
- Core v3: `0x7279B4A7821c96489c0b086021F3E6944d343bFB`
- Evidence helper v3: `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D`
- Network: Studionet, chain ID `61999`
- Fee snapshot: 500 bps

The exact v3 source bytes, deployment execution, owner, fee, protocol version and helper linkage were verified against finalized Studionet data. Historical v2 source, manifests, protected deployment and records remain preserved for recovery; the v3 Neon namespace is isolated by product and core address.

Email/password pages, APIs, provider adapters and provider-session acceptance are removed. First-time and returning users authenticate by signing an origin-bound wallet message. Connecting a wallet alone does not authenticate it. Owner tools require a separate expiring owner-wallet proof.

The preview is protected by Vercel Authentication and is not anonymously accessible. No production alias or Sites deployment was changed by this release.

## End-to-end verification

The September 7 UI preview includes the approved black/royal-gold penguin branding, shorter copy and corrected zero-credit guidance. Its complete application suite passed **153 tests**, including 32 new consent checks with 127 combined context changes; lint, formatting, both TypeScript configurations and both production builds passed. Deployed-source/configuration verification passed again. The new protected host passed anonymous-access, strict document nonce/CSP, private API denial and exact brand-asset checks. See [the current release record](frontend/verification/private-preview-2026-09-07.md) for the exact scope and remaining human gates.

The September 6 readiness update preserved the deployed v3 contract bytes and improved the wallet workspace, evidence review, transaction recovery and formation-window input. Its verification passed 159 direct contract tests, 109 application tests, lint, both TypeScript targets and both production builds. The production documents passed fresh-nonce/CSP checks; the local development server passed all 26 synthetic wallet HTTP checks. Neon isolation and exact deployed-source verification were repeated successfully. See [the September readiness record](frontend/verification/readiness-2026-09-06.md). Those older contract/simulator/hosted-wallet runs were not rerun for the UI-only September 7 release.

The earlier complete pinned [Ubuntu run](https://github.com/sanity456/commitment-pools/actions/runs/34028377487) passed at commit `dfa4132d87a5a584ff35264730d7c8092a28eb73`, including both five-validator simulator tests, both builds and deployed-source verification. The previous protected preview also passed all 26 synthetic wallet HTTP checks and fresh-nonce production document checks. Its app source was `ace5d3f78968dc8bf06a333f2c65c1ee37baee6e`. That historical CI result does not cover the current UI commit. Every later commit must pass the complete workflow before submission. Public reviewer access and the incomplete portions of human acceptance remain open gates.

The historical 2026-08-30 release pass completed successfully:

- 153 direct contract tests passed; 3 opt-in deployment cases were deselected.
- 95 application tests passed.
- GenVM lint, zero-warning ESLint, both TypeScript targets and formatting passed.
- Native Next/Vercel and Sites/Vinext production builds passed.
- 13 real Neon check groups passed in a disposable schema, which was removed. The v3 release migration was idempotent and legacy row counts were unchanged.
- The hosted preview passed anonymous-protection, fresh-CSP-nonce, private-value-leak, wallet-session, wrong-signer, CSRF, retired-email-route, v3-identity, logout and revocation checks.
- The production dependency tree reports zero vulnerabilities. The full development tree retains the two documented patched `image-size@2.0.2` advisories.
- The live fixture `verified-source-mtfk2b51` completed 10 finalized-success transactions: create, two funded joins, consensus source capture, activation after the real formation deadline, two evidence-backed check-ins, settlement and two withdrawals.
- Both withdrawal child transfers were independently verified as finalized and delivered, 1,000 wei to each synthetic participant.

The exact transaction and payout evidence is recorded in [the 2026-08-30 E2E report](frontend/verification/end-to-end-2026-08-30.md).

## Remaining beta gates

The two-wallet human lifecycle subsequently passed, including successful proofs, settlement and both independently credited 100-wei native payouts. Creation rejection and both wallets' final Activity/export checks also passed their recorded scopes. Human acceptance is still partial: live checked-consent/round transitions, exact browser/extension versions and the new deployed origin's authenticated check remain open. Follow [the human wallet trial](HUMAN-WALLET-TEST.md) and [current release record](frontend/verification/private-preview-2026-09-07.md). WalletConnect, mobile deep links and smart-contract wallets are not implemented or claimed.

Before submission, complete the program-specific checklist, obtain approved evaluator access to the private preview/source, pass the pinned Ubuntu run and complete the human trial. Before broader operation, assign operational ownership, backup/restore and key custody; independent security/AI-policy review remains advisable and required before any real-money launch. This is a Studionet test release, not a mainnet or security certification.

## Build and operate

Use Node.js 24 and pnpm 11.19.0 from `frontend/`. Follow [Vercel setup](frontend/docs/VERCEL.md), [wallet authentication](frontend/docs/WALLET_AUTH.md), and [operations](frontend/docs/OPERATIONS.md). For Vercel Git import, use `frontend` as Root Directory. A GitHub push does not automatically redeploy this uploaded preview.
