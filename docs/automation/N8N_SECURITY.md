# n8n security standard

## Mandatory controls

- HTTPS plus HMAC-SHA-256 over the raw body digest and canonical metadata; constant-time comparison and key rotation.
- Five-minute timestamp skew, atomic 15-minute replay denial, body-bound idempotency, per-source/workflow rate limits, and a 64 KiB JSON-only limit.
- Private gateway-to-n8n networking with a separate internal credential; editor isolated behind SSO/MFA and VPN/identity-aware access.
- Default-deny egress, fixed destinations/actions, least-privilege credentials per workflow, redirect/SSRF protection, and no user-selectable URL or recipient.
- Encrypted secrets/volumes/backups/DLQ, minimized retention, immutable body-free audit records, recursive redaction, and access logging.
- PII minimization through allowlisted schemas, opaque references, aggregation, and removal of identity fields whenever delivery does not strictly require them.
- Global and per-workflow kill switches, inactive imports, test mode, bounded idempotent retries, dead-letter handling, and two-person activation approval.
- Command, SSH, file, arbitrary-code, and unreviewed community nodes disabled. Public input can never become a command, expression, URL, query, recipient, credential selector, or prompt instruction.

## Data prohibitions

Never ingest or emit broker tokens/passwords/PINs/OTPs/TOTP, holdings, portfolio values, orders, payment credentials, authorization headers, cookies, session data, raw private request bodies, or raw support messages. Never store secret/project identifiers in templates. No workflow receives permissions to trade, place orders, change brokers, activate payment, write/merge code, deploy/roll back, administer Supabase, or delete user data.

Support content is adversarial untrusted data. Prefer structured categories. Otherwise sanitize and minimize before deterministic classification; never send raw text to an untrusted model. Prompt-like content, URLs, hidden Unicode/markup, credential requests, and tool instructions route to manual review.

## Verification limits

The static verifier proves that committed templates contain the declared controls, remain inactive, use no forbidden node types/credentials/secret literals, and link to runbooks. It cannot prove gateway code, network policy, credentials, n8n version safety, delivery, or live workflow behavior. Those require the deployment evidence in `N8N_DEPLOYMENT.md`.

Security must reject activation when signature, replay, idempotency, rate-limit, redaction, audit, DLQ, egress, backup/restore, access-control, or shutdown tests are missing. Failures in these controls fail closed.
