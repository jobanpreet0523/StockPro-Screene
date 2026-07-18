# Launch today checklist

Audit date: 2026-07-18

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
| Bundle budget | PASS | Initial 92.97 KiB gzip (636.62 KiB below baseline); lazy hero 133.35 KiB gzip |
| Lighthouse LCP and CLS | PASS | Exact-source three-run mobile median LCP 1,981.7 ms and CLS 0; the LCP gate remains <=2.5s |
| Raster budget | PASS | AVIF 14.5 KB, WebP 32.3 KB, PNG 26.2 KB |

## Production configuration

| Requirement | Classification | Current production evidence |
| --- | --- | --- |
| Supabase project schema | PASS | 18 public tables exist; RLS enabled on all and live tables are empty |
| Supabase security advisor | PASS | Public SECURITY DEFINER execution revoked; no remaining WARN findings |
| Cloudflare Supabase bindings | BLOCKING | Protected GitHub secrets are present and the deploy workflow now synchronizes Worker secrets/table bindings, but the current production Worker still reports every table setup_required pending a reviewed main deployment |
| Auth | BLOCKING | /api/operations/readiness reports auth setup_required |
| Contact and waitlist storage | BLOCKING | Supabase binding absent; production waitlist health is setup_required |
| RLS two-user isolation | PASS | Protected run #237 proved two-user owner isolation, anonymous denial, service-only denial, recovery-link generation, and unconditional cleanup; a follow-up query found zero temporary users or rows |
| Authorized market provider | BLOCKING | Provider status is setup_required; CRT cannot run |
| CRT storage/provider | BLOCKING | Both report setup_required |
| Broker vault | OPTIONAL SETUP REQUIRED | Invite-only beta may report an explicit unavailable/setup-required state; genuine connections still require auth, Supabase bindings, encryption secret, and provider setup |
| Upstox | OPTIONAL EXTERNAL AUTH | Configure OAuth credentials, callback, vault, and run per-user read-only tests before enabling connection |
| Dhan sandbox | OPTIONAL EXTERNAL AUTH | Sandbox must remain developer-only and never be labelled live |
| Dhan live | OPTIONAL EXTERNAL AUTH | Subscription, static IP, permissions, gateway, and per-user consent required before enabling connection |
| Angel One | APPROVAL PENDING | Production reports setup_pending; connect remains disabled |
| Turnstile | PASS | Production operations readiness reports configured |
| Resend | NON-BLOCKING | Currently setup_required; acceptable only after database form storage works |
| PostHog | MANUAL ACTION REQUIRED | Connected project has no ingested event; production env reports setup required |
| Sentry exact production regression | MANUAL ACTION REQUIRED | Configure DSN and read-only audit access, then capture exact event stack/file/line |
| Razorpay test mode | NON-BLOCKING | Test credentials absent; live payment remains disabled |
| Algolia | NON-BLOCKING | Optional search is setup_required and UI states this |

## Required operator sequence

1. Review and merge the staged deploy workflow/config so the protected GitHub Supabase secrets are synchronized to Cloudflare without exposing the service-role key to Vite.
2. Confirm the production build receives only VITE_SUPABASE_URL and the publishable/anon key; configure Supabase redirect URLs for /account.
3. Deploy from protected main and verify every declared SUPABASE table binding in production.
4. Verify signup, email confirmation, login, refresh, reset, and logout. Retain protected run #237 as the two-account isolation evidence.
5. Submit the production contact form through Turnstile and confirm one contact_messages row.
6. Configure an authorized market provider; verify timestamp and source semantics before any live label.
7. Configure BROKER_ENCRYPTION_SECRET, provider credentials, and per-user Upstox/Dhan read-only tests.
8. Configure Sentry/PostHog build variables and verify privacy-safe events with no PII.
9. Run the full validation command list and production route, console, and sitemap checks.
10. Only after all BLOCKING rows pass: merge, deploy, create v1.0.0-beta, and publish release notes.
