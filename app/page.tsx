import { createClient } from "@/lib/supabase/server"
import { ConciergeApp } from "@/components/sticker-concierge/concierge-app"
import type { SavedReaction } from "@/lib/sticker-concierge/types"

type SavedRow = {
  id: string
  saved_at: string
  vibe_label: string
  cultural_context: string
  reason: string
  match_score: number | string
  image_url: string
  image_query: string
  source_label: string
  source_url: string
  tags: string[] | null
}

type RecentRow = { query: string }

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialSaved: SavedReaction[] = []
  let initialRecent: string[] = []

  if (user) {
    const [savedRes, recentRes] = await Promise.all([
      supabase
        .from("saved_reactions")
        .select(
          "id, saved_at, vibe_label, cultural_context, reason, match_score, image_url, image_query, source_label, source_url, tags",
        )
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })
        .limit(200),
      supabase
        .from("recent_searches")
        .select("query")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    if (!savedRes.error && savedRes.data) {
      initialSaved = (savedRes.data as SavedRow[]).map((r) => ({
        id: r.id,
        vibeLabel: r.vibe_label,
        culturalContext: r.cultural_context,
        reason: r.reason,
        matchScore:
          typeof r.match_score === "string" ? parseFloat(r.match_score) : r.match_score,
        imageUrl: r.image_url,
        imageQuery: r.image_query,
        sourceLabel: r.source_label,
        sourceUrl: r.source_url,
        tags: r.tags ?? [],
        savedAt: new Date(r.saved_at).getTime(),
      }))
    }

    if (!recentRes.error && recentRes.data) {
      initialRecent = (recentRes.data as RecentRow[]).map((r) => r.query)
    }
  }

  return (
    <ConciergeApp
      user={user}
      initialSaved={initialSaved}
      initialRecent={initialRecent}
    />
  )
}
