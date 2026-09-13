-- Run once in the Supabase SQL Editor. Moves account sync storage from
-- Vercel KV into Postgres so changes can push instantly via Supabase Realtime
-- instead of relying on polling.

create table if not exists public.sync_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sync_data enable row level security;

drop policy if exists "Users can read own sync data" on public.sync_data;
create policy "Users can read own sync data"
  on public.sync_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sync data" on public.sync_data;
create policy "Users can insert own sync data"
  on public.sync_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sync data" on public.sync_data;
create policy "Users can update own sync data"
  on public.sync_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.sync_data;
