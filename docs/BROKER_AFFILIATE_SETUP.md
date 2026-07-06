# Broker Connection and Affiliate Setup

Stage 16 provides a conservative foundation. Broker connections remain `setup_required` until authenticated per-user identity, encrypted token storage, and approved broker credentials are deployed. No order placement or trading routes are included.

## Per-user broker configuration

Configure server-side Worker bindings and secrets:

```text
BROKER_DATA_PROVIDER=none
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_REDIRECT_URI=https://stockpro1.qzz.io/api/broker/upstox/callback
DHAN_CLIENT_ID=
BROKER_TOKEN_STORAGE=supabase
BROKER_ENCRYPTION_SECRET=
```

`BROKER_ENCRYPTION_SECRET` should be a strong random secret of at least 32 characters. Broker client secrets and access tokens must never be sent to frontend code or stored in `localStorage`. Do not add a shared `DHAN_ACCESS_TOKEN` or any other owner token as a public feed.

Every broker authorization must be tied to the authenticated StockPro user. One user’s token and broker data must never be reused for another user. Upstox OAuth state must be unpredictable, short-lived, single-use, and bound to the initiating user before the callback exchanges an authorization code. Tokens should be encrypted before persistence and decrypted only inside trusted server code.

The current routes do not exchange or store tokens. They report `setup_required` rather than faking a connected broker.

## Suggested private broker-token table

Use a private schema or a server-only table. If a table is placed in `public`, enable RLS and revoke browser roles:

```sql
create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('dhan', 'upstox', 'angel', 'zerodha')),
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.broker_connections enable row level security;
revoke all on table public.broker_connections from anon, authenticated;
grant select, insert, update, delete on table public.broker_connections to service_role;
create index if not exists broker_connections_user_id_idx on public.broker_connections (user_id);
```

The service-role or secret key stays in Worker configuration only. Validate the authenticated user server-side before every lookup or mutation.

## Affiliate configuration

Affiliate links must be approved by each broker’s partner program before activation:

```text
DHAN_AFFILIATE_URL=
UPSTOX_AFFILIATE_URL=
ANGEL_AFFILIATE_URL=
ZERODHA_AFFILIATE_URL=
AFFILIATE_TRACKING_ENABLED=false
SUPABASE_AFFILIATE_CLICKS_TABLE=affiliate_clicks
```

Create server-only click storage:

```sql
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  broker text not null check (broker in ('dhan', 'upstox', 'angel', 'zerodha')),
  source_page text not null check (char_length(source_page) <= 500),
  user_id uuid references auth.users(id) on delete set null,
  clicked_at timestamptz not null default now()
);

alter table public.affiliate_clicks enable row level security;
revoke all on table public.affiliate_clicks from anon, authenticated;
grant select, insert on table public.affiliate_clicks to service_role;
create index if not exists affiliate_clicks_clicked_at_idx on public.affiliate_clicks (clicked_at desc);
create index if not exists affiliate_clicks_broker_idx on public.affiliate_clicks (broker);
```

The Stage 16 API records a click only after storage and an approved HTTPS destination are configured. Its response always keeps `conversion: false`. A click is not a conversion or commission.

Existing broker users can connect their own accounts but cannot automatically be moved under a StockPro affiliate relationship. Affiliate commission applies only when a user opens a new account through an approved StockPro partner link and the broker partner program independently attributes it.

## Safety invariants

- Broker tokens are per-user only.
- No owner broker token is shared with public users.
- No passwords or OTPs are collected.
- No order placement, modification, or cancellation is implemented.
- No fake live data, affiliate conversion, or commission is reported.
- StockPro remains educational analytics, not investment advice.
