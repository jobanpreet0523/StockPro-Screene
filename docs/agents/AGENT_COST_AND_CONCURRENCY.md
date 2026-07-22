# Agent Cost and Concurrency

| Resource | Maximum simultaneous |
| --- | ---: |
| Investigation agents | 12 |
| Code-writing agents | 4 |
| Agents modifying one subsystem | 1 |
| Agents touching one file | 1 |
| Deployment agents | 1 |
| Database-migration agents | 1 |
| External-publishing agents | 1 |
| Production-changing agents | 1 |

The last four modes are approval-gated and human-executed under the current policy. Concurrency is counted only while a lease is active. One task may hold several paths but prevents overlapping leases.

Cost classes: `LOW` for local/read-only metadata and deterministic validation; `MEDIUM` for browser suites, build artifacts, and bounded provider queries; `HIGH` for long multi-browser/performance runs or protected staging; `CRITICAL` for proposed production/database/external actions. Capacity Manager records estimated class before start and stops work at the approved ceiling. No task may spend money, create paid resources, or increase quotas without explicit owner approval.
