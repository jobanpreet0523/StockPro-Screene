# Agent Release Policy

Agents may prepare and verify releases but cannot merge, push `main`, deploy/rollback production, mutate bindings/DNS/secrets, or apply production migrations. The repository owner or designated human operator performs those actions through protected environments.

## READY evidence

Release Authority may recommend READY only for the exact commit after mandatory typecheck/build/security/plugin/n8n/agent/visual/E2E/accessibility/Lighthouse/RLS/readiness gates pass at their required scope; preview passes; rollback is identified; no secrets or fake states exist; and payment/trading remain disabled. Missing or indirect evidence means NOT READY.

## Staged flow

1. Isolated branch and reviewed diff.
2. Deterministic local and generated-merge gates.
3. Correctly bound preview and readiness validation.
4. Security, QA, and Release Authority review.
5. Scoped human approval record.
6. Human protected-environment production action, one at a time.
7. Post-action readiness, telemetry state, and rollback evidence.

Production workflows must be manual-dispatch or protected-environment gated, use `cancel-in-progress: false`, and never accept an arbitrary untrusted ref or direct-push main. Branch protection and required production reviewers are manual external configuration and must be verified in GitHub settings.

Mission B is stacked from PR #48's validated head. Its PR must target `agent/homepage-full-3d-automation` until PR #48 is human-merged, or be rebased onto the eventual main and revalidated. Never open it against main while that would mix Mission A history.
