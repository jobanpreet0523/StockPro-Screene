import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];
const verbose = process.argv.includes("--verbose");
let assertionCount = 0;
const pass = (message) => {
  assertionCount += 1;
  if (verbose) console.log("PASS", message);
};
const fail = (message) => failures.push(message);
const requireCondition = (condition, message) => condition ? pass(message) : fail(message);
const read = (path) => readFileSync(resolve(root, path), "utf8");
const parse = (path) => JSON.parse(read(path));
const requiredDocs = [
  "automation/n8n/README.md",
  "automation/n8n/docker-compose.example.yml",
  "automation/n8n/env.example",
  "automation/n8n/security/EGRESS_POLICY.md",
  "automation/n8n/security/INGRESS_CONTRACT.md",
  "automation/n8n/security/REDACTION_POLICY.md",
  "automation/n8n/security/THREAT_MODEL.md",
  "automation/n8n/security/event-envelope.schema.json",
  "automation/n8n/security/ingress-security.mjs",
  "automation/n8n/security/ingress-security.test.mjs",
  "docs/automation/N8N_ARCHITECTURE.md",
  "docs/automation/N8N_DEPLOYMENT.md",
  "docs/automation/N8N_SECURITY.md",
  "docs/automation/N8N_ROLLBACK.md",
];
const forbiddenNodeTypes = [
  "n8n-nodes-base.executeCommand",
  "n8n-nodes-base.ssh",
  "n8n-nodes-base.readWriteFile",
  "n8n-nodes-base.localFileTrigger",
  "n8n-nodes-base.code",
  "n8n-nodes-base.function",
  "n8n-nodes-base.functionItem",
];
const requiredNames = [
  "Global Kill Switch Gate",
  "Global Automation Enabled Gate",
  "Workflow Enabled Gate",
  "Test Mode Gate",
  "Minimize Allowlisted Input",
  "Primary Fixed Adapter Action",
  "Success Audit Event",
  "Failure Audit Event",
  "Encrypted Dead Letter",
  "Test Mode Audit Event",
  "Disabled Audit Event",
  "No Business Side Effect in Test Mode",
];
const requiredRunbookSections = [
  "## Purpose and permitted actions",
  "## Input, privacy, and prompt-injection contract",
  "## External provisioning",
  "## Activation approval",
  "## Test mode, retry, failure, and dead-letter tests",
  "## Disable, escalation, and incident shutdown",
];

for (const path of requiredDocs) requireCondition(existsSync(resolve(root, path)), "required artifact exists: " + path);
const specs = parse("automation/n8n/workflow-specs.json");
requireCondition(Array.isArray(specs) && specs.length === 11, "exactly eleven workflow specifications");
const expected = new Set(specs.map((spec) => spec.slug));
requireCondition(expected.size === 11, "workflow slugs are unique");
const workflowFiles = readdirSync(resolve(root, "automation/n8n/workflows")).filter((name) => name.endsWith(".json")).sort();
const runbookFiles = readdirSync(resolve(root, "automation/n8n/runbooks")).filter((name) => name.endsWith(".md")).sort();
requireCondition(workflowFiles.length === 11, "exactly eleven workflow exports");
requireCondition(runbookFiles.length === 11, "exactly eleven workflow runbooks");
requireCondition(workflowFiles.every((name) => expected.has(name.slice(0, -5))), "no unexpected workflow export");
requireCondition(runbookFiles.every((name) => expected.has(name.slice(0, -3))), "no unexpected workflow runbook");

const compose = read("automation/n8n/docker-compose.example.yml");
requireCondition(compose.includes("127.0.0.1:5678:5678"), "editor/runtime binds to loopback only");
requireCondition(compose.includes("internal: true"), "automation network is internal");
for (const type of forbiddenNodeTypes) requireCondition(compose.includes(type), "compose excludes node: " + type);
const envExample = read("automation/n8n/env.example");
requireCondition(envExample.includes("STOCKPRO_AUTOMATION_ENABLED=false"), "global enable defaults false");
requireCondition(envExample.includes("STOCKPRO_AUTOMATION_TEST_MODE=true"), "test mode defaults true");
requireCondition(envExample.includes("STOCKPRO_AUTOMATION_KILL_SWITCH=true"), "kill switch defaults true");
requireCondition(!/(ghp_|github_pat_|sk_live_|sk_test_|xox[baprs]-|eyJ[A-Za-z0-9_-]{20,}\.)/.test(envExample), "env example contains no recognizable token");

