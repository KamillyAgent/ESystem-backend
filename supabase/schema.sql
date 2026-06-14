-- =====================================================================
-- ESystem Supabase schema
-- Run this in the Supabase SQL editor of your NEW esystem project.
-- Order: extensions → tables → indexes → triggers → RLS policies
-- =====================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- =====================================================================
-- 2. Tables
-- =====================================================================

-- 2.1  profiles: 1:1 with auth.users
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text not null,
  display_name  text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 2.2  api_keys: up to 6 active (non-revoked) per user
create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
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
  user_id     uuid not null references public.profiles(id) on delete cascade,
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
  user_id    uuid not null references public.profiles(id) on delete cascade,
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
  enabled       boolean not null default true,
  last_fetched  timestamptz,
  last_count    int,
  last_error    text,
  added_by      uuid references public.profiles(id),
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
-- 4. Trigger: auto-create a profiles row when a new user signs in
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 5. Helper functions
-- =====================================================================

-- 5.1  hash an API key
create or replace function public.hash_api_key(raw text)
returns text
language sql
immutable
as $$
  select encode(digest(raw, 'sha256'), 'hex');
$$;

-- 5.2  count active (non-revoked) keys for a user
create or replace function public.count_active_keys(uid uuid)
returns int
language sql
stable
as $$
  select count(*)::int from public.api_keys where user_id = uid and revoked_at is null;
$$;

-- 5.3  authenticate an API key, returns the user_id + key row, or null
create or replace function public.authenticate_api_key(raw text)
returns table (user_id uuid, key_id uuid, key_label text)
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

-- =====================================================================
-- 6. Row-Level Security
-- =====================================================================

-- 6.1  profiles: a user can read/update their own row
alter table public.profiles          enable row level security;
alter table public.api_keys          enable row level security;
alter table public.blocklist_entries enable row level security;
alter table public.custom_words      enable row level security;
alter table public.blocklist_sources enable row level security;
alter table public.built_in_entries  enable row level security;
alter table public.refresh_log       enable row level security;

-- profiles: own row only
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- api_keys: own keys only (insert/update/delete go through service role)
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

-- blocklist_entries: own entries only
create policy "blocklist_select_own" on public.blocklist_entries
  for select using (auth.uid() = user_id);
create policy "blocklist_insert_own" on public.blocklist_entries
  for insert with check (auth.uid() = user_id);
create policy "blocklist_update_own" on public.blocklist_entries
  for update using (auth.uid() = user_id);
create policy "blocklist_delete_own" on public.blocklist_entries
  for delete using (auth.uid() = user_id);

-- custom_words: own words only
create policy "words_select_own" on public.custom_words
  for select using (auth.uid() = user_id);
create policy "words_insert_own" on public.custom_words
  for insert with check (auth.uid() = user_id);
create policy "words_delete_own" on public.custom_words
  for delete using (auth.uid() = user_id);

-- blocklist_sources + built_in_entries + refresh_log: readable by everyone,
-- writable only by service role (admin checks happen in API routes)
create policy "sources_read_all" on public.blocklist_sources
  for select using (true);
create policy "built_in_read_all" on public.built_in_entries
  for select using (true);
create policy "refresh_log_read_all" on public.refresh_log
  for select using (true);

-- =====================================================================
-- 7. Service-role-only tables: only the backend's service role writes them.
--    RLS is enabled but no policies exist, so anon/authenticated get
--    nothing — only the service role (bypasses RLS) can mutate.
-- =====================================================================

-- =====================================================================
-- 8. Seed: nothing. The admin will add blocklist sources from the
--    /admin panel after first login.
-- =====================================================================

-- =====================================================================
-- 9. Storage: not used in v1 (no avatars, no file uploads)
-- =====================================================================
