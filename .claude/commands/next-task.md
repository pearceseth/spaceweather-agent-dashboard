# Next Task Orchestrator

Pick the next incomplete task from `todos.md`, create a feature branch, plan
the work, implement it with tests, review the result, and present it for human
approval. This command orchestrates the full development workflow.

---

## Step 1 — Read the Task List

Read `todos.md` and find the next incomplete task. Incomplete tasks are lines
that are NOT marked with `[x]`. Take the first one.

If all tasks are complete, report that and stop.

Extract from the task:
- The task description (the full line text)
- A short slug for the branch name (3-5 words, kebab-case, no special chars)

Example: task "Implement KpService with NOAA and GFZ sources" →
slug `implement-kp-service`

---

## Step 2 — Create the Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/<slug>
```

Confirm the branch was created before proceeding. If git fails, stop and
report the error.

---

## Step 3 — Invoke the Planning Subagent

Spawn a subagent to produce the implementation plan. Pass it:
- The task description
- The content of `CLAUDE.md` (already in context)
- The current state of relevant source files (read them first)
- The instruction to save the plan to `.claude/plans/<branch-name>.md`

Invoke with:
```
Task: Plan the implementation for the following task, then save your plan
to .claude/plans/<branch-name>.md

Task description: <task description>

Read the relevant source files before planning. Your plan must follow all
conventions in CLAUDE.md. Use the /plan-task command format.
```

Wait for the subagent to complete and confirm `.claude/plans/<branch-name>.md`
was written before proceeding.

---

## Step 4 — Read the Plan

Read `.claude/plans/<branch-name>.md`. This is your implementation guide.
Follow it. If the plan calls for changes you disagree with or that violate
`CLAUDE.md` conventions, note the conflict in a comment but proceed with the
convention-correct approach and flag it in the final summary.

---

## Step 5 — Implement the Changes

Execute the plan. For each file change:

1. Make the change
2. Run typecheck immediately after: `pnpm --filter <package> typecheck`
3. Fix any type errors before moving to the next file
4. Never leave type errors to fix "at the end"

When all implementation files are written:

```bash
pnpm --filter <package> typecheck   # must pass
```

---

## Step 6 — Write Tests

Write tests as specified in the plan and as required by `CLAUDE.md`. Tests live
in `src/__tests__/` or as `*.test.ts` colocated with source.

Required coverage per `CLAUDE.md`:
- Happy path
- Upstream failure degrades gracefully
- Cache hit on second call
- Normalizer edge cases (if applicable)
- Schema validation of response shape

---

## Step 7 — Run Tests

```bash
pnpm --filter <package> test
```

If tests fail:
1. Read the failure output carefully
2. Fix the implementation or the test (whichever is wrong)
3. Re-run until all tests pass
4. Do not proceed with failing tests

If you cannot get tests to pass after two attempts, stop, document what
failed and why in the summary, and present for human review.

---

## Step 8 — Final Typecheck and Lint

```bash
pnpm --filter <package> typecheck
pnpm --filter <package> lint
```

Both must pass cleanly before proceeding to review.

---

## Step 9 — Invoke the Review Subagent

Spawn a subagent to review the completed work. Pass it:
- The git diff of all changes
- The test output
- The plan file
- The instruction to save the review to `.claude/reviews/<branch-name>.md`

Get the diff with:
```bash
git diff main..HEAD
```

Invoke with:
```
Task: Review the following implementation against the plan and project
conventions. Save your review to .claude/reviews/<branch-name>.md

Use the /review-changes command format.

Plan: <contents of .claude/plans/<branch-name>.md>

Diff:
<git diff output>

Test output:
<test run output>
```

Wait for the subagent to complete and confirm the review file was written.

---

## Step 10 — Read the Review

Read `.claude/reviews/<branch-name>.md`.

If the review verdict is **APPROVED**: proceed to Step 11.

If the verdict is **CHANGES REQUESTED**: address the review feedback now.
Re-run tests after changes. Re-invoke the review subagent. Repeat until
approved or until you've iterated twice — then escalate to human.

If the verdict is **BLOCKED**: stop immediately and present the block to
the human with full context.

---

## Step 11 — Update todos.md

Mark the completed task as done in `todos.md` by changing `[ ]` to `[x]`
on the task line.

---

## Step 12 — Present for Human Approval

Output a structured summary:

```
## Task Complete — Ready for Review

**Task:** <task description>
**Branch:** feature/<slug>

### What Was Done
<2-3 sentences describing the implementation>

### Files Changed
<list of files created or modified>

### Tests
<number> tests written, all passing.
Packages tested: <list>

### Plan
.claude/plans/<branch-name>.md

### Review
.claude/reviews/<branch-name>.md
Verdict: APPROVED

### Next Steps
To merge: git checkout main && git merge feature/<slug>
To discard: git checkout main && git branch -D feature/<slug>
To continue: run /next-task for the next todo item
```

Do not merge the branch. Do not push. Human decides what happens next.
