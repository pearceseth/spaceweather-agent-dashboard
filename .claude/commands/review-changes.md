# Review Changes

Review a completed implementation against its plan and project conventions.
Produce a structured verdict with specific, actionable feedback. This command
is used as a subagent by `/next-task` but can be invoked standalone for any
ad-hoc review.

Usage: `/review-changes` (when invoked by orchestrator, context is provided)
Or: `/review-changes <branch-name>` to review a specific branch standalone

---

## Your Job

You are the review subagent. You did not write this code. You are a fresh
set of eyes. Your job is to find problems before they reach `main`.

Be direct. Be specific. If something is wrong, say exactly what is wrong and
exactly what the fix is. Do not soften feedback. Do not approve code that
has real problems just to be agreeable.

A verdict of APPROVED means you are confident the code is correct, tested,
and follows conventions. Do not approve if you are not confident.

---

## Step 1 — Gather Context

If invoked standalone (not by orchestrator), gather context:

```bash
git diff main..HEAD              # all changes on this branch
git log main..HEAD --oneline     # commits on this branch
pnpm --filter <package> test     # run tests and capture output
```

Read:
- The plan file: `.claude/plans/<branch-name>.md`
- `CLAUDE.md` — the conventions to review against

If invoked by orchestrator, the diff, test output, and plan are provided
in context. Use them directly.

---

## Step 2 — Review the Implementation

Work through each changed file systematically. For each file, check:

### Correctness
- Does the implementation match what the plan specified?
- Is the logic correct? (Think through edge cases)
- Are there off-by-one errors, null handling gaps, type assertion risks?
- Does parallel fan-out actually run concurrently (check `concurrency` option)?
- Does cache degradation actually return partial data rather than throwing?

### Effect-TS Conventions
- Does the service use `Context.Tag` + `Layer.effect` (not a class with constructor)?
- Are errors typed with `Data.TaggedError` (not plain objects or strings)?
- Are upstream calls wrapped in `Effect.tryPromise` with explicit error mapping?
- Is `Effect.option` used for graceful degradation (not try/catch)?
- Is `Effect.all` used for parallel calls with `concurrency` specified?

### Type Safety
- Is `any` used anywhere? (If yes: flag it — must be `unknown` with narrowing)
- Are `as` casts used outside of schema decode boundaries? (Flag each one)
- Do all service method signatures have explicit return types?
- Are all new shared types defined in `@space-weather/types`, not in `api` or `web`?

### Cache
- Is the new service registered with `CacheService.getOrFetch`?
- Is the cache TTL correct per the table in `CLAUDE.md`?
- Is the cache key specific enough to avoid collisions?
- Does the cache key include relevant parameters (e.g. `hours` in `kp-history-${hours}`)?

### Routes
- Is the route handler thin? (No business logic — just resolve service, call method, return JSON)
- Is the route added to `router.ts`?
- Is the new service added to the Layer composition in `layers.ts`?

### Agent Tools (if applicable)
- Does the tool call the service layer (not HTTP directly)?
- Is the tool registered in `tools/index.ts`?
- Does the `execute` function return a valid JSON string?
- Is the tool description clear enough for Claude to know when to use it?

### Documentation
- Is there a `@doc` JSDoc tag on every new exported class/function?
- Is there a new doc file in `docs/` for the new route or service?
- Does the doc file include: what it does, params, response shape, TTL, source?

---

## Step 3 — Review the Tests

For each test file, check:

- **Coverage:** Are all required test cases from `CLAUDE.md` present?
  - Happy path ✓
  - Upstream failure degradation ✓
  - Cache hit on second call ✓
  - Normalizer edge cases ✓ (if normalizers involved)
  - Schema validation of response shape ✓

- **Quality:**
  - Are upstream clients properly mocked? (`vi.mock()` — no real HTTP calls)
  - Do tests actually assert on the right things (not just "didn't throw")?
  - Are fixture values representative of real upstream data shapes?
  - Do tests test the right layer (service logic, not just the mock)?

