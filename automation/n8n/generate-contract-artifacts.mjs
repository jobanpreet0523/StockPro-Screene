import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const specs = JSON.parse(readFileSync(resolve(root, "workflow-specs.json"), "utf8"));
const workflowDir = resolve(root, "workflows");
const runbookDir = resolve(root, "runbooks");
const forbiddenData = [
  "authorization headers, cookies, sessions, tokens, secrets, passwords, PINs, OTPs, or TOTP values",
  "broker credentials, holdings, portfolio values, orders, trades, payment or card data",
  "raw private request bodies, raw support text, or user financial data",
];
const forbiddenActions = [
  "write/push code or merge a pull request/main",
  "deploy, roll back, mutate production, or delete user data",
  "enable payment, trade, or change broker credentials",
  "execute shell, SSH, file, or arbitrary code",
];

function uuid(seed) {
  const chars = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  chars[12] = "4";
  chars[16] = ((Number.parseInt(chars[16], 16) & 3) | 8).toString(16);
  const value = chars.join("");
  return value.slice(0, 8) + "-" + value.slice(8, 12) + "-" + value.slice(12, 16) + "-" + value.slice(16, 20) + "-" + value.slice(20);
}
const enabledVar = (spec) => "STOCKPRO_WF_" + spec.slug.replaceAll("-", "_").toUpperCase() + "_ENABLED";
const assignment = (spec, name, value, type = "string") => ({ id: uuid(spec.slug + ":field:" + name), name, value, type });

function setNode(spec, name, position, fields) {
  return {
    parameters: { assignments: { assignments: fields.map((field) => assignment(spec, field.name, field.value, field.type)) }, includeOtherFields: false, options: { dotNotation: false } },
    type: "n8n-nodes-base.set", typeVersion: 3.4, position, id: uuid(spec.slug + ":" + name), name,
  };
}
function ifNode(spec, name, leftValue, operation, rightValue, position) {
  return {
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 }, conditions: [{ id: uuid(spec.slug + ":" + name + ":condition"), leftValue, rightValue, operator: { type: "string", operation } }], combinator: "and" }, options: {} },
    type: "n8n-nodes-base.if", typeVersion: 2.2, position, id: uuid(spec.slug + ":" + name), name,
  };
}
function booleanTrueNode(spec, name, leftValue, position) {
  return {
    parameters: { conditions: { options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 }, conditions: [{ id: uuid(spec.slug + ":" + name + ":condition"), leftValue, rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }], combinator: "and" }, options: {} },
    type: "n8n-nodes-base.if", typeVersion: 2.2, position, id: uuid(spec.slug + ":" + name), name,
  };
}
function httpNode(spec, name, urlVar, credential, position, primary = false, body = "={{ JSON.stringify($json) }}") {
  return {
    parameters: {
      method: "POST", url: "={{ $vars." + urlVar + " }}", authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth",
      sendHeaders: true, headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
      sendBody: true, contentType: "raw", rawContentType: "application/json", body,
      options: { allowUnauthorizedCerts: false, redirect: { redirect: { maxRedirects: 0 } }, response: { response: { fullResponse: false, neverError: false } }, timeout: 15000 },
    },
    type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position, id: uuid(spec.slug + ":" + name), name,
    retryOnFail: true, maxTries: primary ? 3 : 2, waitBetweenTries: primary ? 2000 : 1000,
    onError: primary ? "continueErrorOutput" : "continueRegularOutput",
    credentials: { httpHeaderAuth: { name: credential } },
  };
}

