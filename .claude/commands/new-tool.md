# New Agent Tool

Scaffold a new Claude agent tool that exposes an API service to the agentic
loop. Creates the tool file and registers it in the tool registry.

Usage: `/new-tool $ARGUMENTS`

Arguments: `<tool_name> <ServiceName>`

Example: `/new-tool get_solar_flares SolarFlare`

The tool name should be snake_case (how Claude will call it).
The ServiceName should be PascalCase (the Effect service to call).

---

## Step 1 — Parse Arguments

From `$ARGUMENTS` extract:
- `toolName` — snake_case, e.g. `get_solar_flares`
- `ServiceName` — PascalCase, e.g. `SolarFlare`
- `fileName` — e.g. `getSolarFlares.ts`

---

## Step 2 — Read Existing Patterns

Before writing anything, read:
- An existing tool file (e.g. `packages/agent/src/tools/getCurrentKp.ts`)
- `packages/agent/src/tools/index.ts` — the registry
- The service you're wrapping to understand its return type

---

## Step 3 — Write the Tool File

Create `packages/agent/src/tools/<fileName>`:

```typescript
import { Effect }          from "effect"
import { <ServiceName>Service } from "@space-weather/api/services/<ServiceName>Service.js"

/**
 * Agent tool: <toolName>
 * Wraps <ServiceName>Service for use in the Claude agentic loop.
 * @doc docs/agent/tools.md
 */
export const <camelCase(toolName)>Tool = {

  definition: {
    name: "<toolName>",
    description: `<Clear description of what data this returns and when Claude
should use it. Be specific — Claude reads this to decide whether to call the
tool. Mention the key fields returned and what they mean.>`,
    input_schema: {
      type: "object" as const,
      properties: {
        // Add parameters here if the service accepts any
        // Example:
        // limit: {
        //   type: "number",
        //   description: "Maximum number of items to return. Default 10."
        // }
      },
      required: [],
    },
  },

  execute: (input: Record<string, unknown>) =>
    Effect.gen(function* () {
      const service = yield* <ServiceName>Service
      const result  = yield* service.getItems()
      return JSON.stringify(result)
    }),
}
```

---

## Step 4 — Register in Tool Index

Update `packages/agent/src/tools/index.ts`:

1. Import the new tool:
```typescript
import { <camelCase(toolName)>Tool } from "./<fileName>.js"
```

2. Add to the `tools` array:
```typescript
export const tools = [
  getCurrentKpTool,
  getSolarWindTool,
  // ... existing tools ...
  <camelCase(toolName)>Tool,   // add here
]
```

3. Add to the `executeTool` dispatch:
```typescript
case "<toolName>":
  return yield* <camelCase(toolName)>Tool.execute(input)
```

---

## Step 5 — Update docs/agent/tools.md

Add a section for the new tool:

```markdown
### `<toolName>`

**When to use:** <when Claude should call this tool>
**Returns:** <what fields are in the JSON response>
**Service:** `<ServiceName>Service`
**Source:** `packages/agent/src/tools/<fileName>`
```

---

## Step 6 — Write a Test

Create or update `packages/agent/src/__tests__/tools.test.ts`:

```typescript
describe("<toolName>", () => {
  it("returns valid JSON from service", async () => {
    // Mock the service
    // Call execute({})
    // Assert result is parseable JSON
    // Assert result has expected shape
  })

  it("returns error JSON when service fails", async () => {
    // Mock service to throw
    // Assert result is JSON with error field
    // Assert does not throw
  })
})
```

---

## Step 7 — Run Verification

```bash
pnpm --filter @space-weather/agent typecheck
pnpm --filter @space-weather/agent test
```

Both must pass.

---

## Step 8 — Report

```
Scaffolded agent tool: <toolName>

Created:
  packages/agent/src/tools/<fileName>

Modified:
  packages/agent/src/tools/index.ts
  docs/agent/tools.md

Tests: passing
Typecheck: passing

TODOs left for you:
  - Write the tool description (Claude will read this — make it specific)
  - Add input parameters to input_schema if the service takes arguments
  - Update fixture data in tests to match real service output shape
```
