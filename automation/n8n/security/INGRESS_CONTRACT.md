# Authenticated ingress contract

The n8n container is not a public signature-verification boundary. A small separately reviewed gateway must terminate HTTPS and forward only valid, minimized envelopes over a private network.

Required request headers are `Content-Type: application/json`, `X-StockPro-Workflow`, `X-StockPro-Event-Id`, `X-StockPro-Idempotency-Key`, `X-StockPro-Timestamp`, `X-StockPro-Key-Id`, and `X-StockPro-Signature`.

The signature is lower-case hexadecimal HMAC-SHA-256 over:

```text
v1\n{timestamp}\n{eventId}\n{idempotencyKey}\n{workflow}\n{sha256(rawBody)}
```

The gateway must use constant-time comparison and select secrets only by an allowlisted key ID. It rejects unknown workflows, bodies over 64 KiB, non-JSON input, timestamps outside 300 seconds, replayed event IDs for at least 15 minutes, idempotency keys already associated with a different body, and callers above the per-source/workflow limit. Do not log the signature, raw body, or internal token.

After validation, the gateway applies the workflow allowlist and sends only the schema in `event-envelope.schema.json` to the private n8n webhook. It authenticates to n8n with a separate internal service credential. That credential is never the HMAC secret.

Idempotency state must move atomically from `accepted` to `completed` or `failed`. A duplicate with the same body returns the recorded result; a collision with a different body is rejected and audited. Replay storage and rate-limit storage fail closed.

## Executable module and atomic stores

ingress-security.mjs is the dependency-free reference implementation used by deterministic tests. It does not start a server, load an environment variable, contain a secret, or contact a service. The production gateway must pass exact request bytes, its trusted clock, key allowlist, workflow projection schemas, and three dependency-injected stores.

Production stores must be durable, shared by every gateway replica, and atomic across concurrent requests. The replay claim is create-if-absent with expiry. The idempotency claim atomically binds source, workflow, and idempotency key to the exact body hash; an identical completed duplicate returns only the stored sanitized result, while an in-progress duplicate or body collision fails closed. The rate counter atomically enforces a window per source and workflow. In-process maps are test doubles only and must never be used for production or multi-replica deployment.

The module authenticates the exact raw body before JSON parsing, uses constant-time comparison for valid-length lowercase hexadecimal signatures, rejects stale timestamps and oversized bodies, projects only schema-allowlisted fields, strips control characters from strings, and returns a minimized internal envelope. Same-event replay is rejected even when the idempotency key matches; a legitimate producer retry uses a fresh event ID with the original idempotency key.

Run deterministic tests with:

    node --test automation/n8n/security/ingress-security.test.mjs

Prompt-injection filtering is mandatory for support-derived text: remove active links and markup, cap length, label text as untrusted data, never concatenate it into system/tool instructions, and route uncertain or high-risk content to manual review. Raw text must not be sent to an untrusted model.
