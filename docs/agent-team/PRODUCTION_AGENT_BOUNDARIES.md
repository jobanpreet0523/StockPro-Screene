# StockPro Production Agent Boundaries

Status: mandatory operating policy for the invite-only free-beta program. These boundaries apply to Codex agents, CI bots, n8n workflows, support automations, and any future AI runtime.

## Core rule

An agent may inspect, analyze, test with synthetic/disposable data, edit an isolated branch, and draft an action. It may not independently deploy, merge, mutate production data or configuration, rotate secrets, contact users, enable telemetry, activate payment, or place a trade.

Prompt instructions are not a security boundary. Enforce this policy with separate identities, least-privilege credentials, protected environments, approvals, audit logs, network restrictions, and kill switches.

## Non-negotiable invariants

- No live payment, checkout, mandate, renewal, subscription activation, refund, or charge.
- No order placement, modification, cancellation, trade execution, investment recommendation, or broker action beyond approved read-only data/auth/logout flows.
- No shared owner broker token. Every broker connection is per-user and encrypted server-side.
- No production Supabase service-role key, broker vault secret, payment secret, admin token, deploy token, or automation signing key is exposed to a browser, prompt, chat, analytics event, support payload, repository, artifact, or agent log.
- No fabricated customer, market, broker, CRT, AI, payment, or operational state.
- No agent pushes to or merges `main` or disables/weakens a required release gate.
- No agent interprets `setup_required`, missing events, a healthy control plane, or a package import as proof that an end-to-end feature works.

## Capability matrix

| Action | Agent default | Human gate and evidence |
| --- | --- | --- |
| Read repository, PR metadata, public docs, sanitized logs | Allowed | Use read-only credentials and redact personal/secret values. |
| Run local static/unit/browser tests | Allowed | Use fixtures, local services, or disposable test users; clean up. |
| Query production readiness/status endpoints | Allowed read-only | Endpoints must expose states only, never credential values or personal rows. |
| Inspect Supabase schema/advisors/grants/RLS | Allowed read-only | Project-scoped read-only connection; never print keys or row contents. |
| Query PostHog/Sentry health | Allowed read-only when connected | Correct project/environment and privacy-safe output; no raw stack or PII. |
| Edit isolated branch/worktree | Allowed | Stay inside assigned file ownership; no secret values or generated production data. |
| Commit focused branch changes | Allowed | Review diff, tests, attribution, and scope; never sign as the user. |
| Open/update draft PR | Allowed only when the user has authorized publication | Include evidence and blockers; never mark ready without required checks. |
| Push a non-protected feature branch | Explicit user authorization required | Confirm branch and commit set; do not force-push shared branches. |
| Merge PR or push `main` | Prohibited | Human repository owner only after protected checks and review. |
| Deploy preview | Explicit human approval | Preview-specific secrets/bindings, no production data, expiry/cleanup plan. |
| Deploy/rollback production | Prohibited for agents | Human release owner uses protected environment and records decision/evidence. |
| Change Cloudflare bindings, routes, DNS, KV, secrets | Prohibited | Human operator; two-person review for production secrets/routes. |
| Apply Supabase migration, grant, policy, function, or data mutation | Prohibited in production | Human database owner; staging rehearsal, diff, advisors, backup/rollback, live verifier. |
| Create disposable Auth users in protected test project | Allowed only through approved CI verifier | Controlled mailbox, unique users, unconditional cleanup, no real customer address. |
| Read or export customer rows | Prohibited by default | Named incident/support ticket, minimum fields, audited human approval. |
| Send Slack/email/support/customer message | Draft only | Human reviews recipient, content, disclosure, and attachments before send. |
| Enable PostHog/Sentry or session replay | Prohibited | Privacy/security approval plus canary payload and documented retention. Session replay remains off. |
| Configure/activate n8n workflow | Test instance only | Production activation requires workflow-owner and security approval. |
| Rotate or reveal a secret | Prohibited | Human operator rotates in provider/deployment secret store; never chat/prompt. |
| Activate billing/payment/trading | Prohibited | Out of scope for free beta; requires a separate approved program and threat model. |
| Destructive data operation | Prohibited | Human-only break-glass process with backup, scoped query, dry run, peer review, audit. |

