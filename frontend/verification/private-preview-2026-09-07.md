# Commitment Pools — protected UI preview release

Status: **deployed and verified within the scope below**. This is not full human acceptance, public submission or real-money readiness.

- Preview: [Commitment Pools](https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app/).
- Deployment: `dpl_8sg1gVsskHqgtnyo2WQqcp8PEL9L`; Vercel reports `READY`, completed at `2026-09-07T08:28:17.122Z`.
- Source: local commit `363d79e1245725c57ec1c874f0b0675cf0dca1a6`; Vercel's `sourceCommit` metadata matches. This commit was not pushed to GitHub by this release.
- Target: the existing `sanity3/commitment-pools-studionet` preview project. The CLI reports target `preview`; the deployment API represents its default/non-production target as `null`.
- Access: existing Vercel authentication protection retained; zero aliases attached to this deployment. No production domain, access policy, plan, database value, Sites deployment or Dispute Court resource was changed.

The owner approved this private-preview update after the local A history/export checkpoint. The approved black/royal-gold theme, cursive name-above-penguin logo, shorter UI copy and neutral zero-credit guide are included. No image was regenerated or contract/wallet execution changed in this release.

## Validation

The [preflight record](consent-regression-2026-09-07.md) preserves the complete **153-test** pass, including 32 new consent tests with 127 combined context changes, strict lint, formatting, both TypeScript configurations, both production builds and a fresh read-only deployed-source/configuration check. It also preserves the initial Windows cache failures, their recovery, the successful real closed-pool switching checks and their limits.

The [deployed HTTP report](private-preview-2026-09-07.json) passed at `2026-09-07T08:35:12.676Z`. Its [reproducible checker](check-private-preview-2026-09-07.mjs) performed only GET requests:

- Anonymous requests to both the root and completed-pool link returned `302` to Vercel's SSO endpoint. The report omits redirect query material.
- Authorized Vercel CLI requests to the deployed root twice and `/auth/sign-in` returned `200`. All three document responses used distinct strong nonces, matching every executable app script, with the strict production security headers. Supplied nonce/policy headers did not override the server policy.
- Vercel platform authorization did not create a product wallet session: `/api/auth/session` remained `authenticated: false`.
- Product session and Activity endpoints returned `401` both normally and with spoofed identity/wallet headers.
- The deployed mascot and favicon matched the exact local source bytes. Mascot SHA-256: `6c4a5507e3db1ab580a041c8fe55ef29a12b7a5a4489aa350375b7474e588a64`.

The CLI handled its own authorized deployment-protection transport. No browser session store, app login cookie, wallet key, synthetic wallet, signature or transaction was used by these probes. No protection secret or response cookie was written to evidence.

Before uploading, the dry-run inventory included the approved mascot and new consent tests and excluded local environment files other than `.env.example`, credentials, dependencies, generated build/cache directories, work files and local databases. The normal frozen-lockfile Vercel build completed remotely. Existing private GitHub visibility was independently confirmed; no GitHub push or Actions trigger occurred.

## Chrome review and remaining human work

The user's existing Chrome/Vercel access opened the new exact URL. The rendered home showed the approved black-and-gold design, cursive wordmark above the penguin/vortex, concise introduction, normal navigation and wallet-only signed-out directory. The screenshot is a visual check, not a full deployed mobile/accessibility audit. Numeric viewport measurements were unavailable from the automation provider and are not claimed.

The deployed `/auth/sign-in` page also rendered its wallet-only message, one sign-in button and the normal back link, without a credential form. The retained tab's diagnostics included an upstream `gen_call` HTML/JSON parsing error at `2026-09-07T08:34:50.715Z` with a development Webpack stack during the local-to-deployed transition. Attribution of that retained diagnostic to the new origin was not established; this is not described as an empty-console run. The independent deployed document and access probes above passed.

The app was signed out on this new origin. No new wallet-login prompt or transaction was initiated. The earlier authenticated local zero-credit/history/export and closed-pool switching checks remain valid for their original scope, but are not relabeled as authenticated checks on this new deployed origin.

Chrome's internal About page was blocked by browser policy when the owner asked for automatic version retrieval. MetaMask's own screens remain outside the permitted automation surface. No alternate browser, profile-file inspection, raw browser command or OS workaround was used. Exact browser/extension versions remain unverified pending screenshots or version text from the owner.

For the owner: open Chrome's menu → Help → About Google Chrome ([official instructions](https://support.google.com/chrome/answer/95414?co=GENIE.Platform%3DDesktop&hl=en)); in MetaMask open Settings → About ([official instructions](https://support.metamask.io/configure/wallet/how-to-update-the-version-of-metamask)). Record the displayed versions before any update/relaunch, and share only those About pages, never recovery phrases or private keys.

Still incomplete: a new-origin authenticated human check; live checked-consent/round-transition combinations; exact versions; any separately approved successful retry after cancellation; live early-activation rejection and all-fail branches; and the complete pinned Ubuntu/public-review/submission gates when the owner decides to submit. Automated coverage is not claimed as human observation. No new on-chain transaction was sent.

## Teardown

The temporary local development server on port 4195 was stopped after verification. The new protected Vercel preview remains available, and its Chrome tab was retained for the owner. This post-deployment record is documentation only; it does not change the deployed app source commit above.
