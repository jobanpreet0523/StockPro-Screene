# Agent Incident Policy

Agents may detect, classify, preserve sanitized evidence, recommend containment, and draft communications. Humans execute credential rotation, production shutdown/change, customer/provider contact, data recovery, and disclosure.

1. Trigger the narrow global or workflow kill switch when a pre-approved automatic disable path exists; fail closed.
2. Stop affected tasks and revoke leases.
3. Record time, task, commit, environment alias, correlation IDs, affected capability, and data class without bodies/secrets.
4. Escalate to 050, 041, 005, 006, and the human owner according to severity.
5. Human operator contains the smallest surface and preserves evidence.
6. Validate isolation, recovery, and rollback with reproducible checks.
7. Complete a reviewed post-incident record before reactivation.

Never paste tokens, raw events, customer rows, support bodies, broker/financial data, or private prompts into issues, Slack, email, screenshots, or model context.
