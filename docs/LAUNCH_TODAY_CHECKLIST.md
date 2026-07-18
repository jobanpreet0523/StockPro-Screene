# Launch today checklist

Audit date: 2026-07-14

Final decision: **NOT READY - BLOCKERS LISTED**

The code branch is suitable for review, but the current production environment does not pass the gate for any public beta. Do not merge, deploy, or create v1.0.0-beta until every BLOCKING item below is verified in production.

## Code and experience

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Original lazy Three.js hero | PASS | One dynamic HeroFinancialScene chunk; static fallback renders first |
| WebGL, reduced-motion, mobile, low-power fallback | PASS | Capability and quality hooks plus Playwright coverage |
| Hidden and out-of-view pause | PASS | Visibility and intersection lifecycle; animation frame cancelled |
| WebGL disposal | PASS | Geometry, material, renderer, and context disposal on unmount |
| Ten major section visuals | PASS | Shared SVG/CSS visual system; no extra canvases |
| Minimum landing sections | PASS | 12 substantial sections plus footer |
| Route preservation | PASS | Existing 32 declared app routes retained |
| Main landing actions | PASS | Real router links and provider/setup states |
| Scanner dead controls and invented user count | PASS | Removed; copy and CSV operate only on provider rows |
| Fake/sample market data in code | PASS | Obsolete src/data.ts sample/generator module removed |
| Contact endpoint | PASS | /api/contact validates input, verifies Turnstile, and stores server-side |
| Password reset | PASS | Supabase resetPasswordForEmail flow exposed on login |
| Live payment | PASS | Disabled in code and production readiness |
| Order placement | PASS | No trading or execution route added |
| Broker token isolation | PASS | Per-user encrypted server storage; no browser/shared token path |
| Bundle budget | PASS | Initial 224.02 KiB gzip (505.57 KiB below baseline); lazy hero 132.73 KiB gzip |
| Lighthouse LCP and CLS | BLOCKING | Baseline LCP was 6.68s and CLS 0; optimized Linux CI audit must pass LCP <=2.5s and CLS <=0.1 before merge |
| Raster budget | PASS | AVIF 14.5 KB, WebP 32.3 KB, PNG 26.2 KB |

## Production configuration

| Requirement | Classification | Current production evidence |
| --- | --- | --- |
| Supabase project schema | PASS | 17 required public tables exist; RLS enabled on all |
| Supabase security advisor | PASS | Public SECURITY DEFINER execution revoked; no remaining WARN findings |
| Cloudflare Supabase bindings | BLOCKING | /api/database/readiness reports every table setup_required |
| Auth | BLOCKING | /api/operations/readiness reports auth setup_required |
| Contact and waitlist storage | BLOCKING | Supabase binding absent; production waitlist health is setup_required |
| RLS two-user isolation | MANUAL ACTION REQUIRED | Owner-scoped policies and automated cross-user tests exist; run two real accounts after bindings |
| Authorized market provider | BLOCKING | Provider status is setup_required; CRT cannot run |
| CRT storage/provider | BLOCKING | Both report setup_required |
| Broker vault | BLOCKING | Auth, Supabase bindings, encryption secret, and provider setup required |
| Upstox | MANUAL ACTION REQUIRED | Configure OAuth credentials, callback, vault, and run per-user read-only tests |
| Dhan sandbox | MANUAL ACTION REQUIRED | Sandbox must remain developer-only and never be labelled live |
| Dhan live | MANUAL ACTION REQUIRED | Subscription, static IP, permissions, gateway, and per-user consent required |
| Angel One | APPROVAL PENDING | Production reports setup_pending; connect remains disabled |
| Turnstile | PASS | Production operations readiness reports configured |
| Resend | NON-BLOCKING | Currently setup_required; acceptable only after database form storage works |
| PostHog | MANUAL ACTION REQUIRED | Connected project has no ingested event; production env reports setup required |
| Sentry exact production regression | MANUAL ACTION REQUIRED | Configure DSN and read-only audit access, then capture exact event stack/file/line |
| Razorpay test mode | NON-BLOCKING | Test credentials absent; live payment remains disabled |
| Algolia | NON-BLOCKING | Optional search is setup_required and UI states this |

## Required operator sequence

1. Bind the existing Supabase project URL, publishable or anon key, and server secret to Cloudflare; set SUPABASE_AUTH_ENABLED=true.
2. Add the matching VITE_SUPABASE_URL and publishable key at build time; configure Supabase redirect URLs for /account.
3. Configure every SUPABASE table binding from .env.example and redeploy.
4. Verify signup, email confirmation, login, refresh, reset, logout, and two-account isolation.
5. Submit the production contact form through Turnstile and confirm one contact_messages row.
6. Configure an authorized market provider; verify timestamp and source semantics before any live label.
7. Configure BROKER_ENCRYPTION_SECRET, provider credentials, and per-user Upstox/Dhan read-only tests.
8. Configure Sentry/PostHog build variables and verify privacy-safe events with no PII.
9. Run the full validation command list and production route, console, and sitemap checks.
10. Only after all BLOCKING rows pass: merge, deploy, create v1.0.0-beta, and publish release notes.
