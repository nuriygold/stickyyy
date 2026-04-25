"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { LogOut, UserCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  user: User | null
}

export function AuthHeader({ user }: Props) {
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }, [router])

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs">
        <Link href="/auth/login">Sign in</Link>
      </Button>
    )
  }

  const initial = (user.email ?? "?").slice(0, 1).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-1.5 gap-2 text-xs hover:bg-secondary/60"
          aria-label="Account menu"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-medium">
            {initial}
          </span>
          <span className="hidden sm:inline text-foreground/85 max-w-[140px] truncate">
            {user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuItem className="flex-col items-start gap-0.5 cursor-default focus:bg-transparent">
          <div className="flex items-center gap-2 text-foreground">
            <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm truncate max-w-[180px]">{user.email}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
