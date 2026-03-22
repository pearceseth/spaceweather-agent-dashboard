# @space-weather/agent — Package Context

Claude tool-use agentic layer. Exposes space weather data to the Claude API
via tool definitions. Tools call the API service layer — they do not make
HTTP calls. Read this when working in this package.

---

## File Locations

| What | Where |
|------|-------|
| Individual tool files | `src/tools/<tool-name>.ts` |
| Tool registry (definitions + dispatch) | `src/tools/index.ts` |
| Agentic loop | `src/loop.ts` |
| System prompt and zodiac context | `src/prompts.ts` |
| Zodiac sign traits | `src/zodiac.ts` |
| Service entry point | `src/AgentService.ts` |

---

## The Critical Rule

**Tools call the service layer. Never make HTTP calls inside a tool.**

```typescript
// CORRECT — call the Effect service
execute: (input) => Effect.gen(function* () {
  const service = yield* KpService          // from @space-weather/api
  const result  = yield* service.getHistory(24)
  return JSON.stringify(result)
})

// WRONG — never do this inside a tool
execute: (input) => Effect.gen(function* () {
  const res = yield* Effect.tryPromise(() => fetch("https://services.swpc.noaa.gov/..."))
})
```

This ensures caching, normalization, and error handling from the service layer
apply in the agentic path too — tools get clean data, not raw upstream responses.

---

## Tool File Structure

Each tool is one file in `src/tools/`. Definition and execute function
are co-located. Always return a JSON string — Claude receives it as text.

```typescript
// src/tools/getCurrentKp.ts
import { Effect }       from "effect"
import { KpService }    from "@space-weather/api/services/KpService.js"

/**
 * Agent tool: get_current_kp
 * @doc docs/agent/tools.md
 */
export const getCurrentKpTool = {

  definition: {
    name: "get_current_kp",
    description: `Fetches the current planetary K-index and NOAA geomagnetic
storm scale. Use when you need to know current geomagnetic activity levels.
Returns: kp (0.0–9.0), gScale (G0–G5), label, estimated (boolean).`,
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  execute: (_input: Record<string, unknown>) =>
    Effect.gen(function* () {
      const service = yield* KpService
      const status  = yield* service.getStatus()
      return JSON.stringify({ kp: status.kp, gScale: status.gScale })
    }),
}
```

---

## Tool Registry

When adding a new tool, update `src/tools/index.ts` in three places:

1. Import the tool
2. Add to the `tools` array (used to pass definitions to Claude)
3. Add a `case` to the `executeTool` dispatch switch

The dispatch must be exhaustive — add a default case that returns an error
JSON if an unknown tool name is received.

---

## Agentic Loop Constraints

`src/loop.ts` runs the tool-use loop. Two rules that must not be changed
without explicit human discussion:

- **Max rounds: 10** — the loop guard prevents infinite execution and runaway
  token costs. Do not increase this.
- **Tool errors return error JSON, not thrown errors** — if a tool's execute
  fails, catch the error and return `JSON.stringify({ error: "..." })` so
  Claude can acknowledge the failure and continue. Never let a tool error
  propagate up and abort the whole loop.

---

## Tool Description Quality

Claude reads tool descriptions to decide whether to call a tool. Bad
descriptions produce bad decisions. A good description:
- Says exactly what data is returned and what the fields mean
- Says when Claude should use it (not just what it does)
- Mentions units where relevant (km/s, nT, 0–9 scale)
- Is specific enough that Claude won't call it when it shouldn't

---

## Testing

Required for every tool:
1. Definition has correct JSON schema shape (type, properties, required)
2. Execute returns a valid JSON string
3. Execute returns error JSON (not thrown) when the service fails
4. The service is called — not any HTTP client

Mock the service dependency, not HTTP. The tool should never be reaching HTTP.
