-- Saved reactions vault
CREATE TABLE IF NOT EXISTS public.saved_reactions (
  id          TEXT        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL DEFAULT '',
  image_query TEXT        NOT NULL DEFAULT '',
  vibe_label  TEXT        NOT NULL,
  cultural_context TEXT   NOT NULL DEFAULT '',
  match_score NUMERIC     NOT NULL DEFAULT 0,
  reason      TEXT        NOT NULL DEFAULT '',
  source_label TEXT       NOT NULL DEFAULT '',
  source_url   TEXT       NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.saved_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_reactions_select_own" ON public.saved_reactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_reactions_insert_own" ON public.saved_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_reactions_delete_own" ON public.saved_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Recent searches
CREATE TABLE IF NOT EXISTS public.recent_searches (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query      TEXT        NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recent_searches_select_own" ON public.recent_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recent_searches_insert_own" ON public.recent_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recent_searches_delete_own" ON public.recent_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast per-user ordered lookups
CREATE INDEX IF NOT EXISTS saved_reactions_user_id_saved_at
  ON public.saved_reactions (user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS recent_searches_user_id_searched_at
  ON public.recent_searches (user_id, searched_at DESC);
