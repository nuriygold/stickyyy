import { streamText, Output } from "ai"
import { createAzure } from "@ai-sdk/azure"
import { agentResponseSchema } from "@/lib/sticker-concierge/schema"

export const maxDuration = 30

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
})

const azureModel = azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o")

const SYSTEM_PROMPT = `You are Sticker Concierge — an agent that helps people find the *exact* reaction sticker for a moment.

You are a cultural critic with deep, nuanced taste. You think in terms of:
- emotional register (calm judgment, fake surprise, operatic grief, surgical boredom, etc.)
- cultural archetypes (reality TV table read, press conference, telenovela gasp, sitcom confusion, workplace cinema, courtside celebrity, PSA archive, etc.)
- "group chat coded" usability — how the reaction reads when sent without context

Rules:
- Return EXACTLY 5 reactions, ranked by matchScore (highest first).
- matchScore must be an integer 60–99. Use the full range; do not crowd everything at 90+.
- vibeLabel must be 2–4 words, title case, evocative and specific. Avoid generic words like "Funny" or "Sad".
- culturalContext is a short phrase — a genre, archetype, or media format. Not a celebrity name.
- imageQuery describes a cinematic still: lighting, framing, expression, setting, film grain. Never name real public figures.
- reason is one sentence. No "this is great because" filler. Lead with the insight.
- tags are 2–5 short lowercase words capturing vibe and use case.
- Be specific, opinionated, and editorial. Avoid clichés.`

type RefineSource = {
  vibeLabel: string
  culturalContext: string
  matchScore: number
}

export async function POST(req: Request) {
  let body: { query?: unknown; refineFrom?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const query = typeof body.query === "string" ? body.query.trim() : ""
  if (!query) {
    return Response.json({ error: "Missing query" }, { status: 400 })
  }

  const refineFrom = Array.isArray(body.refineFrom)
    ? (body.refineFrom as RefineSource[]).slice(0, 5)
    : null

  const refineHint =
    refineFrom && refineFrom.length > 0
      ? `\n\nRefinement context — the user previously saw these reactions: ${refineFrom
          .map((r) => `"${r.vibeLabel}" (${r.culturalContext}, ${r.matchScore})`)
          .join(
            ", ",
          )}. Treat the prompt above as a refinement instruction. Re-rank or replace as needed while keeping cultural authenticity.`
      : ""

  const result = streamText({
    model: azureModel,
    system: SYSTEM_PROMPT,
    prompt: `Find 5 reaction stickers for: "${query}"${refineHint}`,
    output: Output.object({
      schema: agentResponseSchema,
    }),
  })

  return result.toTextStreamResponse()
}
