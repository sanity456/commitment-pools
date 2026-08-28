import assert from "node:assert/strict";
import {
  accounts,
  read,
  write,
  log,
  evidence,
  payoutDelivery,
} from "./studionet-harness.mjs";
import { captureSource } from "./source-harness.mjs";
const id = "verified-source-" + Date.now().toString(36);
log("source_pool_started", { id });
await write(0, "create_pool", [
  id,
  "Verified-source sandbox lifecycle",
  "Public-page evidence integration fixture; not a real-world activity.",
  "This is a sandbox page-verification exercise. The only requirement is to provide https://example.com whose rendered text includes the title Example Domain and states that the domain is for use in documentation examples without needing permission. Pass if that public text is present. No physical activity is claimed.",
  "source_verified",
  1000n,
  1,
  2,
  2,
  900,
  3600,
]);
await write(0, "join", [id], 1000n);
await write(1, "join", [id], 1000n);
const source = await captureSource(0);
const formed = await read("get_pool", [id]);
log("waiting_for_source_pool_deadline", { id, deadline: formed.join_deadline });
while (Date.now() < Number(formed.join_deadline) * 1000 + 2000)
  await new Promise((resolve) => setTimeout(resolve, 10000));
await write(0, "activate_pool", [id]);
for (let who = 0; who < 2; who++) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await write(who, "submit_checkin", [
      id,
      "The public Example Domain page contains the agreed title and documentation-example sentence.",
      source.url,
      source.digest,
      crypto.randomUUID(),
    ]);
    const member = await read("get_participant", [id, accounts[who].address]);
    if (member.status === "success") break;
    assert.equal(
      member.status,
      "active",
      "Do not retry a definitive failed proof",
    );
  }
  const member = await read("get_participant", [id, accounts[who].address]);
  assert.equal(member.status, "success");
  const parts = member.last_attempt_id.split(":");
  const attempt = await read("get_attempt", [
    id,
    accounts[who].address,
    Number(parts.at(-2)),
    Number(parts.at(-1)),
  ]);
  assert.equal(attempt.observed_evidence_digest, source.digest);
}
assert.equal(await read("can_settle", [id]), true);
await write(0, "settle", [id]);
for (let who = 0; who < 2; who++) {
  assert.equal(
    (await read("get_credit", [accounts[who].address])).credit_wei,
    "1000",
  );
  const hash = await write(who, "withdraw");
  const children = await payoutDelivery(hash, accounts[who].address, 1000n);
  assert.equal(children.length, 1);
  assert.equal(children[0].delivered, true);
}
log("source_pool_passed", { id, transactions: evidence });
