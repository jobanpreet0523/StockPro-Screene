# Closed beta launch plan

Stage 25 adds a closed-beta readiness page and feedback scaffold. It does not fake beta feedback, fake user access, fake live data, fake subscriptions, or fake broker connections.

## Readiness checks

The `/beta` page checks:

- waitlist storage
- auth status
- broker status
- billing test readiness
- market data provider
- news proxy
- ads configuration

The `/status` page should also show broker vault, broker REST readiness through market data, broker WebSocket status, payment live disabled, and SEO/launch verification coverage.

## Feedback storage

Configure server-side storage before collecting beta feedback:

```bash
SUPABASE_BETA_FEEDBACK_TABLE=beta_feedback
```

```sql
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null check (char_length(message) <= 1500),
  source_page text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

revoke all on table public.beta_feedback from anon, authenticated;
grant select, insert, update, delete on table public.beta_feedback to service_role;

create index if not exists beta_feedback_created_at_idx
on public.beta_feedback (created_at desc);
```

If storage is missing, `POST /api/beta/feedback` returns `setup_required` and no fake success is shown.

## Launch safety checklist

- No secrets in frontend code.
- No shared broker token.
- No fake broker-connected state.
- No live payment or hidden auto-payment.
- No order placement or trading.
- StockPro remains educational analytics only, not investment advice.
