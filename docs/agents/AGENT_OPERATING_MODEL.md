# Agent Operating Model

## Control loop

1. Create a structured task and dependency DAG.
2. Architecture Governor verifies scope and single-owner boundaries.
3. Risk Governance assigns low, medium, high, or critical risk.
4. Program Management assigns a registered owner and different reviewer.
5. Capacity Manager acquires atomic subsystem/file leases.
6. Code writers receive isolated non-main worktrees; readers receive sanitized read-only access.
7. The owner produces only declared outputs and evidence.
8. The reviewer checks the diff and acceptance tests independently.
9. Security and QA review high/critical work; Release Authority reviews releases.
10. Human owner alone merges, changes production, sends, or publishes.
11. Change Control records result, rollback, and released leases.

Queued or registered roles consume no concurrency. A scheduler must use a shared atomic lease store before real multi-process activation; JSON validation alone is not a runtime lock.

## Department routing

Route by the registry's department tags and protected paths. Cross-department tasks must name one accountable owner and reviewers from each protected surface. Shared files are serialized, never split by conceptual subsystem.

## Fail-closed activation

Missing registry, task, dependency, worktree, lease, reviewer, test, rollback, credential, approval, or kill-switch evidence prevents start. `setup_required`, missing telemetry, and empty data remain truthful states, not failures to disguise.

## Current operating boundary

Audit roles are operational read-only. Editing roles are available only through isolated tasks. n8n is documented but not deployed. Production and external actions remain human-only.
