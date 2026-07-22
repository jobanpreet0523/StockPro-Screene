-- Apply only through the reviewed Supabase migration workflow.
-- This closes cross-tenant parent references while preserving owner CRUD.
drop policy if exists "watchlist_items_own_all" on public.watchlist_items;

create policy "watchlist_items_own_all"
on public.watchlist_items
for all
to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.watchlists where id = watchlist_id and user_id = (select auth.uid()))
)
with check (
  user_id = (select auth.uid()) and exists (select 1 from public.watchlists where id = watchlist_id and user_id = (select auth.uid()))
);
