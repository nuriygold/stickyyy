import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-3xl text-foreground mb-2">Check your inbox</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          We sent a confirmation link to your email. Click it to activate your account, then come back to sign in.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center w-full rounded-xl bg-primary text-primary-foreground font-medium text-sm py-3 hover:bg-primary/90 transition"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
