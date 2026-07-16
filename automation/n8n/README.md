# StockPro standalone automation contracts

This directory contains inactive, importable n8n workflow templates and operator controls. It is not application code. n8n must run as a separately deployed service; nothing here is imported by the StockPro frontend or server.

## Safety model

1. An authenticated HTTPS ingress gateway is the only public receiver.
2. The gateway validates HMAC-SHA-256 over the exact raw body, timestamp, event ID, idempotency key, and workflow name.
3. It rejects stale timestamps, replayed event IDs, reused idempotency keys, oversized bodies, unexpected content types, and rate-limit excesses.
4. It emits a minimized internal envelope over a private network to n8n.
5. n8n workflows are imported inactive, remain behind a kill switch, and use least-privilege credentials from the n8n credential store.
6. Test mode suppresses every external write. A human approves any production-changing or destructive action.
7. Failures are retried only when safe, then sent to a privacy-safe dead-letter queue with an audit event.

The editor must be reachable only through operator SSO/VPN. The webhook host must not route editor, REST, asset, or sign-in paths. Broker tokens, holdings, portfolio values, payment credentials, raw support text, cookies, authorization headers, and private request bodies are forbidden.

## Operator sequence

1. Read `docs/automation/N8N_SECURITY.md` and complete its threat-model review.
2. Pin reviewed image digests; the example tag is not an approval to deploy.
3. Provision PostgreSQL, encrypted volumes, a secrets manager, private networking, an authenticated ingress gateway, replay/idempotency storage, a dead-letter sink, and immutable audit storage.
4. Copy `env.example` outside the repository and replace placeholders using the secrets manager.
5. Import the JSON files in `workflows/`. Confirm every import remains inactive.
6. Create n8n variables for `STOCKPRO_AUTOMATION_ENABLED`, `STOCKPRO_AUTOMATION_TEST_MODE`, and `STOCKPRO_AUTOMATION_KILL_SWITCH`.
7. Bind only the credentials named in each runbook. Never bind broker or payment credentials.
8. Run each runbook in test mode, including rejection, retry, duplicate, and dead-letter cases.
9. Obtain Security and workflow-owner approval, then enable one workflow at a time.
10. Keep the global kill switch available to the incident commander.

## Local verification

Run `node scripts/verify-n8n-contracts.mjs`. This verifier uses only Node built-ins and does not contact n8n, external APIs, or secrets. It validates the templates and documentation contract; it does not prove an operator deployment.

## Layout

- `workflows/`: ten inactive import templates.
- `runbooks/`: activation, test, failure, and shutdown procedures per workflow.
- `security/`: ingress schema, threat model, redaction, and egress controls.
- `docker-compose.example.yml`: standalone topology example, bound to loopback only.
- `env.example`: placeholders only.

No workflow may merge code, push code, deploy, roll back, enable payment, execute a trade, edit broker credentials, delete user data, or run a shell command.

## Workflow inventory

| Workflow | Trigger | Owner | External state |
|---|---|---|---|
| CI Failure Triage | authenticated GitHub failure webhook | Developer Experience / CI | issue + operator notification only |
| Sentry Critical Issue Triage | authenticated critical-issue webhook | Production Reliability | sanitized issue + notification only |
| Uptime and Readiness Monitor | every five minutes | Site Reliability | transition-only notification |
| Support Intake | authenticated support-record webhook | Customer Support | task + Resend-confirmed acknowledgement |
| Beta User Onboarding | authenticated approved-account webhook | Beta Program | approved free-beta email only |
| Provider Outage Alert | every five minutes | Market Data Reliability | verified transition-only notification |
| Weekly SEO Report | Monday 09:00 IST | SEO / Web Platform | operator report only |
| Weekly Product Analytics Digest | Monday 10:00 IST | Product Analytics | aggregate operator digest only |
| Daily Support Digest | daily 08:00 IST | Customer Support | privacy-safe operator digest only |
| Release Verification | authenticated successful-deploy webhook | Release Engineering | safe checks + report/issue only |

workflow-specs.json is the reviewed source inventory; generate-contract-artifacts.mjs deterministically builds the exports and runbooks using Node built-ins. Readiness distinguishes setup_required from outage, and reachability alone never proves readiness. Provider monitoring distinguishes scheduled market closure and unconfigured providers from verified outages. No unchanged state produces a repeated operator notification.
