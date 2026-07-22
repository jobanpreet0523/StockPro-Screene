# Agent Kill Switch

Global agent state is fail-closed through `STOCKPRO_AGENT_KILL_SWITCH=true`. n8n additionally requires `STOCKPRO_AUTOMATION_KILL_SWITCH=true`, `STOCKPRO_AUTOMATION_ENABLED=false`, and `STOCKPRO_AUTOMATION_TEST_MODE=true` by default. Missing or unparsable values are treated as disabled execution.

When enabled, the global switch blocks new code, external, production, deployment, migration, and automation starts; read-only incident inspection may continue with authorization. Per-workflow enablement never overrides the global switch.

Only a human operator may clear a production/external kill switch after Security review, incident resolution, fresh scoped approval, successful test-mode exercise, and rollback confirmation. An agent or workflow cannot toggle its own switch. Emergency disable must be one action; re-enable is a new approval process.
