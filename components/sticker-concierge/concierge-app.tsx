"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Bookmark, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useObject } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AgentTrace } from "@/components/sticker-concierge/agent-trace"
import { AuthHeader } from "@/components/sticker-concierge/auth-header"
import { ChatInput } from "@/components/sticker-concierge/chat-input"
import { PromptChips } from "@/components/sticker-concierge/prompt-chips"
import { ResultCard } from "@/components/sticker-concierge/result-card"
import { ResultsSkeleton } from "@/components/sticker-concierge/results-skeleton"
import { ToolsPanel } from "@/components/sticker-concierge/tools-panel"
import { VaultSheet } from "@/components/sticker-concierge/vault-sheet"
import {
  INITIAL_TOOLS,
  INITIAL_TRACE,
  isRenderableReaction,
  mapReactionsToResults,
} from "@/lib/sticker-concierge/agent"
import { agentResponseSchema } from "@/lib/sticker-concierge/schema"
import {
  recordRecentSearch,
  removeSavedReaction,
  saveReaction,
} from "@/lib/sticker-concierge/storage"
import type {
  AgentTool,
  ReactionResult,
  SavedReaction,
  ToolStatus,
  TraceStatus,
  TraceStep,
} from "@/lib/sticker-concierge/types"

type RunPhase = "idle" | "running" | "results"

type Props = {
  user: User | null
  initialSaved: SavedReaction[]
  initialRecent: string[]
}

const TRACE_STEP_INTERVAL = 480

