import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const registry = JSON.parse(readFileSync(resolve(process.argv[2] || "docs/agents/AGENT_REGISTRY.json"), "utf8"));
const queueCatalog = JSON.parse(readFileSync(resolve(process.argv[3] || "docs/agents/AGENT_QUEUE_CATALOG.json"), "utf8"));
const roleIds = new Set((registry.roles || []).map((role) => role.id));
const failures = [];
const requireCheck = (condition, message) => { if (!condition) failures.push(message); };
const forbiddenModes = new Set(["production_change", "external_write"]);
const requiredProhibitions = ["self_approval", "merge_or_push_main", "secret_value_access_or_disclosure", "payment_activation", "trade_or_order_execution", "fake_data_or_readiness", "required_gate_weakening"];
const requiredQueues = ["dependency-audit", "broken-link-audit", "sitemap-validation", "uptime-readiness-check", "stale-documentation-detection", "issue-triage", "analytics-report-generation", "blog-research", "blog-outline", "fact-checking", "instagram-draft", "x-threads-draft", "youtube-script", "newsletter-draft"];
const repairWorkflow = readFileSync(resolve(".github/workflows/repair-package-lock.yml"), "utf8");
const deployWorkflow = readFileSync(resolve(".github/workflows/deploy.yml"), "utf8");
const buildWorkflow = readFileSync(resolve(".github/workflows/build.yml"), "utf8");
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));

requireCheck(registry.humanFinalAuthority === "repository_owner", "repository owner must remain final authority");
requireCheck(registry.concurrency?.investigation === 12, "investigation concurrency must be 12");
requireCheck(registry.concurrency?.codeWriting === 4, "code-writing concurrency must be 4");
for (const key of ["sameSubsystem", "deployment", "databaseMigration", "externalPublishing", "productionChanging", "sameFile"]) {
  requireCheck(registry.concurrency?.[key] === 1, `${key} concurrency must be 1`);
}

for (const role of registry.roles || []) {
  const prefix = `${role.id} ${role.name}`;
  const permissions = role.permissions || {};
  requireCheck(Array.isArray(permissions.modes) && permissions.modes.includes("read_only"), `${prefix}: read-only mode missing`);
  requireCheck(!permissions.modes.some((mode) => forbiddenModes.has(mode)), `${prefix}: direct production/external mode forbidden`);
  requireCheck(Array.isArray(permissions.allowedPaths) && permissions.allowedPaths.length > 0, `${prefix}: allowed paths missing`);
  requireCheck(Array.isArray(permissions.forbiddenPaths) && permissions.forbiddenPaths.includes(".env*"), `${prefix}: secret-bearing paths not forbidden`);
  requireCheck(permissions.secretAccess === "none", `${prefix}: secret access must be none`);
  requireCheck(permissions.productionChange === "human_owner_only", `${prefix}: production authority must remain human-only`);
  requireCheck(permissions.externalPublication === "human_owner_only", `${prefix}: publication authority must remain human-only`);
  if (permissions.modes.includes("code_write")) requireCheck(permissions.isolatedWorktreeRequired === true, `${prefix}: code writer must require isolated worktree`);
  requireCheck(role.reviewerRoleId !== role.id, `${prefix}: self-review forbidden`);
  for (const prohibition of requiredProhibitions) requireCheck(role.prohibitedActions?.includes(prohibition), `${prefix}: missing prohibition ${prohibition}`);
}

requireCheck(queueCatalog.state === "TEST_MODE" && queueCatalog.globalKillSwitch === true, "queue catalog must be kill-switched test mode");
requireCheck(queueCatalog.queues?.length === requiredQueues.length, "queue catalog must contain all fourteen Wave 5/6 queues");
requireCheck(requiredQueues.every((slug) => queueCatalog.queues.some((queue) => queue.slug === slug)), "required maintenance/content queue missing");
for (const queue of queueCatalog.queues || []) {
  requireCheck(roleIds.has(queue.owner) && roleIds.has(queue.reviewer) && queue.owner !== queue.reviewer, `${queue.slug}: registered independent ownership required`);
  requireCheck(["read_only", "draft"].includes(queue.mode), `${queue.slug}: only read-only/draft mode allowed`);
  requireCheck(queue.active === false, `${queue.slug}: queue must remain inactive before external approval`);
  requireCheck(typeof queue.output === "string" && queue.output.length > 10, `${queue.slug}: explicit output required`);
}

requireCheck(!/contents:\s*write/.test(repairWorkflow), "lockfile repair workflow must be read-only");
requireCheck(!/git\s+push[^\n]*\bmain\b/.test(repairWorkflow), "workflow must never push main");
requireCheck(/node-version:\s*['\"]?22['\"]?/.test(repairWorkflow), "lockfile repair must use Node 22");
requireCheck(!/^\s{2}push:/m.test(deployWorkflow), "production deploy must not trigger automatically on push");
requireCheck(/^\s{2}workflow_dispatch:/m.test(deployWorkflow), "production deploy must require manual dispatch");
requireCheck(/environment:\s*production/.test(deployWorkflow), "production deploy must use protected production environment");
requireCheck(/cancel-in-progress:\s*false/.test(deployWorkflow), "production deployment concurrency must not cancel in-flight release");
requireCheck(!/continue-on-error:\s*true/.test(`${buildWorkflow}\n${deployWorkflow}`), "mandatory workflow gates cannot continue on error");
requireCheck(/pull_request:[\s\S]*?- agent\/homepage-full-3d-automation/.test(buildWorkflow), "Mission B stacked PR base must trigger complete build verification");
requireCheck(packageJson.scripts?.ci?.includes("npm run verify:agents"), "agent verification must run in CI");

if (failures.length) {
  console.error("AGENT PERMISSIONS VALIDATION FAILED");
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}
console.log("AGENT PERMISSIONS VALIDATION PASSED: least privilege, worktree isolation, concurrency, human gates, and prohibitions enforced.");
