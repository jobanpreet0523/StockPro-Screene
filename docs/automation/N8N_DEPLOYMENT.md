# n8n deployment runbook

## Prerequisites

- A dedicated host/account/subdomain, private network, encrypted volumes, managed secret store, TLS 1.2+, PostgreSQL backups, authenticated ingress gateway, replay/idempotency/rate-limit store, dead-letter sink, and immutable audit sink.
- Replay, idempotency, and per-source/workflow rate stores must be durable, shared across all gateway replicas, and implement atomic claim/update semantics. Repository in-memory stores are test doubles only.
- Operator SSO/MFA plus VPN or identity-aware access for the editor; no public editor route.
- Separate least-privilege service accounts per workflow. No broker, trading, payment, deployment, merge, repository-write, or database-admin credential.
- Reviewed and digest-pinned n8n/PostgreSQL images. The example tags are starting points, not approvals.

## Deploy

1. Run `node scripts/verify-n8n-contracts.mjs` on the reviewed commit.
2. Copy `automation/n8n/env.example` to the secret-managed deployment environment and replace every placeholder. Do not place the resulting file in Git or the StockPro host.
3. Review the compose example, pin image digests, restrict host firewall ingress, and confirm n8n binds only to loopback/private networking.
4. Configure a separate editor hostname. Deny editor, REST, asset, sign-in, metrics, and health paths on the webhook hostname. Permit only fixed `stockpro-*` webhook paths from the gateway.
5. Configure gateway HMAC keys, internal n8n credentials, replay/idempotency/rate-limit storage, and per-producer workflow mappings.
6. Start PostgreSQL and n8n. Verify TLS, authentication, access logs, backup/restore, clock synchronization, egress deny-by-default, excluded nodes, and execution pruning.
7. Import each workflow JSON and verify `active=false`. Create its three control variables and credentials from the runbook.
8. Execute the complete test-mode runbook: valid event, invalid signature, stale timestamp, replay, idempotent duplicate, collision, rate limit, prompt injection where relevant, timeout, retry exhaustion, dead-letter, and audit.
9. Security and the named owner approve evidence. Set the kill switch false while leaving enabled false; activate one workflow; then set only that workflow enabled true.
10. Monitor audit, DLQ, queue depth, error rate, and outbound calls through a full cycle before enabling the next workflow.

## Required deployment evidence

Record image digests, configuration hash, workflow export hashes, owner/security approvals, test timestamps/results, blocked-path checks, credential scopes, egress allowlist, backup restore evidence, and rollback drill. Do not record credential values, project IDs, event bodies, or user data.

The repository intentionally does not deploy this service. Until an operator completes these steps, deployment status is `DOCUMENTED_NOT_DEPLOYED`.