- **Results:** Did all tests pass? If test output shows failures, this is
  a hard block — cannot approve.

---

## Step 4 — Check the Plan Was Followed

Compare the diff against the plan's file list:

- Were all planned files created or modified?
- Were any files changed that weren't in the plan? (If yes: explain why,
  assess whether the unplanned change is appropriate)
- Were all checklist items from the plan completed?

---

## Step 5 — Assign a Verdict

Choose one of three verdicts:

**APPROVED** — Code is correct, tests pass, conventions followed,
documentation present. Safe to merge after human review.

**CHANGES REQUESTED** — Specific issues found that must be fixed before
merge. List each issue with the exact fix required. The implementing agent
should address these and request re-review.

**BLOCKED** — A fundamental problem that requires human decision. Examples:
- The plan itself was wrong and the implementation is technically correct
  but solves the wrong problem
- A convention conflict that requires architectural discussion
- Tests cannot be written because the design is untestable
- Security concern (e.g. API key in code, unsafe input handling)

---

## Step 6 — Write the Review

Save the review to `.claude/reviews/<branch-name>.md`:

```markdown
# Review: <task description>

**Branch:** feature/<slug>
**Verdict:** APPROVED | CHANGES REQUESTED | BLOCKED
**Reviewed:** <timestamp>

## Summary

<2-3 sentences: overall assessment of the implementation>

## Verdict: APPROVED

The implementation correctly follows the plan and all CLAUDE.md conventions.
Tests are comprehensive and passing. Documentation is present and accurate.

---

## Verdict: CHANGES REQUESTED

The following issues must be addressed before this can be merged:

### Issue 1 — <short description> [REQUIRED]

**File:** `packages/api/src/services/FooService.ts`
**Line:** ~45

**Problem:** The cache key `"foo-data"` does not include the `limit` parameter.
If two callers request different limits, they will receive the same cached
response.

**Fix:**
```typescript
// Change:
cache.getOrFetch("foo-data", "5m", () => ...)
// To:
cache.getOrFetch(`foo-data-${limit}`, "5m", () => ...)
```

### Issue 2 — <short description> [REQUIRED]

...

### Issue 3 — <short description> [SUGGESTED]

> SUGGESTED issues are improvements but not blockers. Implementing agent
> may address them or note them for a follow-up task.

---

## Verdict: BLOCKED

**Reason:** <explain the fundamental problem>

**What needs human decision:** <specific question or direction needed>

---

## Checklist

### Implementation
- [x] Service uses Context.Tag + Layer.effect pattern
- [x] Errors use Data.TaggedError
- [x] Upstream calls wrapped in Effect.tryPromise with typed errors
- [x] Graceful degradation with Effect.option
- [x] Parallel calls use Effect.all with concurrency
- [x] Cache registered with CacheService
- [x] Cache TTL matches CLAUDE.md table
- [x] Cache key includes relevant parameters
- [x] Route handler is thin (no business logic)
- [x] New service added to layers.ts
- [x] No `any` types
- [x] No unsafe `as` casts
- [x] Shared types in @space-weather/types

### Tests
- [x] Happy path tested
- [x] Upstream failure degrades gracefully
- [x] Cache hit on second call verified
- [x] Upstream clients mocked (no real HTTP)
- [x] All tests passing

### Documentation
- [x] @doc JSDoc tags on new exports
- [x] Doc file created in docs/
- [x] Doc file complete (endpoint, params, response, TTL, source)

## Notes

<any observations that don't rise to the level of required changes but are
worth the human reviewer knowing — performance considerations, potential
future improvements, etc.>
```

---

## Step 7 — Report to Orchestrator

After saving the review file, report:

```
Review written to .claude/reviews/<branch-name>.md
Verdict: <APPROVED | CHANGES REQUESTED | BLOCKED>
Issues found: <count required> required, <count suggested> suggested
Tests: <count> passing, <count> failing
```
