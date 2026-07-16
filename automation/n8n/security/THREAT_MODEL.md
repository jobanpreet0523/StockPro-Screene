# Automation threat model

## Assets and boundaries

Assets are service credentials, workflow definitions, audit records, support records, readiness results, and operator notification channels. Boundaries are public HTTPS ingress, private gateway-to-n8n traffic, n8n-to-approved-service egress, the editor, PostgreSQL, dead-letter storage, and audit storage.

## Principal threats and controls

- Forged webhooks: HMAC-SHA-256, key ID allowlist, constant-time compare, and TLS.
- Replay or duplicate side effects: timestamp window, atomic replay store, idempotency/body binding, and recorded result.
- Denial of service: 64 KiB cap, per-source/workflow limits, bounded retries, queue limits, and kill switches.
- SSRF/credential confusion: fixed destinations/actions, egress allowlist, redirect validation, and separate least-privilege credentials.
- Prompt injection: structured classification first, untrusted-data labeling, sanitization, no raw model input, and human review.
- Sensitive-data leakage: schema allowlists, recursive redaction, minimal execution retention, encrypted stores, and access audit.
- Workflow compromise: inactive imports, authenticated private editor, MFA/SSO/VPN, immutable version exports, two-person activation review, and no community/shell/file/SSH nodes.
- Supply-chain compromise: pinned image digest after review, vulnerability scanning, signed backups, staged upgrades, and documented rollback.
- Unauthorized production change: no deploy/merge/payment/trade credentials; human approval is necessary but does not grant absent capability.
- Cross-system blast radius: credential and network isolation per workflow, separate database, and no StockPro runtime dependency.

## Abuse cases that must fail

An attacker cannot choose a URL, repository, recipient, workflow action, model prompt, credential, or retry count. A valid event cannot cause code changes, deployment, rollback, payment activation, trade/order activity, broker changes, user-data deletion, or raw-message forwarding. The system fails closed when replay, rate-limit, idempotency, audit, or redaction infrastructure is unavailable.

Security and the workflow owner re-review this model before activation and after any trigger, destination, credential scope, node, retention, or data-field change.
