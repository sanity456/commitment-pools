# Commitment Pools — public demo, private repository

Status: **the current demo is publicly accessible without Vercel sign-in; the GitHub repository remains private**.

## Approval and scope

The owner clarified that "private" referred to the GitHub repository during development, not the hosted demo. The owner then answered `yes` to removing the demo's Vercel sign-in restriction while leaving GitHub private. This approved public demo access only, not a GitHub visibility change, push, new build, contract transaction, paid service or Dispute Court change.

The hosting safeguards were applied by assigning only the already-built current version to the project's existing public domain. Vercel's [Standard Protection](https://vercel.com/docs/deployment-protection) leaves production domains public, and its [alias command](https://vercel.com/docs/cli/alias) can route a domain to an existing deployment. Project-wide protection was not disabled, so old generated previews remain protected.

## Verified change

- CLI identity: `sanity456`; scope: `sanity3`.
- Existing project: `commitment-pools-studionet`, `prj_ZoCSmpHDcVEDdBCK0Ojhi4FRY8mf`, team `team_kr7BHqYFRB4WJPSmgtQKznCz`.
- Existing verified project domain: `commitment-pools-studionet.vercel.app`. Before assignment it returned anonymous `404 DEPLOYMENT_NOT_FOUND`.
- Assigned that domain to the existing ready deployment `dpl_8sg1gVsskHqgtnyo2WQqcp8PEL9L`, `commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app`, using `vercel alias set` in scope `sanity3`.
- The alias command succeeded, and a subsequent alias listing independently showed the exact source-to-domain mapping. No deployment was rebuilt or promoted; the previously verified app source remains `363d79e1245725c57ec1c874f0b0675cf0dca1a6`.
- Public demo: [Commitment Pools](https://commitment-pools-studionet.vercel.app/).
- GitHub's configured local CLI reported `sanity456/commitment-pools`, `isPrivate: true`, `visibility: PRIVATE`, both before and after the alias change. The separate GitHub connector could not access the private repository (404); that response alone was not used to assert repository visibility.

## Anonymous verification

[Thirteen HTTP checks](public-demo-access-2026-09-07.json) passed at `2026-09-07T10:53:29.425Z`, using [a read-only verifier](check-public-demo-2026-09-07.mjs) without cookies, Vercel credentials or bypass headers:

- Root, wallet sign-in and the current pool's document route returned 200 without a Vercel redirect. Access to a page shell does not grant access to private pool/activity data.
- Fresh per-response script nonces, strict CSP and the existing defensive headers remained enforced, including with spoofed incoming nonce/policy headers.
- Anonymous wallet session state remained unauthenticated. Both private product session and Activity endpoints returned 401, with and without spoofed wallet/identity headers.
- Mascot and favicon bytes matched the current verified source exactly.
- The current generated wallet-test URL and the previous September preview both still returned anonymous 302 redirects to Vercel authentication.

A new Chrome tab opened the public domain and displayed the current Commitment Pools landing page, wallet sign-in and Studionet label. The public-domain app session was signed out, and the tab's error-log check returned no entries. The existing Wallet B human-test tab was left intact; no wallet prompt was opened or signed.

This closes the demo's public-access gate only. GitHub source, CI and private evidence still need public access and signed-out checks before the owner's later submission. The new public origin has not received a separate human wallet-signing trial in this access-only task. No full suite, dependency scan or independent security certification is claimed here. Historical private-preview reports remain unchanged.
