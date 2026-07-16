# Specialist Task Board

| Specialist | Status | Exclusive scope | Acceptance evidence |
| --- | --- | --- | --- |
| Lead Engineering Manager | Complete: inspection | Read-only repo/PR/workflow triage | PR #47, run #234, branch and risk findings |
| Backend and Supabase Engineer | Complete: focused commit | `scripts/verify-supabase-rls.mjs`; relevant Supabase docs | Real two-user/anonymous isolation flow and cleanup; no secret output |
| DevOps and Release Engineer | Complete: focused commit | Workflows, readiness verifier, launch checklist | Production/preview failure classification and honest external actions |
| Product and UX Design Lead | Complete: research contract | `docs/design-research/**` only | 15+ current sources, original reading order, desktop/tablet/mobile wireframes |
| 3D Creative Director | In progress: approval concepts | Storyboard and asset manifest | Ten-scene visual narrative and static key frames |
| Three.js/WebGL Engineer | Pending approval | Homepage WebGL files only | One lazy context, adaptive quality, pause/dispose, <=250 KiB gzip |
| Frontend Architect | Pending approval | Homepage-only React/HTML/CSS | Essential HTML-first content and preserved routes/CTAs |
| Integration and Plugin Engineer | Complete: focused commit | Integration files and readiness matrix | Installed/imported/configured evidence; no duplicate dependency |
| n8n Automation Engineer | Complete: contracts, ingress, and tests | `automation/n8n/**`, `docs/automation/**` | Separate service, secure contracts, ten workflows, disable/test paths |
| Security and Privacy Engineer | Complete: focused commit | Threat model and security tests | HMAC/replay/idempotency/redaction/secrets/RLS review; deterministic invariant tests |
| Performance Engineer | Pending | Budgets and evidence only | Bundle, lifecycle, memory, median Lighthouse report |
| QA and Accessibility Engineer | Pending | Required landing tests and baselines | Desktop/mobile/reduced-motion/WebGL-failure/axe evidence |
| SEO and Web Analysis Manager | Pending | Homepage SEO and sitemap verification | Crawlable HTML, canonical/schema/internal-link evidence |
| Website Support Operations Manager | Pending | Support workflow/runbook docs | Privacy-safe triage, severity, escalation, acknowledgement rules |
| Code Maintainer / Final Reviewer | Pending | Read-only final pass | Scope, architecture, dependencies, claims, commits and full gate review |

## Ownership rules

- One owner per file at a time; ownership transfers are sequential and recorded in the decision log.
- Specialists work in isolated branches/worktrees and return focused commits for manager review.
- Only the Integration Engineer changes `package.json` or `package-lock.json` during the homepage phase.
- Only DevOps changes workflows. No specialist merges or pushes to `main`.
