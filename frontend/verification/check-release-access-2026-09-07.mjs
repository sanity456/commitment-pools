// Read-only, signed-out HTTP evidence audit. No cookies, tokens or bypass headers.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [commit, runId, output] = process.argv.slice(2);
assert.equal(process.argv.length, 5);
assert.match(commit, /^[0-9a-f]{40}$/);
assert.match(runId, /^[0-9]+$/);
assert.match(output, /^release-access-[a-z0-9-]+\.json$/);
const repository = "https://github.com/sanity456/commitment-pools";
const git = process.env.RELEASE_GIT ?? "git";
const repo = fileURLToPath(new URL("../../", import.meta.url));
const tracked = execFileSync(git, ["ls-tree", "-r", "--name-only", commit], {
  cwd: repo,
  encoding: "utf8",
}).trim().split(/\r?\n/);
const required = [
  "STEWARD-RESPONSE.md", "HUMAN-WALLET-TEST.md", "SUBMISSION_CHECKLIST.md",
  "RELEASE_STATUS.md", ".github/workflows/ubuntu-clean-suite.yml",
  "tests/test_chain_timestamps_v3.py", "scripts/check_reproducibility.py",
  "requirements-dev.txt", "frontend/pnpm-lock.yaml", "frontend/package.json",
  "contracts/commitment_pool_v3.py", "contracts/evidence_capture_v3.py",
  "frontend/lib/deployment.json", "frontend/lib/evidence-deployment.json",
  "frontend/scripts/verify-security-release.mjs", "frontend/tests/human-evidence.test.mjs",
];
for (const path of required) assert(tracked.includes(path), `Missing release file: ${path}`);
const files = new Set([
  ...required,
  ...tracked.filter((path) => /^frontend\/verification\/(?:human-consent-2r-|verify-human-consent-2r-|wallet-environment-2026-09-07\.md|environment\/|public-demo-access-2026-09-07\.)/.test(path)),
]);
const links = [
  { kind: "repository", url: repository },
  { kind: "immutable checkout", url: `${repository}/tree/${commit}` },
  { kind: "CI run", url: `${repository}/actions/runs/${runId}` },
  ...[...files].sort().map((path) => ({
    kind: "immutable evidence/source", path,
    url: `${repository}/blob/${commit}/${path}`,
  })),
  { kind: "public demo", url: "https://commitment-pools-studionet.vercel.app/" },
  { kind: "public pool view", url: "https://commitment-pools-studionet.vercel.app/pools/human-consent-2r-20260907-093128" },
];
let next = 0;
const results = new Array(links.length);
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < links.length) {
    const index = next++;
    const link = links[index];
    try {
      const response = await fetch(link.url, {
        redirect: "manual", signal: AbortSignal.timeout(25000),
      });
      const location = response.headers.get("location");
      const destination = location ? new URL(location, link.url) : null;
      results[index] = {
        ...link, status: response.status,
        accessibleWithoutSignIn: response.status === 200,
        redirectWithoutQuery: destination ? destination.origin + destination.pathname : null,
      };
      await response.arrayBuffer();
    } catch (error) {
      results[index] = { ...link, status: null, accessibleWithoutSignIn: false, errorType: error.name };
    }
  }
}));
const report = {
  product: "commitment-pools", checkedAtUtc: new Date().toISOString(),
  candidateCommit: commit, runId, transport: "Anonymous GET; no credentials, cookies or bypass headers; redirects not followed",
  scope: "Every file in the enumerated current two-round evidence bundle, its verification scripts and environment images, release documents, core/helper source, dependency pins, chain-time tests, CI run, repository and public demo/pool. Historical linked reports outside this bundle require their own publication-time audit.",
  allEnumeratedLinksAccessible: results.every((row) => row.accessibleWithoutSignIn),
  totals: { checked: results.length, accessible: results.filter((row) => row.accessibleWithoutSignIn).length, inaccessible: results.filter((row) => !row.accessibleWithoutSignIn).length },
  verificationScriptSha256: createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"),
  results,
  limits: "HTTP reachability is not browser rendering or a wallet test. An anonymous GitHub 404 does not independently distinguish a private file from a nonexistent one; enumerated file existence is established separately by the exact local Git tree. This audit does not publish the repository and does not pass the public-evidence gate when any required link is inaccessible.",
};
writeFileSync(new URL(output, import.meta.url), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ checkedAtUtc: report.checkedAtUtc, candidateCommit: commit, allEnumeratedLinksAccessible: report.allEnumeratedLinksAccessible, totals: report.totals }, null, 2));
