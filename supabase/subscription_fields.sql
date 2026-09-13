-- Run once in the Supabase SQL Editor. Adds subscription detail fields so the
-- profile page can show renewal/trial dates without calling Stripe live.

alter table public.profiles add column if not exists subscription_status text;
alter table public.profiles add column if not exists current_period_end timestamptz;
alter table public.profiles add column if not exists trial_end timestamptz;
