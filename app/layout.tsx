import type React from "react"
import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sticker Concierge — Find the exact reaction for the moment",
  description:
    "An agentic cultural search assistant. Describe the reaction you can see in your head, and the agent finds the exact iconic moment.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#161212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased grain min-h-screen bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
