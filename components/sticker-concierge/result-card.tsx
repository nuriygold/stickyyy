"use client"

import { useState } from "react"
import Image from "next/image"
import { Bookmark, BookmarkCheck, Copy, ExternalLink, Sparkles, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { REFINEMENT_CHIPS } from "@/lib/sticker-concierge/data"
import type { ReactionResult } from "@/lib/sticker-concierge/types"
import { cn } from "@/lib/utils"

type Props = {
  result: ReactionResult
  isSaved: boolean
  onCopy: (r: ReactionResult) => void
  onSave: (r: ReactionResult) => void
  onRefine: (r: ReactionResult, refinement: string) => void
  onOpenSource: (r: ReactionResult) => void
}

export function ResultCard({ result, isSaved, onCopy, onSave, onRefine, onOpenSource }: Props) {
  const [refineOpen, setRefineOpen] = useState(false)
  const [refineText, setRefineText] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  const handleSubmitRefine = (text: string) => {
    if (!text.trim()) return
    onRefine(result, text.trim())
    setRefineOpen(false)
    setRefineText("")
  }

  return (
    <article className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(230,178,92,0.15)]">
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        <Image
          src={`/placeholder.svg?height=520&width=520&query=${encodeURIComponent(result.imageQuery)}`}
          alt={`${result.vibeLabel} — ${result.culturalContext}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/0 to-background/0" />

        {/* Match score */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/80 backdrop-blur-md px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-primary" strokeWidth={2.5} />
          <span className="text-xs font-medium tabular-nums text-foreground">
            {result.matchScore}% match
          </span>
        </div>

        {isSaved && (
          <div className="absolute top-3 right-3 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-md px-2.5 py-1">
            <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
              In vault
            </span>
          </div>
        )}

        {/* Bottom labels */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary/90 font-medium mb-1">
            {result.culturalContext}
          </p>
          <h3 className="font-display text-2xl leading-tight text-foreground text-balance">
            {result.vibeLabel}
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
          {result.reason}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {result.tags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="bg-secondary/60 text-secondary-foreground border-0 text-[10px] uppercase tracking-wider font-normal"
            >
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Copy reaction"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-primary" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(result)}
              className={cn(
                "h-8 px-2 text-xs",
                isSaved
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={isSaved ? "Remove from vault" : "Save to vault"}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 mr-1" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 mr-1" /> Save
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRefineOpen((v) => !v)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Refine
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenSource(result)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Open source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Open source</span>
            </Button>
          </div>
        </div>

        {refineOpen && (
          <div className="rounded-xl border border-border bg-background/60 p-3 fade-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">What should we adjust?</p>
              <button
                onClick={() => setRefineOpen(false)}
                className="text-muted-foreground/70 hover:text-foreground"
                aria-label="Close refinement"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {REFINEMENT_CHIPS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSubmitRefine(c.label)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-foreground/85 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmitRefine(refineText)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="e.g. less angry, more judgmental"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60 border-b border-border focus:border-primary/60 pb-1.5 transition-colors"
              />
              <Button
                type="submit"
                size="sm"
                variant="default"
                className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Refine
              </Button>
            </form>
          </div>
        )}
      </div>
    </article>
  )
}
