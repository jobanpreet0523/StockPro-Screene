# Risk Register

| ID | Severity | Risk | Mitigation / gate | Owner |
| --- | --- | --- | --- | --- |
| R-01 | P0 | PR #47 readiness CI is red | Keep draft; fix code defects; list environment actions separately | DevOps |
| R-02 | P0 | Required Cloudflare/Supabase bindings are missing or stale | Presence-only checks, production and preview probes, operator checklist | DevOps / Backend |
| R-03 | P0 | RLS isolation evidence is incomplete | Real disposable users, cross-user CRUD denial, anonymous denial, unconditional cleanup | Backend / Security |
| R-04 | P0 | Fake financial/broker/CRT/payment state reaches users | Automated content/state assertions; HTML setup states; payment/trading hard-disabled | QA / Security |
| R-05 | P1 | Full redesign bloats PR #47 and rollback scope | Separate stacked branch and draft PR | Lead / DevOps |
| R-06 | P1 | 3D regresses LCP, CLS, memory, or mobile battery | HTML-first paint, lazy chunk, one renderer, adaptive DPR/count, pause/dispose, budgets | WebGL / Performance |
| R-07 | P1 | Animation obscures meaning or accessibility | Evidence-bearing scenes, semantic HTML, static/reduced-motion siblings, keyboard path | UX / A11y |
| R-08 | P1 | Product routes are accidentally redesigned | Forbidden-file map, route baselines, visual regression | Frontend / QA |
| R-09 | P1 | Package presence is mistaken for working integration | Readiness matrix requires import/config/env/health/test evidence | Integration |
| R-10 | P1 | n8n crosses the security or service boundary | Separate deployment, signed/replay-safe webhooks, least privilege, approval gates | n8n / Security |
| R-11 | P1 | Secrets or financial PII enter analytics/support automation | Allowlists, redaction, PII minimization, audit tests | Security / Support |
| R-12 | P2 | Node/action runtime drift causes CI noise or future failure | Align supported runtime after current blockers are fixed | DevOps |
| R-13 | P2 | Concept is implemented before visual approval | Mandatory desktop/mobile concept approval recorded in decision log | UX / Lead |
