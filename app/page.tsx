"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bookmark, Sparkles } from "lucide-react"
import { toast } from "sonner"
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
  refineSearch,
  searchIconicMoments,
} from "@/lib/sticker-concierge/agent"
import type {
  AgentTool,
  ReactionResult,
  SavedReaction,
  TraceStep,
} from "@/lib/sticker-concierge/types"

type RunPhase = "idle" | "running" | "results"

export default function Page() {
  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState<string>("")
  const [phase, setPhase] = useState<RunPhase>("idle")
  const [trace, setTrace] = useState<TraceStep[]>(INITIAL_TRACE)
  const [tools, setTools] = useState<AgentTool[]>(INITIAL_TOOLS)
  const [results, setResults] = useState<ReactionResult[]>([])
  const [saved, setSaved] = useState<SavedReaction[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved])

  // ---------- Agent runtime (mocked) ----------
  // In production this would stream from a server action wrapping the real
  // agent runtime (analyzeVibe -> searchIconicMoments -> rankResults -> ...).
  const runAgent = useCallback(
    async (q: string, opts?: { fromRefinement?: boolean; sourceResults?: ReactionResult[] }) => {
      setPhase("running")
      setSubmittedQuery(q)

      // reset trace + tools
      const freshTrace: TraceStep[] = INITIAL_TRACE.map((s) => ({ ...s, status: "pending" }))
      const freshTools: AgentTool[] = INITIAL_TOOLS.map((t) => ({ ...t, status: "queued" }))
      setTrace(freshTrace)
      setTools(freshTools)
      if (!opts?.fromRefinement) setResults([])

      // step through trace with timing
      const stepDelay = 380
      for (let i = 0; i < freshTrace.length; i++) {
        await wait(stepDelay)
        setTrace((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "running" } : idx < i ? { ...s, status: "complete" } : s,
          ),
        )

        // tool transitions tied loosely to trace progress
        if (i === 1) {
          setTools((prev) =>
            prev.map((t) => (t.id === "meme-search" ? { ...t, status: "running" } : t)),
          )
        }
        if (i === 2) {
          setTools((prev) =>
            prev.map((t) =>
              t.id === "meme-search"
                ? { ...t, status: "complete" }
                : t.id === "web-image"
                  ? { ...t, status: "running" }
                  : t.id === "vault-memory"
                    ? { ...t, status: "running" }
                    : t,
            ),
          )
        }
        if (i === 3) {
          setTools((prev) =>
            prev.map((t) =>
              t.id === "web-image" || t.id === "vault-memory"
                ? { ...t, status: "complete" }
                : t.id === "vibe-ranking"
                  ? { ...t, status: "running" }
                  : t,
            ),
          )
        }
        if (i === 4) {
          setTools((prev) =>
            prev.map((t) =>
              t.id === "vibe-ranking"
                ? { ...t, status: "complete" }
                : t.id === "caption-helper"
                  ? { ...t, status: "running" }
                  : t,
            ),
          )
        }
      }

      // mark final step complete
      setTrace((prev) => prev.map((s) => ({ ...s, status: "complete" })))
      setTools((prev) => prev.map((t) => ({ ...t, status: "complete" })))

      // produce results
      const next = opts?.fromRefinement && opts.sourceResults
        ? refineSearch(opts.sourceResults, q)
        : searchIconicMoments(q)
      setResults(next)
      setPhase("results")
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    const q = query.trim()
    if (!q) return
    setRecentSearches((prev) => {
      const without = prev.filter((p) => p !== q)
      return [q, ...without].slice(0, 8)
    })
    runAgent(q)
  }, [query, runAgent])

  const handleSelectChip = useCallback(
    (chip: string) => {
      setQuery(chip)
      setRecentSearches((prev) => {
        const without = prev.filter((p) => p !== chip)
        return [chip, ...without].slice(0, 8)
      })
      runAgent(chip)
    },
    [runAgent],
  )

  // ---------- Vault actions ----------
  const handleSave = useCallback((r: ReactionResult) => {
    setSaved((prev) => {
      if (prev.some((s) => s.id === r.id)) {
        toast("Removed from vault", { description: r.vibeLabel })
        return prev.filter((s) => s.id !== r.id)
      }
      toast("Saved to vault", { description: r.vibeLabel })
      return [{ ...r, savedAt: Date.now() }, ...prev]
    })
  }, [])

  const handleRemoveSaved = useCallback((id: string) => {
    setSaved((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleCopy = useCallback((r: ReactionResult) => {
    const text = `${r.vibeLabel} — ${r.culturalContext} (${r.sourceUrl})`
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    toast("Reaction copied", { description: r.vibeLabel })
  }, [])

  const handleOpenSource = useCallback((r: ReactionResult) => {
    toast("Opening source (mock)", { description: r.sourceLabel })
  }, [])

  const handleRefine = useCallback(
    (r: ReactionResult, refinement: string) => {
      // Re-run the agent with the refinement appended for visual feedback,
      // but reuse the existing result set as the source so ranking shifts.
      const q = `${submittedQuery || r.vibeLabel} — ${refinement}`
      runAgent(q, { fromRefinement: true, sourceResults: results })
    },
    [results, submittedQuery, runAgent],
  )

  const handleSelectSearchFromVault = useCallback(
    (q: string) => {
      setQuery(q)
      runAgent(q)
    },
    [runAgent],
  )

  const handleSelectTagFromVault = useCallback(
    (tag: string) => {
      const q = `Reaction with vibe: ${tag}`
      setQuery(q)
      runAgent(q)
    },
    [runAgent],
  )

  // Subtle scroll to top of results when a new run completes
  useEffect(() => {
    if (phase === "running") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [phase])

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
          <VaultSheet
            saved={saved}
            recentSearches={recentSearches}
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
                {saved.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                    {saved.length}
                  </span>
                )}
              </Button>
            }
          />
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

        {/* Agent trace + tools (only while running or after results) */}
        {phase !== "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <AgentTrace steps={trace} query={submittedQuery} />
            <ToolsPanel tools={tools} />
          </div>
        )}

        {/* Results */}
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
              phase === "running" && "opacity-60",
            )}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl text-foreground">
                {results.length} ranked moments
              </h2>
              <p className="text-xs text-muted-foreground">
                {phase === "running" ? "Re-ranking…" : "Sorted by reaction strength"}
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
        isRunning={phase === "running"}
      />
    </main>
  )
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
