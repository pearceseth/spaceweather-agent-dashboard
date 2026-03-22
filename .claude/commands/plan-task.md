# Plan Task

Produce a structured implementation plan for a development task. This command
is used as a subagent by `/next-task` but can also be invoked standalone when
you want to plan before implementing.

Usage: `/plan-task <task description>`

Or invoked by the orchestrator with full context already provided.

---

## Your Job

You are the planning subagent. Your output is a markdown plan that the
implementing agent will follow precisely. You do not write code. You do not
make file changes. You read, reason, and write a plan.

A good plan prevents wasted implementation work. Be specific. Be complete.
Identify risks before they become bugs.

---

## Step 1 — Understand the Task

Read the task description carefully. Identify:
- What capability is being added or changed
- Which package(s) are affected (`types`, `api`, `agent`, `web`)
- Whether new shared types are needed (if yes: `types` package first)
- Whether a new upstream data source is involved

---

## Step 2 — Read the Codebase

Before planning, read the relevant existing files. At minimum:

**For any API service task:**
- `packages/api/src/errors.ts` — existing error types
- `packages/api/src/services/CacheService.ts` — cache interface
- `packages/api/src/layers.ts` — how layers are composed
- `packages/api/src/router.ts` — existing route patterns
- An existing service (e.g. `KpService.ts`) — to match the pattern exactly

**For any agent tool task:**
- `packages/agent/src/tools/index.ts` — tool registry
- An existing tool file — to match the pattern exactly
- `packages/agent/src/loop.ts` — how tools are executed

**For any types task:**
- `packages/types/src/index.ts` — what's currently exported
- Related existing type files — for consistency

**For any web task:**
- `packages/web/src/hooks/` — existing hook patterns
- `packages/web/src/lib/api.ts` — existing fetch wrappers
- A relevant existing component — for style consistency

Do not plan based on assumptions. Read the code.

---

## Step 3 — Identify All Affected Files

List every file that will be created or modified. Be exhaustive. Group by type:

- **New files** (created from scratch)
- **Modified files** (existing files that change)
- **Test files** (new or updated)
- **Doc files** (new or updated per CLAUDE.md requirements)

For each file, note whether it is in a package that must build before another.
If `types` needs changes, it must be planned first.

---

## Step 4 — Check for Convention Conflicts

Review the planned approach against `CLAUDE.md`. Explicitly check:

- [ ] Any new shared types go in `@space-weather/types`, not in `api` or `web`
- [ ] Services use `Context.Tag` + `Layer.effect` pattern — not classes
- [ ] New services are added to `layers.ts` Layer composition
- [ ] Route handlers are thin — no business logic
- [ ] Cache TTL matches the upstream source's update frequency
- [ ] Tools call services directly, not HTTP
- [ ] Every new export has a `@doc` JSDoc tag
- [ ] Tests cover happy path, failure degradation, and cache behavior

If a convention conflict exists, note it explicitly and resolve it in the plan.

---

## Step 5 — Identify Risks and Decisions

List any decisions the implementing agent will need to make that aren't
obvious from the task description. Examples:
- Ambiguous data shapes from upstream APIs
- Whether to reuse an existing normalizer or write a new one
- Whether the cache key needs to include query parameters
- Type inference challenges

For each risk, provide a recommended resolution so the implementing agent
doesn't have to guess.

---

## Step 6 — Write the Plan

Write the plan to `.claude/plans/<branch-name>.md` in this format:

```markdown
# Plan: <task description>

**Branch:** feature/<slug>
**Packages affected:** <list>
**Estimated files:** <count>

## Summary
<2-3 sentences: what this does and why>

## Implementation Order

Tasks must be done in this order to avoid broken intermediate states:

1. <first thing — usually types if new schemas needed>
2. <second thing>
3. ...

## File Changes

### New Files

#### `packages/api/src/services/FooService.ts`
**Purpose:** <what it does>
**Pattern:** Follow KpService.ts exactly
**Key decisions:**
- Cache key: `"foo-data-${param}"`
- Cache TTL: `"5m"` (DONKI updates ~15min, 5min is appropriate)
- Error type: `UpstreamError` with source `"donki"`
- Fan out: fetch X and Y in parallel, degrade if either fails

#### `packages/types/src/foo.ts`
**Purpose:** <what it does>
**Exports:**
- `FooItem` schema + type
- `FooResponse` schema + type

### Modified Files

#### `packages/api/src/layers.ts`
**Change:** Add `FooServiceLive` to the service layer merge
**Location:** Add after `EventServiceLive`

#### `packages/api/src/router.ts`
**Change:** Add `GET /api/foo` route
**Pattern:** Follow existing routes exactly

#### `packages/types/src/index.ts`
**Change:** Export new types from `./foo.ts`

## Test Plan

### `packages/api/src/__tests__/FooService.test.ts`

Test cases:
1. `getItems() returns normalized data from DONKI`
   - Mock DONKI client to return fixture data
   - Assert result shape matches FooResponse schema
   - Assert normalizers applied (check specific field values)

2. `getItems() degrades gracefully when DONKI fails`
   - Mock DONKI client to throw
   - Assert result is returned (empty or partial) not thrown
   - Assert no unhandled error

3. `getItems() hits cache on second call`
   - Call twice
   - Assert underlying client called only once

4. `normalizeItem() handles edge cases`
   - Null input field → default value
   - Out-of-range value → clamped

## Documentation

- Create: `docs/api/foo.md`
  - Endpoint, params, response shape, TTL, source URLs
- Update: `docs/data-sources.md` if new upstream source

## Risks and Decisions

| Risk | Resolution |
|------|-----------|
| DONKI returns different shapes for different event types | Normalize in the client, not the service |
| Cache key collision if two routes use same data | Prefix keys with service name |

## Checklist for Implementing Agent

- [ ] Types package builds before api package changes
- [ ] All new exports have `@doc` JSDoc tags
- [ ] `layers.ts` updated with new Live layer
- [ ] `router.ts` updated with new route
- [ ] `docs/` file created
- [ ] Tests written and passing
- [ ] Typecheck passes
- [ ] Lint passes
```

---

## Step 7 — Confirm the Plan is Saved

After writing the plan file, confirm its location and that it was written
successfully. Report to the orchestrating agent:

```
Plan written to .claude/plans/<branch-name>.md
Affected packages: <list>
Files to create: <count>
Files to modify: <count>
Test cases planned: <count>
Risks identified: <count>
Ready for implementation.
```
