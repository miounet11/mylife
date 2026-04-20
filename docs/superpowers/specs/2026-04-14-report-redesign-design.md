# Report Redesign V4 + World-Yi Personality Bridge Design

Date: 2026-04-14
Status: Drafted for review
Scope: Product design for result/report restructuring first, with a forward-compatible World-Yi archetype and SBTI/MBTI bridge layer.

## 1. Goal

This design addresses two related product needs:

1. The current fate-analysis result is too verbose, with visible overlap between sections.
2. The product should evolve toward a more distinctive, professional, and visual system that can later support a World-Yi archetype layer plus a familiar SBTI/MBTI-style bridge.

The first implementation focus is the **existing result/report experience**. The World-Yi personality layer is designed here as a later expansion, not as the first shipping unit.

## 2. Desired outcome

The redesigned result should feel like a **professional judgment dashboard**, not a long stitched article.

Within 30 seconds, the user should understand all of the following:

- what type of person/system they are
- what stage they are currently in
- why the judgment is trustworthy
- what they should do next

The redesign should optimize for three outcomes in balance:

- stronger trust
- clearer actionability
- better conversion into chat, subscription, upgrades, premium services, and return visits

## 3. Recommended direction

Recommended option: **Report cockpit + layered deep dives + source-level de-duplication**.

Why this direction:

- It solves the real issue at the source, not only through UI masking.
- It creates a stronger product identity.
- It creates a clean base for later World-Yi archetype and SBTI/MBTI bridge expansion.

Alternative directions were considered:

- UI-first redesign without generation changes: faster visually, but underlying repetition remains.
- Generation-first rewrite with minimal UI change: better semantics, but weaker product differentiation.

## 4. Information architecture

The result page should be restructured into 8 modules.

### 4.1 Report Cockpit

Purpose: what the user needs to know immediately.

Contents:
- one-line judgment
- current stage label
- type / identity label
- confidence / trust signal
- top 3 actions
- top 2 avoidances
- this month / next quarter / this year summary

### 4.2 Life K-Line Main Axis

Purpose: where the user is in the long arc.

Contents:
- past / current / next phase
- turning points
- current position on the curve
- short explanation of why they are at this point

### 4.3 Core Blueprint

Purpose: why the person is built this way.

Contents:
- natal structure
- favorable and unfavorable forces
- structural strengths
- recurring blind spots
- suitable growth path

### 4.4 Current Operating System

Purpose: why life feels like this right now.

Contents:
- current period diagnosis
- why this period feels this way
- environmental factors
- current posture: push / hold / adjust / recover

### 4.5 12-Month Timeline

Purpose: when to push, pause, prepare, or review.

Contents:
- good windows
- caution windows
- decision windows
- milestone suggestions

### 4.6 Scenario Decision Panels

Purpose: apply the judgment to life domains.

Contents:
- career
- wealth
- relationship
- health / rhythm
- relocation / environment

### 4.7 Action Board

Purpose: what the user should do now.

Contents:
- 7-day actions
- 30-day actions
- 90-day actions
- annual focus

### 4.8 Validation + Next Services

Purpose: show certainty boundaries and continuation paths.

Contents:
- what is high confidence
- what needs verification
- event capture prompts
- chat / subscribe / upgrade / premium service entry

## 5. Bold product UI structure

The result page should stop feeling like a long article and start feeling like a professional report cockpit.

### 5.1 Top screen pattern

The top screen should deliver:
- stage
- type
- evidence
- action

Recommended structure:
- report title and version
- one-line judgment
- stage tag
- identity / archetype tag
- confidence badge
- top actions
- top avoidances

### 5.2 Visual dashboard row

Recommended supporting visuals:
- Life K-Line: main narrative chart
- 12-month rhythm timeline: timing and execution rhythm
- state radar: current balance and pressure distribution
- compact blueprint cards: readable expert reasoning blocks

### 5.3 Section rendering rule

Every section should follow a consistent reading frame:
- one-line conclusion
- why this is the judgment
- how the user should use it
- verification signal

### 5.4 Density rule

- top screen must be understandable in 30 seconds
- each section should contain 1 primary conclusion, up to 3 evidence points, and 1 action block
- long explanation should be hidden under expandable professional reasoning
- repeated text should be replaced by references to earlier sections instead of restatement

