"use client"

import Link from "next/link"
import Image from "next/image"
import { Bookmark, Clock, Hash, Heart, LogIn, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FAVORITE_MOODS, REUSABLE_TAGS } from "@/lib/sticker-concierge/data"
import type { SavedReaction } from "@/lib/sticker-concierge/types"

type Props = {
  saved: SavedReaction[]
  recentSearches: string[]
  isLoggedIn: boolean
  onRemove: (id: string) => void
  onSelectSearch: (q: string) => void
  onSelectTag: (tag: string) => void
  trigger: React.ReactNode
}

export function VaultSheet({
  saved,
  recentSearches,
  isLoggedIn,
  onRemove,
  onSelectSearch,
  onSelectTag,
  trigger,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-background border-border p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <SheetTitle className="font-display text-2xl text-foreground">
              Sticker Vault
            </SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Saved reactions, recent searches, and reusable moods.
          </p>
        </SheetHeader>

        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl text-foreground mb-1">Sign in to use your vault</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save reactions and access them from any device. Your search history syncs too.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm py-2.5 hover:bg-primary/90 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border text-foreground/85 text-sm py-2.5 hover:border-primary/40 hover:text-foreground transition"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="saved" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-5 mt-3 bg-card border border-border rounded-xl p-1 grid grid-cols-3 h-auto">
              <TabsTrigger
                value="saved"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg"
              >
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg"
              >
                Recent
              </TabsTrigger>
              <TabsTrigger
                value="moods"
                className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg"
              >
                Moods
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-5 pt-4 pb-8">
              <TabsContent value="saved" className="mt-0 space-y-3">
                {saved.length === 0 ? (
                  <EmptyState
                    icon={<Bookmark className="h-5 w-5" />}
                    title="No saved reactions yet"
                    hint="Tap Save on any result to keep it here."
                  />
                ) : (
                  saved.map((s) => (
                    <article
                      key={s.id}
                      className="flex gap-3 rounded-xl border border-border bg-card p-2.5"
                    >
                      <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={`/placeholder.svg?height=160&width=160&query=${encodeURIComponent(s.imageQuery)}`}
                          alt={s.vibeLabel}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-primary/90">
                          {s.culturalContext}
                        </p>
                        <h4 className="font-display text-lg leading-tight text-foreground truncate">
                          {s.vibeLabel}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.tags.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => onRemove(s.id)}
                        aria-label="Remove from vault"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </article>
                  ))
                )}
              </TabsContent>

              <TabsContent value="recent" className="mt-0 space-y-2">
                {recentSearches.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-5 w-5" />}
                    title="No recent searches"
                    hint="Your last queries will show up here."
                  />
                ) : (
                  recentSearches.map((q, i) => (
                    <button
                      key={`${q}-${i}`}
                      onClick={() => onSelectSearch(q)}
                      className="w-full text-left flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-colors px-3 py-2.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground/90 line-clamp-1">{q}</span>
                    </button>
                  ))
                )}
              </TabsContent>

              <TabsContent value="moods" className="mt-0 space-y-5">
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-3.5 w-3.5 text-primary" />
                    <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                      Favorite moods
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FAVORITE_MOODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => onSelectTag(m)}
                        className="rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1 text-xs hover:bg-primary/20 transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </section>

                <Separator className="bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
                      Reusable tags
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {REUSABLE_TAGS.map((t) => (
                      <button
                        key={t}
                        onClick={() => onSelectTag(t)}
                        className="rounded-full border border-border bg-card text-foreground/85 px-3 py-1 text-xs hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </section>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-foreground/90 font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  )
}
