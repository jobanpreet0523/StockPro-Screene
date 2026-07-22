# Agent Permission Model

Permissions are default-deny and are the intersection of registry role caps, task paths, current leases, risk gates, and human policy. A broader role cap never expands a task.

| Mode | Default | Required control |
| --- | --- | --- |
| `read_only` | Allowed for registered roles | Sanitized source, least-privilege connector, no row/body/secret dumps |
| `draft` | Allowed where registered | No external send, publish, issue, PR, or account mutation |
| `code_write` | Allowed where registered | Isolated non-main branch/worktree, exclusive paths, tests, reviewer |
| `external_write` | Not executable by agents | Human performs the exact approved action after scoped record and final review |
| `production_change` | Not executable by agents | Human protected-environment operator only; staged evidence and rollback mandatory |

Forbidden for every role: self-approval; `main` push/merge; secret-value access; destructive production data changes; payment activation; order/trade execution; autonomous recommendations; fake data/readiness; test weakening; unapproved external communication.

## Path control

- Paths must be repository-relative, normalized, and contain no `..`, absolute root, drive letter, or unbounded root wildcard.
- `.env*`, credential stores, `.git/**`, and `node_modules/**` are forbidden even when a parent path is allowed.
- `src/_worker.js` is one exclusive file lease because it spans several subsystems.
- Generated n8n exports/runbooks are owned sequentially with their generator; do not hand-edit them while generation is active.
- CODEOWNERS requests human review but is not a security boundary unless branch protection enforces it.

## Protected surfaces

Workflows, Worker runtime, Wrangler, migrations/RLS/Auth, provider and broker vault code, billing/payment code, n8n/security, social publishing queues, and deployment files require their RACI reviewers. Payment and trading activation remain prohibited regardless of review.
