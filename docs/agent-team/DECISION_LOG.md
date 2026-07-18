# Decision Log

## 2026-07-16

- Keep PR #47 draft and focused on free-beta foundation/readiness; do not add the full ten-scene redesign to it.
- Use `agent/homepage-full-3d-automation` as a temporary stacked branch from local PR work until PR #47 is green/mergeable, then rebase onto updated `main`.
- Preserve the current honest HTML information architecture and verified/setup-required states; redesign only the homepage visual/narrative layer.
- Use one homepage WebGL renderer with scene-state transitions; do not create a canvas per section.
- Treat mobile portrait as a sibling design, add a mobile landscape concept because the scene is 3D, and default low-power/save-data/reduced-motion users to static or simplified output.
- Require concept approval before homepage code, renderer work, or final asset generation.
- Present one coherent concept set for desktop, mobile portrait, and mobile landscape using the original visual grammar `range / layer / gate / path / boundary / container / state`; the set was shown in the Codex task and approved by the user's `approve all` response on 2026-07-16. `docs/design-research/HOMEPAGE_VISUAL_CONTRACT.md` is the binding semantic and technical contract.
- Keep generated concept labels and readiness states illustrative only. Production copy, provider states, values, and controls must remain evidence-backed semantic HTML rather than raster or canvas content.
- Install Ponytail only as a Codex plugin; never add it to StockPro dependencies.
- Keep n8n as a separately deployed automation service with no broker tokens, portfolio values, arbitrary public-shell execution, autonomous merge, or payment authority.
- Transfer temporary `package.json` ownership from the Integration Engineer to the lead coordinator after its focused commit solely to add the reviewed `verify:n8n-contracts` and combined security/integration CI aliases; no dependency versions or lockfile entries changed.
- Transfer temporary `package.json` ownership to the lead coordinator for the approved homepage QA aliases and post-build `test:landing-3d` CI gate; no dependency versions or lockfile entries changed.
- Discover lazy-loaded story sections with a short-lived `MutationObserver`, then use one requestAnimationFrame-throttled geometry tracker for deterministic scene activation. The earlier one-shot IntersectionObserver lookup ran before deferred sections mounted and could leave the renderer paused on scene 1.
- Keep the production-readiness result honest: on 2026-07-16 the live endpoint returned 15 failures, including auth/Supabase/broker/storage setup requirements and a `/api/contact` contract mismatch. Homepage completion does not imply production readiness.
- Split provider queries, auth-aware CRT state, product cards, and sections 2-10 into delayed `LandingPrimarySections`; this preserves the HTML-first hero. The intermediate measurement reduced initial JavaScript to 92.86 KiB gzip and mobile median LCP from 2,719.0 ms to 2,471.5 ms with CLS 0; the exact-source final measurement is recorded below.
- Treat genuine broker OAuth as `MANUAL_EXTERNAL_AUTH_REQUIRED` until a human-authorized test succeeds.

## 2026-07-18

- Reject the first final-maintainer pass until Chromium is installed before CI invokes Playwright, visual baselines are portable and full-page, mobile landscape is touch-aware/static, SPA disposal is proven, asynchronous provider state is reactive, and a below-fold chunk failure cannot blank the homepage.
- Create only the initial scene graph at renderer startup, instantiate later scenes on demand, and use `InstancedMesh` for repeated candle/module geometry. Expose 60/30 FPS quality targets and measure scene-setup and synthetic interaction budgets without misrepresenting them as field telemetry.
- Keep the live launch decision blocked: the Supabase project is active with 18 RLS-enabled public tables and no lingering automated test users/rows, but the refreshed production Worker probe still reports 10 genuine failures after optional broker setup states are classified correctly; PostHog has no ingested event and Sentry lacks read-only audit credentials.
- Keep nonessential homepage modules off the initial interaction path: optional sections hydrate immediately on pointer or scroll intent and use a ten-second idle fallback.
- Load provider-backed search code and validation schemas only after search focus or pointer intent; the labeled search field remains in the initial HTML-rendered React shell.
- Accept the exact-source three-run mobile Lighthouse median of 1,981.7 ms LCP with CLS 0; the 2,500 ms LCP assertion was not weakened.
- Treat protected GitHub Actions run #237 as the RLS release evidence: two-user owner isolation, anonymous denial, service-only denial, recovery-link generation without sending email, and unconditional cleanup all passed; an independent post-run query found zero temporary users and rows.
- Synchronize Supabase Worker secrets and table bindings only through the protected main deployment workflow. The browser build receives the URL and publishable/anon key; the service-role key remains Worker-only. This code change does not imply that the current production Worker has been redeployed.
- Classify broker-provider and broker-vault setup states as optional, honest invite-beta gates. No connection is enabled until its external credentials/approval and per-user read-only tests exist; paid launch and order execution remain out of scope.
- Use deterministic static/reduced-motion output for full-page desktop visual regression. Playwright tiles long screenshots and cannot reliably preserve a single sticky GPU canvas across off-screen tiles; a separate focused desktop viewport baseline continues to assert real WebGL pixels against the disabled fallback at the unchanged 3% threshold.
- Record the 2026-07-18 post-deploy probes as 8 branch-preview failures and 10 production failures. Both still lack auth and required Supabase/storage/waitlist configuration; production also serves the older `/api/contact` contract. Optional broker provider/vault setup states are reported but no longer inflate the failure count.
