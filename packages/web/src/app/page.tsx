import { VERSION } from "@space-weather/types"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-cyan-400">
        Space Weather Dashboard
      </h1>
      <p className="mt-4 text-gray-400">
        Types package version: {VERSION}
      </p>
      <p className="mt-2 text-gray-500">
        Dashboard coming soon...
      </p>
    </main>
  )
}
