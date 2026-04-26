-- Saved reactions (the user's "vault")
create table if not exists public.saved_reactions (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_at timestamptz not null default now(),
  vibe_label text not null,
  cultural_context text not null,
  reason text not null,
  match_score numeric not null,
  image_url text not null,
  image_query text not null,
  source_label text not null,
  source_url text not null,
  tags text[] not null default '{}',
  primary key (user_id, id)
);

alter table public.saved_reactions enable row level security;

drop policy if exists "saved_reactions_select_own" on public.saved_reactions;
drop policy if exists "saved_reactions_insert_own" on public.saved_reactions;
drop policy if exists "saved_reactions_update_own" on public.saved_reactions;
drop policy if exists "saved_reactions_delete_own" on public.saved_reactions;

create policy "saved_reactions_select_own" on public.saved_reactions
  for select using (auth.uid() = user_id);
create policy "saved_reactions_insert_own" on public.saved_reactions
  for insert with check (auth.uid() = user_id);
create policy "saved_reactions_update_own" on public.saved_reactions
  for update using (auth.uid() = user_id);
create policy "saved_reactions_delete_own" on public.saved_reactions
  for delete using (auth.uid() = user_id);

create index if not exists saved_reactions_user_saved_at_idx
  on public.saved_reactions (user_id, saved_at desc);


-- Recent searches (per-user history of queries)
create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

alter table public.recent_searches enable row level security;

drop policy if exists "recent_searches_select_own" on public.recent_searches;
drop policy if exists "recent_searches_insert_own" on public.recent_searches;
drop policy if exists "recent_searches_delete_own" on public.recent_searches;

create policy "recent_searches_select_own" on public.recent_searches
  for select using (auth.uid() = user_id);
create policy "recent_searches_insert_own" on public.recent_searches
  for insert with check (auth.uid() = user_id);
create policy "recent_searches_delete_own" on public.recent_searches
  for delete using (auth.uid() = user_id);

create index if not exists recent_searches_user_created_at_idx
  on public.recent_searches (user_id, created_at desc);

-- Unique per (user_id, query) so we can upsert and bump the timestamp.
create unique index if not exists recent_searches_user_query_uniq
  on public.recent_searches (user_id, query);
