# @space-weather/types — Package Context

Single source of truth for all types shared between `api` and `web`.
This package must stay minimal and dependency-free (only `effect` and
`@effect/schema`). Read this when working in this package.

---

## The Only Pattern

Every type is an Effect Schema. The schema definition is the single source
of both the TypeScript type and runtime validation. Always export both:

```typescript
import { Schema } from "@effect/schema"

export const KpReading = Schema.Struct({
  time:      Schema.String,
  kp:        Schema.Number,
  estimated: Schema.Boolean,
  source:    Schema.Literal("noaa", "gfz"),
})
// The TypeScript type — derived from the schema, never written separately
export type KpReading = Schema.Schema.Type<typeof KpReading>
```

The `api` package uses schemas to validate upstream data before returning it.
The `web` package uses schemas to decode API responses at the fetch boundary.
One definition, two uses.

---

## File Structure

One file per domain area. Export everything through `src/index.ts`.

```
src/
├── index.ts          ← re-exports from all files
├── kp.ts             ← KpReading, KpHistoryResponse
├── solar-wind.ts     ← SolarWindReading, SolarWindHistoryResponse
├── aurora.ts         ← AuroraForecastResponse
├── events.ts         ← SpaceWeatherEvent, EventType, EventSeverity
├── forecast.ts       ← ForecastDay, ForecastResponse
├── imagery.ts        ← SolarImage, ImageryResponse
├── status.ts         ← StatusResponse
└── agent.ts          ← AgentRequest, AgentResponse
```

When adding a new type file, add its exports to `src/index.ts` immediately.

---

## Schema Conventions

Use the strictest schema that matches reality:

- `Schema.Literal("noaa", "gfz")` not `Schema.String` for known string unions
- `Schema.optional(Schema.Number)` for fields that may be absent (partial failure)
- `Schema.Array(Schema.Struct({...}))` for collections — never `Schema.Unknown`
- Avoid `Schema.Any` and `Schema.Unknown` at the top level — narrow as much
  as the upstream data allows

---

## Dependencies

Only two allowed: `effect` and `@effect/schema`. Nothing else.

If you find yourself wanting to add a dependency here, the type probably
belongs in the package that needs it, not in `@space-weather/types`.

---

## Build

```bash
pnpm --filter @space-weather/types build
```

This package must build before `api` or `web` can typecheck. If you change
types, rebuild this package before running typecheck in other packages.
