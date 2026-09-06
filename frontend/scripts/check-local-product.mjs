import assert from "node:assert/strict";
import { runHostedWalletChecks } from "../tests/hosted-wallet-checks.mjs";

// Uses a fresh synthetic wallet only for login-message signatures. No chain
// transaction, imported receipt, support ticket, or user preference is written.
const input = process.env.LOCAL_PRODUCT_ORIGIN;
assert.ok(
  input,
  "Set LOCAL_PRODUCT_ORIGIN to this product's loopback preview.",
);
const origin = new URL(input);
assert.ok(
  origin.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(origin.hostname) &&
    origin.port &&
    !origin.username &&
    !origin.password &&
    origin.pathname === "/" &&
    !origin.search &&
    !origin.hash,
  "Use an explicit http://localhost:<port> or http://127.0.0.1:<port> origin, without credentials or a path.",
);
console.log(
  JSON.stringify(await runHostedWalletChecks(origin.origin), null, 2),
);
