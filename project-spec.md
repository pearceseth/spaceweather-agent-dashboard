# Space Weather Dashboard — Project Specification

A full-stack TypeScript monorepo combining real-time space weather data with
zodiacal interpretation. The backend aggregates data from NOAA SWPC, NASA DONKI,
GFZ Potsdam, NASA Helioviewer, and NCEI SPOT into a unified API. An agentic
layer powered by Claude synthesizes data into natural language readings. The
frontend is a live dashboard built with Next.js and React.

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Tooling](#2-tooling)
3. [Package: `@space-weather/types`](#3-package-space-weathertypes)
4. [Package: `@space-weather/api`](#4-package-space-weatherapi)
5. [Package: `@space-weather/web`](#5-package-space-weatherweb)
6. [Package: `@space-weather/agent`](#6-package-space-weatheragent)
7. [API Route Reference](#7-api-route-reference)
8. [Upstream Data Sources](#8-upstream-data-sources)
9. [Docker](#9-docker)
10. [Documentation Automation](#10-documentation-automation)
11. [Environment Variables](#11-environment-variables)
12. [Development Workflow](#12-development-workflow)

---

## 1. Monorepo Structure

```
space-weather/
├── packages/
│   ├── types/              # @space-weather/types — shared domain types
│   ├── api/                # @space-weather/api   — Effect-TS HTTP backend
│   ├── web/                # @space-weather/web   — Next.js frontend
│   └── agent/              # @space-weather/agent — Claude agentic layer
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── data-sources.md
│   ├── api/
│   │   ├── overview.md
│   │   ├── status.md
│   │   ├── kp-history.md
│   │   ├── solar-wind.md
│   │   ├── aurora.md
│   │   ├── events.md
│   │   ├── forecast.md
│   │   ├── imagery.md
│   │   └── history-search.md
│   └── agent/
│       ├── overview.md
│       └── tools.md
├── scripts/
│   └── doc-update-agent.py     # GitHub Actions doc automation
├── .github/
│   └── workflows/
│       └── update-docs.yml
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml      # dev override with hot reload
├── package.json                # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── .env.example
```

---

## 2. Tooling

### Package Manager: pnpm

pnpm workspaces handles dependency hoisting, cross-package linking, and
significantly faster installs than npm or yarn. All packages share a single
`node_modules` at the root where possible.

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```json
// package.json (root)
{
  "name": "space-weather",
  "private": true,
  "scripts": {
    "dev":   "turbo run dev",
    "build": "turbo run build",
    "lint":  "turbo run lint",
    "test":  "turbo run test",
    "check": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo":      "latest",
    "typescript": "^5.4.0",
    "prettier":   "^3.2.0",
    "@biomejs/biome": "^1.7.0"
  }
}
```

### Build Orchestration: Turborepo

Turborepo runs tasks across packages in the correct dependency order with
caching. A `turbo run dev` starts all dev servers concurrently; `turbo run build`
ensures `types` builds before `api` and `web`.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Linting and Formatting: Biome

Biome replaces both ESLint and Prettier in a single fast tool. One config at
the root applies to all packages.

```json
// biome.json (root)
{
  "$schema": "https://biomejs.dev/schemas/1.7.3/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

### TypeScript: Shared Base Config

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Each package extends this base and adds its own `paths`, `outDir`, etc.

### Testing: Vitest

Vitest is used across all packages. It's fast, native ESM, and shares
TypeScript configuration with the rest of the project.

```json
// in each package's package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## 3. Package: `@space-weather/types`

**Purpose:** Single source of truth for all domain types shared between the
API and web packages. Neither `api` nor `web` define their own API shapes —
they import from here. This eliminates the most common source of drift in
full-stack TypeScript projects.

**Dependencies:** `effect` only (for Schema definitions).

```
packages/types/
├── src/
│   ├── index.ts
│   ├── kp.ts
│   ├── solar-wind.ts
│   ├── aurora.ts
│   ├── events.ts
│   ├── forecast.ts
│   ├── imagery.ts
│   ├── status.ts
│   └── agent.ts
├── package.json
└── tsconfig.json
```

### Key Types

Types are defined using **Effect Schema** (`@effect/schema`) so the same
definition drives both TypeScript types and runtime validation. The API uses
the schema to validate upstream data; the web package uses the inferred types.

```typescript
// packages/types/src/kp.ts
import { Schema } from "@effect/schema"

export const KpReading = Schema.Struct({
  time:      Schema.String,
  kp:        Schema.Number,
  estimated: Schema.Boolean,
  source:    Schema.Literal("noaa", "gfz"),
})
export type KpReading = Schema.Schema.Type<typeof KpReading>

export const KpHistoryResponse = Schema.Struct({
  readings: Schema.Array(KpReading),
})
export type KpHistoryResponse = Schema.Schema.Type<typeof KpHistoryResponse>
```

```typescript
// packages/types/src/events.ts
import { Schema } from "@effect/schema"

export const EventType = Schema.Literal(
  "SOLAR_FLARE", "CME", "GEOMAGNETIC_STORM", "HIGH_SPEED_STREAM", "ALERT"
)

export const EventSeverity = Schema.Literal("low", "medium", "high")

export const SpaceWeatherEvent = Schema.Struct({
  id:        Schema.String,
  type:      EventType,
  severity:  EventSeverity,
  time:      Schema.String,
  summary:   Schema.String,
  detail:    Schema.Unknown,
  source:    Schema.Literal("donki", "swpc"),
  sourceUrl: Schema.optional(Schema.String),
})
export type SpaceWeatherEvent = Schema.Schema.Type<typeof SpaceWeatherEvent>
```

```typescript
// packages/types/src/status.ts
import { Schema } from "@effect/schema"

export const StatusResponse = Schema.Struct({
  kp:                   Schema.Number,
  kpSource:             Schema.Literal("noaa", "gfz-estimated"),
  gScale:               Schema.String,
  gScaleLabel:          Schema.String,
  bz:                   Schema.optional(Schema.Number),
  bt:                   Schema.optional(Schema.Number),
  solarWindSpeed:       Schema.optional(Schema.Number),
  solarWindDensity:     Schema.optional(Schema.Number),
  xrayFluxClass:        Schema.optional(Schema.String),
  xrayFluxValue:        Schema.optional(Schema.Number),
  protonFlux:           Schema.optional(Schema.Number),
  protonEventInProgress: Schema.Boolean,
  updatedAt:            Schema.String,
})
export type StatusResponse = Schema.Schema.Type<typeof StatusResponse>
```

```typescript
// packages/types/src/agent.ts
import { Schema } from "@effect/schema"

export const AgentRequest = Schema.Struct({
  prompt:   Schema.String,
  sign:     Schema.optional(Schema.String),  // zodiac sign, if provided
  context:  Schema.optional(Schema.String),  // e.g. "aurora", "storm", "general"
})

export const AgentResponse = Schema.Struct({
  text:      Schema.String,
  toolsUsed: Schema.Array(Schema.String),
  model:     Schema.String,
})

export type AgentRequest  = Schema.Schema.Type<typeof AgentRequest>
export type AgentResponse = Schema.Schema.Type<typeof AgentResponse>
```

```json
// packages/types/package.json
{
  "name": "@space-weather/types",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build":     "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@effect/schema": "^0.68.0",
    "effect":         "^3.4.0"
  }
}
```

---

## 4. Package: `@space-weather/api`

**Purpose:** Effect-TS HTTP backend. Aggregates data from upstream space weather
sources, normalizes it, caches it, and exposes REST endpoints. Also hosts the
`/api/ask` agentic endpoint which delegates to `@space-weather/agent`.

**Runtime:** Node.js 20+

**Framework:** `@effect/platform-node` with `@effect/platform` HTTP router.
This keeps the entire stack within the Effect ecosystem — no Express or Hono
needed, though Hono is an acceptable alternative if preferred.

```
packages/api/
├── src/
│   ├── index.ts                 # entry point — starts HTTP server
│   ├── router.ts                # route definitions
│   ├── layers.ts                # ZLayer-equivalent Layer composition
│   ├── clients/
│   │   ├── NoaaSwpcClient.ts
│   │   ├── GfzClient.ts
│   │   ├── NasaDonkiClient.ts
│   │   ├── HelioviewerClient.ts
│   │   └── NceiSpotClient.ts
│   ├── services/
│   │   ├── StatusService.ts
│   │   ├── KpService.ts
│   │   ├── SolarWindService.ts
│   │   ├── AuroraService.ts
│   │   ├── EventService.ts
│   │   ├── ForecastService.ts
│   │   ├── ImageryService.ts
│   │   ├── HistoryService.ts
│   │   └── CacheService.ts
│   ├── errors.ts                # typed error hierarchy
│   └── normalizers/
│       ├── kp.ts
│       ├── timestamp.ts
│       └── events.ts
├── package.json
└── tsconfig.json
```

### Effect Architecture

The API follows the same architectural principles as the ZIO design, mapped
to Effect-TS idioms.

#### Typed Errors

```typescript
// packages/api/src/errors.ts
import { Data } from "effect"

export class UpstreamError extends Data.TaggedError("UpstreamError")<{
  source:  string
  message: string
  cause?:  unknown
}> {}

export class ParseError extends Data.TaggedError("ParseError")<{
  source: string
  cause:  unknown
}> {}

export class CacheError extends Data.TaggedError("CacheError")<{
  key:   string
  cause: unknown
}> {}

export type SpaceWeatherError = UpstreamError | ParseError | CacheError
```

#### Service Pattern

```typescript
// packages/api/src/services/KpService.ts
import { Context, Effect, Layer } from "effect"
import { KpHistoryResponse }      from "@space-weather/types"
import { NoaaSwpcClient }         from "../clients/NoaaSwpcClient.js"
import { GfzClient }              from "../clients/GfzClient.js"
import { CacheService }           from "./CacheService.js"
import { SpaceWeatherError }      from "../errors.js"
import { normalizeKp, normalizeTimestamp } from "../normalizers/kp.js"

// Service interface
export class KpService extends Context.Tag("KpService")<
  KpService,
  {
    readonly getHistory: (hours: number) =>
      Effect.Effect<KpHistoryResponse, SpaceWeatherError>
  }
>() {}

// Live implementation
export const KpServiceLive = Layer.effect(
  KpService,
  Effect.gen(function* () {
    const noaa  = yield* NoaaSwpcClient
    const gfz   = yield* GfzClient
    const cache = yield* CacheService

    return KpService.of({
      getHistory: (hours) =>
        cache.getOrFetch(`kp-history-${hours}`, "3h", () =>
          Effect.gen(function* () {
            // Fan out in parallel, degrade gracefully
            const [noaaResult, gfzResult] = yield* Effect.all(
              [
                noaa.fetchKpHistory().pipe(Effect.option),
                gfz.fetchCurrentKp().pipe(Effect.option),
              ],
              { concurrency: 2 }
            )

            const history = noaaResult
              .pipe(Option.map(rows =>
                rows
                  .slice(-Math.ceil(hours / 3))
                  .map(row => ({
                    time:      normalizeTimestamp(row[0]),
                    kp:        normalizeKp(parseFloat(row[1])),
                    estimated: false,
                    source:    "noaa" as const,
                  }))
              ))
              .pipe(Option.getOrElse(() => []))

            const tip = gfzResult
              .pipe(Option.map(entry => [{
                time:      normalizeTimestamp(entry.time_tag),
                kp:        normalizeKp(entry.kp),
                estimated: true,
                source:    "gfz" as const,
              }]))
              .pipe(Option.getOrElse(() => []))

            // Drop NOAA's unfinalized last entry if GFZ tip is available
            const trimmed = tip.length > 0 ? history.slice(0, -1) : history

            return { readings: [...trimmed, ...tip] }
          })
        )
    })
  })
)
```

#### Cache Service

```typescript
// packages/api/src/services/CacheService.ts
import { Context, Effect, Layer, Ref, Duration } from "effect"
import { CacheError } from "../errors.js"

type CacheEntry<A> = { value: A; expiresAt: number }
type Cache = Map<string, CacheEntry<unknown>>

export class CacheService extends Context.Tag("CacheService")<
  CacheService,
  {
    readonly getOrFetch: <A, E>(
      key:     string,
      ttl:     string,             // "1m", "3h", "30m" etc.
      fetch:   () => Effect.Effect<A, E>
    ) => Effect.Effect<A, E | CacheError>
  }
>() {}

export const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.gen(function* () {
    const cacheRef = yield* Ref.make<Cache>(new Map())

    const parseTtlMs = (ttl: string): number => {
      const unit = ttl.slice(-1)
      const val  = parseInt(ttl.slice(0, -1))
      return unit === "m" ? val * 60_000
           : unit === "h" ? val * 3_600_000
           : val * 1_000
    }

    return CacheService.of({
      getOrFetch: (key, ttl, fetch) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(cacheRef)
          const entry = cache.get(key)

          if (entry && entry.expiresAt > Date.now()) {
            return entry.value as any
          }

          const value      = yield* fetch()
          const expiresAt  = Date.now() + parseTtlMs(ttl)
          yield* Ref.update(cacheRef, m => new Map(m).set(key, { value, expiresAt }))
          return value
        })
    })
  })
)
```

#### HTTP Router

```typescript
// packages/api/src/router.ts
import { HttpRouter, HttpServerResponse } from "@effect/platform"
import { Effect, Layer }                  from "effect"
import { StatusService }                  from "./services/StatusService.js"
import { KpService }                      from "./services/KpService.js"
import { SolarWindService }               from "./services/SolarWindService.js"
import { AuroraService }                  from "./services/AuroraService.js"
import { EventService }                   from "./services/EventService.js"
import { ForecastService }                from "./services/ForecastService.js"
import { ImageryService }                 from "./services/ImageryService.js"
import { HistoryService }                 from "./services/HistoryService.js"
import { AgentService }                   from "@space-weather/agent"

export const ApiRouter = HttpRouter.empty.pipe(

  HttpRouter.get("/api/status",
    Effect.gen(function* () {
      const service = yield* StatusService
      const data    = yield* service.getStatus()
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/kp-history",
    Effect.gen(function* () {
      const service = yield* KpService
      const hours   = 24  // TODO: parse from query params
      const data    = yield* service.getHistory(hours)
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/solar-wind/history",
    Effect.gen(function* () {
      const service = yield* SolarWindService
      const data    = yield* service.getHistory(24)
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/aurora/forecast",
    Effect.gen(function* () {
      const service = yield* AuroraService
      const data    = yield* service.getForecast()
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/events/recent",
    Effect.gen(function* () {
      const service = yield* EventService
      const data    = yield* service.getRecent(20)
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/forecast/3day",
    Effect.gen(function* () {
      const service = yield* ForecastService
      const data    = yield* service.get3Day()
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/imagery/latest",
    Effect.gen(function* () {
      const service = yield* ImageryService
      const data    = yield* service.getLatest()
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.get("/api/history/search",
    Effect.gen(function* () {
      const service = yield* HistoryService
      // TODO: parse query params for start, end, type, limit
      const data    = yield* service.search({})
      return yield* HttpServerResponse.json(data)
    })
  ),

  HttpRouter.post("/api/ask",
    Effect.gen(function* () {
      const service = yield* AgentService
      // TODO: parse request body for prompt, sign, context
      const data    = yield* service.ask({ prompt: "" })
      return yield* HttpServerResponse.json(data)
    })
  ),
)
```

#### Layer Composition

```typescript
// packages/api/src/layers.ts
import { Layer } from "effect"
import { NodeHttpServer } from "@effect/platform-node"
import { CacheServiceLive }     from "./services/CacheService.js"
import { NoaaSwpcClientLive }   from "./clients/NoaaSwpcClient.js"
import { GfzClientLive }        from "./clients/GfzClient.js"
import { NasaDonkiClientLive }  from "./clients/NasaDonkiClient.js"
import { HelioviewerClientLive} from "./clients/HelioviewerClient.js"
import { NceiSpotClientLive }   from "./clients/NceiSpotClient.js"
import { StatusServiceLive }    from "./services/StatusService.js"
import { KpServiceLive }        from "./services/KpService.js"
import { SolarWindServiceLive } from "./services/SolarWindService.js"
import { AuroraServiceLive }    from "./services/AuroraService.js"
import { EventServiceLive }     from "./services/EventService.js"
import { ForecastServiceLive }  from "./services/ForecastService.js"
import { ImageryServiceLive }   from "./services/ImageryService.js"
import { HistoryServiceLive }   from "./services/HistoryService.js"
import { AgentServiceLive }     from "@space-weather/agent"

// Client layer — all upstream HTTP clients
const ClientLayer = Layer.mergeAll(
  NoaaSwpcClientLive,
  GfzClientLive,
  NasaDonkiClientLive,
  HelioviewerClientLive,
  NceiSpotClientLive,
)

// Cache layer
const CacheLayer = CacheServiceLive

// Service layer — depends on clients and cache
const ServiceLayer = Layer.mergeAll(
  StatusServiceLive,
  KpServiceLive,
  SolarWindServiceLive,
  AuroraServiceLive,
  EventServiceLive,
  ForecastServiceLive,
  ImageryServiceLive,
  HistoryServiceLive,
  AgentServiceLive,
).pipe(Layer.provide(ClientLayer), Layer.provide(CacheLayer))

export const AppLayer = ServiceLayer
```

```json
// packages/api/package.json
{
  "name": "@space-weather/api",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "dev":       "tsx watch src/index.ts",
    "build":     "tsc",
    "typecheck": "tsc --noEmit",
    "test":      "vitest run"
  },
  "dependencies": {
    "@effect/platform":      "^0.58.0",
    "@effect/platform-node": "^0.58.0",
    "@effect/schema":        "^0.68.0",
    "@space-weather/agent":  "workspace:*",
    "@space-weather/types":  "workspace:*",
    "effect":                "^3.4.0"
  },
  "devDependencies": {
    "tsx":        "^4.11.0",
    "typescript": "^5.4.0",
    "vitest":     "^1.6.0"
  }
}
```

---

## 5. Package: `@space-weather/web`

**Purpose:** Next.js 14 frontend with App Router. Consumes the API package's
endpoints. Uses TanStack Query for data fetching, Recharts for charts, and
Tailwind CSS for styling.

```
packages/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Overview tab
│   │   ├── solar-wind/
│   │   │   └── page.tsx
│   │   ├── aurora/
│   │   │   └── page.tsx
│   │   ├── events/
│   │   │   └── page.tsx
│   │   └── reading/
│   │       └── page.tsx          # Zodiac reading page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── StatusBar.tsx
│   │   │   ├── KpChart.tsx
│   │   │   ├── SolarWindChart.tsx
│   │   │   ├── AuroraMap.tsx
│   │   │   ├── EventFeed.tsx
│   │   │   ├── ForecastBar.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── agent/
│   │   │   ├── CosmicReading.tsx
│   │   │   └── SignSelector.tsx
│   │   └── ui/
│   │       ├── GlowDot.tsx
│   │       └── StormBadge.tsx
│   ├── hooks/
│   │   ├── useStatus.ts
│   │   ├── useKpHistory.ts
│   │   ├── useSolarWind.ts
│   │   ├── useAurora.ts
│   │   ├── useEvents.ts
│   │   └── useForecast.ts
│   └── lib/
│       ├── api.ts               # typed fetch wrappers
│       ├── queryClient.ts
│       └── colors.ts            # kp color scale etc.
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Data Fetching Hooks

TanStack Query handles caching, polling, loading and error states. Hook
intervals match the API's cache TTLs.

```typescript
// packages/web/src/hooks/useStatus.ts
import { useQuery }     from "@tanstack/react-query"
import { StatusResponse } from "@space-weather/types"
import { fetchStatus }  from "../lib/api.js"

export function useStatus() {
  return useQuery<StatusResponse>({
    queryKey:        ["status"],
    queryFn:         fetchStatus,
    refetchInterval: 60_000,   // matches 1-minute API cache TTL
    staleTime:       30_000,
  })
}

// packages/web/src/hooks/useKpHistory.ts
export function useKpHistory(hours = 24) {
  return useQuery({
    queryKey:        ["kp-history", hours],
    queryFn:         () => fetchKpHistory(hours),
    refetchInterval: 3 * 60 * 60 * 1000,  // 3h — matches Kp finalization cadence
    staleTime:       60 * 60 * 1000,
  })
}
```

### Typed API Client

```typescript
// packages/web/src/lib/api.ts
import { Schema }         from "@effect/schema"
import { StatusResponse, KpHistoryResponse } from "@space-weather/types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

async function fetchAndDecode<A>(
  url:    string,
  schema: Schema.Schema<A>
): Promise<A> {
  const res  = await fetch(url)
  const json = await res.json()
  return Schema.decodeUnknownSync(schema)(json)
}

export const fetchStatus = () =>
  fetchAndDecode(`${BASE}/api/status`, StatusResponse)

export const fetchKpHistory = (hours: number) =>
  fetchAndDecode(`${BASE}/api/kp-history?hours=${hours}`, KpHistoryResponse)

// ... etc for each endpoint
```

Using `Schema.decodeUnknownSync` here means the frontend validates API
responses against the same schema that defines the TypeScript types. If the
API returns an unexpected shape, it throws at the boundary rather than
silently producing bad data.

### Zodiac Reading Feature

```typescript
// packages/web/src/components/agent/CosmicReading.tsx
"use client"
import { useState }    from "react"
import { AgentRequest } from "@space-weather/types"

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

export function CosmicReading() {
  const [sign,    setSign]    = useState<string | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateReading = async () => {
    if (!sign) return
    setLoading(true)

    const body: AgentRequest = {
      prompt:  `What does today's space weather mean for ${sign}?`,
      sign,
      context: "zodiac-reading",
    }

    const res  = await fetch("/api/ask", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    setReading(data.text)
    setLoading(false)
  }

  return (
    <div>
      <SignSelector value={sign} onChange={setSign} signs={SIGNS} />
      <button onClick={generateReading} disabled={!sign || loading}>
        {loading ? "Reading the cosmos..." : "Get My Cosmic Reading"}
      </button>
      {reading && <p>{reading}</p>}
    </div>
  )
}
```

```json
// packages/web/package.json
{
  "name": "@space-weather/web",
  "version": "0.0.0",
  "scripts": {
    "dev":       "next dev -p 3000",
    "build":     "next build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@space-weather/types":    "workspace:*",
    "@effect/schema":          "^0.68.0",
    "@tanstack/react-query":   "^5.40.0",
    "next":                    "^14.2.0",
    "react":                   "^18.3.0",
    "react-dom":               "^18.3.0",
    "recharts":                "^2.12.0",
    "tailwindcss":             "^3.4.0"
  }
}
```

---

## 6. Package: `@space-weather/agent`

**Purpose:** Claude-powered agentic synthesis layer. Exposes an Effect-based
`AgentService` that receives a natural language prompt, runs the tool-use
loop against Claude, and returns synthesized text. Tools call the API's service
layer directly — they do not make HTTP calls.

```
packages/agent/
├── src/
│   ├── index.ts
│   ├── AgentService.ts      # Effect service + Layer
│   ├── tools/
│   │   ├── index.ts         # tool registry
│   │   ├── getCurrentKp.ts
│   │   ├── getSolarWind.ts
│   │   ├── getAuroraForecast.ts
│   │   ├── getRecentEvents.ts
│   │   └── getKpHistory.ts
│   ├── loop.ts              # agentic tool-use loop
│   ├── prompts.ts           # system prompt + zodiac context
│   └── zodiac.ts            # sign → traits, element, ruling planet
├── package.json
└── tsconfig.json
```

### Tool Definition Pattern

```typescript
// packages/agent/src/tools/getCurrentKp.ts
import { Effect }       from "effect"
import { StatusService } from "@space-weather/api/services/StatusService.js"

export const getCurrentKpTool = {
  // Claude sees this definition
  definition: {
    name: "get_current_kp",
    description: `Fetches the current planetary K-index and NOAA geomagnetic
storm scale. Use when you need to assess current geomagnetic activity.
Returns kp (0.0-9.0), gScale (G0-G5), and whether the value is estimated.`,
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // Executed when Claude calls this tool
  execute: (_input: Record<string, unknown>) =>
    Effect.gen(function* () {
      const service = yield* StatusService
      const status  = yield* service.getStatus()
      return JSON.stringify({
        kp:        status.kp,
        gScale:    status.gScale,
        label:     status.gScaleLabel,
        estimated: status.kpSource === "gfz-estimated",
      })
    }),
}
```

### Agentic Loop

```typescript
// packages/agent/src/loop.ts
import { Effect, Option }         from "effect"
import Anthropic                  from "@anthropic-ai/sdk"
import { tools, executeTool }     from "./tools/index.js"
import { AgentResponse }          from "@space-weather/types"
import { SpaceWeatherError }      from "@space-weather/api/errors.js"

const MAX_ROUNDS = 10
const MODEL      = "claude-sonnet-4-20250514"

type Message = Anthropic.MessageParam

export const runAgentLoop = (
  client:     Anthropic,
  messages:   Message[],
  round:      number = 0
): Effect.Effect<AgentResponse, SpaceWeatherError> =>
  Effect.gen(function* () {
    if (round >= MAX_ROUNDS) {
      yield* Effect.fail(new UpstreamError({
        source:  "agent",
        message: `Exceeded ${MAX_ROUNDS} rounds`
      }))
    }

    const response = yield* Effect.tryPromise({
      try: () => client.messages.create({
        model:      MODEL,
        max_tokens: 2048,
        tools:      tools.map(t => t.definition),
        messages,
      }),
      catch: err => new UpstreamError({ source: "anthropic", message: String(err), cause: err })
    })

    const toolsUsed: string[] = []

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter(b => b.type === "text")
        .map(b => (b as Anthropic.TextBlock).text)
        .join("")
      return { text, toolsUsed, model: MODEL }
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content
        .filter(b => b.type === "tool_use") as Anthropic.ToolUseBlock[]

      // Execute all tool calls in parallel
      const results = yield* Effect.all(
        toolUseBlocks.map(block =>
          executeTool(block.name, block.input as Record<string, unknown>)
            .pipe(
              Effect.map(result => ({ id: block.id, name: block.name, result })),
              Effect.catchAll(err =>
                Effect.succeed({
                  id:     block.id,
                  name:   block.name,
                  result: JSON.stringify({ error: String(err) })
                })
              )
            )
        ),
        { concurrency: "unbounded" }
      )

      results.forEach(r => toolsUsed.push(r.name))

      // Append assistant turn and tool results to conversation
      const nextMessages: Message[] = [
        ...messages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: results.map(r => ({
            type:        "tool_result" as const,
            tool_use_id: r.id,
            content:     r.result,
          }))
        }
      ]

      // Recurse
      const next = yield* runAgentLoop(client, nextMessages, round + 1)
      return { ...next, toolsUsed: [...toolsUsed, ...next.toolsUsed] }
    }

    yield* Effect.fail(new UpstreamError({
      source:  "agent",
      message: `Unexpected stop_reason: ${response.stop_reason}`
    }))
  })
```

### Zodiac Context

```typescript
// packages/agent/src/zodiac.ts
export const ZODIAC_TRAITS: Record<string, {
  element:       string
  rulingPlanet:  string
  traits:        string[]
  spaceWeatherSensitivity: string
}> = {
  Aries: {
    element:      "Fire",
    rulingPlanet: "Mars",
    traits:       ["bold", "impulsive", "energetic"],
    spaceWeatherSensitivity:
      "Solar flares amplify Aries energy — heightened passion but also impatience.",
  },
  Taurus: {
    element:      "Earth",
    rulingPlanet: "Venus",
    traits:       ["grounded", "persistent", "sensory"],
    spaceWeatherSensitivity:
      "Geomagnetic storms unsettle Taurus's need for stability. High Kp periods may bring restlessness.",
  },
  // ... all 12 signs
}

export function getZodiacContext(sign: string): string {
  const z = ZODIAC_TRAITS[sign]
  if (!z) return ""
  return `The user's sign is ${sign} — a ${z.element} sign ruled by ${z.rulingPlanet}. ` +
    `Traits: ${z.traits.join(", ")}. Space weather note: ${z.spaceWeatherSensitivity}`
}
```

### System Prompt

```typescript
// packages/agent/src/prompts.ts
export const SYSTEM_PROMPT = `You are a space weather expert with a playful,
mystical side. You have access to real-time solar and geomagnetic data tools.

When answering questions:
1. Always fetch current data using available tools before responding
2. Explain what the numbers mean in plain language — not everyone knows what Kp means
3. For zodiac readings, weave real space weather data into astrological interpretation.
   Be creative and fun — this is entertainment, not science
4. Be concise but complete. 2-4 paragraphs is ideal
5. If data is unavailable, acknowledge it gracefully and work with what you have

Current date context will be provided in each request.`
```

```json
// packages/agent/package.json
{
  "name": "@space-weather/agent",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build":     "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk":    "^0.24.0",
    "@effect/schema":       "^0.68.0",
    "@space-weather/types": "workspace:*",
    "effect":               "^3.4.0"
  }
}
```

---

## 7. API Route Reference

| Method | Path                      | TTL   | Description                          |
|--------|---------------------------|-------|--------------------------------------|
| GET    | `/api/status`             | 1 min | Live vitals: Kp, Bz, wind, X-ray    |
| GET    | `/api/kp-history`         | 3 hrs | 24h Kp time series                   |
| GET    | `/api/solar-wind/history` | 1 min | 24h solar wind speed + Bz            |
| GET    | `/api/aurora/forecast`    | 30min | OVATION probability + oval boundary  |
| GET    | `/api/events/recent`      | 5 min | Flares, CMEs, storms from last 7 days|
| GET    | `/api/forecast/3day`      | 6 hrs | 3-day Kp and storm scale forecast    |
| GET    | `/api/imagery/latest`     | 15min | Solar image URLs from SDO + CCOR-1   |
| GET    | `/api/history/search`     | 1 hr  | Historical event search              |
| POST   | `/api/ask`                | none  | Agentic natural language synthesis   |

### Query Parameters

| Route                     | Param    | Type   | Default | Notes                     |
|---------------------------|----------|--------|---------|---------------------------|
| `/api/kp-history`         | `hours`  | number | 24      | Max 168 (7 days)          |
| `/api/solar-wind/history` | `hours`  | number | 24      | Max 168 (7 days)          |
| `/api/events/recent`      | `limit`  | number | 20      | Max 100                   |
| `/api/history/search`     | `start`  | string | 7d ago  | ISO 8601 date             |
| `/api/history/search`     | `end`    | string | now     | ISO 8601 date             |
| `/api/history/search`     | `type`   | string | all     | CME, FLARE, STORM, HSS    |
| `/api/history/search`     | `limit`  | number | 20      | Max 100                   |
| `/api/history/search`     | `offset` | number | 0       | Pagination                |

---

## 8. Upstream Data Sources

| Source              | Base URL                                            | Key Required | TTL    |
|---------------------|-----------------------------------------------------|--------------|--------|
| NOAA SWPC Products  | `https://services.swpc.noaa.gov/products/`          | No           | Varies |
| NOAA SWPC JSON      | `https://services.swpc.noaa.gov/json/`              | No           | Varies |
| GFZ Potsdam Kp      | `https://kp.gfz-potsdam.de/app/json/`              | No           | 1 min  |
| NASA DONKI          | `https://api.nasa.gov/DONKI/`                       | Yes (free)   | ~15min |
| NASA Helioviewer    | `https://api.helioviewer.org/v2/`                   | No           | ~15min |
| NCEI SPOT           | `https://www.ncei.noaa.gov/cloud-access/space-weather-portal/api/v1/` | No | Archive |

NASA DONKI API key: register free at https://api.nasa.gov. Use `DEMO_KEY`
for development (30 req/hour limit).

---

## 9. Docker

The project ships two Dockerfiles and a `docker-compose.yml` that brings up
the full stack — API and web — with a single command. A separate
`docker-compose.dev.yml` override adds volume mounts and hot reload for local
development.

### Design Principles

**Monorepo-aware builds.** Docker builds for a pnpm workspace require the
entire repo context, not just the package being built. The Dockerfiles use
`COPY` at the repo root level so pnpm can resolve workspace dependencies
correctly. A `.dockerignore` keeps the context lean by excluding
`node_modules`, `.next`, `dist`, and `docs`.

**Multi-stage builds.** Each Dockerfile uses a `builder` stage that installs
all dependencies and compiles TypeScript, then copies only the production
artifacts into a lean `runner` stage. This keeps final image sizes small and
avoids shipping dev dependencies or TypeScript source into production.

**Secrets via environment.** API keys are never baked into images. They are
passed at runtime via `docker-compose.yml` environment variables, which read
from a `.env` file on the host.

---

### `.dockerignore`

Place at the repo root. Applies to all Docker builds.

```
node_modules
**/node_modules
**/.next
**/dist
docs
.git
.github
*.md
scripts
```

---

### `docker/api.Dockerfile`

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for layer caching.
# Docker only re-runs pnpm install if these files change.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json    ./packages/types/
COPY packages/agent/package.json    ./packages/agent/
COPY packages/api/package.json      ./packages/api/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages/types/    ./packages/types/
COPY packages/agent/    ./packages/agent/
COPY packages/api/      ./packages/api/

# Build in dependency order: types → agent → api
RUN pnpm --filter @space-weather/types build
RUN pnpm --filter @space-weather/agent build
RUN pnpm --filter @space-weather/api   build

# ── Stage 2: Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json    ./packages/types/
COPY packages/agent/package.json    ./packages/agent/
COPY packages/api/package.json      ./packages/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/packages/types/dist  ./packages/types/dist
COPY --from=builder /app/packages/agent/dist  ./packages/agent/dist
COPY --from=builder /app/packages/api/dist    ./packages/api/dist

EXPOSE 3001

ENV NODE_ENV=production
ENV API_PORT=3001

CMD ["node", "packages/api/dist/index.js"]
```

---

### `docker/web.Dockerfile`

Next.js has its own multi-stage build convention. The `standalone` output
mode produces a self-contained Node.js server with minimal footprint.

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/web/package.json   ./packages/web/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json  ./
COPY packages/types/     ./packages/types/
COPY packages/web/       ./packages/web/

# Build types first (web depends on them)
RUN pnpm --filter @space-weather/types build

# NEXT_PUBLIC_API_URL must be set at build time for Next.js to inline it.
# In docker-compose this is passed as a build arg.
ARG NEXT_PUBLIC_API_URL=http://api:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @space-weather/web build

# ── Stage 2: Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Next.js standalone output includes its own node_modules subset
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static     ./packages/web/.next/static
COPY --from=builder /app/packages/web/public           ./packages/web/public

EXPOSE 3000

CMD ["node", "packages/web/server.js"]
```

Add `output: "standalone"` to `packages/web/next.config.ts` to enable the
standalone build:

```typescript
// packages/web/next.config.ts
const nextConfig = {
  output: "standalone",
}
export default nextConfig
```

---

### `docker-compose.yml` (production)

```yaml
# docker-compose.yml
name: space-weather

services:

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV:           production
      API_PORT:           3001
      NASA_API_KEY:       ${NASA_API_KEY}
      ANTHROPIC_API_KEY:  ${ANTHROPIC_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/status"]
      interval: 30s
      timeout:  10s
      retries:  3
      start_period: 15s

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
      args:
        # Tells the Next.js build where the API lives inside Docker networking.
        # Service name "api" resolves via Docker's internal DNS.
        NEXT_PUBLIC_API_URL: http://api:3001
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
```

---

### `docker-compose.dev.yml` (development override)

This file is used alongside `docker-compose.yml` during local development.
It mounts source files as volumes and runs the dev servers instead of the
compiled output, giving you hot reload inside Docker.

```yaml
# docker-compose.dev.yml
services:

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
      target: builder          # stop at builder stage — don't need runner
    volumes:
      # Mount source so changes are reflected without rebuilding the image
      - ./packages/api/src:/app/packages/api/src
      - ./packages/agent/src:/app/packages/agent/src
      - ./packages/types/src:/app/packages/types/src
    environment:
      NODE_ENV: development
    command: pnpm --filter @space-weather/api dev

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
      target: builder
    volumes:
      - ./packages/web/src:/app/packages/web/src
      - ./packages/web/public:/app/packages/web/public
    environment:
      NODE_ENV:            development
      NEXT_PUBLIC_API_URL: http://api:3001
    command: pnpm --filter @space-weather/web dev
```

---

### Usage

**Production — full stack in one command:**

```bash
# Copy and fill in your keys
cp .env.example .env

# Build images and start both services
docker compose up --build

# API available at http://localhost:3001
# Web available at http://localhost:3000
```

**Development — with hot reload:**

```bash
# Merge dev override on top of the base compose file
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Rebuild a single service after dependency changes:**

```bash
docker compose build api
docker compose up api
```

**View logs:**

```bash
docker compose logs -f        # all services
docker compose logs -f api    # api only
```

---

### `NEXT_PUBLIC_API_URL` and the Docker Network

There is an important distinction between how the web container and the
browser communicate with the API:

- **Server-side (inside Docker):** The web container calls `http://api:3001`
  using Docker's internal DNS. The service name `api` resolves automatically.
- **Client-side (browser):** The browser cannot reach `http://api:3001`
  because it is not inside the Docker network. In production the web and API
  should be behind a reverse proxy (nginx or a cloud load balancer) that
  routes both under the same domain, eliminating this distinction.

For local development without Docker, `NEXT_PUBLIC_API_URL=http://localhost:3001`
in `.env.local` works as expected since both processes run on the host.

---

## 10. Documentation Automation

A GitHub Actions workflow triggers on every push to `main`. A Python script
reads the git diff, calls Claude to determine which docs need updating, and
opens a PR with the changes. See `scripts/doc-update-agent.py` and
`.github/workflows/update-docs.yml`.

The agent uses `@doc` JSDoc tags in source files as authoritative hints:

```typescript
/**
 * Fetches and normalizes the planetary K-index from NOAA and GFZ.
 *
 * @doc docs/api/kp-history.md
 * @see {@link https://github.com/yourorg/space-weather/blob/main/docs/api/kp-history.md}
 */
export class KpService extends Context.Tag("KpService")< ... >() {}
```

---

## 11. Environment Variables

```bash
# .env.example

# API server port
API_PORT=3001

# NASA DONKI API key (register free at api.nasa.gov)
NASA_API_KEY=DEMO_KEY

# Anthropic API key (required for /api/ask)
ANTHROPIC_API_KEY=sk-ant-...

# Frontend API base URL (consumed by Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Store secrets in `.env.local` (gitignored). Never commit real keys.

---

## 12. Development Workflow

### Initial Setup

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Clone and install all dependencies
git clone https://github.com/yourorg/space-weather
cd space-weather
pnpm install

# Copy env template
cp .env.example .env.local
# Add your NASA_API_KEY and ANTHROPIC_API_KEY to .env.local
```

### Running with Docker

```bash
# Production stack — builds images and starts api + web
docker compose up --build

# Development stack — adds hot reload via volume mounts
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Tail logs for all services
docker compose logs -f
```

### Running Locally (without Docker)

```bash
# Start everything concurrently (API on :3001, web on :3000)
pnpm dev

# Or start packages individually
pnpm --filter @space-weather/api dev
pnpm --filter @space-weather/web dev
```

### Type Checking

```bash
# Check all packages
pnpm check

# Check one package
pnpm --filter @space-weather/api typecheck
```

### Adding a Dependency

```bash
# Add to a specific package
pnpm --filter @space-weather/api add effect

# Add a shared dev dependency at root
pnpm add -D typescript -w
```

### Building for Production

```bash
# Turborepo builds in correct dependency order (types → api + web)
pnpm build
```

### Editor Setup

Open the repo root in VS Code with the following extensions:
- **ESLint / Biome** — linting and formatting
- **Tailwind CSS IntelliSense** — class autocomplete in the web package
- **Effect** — Effect-TS language service plugin (if available)

The entire monorepo is handled by a single VS Code window. TypeScript
language server resolves workspace packages via `paths` in each
`tsconfig.json`, so `import { StatusResponse } from "@space-weather/types"`
gets full autocomplete and go-to-definition across packages.

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | pnpm | Fast, strict, workspace support |
| Build orchestration | Turborepo | Correct build order, caching |
| Linting + formatting | Biome | Single fast tool, replaces ESLint + Prettier |
| Backend framework | `@effect/platform-node` | Stays within Effect ecosystem |
| Type sharing | `@effect/schema` | One definition drives types + runtime validation |
| Data fetching | TanStack Query | Polling, caching, loading states |
| Frontend framework | Next.js 14 (App Router) | Industry standard, Vercel deployment |
| Styling | Tailwind CSS | Utility-first, good dark mode support |
| Charts | Recharts | React-native, composable |
| Testing | Vitest | Fast, native ESM, shared tsconfig |
| Agent SDK | `@anthropic-ai/sdk` | Official, best-supported |
| Effect on frontend | No — standard React | Effect adds complexity without benefit in React components |
| Container orchestration | Docker Compose | Single command to start full stack |
| Dockerfile strategy | Multi-stage builds | Small production images, no dev deps shipped |
| Next.js output mode | `standalone` | Self-contained runner, minimal image size |
| Secrets management | Runtime env vars | Never baked into images, read from `.env` on host |
