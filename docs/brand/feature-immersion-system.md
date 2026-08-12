# Brand Immersion System — Life K-Line (人生K线)

**Status:** Design v1 (shipped assets under `public/images/brand-immersion/`)  
**Canonical site:** https://www.life-kline.com/

## 1. Brand principles

1. **Structure over superstition** — 结构 / 证据 / 窗口 / 验证. No crystal balls or 「改运必成」.
2. **Rhythm, not destiny** — K-line = 大运段落 + 流年波动 + 可执行窗口.
3. **Editorial Linear calm** — Soft paper, muted ink, brand teal, sparse signal gold.
4. **Self as the solid pillar** — Day pillar (日柱) solid; other pillars open stroke.
5. **Teachers as roles** — 「××老师」 domain specialists, not mystics.

## 2. Logo system

| Element | Meaning |
|--------|---------|
| Four vertical bars | 年 / 月 / 日 / 时 |
| Day pillar (3rd) solid | 用户的「我」 |
| Dashed midline | Judgment baseline |
| Gold diamond | Current moment / signal |

- SVG: `components/ui/brand-mark.tsx`
- App icon: `public/icon.svg` + generated `public/images/brand-immersion/logo-icon.jpg`
- Wordmark art: `logo-wordmark.jpg` (marketing / OG optional)

**Header lockup:** `[BrandMark 28–32] 人生K线 / LIFE KLINE`

## 3. Immersion template anatomy

```
A MEDIA BAND (16:9) → B EYEBROW → C TITLE → D DESC → E ACTIONS → F FOOTER → G BODY
```

Overlay: `light-paper` (default) | `deep-ink` (analyze / teachers / predictions)

## 4. TOP-12 surfaces

| surfaceKey | route | accent | overlay | art file |
|------------|-------|--------|---------|----------|
| home | `/` | ink | light-paper | surface-home |
| analyze | `/analyze` | teal | deep-ink | surface-analyze |
| tools | `/tools` | slate | light-paper | surface-tools |
| dimensions | `/dimensions` | violet | light-paper | surface-dimensions |
| hehun | `/hehun` | rose | light-paper | surface-hehun |
| almanac | `/almanac` | amber | light-paper | surface-almanac |
| naming | `/tools/naming` | indigo | light-paper | surface-naming |
| teachers | `/teachers` | teal | deep-ink | surface-teachers |
| fengshui | `/tools/fengshui-space` | slate | light-paper | surface-fengshui |
| knowledge | `/knowledge` | indigo | light-paper | surface-knowledge |
| profile | `/profile` | ink | light-paper | surface-profile |
| predictions | `/predictions` | violet | deep-ink | surface-predictions |

## 5. Code

- `lib/brand/immersion-surfaces.ts` — registry
- `components/brand/brand-lockup.tsx` — header lockup
- `components/brand/feature-immersion-hero.tsx` — media + FocusHero composition

## 6. Continuity (v1.1–v1.2)

| Surface | Asset / path |
|---------|----------------|
| Favicon / PWA | `public/favicon.ico`, `public/icons/icon-192.png`, `icon-512.png`, `app/apple-icon.png` |
| OG default | `/images/brand-immersion/og-default.jpg` + `app/opengraph-image.jpg` |
| Share PNG | teal plate + four-pillar mark in `download-share-image.tsx` |
| Report cover (pro + agent) | teal plate BrandMark lockup |
| Email shell | `lib/email-layout.ts` teal header + `email-logo.png` |
| Login | immersion `surface-login` |
| Report chapters | `PI-BRAND-DAYUN-01`, `PI-BRAND-YONGSHEN-01` + branded `ReportIllustrationCite` |
| events / membership / cases | immersion heroes |

See implementation files for live wiring.
