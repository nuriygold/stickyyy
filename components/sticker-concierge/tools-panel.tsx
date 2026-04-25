"use client"

import type { AgentTool } from "@/lib/sticker-concierge/types"
import { cn } from "@/lib/utils"

type Props = {
  tools: AgentTool[]
}

const STATUS_LABEL: Record<AgentTool["status"], string> = {
  queued: "queued",
  running: "running",
  complete: "complete",
}

export function ToolsPanel({ tools }: Props) {
  return (
    <section
      aria-label="Tools used"
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 fade-up"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Tools used
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
          {tools.filter((t) => t.status === "complete").length}/{tools.length}
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tools.map((t) => (
          <li
            key={t.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              t.status === "queued" && "border-border/60 bg-background/40",
              t.status === "running" && "border-primary/40 bg-primary/5",
              t.status === "complete" && "border-border bg-card",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground truncate">{t.description}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium",
                t.status === "queued" && "bg-muted text-muted-foreground",
                t.status === "running" && "bg-primary/15 text-primary",
                t.status === "complete" && "bg-foreground/10 text-foreground/80",
              )}
            >
              {STATUS_LABEL[t.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
