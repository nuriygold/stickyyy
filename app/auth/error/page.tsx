import Link from "next/link"
import { Sparkles } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

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
            <CardTitle>Something went sideways.</CardTitle>
            <CardDescription>
              We couldn&apos;t complete that sign-in step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {params?.error ? `Code: ${params.error}` : "An unspecified error occurred."}
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/auth/login">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
