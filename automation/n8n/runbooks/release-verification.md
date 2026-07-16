# Release Verification runbook

Status: **DOCUMENTED_NOT_DEPLOYED**
Owner: **Release Engineering owner**
Workflow: automation/n8n/workflows/release-verification.json
Trigger: Authenticated successful production-deployment webhook after ingress verification and minimization

## Purpose and permitted actions

- run fixed safe GET/HEAD route checks
- verify fixed readiness/status contract
- prepare pass/fail report
- open issue when checks fail

Never merge, deploy, roll back, mutate configuration, purge data, or equate deployment success with readiness.

## Input, privacy, and prompt-injection contract

Allowed workflow-specific fields: deploymentReference, commitSha, environment, deploymentUrlAlias
Unknown fields are dropped. Fixed adapters reject auth headers, cookies, secrets, raw bodies/text, broker/trading/portfolio/payment data, and financial data.
No public value selects a URL, repository, recipient, credential, query, action, retry count, or model instruction. Raw user text never becomes a model prompt.

## External provisioning

- Create STOCKPRO_WF_RELEASE_VERIFICATION_ENABLED as false.
- Keep STOCKPRO_AUTOMATION_TEST_MODE=true and STOCKPRO_AUTOMATION_KILL_SWITCH=true until approval.
- Provision STOCKPRO_RELEASE_VERIFICATION_ADAPTER_URL as fixed allowlisted HTTPS egress and bind the least-privilege credential named StockPro release verification read-only adapter.
- The adapter must atomically bind every idempotency key to the minimized body and return the recorded result for an identical duplicate; a body collision fails closed.
- Provision immutable body-free audit and encrypted dead-letter adapters. Record no credential values, tokens, project identifiers, or bodies.

## Activation approval

1. Run node scripts/verify-n8n-contracts.mjs on the reviewed commit.
2. Import and confirm inactive. Security verifies ingress, fixed egress, scopes, redaction, replay/idempotency, rate limits, audit, and dead letter.
3. Owner verifies all actions/destinations and runs every test below in test mode.
4. Obtain owner and Security approval. Clear global kill switch while workflow switch remains false; activate; then enable only this workflow.
5. Observe audit, DLQ, errors, and egress through a full cycle. Human approval never grants absent merge/deploy/payment/trading/delete capability.

## Test mode, retry, failure, and dead-letter tests

- Valid trigger/schedule emits test_suppressed and no business adapter call.
- Invalid signature/key, stale timestamp, replay, idempotency collision, oversized/non-JSON body, and rate excess fail at ingress for webhooks.
- Both switches suppress business action and emit body-free disabled audit.
- Unknown/forbidden fields fail closed and never enter retry, audit detail, notification, or dead letter.
- Timeout, connection failure, HTTP 429/5xx retry at most three total attempts, two seconds apart. Validation/auth/other 4xx do not retry.
- Exhaustion emits body-free failure audit and encrypted adapter-reference-only dead letter retained at most 14 days.
- Audit is body-free, privacy-safe, access-logged, and retained 365 days.

## Disable, escalation, and incident shutdown

Disable on unexpected output, privacy signal, duplicate side effect, or adapter failure; preserve body-free evidence and escalate to Release Engineering owner and Security. Sensitive exposure also escalates to privacy owner/incident commander.
Set STOCKPRO_AUTOMATION_KILL_SWITCH=true, block ingress, deactivate, revoke affected credentials, verify egress stops, preserve evidence, and follow docs/automation/N8N_ROLLBACK.md. Never delete evidence/user data or let n8n deploy/roll itself back.
