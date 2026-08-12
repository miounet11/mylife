# System engines — developer map

Canonical roster for later work. **Do not invent a 16th scoring engine** without adding it here and in `lib/system-engines.ts`.

| Surface | Path |
|---------|------|
| Catalog (source of truth) | `lib/system-engines.ts` |
| Natal runner | `lib/natal-engine-chain.ts` → `runNatalEngineChain` |
| Report / 十维 / 合婚 birth wrap | `lib/fortune-context-builder.ts` → `buildFortuneContextInput` |
| 五行 compare | `lib/wuxing-normalize.ts` |
| Public capability page | `/engines` |
| Dated audit notes | `docs/ENGINE_DEEP_AUDIT_2026-08-12.md` |

**Count: 15 product engines** — natal 7 · tool 6 · time 2.  
Not engines: 真太阳时, 六爻教学排卦, LLM copy, agentic report DAG.

---

## How to add a feature

1. Need 四柱 / 用神 / 大运 / K线? Call `buildFortuneContextInput` or `runNatalEngineChain`. Never `determineYongShen(bazi)` without `birthDate`.
2. Compare 五行? `listHasElement(list, raw)` or `toElementCn`. Never `yongShen.includes('木')` against English lists.
3. Display 五行? `toElementCn` / `formatYongShenPublic`. Internal arrays stay English (`wood`).
4. New product engine? Add a row to `SYSTEM_ENGINES`, a test, this file, `/engines` picks it up automatically.

---

## Pipeline

```
civil clock ──resolveEffectiveTiming──► effective time
        │                                      │
        │                                      ▼
        │                              calculateFourPillars
        │                                      │
        │                                      ▼
        └── birthDate+hour ──► determineYongShen (司令分日)
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              calculateDayun    generateLifeKlineV6    analyzeShenSha
                    │                  │
                    └────────┬─────────┘
                             ▼
              analyzeFortune / dimensions / hehun / almanac
```

`analyzeFortune` is the full report assembler. New tools should **not** copy it.

---

## 15 engines

### Natal chain

| id | Name | Call | File | Tests |
|----|------|------|------|-------|
| `pillars` | 四柱排盘 | `calculateFourPillars` | `lib/fortune-engine.ts` | `bazi-pillars-regression` |
| `yongshen` | 用神 / 日主强弱 | `determineYongShen(bazi, { birthDate, birthHour, birthMinute })` | `lib/bazi-analyzer.ts` | `bazi-analyzer`, `yongshen-presentation` |
| `dayun` | 大运 | `calculateDayun` + `resolveDayunList` | `lib/dayun-calculator.ts` | `dayun-normalize` |
| `kline` | 人生K线 | `generateLifeKlineV6` | `lib/kline-v6.ts` | `kline-views`, `kline-single-exit` |
| `shensha` | 神煞 | `calculateShenSha` | `lib/shensha-calculator.ts` | auxiliary |
| `chart-audit` | 排盘核对 | `buildChartAudit` | `lib/chart-audit.ts` | `chart-audit` |
| `fortune-orchestrator` | 报告编排 | `analyzeFortune` | `lib/fortune-engine.ts` | `report-pro-view` |

Rules:

- 用神 version: `YONGSHEN_ENGINE_VERSION` in `lib/yongshen-engine-version.ts`. Bump when 取用 changes.
- 主用神 = 扶抑 only. 调候 is `tiaohuo` / 喜神, never mixed into `yongShen[]` for the user.
- 大运 `ganWuxing` / `zhiWuxing` are English. UI uses `toElementCn`.
- K-line = 原局 + 大运 + 流年. **No `Math.sin`.**

### Tool engines