function auditBody(spec, event, error = "") {
  const testMode = ["test_suppressed", "disabled"].includes(event);
  const errorField = error ? ", sanitizedErrorCode: '" + error + "'" : "";
  return "={{ JSON.stringify({ workflow: '" + spec.slug + "', eventType: '" + event + "', executionReference: $execution.id, occurredAt: $now.toISO(), owner: '" + spec.owner.replaceAll("'", "") + "', testMode: " + testMode + errorField + " }) }}";
}
function triggerNode(spec) {
  if (spec.schedule) {
    return { parameters: { rule: { interval: [spec.schedule] } }, type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [-600, 0], id: uuid(spec.slug + ":trigger"), name: "Internal Schedule Trigger" };
  }
  return {
    parameters: { httpMethod: "POST", path: "stockpro-" + spec.slug, authentication: "headerAuth", responseMode: "onReceived", options: {} },
    type: "n8n-nodes-base.webhook", typeVersion: 2, position: [-600, 0], id: uuid(spec.slug + ":trigger"), name: "Private Authenticated Webhook",
    credentials: { httpHeaderAuth: { name: "StockPro private ingress authentication" } },
  };
}
function workflow(spec) {
  const nodes = [];
  const connections = {};
  const connect = (from, output, to) => {
    connections[from] ??= { main: [] };
    while (connections[from].main.length <= output) connections[from].main.push([]);
    connections[from].main[output].push({ node: to, type: "main", index: 0 });
  };
  const trigger = spec.schedule ? "Internal Schedule Trigger" : "Private Authenticated Webhook";
  const input = [
    { name: "workflow", value: spec.slug },
    { name: "eventId", value: spec.schedule ? "={{ 'schedule-' + $execution.id }}" : "={{ $json.eventId }}" },
    { name: "idempotencyKey", value: spec.schedule ? "={{ 'schedule-' + $execution.id }}" : "={{ $json.idempotencyKey }}" },
    { name: "occurredAt", value: spec.schedule ? "={{ $now.toISO() }}" : "={{ $json.occurredAt }}" },
    { name: "traceId", value: spec.schedule ? "={{ 'schedule-' + $execution.id }}" : "={{ $json.traceId }}" },
    { name: "testMode", value: false, type: "boolean" },
    ...spec.fields.map((name) => ({ name, value: "={{ $json.payload." + name + " || '' }}" })),
  ];
  nodes.push({
    parameters: { content: "## Inactive security-reviewed template\nOwner: " + spec.owner + "\nRunbook: automation/n8n/runbooks/" + spec.slug + ".md\n\nNo endpoint values, credential identifiers, tokens, or private payloads are embedded.", height: 180, width: 520, color: 7 },
    type: "n8n-nodes-base.stickyNote", typeVersion: 1, position: [-760, -300], id: uuid(spec.slug + ":note"), name: "Contract Note",
  });
  nodes.push(triggerNode(spec));
  nodes.push(ifNode(spec, "Global Kill Switch Gate", "={{ $vars.STOCKPRO_AUTOMATION_KILL_SWITCH || 'true' }}", "notEquals", "true", [-380, 0]));
  nodes.push(ifNode(spec, "Global Automation Enabled Gate", "={{ $vars.STOCKPRO_AUTOMATION_ENABLED || 'false' }}", "equals", "true", [-270, -40]));
  nodes.push(ifNode(spec, "Workflow Enabled Gate", "={{ $vars." + enabledVar(spec) + " || 'false' }}", "equals", "true", [-160, -80]));
  nodes.push(ifNode(spec, "Test Mode Gate", "={{ $vars.STOCKPRO_AUTOMATION_TEST_MODE || 'true' }}", "equals", "true", [60, -140]));
  nodes.push(setNode(spec, "Minimize Allowlisted Input", [280, -220], input));
  nodes.push(httpNode(spec, "Primary Fixed Adapter Action", spec.adapter, spec.credential, [500, -220], true));
  nodes.push(httpNode(spec, "Success Audit Event", "STOCKPRO_AUDIT_SINK_URL", "StockPro immutable audit sink", [1420, -320], false, auditBody(spec, "success")));
  nodes.push(httpNode(spec, "Failure Audit Event", "STOCKPRO_AUDIT_SINK_URL", "StockPro immutable audit sink", [1080, 180], false, auditBody(spec, "failure", "adapter_failure")));
  nodes.push(httpNode(spec, "Encrypted Dead Letter", "STOCKPRO_DLQ_SINK_URL", "StockPro encrypted dead-letter sink", [1320, 100], false, "={{ JSON.stringify({ workflow: '" + spec.slug + "', executionReference: $execution.id, occurredAt: $now.toISO(), sanitizedErrorCode: 'retry_exhausted', retentionDays: 14, adapterReferenceOnly: true }) }}"));
  nodes.push(httpNode(spec, "Test Mode Audit Event", "STOCKPRO_AUDIT_SINK_URL", "StockPro immutable audit sink", [280, -40], false, auditBody(spec, "test_suppressed")));
  nodes.push({ parameters: {}, type: "n8n-nodes-base.noOp", typeVersion: 1, position: [500, -40], id: uuid(spec.slug + ":test-stop"), name: "No Business Side Effect in Test Mode" });
  nodes.push(httpNode(spec, "Disabled Audit Event", "STOCKPRO_AUDIT_SINK_URL", "StockPro immutable audit sink", [0, 220], false, auditBody(spec, "disabled")));
  connect(trigger, 0, "Global Kill Switch Gate");
  connect("Global Kill Switch Gate", 0, "Global Automation Enabled Gate");
  connect("Global Kill Switch Gate", 1, "Disabled Audit Event");
  connect("Global Automation Enabled Gate", 0, "Workflow Enabled Gate");
  connect("Global Automation Enabled Gate", 1, "Disabled Audit Event");
  connect("Workflow Enabled Gate", 0, "Test Mode Gate");
  connect("Workflow Enabled Gate", 1, "Disabled Audit Event");
  connect("Test Mode Gate", 0, "Test Mode Audit Event");
  connect("Test Mode Gate", 1, "Minimize Allowlisted Input");
  connect("Test Mode Audit Event", 0, "No Business Side Effect in Test Mode");
  connect("Minimize Allowlisted Input", 0, "Primary Fixed Adapter Action");
  let terminal = "Primary Fixed Adapter Action";
  if (spec.stateChange) {
    nodes.push(setNode(spec, "Minimize State Result", [720, -220], [
      { name: "stateChanged", value: "={{ $json.stateChanged === true }}", type: "boolean" },
      { name: "stateCode", value: "={{ $json.stateCode || 'unknown' }}" },
      { name: "previousStateCode", value: "={{ $json.previousStateCode || 'unknown' }}" },
      { name: "stateFingerprint", value: "={{ $json.stateFingerprint || '' }}" },
      { name: "summaryCode", value: "={{ $json.summaryCode || '' }}" },
    ]));
    nodes.push(booleanTrueNode(spec, "Meaningful State Change Gate", "={{ $json.stateChanged === true }}", [940, -220]));
    nodes.push(httpNode(spec, "Fixed Operator Notification", spec.notify, spec.notifyCredential, [1160, -220], true));
    nodes.push(httpNode(spec, "No State Change Audit Event", "STOCKPRO_AUDIT_SINK_URL", "StockPro immutable audit sink", [1160, -20], false, auditBody(spec, "unchanged_suppressed")));
    connect("Primary Fixed Adapter Action", 0, "Minimize State Result");
    connect("Minimize State Result", 0, "Meaningful State Change Gate");
    connect("Meaningful State Change Gate", 0, "Fixed Operator Notification");
    connect("Meaningful State Change Gate", 1, "No State Change Audit Event");
    terminal = "Fixed Operator Notification";
  } else if (spec.delivery) {
    nodes.push(setNode(spec, "Minimize Support Task Result", [720, -220], [
      { name: "supportTaskReference", value: "={{ $json.supportTaskReference || '' }}" },
      { name: "accountReference", value: "={{ $json.accountReference || '' }}" },
      { name: "locale", value: "={{ $json.locale || 'en' }}" },
      { name: "approvedTemplateVersion", value: "={{ $json.approvedTemplateVersion || '' }}" },
    ]));
    nodes.push(httpNode(spec, "Approved Acknowledgement Adapter", spec.acknowledgement, spec.acknowledgementCredential, [940, -220], true));
    nodes.push(setNode(spec, "Minimize Delivery Result", [1160, -220], [
      { name: "deliveryConfirmed", value: "={{ $json.deliveryConfirmed === true }}", type: "boolean" },
      { name: "deliveryReference", value: "={{ $json.deliveryReference || '' }}" },
    ]));
    nodes.push(booleanTrueNode(spec, "Resend Delivery Confirmed Gate", "={{ $json.deliveryConfirmed === true }}", [1380, -220]));
    connect("Primary Fixed Adapter Action", 0, "Minimize Support Task Result");
    connect("Minimize Support Task Result", 0, "Approved Acknowledgement Adapter");
    connect("Approved Acknowledgement Adapter", 0, "Minimize Delivery Result");
    connect("Approved Acknowledgement Adapter", 1, "Failure Audit Event");
    connect("Approved Acknowledgement Adapter", 1, "Encrypted Dead Letter");
    connect("Minimize Delivery Result", 0, "Resend Delivery Confirmed Gate");
    connect("Resend Delivery Confirmed Gate", 0, "Success Audit Event");
    connect("Resend Delivery Confirmed Gate", 1, "Failure Audit Event");
    connect("Resend Delivery Confirmed Gate", 1, "Encrypted Dead Letter");
    terminal = null;
  }
  if (terminal) {
    connect(terminal, 0, "Success Audit Event");
    connect(terminal, 1, "Failure Audit Event");
    connect(terminal, 1, "Encrypted Dead Letter");
  }
  connect("Primary Fixed Adapter Action", 1, "Failure Audit Event");
  connect("Primary Fixed Adapter Action", 1, "Encrypted Dead Letter");
  return {
    name: "StockPro - " + spec.title,
    active: false,
    nodes,
    connections,
    settings: { executionOrder: "v1", saveManualExecutions: true, callerPolicy: "workflowsFromSameOwner", availableInMCP: false, timezone: "Asia/Kolkata" },
    pinData: {},
    tags: [],
    stockproContract: {
      contractVersion: "1.0.0",
      slug: spec.slug,
      owner: spec.owner,
      runbook: "automation/n8n/runbooks/" + spec.slug + ".md",
      trigger: spec.trigger,
      deploymentStatus: "DOCUMENTED_NOT_DEPLOYED",
      activeOnImport: false,
      globalDisableSwitch: "STOCKPRO_AUTOMATION_KILL_SWITCH",
      globalEnableSwitch: "STOCKPRO_AUTOMATION_ENABLED",
      workflowDisableSwitch: enabledVar(spec),
      testModeSwitch: "STOCKPRO_AUTOMATION_TEST_MODE",
      failurePath: ["bounded retry on idempotent fixed adapter", "body-free failure audit", "encrypted dead letter after exhaustion", "human escalation"],
      retryPolicy: { maxTries: 3, waitBetweenTriesMs: 2000, retryOnly: ["timeout", "connection failure", "HTTP 429", "HTTP 5xx"], neverRetry: ["validation", "authentication", "authorization", "other HTTP 4xx"] },
      deadLetter: { retentionDays: 14, encrypted: true, adapterReferenceOnly: true },
      audit: { retentionDays: 365, bodyFree: true, events: ["disabled", "test_suppressed", "success", "failure", "retry_exhausted"] },
      allowedInputFields: spec.schedule ? [] : ["version", "workflow", "eventId", "idempotencyKey", "occurredAt", "receivedAt", "testMode", "traceId", ...spec.fields.map((field) => "payload." + field)],
      allowedActions: spec.actions,
      forbiddenData,
      forbiddenActions: [...forbiddenActions, spec.special],
      requiresOwnerApproval: true,
      requiresSecurityApproval: true,
      promptInjectionPolicy: spec.slug === "support-intake" ? "Structured fields only; signal routes to manual privacy review; raw text forbidden." : "No user-submitted free text accepted.",
    },
  };
}

