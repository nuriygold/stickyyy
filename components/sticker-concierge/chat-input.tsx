"use client"

import { type FormEvent, useEffect, useRef } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isRunning: boolean
}

export function ChatInput({ value, onChange, onSubmit, isRunning }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [value])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim() || isRunning) return
    onSubmit()
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-2xl px-4 pb-4 pt-6 pointer-events-auto">
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-card/95 backdrop-blur-xl p-2.5 shadow-2xl shadow-black/40 transition-colors",
            isRunning ? "border-primary/40" : "border-border",
          )}
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as FormEvent)
              }
            }}
            rows={1}
            placeholder="Describe the reaction you need..."
            className="flex-1 resize-none bg-transparent outline-none text-[15px] leading-6 placeholder:text-muted-foreground/60 py-1.5 max-h-[140px]"
            disabled={isRunning}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim() || isRunning}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 shrink-0"
            aria-label="Submit reaction search"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </form>
        <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
          Sticker Concierge searches real cultural moments. No generated art.
        </p>
      </div>
    </div>
  )
}
