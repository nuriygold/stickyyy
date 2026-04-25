"use client"

import { Check, Loader2 } from "lucide-react"
import type { TraceStep } from "@/lib/sticker-concierge/types"
import { cn } from "@/lib/utils"

type Props = {
  steps: TraceStep[]
  query: string
}

export function AgentTrace({ steps, query }: Props) {
  return (
    <section
      aria-label="Agent trace"
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 fade-up"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 pulse-dot" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Agent run
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
          live
        </span>
      </div>

      <p className="font-display text-2xl leading-tight text-foreground/95 mb-5 text-balance">
        &ldquo;{query}&rdquo;
      </p>

      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-3 text-sm transition-colors",
              step.status === "pending" && "text-muted-foreground/50",
              step.status === "running" && "text-foreground",
              step.status === "complete" && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] shrink-0 transition-colors",
                step.status === "pending" && "border-border/60 text-muted-foreground/50",
                step.status === "running" && "border-primary/60 bg-primary/10 text-primary",
                step.status === "complete" && "border-primary/30 bg-primary/15 text-primary",
              )}
            >
              {step.status === "complete" ? (
                <Check className="h-3 w-3" strokeWidth={2.5} />
              ) : step.status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span>{i + 1}</span>
              )}
            </span>
            <span
              className={cn(
                "font-medium",
                step.status === "running" && "tracking-tight",
              )}
            >
              {step.label}
            </span>
            {step.status === "running" && (
              <span className="ml-1 inline-flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-primary/80 pulse-dot" />
                <span
                  className="h-1 w-1 rounded-full bg-primary/80 pulse-dot"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-1 w-1 rounded-full bg-primary/80 pulse-dot"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
