# Specialist Task Board

| Specialist | Status | Exclusive scope | Acceptance evidence |
| --- | --- | --- | --- |
| Lead Engineering Manager | Complete: inspection | Read-only repo/PR/workflow triage | PR #47, run #234, branch and risk findings |
| Backend and Supabase Engineer | Complete: focused commit | `scripts/verify-supabase-rls.mjs`; relevant Supabase docs | Real two-user/anonymous isolation flow and cleanup; no secret output |
| DevOps and Release Engineer | Complete: focused commit | Workflows, readiness verifier, launch checklist | Production/preview failure classification and honest external actions |
| Product and UX Design Lead | Complete: research contract | `docs/design-research/**` only | 15+ current sources, original reading order, desktop/tablet/mobile wireframes |
| 3D Creative Director | Complete: concepts approved | Storyboard and asset manifest | Desktop, portrait, and landscape concepts plus binding ten-scene contract |
| Three.js/WebGL Engineer | Complete: approved implementation | Homepage WebGL files only | One lazy context, on-demand instanced scenes, adaptive quality, pause/dispose, 133.35 KiB gzip |
| Frontend Architect | Complete: approved implementation | Homepage-only React/HTML/CSS | Essential HTML-first content, ten scenes, preserved routes/CTAs |
| Integration and Plugin Engineer | Complete: focused commit | Integration files and readiness matrix | Installed/imported/configured evidence; no duplicate dependency |
| n8n Automation Engineer | Complete: contracts, ingress, and tests | `automation/n8n/**`, `docs/automation/**` | Separate service, secure contracts, ten workflows, disable/test paths |
| Security and Privacy Engineer | Complete: focused commit | Threat model and security tests | HMAC/replay/idempotency/redaction/secrets/RLS review; deterministic invariant tests |
| Performance Engineer | Complete: local evidence | Budgets and evidence only | 92.98 KiB initial, 133.35 KiB 3D lazy chunk, exact-source median LCP 1,981.7 ms, CLS 0; synthetic focus-response/scene-setup targets pass |
| QA and Accessibility Engineer | Complete: local evidence | Required landing tests and baselines | Eight-file matrix plus five portable full-page baselines; low-power, SPA disposal, mobile, reduced-motion, chunk failure and WebGL failure pass |
| SEO and Web Analysis Manager | Complete: local evidence | Homepage SEO and sitemap verification | Crawlable HTML, canonical/schema/internal-link audit passed |
| Website Support Operations Manager | Complete: docs and workflow contracts | Support workflow/runbook docs | Privacy-safe triage, severity, escalation, acknowledgement rules |
| Code Maintainer / Final Reviewer | Complete: approved | Read-only final pass | Final re-review found no source, security, dependency, threshold, or homepage-scope regression; commit hygiene corrected |

## Ownership rules

- One owner per file at a time; ownership transfers are sequential and recorded in the decision log.
- Specialists work in isolated branches/worktrees and return focused commits for manager review.
- Only the Integration Engineer changes `package.json` or `package-lock.json` during the homepage phase.
- Only DevOps changes workflows. No specialist merges or pushes to `main`.
