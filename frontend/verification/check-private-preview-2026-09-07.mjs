import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Actual deployed HTTP responses through the authorized Vercel CLI transport.
// No browser cookies, application wallet session, signer or transaction is used.
const origin =
  "https://commitment-pools-studionet-ekkkup2y3-sanity3.vercel.app";
const deploymentId = "dpl_8sg1gVsskHqgtnyo2WQqcp8PEL9L";
const vercel = join(
  dirname(process.execPath),
  "node_modules/vercel/dist/index.js",
);
const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];

function ownerGet(path, extraHeaders = {}) {
  assert(path.startsWith("/") && !path.startsWith("//"));
  const args = [
    vercel,
    "curl",
    path,
    "--deployment",
    origin,
    "--scope",
    "sanity3",
    "--",
    "--silent",
    "--show-error",
    "--include",
    "--max-time",
    "40",
  ];
  for (const [key, value] of Object.entries(extraHeaders))
    args.push("--header", `${key}: ${value}`);
  const response = spawnSync(process.execPath, args, {
    cwd: frontend,
    timeout: 55000,
    maxBuffer: 5 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: "1" },
  });
  // Never print CLI credential diagnostics, cookies or full private responses.
  assert.equal(response.status, 0, `Authorized CLI GET failed: ${path}`);
  let bytes = response.stdout;
  let headers;
  let status;
  do {
    const end = bytes.indexOf("\r\n\r\n");
    assert(end > 0, "Missing HTTP response headers");
    const lines = bytes.subarray(0, end).toString("utf8").split("\r\n");
    status = Number(/^HTTP\/\S+ (\d{3})/.exec(lines.shift())?.[1]);
    assert(Number.isInteger(status), "Invalid HTTP status");
    headers = new Headers();
    for (const line of lines) {
      const separator = line.indexOf(":");
      if (separator > 0)
        headers.append(
          line.slice(0, separator),
          line.slice(separator + 1).trim(),
        );
    }
    bytes = bytes.subarray(end + 4);
  } while (bytes.subarray(0, 5).toString() === "HTTP/");
  return { status, headers, body: bytes };
}

for (const path of ["/", "/pools/human-wallet-60m-20260906-131207"]) {
  const response = await fetch(origin + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  assert(
    [302, 303, 307, 308, 401, 403].includes(response.status),
    "Preview became anonymously accessible",
  );
  let destination = null;
  if (response.status < 400) {
    const redirect = new URL(response.headers.get("location"), origin);
    assert.equal(redirect.hostname, "vercel.com");
    assert.match(redirect.pathname, /^\/(?:sso-api|login|auth)(?:\/|$)/);
    destination = redirect.origin + redirect.pathname;
  }
  results.push({
    check: "anonymous deployment protection",
    path,
    status: response.status,
    redirectWithoutQuery: destination,
  });
}

const nonces = new Set();
for (const path of ["/", "/", "/auth/sign-in"]) {
  const response = ownerGet(path, {
    "x-nonce": "attacker-controlled",
    "content-security-policy": "script-src *",
  });
  assert.equal(response.status, 200, `${path}: document unavailable`);
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
  const html = response.body.toString("utf8");
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
    assert(
      attributes.includes(`nonce="${nonce}"`),
      "Executable script missing the response nonce",
    );
  assert(!/<input[^>]+type=["'](?:email|password)["']/i.test(html));
  if (path === "/auth/sign-in") assert(/Sign in with wallet/i.test(html));
  assert(html.includes("emperor-vortex.png"), "Approved mascot is absent");
  results.push({
    check: "production document and wallet-only form",
    path,
    status: response.status,
    nonceFresh: true,
    executableScriptCount: executable.length,
    allScriptNoncesMatch: true,
    strictPolicy: true,
    mascotReferenced: true,
  });
}

const anonymousSession = ownerGet("/api/auth/session");
assert.equal(anonymousSession.status, 200);
assert.equal(
  JSON.parse(anonymousSession.body.toString("utf8")).authenticated,
  false,
);
results.push({
  check: "platform authentication does not create an app wallet session",
  status: 200,
  authenticated: false,
});
for (const path of ["/api/product/session", "/api/product/activity?offset=0"]) {
  for (const spoof of [false, true]) {
    const response = ownerGet(
      path,
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
      "Unauthenticated private product data was exposed",
    );
    results.push({
      check: "app wallet authorization enforced",
      path,
      spoofedHeaders: spoof,
      status: response.status,
    });
  }
}

for (const path of ["/brand/emperor-vortex.png", "/favicon.svg"]) {
  const response = ownerGet(path);
  assert.equal(response.status, 200);
  const expected = readFileSync(resolve(frontend, "public" + path));
  assert.deepEqual(
    response.body,
    expected,
    "Deployed brand bytes do not match the source",
  );
  results.push({
    check: "deployed brand asset",
    path,
    status: 200,
    byteCount: response.body.length,
    sha256: createHash("sha256").update(response.body).digest("hex"),
  });
}

const report = {
  product: "commitment-pools",
  observedAtUtc: new Date().toISOString(),
  origin,
  deploymentId,
  sourceCommit: "363d79e1245725c57ec1c874f0b0675cf0dca1a6",
  passed: true,
  transport:
    "Anonymous fetch for external protection; authorized Vercel CLI for deployed HTTP checks, without an application wallet session",
  noNewWalletOrTransaction: true,
  results,
  limits:
    "Not a new human wallet sign-in or a browser/mobile/consent lifecycle on this deployed origin. No full hosted synthetic-wallet suite or public CI was run here.",
};
const output = process.argv[2];
if (output)
  writeFileSync(resolve(output), JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
  });
console.log(JSON.stringify(report, null, 2));
