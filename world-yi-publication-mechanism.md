# World Yi Publication Mechanism

## Current Logic

The current publication system now works in five connected layers:

1. Doctrine spine:
   - fixed World Yi pages explain structure, timing, environment, and action.
2. Traffic capture:
   - `public-growth`, `wave2`, and `global` targets pull real search and decision demand into public content.
3. Judgment education:
   - knowledge pieces explain one principle.
   - case pieces show how that principle changes a real decision.
4. Conversion bridge:
   - published pieces lead users back into World Yi surfaces, tools, or analysis entry points.
5. Refresh loop:
   - scheduler and growth queues keep reserve, generation, and promotion moving instead of relying on one-off manual publishing.

## Upgrade

The upgraded mechanism makes the system explicit instead of implicit:

- one publication program file defines weekly slots, lane quotas, and content mix.
- one snapshot engine explains what is live, what is missing, whether the system should stay in gap-fill mode or switch into evergreen expansion, and what should be published next.
- one runner executes publication in balanced weekly batches across `main`, `wave2`, and `global`.
- one expansion rule set keeps each lane above a minimum queued-target reserve so publishing does not stop once the first batch is exhausted.

## Weekly Rhythm

- `main`: 3 slots
- `wave2`: 3 slots
- `global`: 3 slots

Default mix:

- `knowledge`: 40%
- `case`: 50%
- `insight`: 10%

## Operating Rule

Every public item should do three things at once:

1. answer a real user search or life-decision question
2. teach one World Yi judgment principle
3. push toward one concrete next action

## Operating Modes

- `gap-fill`: there are uncovered or ready-to-promote targets, so the system should keep clearing direct publication queues.
- `evergreen-expansion`: direct gaps are no longer the bottleneck, but content scale, cadence, or non-seed momentum are still weak, so the system should replenish each lane with fresh evergreen targets.

## Commands

- `npm run publication:world-yi:plan`
- `npm run publication:world-yi:run -- --json`
- `npm run autoresearch:world-yi`
