import Link from "next/link"
import { Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-foreground/85 hover:text-foreground transition-colors"
        >
          <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium tracking-tight">Sticker Concierge</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Check your inbox.</CardTitle>
            <CardDescription>One last step before you can sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a confirmation link to your email. Click it, and your vault and
              search history will sync the next time you sign in.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
