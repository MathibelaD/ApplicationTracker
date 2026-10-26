-- Application goals: "apply to N jobs per day / week / month".
-- Run after 20261026020000_user_skills.sql.

create table if not exists public.application_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  period         text not null check (period in ('day', 'week', 'month')),
  target         integer not null check (target between 1 and 100),
  -- Daily goals only: weekends don't count against you.
  weekdays_only  boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- At most one goal per period, so a daily and a weekly goal can run side by side.
  unique (user_id, period)
);

drop trigger if exists application_goals_set_updated_at on public.application_goals;
create trigger application_goals_set_updated_at
  before update on public.application_goals
  for each row execute function public.set_updated_at();

alter table public.application_goals enable row level security;

drop policy if exists "goals: owner select" on public.application_goals;
drop policy if exists "goals: owner insert" on public.application_goals;
drop policy if exists "goals: owner update" on public.application_goals;
drop policy if exists "goals: owner delete" on public.application_goals;

create policy "goals: owner select" on public.application_goals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "goals: owner insert" on public.application_goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "goals: owner update" on public.application_goals
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals: owner delete" on public.application_goals
  for delete to authenticated using (user_id = (select auth.uid()));