for (const spec of specs) {
  const path = "automation/n8n/workflows/" + spec.slug + ".json";
  const runbookPath = "automation/n8n/runbooks/" + spec.slug + ".md";
  const data = parse(path);
  const contract = data.stockproContract || {};
  const names = new Set(data.nodes.map((node) => node.name));
  const byName = (name) => data.nodes.find((node) => node.name === name);
  const targets = (name, output) => data.connections[name]?.main?.[output]?.map((entry) => entry.node) || [];
  const prefix = spec.slug + ": ";

  requireCondition(data.active === false && contract.activeOnImport === false, prefix + "inactive on import");
  requireCondition(contract.slug === spec.slug && contract.contractVersion === "1.0.0", prefix + "versioned contract");
  requireCondition(typeof contract.owner === "string" && contract.owner.length > 3, prefix + "named owner");
  requireCondition(contract.runbook === runbookPath, prefix + "runbook linked");
  requireCondition(contract.deploymentStatus === "DOCUMENTED_NOT_DEPLOYED", prefix + "honest deployment status");
  requireCondition(contract.globalDisableSwitch === "STOCKPRO_AUTOMATION_KILL_SWITCH", prefix + "global kill switch");
  requireCondition(contract.globalEnableSwitch === "STOCKPRO_AUTOMATION_ENABLED", prefix + "global enable switch");
  requireCondition(contract.workflowDisableSwitch === "STOCKPRO_WF_" + spec.slug.replaceAll("-", "_").toUpperCase() + "_ENABLED", prefix + "workflow disable switch");
  requireCondition(contract.testModeSwitch === "STOCKPRO_AUTOMATION_TEST_MODE", prefix + "test mode switch");
  requireCondition(Array.isArray(contract.failurePath) && contract.failurePath.length >= 4, prefix + "failure path declared");
  requireCondition(contract.retryPolicy?.maxTries === 3 && contract.retryPolicy?.waitBetweenTriesMs === 2000, prefix + "bounded retry policy");
  requireCondition(contract.deadLetter?.encrypted === true && contract.deadLetter?.retentionDays === 14 && contract.deadLetter?.adapterReferenceOnly === true, prefix + "encrypted minimized dead letter");
  requireCondition(contract.audit?.bodyFree === true && contract.audit?.retentionDays === 365, prefix + "body-free audit retention");
  requireCondition(contract.requiresOwnerApproval === true && contract.requiresSecurityApproval === true, prefix + "two-party activation approval");
  requireCondition(Array.isArray(contract.allowedActions) && contract.allowedActions.length >= 4, prefix + "allowed actions declared");
  requireCondition(Array.isArray(contract.forbiddenData) && contract.forbiddenData.length >= 3, prefix + "forbidden data declared");
  requireCondition(Array.isArray(contract.forbiddenActions) && contract.forbiddenActions.length >= 5, prefix + "forbidden actions declared");
  for (const name of requiredNames) requireCondition(names.has(name), prefix + "node present: " + name);
  requireCondition(!data.nodes.some((node) => forbiddenNodeTypes.includes(node.type)), prefix + "no shell/SSH/file/code node");
  requireCondition(data.settings?.availableInMCP === false, prefix + "not exposed as MCP tool");
  requireCondition(Object.keys(data.pinData || {}).length === 0, prefix + "no pinned payload data");

  const trigger = byName(spec.schedule ? "Internal Schedule Trigger" : "Private Authenticated Webhook");
  requireCondition(Boolean(trigger), prefix + "correct trigger type");
  if (!spec.schedule) {
    requireCondition(trigger.parameters.authentication === "headerAuth", prefix + "private webhook requires header authentication");
    requireCondition(trigger.parameters.path === "stockpro-" + spec.slug, prefix + "fixed webhook path");
    requireCondition(trigger.credentials?.httpHeaderAuth?.name === "StockPro private ingress authentication", prefix + "credential name only");
  }

  for (const node of data.nodes.filter((item) => item.type === "n8n-nodes-base.httpRequest")) {
    requireCondition(/^=\{\{ \$vars\.[A-Z0-9_]+ \}\}$/.test(node.parameters.url), prefix + node.name + " uses fixed variable URL");
    requireCondition(node.parameters.options?.allowUnauthorizedCerts === false, prefix + node.name + " verifies TLS");
    requireCondition(node.parameters.options?.redirect?.redirect?.maxRedirects === 0, prefix + node.name + " disables redirects");
    const credential = node.credentials?.httpHeaderAuth;
    requireCondition(Boolean(credential?.name) && !("id" in credential), prefix + node.name + " has no credential identifier");
    requireCondition(node.retryOnFail === true && node.maxTries <= 3, prefix + node.name + " retry is bounded");
  }
  const primary = byName("Primary Fixed Adapter Action");
  requireCondition(primary.maxTries === 3 && primary.waitBetweenTries === 2000 && primary.onError === "continueErrorOutput", prefix + "primary retry/failure output");
  requireCondition(targets("Primary Fixed Adapter Action", 1).includes("Failure Audit Event"), prefix + "failure reaches audit");
  requireCondition(targets("Primary Fixed Adapter Action", 1).includes("Encrypted Dead Letter"), prefix + "failure reaches dead letter");
  requireCondition(targets("Global Kill Switch Gate", 0).includes("Global Automation Enabled Gate"), prefix + "kill switch precedes global enable");
  requireCondition(targets("Global Automation Enabled Gate", 0).includes("Workflow Enabled Gate"), prefix + "global enable precedes workflow enable");
  requireCondition(targets("Global Automation Enabled Gate", 1).includes("Disabled Audit Event"), prefix + "global disable reaches audit");
  requireCondition(targets("Test Mode Gate", 0).includes("Test Mode Audit Event"), prefix + "test mode suppresses business path");
  requireCondition(targets("Test Mode Gate", 1).includes("Minimize Allowlisted Input"), prefix + "production path first minimizes input");

  if (spec.stateChange) {
    requireCondition(names.has("Meaningful State Change Gate") && names.has("No State Change Audit Event") && names.has("Fixed Operator Notification"), prefix + "state-change notification controls");
    requireCondition(targets("Meaningful State Change Gate", 1).includes("No State Change Audit Event"), prefix + "unchanged state suppresses notification");
    requireCondition(byName("Meaningful State Change Gate").parameters.conditions.conditions[0].operator.type === "boolean", prefix + "state gate is boolean");
  }
  if (spec.delivery) {
    requireCondition(names.has("Resend Delivery Confirmed Gate") && names.has("Approved Acknowledgement Adapter"), prefix + "delivery confirmation gate");
    requireCondition(targets("Resend Delivery Confirmed Gate", 1).includes("Failure Audit Event"), prefix + "unconfirmed delivery is failure");
    requireCondition(byName("Resend Delivery Confirmed Gate").parameters.conditions.conditions[0].operator.type === "boolean", prefix + "delivery gate is boolean");
  }

  const runbook = read(runbookPath);
  for (const section of requiredRunbookSections) requireCondition(runbook.includes(section), prefix + "runbook section: " + section);
  requireCondition(runbook.includes("DOCUMENTED_NOT_DEPLOYED"), prefix + "runbook deployment status");
  requireCondition(runbook.includes("STOCKPRO_AUTOMATION_KILL_SWITCH=true"), prefix + "runbook shutdown switch");
  requireCondition(runbook.includes("at most three total attempts"), prefix + "runbook retry test");
  requireCondition(runbook.includes("retained at most 14 days"), prefix + "runbook dead-letter retention");
  requireCondition(runbook.includes("atomically bind every idempotency key"), prefix + "adapter idempotency requirement");

  const serialized = JSON.stringify(data);
  requireCondition(!/(ghp_|github_pat_|sk_live_|sk_test_|xox[baprs]-|eyJ[A-Za-z0-9_-]{20,}\.)/.test(serialized), prefix + "no recognizable token");
  requireCondition(!/https?:\/\/(?!json-schema\.org|stockpro\.invalid)/.test(serialized), prefix + "no concrete external endpoint");
}

