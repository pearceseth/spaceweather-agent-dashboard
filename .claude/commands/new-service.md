# New Service

Scaffold a complete Effect-TS service from scratch. Creates the service file,
client file, test file, doc file, and updates layers.ts and router.ts.

Usage: `/new-service $ARGUMENTS`

Arguments: `<ServiceName> <upstream-source> <route-path> <cache-ttl>`

Example: `/new-service SolarFlare donki /api/solar-flares 5m`

---

## Step 1 — Parse Arguments

Extract from `$ARGUMENTS`:
- `ServiceName` — PascalCase, e.g. `SolarFlare`
- `upstreamSource` — which client to use, e.g. `donki`, `noaa`, `gfz`
- `routePath` — the API route, e.g. `/api/solar-flares`
- `cacheTtl` — cache duration, e.g. `5m`, `1h`, `30m`

Derive:
- `serviceName` — camelCase, e.g. `solarFlare`
- `serviceTag` — string tag, e.g. `"SolarFlareService"`
- `fileName` — e.g. `SolarFlareService.ts`
- `docFile` — e.g. `docs/api/solar-flares.md`
- `clientImport` — which client class to import

---

## Step 2 — Read Existing Patterns

Before writing anything, read:
- `packages/api/src/services/KpService.ts` — follow this pattern exactly
- `packages/api/src/errors.ts` — use existing error types
- `packages/api/src/layers.ts` — see where to add the new layer
- `packages/api/src/router.ts` — see where to add the new route
- `packages/types/src/index.ts` — see export pattern

---

## Step 3 — Create Types

Create `packages/types/src/<service-name>.ts`:

```typescript
import { Schema } from "@effect/schema"

export const <ServiceName>Item = Schema.Struct({
  // TODO: define based on upstream API response shape
  id:   Schema.String,
  time: Schema.String,
})
export type <ServiceName>Item = Schema.Schema.Type<typeof <ServiceName>Item>

export const <ServiceName>Response = Schema.Struct({
  items: Schema.Array(<ServiceName>Item),
})
export type <ServiceName>Response = Schema.Schema.Type<typeof <ServiceName>Response>
```

Add export to `packages/types/src/index.ts`.

Build types: `pnpm --filter @space-weather/types build`

---

## Step 4 — Create the Service

Create `packages/api/src/services/<ServiceName>Service.ts` following
`KpService.ts` exactly. Key parameters to substitute:
- Tag string: `"<ServiceName>Service"`
- Cache key: `"<service-name>-data"`
- Cache TTL: `<cacheTtl>` argument
- Client dependency: `<UpstreamClient>`
- Return type: `<ServiceName>Response`

---

## Step 5 — Update layers.ts

Add the new Live layer to the service merge in `packages/api/src/layers.ts`.
Import the new service and add `<ServiceName>ServiceLive` to `Layer.mergeAll`.

---

## Step 6 — Update router.ts

Add the new route to `packages/api/src/router.ts`:

```typescript
HttpRouter.get("<routePath>",
  Effect.gen(function* () {
    const service = yield* <ServiceName>Service
    const data    = yield* service.getItems()
    return yield* HttpServerResponse.json(data)
  })
),
```

---

## Step 7 — Create Test File

Create `packages/api/src/__tests__/<ServiceName>Service.test.ts` with:
- Happy path test
- Upstream failure degradation test
- Cache hit test

---

## Step 8 — Create Doc File

Create `<docFile>` with:
- Endpoint, method, description
- Query parameters (if any)
- Response shape (reference the type)
- Cache TTL
- Upstream source URLs

---

## Step 9 — Run Verification

```bash
pnpm --filter @space-weather/types build
pnpm --filter @space-weather/api typecheck
pnpm --filter @space-weather/api test
```

All must pass. Fix any errors before reporting.

---

## Step 10 — Report

```
Scaffolded <ServiceName>Service

Created:
  packages/types/src/<service-name>.ts
  packages/api/src/services/<ServiceName>Service.ts
  packages/api/src/__tests__/<ServiceName>Service.test.ts
  <docFile>

Modified:
  packages/types/src/index.ts
  packages/api/src/layers.ts
  packages/api/src/router.ts

Tests: passing
Typecheck: passing

TODOs left for you:
  - Fill in the actual response shape in packages/types/src/<service-name>.ts
  - Implement the upstream fetch logic in <ServiceName>Service.ts
  - Add fixture data to the test file matching real upstream response shape
```
