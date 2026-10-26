-- "My skills": the skills each user says they have, used for the gap view.
-- Run after 20261026010000_screenshots.sql.

create table if not exists public.user_skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  created_at  timestamptz not null default now()
);

-- One entry per skill per user, ignoring case ("React" = "react").
create unique index if not exists user_skills_user_name_idx on public.user_skills (user_id, lower(name));

alter table public.user_skills enable row level security;

drop policy if exists "user_skills: owner select" on public.user_skills;
drop policy if exists "user_skills: owner insert" on public.user_skills;
drop policy if exists "user_skills: owner delete" on public.user_skills;

create policy "user_skills: owner select" on public.user_skills
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_skills: owner insert" on public.user_skills
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_skills: owner delete" on public.user_skills
  for delete to authenticated using (user_id = (select auth.uid()));
