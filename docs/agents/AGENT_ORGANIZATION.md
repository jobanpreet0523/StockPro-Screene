# StockPro 100-Agent Organization

## State

`REGISTERED | TEST_MODE | APPROVAL_REQUIRED`

Exactly 100 roles are registered in ten departments. Registration means available for controlled assignment; it does not mean 100 concurrent processes. The repository owner remains final authority.

| Department | IDs | Lead | Responsibility |
| --- | --- | --- | --- |
| D01 Executive and Program Control | 001–010 | 001 | Routing, architecture, risk, release evidence, approvals, cost |
| D02 Frontend, Design and 3D | 011–020 | 011 | React, TypeScript, WebGL, motion, accessibility, design system |
| D03 Backend, Auth and Database | 021–030 | 021 | Worker, APIs, Auth, Supabase, RLS, schema, forms |
| D04 Market Data, Brokers and Research | 031–040 | 031 | Authorized providers, read-only brokers, instruments, CRT, integrity |
| D05 Security, Privacy and Compliance | 041–050 | 041 | Threats, secrets, vault, OAuth, dependencies, privacy, incidents |
| D06 Quality and Test Engineering | 051–060 | 051 | Unit, integration, browser, accessibility, performance, acceptance |
| D07 DevOps, Cloud and Reliability | 061–070 | 061 | CI, Cloudflare plans, bindings, telemetry, rollback, recovery |
| D08 Product, UX, SEO and Analytics | 071–080 | 071 | Product, UX, onboarding, SEO, analytics, compliant copy |
| D09 Content, Brand and Growth | 081–090 | 081 | Educational drafts, facts, social drafts, newsletter, brand |
| D10 Automation, Support and Operations | 091–100 | 091 | n8n contracts, triage, support, digests, scheduling, audits |

The canonical JSON provides every role's name, unique scope, narrow permissions, inputs, outputs, acceptance checks, reviewer, review chain, escalation route, and prohibited actions.

## Activation waves

| Wave | State | Constraint |
| --- | --- | --- |
| 0 Registration | Complete | 100 IDs, ten departments, validators |
| 1 Read-only audit | Complete | Roles 001, 003, 004, 005, 011, 021, 031, 041, 051, 061, 071, 091; no edits |
| 2 Mission A repair | Complete on separate PR #48 branch | Mandatory release gates green; no Mission B commits |
| 3 Architecture and documentation | Active on Mission B branch | Maximum four writers; exclusive files |
| 4 Automation contracts | Test mode only | Inactive, kill switch enabled, documented not deployed |
| 5 Product-maintenance queues | Registered, not scheduled | Read-only only after owner/operator configuration |
| 6 Content draft queues | Registered, not publishing | Human approval required at publication boundary |

## Dependency routing

The Chief Orchestrator builds the DAG; Architecture checks overlap; Risk classifies; Program assigns owner/reviewer; Capacity grants leases; the owner works in isolation; reviewer, Security, QA, and Release Authority verify as applicable; the human owner alone approves merge, production, or publication.
