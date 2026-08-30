# Commitment Pools — private v3 Studionet release

Updated: 2026-08-30

## Current release

Commitment Pools is a standalone, wallet-only Studionet product. Dispute Court remains a separate product and repository.

- Private preview: [Commitment Pools](https://commitment-pools-studionet-28cw6910t-sanity3.vercel.app)
- Core v3: `0x7279B4A7821c96489c0b086021F3E6944d343bFB`
- Evidence helper v3: `0xb21aa001F13B3c0f3940CC2352988D28b4E40f1D`
- Network: Studionet, chain ID `61999`
- Fee snapshot: 500 bps

The exact v3 source bytes, deployment execution, owner, fee, protocol version and helper linkage were verified against finalized Studionet data. Historical v2 source, manifests, protected deployment and records remain preserved for recovery; the v3 Neon namespace is isolated by product and core address.

Email/password pages, APIs, provider adapters and provider-session acceptance are removed. First-time and returning users authenticate by signing an origin-bound wallet message. Connecting a wallet alone does not authenticate it. Owner tools require a separate expiring owner-wallet proof.

The preview is protected by Vercel Authentication and is not anonymously accessible. No production alias or Sites deployment was changed by this release.

## End-to-end verification

The 2026-08-30 release pass completed successfully:

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

The exact hosted UI rendered without console errors or horizontal overflow, and correctly explained that a compatible injected wallet was unavailable. This machine's in-app browser has no Ethereum wallet extension, so a human extension-popup/signature run remains required. WalletConnect, mobile deep links and smart-contract wallets are not implemented or claimed.

Before evaluator access or real-money use, also complete the program-specific submission checklist, approve evaluator access to the private preview/source, run a two-person human trial, assign operational ownership and key custody, and obtain an independent security/AI-policy review. This is a Studionet test release, not a mainnet or security certification.

## Build and operate

Use Node.js 24 and pnpm 11.19.0 from `frontend/`. Follow [Vercel setup](frontend/docs/VERCEL.md), [wallet authentication](frontend/docs/WALLET_AUTH.md), and [operations](frontend/docs/OPERATIONS.md). For Vercel Git import, use `frontend` as Root Directory. A GitHub push does not automatically redeploy this uploaded preview.
