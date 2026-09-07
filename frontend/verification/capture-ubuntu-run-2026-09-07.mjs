// Read authenticated CI metadata/logs; persist only selected test evidence, never credentials.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [commit, runId, output] = process.argv.slice(2);
assert.equal(process.argv.length, 5);
assert.match(commit, /^[0-9a-f]{40}$/);
assert.match(runId, /^[0-9]+$/);
assert.match(output, /^release-ubuntu-[a-z0-9-]+\.json$/);
const gh = process.env.RELEASE_GH ?? "gh";
const base = ["run", "view", runId, "--repo", "sanity456/commitment-pools"];
const invoke = (args) => execFileSync(gh, [...base, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const metadata = JSON.parse(invoke(["--json", "databaseId,headSha,status,conclusion,createdAt,startedAt,updatedAt,url,jobs"]));
assert.equal(metadata.headSha, commit);
assert.equal(metadata.status, "completed");
assert.equal(metadata.conclusion, "success");
assert.equal(metadata.jobs.length, 1);
assert.equal(metadata.jobs[0].name, "Full repository suite");
assert(metadata.jobs[0].steps.every((step) => step.status === "completed" && step.conclusion === "success"));
const log = invoke(["--log"]);
const lines = log.split(/\r?\n/).map((line) => {
  const [job, step, ...rest] = line.split("\t");
  return { job, step, text: rest.join("\t").replace(/^\uFEFF?\d{4}-\d\d-\d\dT\S+\s/, "").replace(/\x1b\[[0-9;]*m/g, "") };
});
const direct = lines.find((line) => line.step === "Lint submitted GenVM contracts and run every direct test" && /\d+ passed, \d+ deselected/.test(line.text));
assert(direct);
const [, directPassed, integrationDeselected] = direct.text.match(/(\d+) passed, (\d+) deselected/);
const appCount = (label) => {
  const found = lines.find((line) => line.step === "Run every frontend test" && new RegExp(`^.? ?${label} \\d+$`).test(line.text));
  assert(found, `Missing app count: ${label}`);
  return Number(found.text.match(/(\d+)$/)[1]);
};
const timestampCases = lines.filter((line) => line.step === "Prove formation, check-in and settlement boundaries from chain timestamps" && line.text.includes('{"asserted_expected_reasons":')).map((line) => JSON.parse(line.text.slice(line.text.indexOf("{"))));
assert.equal(timestampCases.length, 6);
assert.equal(new Set(timestampCases.map((item) => item.case)).size, 6);
assert(timestampCases.every((item) => item.scope === "direct-mode; network and model mocked; not human wallet evidence" && item.stored_chain_state && item.inputs && item.chain_timestamps && item.observed_payload && item.asserted_expected_reasons.length));
const sourceLines = lines.filter((line) => line.step === "Match deployed contract source to this checkout").map((line) => line.text);
const source = JSON.parse(sourceLines.slice(sourceLines.indexOf("{"), sourceLines.lastIndexOf("}") + 1).join("\n"));
assert.equal(source.product, "commitment-pools");
assert.equal(source.verified.length, 2);
assert.equal(appCount("fail"), 0);
assert(lines.some((line) => line.step === "Run v2/v3 consensus acceptance tests against isolated GLSim" && /2 passed/.test(line.text)));
const report = {
  product: "commitment-pools", capturedAtUtc: new Date().toISOString(),
  candidateCommit: commit, ci: metadata,
  counts: { directPassed: Number(directPassed), integrationDeselectedDuringDirect: Number(integrationDeselected), isolatedIntegrationPassed: 2, storedTimestampCases: timestampCases.length, appTests: appCount("tests"), appPassed: appCount("pass"), appFailed: appCount("fail") },
  timestampCases, deployedSourceVerification: source,
  logSha256: createHash("sha256").update(log).digest("hex"),
  verificationScriptSha256: createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"),
  limits: "Selected payloads copied from the exact successful Ubuntu run; metadata/log retrieval uses existing GitHub CLI authorization, not anonymous access. Six verbose timestamp cases are included in the 159 direct tests. The third deselected integration test is a separate opt-in legacy v2 live-value probe, not run here. Simulator/direct cases are not human or live network evidence. Raw logs are not republished.",
};
writeFileSync(new URL(output, import.meta.url), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ capturedAtUtc: report.capturedAtUtc, candidateCommit: commit, counts: report.counts, cases: timestampCases.map((item) => item.case) }, null, 2));
