# Supabase Auth production setup

StockPro uses the Supabase browser client for email/password authentication and verifies every access token again in the Worker before returning private account data. It never creates a fake user or session.

## Required server bindings

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AUTH_ENABLED=true` or `AUTH_ENABLED=true`

The service-role key is server-only. Never use a `VITE_` prefix for it.

## Required browser build variables

- `VITE_AUTH_ENABLED=true`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_AUTH_REDIRECT_URL=https://stockpro1.qzz.io/account`

## Supabase dashboard

1. Enable Email authentication.
2. Add `https://stockpro1.qzz.io/account` to allowed redirect URLs.
3. Configure email confirmation for production accounts.
4. Apply `SUPABASE_FULL_SCHEMA.sql` and `SUPABASE_RLS_POLICIES.sql`.
5. Keep leaked-password protection and rate limits enabled.

## Verification

1. Create an account at `/signup` after Turnstile verification.
2. Confirm the account by email and log in at `/login`.
3. Confirm `/api/auth/session` reports `authenticated` without returning any token.
4. Refresh `/account`, then sign out and confirm `unauthenticated`.

Never store Supabase or broker tokens in application-managed local or session storage. Supabase may persist its own auth session through its audited client library.
