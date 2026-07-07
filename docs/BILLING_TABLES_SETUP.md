# StockPro billing tables setup

Stage 24 adds billing readiness and webhook scaffolding. It does not fake active subscriptions and does not enable live payment.

## Subscriptions table

Use the Worker/service role for subscription writes. Do not grant direct browser access.

```sql
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'pro' check (plan in ('free', 'pro', 'premium')),
  status text not null default 'not_started'
    check (status in ('not_started', 'trialing', 'active', 'cancelled', 'expired', 'setup_required')),
  provider text not null default 'razorpay',
  provider_subscription_id text,
  trial_start timestamptz,
  trial_end timestamptz,
  next_charge_at timestamptz,
  auto_renew_consent boolean not null default false,
  live_payment_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.subscriptions enable row level security;

revoke all on table public.subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

create index if not exists subscriptions_user_id_idx
on public.subscriptions (user_id);
```

`live_payment_enabled` must remain false until final manual approval.

## Billing events table

Webhook processing must be idempotent. Store the provider event id with a unique constraint.

```sql
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  provider text not null default 'razorpay',
  payload_json jsonb not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'error')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.billing_events enable row level security;

revoke all on table public.billing_events from anon, authenticated;
grant select, insert, update, delete on table public.billing_events to service_role;

create index if not exists billing_events_event_type_idx
on public.billing_events (event_type);
```

## Trial events table

Use this table to audit test-mode trial intent and cancellation requests without pretending a subscription is active.

```sql
create table if not exists public.trial_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('trial_requested', 'trial_cancel_requested', 'setup_required', 'error')),
  provider text not null default 'razorpay',
  auto_renew_consent boolean not null default false,
  live_payment_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.trial_events enable row level security;

revoke all on table public.trial_events from anon, authenticated;
grant select, insert, update, delete on table public.trial_events to service_role;

create index if not exists trial_events_user_id_idx
on public.trial_events (user_id);
```

`live_payment_enabled` must remain false. The Worker should return `setup_required` if this storage is missing.

## Supabase Data API note

New Supabase projects may not expose new tables to the Data API automatically. For these sensitive tables, keep browser roles revoked and perform access through Worker APIs using the service role only.

## Manual checks

- `/api/billing/readiness` returns `setup_required` until all test-mode env vars exist.
- Live Razorpay keys are rejected for this stage.
- Webhook signatures are verified before storage.
- Duplicate webhook event ids do not create duplicate logical events.
- `/status` shows “Payment live mode disabled.”
