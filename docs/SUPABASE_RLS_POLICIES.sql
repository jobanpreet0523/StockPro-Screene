-- Apply after SUPABASE_FULL_SCHEMA.sql.
-- Service-role Worker requests bypass RLS. Browser clients receive only explicitly allowed rows.

alter table public.user_profiles enable row level security;
alter table public.waitlist_leads enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.contact_messages enable row level security;
alter table public.broker_connections enable row level security;
alter table public.broker_connection_events enable row level security;
alter table public.broker_oauth_states enable row level security;
alter table public.crt_scan_runs enable row level security;
alter table public.crt_scan_results enable row level security;
alter table public.market_instruments enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.alerts enable row level security;
alter table public.saved_screeners enable row level security;
alter table public.saved_research enable row level security;
alter table public.trial_subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.razorpay_webhook_events enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own" on public.user_profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own" on public.user_profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own" on public.user_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "watchlists_own_all" on public.watchlists;
create policy "watchlists_own_all" on public.watchlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "watchlist_items_own_all" on public.watchlist_items;
create policy "watchlist_items_own_all" on public.watchlist_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "alerts_own_all" on public.alerts;
create policy "alerts_own_all" on public.alerts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "saved_screeners_own_all" on public.saved_screeners;
create policy "saved_screeners_own_all" on public.saved_screeners for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "saved_research_own_all" on public.saved_research;
create policy "saved_research_own_all" on public.saved_research for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "beta_feedback_insert_own" on public.beta_feedback;
create policy "beta_feedback_insert_own" on public.beta_feedback for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "crt_runs_select_own" on public.crt_scan_runs;
create policy "crt_runs_select_own" on public.crt_scan_runs for select to authenticated using (user_id = auth.uid());
drop policy if exists "crt_results_select_own" on public.crt_scan_results;
create policy "crt_results_select_own" on public.crt_scan_results for select to authenticated using (
  exists (select 1 from public.crt_scan_runs r where r.id = scan_run_id and r.user_id = auth.uid())
);

-- Intentionally no browser policies:
-- waitlist_leads/contact_messages are accepted only by validated Worker endpoints.
-- broker_connections, broker_connection_events, and broker_oauth_states contain
-- vault, audit, and one-time OAuth records.
-- market_instruments and CRT writes are provider ingestion records.
-- trial_subscriptions, billing_events, and razorpay_webhook_events are webhook-controlled.
-- Admin views use the Worker service role plus a separate server-side admin token.
