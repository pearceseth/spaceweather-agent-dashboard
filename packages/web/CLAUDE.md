# @space-weather/web — Package Context

Next.js 14 frontend with App Router. Consumes the API package's endpoints.
Read this when working in this package.

---

## File Locations

| What | Where |
|------|-------|
| Pages (App Router) | `src/app/` |
| Reusable components | `src/components/` |
| Data fetching hooks | `src/hooks/` |
| API fetch wrappers | `src/lib/api.ts` |
| TanStack Query client | `src/lib/queryClient.ts` |
| Color/scale utilities | `src/lib/colors.ts` |

Components are organized by feature area under `src/components/`:
- `dashboard/` — charts, metric cards, status bar, aurora map, event feed
- `agent/` — cosmic reading UI, sign selector
- `ui/` — shared primitives (GlowDot, StormBadge, etc.)

---

## Types Come from `@space-weather/types`

Never define an API response type in this package. Import everything from
`@space-weather/types`:

```typescript
// CORRECT
import { StatusResponse, KpReading } from "@space-weather/types"

// WRONG — never do this
interface StatusResponse { kp: number; ... }
```

---

## API Responses Must Be Decoded

Use Effect Schema to decode every API response. This validates the shape at
runtime and catches API/frontend drift immediately rather than silently:

```typescript
// src/lib/api.ts
import { Schema }         from "@effect/schema"
import { StatusResponse } from "@space-weather/types"

export const fetchStatus = async (): Promise<StatusResponse> => {
  const res  = await fetch(`${BASE}/api/status`)
  const json = await res.json()
  return Schema.decodeUnknownSync(StatusResponse)(json)
  // throws if the API returns an unexpected shape
}
```

---

## Data Fetching: TanStack Query

One hook per API endpoint in `src/hooks/`. Polling intervals must match the
corresponding API cache TTL — there is no point polling faster than the cache
refreshes.

```typescript
// src/hooks/useStatus.ts
export function useStatus() {
  return useQuery<StatusResponse>({
    queryKey:        ["status"],
    queryFn:         fetchStatus,
    refetchInterval: 60_000,    // 1m — matches API cache TTL
    staleTime:       30_000,
  })
}
```

TTL reference (from the API package):

| Hook | `refetchInterval` |
|------|------------------|
| `useStatus` | 60_000 (1m) |
| `useKpHistory` | 10_800_000 (3h) |
| `useSolarWind` | 60_000 (1m) |
| `useAurora` | 1_800_000 (30m) |
| `useEvents` | 300_000 (5m) |
| `useForecast` | 21_600_000 (6h) |

---

## Effect Is Not Used in React Components

Effect-TS is for the backend. In this package:
- Use standard React hooks (`useState`, `useEffect`, `useCallback`)
- Use TanStack Query for server state
- Use the fetch wrappers in `src/lib/api.ts` for HTTP

The only Effect code in this package is Schema decoding in `src/lib/api.ts`.

---

## Component Conventions

- Server components by default (App Router). Add `"use client"` only when
  needed (event handlers, hooks, browser APIs).
- Tailwind for all styling. No inline styles except for dynamic values
  (e.g. computed colors from the Kp scale).
- Dark theme throughout — background `#020810`, use cyan/amber/red accents
  per the dashboard design. See `src/lib/colors.ts` for the color scale.

---

## Testing

Vitest for unit tests. React Testing Library for component tests.

Required for hooks:
1. Returns loading state initially
2. Returns data after fetch resolves
3. Handles fetch error gracefully (does not throw, returns error state)
4. Decode failure (API returns wrong shape) surfaces as error state

Mock `fetch` globally — no real HTTP in tests.
