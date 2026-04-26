"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bookmark, LogOut, Sparkles, User } from "lucide-react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AgentTrace } from "@/components/sticker-concierge/agent-trace"
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
import { createClient } from "@/lib/supabase/client"
import type {
  AgentTool,
  ReactionResult,
  SavedReaction,
  ToolStatus,
  TraceStatus,
  TraceStep,
} from "@/lib/sticker-concierge/types"

type RunPhase = "idle" | "running" | "results"

const TRACE_STEP_INTERVAL = 480

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string>("")
  const [phase, setPhase] = useState<RunPhase>("idle")
  const [trace, setTrace] = useState<TraceStep[]>(INITIAL_TRACE)
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS)
  const [results, setResults] = useState<ReactionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // --- Auth state ---
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setUserEmail(data.user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const isLoggedIn = Boolean(userId)

  // --- Vault (persisted via API) ---
  const { data: vaultData } = useSWR<{ saved: SavedReaction[] }>(
    isLoggedIn ? "/api/vault" : null,
    fetcher,
  )
  const saved: SavedReaction[] = vaultData?.saved ?? []
  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved])

  // --- Recent searches (persisted via API) ---
  const { data: searchesData } = useSWR<{ searches: string[] }>(
    isLoggedIn ? "/api/searches" : null,
    fetcher,
  )
  const recentSearches: string[] = searchesData?.searches ?? []

  const runIdRef = useRef<string>("")
  const traceTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

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

  // ---------- Run agent (streaming JSON) ----------
  const runAgent = useCallback(
    (q: string, opts?: { fromRefinement?: boolean }) => {
      clearTraceTimers()
      setError(null)
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

      setIsLoading(true)

      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      ;(async () => {
        try {
          const response = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q, refineFrom }),
            signal: abortControllerRef.current?.signal,
          })

          if (!response.ok) throw new Error(`API error: ${response.status}`)
          if (!response.body) throw new Error("No response body")

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          let partialObj: any = {}

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Parse SSE lines
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (!line.trim().startsWith("data:")) continue

              const data = line.trim().slice(5).trim()
              if (data === "[DONE]") continue

              try {
                partialObj = JSON.parse(data)

                // Update results as they stream in
                if (partialObj.reactions && Array.isArray(partialObj.reactions)) {
                  const ready = partialObj.reactions.filter(isRenderableReaction)
                  if (ready.length > 0) {
                    if (results.length === 0) {
                      setStepStatus("search", "complete")
                      setStepStatus("verify", "running")
                      setToolStatus("web-image", "complete")
                      setToolStatus("vault-memory", "complete")
                    }
                    setResults(mapReactionsToResults(ready, runId))
                  }
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          // Final update with all reactions sorted
          if (partialObj.reactions && Array.isArray(partialObj.reactions)) {
            const ready = partialObj.reactions.filter(isRenderableReaction)
            const sorted = [...ready].sort((a, b) => b.matchScore - a.matchScore)
            setResults(mapReactionsToResults(sorted, runId))
          }

          // Finalize trace
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

          setPhase("results")
          setIsLoading(false)
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return

          clearTraceTimers()
          setPhase((prev) => (results.length > 0 ? "results" : "idle"))
          const errMsg =
            err instanceof Error ? err.message : "The agent could not complete this run. Try again."
          setError(err instanceof Error ? err : new Error(errMsg))
          toast("Generation failed", { description: errMsg })
          setIsLoading(false)
        }
      })()

      // Persist search in background (no-op when logged out)
      if (isLoggedIn) {
        fetch("/api/searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        }).then(() => mutate("/api/searches"))
      }
    },
    [clearTraceTimers, results, setStepStatus, setToolStatus, isLoggedIn],
  )

  // ---------- Submit handlers ----------
  const handleSubmit = useCallback(() => {
    const q = query.trim()
    if (!q || isLoading) return
    runAgent(q)
  }, [query, isLoading, runAgent])

  const handleSelectChip = useCallback(
    (chip: string) => {
      if (isLoading) return
      setQuery(chip)
      runAgent(chip)
    },
    [isLoading, runAgent],
  )

  // ---------- Vault actions ----------
  const handleSave = useCallback(
    async (r: ReactionResult) => {
      if (!isLoggedIn) {
        toast("Sign in to save reactions", { description: "Create a free account to use your vault." })
        return
      }

      const alreadySaved = savedIds.has(r.id)

      // Optimistic update
      mutate(
        "/api/vault",
        alreadySaved
          ? { saved: saved.filter((s) => s.id !== r.id) }
          : { saved: [{ ...r, savedAt: Date.now() }, ...saved] },
        false,
      )

      if (alreadySaved) {
        toast("Removed from vault", { description: r.vibeLabel })
        await fetch(`/api/vault?id=${encodeURIComponent(r.id)}`, { method: "DELETE" })
      } else {
        toast("Saved to vault", { description: r.vibeLabel })
        await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        })
      }

      mutate("/api/vault")
    },
    [isLoggedIn, savedIds, saved],
  )

  const handleRemoveSaved = useCallback(
    async (id: string) => {
      mutate("/api/vault", { saved: saved.filter((s) => s.id !== id) }, false)
      await fetch(`/api/vault?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      mutate("/api/vault")
    },
    [saved],
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

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast("Signed out")
  }, [])

  useEffect(() => {
    if (phase === "running") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [phase])

  useEffect(() => {
    return () => {
      clearTraceTimers()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [clearTraceTimers])

  return (
    <main className="min-h-screen pb-48">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium tracking-tight">Sticker Concierge</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-foreground/60 hover:text-foreground"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">{userEmail?.split("@")[0]}</span>
                <LogOut className="h-3.5 w-3.5 sm:hidden" />
              </Button>
            )}

            <VaultSheet
              saved={saved}
              recentSearches={recentSearches}
              isLoggedIn={isLoggedIn}
              onRemove={handleRemoveSaved}
              onSelectSearch={handleSelectSearchFromVault}
              onSelectTag={handleSelectTagFromVault}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-foreground/85 hover:text-foreground"
                >
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  Vault
                  {isLoggedIn && saved.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                      {saved.length}
                    </span>
                  )}
                  {!isLoggedIn && (
                    <User className="h-3 w-3 ml-1 text-muted-foreground" />
                  )}
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:pt-12">
        {/* Hero */}
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
        </section>

        {/* Prompt chips (only when idle) */}
        {phase === "idle" && (
          <section className="mb-8 fade-up">
            <PromptChips onSelect={handleSelectChip} />
          </section>
        )}

        {/* Agent trace + tools */}
        {phase !== "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <AgentTrace steps={trace} query={submittedQuery} />
            <ToolsPanel tools={tools} />
          </div>
        )}

        {/* Results skeleton */}
        {phase === "running" && results.length === 0 && (
          <section aria-label="Loading results" className="mt-2">
            <ResultsSkeleton count={4} />
          </section>
        )}

        {/* Results */}
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

        {/* Idle empty state */}
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
