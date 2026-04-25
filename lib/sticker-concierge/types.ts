export type TraceStatus = "pending" | "running" | "complete"

export type TraceStep = {
  id: string
  label: string
  status: TraceStatus
}

export type ToolStatus = "queued" | "running" | "complete"

export type AgentTool = {
  id: string
  name: string
  description: string
  status: ToolStatus
}

export type ReactionResult = {
  id: string
  imageUrl: string
  imageQuery: string
  vibeLabel: string
  culturalContext: string
  matchScore: number
  reason: string
  sourceLabel: string
  sourceUrl: string
  tags: string[]
}

export type SavedReaction = ReactionResult & {
  savedAt: number
}

export type RefinementChip = {
  id: string
  label: string
}
