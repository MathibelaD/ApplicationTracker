-- Quick add + job listing screenshots
-- Run after 20261026000000_init.sql.

-- Quick-added applications may start with just a link and/or a screenshot,
-- so company and role become optional (the length checks still apply when set).
alter table public.applications alter column company drop not null;
alter table public.applications alter column role drop not null;

-- ---------------------------------------------------------------------------
-- Screenshots of the job listing
-- ---------------------------------------------------------------------------

create table if not exists public.job_screenshots (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_path       text not null unique,
  file_name       text,
  file_size       bigint,
  mime_type       text,
  width           integer,
  height          integer,
  created_at      timestamptz not null default now()
);

create index if not exists job_screenshots_application_id_idx on public.job_screenshots (application_id);
create index if not exists job_screenshots_user_id_idx on public.job_screenshots (user_id);

alter table public.job_screenshots enable row level security;

drop policy if exists "screenshots: owner select" on public.job_screenshots;
drop policy if exists "screenshots: owner insert" on public.job_screenshots;
drop policy if exists "screenshots: owner delete" on public.job_screenshots;

create policy "screenshots: owner select" on public.job_screenshots
  for select to authenticated using (user_id = (select auth.uid()));
create policy "screenshots: owner insert" on public.job_screenshots
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "screenshots: owner delete" on public.job_screenshots
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: private bucket, one folder per user (<user_id>/<application_id>/...)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "screenshots: owner read"   on storage.objects;
drop policy if exists "screenshots: owner insert" on storage.objects;
drop policy if exists "screenshots: owner delete" on storage.objects;

create policy "screenshots: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "screenshots: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "screenshots: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = (select auth.uid())::text);