## 6. Generation contract to reduce repetition at the source

UI alone is not enough. The pipeline needs a strict section contract.

Each generated module should have:
- one core question
- allowed evidence types
- forbidden overlap
- output length limit
- required action shape

### 6.1 Section ownership model

#### Report Cockpit
Question: what must the user understand immediately?
Allowed: final judgment, current stage, type label, confidence, top actions, top avoidances.
Must not repeat: detailed structure reasoning, long yearly interpretation, scenario deep dives.
Format: 1 headline + short cards.

#### Life K-Line
Question: where is the user on the long arc?
Allowed: phase shifts, turning points, current and next wave, mapped events.
Must not repeat: full natal structure explanation, generic action advice already shown in cockpit.
Format: chart + annotated nodes + short narrative.

#### Core Blueprint
Question: why is the person built this way?
Allowed: day master, structure, useful and unhelpful elements, strengths, blind spots.
Must not repeat: current-year timing, monthly windows, execution calendar.
Format: structural interpretation.

#### Current Operating System
Question: why does life feel like this right now?
Allowed: current DaYun, current year interaction, environmental pressure/opportunity, posture.
Must not repeat: full life story, all domain-specific advice.
Format: diagnosis + posture.

#### 12-Month Timeline
Question: when should the user push, pause, prepare, or review?
Allowed: monthly windows, phase tags, opportunity and risk windows.
Must not repeat: personality explanation, deep scenario logic.
Format: visual timeline + concise notes.

#### Scenario Panels
Question: how does the judgment affect each life domain?
Allowed: domain application logic.
Must not repeat: overall report summary in full.
Format: one verdict + one reason + one action per panel.

#### Action Board
Question: what should the user do now?
Allowed: 7/30/90-day actions, checkpoints, observation tasks.
Must not repeat: high-level destiny interpretation.
Format: checklist / playbook.

#### Validation Layer
Question: what is certain, what is uncertain, and what should be verified next?
Allowed: confidence tiers, event verification prompts, time-sensitive caveats.
Must not repeat: full recommendation copy from above.
Format: trust panel + verification prompts.

### 6.2 Editorial mode separation

Each section should use a different rhetorical mode:
- cockpit = executive summary
- K-line = narrative trajectory
- blueprint = expert structural analysis
- current OS = diagnosis
- timeline = scheduling
- scenario panels = application advice
- action board = operational checklist
- validation = audit / confidence framing

This reduces not only topic overlap, but also stylistic repetition.

### 6.3 Hard anti-duplication guardrails

Each section should support:
- max word budget
- owned concepts
- banned repeat list
- reference phrases to earlier modules instead of restating them

Example references:
- “As established in Core Blueprint …”
- “This section focuses only on timing.”
- “This panel only applies the judgment to career.”

## 7. Visual system

The report should not become a chart museum. Each visual needs one clear job.

### 7.1 Life K-Line

Primary hero visual.

Job:
- show where the user came from
- show where they are now
- show where the next turn may happen

### 7.2 12-month rhythm timeline

A life rhythm board rather than literal project-management Gantt.

Tracks:
- push window
- prepare window
- caution window
- review / recalibration window

### 7.3 State radar

Job:
- show current balance and pressure distribution across domains

Suggested dimensions:
- career pressure
- wealth/resource momentum
- relationship sensitivity
- health/recovery demand
- environment/relocation drive

### 7.4 Blueprint cards

Job:
- replace long explanation walls with compact expert cards

Suggested cards:
- structural type
- strongest advantage
- recurring risk
- useful element / environment
- unsuitable pattern

### 7.5 Mind map placement

Mind maps are useful as a secondary explainer module for:
- how structure, timing, domains, and actions connect
- educational World-Yi explanation
- shareable knowledge content

Mind maps should not be the primary first-screen report view.

## 8. World-Yi personality bridge

The report redesign should be forward-compatible with a later public personality product.

### 8.1 Positioning

Use a two-layer identity system:
- native layer = World-Yi archetype
- bridge layer = SBTI/MBTI-style familiar interpretation

The native archetype stays primary. The MBTI-like layer is only a bridge, not the core logic engine.

### 8.2 Usage rule

Display order:
1. native archetype first
2. familiar bridge label second
3. explicit boundary note that this is a resemblance in decision style, not an exact one-to-one mapping

