# World Yi Operating Model Upgrade

This note absorbs useful engineering ideas from `xuqiu.md` and turns them into direct product rules for Life Kline / World Yi.

## Why This Matters

The key takeaway is: strong products are not a long explanation page, but an operating system of clear actions.

For World Yi, this means:
- less narrative wall text
- stronger action-first layout
- consistent execution paths across pages

## Product Rules (Now Standard)

1. Action First
- Every major page starts with one primary action and 2-4 secondary actions.
- Use `action-guide` + `action-strip` for the operation zone.
- Label operation zones as `快速操作` or `Quick Actions`.

2. Explanation De-Weighting
- Explanatory paragraphs should use `intro-copy`.
- Keep intro copy short and directional, not essay style.
- Prefer one `intro-panel` hint over multiple long paragraphs.

3. Visual Separation
- Clickable actions must use `action-primary` / `action-secondary`.
- Informational tags use `product-chip`.
- Do not style non-actions like buttons.

4. Reusable Assembly
- Use shared UI utility classes rather than page-local button styling.
- Treat page structure as reusable assembly: hero -> quick actions -> supporting blocks.

5. Efficiency Over Completeness
- New pages should prioritize user completion flow over comprehensive explanation.
- Default objective: user sees next step in <5 seconds.

## Applied In This Round

- World Yi pages unified remaining operation labels to `快速操作` / `Quick Actions`.
- World Yi explanatory text further shifted to `intro-copy` style to reduce text dominance.
- Existing action hierarchy retained and reinforced across World Yi entry surfaces.

## PR Review Checklist

- Is the first screen action-first?
- Is there one clearly dominant CTA?
- Are explanation blocks visually lighter than operation blocks?
- Are actions and information chips visually unambiguous?
- Can first-time users know what to do next immediately?
