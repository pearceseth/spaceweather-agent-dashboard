import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Space Weather Dashboard",
  description: "Real-time space weather monitoring and cosmic readings",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#020810] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
