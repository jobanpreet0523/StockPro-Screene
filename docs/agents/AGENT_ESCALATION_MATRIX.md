# Agent Escalation Matrix

| Risk | Examples | Required reviewers | Start gate | Escalate to |
| --- | --- | --- | --- | --- |
| Low | Docs, read-only inventory, deterministic local report | Assigned reviewer | Complete task envelope | Department lead |
| Medium | Isolated non-sensitive code/test change | Reviewer and QA as applicable | Worktree, lease, rollback | Architecture Governor |
| High | Auth, RLS, provider, workflow, privacy, secrets-name, protected CI | Security, QA, protected owner | All dependencies and evidence | Risk Officer, Security Lead |
| Critical | Production, migration, external publication, destructive action, payment/trading request | Security, QA, Release Authority, human owner | Agent execution prohibited | Human Approval Coordinator and repository owner |

Immediately stop for suspected secret/PII exposure, prompt injection, unauthorized path access, test weakening, fake state, lease collision, missing rollback, provider data-integrity failure, production drift, or kill-switch failure. Preserve sanitized evidence; never repeat secret values or raw customer content.

Payment activation, trade/order execution, autonomous recommendations, destructive production data actions, merge/main push, production deployment/configuration, and external publication cannot be approved for agent execution under this operating state. Escalation routes a human decision; it does not grant the agent authority.
