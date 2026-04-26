import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground mb-2">Auth error</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Something went wrong during authentication. Please try again.
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
