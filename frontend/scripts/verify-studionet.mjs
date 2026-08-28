import assert from "node:assert/strict";
import {
  accounts,
  read,
  write,
  log,
  evidence,
  payoutDelivery,
} from "./studionet-harness.mjs";
const id = "lifecycle-" + Date.now().toString(36);
log("pool_lifecycle_started", { id });
await write(0, "create_pool", [
  id,
  "Studionet two-person lifecycle check",
  "Automated sandbox integration test; no real-world commitment.",
  "This is a sandbox verification test. Pass if the submitted statement contains the phrase completed the focus block. Otherwise fail. No real-world activity is claimed.",
  "self_attested",
  1000n,
  1,
  2,
  2,
  1200,
  3600,
]);
await write(0, "join", [id], 1000n);
await write(1, "join", [id], 1000n);
let pool = await read("get_pool", [id]);
assert.equal(pool.participant_count, 2);
log("waiting_for_formation_deadline", { id, joinDeadline: pool.join_deadline });
while (Date.now() < Number(pool.join_deadline) * 1000 + 2000)
  await new Promise((resolve) => setTimeout(resolve, 10000));
await write(0, "activate_pool", [id]);
assert.equal((await read("get_pool", [id])).status, "active");
for (let index = 0; index < 2; index++) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await write(index, "submit_checkin", [
      id,
      "For this sandbox verification test: completed the focus block.",
      "",
      "",
      crypto.randomUUID(),
    ]);
    const participant = await read("get_participant", [
      id,
      accounts[index].address,
    ]);
    if (participant.status === "success") break;
    assert.equal(
      participant.status,
      "active",
      "A definitive fail is not silently retried",
    );
  }
  assert.equal(
    (await read("get_participant", [id, accounts[index].address])).status,
    "success",
  );
}
assert.equal(await read("can_settle", [id]), true);
await write(0, "settle", [id]);
pool = await read("get_pool", [id]);
assert.equal(pool.status, "settled");
assert.equal(pool.winner_count, 2);
for (let index = 0; index < 2; index++) {
  assert.equal(
    (await read("get_credit", [accounts[index].address])).credit_wei,
    "1000",
  );
  const hash = await write(index, "withdraw");
  assert.equal(
    (await read("get_credit", [accounts[index].address])).credit_wei,
    "0",
  );
  await payoutDelivery(hash, accounts[index].address, 1000n);
}
log("pool_lifecycle_passed", { id, transactions: evidence });
