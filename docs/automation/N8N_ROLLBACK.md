# n8n rollback and shutdown

Automation is not in StockPro's serving path, so service shutdown is the first safe response.

## Immediate shutdown

1. Set `STOCKPRO_AUTOMATION_KILL_SWITCH=true` in the automation secret/config service.
2. Disable inbound gateway routes and revoke the internal gateway-to-n8n credential.
3. Deactivate affected workflows in n8n. Do not delete executions, audit evidence, or user records.
4. Revoke affected outbound credentials and HMAC keys. Preserve audit/DLQ snapshots with restricted access.
5. Notify the incident commander, Security, workflow owner, and data/privacy owner when sensitive data might be involved.
6. Verify no new outbound calls or workflow starts occur, while StockPro routes continue operating independently.

## Version rollback

1. Export and hash the current inactive workflow definitions and database backup.
2. Restore the last Security-approved image digest, workflow export, and configuration hash in an isolated environment.
3. Apply database downgrade guidance only when the reviewed n8n release explicitly supports it; otherwise restore the compatible encrypted database snapshot.
4. Run the full test-mode suite and a backup-restore check. Compare audit/DLQ counts without replaying side effects.
5. Re-enable gateway and one workflow only after owner and Security approval. Keep external writes suppressed until duplicate/idempotency state is reconciled.

Never let n8n roll itself back, deploy, merge, or delete data. Recovery is an operator action. If uncertain, leave automation disabled; monitoring/reporting loss is safer than uncontrolled side effects.
