import { createClient } from "@/lib/supabase/client"
import type { ReactionResult, SavedReaction } from "./types"

type SavedRow = {
  id: string
  user_id: string
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

type RecentRow = {
  query: string
  created_at: string
}

function rowToSaved(row: SavedRow): SavedReaction {
  return {
    id: row.id,
    vibeLabel: row.vibe_label,
    culturalContext: row.cultural_context,
    reason: row.reason,
    matchScore:
      typeof row.match_score === "string"
        ? parseFloat(row.match_score)
        : row.match_score,
    imageUrl: row.image_url,
    imageQuery: row.image_query,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    tags: row.tags ?? [],
    savedAt: new Date(row.saved_at).getTime(),
  }
}

export async function fetchSavedReactions(userId: string): Promise<SavedReaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("saved_reactions")
    .select(
      "id, user_id, saved_at, vibe_label, cultural_context, reason, match_score, image_url, image_query, source_label, source_url, tags",
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[v0] fetchSavedReactions error", error)
    return []
  }
  return (data as SavedRow[]).map(rowToSaved)
}

export async function saveReaction(
  userId: string,
  r: ReactionResult,
): Promise<{ savedAt: number } | null> {
  const supabase = createClient()
  const savedAt = new Date()
  const { error } = await supabase.from("saved_reactions").upsert(
    {
      id: r.id,
      user_id: userId,
      saved_at: savedAt.toISOString(),
      vibe_label: r.vibeLabel,
      cultural_context: r.culturalContext,
      reason: r.reason,
      match_score: r.matchScore,
      image_url: r.imageUrl,
      image_query: r.imageQuery,
      source_label: r.sourceLabel,
      source_url: r.sourceUrl,
      tags: r.tags,
    },
    { onConflict: "user_id,id" },
  )

  if (error) {
    console.error("[v0] saveReaction error", error)
    return null
  }
  return { savedAt: savedAt.getTime() }
}

export async function removeSavedReaction(userId: string, id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from("saved_reactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)

  if (error) {
    console.error("[v0] removeSavedReaction error", error)
    return false
  }
  return true
}

export async function fetchRecentSearches(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("recent_searches")
    .select("query, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) {
    console.error("[v0] fetchRecentSearches error", error)
    return []
  }
  return (data as RecentRow[]).map((r) => r.query)
}

export async function recordRecentSearch(
  userId: string,
  query: string,
): Promise<void> {
  const supabase = createClient()
  // Upsert on (user_id, query) to bump the timestamp instead of duplicating.
  const { error } = await supabase.from("recent_searches").upsert(
    {
      user_id: userId,
      query,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,query" },
  )

  if (error) {
    console.error("[v0] recordRecentSearch error", error)
  }
}
