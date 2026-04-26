import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const MAX_SEARCHES = 8

// GET /api/searches — list recent searches for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ searches: [] })

  const { data, error } = await supabase
    .from("recent_searches")
    .select("query")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })
    .limit(MAX_SEARCHES)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ searches: (data ?? []).map((r) => r.query) })
}

// POST /api/searches — record a new search query
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true }) // silently no-op when logged out

  const { query } = await req.json()
  if (!query?.trim()) return NextResponse.json({ ok: true })

  // Delete any existing row with the same query to keep it deduplicated, then insert fresh.
  await supabase
    .from("recent_searches")
    .delete()
    .eq("user_id", user.id)
    .eq("query", query.trim())

  await supabase.from("recent_searches").insert({
    user_id: user.id,
    query: query.trim(),
  })

  // Prune old rows beyond MAX_SEARCHES
  const { data: oldest } = await supabase
    .from("recent_searches")
    .select("id")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })
    .range(MAX_SEARCHES, 100)

  if (oldest && oldest.length > 0) {
    const ids = oldest.map((r) => r.id)
    await supabase.from("recent_searches").delete().in("id", ids)
  }

  return NextResponse.json({ ok: true })
}