## Specialist boundaries

| Specialist | May do | Must not do |
| --- | --- | --- |
| Lead Engineering Manager | Assign ownership, review evidence, sequence branches, stop release. | Merge own work, override red checks, convert blockers into assumptions. |
| Backend/Supabase Engineer | Draft schema/policy migrations, run local/staging tests, inspect read-only advisors. | Apply production SQL, expose service role, weaken RLS to make tests pass. |
| DevOps/Release Engineer | Draft workflows/runbooks, inspect checks, validate preview/prod readiness read-only. | Change live bindings, bypass protected environments, deploy production. |
| Product/UX and 3D specialists | Research, concepts, homepage-only code after approval, static fallbacks. | Change product-route behavior, invent metrics/testimonials/data, access customer data. |
| Frontend Architect | Implement semantic/fail-closed UI and client-safe configuration. | Add server secrets to `VITE_`, browser storage, URLs, source maps, or telemetry. |
| Integration Engineer | Verify package/import/config/health/test evidence and isolate optional adapters. | Treat installation as readiness or enable an external write without approval. |
| n8n Automation Engineer | Build exportable disabled workflows against mocks/test services. | Connect production credentials/data, activate schedules/webhooks, send messages. |
| Security/Privacy Engineer | Threat model, static tests, read-only control inspection, recommend staged changes. | Apply live revocations/migrations, reveal findings containing secret values, silently accept risk. |
| Performance Engineer | Measure bundles/WebGL/lifecycle using public/synthetic data. | Upload customer traces or enable invasive monitoring. |
| QA/Accessibility Engineer | Run deterministic and disposable-user tests; collect sanitized evidence. | Use real user accounts, payment methods, broker orders, or retain test PII. |
| SEO/Web Analysis Manager | Inspect public crawl/render metadata and draft changes. | Publish misleading structured data, customer counts, ratings, performance claims. |
| Support Operations Manager | Draft triage, acknowledgements, severity and escalation. | Read unrestricted customer data or send responses without human review. |
| Code Maintainer/Final Reviewer | Read-only completion audit and release recommendation. | Author last-minute unreviewed changes or approve missing evidence. |

## Production identity design

Use different principals for different surfaces. Never give one agent or workflow a credential bundle capable of both reading sensitive data and mutating deployment/database state.

| Principal | Minimum capability |
| --- | --- |
| CI build | Repository read, artifact write, no production secrets except a protected dedicated RLS test job. |
| Protected RLS verifier | Test-project URL/publishable/service key plus controlled mailbox; no Cloudflare, broker, payment, Slack, or deploy credentials. |
| Readiness monitor | Public GET endpoints only. |
| Sentry reader | `project:read`, `event:read`, `org:read`; no write/admin; sanitized output. |
| PostHog reader | One project, read-only analytics; no flags/experiments/project settings writes. |
| n8n workflow | Per-workflow scoped credential and endpoint allowlist; never StockPro service role or vault secret. |
| Support tool | Ticket-scoped fields, masked identifiers, no broker/payment payloads. |
| Human release operator | Protected deployment access with MFA and audit; separate from database owner where practical. |
| Human database owner | Migration/grant access with MFA, staging rehearsal, review, and audit; no routine agent access. |

## Approval record

Any approved external or production action must record:

1. Requester and human approver.
2. Exact environment, project, branch, commit, route, table, workflow, or message recipient.
3. Purpose and expected effect.
4. Data classes touched and least-privilege credential used.
5. Precondition evidence and dry-run/staging result.
6. Rollback/disable procedure and owner.
7. Time window or expiry.
8. Post-action verification with secrets and personal data redacted.

Silence, prior approval for a different action, a broad goal, or access to a credential is not approval.

## Supabase boundary