Example:
- native type: 资源整合型 / 节律推进型
- bridge label: similar decision style to strategic-intuitive organizer types

### 8.3 Shipping boundary

For the first report redesign:
- keep the personality bridge light
- do not make MBTI/SBTI the primary report engine
- build the data model so a fuller archetype system can plug in later

## 9. Architecture and data flow

This redesign should fit the current repository instead of replacing the entire report system.

### 9.1 Likely repo landing points

- `app/result/[id]/page.tsx`: page orchestration and section order
- `lib/report-v2*` / `lib/report-pipeline*`: content shaping and merging
- report panel and chart components: visual rendering
- stored report JSON: durable report artifact

### 9.2 Three-layer implementation split

1. Pipeline layer
   - enforce section ownership
   - shorten output
   - map evidence, actions, and confidence consistently

2. View-model layer
   - transform raw report output into cockpit/cards/timeline/radar data

3. UI layer
   - render the new dashboard-style result page

### 9.3 Suggested component split

- `ReportCockpit`
- `ReportLifeKLine`
- `ReportBlueprintCards`
- `ReportCurrentState`
- `ReportRhythmTimeline`
- `ReportScenarioPanels`
- `ReportActionBoard`
- `ReportValidationPanel`
- `ReportPersonalityBridge`

### 9.4 Graceful degradation

If some generated sections are weak or missing:
- hide confidence badge if no confidence value exists
- show only top 2 scenario panels if quality is sparse
- fall back from monthly detail to higher-level quarter rhythm
- show decision-style tendency instead of forced personality typing if confidence is low

## 10. Rollout

### Phase 1
- new section contract
- cockpit
- K-line
- action board
- shorter report copy

### Phase 2
- rhythm timeline
- state radar
- stronger scenario panels
- validation layer upgrade
- stronger evidence framing

### Phase 3
- personality bridge
- World-Yi archetype system
- public explainers and recommendation loops

## 11. SEO, GEO, share, and recommendation layer

Private result pages should remain non-indexed.

Public growth should come from indexable World-Yi pages such as:
- `/world-yi/archetypes`
- `/world-yi/archetypes/[slug]`
- `/world-yi/sbti`
- `/world-yi/mbti-bridge`
- `/world-yi/how-it-works`
- `/world-yi/examples`
- `/world-yi/applications/*`

### 11.1 SEO and GEO principles

Public pages should be structured for both traditional search and answer engines:
- short definitions
- comparison tables
- methodology sections
- FAQ blocks
- archetype summaries
- who-fits / who-does-not-fit framing
- strong internal linking to cases and applications

### 11.2 Share system

Allowed public share units:
- archetype card
- current stage card
- 12-month rhythm card
- decision advice card
- World-Yi explainer card

Safety rule:
- expose only summary-level content
- never expose private birth data or long-form private report reasoning

### 11.3 Recommendation paths for current users

Suggested funnel:
1. finish result report
2. see native archetype hint
3. click into World-Yi explainer page
4. discover related archetypes and applications
5. return to chat, updates, premium services, or a personality deep-dive product

Suggested recommendation slots:
- inside report cockpit
- below K-line
- inside updates surfaces
- inside cases / knowledge / tools surfaces

## 12. Verification criteria

The redesign should be considered successful only if it improves all of the following:

### 12.1 Content quality
- visible overlap between sections is reduced
- each module has a clearly different job

### 12.2 UX quality
- first screen is understandable in about 30 seconds
- the user can quickly answer: why, when, and what to do

### 12.3 Business quality
- better click-through to chat, events, upgrades, and subscriptions
- lower result-page bounce
- more event capture and return visits

### 12.4 Technical quality
- the page remains stable when some sections are sparse
- charts and cards can render from stored report data without fragile assumptions

## 13. Final recommendation

Ship in this order:

### Track 1 now
- report redesign V4
- anti-repetition generation contract
- cockpit + K-line + rhythm + action board
- light native personality bridge

### Track 2 next
- World-Yi archetype public system
- SBTI/MBTI bridge pages
- SEO/GEO/share/recommendation layer
- OpenAgent-assisted content scaling and orchestration

This sequence improves the current product first while keeping the larger identity and growth system compatible with future work.
