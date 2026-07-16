# n8n automation architecture

## Separation

StockPro does not import, package, or call n8n from the browser. n8n runs in a separately deployed automation environment with its own PostgreSQL database, encrypted volume, credentials, private network, ingress gateway, audit sink, and dead-letter sink. An n8n outage cannot prevent StockPro pages or APIs from loading.

The authoritative allowed-tools, forbidden-data, approval, escalation, audit-retention, and incident-shutdown policy is docs/agent-team/PRODUCTION_AGENT_BOUNDARIES.md. This automation branch links to that policy but does not duplicate it.

```text
approved producer -> HTTPS gateway -> validation/minimization -> private n8n webhook
                           |                         |             |
                  replay/idempotency store     audit sink     approved APIs
                                                          retry -> encrypted DLQ
```

The gateway is the public trust boundary. It authenticates HMAC requests, enforces timestamp/replay/idempotency/rate/body limits, and maps each producer to one fixed workflow and payload schema. n8n accepts only the minimized internal envelope and has no direct public route. The editor is on a distinct operator-only hostname protected by SSO/MFA and VPN or identity-aware access.

## Data and action boundaries

Permitted data is operational metadata: workflow/event IDs, route/status codes, timestamps, sanitized error fingerprints, issue IDs, aggregate allowlisted analytics, and bounded privacy-safe summaries. Forbidden data includes broker tokens and credentials, holdings, portfolio values, orders, payment credentials, passwords, PIN/OTP/TOTP, authorization headers, cookies, raw private bodies, and raw support text.

Permitted actions are monitor, triage, notify, create/update an issue, prepare an operator report, and send a pre-approved non-financial email. There is no credential or node capability to write code, merge, deploy, roll back, enable payment, execute trades, change broker credentials, or delete user data.

## Stateful readiness

Reachability is not readiness. Supabase can be reachable while an empty schema or missing RLS policies leaves a feature `setup_required`; its advisor state is an operator signal, never evidence to auto-create policies. PostHog SDK/project connectivity is not healthy analytics: the digest remains `setup_required` until allowlisted events are demonstrably ingested. Project IDs, tokens, and raw event payloads are not stored in workflow exports.

## Reliability

Each workflow is inactive on import, has a global and per-workflow disable switch, starts in test mode, uses a fixed retry budget with jitter only for transient idempotent operations, emits an audit event, and moves exhausted failures to encrypted dead-letter storage. State-change monitors suppress duplicate notifications. Human approval gates production-changing or destructive suggestions; approval never expands the workflow's technical permissions.

The ten templates and runbooks under `automation/n8n` are the authoritative workflow inventory. `scripts/verify-n8n-contracts.mjs` checks their static contract without network or secret access.
