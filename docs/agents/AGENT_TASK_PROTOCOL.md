# Agent Task Protocol

Every task uses this required envelope:

```json
{
  "task_id": "SP-AGENT-YYYY-NNN",
  "title": "",
  "mission": "A or B",
  "department": "D01-D10",
  "owner_agent": "001-100",
  "reviewer_agent": "different registered role",
  "risk": "low | medium | high | critical",
  "mode": "read_only | draft | code_write | external_write | production_change",
  "allowed_paths": [],
  "forbidden_paths": [],
  "dependencies": [],
  "acceptance_tests": [],
  "rollback": "",
  "human_approval_required": true,
  "status": "queued | active | blocked | review | complete | rejected"
}
```

Code tasks also require `branch`, `worktree`, and exclusive lease references. Every read, draft, and code path must be contained by the owner's registry path caps; `.` and unbounded root wildcards are invalid. Protected work requires `security_review_required=true`. A completed high/critical task also records `review_evidence.security` and `review_evidence.qa`, each with a different registered reviewer from the correct department, `result=passed`, and non-empty command or audit evidence.

An active external or production task requires `expected_commit` (an exact 40-character SHA), `approval_environment`, and `approval_action`. Its unrevoked ledger record must match those values and the deterministic SHA-256 scope hash over task ID, mode, normalized/sorted allowed paths, commit, environment, and action. Approval timestamps must be valid UTC instants, already effective, unexpired, and ordered; the approver reference is opaque and non-sensitive. Agents still do not execute these actions under the current policy.

## State machine

`queued → active → review → complete` is normal. `queued|active|review → blocked|rejected` is allowed with a reason. A blocked task returns to queued after its prerequisite changes. Completed tasks are immutable; follow-up work gets a new ID.

Dependencies must exist, form an acyclic graph, and be complete before activation. Paths are normalized conservatively; exact, parent/child, and glob-base overlaps conflict among active writers. Forbidden paths take precedence.

## Evidence

Completion records exact commands/results, diff/commit, reviewer, sanitized findings, remaining risks, and rollback. A green narrow test cannot prove a broader acceptance criterion.
