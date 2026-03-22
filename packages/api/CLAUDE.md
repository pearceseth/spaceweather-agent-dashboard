# @space-weather/api — Package Context

Effect-TS HTTP backend. Aggregates upstream space weather data, normalizes it,
caches it, and serves REST endpoints. Read this when working in this package.

---

## File Locations

| What | Where |
|------|-------|
| Upstream HTTP clients | `src/clients/` |
| Business logic services | `src/services/` |
| Route handlers | `src/router.ts` |
| Error types | `src/errors.ts` |
| Data normalizers | `src/normalizers/` |
| Layer composition | `src/layers.ts` |

When adding a new service: create the file, add the Live layer to `layers.ts`,
add the route to `router.ts`. All three, every time.

---

## Service Pattern

Every service uses `Context.Tag` + `Layer.effect`. No exceptions.

```typescript
// 1. Interface
export class KpService extends Context.Tag("KpService")<
  KpService,
  {
    readonly getHistory: (hours: number) =>
      Effect.Effect<KpHistoryResponse, SpaceWeatherError>
  }
>() {}

// 2. Implementation — dependencies resolved via yield*
export const KpServiceLive = Layer.effect(
  KpService,
  Effect.gen(function* () {
    const noaa  = yield* NoaaSwpcClient
    const cache = yield* CacheService
    return KpService.of({
      getHistory: (hours) => cache.getOrFetch(`kp-history-${hours}`, "3h", () =>
        // ... fetch and normalize
      )
    })
  })
)
```

Follow `KpService.ts` as the canonical example when writing a new service.

---

## Error Types

All errors use `Data.TaggedError`. Never throw. Every method's error channel
must be explicit — no implicit `unknown` errors.

```typescript
export class UpstreamError extends Data.TaggedError("UpstreamError")<{
  source:  string
  message: string
  cause?:  unknown
}> {}
```

Graceful degradation — use `Effect.option` so upstream failure returns
partial data instead of crashing the request:

```typescript
const result = yield* upstreamCall().pipe(Effect.option)
// Option.none if failed, Option.some(T) if succeeded
```

---

## Concurrency and Promises

Parallel fan-out:
```typescript
const [a, b] = yield* Effect.all([fetchA(), fetchB()], { concurrency: 2 })
```

Wrapping a Promise:
```typescript
yield* Effect.tryPromise({
  try:   () => fetch(url).then(r => r.json()),
  catch: (err) => new UpstreamError({ source: "noaa", message: String(err), cause: err })
})
```

---

## Cache TTLs

Every service must cache via `CacheService.getOrFetch`. TTLs match upstream
update frequencies — do not guess, use this table:

| Data | TTL | Upstream cadence |
|------|-----|-----------------|
| Status (Kp, Bz, solar wind) | `"1m"` | DSCOVR ~1 min |
| Kp history | `"3h"` | NOAA finalizes every 3h |
| Solar wind history | `"1m"` | DSCOVR high-res |
| Aurora forecast | `"30m"` | OVATION model |
| Events (recent) | `"5m"` | DONKI near-realtime |
| 3-day forecast | `"6h"` | SWPC cadence |
| Imagery URLs | `"15m"` | SDO/CCOR cadence |
| History search | `"1h"` | Historical, immutable |

Cache keys must include any parameters that affect the result:
`"kp-history-${hours}"` not `"kp-history"`.

---

## Route Handlers

Thin. No business logic. Resolve service → call method → return JSON.

```typescript
HttpRouter.get("/api/kp-history",
  Effect.gen(function* () {
    const service = yield* KpService
    const hours   = 24  // parse from query params
    const data    = yield* service.getHistory(hours)
    return yield* HttpServerResponse.json(data)
  })
)
```

---

## JSDoc and Documentation

Every exported service class must have a `@doc` tag:

```typescript
/**
 * Fetches and normalizes the planetary K-index from NOAA and GFZ.
 * @doc docs/api/kp-history.md
 */
export class KpService extends Context.Tag("KpService")< ... >() {}
```

Every new route and service needs a doc file in `docs/api/` or
`docs/services/`. Doc file must include: what it does, params, response
shape, TTL, source URLs, and a relative link back to the source file.

---

## Testing

Vitest. Tests in `src/__tests__/` or as `*.test.ts` colocated with source.

Required for every service:
1. Happy path — correct shape, normalization applied
2. Upstream failure → graceful degradation (partial data returned, not thrown)
3. Cache hit — upstream client called only once across two calls
4. Normalizer edge cases — NOAA thirds (3.33→3.3), Kp clamped [0,9],
   sentinel values (-9999), timestamp format from both NOAA and GFZ

Required for every route handler:
1. Returns correct HTTP status
2. Response validates against the Effect Schema from `@space-weather/types`
3. Query params passed through correctly

Mock all clients with `vi.mock()`. No real HTTP in tests.
