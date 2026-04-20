# World Yi Autoresearch Program

This repository uses a World Yi adaptation of the `autoresearch` pattern:

- keep one editable strategy document
- keep one fixed evaluator
- run narrow rounds
- preserve only changes that improve the measured system

The north star is not generic traffic. The north star is:

1. spread World Yi as a modern judgment framework
2. help users see their structure, phase, environment, and next action more clearly
3. help users do the most beneficial thing, avoid obvious harm, and live with more order and ease

## Core Doctrine

Every successful surface, article, tool, report, and CTA should reinforce the same message:

- World Yi is a judgment system, not empty mysticism
- users should understand structure before chasing events
- users should understand timing before forcing outcomes
- users should understand environment before blaming themselves
- every output should end in one concrete next action and one risk reminder

## Fixed Loop

Each round must follow this sequence:

1. Run the evaluator:
   - `npm run autoresearch:world-yi`
2. Pick the weakest lane only:
   - content scale
   - non-seed momentum
   - publication cadence
   - public growth coverage
   - flagship doctrine coverage
   - footprint balance
   - scheduler readiness
3. Make one narrow improvement that raises distribution, clarity, or actionability.
4. Re-run the evaluator and relevant checks.
5. Keep the change only if score, risk profile, or operational clarity improves.

## Autonomous Runtime

This repository now has a single autonomous control entry:

- `POST /api/admin/system/autonomous/cron`

The production goal is:

- one scheduler
- one route
- internal orchestration for knowledge acquisition, content scheduling, report upgrades, digest delivery, and retry cleanup

Operational details live in:

- `world-yi-autonomous-runtime.md`

This should be preferred over keeping multiple CLI daemon loops alive in production.

## Round Constraints

- Do not optimize for vague inspiration. Optimize for clearer judgment and better next actions.
- Do not publish manipulative certainty. Keep boundaries around legal, medical, and financial decisions.
- Prefer shared systems over one-off page edits.
- Prefer reusable metadata, routing, and orchestration over duplicated content.
- Preserve multilingual and diaspora distribution paths.
- Do not count raw article count as success if cadence, quality, or doctrine coherence drops.

## Preferred Execution Order

1. strengthen the World Yi doctrine spine
2. expand public growth coverage
3. improve report -> tool -> content -> case journeys
4. improve publication cadence and draft reserve
5. improve multilingual/global surface balance

## Required Checks

- `npm run qa:world-yi-surfaces`
- `npm run qa:public-surfaces`
- the smallest relevant Jest slice for new logic

## Success Condition

The loop is healthy when:

- World Yi public content keeps expanding without falling back to seed-only publication
- doctrine flagships stay present
- public growth coverage stays complete
- scheduler reserve stays healthy
- the evaluator score trends upward over time

## Source

Inspired by:

- https://github.com/karpathy/autoresearch
- https://raw.githubusercontent.com/karpathy/autoresearch/master/program.md
- https://github.com/codeany-ai/open-agent-sdk-typescript
