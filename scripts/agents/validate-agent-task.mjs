import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const queuePath = resolve(process.argv[2] || "docs/agents/AGENT_TASK_QUEUE.json");
const registry = JSON.parse(readFileSync(resolve(process.argv[4] || "docs/agents/AGENT_REGISTRY.json"), "utf8"));
const approvalLedger = JSON.parse(readFileSync(resolve(process.argv[3] || "docs/agents/AGENT_APPROVALS.json"), "utf8"));
const payload = JSON.parse(readFileSync(queuePath, "utf8"));
const tasks = Array.isArray(payload) ? payload : payload.tasks;
const roleIds = new Set(registry.roles.map((role) => role.id));
const rolesById = new Map(registry.roles.map((role) => [role.id, role]));
const failures = [];
const requiredKeys = ["task_id", "title", "mission", "department", "owner_agent", "reviewer_agent", "risk", "mode", "allowed_paths", "forbidden_paths", "dependencies", "acceptance_tests", "rollback", "human_approval_required", "status"];
const allowedRisk = new Set(["low", "medium", "high", "critical"]);
const allowedMode = new Set(["read_only", "draft", "code_write", "external_write", "production_change"]);
const allowedStatus = new Set(["queued", "active", "blocked", "review", "complete", "rejected"]);
const protectedPatterns = [".github/workflows/", "src/_worker.js", "wrangler.toml", "supabase/", "automation/n8n/", "payment", "broker"];
const normalizePath = (value) => {
  if (typeof value !== "string" || !value.trim()) throw new Error("empty path");
  const slash = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (slash === "." || slash === "**" || slash === "**/*") throw new Error(`unbounded root path ${value}`);
  if (/^[A-Za-z]:\//.test(slash) || slash.startsWith("/") || slash.split("/").includes("..")) throw new Error(`unsafe path ${value}`);
  return slash.replace(/\/\*\*?$/, "").replace(/\/$/, "");
};
const intersects = (left, right) => left.some((leftPath) => right.some((rightPath) => {
  const a = normalizePath(leftPath);
  const b = normalizePath(rightPath);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}));
const pathIsWithinCap = (taskPath, capPath) => {
  const taskBase = normalizePath(taskPath);
  const capBase = normalizePath(capPath);
  return taskBase === capBase || taskBase.startsWith(`${capBase}/`);
};
const approvalScopeHash = (task) => `sha256:${createHash("sha256").update(JSON.stringify({
  task_id: task.task_id,
  mode: task.mode,
  allowed_paths: [...task.allowed_paths].map(normalizePath).sort(),
  commit: task.expected_commit,
  environment: task.approval_environment,
  action: task.approval_action,
})).digest("hex")}`;
const validIso = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const approvalsByTask = new Map((approvalLedger.records || []).filter((record) => record.decision === "approved" && record.revoked !== true).map((record) => [record.task_id, record]));

if (!Array.isArray(tasks)) failures.push("task queue must contain a tasks array");
const taskIds = new Set((tasks || []).map((task) => task.task_id));
if (taskIds.size !== (tasks || []).length) failures.push("task IDs must be unique");
for (const task of tasks || []) {
  const prefix = task.task_id || "unknown-task";
  for (const key of requiredKeys) if (!(key in task)) failures.push(`${prefix}: missing ${key}`);
  if (!/^SP-AGENT-\d{4}-\d{3}$/.test(task.task_id || "")) failures.push(`${prefix}: invalid task ID`);
  if (!roleIds.has(task.owner_agent)) failures.push(`${prefix}: owner role missing`);
  if (!roleIds.has(task.reviewer_agent) || task.reviewer_agent === task.owner_agent) failures.push(`${prefix}: independent reviewer invalid`);
  if (!allowedRisk.has(task.risk)) failures.push(`${prefix}: invalid risk`);
  if (!allowedMode.has(task.mode)) failures.push(`${prefix}: invalid mode`);
  if (!allowedStatus.has(task.status)) failures.push(`${prefix}: invalid status`);
  if (!Array.isArray(task.allowed_paths) || task.allowed_paths.length === 0) failures.push(`${prefix}: allowed paths missing`);
  else for (const path of task.allowed_paths) { try { normalizePath(path); } catch (error) { failures.push(`${prefix}: ${error.message}`); } }
  const ownerRole = rolesById.get(task.owner_agent);
  if (["read_only", "draft", "code_write"].includes(task.mode) && ownerRole && Array.isArray(task.allowed_paths)) {
    for (const path of task.allowed_paths) {
      try {
        if (!ownerRole.permissions.allowedPaths.some((cap) => pathIsWithinCap(path, cap))) failures.push(`${prefix}: allowed path ${path} exceeds owner ${task.owner_agent} registry caps`);
      } catch {
        // Path normalization reports the authoritative error above.
      }
    }
  }
  if (!Array.isArray(task.forbidden_paths) || task.forbidden_paths.length === 0) failures.push(`${prefix}: forbidden paths missing`);
  if (!Array.isArray(task.acceptance_tests) || task.acceptance_tests.length === 0) failures.push(`${prefix}: acceptance tests missing`);
  if (typeof task.rollback !== "string" || task.rollback.length < 10) failures.push(`${prefix}: rollback missing`);
  if (["external_write", "production_change"].includes(task.mode) && task.human_approval_required !== true) failures.push(`${prefix}: external/production task requires human approval`);
  if (["active", "review", "complete"].includes(task.status) && ["read_only", "draft", "code_write"].includes(task.mode) && !rolesById.get(task.owner_agent)?.permissions?.modes?.includes(task.mode)) failures.push(`${prefix}: owner role does not permit mode`);
  if (["active", "review", "complete"].includes(task.status) && ["external_write", "production_change"].includes(task.mode)) {
    const approval = approvalsByTask.get(task.task_id);
    const expectedCommitValid = /^[0-9a-f]{40}$/.test(task.expected_commit || "");
    if (!expectedCommitValid || typeof task.approval_environment !== "string" || !task.approval_environment || typeof task.approval_action !== "string" || !task.approval_action) failures.push(`${prefix}: exact approval scope fields missing or invalid`);
    if (!approval || !approval.scope_hash || !approval.commit || !approval.environment || !approval.action || !approval.human_approver_reference || !approval.approved_at || !approval.expires_at || !approval.rollback_owner) failures.push(`${prefix}: scoped approval ledger record missing or incomplete`);
    else {
      if (expectedCommitValid && approval.commit !== task.expected_commit) failures.push(`${prefix}: approval commit does not match task`);
      if (approval.environment !== task.approval_environment || approval.action !== task.approval_action) failures.push(`${prefix}: approval action/environment does not match task`);
      if (expectedCommitValid && approval.scope_hash !== approvalScopeHash(task)) failures.push(`${prefix}: approval scope hash is invalid`);
      if (!validIso(approval.approved_at) || !validIso(approval.expires_at)) failures.push(`${prefix}: approval timestamps are invalid`);
      else if (Date.parse(approval.approved_at) > Date.now() || Date.parse(approval.expires_at) <= Date.now() || Date.parse(approval.expires_at) <= Date.parse(approval.approved_at)) failures.push(`${prefix}: approval is not currently valid and unexpired`);
      if (!/^[a-z][a-z0-9_-]*:[A-Za-z0-9_.-]{2,}$/.test(approval.human_approver_reference)) failures.push(`${prefix}: human approver reference format invalid`);
      if (!roleIds.has(approval.rollback_owner)) failures.push(`${prefix}: rollback owner must be a registered role`);
    }
  }
  if (["high", "critical"].includes(task.risk) && ["active", "review", "complete"].includes(task.status) && (!task.security_review_required || !task.qa_review_required)) failures.push(`${prefix}: high/critical task requires Security and QA review`);
  if (["high", "critical"].includes(task.risk) && task.status === "complete") {
    for (const [reviewType, departmentId] of [["security", "D05"], ["qa", "D06"]]) {
      const evidence = task.review_evidence?.[reviewType];
      const reviewer = rolesById.get(evidence?.reviewer_agent);
      if (!evidence || evidence.result !== "passed" || !reviewer || reviewer.departmentId !== departmentId || evidence.reviewer_agent === task.owner_agent || !Array.isArray(evidence.evidence) || evidence.evidence.length === 0 || evidence.evidence.some((item) => typeof item !== "string" || !item.trim())) failures.push(`${prefix}: concrete ${reviewType} review evidence is missing or invalid`);
    }
  }
  if (task.mode !== "read_only" && task.allowed_paths.some((path) => /payment|trade|order-execution/i.test(path)) && !["high", "critical"].includes(task.risk)) failures.push(`${prefix}: protected payment/trade work requires high/critical classification`);
  if (task.status === "active" && task.mode === "code_write" && (!task.worktree || !task.branch || task.branch === "main")) failures.push(`${prefix}: active code task requires isolated non-main branch/worktree`);
  if (task.status === "active" && !task.subsystem) failures.push(`${prefix}: active task requires subsystem lease key`);
  if (task.status === "active" && task.allowed_paths.some((path) => protectedPatterns.some((pattern) => path.includes(pattern))) && !task.security_review_required) failures.push(`${prefix}: protected active task requires security review`);
  for (const dependency of task.dependencies || []) {
    if (!taskIds.has(dependency) || dependency === task.task_id) failures.push(`${prefix}: invalid dependency ${dependency}`);
    if (["active", "review", "complete"].includes(task.status) && (tasks || []).find((item) => item.task_id === dependency)?.status !== "complete") failures.push(`${prefix}: dependency ${dependency} is not complete`);
  }
}

const visiting = new Set();
const visited = new Set();
const visit = (taskId) => {
  if (visiting.has(taskId)) { failures.push(`dependency cycle at ${taskId}`); return; }
  if (visited.has(taskId)) return;
  visiting.add(taskId);
  const task = (tasks || []).find((item) => item.task_id === taskId);
  for (const dependency of task?.dependencies || []) if (taskIds.has(dependency)) visit(dependency);
  visiting.delete(taskId);
  visited.add(taskId);
};
for (const taskId of taskIds) visit(taskId);

const activeWriters = (tasks || []).filter((task) => task.status === "active" && task.mode === "code_write");
if (activeWriters.length > registry.concurrency.codeWriting) failures.push("active code writers exceed concurrency limit");
if ((tasks || []).filter((task) => task.status === "active" && task.mode === "read_only").length > registry.concurrency.investigation) failures.push("active investigations exceed concurrency limit");
const activeSubsystems = activeWriters.map((task) => task.subsystem);
if (new Set(activeSubsystems).size !== activeSubsystems.length) failures.push("active code writers overlap one subsystem");
for (let left = 0; left < activeWriters.length; left += 1) {
  for (let right = left + 1; right < activeWriters.length; right += 1) {
    if (intersects(activeWriters[left].allowed_paths, activeWriters[right].allowed_paths)) failures.push(`${activeWriters[left].task_id} and ${activeWriters[right].task_id}: overlapping active paths`);
  }
}

if (failures.length) {
  console.error("AGENT TASK VALIDATION FAILED");
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log(`AGENT TASK VALIDATION PASSED: ${(tasks || []).length} tasks; ownership, review, approvals, rollback, tests, and overlap controls valid.`);
