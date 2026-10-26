-- Application Tracker schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Every table is scoped to the signed-in user through row level security,
-- so multiple accounts can share one project without seeing each other's data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- CV library
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  file_name   text not null,
  file_path   text not null unique,
  file_size   bigint,
  mime_type   text,
  created_at  timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company          text not null check (char_length(company) between 1 and 160),
  role             text not null check (char_length(role) between 1 and 160),
  location         text,
  work_mode        text check (work_mode in ('onsite', 'hybrid', 'remote')),
  employment_type  text check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'graduate', 'freelance')),
  job_url          text,
  source           text,
  salary           text,
  job_description  text,
  status           text not null default 'applied'
                   check (status in ('wishlist', 'applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  applied_on       date,
  closing_date     date,
  cv_id            uuid references public.documents (id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_cv_id_idx on public.applications (cv_id);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stages (screening calls, interviews, panels, ...)
-- ---------------------------------------------------------------------------

create table if not exists public.application_stages (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 160),
  kind            text not null default 'interview'
                  check (kind in ('screening', 'interview', 'technical', 'assessment', 'final', 'other')),
  scheduled_at    timestamptz,
  outcome         text not null default 'scheduled'
                  check (outcome in ('scheduled', 'awaiting', 'passed', 'unsuccessful')),
  meeting_link    text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists application_stages_application_id_idx on public.application_stages (application_id);
create index if not exists application_stages_user_id_idx on public.application_stages (user_id);

-- ---------------------------------------------------------------------------
-- Assignments / take-home tasks
-- ---------------------------------------------------------------------------

create table if not exists public.assignments (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 160),
  link            text,
  due_at          timestamptz,
  status          text not null default 'todo'
                  check (status in ('todo', 'in_progress', 'submitted')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists assignments_application_id_idx on public.assignments (application_id);
create index if not exists assignments_user_id_idx on public.assignments (user_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.documents          enable row level security;
alter table public.applications       enable row level security;
alter table public.application_stages enable row level security;
alter table public.assignments        enable row level security;

-- documents
drop policy if exists "documents: owner select" on public.documents;
drop policy if exists "documents: owner insert" on public.documents;
drop policy if exists "documents: owner update" on public.documents;
drop policy if exists "documents: owner delete" on public.documents;

create policy "documents: owner select" on public.documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "documents: owner insert" on public.documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "documents: owner update" on public.documents
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "documents: owner delete" on public.documents
  for delete to authenticated using (user_id = (select auth.uid()));

-- applications
drop policy if exists "applications: owner select" on public.applications;
drop policy if exists "applications: owner insert" on public.applications;
drop policy if exists "applications: owner update" on public.applications;
drop policy if exists "applications: owner delete" on public.applications;

create policy "applications: owner select" on public.applications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "applications: owner insert" on public.applications
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (cv_id is null or exists (
      select 1 from public.documents d where d.id = cv_id and d.user_id = (select auth.uid())
    ))
  );
create policy "applications: owner update" on public.applications
  for update to authenticated using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and (cv_id is null or exists (
      select 1 from public.documents d where d.id = cv_id and d.user_id = (select auth.uid())
    ))
  );
create policy "applications: owner delete" on public.applications
  for delete to authenticated using (user_id = (select auth.uid()));

-- application_stages
drop policy if exists "stages: owner select" on public.application_stages;
drop policy if exists "stages: owner insert" on public.application_stages;
drop policy if exists "stages: owner update" on public.application_stages;
drop policy if exists "stages: owner delete" on public.application_stages;

create policy "stages: owner select" on public.application_stages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "stages: owner insert" on public.application_stages
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "stages: owner update" on public.application_stages
  for update to authenticated using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "stages: owner delete" on public.application_stages
  for delete to authenticated using (user_id = (select auth.uid()));

-- assignments
drop policy if exists "assignments: owner select" on public.assignments;
drop policy if exists "assignments: owner insert" on public.assignments;
drop policy if exists "assignments: owner update" on public.assignments;
drop policy if exists "assignments: owner delete" on public.assignments;

create policy "assignments: owner select" on public.assignments
  for select to authenticated using (user_id = (select auth.uid()));
create policy "assignments: owner insert" on public.assignments
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "assignments: owner update" on public.assignments
  for update to authenticated using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "assignments: owner delete" on public.assignments
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: private bucket for CV files, one folder per user (<user_id>/...)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cvs: owner read"   on storage.objects;
drop policy if exists "cvs: owner insert" on storage.objects;
drop policy if exists "cvs: owner update" on storage.objects;
drop policy if exists "cvs: owner delete" on storage.objects;

create policy "cvs: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cvs: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cvs: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cvs: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
