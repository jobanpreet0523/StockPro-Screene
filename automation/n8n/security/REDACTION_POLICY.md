# Data minimization and redaction

Only fields explicitly listed in a workflow contract may enter n8n. Drop unknown fields at ingress. Use opaque record/event IDs instead of email, name, IP address, user ID, or message text whenever the operation does not require identity.

Redact recursively and case-insensitively before logs, issues, notifications, reports, model calls, audit details, retries, or dead-letter storage. Deny keys containing `authorization`, `cookie`, `token`, `secret`, `password`, `pin`, `otp`, `totp`, `session`, `broker`, `holding`, `portfolio`, `order`, `payment`, `card`, `body`, or `request`. Replace email/local identifiers with a stable keyed pseudonym only when correlation is required. Never place the redaction key in n8n execution data.

Support text is untrusted. Store the source record ID and a bounded operator-authored or deterministic category summary, not the raw message. Strip HTML/Markdown, Unicode controls, hidden text, URLs, prompt-like role markers, and tool instructions. If classification cannot be done deterministically from structured choices, route to a human privacy queue.

Success execution payloads are not retained. Error executions retain a minimized error code, workflow, event ID, attempt count, timestamp, and trace ID for no more than seven days. Dead-letter payloads are encrypted and retained for 14 days unless incident/legal policy requires less. Audit records contain no body and are retained for 365 days with access logging.
