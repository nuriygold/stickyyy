"use client"

import { PROMPT_CHIPS } from "@/lib/sticker-concierge/data"

type Props = {
  onSelect: (prompt: string) => void
}

export function PromptChips({ onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
        Try a vibe
      </p>
      <div className="flex flex-wrap gap-2">
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-left rounded-full border border-border bg-card/60 hover:bg-card hover:border-primary/40 hover:text-primary transition-colors px-3.5 py-2 text-xs sm:text-sm text-foreground/85"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