export function ConciergeApp({ user, initialSaved, initialRecent }: Props) {
  const isAuthed = !!user
  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string>("")
  const [phase, setPhase] = useState<RunPhase>("idle")
  const [trace, setTrace] = useState<TraceStep[]>(INITIAL_TRACE)
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS)
  const [results, setResults] = useState<ReactionResult[]>([])
  const [saved, setSaved] = useState<SavedReaction[]>(initialSaved)
  const [recentSearches, setRecentSearches] = useState<string[]>(initialRecent)

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved])

  // ---------- AI SDK streaming via Vercel AI Gateway ----------
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/agent",
    schema: agentResponseSchema,
  })

  const runIdRef = useRef<string>("")
  const traceTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTraceTimers = useCallback(() => {
    traceTimersRef.current.forEach((t) => clearTimeout(t))
    traceTimersRef.current = []
  }, [])

  const setStepStatus = useCallback((id: string, status: TraceStatus) => {
    setTrace((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
  }, [])
  const setToolStatus = useCallback((id: string, status: ToolStatus) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }, [])

  // ---------- Run agent (streaming) ----------
  const runAgent = useCallback(
    (q: string, opts?: { fromRefinement?: boolean }) => {
      clearTraceTimers()
      const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      runIdRef.current = runId

      setPhase("running")
      setSubmittedQuery(q)
      setTrace(INITIAL_TRACE.map((s) => ({ ...s, status: "pending" })))
      setTools(INITIAL_TOOLS.map((t) => ({ ...t, status: "queued" })))

      const refineFrom = opts?.fromRefinement
        ? results.map((r) => ({
            vibeLabel: r.vibeLabel,
            culturalContext: r.culturalContext,
            matchScore: r.matchScore,
          }))
        : null

      if (!opts?.fromRefinement) {
        setResults([])
      }

      const t1 = setTimeout(() => setStepStatus("vibe", "running"), 60)
      const t2 = setTimeout(() => {
        setStepStatus("vibe", "complete")
        setStepStatus("refs", "running")
        setToolStatus("meme-search", "running")
      }, TRACE_STEP_INTERVAL)
      const t3 = setTimeout(() => {
        setStepStatus("refs", "complete")
        setStepStatus("search", "running")
        setToolStatus("meme-search", "complete")
        setToolStatus("web-image", "running")
        setToolStatus("vault-memory", "running")
      }, TRACE_STEP_INTERVAL * 2)
      traceTimersRef.current = [t1, t2, t3]

      submit({ query: q, refineFrom })
    },
    [clearTraceTimers, results, setStepStatus, setToolStatus, submit],
  )

  // First reaction arrives -> advance trace.
  const partialReactions = object?.reactions
  const partialCount = Array.isArray(partialReactions) ? partialReactions.length : 0

  useEffect(() => {
    if (!isLoading) return
    if (partialCount === 0) return
    setStepStatus("search", "complete")
    setStepStatus("verify", "running")
    setToolStatus("web-image", "complete")
    setToolStatus("vault-memory", "complete")
  }, [isLoading, partialCount, setStepStatus, setToolStatus])

  // Mirror partial results live.
  useEffect(() => {
    if (!isLoading) return
    if (!partialReactions) return
    const ready = partialReactions.filter(isRenderableReaction)
    if (ready.length === 0) return
    setResults(mapReactionsToResults(ready, runIdRef.current))
  }, [isLoading, partialReactions])

  // Stream finished -> finalize trace + sort.
  useEffect(() => {
    if (isLoading) return
    if (!object?.reactions) return

    clearTraceTimers()
    const finalize = setTimeout(() => {
      setStepStatus("verify", "complete")
      setStepStatus("rank", "running")
      setToolStatus("vibe-ranking", "running")

      const r2 = setTimeout(() => {
        setStepStatus("rank", "complete")
        setStepStatus("ready", "running")
        setToolStatus("vibe-ranking", "complete")
        setToolStatus("caption-helper", "running")

        const r3 = setTimeout(() => {
          setStepStatus("ready", "complete")
          setToolStatus("caption-helper", "complete")
        }, 280)
        traceTimersRef.current.push(r3)
      }, 320)
      traceTimersRef.current.push(r2)
    }, 120)
    traceTimersRef.current.push(finalize)

    const ready = object.reactions.filter(isRenderableReaction)
    const sorted = [...ready].sort((a, b) => b.matchScore - a.matchScore)
    setResults(mapReactionsToResults(sorted, runIdRef.current))
    setPhase("results")

    return () => clearTraceTimers()
  }, [isLoading, object, clearTraceTimers, setStepStatus, setToolStatus])

  // Handle errors.
  useEffect(() => {
    if (!error) return
    clearTraceTimers()
    setPhase((prev) => (results.length > 0 ? "results" : "idle"))
    toast("Generation failed", {
      description:
        error instanceof Error
          ? error.message
          : "The agent could not complete this run. Try again.",
    })
  }, [error, clearTraceTimers, results.length])

  // Cleanup.
  useEffect(() => {
    return () => {
      clearTraceTimers()
      stop()
    }
  }, [clearTraceTimers, stop])

  // ---------- Recent searches (local + persisted) ----------
  const bumpRecent = useCallback(
    (q: string) => {
      setRecentSearches((prev) => {
        const without = prev.filter((p) => p !== q)
        return [q, ...without].slice(0, 8)
      })
      if (isAuthed && user) {
        recordRecentSearch(user.id, q).catch(() => {
          /* swallow */
        })
      }
    },
    [isAuthed, user],
  )

  // ---------- Submit handlers ----------
  const handleSubmit = useCallback(() => {
    const q = query.trim()
    if (!q || isLoading) return
    bumpRecent(q)
    runAgent(q)
  }, [query, isLoading, runAgent, bumpRecent])

  const handleSelectChip = useCallback(
    (chip: string) => {
      if (isLoading) return
      setQuery(chip)
      bumpRecent(chip)
      runAgent(chip)
    },
    [isLoading, runAgent, bumpRecent],
  )

  // ---------- Vault actions ----------
  const handleSave = useCallback(
    async (r: ReactionResult) => {
      if (!isAuthed || !user) {
        toast("Sign in to save", {
          description: "Create a free account to keep reactions in your vault.",
          action: {
            label: "Sign in",
            onClick: () => {
              window.location.href = "/auth/login"
            },
          },
        })
        return
      }

      const isAlreadySaved = savedIds.has(r.id)
      if (isAlreadySaved) {
        // Optimistic remove.
        setSaved((prev) => prev.filter((s) => s.id !== r.id))
        const ok = await removeSavedReaction(user.id, r.id)
        if (!ok) {
          toast("Couldn't remove from vault", { description: "Try again." })
          // revert
          setSaved((prev) => [{ ...r, savedAt: Date.now() }, ...prev])
          return
        }
        toast("Removed from vault", { description: r.vibeLabel })
        return
      }

      // Optimistic add.
      const optimistic: SavedReaction = { ...r, savedAt: Date.now() }
      setSaved((prev) => [optimistic, ...prev])
      const res = await saveReaction(user.id, r)
      if (!res) {
        toast("Couldn't save to vault", { description: "Try again." })
        setSaved((prev) => prev.filter((s) => s.id !== r.id))
        return
      }
      // Reconcile timestamp.
      setSaved((prev) =>
        prev.map((s) => (s.id === r.id ? { ...s, savedAt: res.savedAt } : s)),
      )
      toast("Saved to vault", { description: r.vibeLabel })
    },
    [isAuthed, user, savedIds],
  )

  const handleRemoveSaved = useCallback(
    async (id: string) => {
      const previous = saved
      setSaved((prev) => prev.filter((s) => s.id !== id))
      if (isAuthed && user) {
        const ok = await removeSavedReaction(user.id, id)
        if (!ok) {
          toast("Couldn't remove from vault", { description: "Try again." })
          setSaved(previous)
        }
      }
    },
    [isAuthed, user, saved],
  )

  const handleCopy = useCallback((r: ReactionResult) => {
    const text = `${r.vibeLabel} — ${r.culturalContext}`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    toast("Reaction copied", { description: r.vibeLabel })
  }, [])

  const handleOpenSource = useCallback((r: ReactionResult) => {
    if (typeof window !== "undefined") {
      window.open(r.sourceUrl, "_blank", "noopener,noreferrer")
    }
  }, [])

  const handleRefine = useCallback(
    (r: ReactionResult, refinement: string) => {
      if (isLoading) return
      const q = `${submittedQuery || r.vibeLabel} — ${refinement}`
      runAgent(q, { fromRefinement: true })
    },
    [submittedQuery, runAgent, isLoading],
  )

  const handleSelectSearchFromVault = useCallback(
    (q: string) => {
      if (isLoading) return
      setQuery(q)
      runAgent(q)
    },
    [isLoading, runAgent],
  )

  const handleSelectTagFromVault = useCallback(
    (tag: string) => {
      if (isLoading) return
      const q = `Reaction with vibe: ${tag}`
      setQuery(q)
      runAgent(q)
    },
    [isLoading, runAgent],
  )

  // Subtle scroll to top when a new run begins.
  useEffect(() => {
    if (phase === "running") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [phase])

  return (
    <main className="min-h-screen pb-48">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium tracking-tight">Sticker Concierge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <VaultSheet
              saved={saved}
              recentSearches={recentSearches}
              onRemove={handleRemoveSaved}
              onSelectSearch={handleSelectSearchFromVault}
              onSelectTag={handleSelectTagFromVault}
              isAuthed={isAuthed}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-foreground/85 hover:text-foreground"
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  Vault
                  {saved.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                      {saved.length}
                    </span>
                  )}
                </Button>
              }
            />
            <AuthHeader user={user} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:pt-12">
        <section className="mb-8 sm:mb-10 fade-up">
          <p className="text-xs uppercase tracking-[0.22em] text-primary/90 font-medium mb-3">
            Agentic cultural search
          </p>
          <h1 className="font-display text-[clamp(2.25rem,7vw,4rem)] leading-[1.02] text-foreground text-balance">
            Find the exact reaction
            <br />
            <span className="italic text-foreground/85">for the moment.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
            Describe the reaction. The agent identifies the vibe, traces it back to real iconic moments, ranks them by reaction strength, and remembers what you save.
          </p>
          {!isAuthed && (
            <p className="mt-3 text-xs text-muted-foreground">
              <a
                href="/auth/login"
                className="text-primary hover:underline underline-offset-4"
              >
                Sign in
              </a>{" "}
              to save reactions to a private vault that syncs across devices.
            </p>
          )}
        </section>

        {phase === "idle" && (
          <section className="mb-8 fade-up">
            <PromptChips onSelect={handleSelectChip} />
          </section>
        )}

        {phase !== "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <AgentTrace steps={trace} query={submittedQuery} />
            <ToolsPanel tools={tools} />
          </div>
        )}

        {phase === "running" && results.length === 0 && (
          <section aria-label="Loading results" className="mt-2">
            <ResultsSkeleton count={4} />
          </section>
        )}

        {results.length > 0 && (
          <section
            aria-label="Results"
            className={cn(
              "mt-2 fade-up transition-opacity",
              isLoading && "opacity-70",
            )}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl text-foreground">
                {results.length} ranked moments
              </h2>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Streaming…" : "Sorted by reaction strength"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  isSaved={savedIds.has(r.id)}
                  onCopy={handleCopy}
                  onSave={handleSave}
                  onRefine={handleRefine}
                  onOpenSource={handleOpenSource}
                />
              ))}
            </div>
          </section>
        )}

        {phase === "idle" && (
          <section className="mt-12 mb-24 rounded-2xl border border-dashed border-border p-8 text-center fade-up">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl text-foreground mb-1">
              Tell me the moment.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto text-pretty">
              I&apos;ll trace the vibe, search across real cultural reference points, and rank what fits. Try one of the prompts above to see a run.
            </p>
          </section>
        )}
      </div>

      <ChatInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        isRunning={isLoading}
      />
    </main>
  )
}
