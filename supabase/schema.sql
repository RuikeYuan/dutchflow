-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Creates a profiles table that tracks premium membership per user.
-- Only the service role (used server-side by the app's API functions) can set
-- is_premium to true; signed-in users can only read their own row.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- To grant someone premium manually for now (no payment flow yet):
--   update public.profiles set is_premium = true where id = '<user-uuid-from-auth-users-table>';
