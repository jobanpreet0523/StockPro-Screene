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

Prompt-injection filtering is mandatory for support-derived text: remove active links and markup, cap length, label text as untrusted data, never concatenate it into system/tool instructions, and route uncertain or high-risk content to manual review. Raw text must not be sent to an untrusted model.