| id | Name | Call | File | Product URL |
|----|------|------|------|-------------|
| `hehun` | 合婚 | `analyzeHehun` / `personFromBirthInput` | `lib/hehun-engine.ts` | `/hehun` |
| `naming` | 起名 | `generatePersonNames` / `scoreName` | `lib/naming/` | `/tools/naming` |
| `fengshui` | 风水空间 | space APIs | `lib/fengshui/space` | `/tools/fengshui-space` |
| `xiangxue` | 相学 | `heuristicXiangxue` | `lib/xiangxue/engines.ts` | `/tools/physiognomy` |
| `ziwei` | 紫微教学 | `buildEduZiweiChart` | `lib/ziwei/edu-chart.ts` | `/tools/ziwei-edu` |
| `dimensions` | 十维 | `buildDimensionEnginePack` | `lib/dimensions/engine-pack.ts` | `/dimensions` |

十维 **must** reuse `buildFortuneContextInput`. Do not re-排盘 inside an advisor.

### Time engines

| id | Name | Call | File | Product URL |
|----|------|------|------|-------------|
| `almanac` | 通书日运 | `buildAlmanacDayPack` + `buildPersonalDayOverlay` | `lib/almanac/` | `/almanac` |
| `astro` | 星座周期 | `buildAstroDailyMatchPack` | `lib/astro/` | `/astro` |

Time layer is **below** natal. Almanac/astro may overlay 用神; they must not rewrite 日主强弱.

---

## Support modules (not counted)

| id | File | Use |
|----|------|-----|
| `natal-engine-chain` | `lib/natal-engine-chain.ts` | One function for the natal stack |
| `fortune-context` | `lib/fortune-context-builder.ts` | Timing + natal + identity |
| `wuxing-normalize` | `lib/wuxing-normalize.ts` | EN/CN 五行 |
| `solar-time` | `lib/solar-time.ts` | 真太阳时, once per chart |
| `calculation-identity` | `lib/calculation-identity.ts` | Lock clock vs effective time |
| `yongshen-live` | `lib/yongshen-live.ts` | Recompute 用神 on read |
| `yongshen-presentation` | `lib/yongshen-presentation.ts` | User-facing 中文 |
| `liuyao` | `lib/liuyao/cast.ts` | Educational 本卦/变卦 only |

---

## Contracts

### 五行

| Layer | Language | Example |
|-------|----------|---------|
| Engine lists (`yongShen`, `ganWuxing`) | English | `wood` |
| User copy / 起名字库 | Chinese | `木` |
| Compare | `listHasElement` | both |

`ZHI_TO_WUXING` and `GAN_TO_WUXING` in `lib/bazi-constants.ts` are both English.

### 大运 shape

```ts
calculateDayun(...) → { dayuns, dayunList, currentDayun, startAge }
// dayuns === dayunList  (same array)
resolveDayunList(raw) // accept either field
```

### 用神 options

```ts
determineYongShen(bazi, {
  birthDate,   // Date | 'YYYY-MM-DD'
  birthHour,
  birthMinute,
});
```

Without date, 月令 falls back to 本气 (丑月 = 己土 all month). Dimensions used to miss this — `runNatalEngineChain` always passes civil date/time.

---

## Do / don't

| Do | Don't |
|----|--------|
| `runNatalEngineChain` / `buildFortuneContextInput` | Copy Solar/Lunar 排盘 into a tool |
| `listHasElement` / `toElementCn` | `yong.includes('木')` vs English list |
| Bump `YONGSHEN_ENGINE_VERSION` on 取用 change | Silently change 用神 and leave old reports unmarked |
| Add row in `SYSTEM_ENGINES` | Add a scoring file that `/engines` does not list |
| Keep 调候 off 主用神 | Put winter 火 into 用神 next to 水木 |

---

## Quick lookup

```ts
import {
  SYSTEM_ENGINES,
  SYSTEM_SUPPORT_MODULES,
  NATAL_CHAIN_ORDER,
  getSystemEngine,
  getSystemEngineCatalog,
} from '@/lib/system-engines';

import { runNatalEngineChain, resolveYongShenForPillars } from '@/lib/natal-engine-chain';
import { listHasElement, toElementCn } from '@/lib/wuxing-normalize';
```

Public page: https://www.life-kline.com/engines
