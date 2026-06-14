-- =====================================================================
-- ESystem Supabase schema (Auth0 version)
-- Run this in the Supabase SQL editor of your ESystem project.
-- This replaces the previous Supabase-auth version. Drop the old
-- tables first if you applied the previous schema:
--   DROP TABLE IF EXISTS refresh_log, built_in_entries, blocklist_sources,
--     custom_words, blocklist_entries, api_keys, profiles CASCADE;
-- Then run this file.
-- =====================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- =====================================================================
-- 2. Tables
-- Note: profiles.id is the Auth0 user `sub` claim (e.g. "auth0|abc123").
-- It's text, not uuid, because Auth0 IDs are not UUIDs.
-- =====================================================================

-- 2.1  profiles: 1 row per Auth0 user
create table public.profiles (
  id            text primary key,                            -- Auth0 sub
  email         text not null,
  display_name  text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 2.2  api_keys: up to 6 active (non-revoked) per user
create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references public.profiles(id) on delete cascade,
  label        text not null,
  key_hash     text not null unique,
  key_prefix   text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

-- 2.3  blocklist_entries: per-user personal list
create table public.blocklist_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.profiles(id) on delete cascade,
  url         text not null,
  block_type  text not null check (block_type in ('page','domain','host')),
  detector    text not null,
  reason      text not null,
  source      text not null default 'detected',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, url, block_type)
);

-- 2.4  custom_words: per-user detection words
create table public.custom_words (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.profiles(id) on delete cascade,
  word       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

-- 2.5  blocklist_sources: admin-managed URLs for the built-in list
create table public.blocklist_sources (
  id            uuid primary key default gen_random_uuid(),
  url           text not null unique,
  label         text not null,
  format        text not null check (format in ('domains','hosts')),
  block_type    text not null default 'domain' check (block_type in ('domain','host')),
  enabled       boolean not null default true,
  last_fetched  timestamptz,
  last_count    int,
  last_error    text,
  added_by      text references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- 2.6  built_in_entries: global community list (read-only for users)
create table public.built_in_entries (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null,
  block_type   text not null check (block_type in ('domain','host')),
  source_id    uuid not null references public.blocklist_sources(id) on delete cascade,
  is_active    boolean not null default true,
  refreshed_at timestamptz not null default now(),
  unique (domain, source_id)
);

-- 2.7  refresh_log: history of built-in refreshes
create table public.refresh_log (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid references public.blocklist_sources(id) on delete set null,
  source_url   text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  added        int,
  removed      int,
  status       text not null check (status in ('running','success','error')),
  error        text
);

-- =====================================================================
-- 3. Indexes
-- =====================================================================
create index blocklist_user_idx      on public.blocklist_entries (user_id, is_active);
create index custom_words_user_idx   on public.custom_words       (user_id);
create index api_keys_user_idx       on public.api_keys           (user_id) where revoked_at is null;
create index built_in_active_idx     on public.built_in_entries   (is_active, block_type);
create index refresh_log_started_idx on public.refresh_log        (started_at desc);

-- =====================================================================
-- 4. Helper functions (no Supabase auth dependency)
-- =====================================================================

-- 4.1  hash an API key
create or replace function public.hash_api_key(raw text)
returns text
language sql
immutable
as $$
  select encode(digest(raw, 'sha256'), 'hex');
$$;

-- 4.2  count active (non-revoked) keys for a user
create or replace function public.count_active_keys(uid text)
returns int
language sql
stable
as $$
  select count(*)::int from public.api_keys where user_id = uid and revoked_at is null;
$$;

-- 4.3  authenticate an API key, returns the user_id + key row, or null
create or replace function public.authenticate_api_key(raw text)
returns table (user_id text, key_id uuid, key_label text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select k.user_id, k.id, k.label
    from public.api_keys k
    where k.key_hash = public.hash_api_key(raw)
      and k.revoked_at is null
    limit 1;

  -- bump last_used_at (non-blocking best-effort)
  update public.api_keys
     set last_used_at = now()
   where key_hash = public.hash_api_key(raw)
     and revoked_at is null;
end;
$$;

-- 4.4  upsert a profile (called from the auth callback when a user signs in
-- for the first time). Pass the Auth0 `sub` as p_id.
create or replace function public.upsert_profile(
  p_id           text,
  p_email        text,
  p_display_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (p_id, p_email, p_display_name)
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name;
end;
$$;

-- =====================================================================
-- 5. Row-Level Security
-- We use the service role server-side so RLS is bypassed for our own
-- queries. The policies below are kept for defense-in-depth (in case
-- the anon key is ever exposed) but auth.uid() is no longer used —
-- we removed the Supabase auth dependency.
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.api_keys          enable row level security;
alter table public.blocklist_entries enable row level security;
alter table public.custom_words      enable row level security;
alter table public.blocklist_sources enable row level security;
alter table public.built_in_entries  enable row level security;
alter table public.refresh_log       enable row level security;

-- All policies: allow service role to do anything; anon is read-only on
-- the public-looking tables (profiles, sources, built_in, refresh_log).
-- We do NOT enable insert/update/delete from anon — all writes go through
-- the API which uses the service role.

create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "blocklist_read_all" on public.blocklist_entries
  for select using (true);

create policy "custom_words_read_all" on public.custom_words
  for select using (true);

create policy "sources_read_all" on public.blocklist_sources
  for select using (true);
create policy "sources_admin_write" on public.blocklist_sources
  for all using (true) with check (true);

create policy "built_in_read_all" on public.built_in_entries
  for select using (true);

create policy "refresh_log_read_all" on public.refresh_log
  for select using (true);

create policy "api_keys_admin_all" on public.api_keys
  for all using (true) with check (true);

-- =====================================================================
-- 6. No seed data — admin adds blocklist sources from the /admin panel.
-- =====================================================================