- Browser clients use only publishable/anon credentials and remain constrained by RLS and grants.
- Service-role/secret keys are Worker-only and bypass RLS. Agents must not receive them except inside the isolated protected verifier process.
- A healthy Supabase control plane does not prove the production Worker has correct bindings.
- Read-only inspection may enumerate schema, policies, grants, and advisor findings; it must not dump customer rows.
- Proposed grant/RLS changes are committed as reviewed migrations only after staging. An agent never applies them live.
- The protected verifier must create two unique disposable users, prove owner access and cross-user/anonymous denial, cover every server-only table, exercise the auth lifecycle, and clean up in `finally`.
- Never weaken a policy, use a bypass role, or switch to service-role testing merely to turn CI green.

## n8n and automation boundary

n8n must run as a standalone service with its own hostname, credentials, database, encryption key, logs, backups, and network policy. It is not embedded in the StockPro Worker and never receives general production credentials.

Every production workflow must be disabled by default and include:

- A narrow trigger and explicit allowed sender/origin.
- HMAC verification over the exact raw body, constant-time comparison, and secret rotation procedure.
- A timestamp/nonce or provider-supported replay bound where available.
- An immutable idempotency key and atomic claim before side effects.
- Payload schema, size limits, field allowlist, and PII/secret redaction.
- Per-source rate limit, retry budget with jitter, dead-letter path, and manual replay approval.
- Destination allowlist; no arbitrary URL, SQL, shell, template, or recipient from untrusted input.
- Test fixture, dry-run mode, observable correlation ID, and sanitized audit record.
- Kill switch and documented rollback/disable owner.

Automation may create an internal draft/ticket. It may not send customer communications, modify flags, deploy, change a subscription, invoke a broker action, or mutate customer financial/research data without a separate human approval at the side-effect boundary.

## Telemetry boundary

- PostHog accepts only the code allowlist and bounded pathnames. Autocapture, pageview, pageleave, session recording, persistence beyond memory, and person profiles remain disabled.
- Sentry keeps `sendDefaultPii=false` and tracing off. Before production enablement, scrub exception values, breadcrumbs, contexts, headers, cookies, bodies, user data, and URL query strings.
- Never attach email, phone, name, IP, access token, authorization header, cookie, OAuth state/code, broker ID/token, saved research text, symbol/search input, price/threshold, payment value, or webhook body.
- Agent output may report event counts and sanitized issue metadata. It may not print raw stack traces or personal tags.
- Empty PostHog/Sentry results mean unverified or no observed events, not healthy.

## Support and outbound communication

- Agents and workflows draft only. A human selects recipients and sends.
- Drafts use a ticket/correlation ID, not raw secrets or full financial payloads.
- High-severity incidents escalate to the named human incident owner; do not notify customers or providers autonomously.
- Do not paste tokens into Slack, email, tickets, screenshots, or chat. Use the provider/deployment secret store and reference only the variable name.
- Support access is time-bound, ticket-bound, field-minimized, and audited.

## Free-beta payment and broker boundary

The words `order`, `payment`, `subscription`, and `trade` in legacy types or placeholder routes do not grant authorization to activate them.

- Razorpay remains test-only and `paymentEnabled=false`, `live_disabled=true` in every readiness response.
- No real payment method or charge is used in QA.
- Broker integrations are read-only. Allowed provider operations are authentication/consent, profile, quote, historical candles, option chain, instrument metadata, status, and logout/disconnect.
- Any provider endpoint capable of placing/modifying/cancelling an order is denylisted and out of scope.
- Any request to activate payment or trading stops the free-beta workflow and starts a separate legal/product/security review.

## Break-glass and incident actions

Agents may recommend and draft the exact containment action, but a human executes it. The only safe automatic response is a pre-approved narrow kill switch that disables a workflow/feature without exposing data or enabling another capability.

Human break-glass sequence:

1. Identify the smallest affected feature/principal.
2. Disable the feature, route, workflow, or credential at its source.
3. Preserve sanitized evidence and correlation IDs.
4. Rotate/revoke the smallest credential set.
5. Validate isolation and cleanup with a reproducible test.
6. Record impact, decision, and follow-up owner.
7. Re-enable only through the normal approval and release gates.

## Completion gate

An agent may recommend `READY FOR INVITE-ONLY FREE BETA` only when the final commit and deployed candidate prove every required checklist item. It must otherwise report `NOT READY`, list the missing evidence, and leave payment/trading disabled. No specialist can approve its own production action or waive another specialist's gate.
