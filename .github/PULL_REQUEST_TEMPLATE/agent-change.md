## Agent task

- Task ID:
- Owner role:
- Independent reviewer role:
- Mission: B
- Risk / mode:
- Branch and isolated worktree:
- Dependencies:

## Scope and evidence

- Allowed paths:
- Forbidden paths:
- Acceptance commands and results:
- Security / QA / Release review:
- Rollback:
- External approvals required or recorded:

## Safety checklist

- [ ] Diff is Mission B-only against the declared base.
- [ ] No secret, personal, broker, payment, financial, or private prompt data is present.
- [ ] No role self-approved and no protected paths had overlapping writers.
- [ ] No mandatory gate, RLS policy, Lighthouse threshold, or visual tolerance was weakened.
- [ ] No fake data, readiness, configuration, approval, health, or metric is claimed.
- [ ] Payment and trading remain disabled.
- [ ] n8n remains inactive/test mode with kill switch enabled.
- [ ] No external message/content was sent or published.
- [ ] This PR does not merge or deploy itself.
