import * as z from "zod"

/**
 * Shared schema for the agent's structured output.
 * Used by the API route (Output.object) and the client (useObject).
 *
 * Notes:
 * - All fields are required (AI SDK 6 / OpenAI strict mode prefers required + nullable
 *   over optional). We keep the shape lean and let the LLM fill it deterministically.
 * - imageQuery is a descriptive cinematic prompt — never a real public figure's name.
 *   The UI uses it to render an editorial placeholder image.
 */
export const reactionSchema = z.object({
  vibeLabel: z
    .string()
    .describe(
      "Two-to-four word evocative name for the reaction style, e.g. 'Polite Disbelief', 'Surgical Boredom', 'Operatic Grief'.",
    ),
  culturalContext: z
    .string()
    .describe(
      "Brief reference to the real cultural moment, archetype, or genre this draws from. One short phrase.",
    ),
  reason: z
    .string()
    .describe(
      "One concise sentence explaining why this reaction fits the user's prompt. No filler.",
    ),
  matchScore: z
    .number()
    .int()
    .min(60)
    .max(99)
    .describe("Reaction strength score from 60 to 99. Higher = stronger fit."),
  sourceLabel: z
    .string()
    .describe(
      "Short source-type label, e.g. 'Reality TV still', 'Press conference photo', 'PSA archive', 'Sitcom episode'.",
    ),
  tags: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe(
      "Two to five short lowercase tag words capturing the vibe and use case, e.g. 'petty', 'office drama', 'group chat coded'.",
    ),
  imageQuery: z
    .string()
    .describe(
      "Editorial cinematic image description for a visual placeholder. Describe lighting, framing, expression, and setting. Do NOT name real public figures.",
    ),
})

export const agentResponseSchema = z.object({
  reactions: z
    .array(reactionSchema)
    .min(5)
    .max(5)
    .describe("Exactly five reactions, ordered by matchScore descending."),
})

export type AgentReaction = z.infer<typeof reactionSchema>
export type AgentResponse = z.infer<typeof agentResponseSchema>