function runbook(spec) {
  const lines = [
    "# " + spec.title + " runbook",
    "",
    "Status: **DOCUMENTED_NOT_DEPLOYED**",
    "Owner: **" + spec.owner + "**",
    "Workflow: automation/n8n/workflows/" + spec.slug + ".json",
    "Trigger: " + spec.trigger,
    "",
    "## Purpose and permitted actions",
    "",
    ...spec.actions.map((action) => "- " + action),
    "",
    spec.special,
    "",
    "## Input, privacy, and prompt-injection contract",
    "",
    "Allowed workflow-specific fields: " + (spec.schedule ? "No event payload; fixed read-only adapter." : spec.fields.join(", ")),
    "Unknown fields are dropped. Fixed adapters reject auth headers, cookies, secrets, raw bodies/text, broker/trading/portfolio/payment data, and financial data.",
    "No public value selects a URL, repository, recipient, credential, query, action, retry count, or model instruction. Raw user text never becomes a model prompt.",
    "",
    "## External provisioning",
    "",
    "- Create " + enabledVar(spec) + " as false.",
    "- Keep STOCKPRO_AUTOMATION_ENABLED=false, STOCKPRO_AUTOMATION_TEST_MODE=true, and STOCKPRO_AUTOMATION_KILL_SWITCH=true until approval.",
    "- Provision " + spec.adapter + " as fixed allowlisted HTTPS egress and bind the least-privilege credential named " + spec.credential + ".",
    "- The adapter must atomically bind every idempotency key to the minimized body and return the recorded result for an identical duplicate; a body collision fails closed.",
    ...(spec.notify ? ["- Provision " + spec.notify + " and bind " + spec.notifyCredential + " for transition-only notification."] : []),
    ...(spec.acknowledgement ? ["- Provision " + spec.acknowledgement + " and bind " + spec.acknowledgementCredential + "; approved Resend template only."] : []),
    "- Provision immutable body-free audit and encrypted dead-letter adapters. Record no credential values, tokens, project identifiers, or bodies.",
    "",
    "## Activation approval",
    "",
    "1. Run node scripts/verify-n8n-contracts.mjs on the reviewed commit.",
    "2. Import and confirm inactive. Security verifies ingress, fixed egress, scopes, redaction, replay/idempotency, rate limits, audit, and dead letter.",
    "3. Owner verifies all actions/destinations and runs every test below in test mode.",
    "4. Obtain owner and Security approval. Clear the kill switch, enable global automation, activate, and then enable only this workflow. Reverse any one of those gates to stop it.",
    "5. Observe audit, DLQ, errors, and egress through a full cycle. Human approval never grants absent merge/deploy/payment/trading/delete capability.",
    "",
    "## Test mode, retry, failure, and dead-letter tests",
    "",
    "- Valid trigger/schedule emits test_suppressed and no business adapter call.",
    "- Invalid signature/key, stale timestamp, replay, idempotency collision, oversized/non-JSON body, and rate excess fail at ingress for webhooks.",
    "- Both switches suppress business action and emit body-free disabled audit.",
    "- Unknown/forbidden fields fail closed and never enter retry, audit detail, notification, or dead letter.",
    "- Timeout, connection failure, HTTP 429/5xx retry at most three total attempts, two seconds apart. Validation/auth/other 4xx do not retry.",
    "- Exhaustion emits body-free failure audit and encrypted adapter-reference-only dead letter retained at most 14 days.",
    "- Audit is body-free, privacy-safe, access-logged, and retained 365 days.",
    ...(spec.stateChange ? ["- Changed fingerprint emits exactly one notification; unchanged emits only unchanged_suppressed.", "- setup_required remains distinct from verified_outage; scheduled market closure is never outage."] : []),
    ...(spec.delivery ? ["- Acknowledgement receives only opaque references and approved template version.", "- Non-confirmed Resend result records no success and is audited/dead-lettered."] : []),
    "",
    "## Disable, escalation, and incident shutdown",
    "",
    "Disable on unexpected output, privacy signal, duplicate side effect, or adapter failure; preserve body-free evidence and escalate to " + spec.owner + " and Security. Sensitive exposure also escalates to privacy owner/incident commander.",
    "Set STOCKPRO_AUTOMATION_KILL_SWITCH=true, block ingress, deactivate, revoke affected credentials, verify egress stops, preserve evidence, and follow docs/automation/N8N_ROLLBACK.md. Never delete evidence/user data or let n8n deploy/roll itself back.",
    "",
  ];
  return lines.join("\n");
}

mkdirSync(workflowDir, { recursive: true });
mkdirSync(runbookDir, { recursive: true });
for (const spec of specs) {
  writeFileSync(resolve(workflowDir, spec.slug + ".json"), JSON.stringify(workflow(spec), null, 2) + "\n", "utf8");
  writeFileSync(resolve(runbookDir, spec.slug + ".md"), runbook(spec), "utf8");
}
console.log("Generated " + specs.length + " inactive workflows and " + specs.length + " runbooks.");
