# StockPro broker token vault setup

Stage 21 prepares per-user encrypted broker-token storage for future data-only broker connections. It does not place, modify, or cancel orders. It does not use one owner/shared broker token for all users.

## Required Worker environment

```bash
SUPABASE_AUTH_ENABLED=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BROKER_TOKEN_STORAGE=supabase
BROKER_ENCRYPTION_SECRET=at-least-32-random-characters
DHAN_CLIENT_ID=your-dhan-client-id
UPSTOX_CLIENT_ID=your-upstox-client-id
UPSTOX_CLIENT_SECRET=your-upstox-client-secret
UPSTOX_REDIRECT_URI=https://stockpro1.qzz.io/api/broker/upstox/callback
```

`BROKER_ENCRYPTION_SECRET` must be a Worker secret. Never expose it in frontend code.

## Token storage rules

- Require an authenticated user before accepting a broker token.
- Encrypt tokens in the Worker with Web Crypto before persistence.
- Store only encrypted token material in Supabase.
- Never return raw broker tokens to the frontend.
- Never store broker tokens in `localStorage`.
- Store unverified tokens as `pending_verification`; show `connected` only after provider verification succeeds.

## Broker connections table

This table is service-role-only. Do not grant browser roles direct access.

```sql
create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('dhan', 'upstox', 'angel', 'zerodha')),
  encrypted_token text not null,
  token_iv text not null,
  token_algorithm text not null default 'AES-GCM',
  status text not null default 'pending_verification'
    check (status in ('pending_verification', 'connected', 'expired', 'revoked')),
  connected_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.broker_connections enable row level security;

revoke all on table public.broker_connections from anon, authenticated;
grant select, insert, update, delete on table public.broker_connections to service_role;

create index if not exists broker_connections_user_id_idx
on public.broker_connections (user_id);
```

Because access is service-role-only, the browser must use Worker routes such as `/api/broker/status` and `/api/broker/dhan/connect`; it must not query this table directly.

## Worker routes

- `GET /api/broker/health` reports setup status for Auth, storage, encryption, and provider credentials.
- `GET /api/broker/status` requires an authenticated user and returns only connection metadata. It never returns raw tokens.
- `POST /api/broker/dhan/connect` accepts a user-supplied Dhan token only after authentication, encrypts it, stores `pending_verification`, and does not show connected until provider verification succeeds.
- `POST /api/broker/logout` revokes only the authenticated user's broker connection.
- `GET /api/broker/upstox/start` is an OAuth scaffold and does not create a connection.
- `GET /api/broker/upstox/callback` is a callback scaffold and does not exchange or expose tokens until final provider approval is implemented.

## Health check

Use `GET /api/broker/health` to verify:

- auth configured
- token vault configured
- storage configured
- provider configured
- no shared broker token
- order placement disabled
