import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { MainHeader } from "@/components/main-header"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Unihockey Live Tracker",
  description: "Swiss Unihockey Live Tracker - Follow your favorite teams and games",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <MainHeader />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
