import type { AgentTool, ReactionResult, TraceStep } from "./types"
import type { AgentReaction } from "./schema"

/**
 * Static UI scaffolding for the agent run.
 * The actual generation happens server-side in /api/agent via the AI Gateway.
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
 * A reaction is "renderable" once the model has filled the fields the card UI depends on.
 * Lets us show partial cards progressively without flickering empty values.
 */
export function isRenderableReaction(
  r: Partial<AgentReaction> | undefined | null,
): r is AgentReaction {
  if (!r) return false
  return (
    typeof r.vibeLabel === "string" &&
    r.vibeLabel.length > 0 &&
    typeof r.culturalContext === "string" &&
    r.culturalContext.length > 0 &&
    typeof r.reason === "string" &&
    r.reason.length > 0 &&
    typeof r.matchScore === "number" &&
    typeof r.sourceLabel === "string" &&
    Array.isArray(r.tags) &&
    typeof r.imageQuery === "string" &&
    r.imageQuery.length > 0
  )
}

/**
 * Map LLM-produced reactions into the UI's ReactionResult shape.
 * Adds a stable id (per run) and a placeholder image URL derived from imageQuery.
 */
export function mapReactionsToResults(
  reactions: AgentReaction[],
  runId: string,
): ReactionResult[] {
  return reactions.map((r, i) => ({
    id: `${runId}-${i}`,
    imageUrl: `/placeholder.svg?height=520&width=520&query=${encodeURIComponent(r.imageQuery)}`,
    imageQuery: r.imageQuery,
    vibeLabel: r.vibeLabel,
    culturalContext: r.culturalContext,
    matchScore: r.matchScore,
    reason: r.reason,
    sourceLabel: r.sourceLabel,
    sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(r.culturalContext)}`,
    tags: r.tags,
  }))
}
