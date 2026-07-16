# StockPro Homepage 3D and Free-Beta Master Plan

## Mission

Prepare StockPro for an invite-only free beta while keeping the visual redesign strictly limited to `/`. Preserve every product route, keep live payment and trade execution disabled, and never represent unverified market, broker, CRT, AI, or customer data as real.

## Branch strategy

- PR #47 (`agent/free-beta-3d-launch`) remains the free-beta foundation and readiness PR.
- CI/readiness defects are repaired in isolated branches and reviewed before integration into PR #47.
- `agent/homepage-full-3d-automation` is a stacked documentation/research branch until PR #47 is mergeable and green.
- Homepage implementation begins only after the required desktop/mobile concept approval gate.
- No agent pushes to `main`, merges its own work, or enables production payment/trading.

## Phases

1. Evidence: inspect PR #47, workflow failures, production and preview readiness, current homepage, dependencies, and route scope.
2. Stabilize PR #47: fix genuine Auth/RLS and deployment/readiness defects without weakening gates.
3. Research and concept: current-source matrix, original ten-scene storyboard, desktop/mobile concepts, explicit user approval.
4. Homepage implementation: one lazy WebGL renderer, semantic HTML content, adaptive quality, static fallbacks, no product-page redesign.
5. Integrations and operations: readiness matrix, secure standalone n8n contracts, monitoring and operator runbooks.
6. Verification: functional, lifecycle, accessibility, visual, security, SEO, bundle, and three-run Lighthouse evidence.
7. Release: draft PR, preview, final review, external-action list, and evidence-backed launch decision.

## Global acceptance criteria

- Required CI checks are green on the final candidate.
- LCP <= 2.5 s, CLS <= 0.1, target INP <= 200 ms, and median Lighthouse evidence from at least three runs.
- One active homepage WebGL context, no duplicate renderer, and no resource/context leak across route changes.
- 3D lazy chunk <= 250 KiB gzip; each static fallback <= 150 KiB.
- Zero critical axe violations, uncaught homepage errors, dead homepage CTAs, exposed secrets, fabricated financial states, order placement, live payment, or shared broker tokens.
- Existing product routes retain their visual behavior except narrowly necessary launch/security/accessibility fixes.

## Stop and escalate

Stop for user/operator action when completion requires credentials, provider approval, broker OAuth, Cloudflare binding changes, payment activation, a production mutation, or concept approval. Record the exact external action; do not replace missing evidence with a claim.
