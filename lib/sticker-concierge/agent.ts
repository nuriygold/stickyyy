import type { AgentTool, ReactionResult, TraceStep } from "./types"
import { REACTION_POOL } from "./data"

/**
 * The shapes below mirror what a real agent runtime would produce.
 * Each function is intentionally a thin mock so that a real backend
 * (LLM + retrieval + ranking) can be swapped in later without UI changes.
 */

export const INITIAL_TRACE: TraceStep[] = [
  { id: "vibe", label: "Reading the vibe", status: "pending" },
  { id: "refs", label: "Identifying cultural references", status: "pending" },
  { id: "search", label: "Searching iconic moments", status: "pending" },
  { id: "verify", label: "Verifying real matches", status: "pending" },
  { id: "rank", label: "Ranking by reaction strength", status: "pending" },
  { id: "ready", label: "Ready", status: "pending" },
]

export const INITIAL_TOOLS: AgentTool[] = [
  {
    id: "meme-search",
    name: "Meme Search",
    description: "Indexed reaction stills & GIFs",
    status: "queued",
  },
  {
    id: "web-image",
    name: "Web Image Search",
    description: "Open web fallback with safety filters",
    status: "queued",
  },
  {
    id: "vault-memory",
    name: "Vault Memory",
    description: "Your saved reactions & favorite moods",
    status: "queued",
  },
  {
    id: "vibe-ranking",
    name: "Vibe Ranking",
    description: "Reaction strength + cultural fit score",
    status: "queued",
  },
  {
    id: "caption-helper",
    name: "Caption Helper",
    description: "Optional context line for each match",
    status: "queued",
  },
]

/**
 * analyzeVibe — would call the LLM to classify the user's intent into
 * an emotion vector + cultural reference set. Mocked here.
 */
export function analyzeVibe(query: string): { emotion: string; references: string[] } {
  const lower = query.toLowerCase()
  const emotion =
    lower.includes("shock") ? "shock"
      : lower.includes("petty") ? "petty"
      : lower.includes("cry") ? "grief"
      : lower.includes("confus") ? "confused"
      : lower.includes("told you") ? "vindication"
      : "calm judgment"
  return { emotion, references: extractReferences(lower) }
}

function extractReferences(q: string): string[] {
  const refs: string[] = []
  if (q.includes("rihanna")) refs.push("courtside celebrity")
  if (q.includes("jordan")) refs.push("hall of fame press")
  if (q.includes("nene")) refs.push("reality tv")
  if (q.includes("crash dummy")) refs.push("PSA archive")
  if (q.includes("office")) refs.push("workplace cinema")
  if (refs.length === 0) refs.push("general meme corpus")
  return refs
}

/**
 * searchIconicMoments — mocked retrieval. Picks deterministic-ish slices
 * of the reaction pool based on the query so the demo feels responsive.
 */
export function searchIconicMoments(query: string): ReactionResult[] {
  const q = query.toLowerCase()
  const scored = REACTION_POOL.map((r) => {
    let score = r.matchScore
    if (q.includes("rihanna") && r.id === "rihanna-courtside") score += 6
    if (q.includes("jordan") && r.id === "mj-crying") score += 6
    if (q.includes("nene") && r.id === "nene-unimpressed") score += 6
    if (q.includes("crash dummy") && r.id === "crash-dummy") score += 6
    if (q.includes("shock") && r.id === "fake-shocked") score += 5
    if (q.includes("doomed") && r.id === "doomed-plan") score += 5
    if (q.includes("office") && r.tags.includes("office drama")) score += 2
    if (q.includes("petty") && r.tags.includes("petty")) score += 2
    return { ...r, matchScore: Math.min(99, score) }
  })
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)
}

/**
 * rankResults — mocked re-rank with a small jitter so refinements feel alive.
 */
export function rankResults(results: ReactionResult[], boostTag?: string): ReactionResult[] {
  return [...results]
    .map((r) => {
      let score = r.matchScore
      if (boostTag && r.tags.includes(boostTag)) score = Math.min(99, score + 4)
      return { ...r, matchScore: score }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * refineSearch — would re-issue the search with an updated intent vector.
 * Here we just nudge ordering + tweak the reason copy.
 */
export function refineSearch(
  results: ReactionResult[],
  refinement: string,
): ReactionResult[] {
  const r = refinement.toLowerCase()
  const tag =
    r.includes("petty") ? "petty"
      : r.includes("shock") ? "fake surprised"
      : r.includes("judgment") ? "calm judgment"
      : r.includes("iconic") ? "iconic"
      : r.includes("group chat") ? "group chat coded"
      : r.includes("original") ? "iconic"
      : undefined
  const ranked = rankResults(results, tag)
  return ranked.map((card) => ({
    ...card,
    reason: `Refined for "${refinement}". ${card.reason}`,
  }))
}
