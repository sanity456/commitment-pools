// Anonymous HTTP only: no Vercel bypass, cookies, wallet, signature or writes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

// A new checkpoint must use a new filename; historical evidence is never replaced.
const reportName = process.argv[2] ?? "public-demo-access-2026-09-07.json";
assert(process.argv.length <= 3, "Specify at most one report filename");
assert.match(reportName, /^public-demo-access-[a-z0-9-]+\.json$/);

const origin = "https://commitment-pools-studionet.vercel.app";
const preview =
  "https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app";
const results = [];
async function get(url, headers = {}) {
  return fetch(url, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(25000),
  });
}
const nonces = new Set();
for (const path of [
  "/",
  "/",
  "/auth/sign-in",
  "/pools/human-consent-2r-20260907-093128",
]) {
  const response = await get(origin + path, {
    "x-nonce": "attacker-controlled",
    "content-security-policy": "script-src *",
  });
  assert.equal(response.status, 200, `Public document unavailable: ${path}`);
  assert.equal(response.headers.get("location"), null);
  const policy = response.headers.get("content-security-policy") ?? "";
  const scripts =
    policy.split(";").find((entry) => entry.trim().startsWith("script-src ")) ??
    "";
  const nonce = scripts.match(/'nonce-([A-Za-z0-9+/]{32})'/)?.[1];
  assert(nonce && !nonces.has(nonce), "Missing or reused response nonce");
  nonces.add(nonce);
  assert(scripts.includes("'strict-dynamic'"));
  assert(
    !scripts.includes("unsafe-inline") && !scripts.includes("unsafe-eval"),
  );
  assert(
    policy.includes("frame-ancestors 'none'") &&
      policy.includes("object-src 'none'"),
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert(response.headers.get("permissions-policy")?.includes("camera=()"));
  assert(response.headers.get("cache-control")?.includes("no-store"));
  const html = await response.text();
  assert(html.includes("Commitment Pools"));
  assert(html.includes("emperor-vortex.png"));
  assert(!/<input[^>]+type=["'](?:email|password)["']/i.test(html));
  const executable = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map((match) => match[1])
    .filter(
      (attributes) =>
        !/type=["'](?:application\/(?:ld\+json|json)|text\/plain)["']/i.test(
          attributes,
        ),
    );
  assert(executable.length > 0);
  for (const attributes of executable)
    assert(attributes.includes(`nonce="${nonce}"`));
  results.push({
    check: "anonymous public document with preserved security headers",
    path,
    status: 200,
    nonceFresh: true,
    scriptNoncesMatch: true,
  });
}
const sessionResponse = await get(origin + "/api/auth/session");
assert.equal(sessionResponse.status, 200);
assert.equal((await sessionResponse.json()).authenticated, false);
results.push({
  check: "public access does not create a wallet session",
  status: 200,
  authenticated: false,
});
for (const path of ["/api/product/session", "/api/product/activity?offset=0"]) {
  for (const spoof of [false, true]) {
    const response = await get(
      origin + path,
      spoof
        ? {
            "oai-authenticated-user-id": "forged",
            "x-product-wallet": "0xab99c741494bef91fae66144dda31be93180bad4",
          }
        : {},
    );
    assert.equal(
      response.status,
      401,
      `Anonymous private API exposure: ${path}`,
    );
    await response.arrayBuffer();
    results.push({
      check: "wallet authorization required for private API",
      path,
      spoofedHeaders: spoof,
      status: 401,
    });
  }
}
for (const path of ["/brand/emperor-vortex.png", "/favicon.svg"]) {
  const response = await get(origin + path);
  assert.equal(response.status, 200);
  const bytes = Buffer.from(await response.arrayBuffer());
  const expected = readFileSync(new URL("../public" + path, import.meta.url));
  assert.deepEqual(
    bytes,
    expected,
    "Public alias brand asset differs from verified source",
  );
  results.push({
    check: "exact current brand asset",
    path,
    status: 200,
    byteCount: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
for (const protectedOrigin of [
  preview,
  "https://commitment-pools-studionet-28cvvvtta-sanity3.vercel.app",
]) {
  const response = await get(protectedOrigin);
  assert([302, 303, 307, 308, 401, 403].includes(response.status));
  let destination = null;
  if (response.status < 400) {
    const redirect = new URL(response.headers.get("location"), protectedOrigin);
    assert.equal(redirect.hostname, "vercel.com");
    assert.match(redirect.pathname, /^\/(?:sso-api|login|auth)(?:\/|$)/);
    destination = redirect.origin + redirect.pathname;
  }
  await response.arrayBuffer();
  results.push({
    check: "generated preview remains protected",
    origin: protectedOrigin,
    status: response.status,
    redirectWithoutQuery: destination,
  });
}
const report = {
  product: "commitment-pools",
  passed: true,
  verifiedAtUtc: new Date().toISOString(),
  origin,
  deploymentId: "dpl_8sg1gVsskHqgtnyo2WQqcp8PEL9L",
  deployedSourceCommit: "363d79e1245725c57ec1c874f0b0675cf0dca1a6",
  transport:
    "Independent anonymous fetch, without cookies, Vercel credentials or bypass headers",
  results,
  limits:
    "Scoped access and HTTP checks, not a new full suite, wallet signing flow, public CI pass or independent security certification. Existing wallet-test origin and historical checkpoints are preserved.",
};
writeFileSync(
  new URL(reportName, import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify(report, null, 2));
