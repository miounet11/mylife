# Journey System

Use this reference when a task touches cross-surface linking.

## Core file

- `lib/surface-journeys.ts`

## Main builders

- `buildJourneyForTool`
- `buildJourneyForReport`
- `buildJourneyForContent`
- `buildPersonalizedJourney`

## Main output

Each journey returns:

- one report card
- several related tool cards
- several related knowledge cards
- several related case cards

## Rendering surfaces

- `components/surface-journey-panel.tsx`
- `components/personal-journey-hub.tsx`

## Where they are used

- report page
- tool detail page
- tool result page
- knowledge article page
- case detail page
- homepage
- profile page
- history page

## Design rule

If a new surface needs the same report/tool/article/case orchestration, add it here instead of inventing a one-off recommender.