const architecture = read("docs/automation/N8N_ARCHITECTURE.md");
requireCondition(architecture.includes("docs/agent-team/PRODUCTION_AGENT_BOUNDARIES.md"), "architecture links authoritative production-agent boundaries");
const security = read("docs/automation/N8N_SECURITY.md");
for (const term of ["HMAC-SHA-256", "replay", "idempotency", "rate", "prompt", "PII", "least-privilege", "dead-letter"]) {
  requireCondition(security.toLowerCase().includes(term.toLowerCase()), "security standard covers " + term);
}
const ingressSource = read("automation/n8n/security/ingress-security.mjs");
for (const term of ["createHmac", "timingSafeEqual", "maxSkewMs", "maxBodyBytes", "projectPayload", "rateLimit.consume", "replay.claim", "idempotency.claim", "completeIdempotentResult"]) {
  requireCondition(ingressSource.includes(term), "executable ingress covers " + term);
}
requireCondition(!ingressSource.includes("process.env"), "ingress module loads no environment secret");
requireCondition(!ingressSource.includes("createServer") && !ingressSource.includes(".listen("), "ingress module opens no listener");
const ingressTests = read("automation/n8n/security/ingress-security.test.mjs");
for (const term of ["node:test", "MemoryReplayStore", "MemoryIdempotencyStore", "MemoryRateLimitStore", "replay_detected", "idempotency_collision", "rate_limited", "invalid_signature"]) {
  requireCondition(ingressTests.includes(term), "ingress deterministic tests cover " + term);
}
const ingressContract = read("automation/n8n/security/INGRESS_CONTRACT.md");
requireCondition(ingressContract.includes("durable, shared by every gateway replica, and atomic"), "production gateway requires durable atomic stores");
const ingressTestRun = spawnSync(process.execPath, ["--test", "automation/n8n/security/ingress-security.test.mjs"], {
  cwd: root,
  encoding: "utf8",
});
if (ingressTestRun.status !== 0) {
  if (ingressTestRun.stdout) console.error(ingressTestRun.stdout);
  if (ingressTestRun.stderr) console.error(ingressTestRun.stderr);
}
requireCondition(ingressTestRun.status === 0, "executable ingress security tests pass");

if (failures.length) {
  console.error("\nN8N CONTRACT VERIFICATION FAILED");
  for (const failure of failures) console.error("FAIL", failure);
  process.exit(1);
}
console.log("N8N CONTRACT VERIFICATION PASSED: " + assertionCount + " assertions; eleven inactive workflow exports, eleven runbooks, security controls, and deployment documents.");
