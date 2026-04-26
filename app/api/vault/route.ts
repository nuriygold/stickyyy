import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/vault — list saved reactions for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ saved: [] })

  const { data, error } = await supabase
    .from("saved_reactions")
    .select("*")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map snake_case DB columns → camelCase client types
  const saved = (data ?? []).map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    imageQuery: row.image_query,
    vibeLabel: row.vibe_label,
    culturalContext: row.cultural_context,
    matchScore: Number(row.match_score),
    reason: row.reason,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    tags: row.tags ?? [],
    savedAt: new Date(row.saved_at).getTime(),
  }))

  return NextResponse.json({ saved })
}

// POST /api/vault — save a reaction
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const { error } = await supabase.from("saved_reactions").upsert({
    id: body.id,
    user_id: user.id,
    image_url: body.imageUrl ?? "",
    image_query: body.imageQuery ?? "",
    vibe_label: body.vibeLabel,
    cultural_context: body.culturalContext ?? "",
    match_score: body.matchScore ?? 0,
    reason: body.reason ?? "",
    source_label: body.sourceLabel ?? "",
    source_url: body.sourceUrl ?? "",
    tags: body.tags ?? [],
    saved_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/vault?id=... — remove a saved reaction
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase
    .from("saved_reactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
