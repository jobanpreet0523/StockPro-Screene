# Repository contract

Canonical sources:

- `AGENTS.md`: repository-wide execution instructions.
- `docs/agents/AGENT_REGISTRY.json`: 100 role contracts and concurrency limits.
- `docs/agents/AGENT_TASK_QUEUE.json`: current dependency DAG and leases.
- `docs/agents/AGENT_APPROVALS.json`: scoped human approval evidence; empty in test mode.
- `docs/agents/AGENT_PERMISSIONS.md`: modes and protected paths.
- `docs/agents/AGENT_SECURITY_POLICY.md`: secrets, provider, Supabase, telemetry, and n8n boundaries.
- `docs/agents/AGENT_RELEASE_POLICY.md`: preview, exact-commit evidence, protected production, rollback.
- `docs/agents/AGENT_KILL_SWITCH.md`: fail-closed stop and reactivation rules.

Validation commands:

```text
npm run verify:agents
npm run verify:agent-permissions
npm run verify:agent-tasks
npm run verify:n8n-contracts
npm run test:security-invariants
```

Repository changes use `agent/stockpro-100-agent-operating-system` until reviewed. Mission B remains separate from PR #48. Production, database, payment, trading, outbound messaging, and publication are human-only or prohibited as specified in policy.
