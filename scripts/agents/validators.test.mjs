import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import test from "node:test";

const root = process.cwd();
const temp = mkdtempSync(join(tmpdir(), "stockpro-agent-validators-"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const writeJson = (name, value) => {
  const path = join(temp, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return path;
};
const run = (script, args = []) => spawnSync(process.execPath, [resolve(root, script), ...args], { cwd: root, encoding: "utf8" });
const expectPass = (result, label) => assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
const expectFail = (result, label) => assert.notEqual(result.status, 0, `${label} unexpectedly passed`);
const scopeHash = (task) => `sha256:${createHash("sha256").update(JSON.stringify({
  task_id: task.task_id,
  mode: task.mode,
  allowed_paths: [...task.allowed_paths].sort(),
  commit: task.expected_commit,
  environment: task.approval_environment,
  action: task.approval_action,
})).digest("hex")}`;

test.after(() => rmSync(temp, { recursive: true, force: true }));

test("canonical generated registry is drift free and all positive validators pass", () => {
  const generated = join(temp, "generated-registry.json");
  expectPass(run("scripts/agents/generate-agent-registry.mjs", [generated]), "registry generation");
  assert.deepEqual(JSON.parse(readFileSync(generated, "utf8")), readJson("docs/agents/AGENT_REGISTRY.json"));
  expectPass(run("scripts/agents/validate-agent-registry.mjs"), "registry validator");
  expectPass(run("scripts/agents/validate-agent-permissions.mjs"), "permissions validator");
  expectPass(run("scripts/agents/validate-agent-task.mjs"), "task validator");
});

test("registry validator rejects missing role, duplicate ID, and self-review", () => {
  const base = readJson("docs/agents/AGENT_REGISTRY.json");
  const missing = structuredClone(base);
  missing.roles.pop();
  expectFail(run("scripts/agents/validate-agent-registry.mjs", [writeJson("missing-role.json", missing)]), "missing role");
  const duplicate = structuredClone(base);
  duplicate.roles[1].id = duplicate.roles[0].id;
  expectFail(run("scripts/agents/validate-agent-registry.mjs", [writeJson("duplicate-role.json", duplicate)]), "duplicate ID");
  const selfReview = structuredClone(base);
  selfReview.roles[10].reviewerRoleId = selfReview.roles[10].id;
  expectFail(run("scripts/agents/validate-agent-registry.mjs", [writeJson("self-review.json", selfReview)]), "self review");
});

test("permission validator rejects direct external authority and missing safety prohibition", () => {
  const base = readJson("docs/agents/AGENT_REGISTRY.json");
  const external = structuredClone(base);
  external.roles[0].permissions.modes.push("external_write");
  expectFail(run("scripts/agents/validate-agent-permissions.mjs", [writeJson("external-mode.json", external)]), "external authority");
  const trade = structuredClone(base);
  trade.roles[0].prohibitedActions = trade.roles[0].prohibitedActions.filter((item) => item !== "trade_or_order_execution");
  expectFail(run("scripts/agents/validate-agent-permissions.mjs", [writeJson("trade-prohibition.json", trade)]), "trade prohibition");
});

test("task validator rejects missing tests, rollback, unsafe paths, and absent production approval", () => {
  const base = readJson("docs/agents/AGENT_TASK_QUEUE.json");
  const approvals = resolve(root, "docs/agents/AGENT_APPROVALS.json");
  const missing = structuredClone(base);
  missing.tasks[0].acceptance_tests = [];
  missing.tasks[0].rollback = "";
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("missing-task-evidence.json", missing), approvals]), "missing task evidence");
  const unsafe = structuredClone(base);
  unsafe.tasks[2].allowed_paths = ["../outside"];
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("unsafe-path.json", unsafe), approvals]), "unsafe path");
  const production = structuredClone(base);
  const task = production.tasks.find((item) => item.task_id === "SP-AGENT-2026-007");
  task.status = "active";
  task.subsystem = "external-publication";
  task.expected_commit = "a".repeat(40);
  task.approval_environment = "github";
  task.approval_action = "create_draft_pull_request";
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("no-production-approval.json", production), approvals]), "missing approval record");
  const expiredLedger = { records: [{ task_id: task.task_id, decision: "approved", revoked: false, scope_hash: scopeHash(task), commit: task.expected_commit, environment: task.approval_environment, action: task.approval_action, human_approver_reference: "github-user:owner", approved_at: "2025-01-01T00:00:00Z", expires_at: "2025-01-02T00:00:00Z", rollback_owner: "069" }] };
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("expired-approval-task.json", production), writeJson("expired-approval.json", expiredLedger)]), "expired approval");
  const mismatchedLedger = structuredClone(expiredLedger);
  mismatchedLedger.records[0].approved_at = "2026-07-22T00:00:00Z";
  mismatchedLedger.records[0].expires_at = "2099-01-01T00:00:00Z";
  mismatchedLedger.records[0].commit = "b".repeat(40);
  mismatchedLedger.records[0].scope_hash = "sha256:" + "0".repeat(64);
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("mismatched-approval-task.json", production), writeJson("mismatched-approval.json", mismatchedLedger)]), "mismatched approval scope");
});

test("task validator enforces role path caps and concrete high-risk review evidence", () => {
  const base = readJson("docs/agents/AGENT_TASK_QUEUE.json");
  const approvals = resolve(root, "docs/agents/AGENT_APPROVALS.json");
  const capEscape = structuredClone(base);
  capEscape.tasks[4].allowed_paths.push("src/**");
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("role-cap-escape.json", capEscape), approvals]), "role path cap escape");
  const unbounded = structuredClone(base);
  unbounded.tasks[0].allowed_paths = ["."];
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("unbounded-root.json", unbounded), approvals]), "unbounded root lease");
  const missingReview = structuredClone(base);
  delete missingReview.tasks[1].review_evidence;
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("missing-review-evidence.json", missingReview), approvals]), "missing review evidence");
});

test("task validator rejects overlapping subsystem/path leases and writer overflow", () => {
  const base = readJson("docs/agents/AGENT_TASK_QUEUE.json");
  const approvals = resolve(root, "docs/agents/AGENT_APPROVALS.json");
  const overlap = structuredClone(base);
  overlap.tasks[1].status = "active";
  overlap.tasks.push({ ...structuredClone(overlap.tasks[1]), task_id: "SP-AGENT-2026-008", owner_agent: "062", reviewer_agent: "041" });
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("overlap.json", overlap), approvals]), "overlap");
  const overflow = structuredClone(base);
  overflow.tasks[1].status = "active";
  for (let index = 0; index < 4; index += 1) {
    overflow.tasks.push({ ...structuredClone(overflow.tasks[1]), task_id: `SP-AGENT-2026-${String(8 + index).padStart(3, "0")}`, owner_agent: "062", reviewer_agent: "041", allowed_paths: [`tmp/agent-${index}`], subsystem: `agent-${index}` });
  }
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("writer-overflow.json", overflow), approvals]), "writer overflow");
});

test("task validator rejects thirteen simultaneous investigations", () => {
  const base = readJson("docs/agents/AGENT_TASK_QUEUE.json");
  base.tasks[1].status = "queued";
  for (let index = 0; index < 13; index += 1) {
    base.tasks.push({ ...structuredClone(base.tasks[0]), task_id: `SP-AGENT-2026-${String(20 + index).padStart(3, "0")}`, status: "active", subsystem: `audit-${index}` });
  }
  expectFail(run("scripts/agents/validate-agent-task.mjs", [writeJson("investigation-overflow.json", base), resolve(root, "docs/agents/AGENT_APPROVALS.json")]), "investigation overflow");
});
