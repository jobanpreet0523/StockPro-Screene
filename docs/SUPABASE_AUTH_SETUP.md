# Supabase Auth setup

Stage 20 adds honest Supabase Auth scaffolding for StockPro. It does not create fake users, fake sessions, fake subscriptions, or fake broker connections.

## Required Worker environment

Configure these values as server-side Cloudflare Worker secrets or environment bindings:

```bash
AUTH_ENABLED=true
SUPABASE_AUTH_ENABLED=true # optional legacy alias
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_AUTH_REDIRECT_URL=https://stockpro1.qzz.io/account
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code. The service-role key is only for Worker-side admin/table operations.

## Optional frontend environment

If a future frontend Supabase client is approved, use publishable/anon values only:

```bash
VITE_AUTH_ENABLED=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_SUPABASE_AUTH_REDIRECT_URL=https://stockpro1.qzz.io/account
```

The current `/login` and `/signup` pages remain conservative. If these values are absent, they show `setup_required` and do not invent a user.

## Worker session source of truth

The frontend calls:

- `GET /api/auth/session`
- `POST /api/auth/logout`

`/api/auth/session` validates a Bearer token or `stockpro_session` cookie against Supabase Auth. If auth is not configured, it returns `setup_required`. If no session is present, it returns `unauthenticated`. It never returns a synthetic "Free User".

## Redirect URL

In Supabase dashboard, allow:

- `https://stockpro1.qzz.io/account`
- local development callback URLs only when actively testing

## Security notes

- Never use `raw_user_meta_data` for authorization decisions.
- Never store access tokens, refresh tokens, broker tokens, OTPs, or passwords in `localStorage`.
- Keep broker and billing actions server-mediated.
- Keep StockPro positioned as educational analytics, not investment advice.
