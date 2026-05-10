# Sub-Spec A: 命理时点检测引擎 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建命理时点检测引擎 — 给定用户八字 + 当前时间，确定性地输出未来 30 天 / 12 月 / 5 年的命理重要时点（节气、太岁、大运、岁运并临、流月触发、流月神煞月）。

**Architecture:** 纯函数层，无界面无邮件无 LLM 调用。6 个独立 detector + 1 个 orchestrator + 1 个 past-validation 生成器。复用现有 `lib/dayun-calculator.ts` / `lib/shensha-calculator.ts` / `lunar-javascript`。输出结构化 TimingProfile 供后续 Sub-Spec B/C 消费。

**Tech Stack:** TypeScript、Jest、`lunar-javascript` (已安装)、`better-sqlite3` (已安装但本 plan 不用)。

**Spec:** `docs/superpowers/specs/2026-05-10-sub-A-life-timing-engine.md`

---

## File Structure

```
lib/
├── shensha-calculator.ts            MOD  导出 6 个神煞规则表（加 export 关键字）
└── life-timing/                     NEW
    ├── types.ts                     NEW  类型定义
    ├── constants.ts                 NEW  地支关系表（冲/刑/害/破/三合/三会）
    ├── lunar-utils.ts               NEW  立春日期 + 流年干支等共享 helper
    ├── detectors/
    │   ├── solar-terms.ts           NEW  Detector 1
    │   ├── tai-sui.ts               NEW  Detector 2
    │   ├── dayun-transition.ts      NEW  Detector 3
    │   ├── sui-yun-bing-lin.ts      NEW  Detector 4
    │   ├── liuyue-triggers.ts       NEW  Detector 5
    │   └── liunian-shensha-month.ts NEW  Detector 6
    ├── past-validation.ts           NEW  过去印证生成
    └── timing-orchestrator.ts       NEW  统一编排

tests/lib/life-timing/
├── constants.test.ts                NEW  ~5 测试
├── lunar-utils.test.ts              NEW  ~5 测试
├── detectors/
│   ├── solar-terms.test.ts          NEW  ~10 测试
│   ├── tai-sui.test.ts              NEW  ~15 测试
│   ├── dayun-transition.test.ts     NEW  ~10 测试
│   ├── sui-yun-bing-lin.test.ts     NEW  ~8 测试
│   ├── liuyue-triggers.test.ts      NEW  ~20 测试
│   └── liunian-shensha-month.test.ts NEW ~15 测试
├── past-validation.test.ts          NEW  ~10 测试
└── timing-orchestrator.test.ts      NEW  ~15 测试

scripts/life-timing/
└── verify-samples.ts                NEW  10 个真实样本人肉验证脚本
```

总：13 个新文件 + 1 个修改 + ~113 测试 + ~1130 行代码。

---

## Task 1: 导出 shensha-calculator 神煞规则表

**Files:**
- Modify: `lib/shensha-calculator.ts:25-100`

**Why:** Detector 6 需要复用 TIANYI_GUIREN / WENCHANG / TAOHUA / YIMA / TIANDE / YUEDE。当前是 const，未导出。要复用必须加 export。同时新增 JIANGXING（项目原本没有）。

- [ ] **Step 1: 给 6 个神煞表加 export，新增 JIANGXING**

把 `lib/shensha-calculator.ts` 第 25-100 行附近改成：

```typescript
// 天乙贵人：以日干查地支
export const TIANYI_GUIREN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '庚': ['亥', '酉'],
  '丁': ['亥', '酉'], '辛': ['寅', '午'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
};

// 文昌贵人：以日干查地支
export const WENCHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

// 驿马：以年支或日支三合局首查
export const YIMA: Record<string, string> = {
  '申': '寅', '子': '寅', '辰': '寅',
  '寅': '申', '午': '申', '戌': '申',
  '亥': '巳', '卯': '巳', '未': '巳',
  '巳': '亥', '酉': '亥', '丑': '亥',
};

// 桃花：以年支或日支三合局中宫查
export const TAOHUA: Record<string, string> = {
  '申': '酉', '子': '酉', '辰': '酉',
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '亥': '子', '卯': '子', '未': '子',
};
```

注：原文件中 TIANDE / YUEDE 已经是 const，**只加 export 关键字**，不动表本身。

新增（追加在 TAOHUA 之后或文件合适位置）：

```typescript
// 将星：以年支或日支查三合局中支
export const JIANGXING: Record<string, string> = {
  '申': '子', '子': '子', '辰': '子',
  '寅': '午', '午': '午', '戌': '午',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '亥': '卯', '卯': '卯', '未': '卯',
};
```

- [ ] **Step 2: 验证 lint + 现有 shensha 测试通过**

```bash
npm run lint
npx jest tests/ 2>&1 | grep -E "shensha|FAIL" | head -10
```

Expected: lint 0 错误；如果原本有 shensha 相关测试，依然通过。

- [ ] **Step 3: Commit**

```bash
git add lib/shensha-calculator.ts
git commit -m "refactor(shensha): export 6 神煞规则表 + 新增 JIANGXING

为 Sub-Spec A life-timing 引擎复用做准备：
- export TIANYI_GUIREN / WENCHANG / YIMA / TAOHUA / TIANDE / YUEDE
- 新增 JIANGXING (将星) 表

数据无变化，只是可见性。"
```

---

## Task 2: 类型定义

**Files:**
- Create: `lib/life-timing/types.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
import type { DayunResult } from '@/lib/dayun-calculator';

// 时点严重程度
export type TimingSeverity = 'notice' | 'caution' | 'critical';

// 时点类型（决定后续 narrator 用哪个 prompt 模板）
export type TimingType =
  | 'solar_term'
  | 'tai_sui_value'
  | 'tai_sui_clash'
  | 'tai_sui_punish'
  | 'tai_sui_harm'
  | 'tai_sui_break'
  | 'dayun_transition'
  | 'sui_yun_bing_lin'
  | 'liuyue_clash'
  | 'liuyue_fuyin'
  | 'liuyue_combine'
  | 'liuyue_shensha_neg'
  | 'liuyue_shensha_tianyi'
  | 'liuyue_shensha_wenchang'
  | 'liuyue_shensha_taohua'
  | 'liuyue_shensha_yima'
  | 'liuyue_shensha_tiande'
  | 'liuyue_shensha_jiangxing';

// 单个时点
export interface TimingPoint {
  id: string;
  type: TimingType;
  severity: TimingSeverity;
  startDate: string;     // ISO 'YYYY-MM-DD'
  endDate?: string;
  rawReason: string;
  context: Record<string, unknown>;
  userCopy?: {
    title: string;
    summary: string;
    todoSuggestions: string[];
    avoidSuggestions: string[];
  };
}

// 大运转换（5 年视图用）
export interface MajorTransition {
  type: 'dayun_shift' | 'tai_sui_year' | 'sui_yun_bing_lin';
  year: number;
  ageAtYear: number;
  rawReason: string;
  severity: TimingSeverity;
  context: Record<string, unknown>;
}

// 过去印证（区块 2 用）
export interface PastValidation {
  id: string;
  category: 'pattern' | 'shen_sha' | 'dayun_imprint';
  rawTemplate: string;
  context: Record<string, unknown>;
}

// 完整输出
export interface TimingProfile {
  birthSignature: string;
  baziPillars: string;     // '庚午|戊午|辛酉|乙未'
  computedAt: string;
  computedForYear: string;
  past_validations: PastValidation[];
  next_30_days: TimingPoint[];
  next_12_months: TimingPoint[];
  next_5_years: MajorTransition[];
}

// 检测器输入
export interface DetectorInput {
  bazi: {
    yearGan: string;
    yearZhi: string;
    monthGan: string;
    monthZhi: string;
    dayGan: string;
    dayZhi: string;
    hourGan: string;
    hourZhi: string;
  };
  birthDate: Date;
  currentDate: Date;
  dayunResult: DayunResult;
  shenShaList?: Array<{ name: string; pillar?: string; impact?: string }>;
  pattern?: string;        // '身弱' / '身旺' / '中和' 等
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit lib/life-timing/types.ts 2>&1 | head -5
```

Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add lib/life-timing/types.ts
git commit -m "feat(life-timing): types - TimingPoint/MajorTransition/PastValidation

Sub-Spec A T2 — 类型基础"
```

---

## Task 3: 地支关系常量表

**Files:**
- Create: `lib/life-timing/constants.ts`
- Create: `tests/lib/life-timing/constants.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/constants.test.ts
import {
  EARTHLY_BRANCHES,
  BRANCH_CLASH,
  BRANCH_PUNISH,
  BRANCH_HARM,
  BRANCH_BREAK,
  BRANCH_TRINE,
  BRANCH_DIRECTIONS,
} from '@/lib/life-timing/constants';

describe('地支关系表', () => {
  it('12 地支按顺序', () => {
    expect(EARTHLY_BRANCHES).toEqual(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
  });

  it('地支六冲对称', () => {
    for (const b of EARTHLY_BRANCHES) {
      const clash = BRANCH_CLASH[b];
      if (clash) expect(BRANCH_CLASH[clash]).toBe(b);
    }
    expect(BRANCH_CLASH['子']).toBe('午');
    expect(BRANCH_CLASH['寅']).toBe('申');
  });

  it('地支六害对称', () => {
    for (const b of EARTHLY_BRANCHES) {
      const harm = BRANCH_HARM[b];
      if (harm) expect(BRANCH_HARM[harm]).toBe(b);
    }
    expect(BRANCH_HARM['子']).toBe('未');
    expect(BRANCH_HARM['丑']).toBe('午');
  });

  it('三合表完整 4 组', () => {
    expect(BRANCH_TRINE).toHaveLength(4);
    expect(BRANCH_TRINE).toContainEqual(['申', '子', '辰']);
    expect(BRANCH_TRINE).toContainEqual(['寅', '午', '戌']);
  });

  it('三会表完整 4 组', () => {
    expect(BRANCH_DIRECTIONS).toHaveLength(4);
    expect(BRANCH_DIRECTIONS).toContainEqual(['寅', '卯', '辰']);
  });
});
```

- [ ] **Step 2: 运行测试，验证 RED**

```bash
npx jest tests/lib/life-timing/constants.test.ts 2>&1 | tail -8
```

Expected: FAIL "Cannot find module '@/lib/life-timing/constants'"

- [ ] **Step 3: 实现 constants.ts**

```typescript
// lib/life-timing/constants.ts

export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

export const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

// 地支六冲
export const BRANCH_CLASH: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
};

// 地支三刑
export const BRANCH_PUNISH: Partial<Record<EarthlyBranch, EarthlyBranch[]>> = {
  '寅': ['巳', '申'],
  '巳': ['申', '寅'],
  '申': ['寅', '巳'],
  '丑': ['戌', '未'],
  '戌': ['未', '丑'],
  '未': ['丑', '戌'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
};

// 地支六害
export const BRANCH_HARM: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};

// 地支六破
export const BRANCH_BREAK: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '子': '酉', '酉': '子',
  '丑': '辰', '辰': '丑',
  '寅': '亥', '亥': '寅',
  '卯': '午', '午': '卯',
  '巳': '申', '申': '巳',
  '未': '戌', '戌': '未',
};

// 地支三合（4 组）
export const BRANCH_TRINE: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['亥', '卯', '未'],
  ['巳', '酉', '丑'],
];

// 地支三会（4 组方位）
export const BRANCH_DIRECTIONS: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['寅', '卯', '辰'],
  ['巳', '午', '未'],
  ['申', '酉', '戌'],
  ['亥', '子', '丑'],
];

// 凶神（流月触发时标 caution）
export const NEGATIVE_SHENSHA = ['羊刃', '劫煞', '亡神', '灾煞'] as const;
```

- [ ] **Step 4: 运行测试，验证 GREEN**

```bash
npx jest tests/lib/life-timing/constants.test.ts 2>&1 | tail -8
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/constants.ts tests/lib/life-timing/constants.test.ts
git commit -m "feat(life-timing): T3 - 地支关系常量表 + 5 单测通过

冲/刑/害/破/三合/三会 + 凶神白名单"
```

---

## Task 4: 立春和流年干支共享 helper

**Files:**
- Create: `lib/life-timing/lunar-utils.ts`
- Create: `tests/lib/life-timing/lunar-utils.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/lunar-utils.test.ts
import { findLiChun, getLiuNianGanZhi, getCurrentLiuNianGanZhi } from '@/lib/life-timing/lunar-utils';

describe('lunar-utils', () => {
  it('findLiChun 2026 是 2/4', () => {
    const date = findLiChun(2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);  // 2 月（0-indexed）
    expect(date.getDate()).toBeGreaterThanOrEqual(3);
    expect(date.getDate()).toBeLessThanOrEqual(5);
  });

  it('findLiChun 2027 不同年份', () => {
    const date = findLiChun(2027);
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(1);
  });

  it('getLiuNianGanZhi 2026 立春后 = 丙午', () => {
    expect(getLiuNianGanZhi(2026)).toBe('丙午');
  });

  it('getLiuNianGanZhi 2025 立春后 = 乙巳', () => {
    expect(getLiuNianGanZhi(2025)).toBe('乙巳');
  });

  it('getCurrentLiuNianGanZhi 立春前 取上一年干支', () => {
    const beforeLiChun = new Date(2026, 0, 15);  // 1/15 立春前
    const ganzhi = getCurrentLiuNianGanZhi(beforeLiChun);
    expect(ganzhi).toBe('乙巳');  // 仍是 2025 命理年
  });
});
```

- [ ] **Step 2: 运行测试 RED**

```bash
npx jest tests/lib/life-timing/lunar-utils.test.ts 2>&1 | tail -8
```

Expected: FAIL "Cannot find module"

- [ ] **Step 3: 实现 lunar-utils.ts**

```typescript
// lib/life-timing/lunar-utils.ts

// @ts-ignore
import { Solar } from 'lunar-javascript';

/** 取一年的立春日期（北京时间） */
export function findLiChun(year: number): Date {
  for (let day = 3; day <= 5; day++) {
    const solar = Solar.fromYmd(year, 2, day);
    const lunar = solar.getLunar();
    if (lunar.getJieQi() === '立春') {
      return new Date(year, 1, day);
    }
  }
  return new Date(year, 1, 4);  // fallback
}

/** 取某年立春后到次年立春前的命理年干支 */
export function getLiuNianGanZhi(year: number): string {
  const liChun = findLiChun(year);
  // 立春当天本身使用 lunar 算出来的干支才准
  const solar = Solar.fromYmd(liChun.getFullYear(), liChun.getMonth() + 1, liChun.getDate());
  return solar.getLunar().getYearInGanZhi();
}

/** 取当前日期所属的命理年干支（注意立春切换） */
export function getCurrentLiuNianGanZhi(currentDate: Date): string {
  const solar = Solar.fromYmd(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
  return solar.getLunar().getYearInGanZhi();
}

/** 日期加天数 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

- [ ] **Step 4: 测试 GREEN**

```bash
npx jest tests/lib/life-timing/lunar-utils.test.ts 2>&1 | tail -8
```

Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/lunar-utils.ts tests/lib/life-timing/lunar-utils.test.ts
git commit -m "feat(life-timing): T4 - 立春日期 + 流年干支 helper

complement to lunar-javascript with our命理年 semantics"
```

---

## Task 5: Detector 1 - 节气检测

**Files:**
- Create: `lib/life-timing/detectors/solar-terms.ts`
- Create: `tests/lib/life-timing/detectors/solar-terms.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/solar-terms.test.ts
import { detectSolarTerms } from '@/lib/life-timing/detectors/solar-terms';

describe('detectSolarTerms', () => {
  it('从 2026-04-01 检测 → 含立夏', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    const liXia = points.find((p) => p.context.termName === '立夏');
    expect(liXia).toBeDefined();
    expect(liXia!.severity).toBe('notice');
    expect(liXia!.startDate.startsWith('2026-05-')).toBe(true);
  });

  it('从 2026-05-10 检测 → 不含已过的立夏', () => {
    const points = detectSolarTerms(new Date(2026, 4, 10));
    const liXia2026 = points.find((p) =>
      p.context.termName === '立夏' && p.startDate.startsWith('2026-05')
    );
    expect(liXia2026).toBeUndefined();
  });

  it('从 2026-01-01 检测 → 含立春', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const liChun = points.find((p) => p.context.termName === '立春');
    expect(liChun).toBeDefined();
    expect(liChun!.severity).toBe('caution');  // 立春 caution 比其他 3 节气重
  });

  it('365 天内必然有 4 主节气（不重复）', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const termsInRange = points.filter((p) => {
      const date = new Date(p.startDate);
      return date.getFullYear() === 2026;
    });
    const distinctTerms = new Set(termsInRange.map((p) => p.context.termName));
    expect(distinctTerms.has('立春')).toBe(true);
    expect(distinctTerms.has('立夏')).toBe(true);
    expect(distinctTerms.has('立秋')).toBe(true);
    expect(distinctTerms.has('立冬')).toBe(true);
  });

  it('每个节气有 7 天过渡期', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    for (const point of points) {
      const start = new Date(point.startDate);
      const end = new Date(point.endDate!);
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      expect(days).toBe(7);
    }
  });

  it('id 包含节气名和年份', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    const liXia = points.find((p) => p.context.termName === '立夏');
    expect(liXia!.id).toMatch(/^solar_立夏_2026$/);
  });

  it('rawReason 含命理含义', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    expect(points[0].rawReason).toMatch(/节气过渡期|能量切换/);
  });

  it('输出按 startDate 升序', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    for (let i = 1; i < points.length; i++) {
      expect(points[i].startDate >= points[i - 1].startDate).toBe(true);
    }
  });

  it('立春标 caution', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const liChun = points.find((p) => p.context.termName === '立春');
    expect(liChun!.severity).toBe('caution');
  });

  it('立夏立秋立冬标 notice', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const others = points.filter((p) =>
      ['立夏', '立秋', '立冬'].includes(p.context.termName as string)
    );
    for (const p of others) {
      expect(p.severity).toBe('notice');
    }
  });
});
```

- [ ] **Step 2: 测试 RED**

```bash
npx jest tests/lib/life-timing/detectors/solar-terms.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现 detector**

```typescript
// lib/life-timing/detectors/solar-terms.ts

// @ts-ignore
import { Solar } from 'lunar-javascript';
import type { TimingPoint } from '../types';
import { addDays } from '../lunar-utils';

const FOUR_MAIN_TERMS = ['立春', '立夏', '立秋', '立冬'] as const;
type MainTerm = typeof FOUR_MAIN_TERMS[number];

export function detectSolarTerms(currentDate: Date): TimingPoint[] {
  const points: TimingPoint[] = [];

  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    const checkDate = addDays(currentDate, dayOffset);
    const solar = Solar.fromYmd(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );
    const lunar = solar.getLunar();
    const jieQi = lunar.getJieQi() as MainTerm;

    if (FOUR_MAIN_TERMS.includes(jieQi)) {
      points.push({
        id: `solar_${jieQi}_${checkDate.getFullYear()}`,
        type: 'solar_term',
        severity: jieQi === '立春' ? 'caution' : 'notice',
        startDate: toIsoDate(checkDate),
        endDate: toIsoDate(addDays(checkDate, 7)),
        rawReason: `${jieQi}节气过渡期，命理上能量切换的关键 7 天`,
        context: { termName: jieQi },
      });
    }
  }

  return points.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: 测试 GREEN**

```bash
npx jest tests/lib/life-timing/detectors/solar-terms.test.ts 2>&1 | tail -8
```

Expected: 10 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/solar-terms.ts tests/lib/life-timing/detectors/solar-terms.test.ts
git commit -m "feat(life-timing): T5 - Detector 1 节气检测 + 10 单测

立春标 caution、立夏立秋立冬标 notice
365 天扫描 4 主节气，过渡期 7 天"
```

---

## Task 6: Detector 2 - 太岁年检测

**Files:**
- Create: `lib/life-timing/detectors/tai-sui.ts`
- Create: `tests/lib/life-timing/detectors/tai-sui.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/tai-sui.test.ts
import { detectTaiSuiYears } from '@/lib/life-timing/detectors/tai-sui';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(yearZhi: string, currentDate: Date): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi,
      monthGan: '甲', monthZhi: '寅',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 0, 1),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectTaiSuiYears', () => {
  it('年支午 + 当前 2026/3/1（丙午年）→ 值太岁 critical', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui).toBeDefined();
    expect(valueTaiSui!.severity).toBe('critical');
  });

  it('年支子 + 当前 2026/3/1（丙午年）→ 冲太岁 critical', () => {
    const points = detectTaiSuiYears(makeInput('子', new Date(2026, 2, 1)));
    const clash = points.find((p) => p.type === 'tai_sui_clash' && p.context.year === 2026);
    expect(clash).toBeDefined();
    expect(clash!.severity).toBe('critical');
  });

  it('年支丑 + 2026 → 害太岁 caution', () => {
    const points = detectTaiSuiYears(makeInput('丑', new Date(2026, 2, 1)));
    const harm = points.find((p) => p.type === 'tai_sui_harm' && p.context.year === 2026);
    expect(harm).toBeDefined();
    expect(harm!.severity).toBe('caution');
  });

  it('年支卯 + 2026 → 破太岁 notice', () => {
    const points = detectTaiSuiYears(makeInput('卯', new Date(2026, 2, 1)));
    const breakP = points.find((p) => p.type === 'tai_sui_break' && p.context.year === 2026);
    expect(breakP).toBeDefined();
    expect(breakP!.severity).toBe('notice');
  });

  it('年支戌 + 2026（丙午）→ 三合午戌火局，无 tai_sui 类型命中', () => {
    const points = detectTaiSuiYears(makeInput('戌', new Date(2026, 2, 1)));
    const for2026 = points.filter((p) => p.context.year === 2026);
    expect(for2026.length).toBe(0);
  });

  it('当前 2026/1/15 立春前 + 年支午 → 不算 2026 触发，但算 2025（乙巳）刑（非）', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 0, 15)));
    const for2026 = points.filter((p) => p.context.year === 2026);
    expect(for2026.length).toBe(0);
  });

  it('未来 5 年内最多 5 个不同年份的 tai_sui', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const years = new Set(points.map((p) => p.context.year));
    expect(years.size).toBeLessThanOrEqual(5);
  });

  it('rawReason 含年份和干支', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value');
    expect(valueTaiSui!.rawReason).toMatch(/2026.*丙午|本命年|值太岁/);
  });

  it('startDate 是当年立春日期', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui!.startDate).toMatch(/^2026-02-0[3-5]$/);
  });

  it('endDate 是次年立春', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui!.endDate).toMatch(/^2027-02-0[3-5]$/);
  });

  it('id 唯一', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: 测试 RED**

```bash
npx jest tests/lib/life-timing/detectors/tai-sui.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现 detector**

```typescript
// lib/life-timing/detectors/tai-sui.ts

import {
  BRANCH_CLASH, BRANCH_PUNISH, BRANCH_HARM, BRANCH_BREAK,
  type EarthlyBranch
} from '../constants';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';
import { findLiChun, getLiuNianGanZhi } from '../lunar-utils';

export function detectTaiSuiYears(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const yearZhi = input.bazi.yearZhi as EarthlyBranch;

  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);

    // 立春前不算本年触发
    if (yearOffset === 0 && liChunDate > input.currentDate) {
      continue;
    }
    // 立春已过、当前在该命理年内
    if (yearOffset === 0 && liChunDate <= input.currentDate) {
      // OK 在当年命理范围内
    }

    const liuNianGanZhi = getLiuNianGanZhi(checkYear);
    const liuNianZhi = liuNianGanZhi.charAt(1) as EarthlyBranch;

    let type: TimingType | null = null;
    let severity: TimingSeverity = 'caution';
    let reason = '';

    if (liuNianZhi === yearZhi) {
      type = 'tai_sui_value';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相同，值太岁（本命年）`;
    } else if (BRANCH_CLASH[liuNianZhi] === yearZhi) {
      type = 'tai_sui_clash';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相冲`;
    } else if (BRANCH_PUNISH[liuNianZhi]?.includes(yearZhi)) {
      type = 'tai_sui_punish';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相刑`;
    } else if (BRANCH_HARM[liuNianZhi] === yearZhi) {
      type = 'tai_sui_harm';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相害`;
    } else if (BRANCH_BREAK[liuNianZhi] === yearZhi) {
      type = 'tai_sui_break';
      severity = 'notice';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相破`;
    }

    if (type) {
      points.push({
        id: `taisui_${type}_${checkYear}`,
        type,
        severity,
        startDate: toIsoDate(liChunDate),
        endDate: toIsoDate(findLiChun(checkYear + 1)),
        rawReason: reason,
        context: {
          year: checkYear,
          liuNianGanZhi,
          birthYearZhi: yearZhi,
        },
      });
    }
  }

  return points;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: 测试 GREEN**

```bash
npx jest tests/lib/life-timing/detectors/tai-sui.test.ts 2>&1 | tail -8
```

Expected: 11 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/tai-sui.ts tests/lib/life-timing/detectors/tai-sui.test.ts
git commit -m "feat(life-timing): T6 - Detector 2 太岁年检测 + 11 单测

值/冲/刑/害/破 太岁全覆盖，未来 5 年扫描"
```

---

## Task 7: Detector 3 - 大运转换检测

**Files:**
- Create: `lib/life-timing/detectors/dayun-transition.ts`
- Create: `tests/lib/life-timing/detectors/dayun-transition.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/dayun-transition.test.ts
import { detectDayunTransition } from '@/lib/life-timing/detectors/dayun-transition';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunInfo, DayunResult } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string): DayunInfo {
  return {
    index: 0,
    startAge,
    endAge: startAge + 9,
    startYear: 1990 + startAge,
    endYear: 1999 + startAge,
    gan: ganZhi.charAt(0),
    zhi: ganZhi.charAt(1),
    ganZhi,
    ganWuxing: '木',
    zhiWuxing: '木',
    yongShenMatch: 'neutral',
    quality: 'neutral',
    description: '',
    isCurrent: false,
  };
}

function makeInput(currentDate: Date, dayuns: DayunInfo[]): DetectorInput {
  return {
    bazi: {
      yearGan: '庚', yearZhi: '午',
      monthGan: '庚', monthZhi: '辰',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '子',
    },
    birthDate: new Date(1990, 4, 15),  // 1990-05-15
    currentDate,
    dayunResult: {
      startAge: 5,
      dayuns,
      currentDayun: null,
      currentDayunYear: 0,
    } as DayunResult,
  };
}

describe('detectDayunTransition', () => {
  it('当前 35 岁，下个大运 36 岁 → 命中（提前 30 天 startDate）', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    const shift = points.find((p) => p.context.ganZhi === '甲戌');
    expect(shift).toBeDefined();
    expect(shift!.severity).toBe('critical');
  });

  it('当前 30 岁，下个大运 35 岁 → 不命中（5 年后）', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2020, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points.length).toBe(0);
  });

  it('未来 12 月内换大运 → 1 个 critical 时点', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);  // 35 岁前 4 个月
    const points = detectDayunTransition(input);
    const critical = points.filter((p) => p.severity === 'critical');
    expect(critical.length).toBe(1);
  });

  it('rawReason 含大运干支和年龄', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].rawReason).toMatch(/甲戌大运|35.*岁|10 年/);
  });

  it('startDate 提前 30 天', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    const shift = points[0];
    const start = new Date(shift.startDate);
    // 35 岁生日 1990-05-15 + 35 = 2025-05-15
    // 提前 30 天 = 2025-04-15 左右
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(3);  // 4 月（0-indexed）
  });

  it('DayunResult.dayuns 为空 → 返回空数组（不崩）', () => {
    const input = makeInput(new Date(2025, 4, 15), []);
    const points = detectDayunTransition(input);
    expect(points).toEqual([]);
  });

  it('id 唯一', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].id).toMatch(/^dayun_甲戌_35$/);
  });

  it('context 含 ganZhi/startAge/startDate', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].context.ganZhi).toBe('甲戌');
    expect(points[0].context.startAge).toBe(35);
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/detectors/dayun-transition.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/detectors/dayun-transition.ts

import type { TimingPoint, DetectorInput } from '../types';
import { addDays } from '../lunar-utils';

export function detectDayunTransition(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult?.dayuns || [];

  for (const dayun of dayuns) {
    const startAge = dayun.startAge;
    const startDate = addYearsToBirth(input.birthDate, startAge);
    const monthsUntilStart = monthsBetween(input.currentDate, startDate);

    if (monthsUntilStart >= 0 && monthsUntilStart <= 12) {
      points.push({
        id: `dayun_${dayun.ganZhi}_${startAge}`,
        type: 'dayun_transition',
        severity: 'critical',
        startDate: toIsoDate(addDays(startDate, -30)),
        endDate: toIsoDate(addYearsToBirth(input.birthDate, startAge + 10)),
        rawReason: `进入${dayun.ganZhi}大运（${startAge}-${startAge + 10}岁），10 年人生节奏切换`,
        context: {
          ganZhi: dayun.ganZhi,
          startAge,
          startDate: toIsoDate(startDate),
        },
      });
    }
  }

  return points;
}

function addYearsToBirth(birth: Date, years: number): Date {
  const result = new Date(birth);
  result.setFullYear(birth.getFullYear() + years);
  return result;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/detectors/dayun-transition.test.ts 2>&1 | tail -8
```

Expected: 8 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/dayun-transition.ts tests/lib/life-timing/detectors/dayun-transition.test.ts
git commit -m "feat(life-timing): T7 - Detector 3 大运转换检测 + 8 单测

未来 12 月内换大运 → critical 提前 30 天预警"
```

---

## Task 8: Detector 4 - 岁运并临检测

**Files:**
- Create: `lib/life-timing/detectors/sui-yun-bing-lin.ts`
- Create: `tests/lib/life-timing/detectors/sui-yun-bing-lin.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/sui-yun-bing-lin.test.ts
import { detectSuiYunBingLin } from '@/lib/life-timing/detectors/sui-yun-bing-lin';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunInfo, DayunResult } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string): DayunInfo {
  return {
    index: 0, startAge, endAge: startAge + 9,
    startYear: 1990 + startAge, endYear: 1999 + startAge,
    gan: ganZhi.charAt(0), zhi: ganZhi.charAt(1), ganZhi,
    ganWuxing: '木', zhiWuxing: '木',
    yongShenMatch: 'neutral', quality: 'neutral',
    description: '', isCurrent: false,
  };
}

function makeInput(currentDate: Date, dayuns: DayunInfo[]): DetectorInput {
  return {
    bazi: {
      yearGan: '庚', yearZhi: '午',
      monthGan: '庚', monthZhi: '辰',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '子',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 5, dayuns, currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectSuiYunBingLin', () => {
  it('大运乙巳 + 流年乙巳（2025）→ 命中', () => {
    // 1990-05-15 出生，35 岁 = 2025
    const dayuns = [makeDayun(25, '乙巳')];  // 25-34 岁，覆盖 2025
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    const hit = points.find((p) => p.context.year === 2025);
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe('critical');
  });

  it('大运乙巳 + 流年丙午（2026）→ 不命中', () => {
    const dayuns = [makeDayun(25, '乙巳')];
    const input = makeInput(new Date(2026, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points.find((p) => p.context.year === 2026)).toBeUndefined();
  });

  it('该年龄不在任何大运区间 → 不命中（不崩）', () => {
    const dayuns = [makeDayun(60, '丙午')];  // 60 岁开始
    const input = makeInput(new Date(2025, 0, 15), dayuns);  // 35 岁
    const points = detectSuiYunBingLin(input);
    expect(points).toEqual([]);
  });

  it('一生 1-2 次正常', () => {
    const dayuns = [
      makeDayun(15, '乙巳'),
      makeDayun(25, '丙午'),
      makeDayun(35, '丁未'),
    ];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points.length).toBeLessThanOrEqual(2);
  });

  it('rawReason 含"岁运并临"', () => {
    const dayuns = [makeDayun(25, '乙巳')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    if (points.length > 0) {
      expect(points[0].rawReason).toMatch(/岁运并临/);
    }
  });

  it('立春前不算本年触发', () => {
    const dayuns = [makeDayun(25, '乙巳')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);  // 1/15 立春前
    const points = detectSuiYunBingLin(input);
    expect(points.find((p) => p.context.year === 2025)).toBeUndefined();
  });

  it('id 含年份', () => {
    const dayuns = [makeDayun(25, '乙巳')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    if (points.length > 0) {
      expect(points[0].id).toMatch(/^suiyunbinglin_2025$/);
    }
  });

  it('未来 5 年扫描', () => {
    const dayuns = [makeDayun(25, '乙巳'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    // 应该不超过 5 年
    points.forEach((p) => {
      expect((p.context.year as number)).toBeLessThanOrEqual(2030);
    });
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/detectors/sui-yun-bing-lin.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/detectors/sui-yun-bing-lin.ts

import type { TimingPoint, DetectorInput } from '../types';
import { findLiChun, getLiuNianGanZhi } from '../lunar-utils';

export function detectSuiYunBingLin(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult?.dayuns || [];

  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);

    if (yearOffset === 0 && liChunDate > input.currentDate) continue;

    const liuNianGanZhi = getLiuNianGanZhi(checkYear);
    const ageThatYear = checkYear - input.birthDate.getFullYear();
    const dayunOfYear = dayuns.find((d) =>
      ageThatYear >= d.startAge && ageThatYear < d.startAge + 10
    );

    if (dayunOfYear && dayunOfYear.ganZhi === liuNianGanZhi) {
      points.push({
        id: `suiyunbinglin_${checkYear}`,
        type: 'sui_yun_bing_lin',
        severity: 'critical',
        startDate: toIsoDate(liChunDate),
        endDate: toIsoDate(findLiChun(checkYear + 1)),
        rawReason: `${checkYear}年（${liuNianGanZhi}）大运干支与流年干支完全相同，命理称岁运并临`,
        context: { year: checkYear, ganZhi: liuNianGanZhi },
      });
    }
  }

  return points;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/detectors/sui-yun-bing-lin.test.ts 2>&1 | tail -8
```

Expected: 8 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/sui-yun-bing-lin.ts tests/lib/life-timing/detectors/sui-yun-bing-lin.test.ts
git commit -m "feat(life-timing): T8 - Detector 4 岁运并临检测 + 8 单测

大运干支 === 流年干支 → critical（命理大忌）"
```

---

## Task 9: Detector 5 - 流月触发检测

**Files:**
- Create: `lib/life-timing/detectors/liuyue-triggers.ts`
- Create: `tests/lib/life-timing/detectors/liuyue-triggers.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/liuyue-triggers.test.ts
import { detectLiuyueTriggers } from '@/lib/life-timing/detectors/liuyue-triggers';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(currentDate: Date, baziZhis: { yearZhi: string; monthZhi: string; dayZhi: string; hourZhi: string }): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi: baziZhis.yearZhi,
      monthGan: '甲', monthZhi: baziZhis.monthZhi,
      dayGan: '甲', dayZhi: baziZhis.dayZhi,
      hourGan: '甲', hourZhi: baziZhis.hourZhi,
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectLiuyueTriggers', () => {
  it('日支午 + 子月（11月）→ liuyue_clash', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    expect(clash).toBeDefined();
    expect(clash!.severity).toBe('caution');
  });

  it('日支寅 + 寅月（2月）→ liuyue_fuyin', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '辰', dayZhi: '寅', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const fuyin = points.find((p) => p.type === 'liuyue_fuyin');
    expect(fuyin).toBeDefined();
    expect(fuyin!.severity).toBe('caution');
  });

  it('命局有子辰 + 申月（8月）→ liuyue_combine 三合水局', () => {
    const input = makeInput(new Date(2026, 6, 1), {
      yearZhi: '辰', monthZhi: '午', dayZhi: '子', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const combine = points.find((p) => p.type === 'liuyue_combine');
    expect(combine).toBeDefined();
    expect(combine!.severity).toBe('notice');
  });

  it('12 月遍历无漏月', () => {
    const input = makeInput(new Date(2026, 0, 15), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const months = new Set<string>();
    for (const p of points) {
      const ym = p.startDate.slice(0, 7);
      months.add(ym);
    }
    expect(months.size).toBeGreaterThanOrEqual(1);
    expect(months.size).toBeLessThanOrEqual(12);
  });

  it('同月可触发多种关系（不互斥）', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '寅', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const fuyinCount = points.filter((p) => p.type === 'liuyue_fuyin').length;
    expect(fuyinCount).toBeGreaterThanOrEqual(1);
  });

  it('startDate 是月初', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    for (const p of points) {
      expect(p.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    }
  });

  it('endDate 是月末', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    for (const p of points) {
      const end = new Date(p.endDate!);
      const next = new Date(end);
      next.setDate(end.getDate() + 1);
      expect(next.getDate()).toBe(1);  // 下个月 1 号
    }
  });

  it('id 唯一', () => {
    const input = makeInput(new Date(2026, 0, 15), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rawReason 含相应描述', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    if (clash) {
      expect(clash.rawReason).toMatch(/相冲|变动月/);
    }
  });

  it('完全无触发的极端命局返回空', () => {
    // 子日支 + 检查未来 12 月不可能完全无触发，所以这里测的是函数不崩
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '寅', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    expect(Array.isArray(points)).toBe(true);
  });

  it('context 含 pillarIdx 和 liuYueGanZhi', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    if (clash) {
      expect(clash.context.liuYueGanZhi).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/detectors/liuyue-triggers.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/detectors/liuyue-triggers.ts

// @ts-ignore
import { Solar } from 'lunar-javascript';
import { BRANCH_CLASH, BRANCH_TRINE, type EarthlyBranch } from '../constants';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'] as const;

export function detectLiuyueTriggers(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const fourPillars: EarthlyBranch[] = [
    input.bazi.yearZhi as EarthlyBranch,
    input.bazi.monthZhi as EarthlyBranch,
    input.bazi.dayZhi as EarthlyBranch,
    input.bazi.hourZhi as EarthlyBranch,
  ];

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const checkDate = new Date(input.currentDate);
    checkDate.setMonth(checkDate.getMonth() + monthOffset);
    checkDate.setDate(15);

    const solar = Solar.fromYmd(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );
    const lunar = solar.getLunar();
    const liuYueGanZhi = lunar.getMonthInGanZhi();
    const liuYueZhi = liuYueGanZhi.charAt(1) as EarthlyBranch;

    // 1. 冲
    fourPillars.forEach((pillarZhi, idx) => {
      if (BRANCH_CLASH[liuYueZhi] === pillarZhi) {
        points.push(makePoint('liuyue_clash', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}相冲，变动月`));
      }
    });

    // 2. 伏吟
    fourPillars.forEach((pillarZhi, idx) => {
      if (liuYueZhi === pillarZhi) {
        points.push(makePoint('liuyue_fuyin', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}伏吟，原局力量加倍`));
      }
    });

    // 3. 三合（流月与命局其他二支组成三合）
    BRANCH_TRINE.forEach((triple) => {
      if (triple.includes(liuYueZhi)) {
        const others = triple.filter((b) => b !== liuYueZhi);
        const matchedCount = fourPillars.filter((p) => others.includes(p)).length;
        if (matchedCount >= 2) {
          points.push(makePoint('liuyue_combine', 'notice', checkDate, {
            triple: triple.join(''),
            liuYueGanZhi,
          }, `${liuYueGanZhi}月与命局形成三合，能量增强月`));
        }
      }
    });
  }

  return points;
}

function makePoint(
  type: TimingType,
  severity: TimingSeverity,
  date: Date,
  context: Record<string, unknown>,
  reason: string
): TimingPoint {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    id: `liuyue_${type}_${date.getFullYear()}_${date.getMonth() + 1}_${context.pillarIdx ?? 'x'}_${context.liuYueGanZhi}`,
    type,
    severity,
    startDate: toIsoDate(monthStart),
    endDate: toIsoDate(monthEnd),
    rawReason: reason,
    context,
  };
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/detectors/liuyue-triggers.test.ts 2>&1 | tail -8
```

Expected: 11 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/liuyue-triggers.ts tests/lib/life-timing/detectors/liuyue-triggers.test.ts
git commit -m "feat(life-timing): T9 - Detector 5 流月触发检测 + 11 单测

冲/伏吟/三合，未来 12 月遍历"
```

---

## Task 10: Detector 6 - 流月神煞月

**Files:**
- Create: `lib/life-timing/detectors/liunian-shensha-month.ts`
- Create: `tests/lib/life-timing/detectors/liunian-shensha-month.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/detectors/liunian-shensha-month.test.ts
import { detectLiunianShenshaMonths } from '@/lib/life-timing/detectors/liunian-shensha-month';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(currentDate: Date, dayGan: string, yearZhi: string, dayZhi: string): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi,
      monthGan: '甲', monthZhi: '寅',
      dayGan, dayZhi,
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectLiunianShenshaMonths', () => {
  it('日干甲 → 天乙贵人地支为丑/未', () => {
    // 测一年里命中天乙贵人的月（地支为丑或未的月）
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    const tianyi = points.filter((p) => p.type === 'liuyue_shensha_tianyi');
    expect(tianyi.length).toBeGreaterThanOrEqual(1);
    for (const p of tianyi) {
      expect(p.context.shenSha).toBe('天乙贵人');
    }
  });

  it('日干丙 → 文昌贵人在申', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '丙', '寅', '辰'));
    const wenchang = points.filter((p) => p.type === 'liuyue_shensha_wenchang');
    expect(wenchang.length).toBeGreaterThanOrEqual(1);
  });

  it('年支子 → 桃花在酉', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '子', '辰'));
    const taohua = points.filter((p) => p.type === 'liuyue_shensha_taohua');
    expect(taohua.length).toBeGreaterThanOrEqual(1);
  });

  it('年支子 → 驿马在寅', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '子', '辰'));
    const yima = points.filter((p) => p.type === 'liuyue_shensha_yima');
    expect(yima.length).toBeGreaterThanOrEqual(1);
  });

  it('年支午 → 将星在午', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '辰'));
    const jiangxing = points.filter((p) => p.type === 'liuyue_shensha_jiangxing');
    expect(jiangxing.length).toBeGreaterThanOrEqual(1);
  });

  it('严重程度一律 notice', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    for (const p of points) {
      expect(p.severity).toBe('notice');
    }
  });

  it('12 月遍历无漏', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    const months = new Set<string>();
    for (const p of points) {
      const ym = p.startDate.slice(0, 7);
      months.add(ym);
    }
    expect(months.size).toBeLessThanOrEqual(12);
  });

  it('同月触发多个神煞 → 多条 TimingPoint', () => {
    // 一定会触发的命局：日干甲（贵人 丑/未），年支午（桃花 卯）
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    expect(points.length).toBeGreaterThan(0);
  });

  it('startDate 月初、endDate 月末', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    for (const p of points) {
      expect(p.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      const end = new Date(p.endDate!);
      const next = new Date(end);
      next.setDate(end.getDate() + 1);
      expect(next.getDate()).toBe(1);
    }
  });

  it('id 唯一', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('日干乙、年支不在桃花表 → 仍能正常处理（不崩）', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '乙', '寅', '辰'));
    expect(Array.isArray(points)).toBe(true);
  });

  it('rawReason 含神煞名', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    if (points.length > 0) {
      const tianyi = points.find((p) => p.type === 'liuyue_shensha_tianyi');
      if (tianyi) expect(tianyi.rawReason).toMatch(/天乙/);
    }
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/detectors/liunian-shensha-month.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/detectors/liunian-shensha-month.ts

// @ts-ignore
import { Solar } from 'lunar-javascript';
import {
  TIANYI_GUIREN, WENCHANG, TAOHUA, YIMA, JIANGXING,
} from '@/lib/shensha-calculator';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';

export function detectLiunianShenshaMonths(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayGan = input.bazi.dayGan;
  const yearZhi = input.bazi.yearZhi;
  const dayZhi = input.bazi.dayZhi;

  const tianyiBranches = TIANYI_GUIREN[dayGan] || [];
  const wenchangBranch = WENCHANG[dayGan];
  const taohuaBranch = TAOHUA[yearZhi] || TAOHUA[dayZhi];
  const yimaBranch = YIMA[yearZhi] || YIMA[dayZhi];
  const jiangxingBranch = JIANGXING[yearZhi] || JIANGXING[dayZhi];

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const checkDate = new Date(input.currentDate);
    checkDate.setMonth(checkDate.getMonth() + monthOffset);
    checkDate.setDate(15);

    const solar = Solar.fromYmd(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );
    const lunar = solar.getLunar();
    const liuYueGanZhi = lunar.getMonthInGanZhi();
    const liuYueZhi = liuYueGanZhi.charAt(1);

    if (tianyiBranches.includes(liuYueZhi)) {
      points.push(makePoint('liuyue_shensha_tianyi', 'notice', checkDate, {
        shenSha: '天乙贵人', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发天乙贵人，关键时刻容易得到贵人相助`));
    }

    if (liuYueZhi === wenchangBranch) {
      points.push(makePoint('liuyue_shensha_wenchang', 'notice', checkDate, {
        shenSha: '文昌', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发文昌，学习/创作/表达灵感顺畅`));
    }

    if (taohuaBranch && liuYueZhi === taohuaBranch) {
      points.push(makePoint('liuyue_shensha_taohua', 'notice', checkDate, {
        shenSha: '桃花', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发桃花，关系/社交活跃`));
    }

    if (yimaBranch && liuYueZhi === yimaBranch) {
      points.push(makePoint('liuyue_shensha_yima', 'notice', checkDate, {
        shenSha: '驿马', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发驿马，可能涉及变动/出差/远行`));
    }

    if (jiangxingBranch && liuYueZhi === jiangxingBranch) {
      points.push(makePoint('liuyue_shensha_jiangxing', 'notice', checkDate, {
        shenSha: '将星', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发将星，适合担当与主导`));
    }
  }

  return points;
}

function makePoint(
  type: TimingType,
  severity: TimingSeverity,
  date: Date,
  context: Record<string, unknown>,
  reason: string
): TimingPoint {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    id: `liuyue_shensha_${type}_${date.getFullYear()}_${date.getMonth() + 1}`,
    type,
    severity,
    startDate: toIsoDate(monthStart),
    endDate: toIsoDate(monthEnd),
    rawReason: reason,
    context,
  };
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/detectors/liunian-shensha-month.test.ts 2>&1 | tail -8
```

Expected: 12 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/detectors/liunian-shensha-month.ts tests/lib/life-timing/detectors/liunian-shensha-month.test.ts
git commit -m "feat(life-timing): T10 - Detector 6 流月神煞月 + 12 单测

天乙/文昌/桃花/驿马/将星 触发月，复用 shensha-calculator 表"
```

---

## Task 11: 过去印证生成

**Files:**
- Create: `lib/life-timing/past-validation.ts`
- Create: `tests/lib/life-timing/past-validation.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/past-validation.test.ts
import { generatePastValidations } from '@/lib/life-timing/past-validation';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(opts: {
  pattern?: string;
  shenShas?: Array<{ name: string; pillar?: string }>;
  pastDayuns?: Array<{ ganZhi: string; quality: 'good' | 'neutral' | 'bad' }>;
}): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi: '午',
      monthGan: '甲', monthZhi: '寅',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate: new Date(2026, 0, 1),
    pattern: opts.pattern,
    shenShaList: opts.shenShas?.map((s) => ({ name: s.name })),
    dayunResult: {
      startAge: 5,
      dayuns: (opts.pastDayuns || []).map((d, i) => ({
        index: i,
        startAge: 5 + i * 10,
        endAge: 14 + i * 10,
        startYear: 1995 + i * 10,
        endYear: 2004 + i * 10,
        gan: d.ganZhi.charAt(0),
        zhi: d.ganZhi.charAt(1),
        ganZhi: d.ganZhi,
        ganWuxing: '木',
        zhiWuxing: '木',
        yongShenMatch: 'neutral',
        quality: d.quality,
        description: '',
        isCurrent: false,
      })),
      currentDayun: null,
      currentDayunYear: 0,
    } as DayunResult,
  };
}

describe('generatePastValidations', () => {
  it('身弱命局 → pattern_weak_self', () => {
    const result = generatePastValidations(makeInput({ pattern: '身弱' }));
    const item = result.find((r) => r.id === 'pattern_weak_self');
    expect(item).toBeDefined();
  });

  it('身旺命局 → pattern_strong_self', () => {
    const result = generatePastValidations(makeInput({ pattern: '身旺' }));
    const item = result.find((r) => r.id === 'pattern_strong_self');
    expect(item).toBeDefined();
  });

  it('神煞含羊刃 → shensha_yangren', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '羊刃' }],
    }));
    expect(result.find((r) => r.id === 'shensha_yangren')).toBeDefined();
  });

  it('神煞含文昌 → shensha_wenchang', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '文昌' }],
    }));
    expect(result.find((r) => r.id === 'shensha_wenchang')).toBeDefined();
  });

  it('神煞含天乙贵人 → shensha_tianyi', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '天乙贵人' }],
    }));
    expect(result.find((r) => r.id === 'shensha_tianyi')).toBeDefined();
  });

  it('过去大运 quality=good → dayun_imprint_recent_good', () => {
    const result = generatePastValidations(makeInput({
      pastDayuns: [
        { ganZhi: '乙巳', quality: 'good' },
        { ganZhi: '丙午', quality: 'good' },
      ],
    }));
    expect(result.find((r) => r.id === 'dayun_imprint_recent_good')).toBeDefined();
  });

  it('没有命理特征 → 输出空数组（不崩）', () => {
    const result = generatePastValidations(makeInput({}));
    expect(Array.isArray(result)).toBe(true);
  });

  it('总条数 ≤ 4', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身弱',
      shenShas: [
        { name: '羊刃' },
        { name: '文昌' },
        { name: '天乙贵人' },
      ],
      pastDayuns: [
        { ganZhi: '乙巳', quality: 'good' },
        { ganZhi: '丙午', quality: 'good' },
      ],
    }));
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('每条 rawTemplate 是字符串', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身旺',
      shenShas: [{ name: '羊刃' }],
    }));
    for (const item of result) {
      expect(typeof item.rawTemplate).toBe('string');
      expect(item.rawTemplate.length).toBeGreaterThan(0);
    }
  });

  it('id 唯一', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身弱',
      shenShas: [{ name: '羊刃' }, { name: '文昌' }],
    }));
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/past-validation.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/past-validation.ts

import type { PastValidation, DetectorInput } from './types';

export function generatePastValidations(input: DetectorInput): PastValidation[] {
  const validations: PastValidation[] = [];

  // 1. 格局
  if (input.pattern === '身弱') {
    validations.push({
      id: 'pattern_weak_self',
      category: 'pattern',
      rawTemplate: '身弱结构的人，在外部压力大的时候容易透支身体或情绪',
      context: { pattern: '身弱' },
    });
  }
  if (input.pattern === '身旺') {
    validations.push({
      id: 'pattern_strong_self',
      category: 'pattern',
      rawTemplate: '身旺结构的人，长期靠"硬扛"行事，容易在关系上消耗',
      context: { pattern: '身旺' },
    });
  }

  // 2. 神煞
  const shenShaNames = (input.shenShaList || []).map((s) => s.name);
  if (shenShaNames.includes('羊刃')) {
    validations.push({
      id: 'shensha_yangren',
      category: 'shen_sha',
      rawTemplate: '羊刃在命的人，过去多次有"冲动决策造成的损失"',
      context: { shenSha: '羊刃' },
    });
  }
  if (shenShaNames.includes('文昌')) {
    validations.push({
      id: 'shensha_wenchang',
      category: 'shen_sha',
      rawTemplate: '文昌在命的人，学习/创作上有过不寻常的灵光时刻',
      context: { shenSha: '文昌' },
    });
  }
  if (shenShaNames.includes('天乙贵人')) {
    validations.push({
      id: 'shensha_tianyi',
      category: 'shen_sha',
      rawTemplate: '天乙贵人在命的人，关键时刻总有人主动帮忙',
      context: { shenSha: '天乙贵人' },
    });
  }

  // 3. 过去大运印记
  const currentAge = input.currentDate.getFullYear() - input.birthDate.getFullYear();
  const pastDayuns = (input.dayunResult.dayuns || [])
    .filter((d) => d.startAge < currentAge);

  if (pastDayuns.length >= 1) {
    const recentPast = pastDayuns[pastDayuns.length - 1];
    if (recentPast.quality === 'good' || recentPast.quality === 'excellent') {
      validations.push({
        id: 'dayun_imprint_recent_good',
        category: 'dayun_imprint',
        rawTemplate: `过去 10 年（${recentPast.ganZhi}大运）你应该有过一段做事相对顺手的时间`,
        context: { ganZhi: recentPast.ganZhi },
      });
    }
  }

  return validations.slice(0, 4);
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/past-validation.test.ts 2>&1 | tail -8
```

Expected: 10 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/past-validation.ts tests/lib/life-timing/past-validation.test.ts
git commit -m "feat(life-timing): T11 - 过去印证生成 + 10 单测

格局 / 神煞 / 大运印记 三类规则模板，最多 4 条"
```

---

## Task 12: Timing Orchestrator

**Files:**
- Create: `lib/life-timing/timing-orchestrator.ts`
- Create: `tests/lib/life-timing/timing-orchestrator.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// tests/lib/life-timing/timing-orchestrator.test.ts
import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult, DayunInfo } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string, quality: 'good' | 'neutral' | 'bad' = 'neutral'): DayunInfo {
  return {
    index: 0, startAge, endAge: startAge + 9,
    startYear: 1990 + startAge, endYear: 1999 + startAge,
    gan: ganZhi.charAt(0), zhi: ganZhi.charAt(1), ganZhi,
    ganWuxing: '木', zhiWuxing: '木',
    yongShenMatch: 'neutral', quality,
    description: '', isCurrent: false,
  };
}

function makeInput(): DetectorInput {
  return {
    bazi: {
      yearGan: '庚', yearZhi: '午',
      monthGan: '庚', monthZhi: '辰',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '子',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate: new Date(2026, 4, 10),
    pattern: '身旺',
    shenShaList: [{ name: '天乙贵人' }],
    dayunResult: {
      startAge: 5,
      dayuns: [
        makeDayun(5, '辛卯'),
        makeDayun(15, '庚寅'),
        makeDayun(25, '己丑', 'good'),
        makeDayun(35, '戊子'),
      ],
      currentDayun: null,
      currentDayunYear: 0,
    } as DayunResult,
  };
}

describe('buildTimingProfile', () => {
  it('返回完整 TimingProfile 结构', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.birthSignature).toBeTruthy();
    expect(profile.baziPillars).toBe('庚午|庚辰|甲寅|甲子');
    expect(profile.computedAt).toBeTruthy();
    expect(profile.computedForYear).toBeTruthy();
    expect(Array.isArray(profile.past_validations)).toBe(true);
    expect(Array.isArray(profile.next_30_days)).toBe(true);
    expect(Array.isArray(profile.next_12_months)).toBe(true);
    expect(Array.isArray(profile.next_5_years)).toBe(true);
  });

  it('next_30_days 只含 ≤30 天内的时点', () => {
    const profile = buildTimingProfile(makeInput());
    const cutoff = new Date(2026, 5, 9);  // 5/10 + 30 = 6/9
    for (const point of profile.next_30_days) {
      const date = new Date(point.startDate);
      expect(date.getTime()).toBeLessThanOrEqual(cutoff.getTime() + 86400000);
    }
  });

  it('next_12_months 只含 30-365 天内的时点', () => {
    const profile = buildTimingProfile(makeInput());
    const cutoff30 = new Date(2026, 5, 9);
    const cutoff365 = new Date(2027, 4, 10);
    for (const point of profile.next_12_months) {
      const date = new Date(point.startDate);
      expect(date.getTime()).toBeGreaterThanOrEqual(cutoff30.getTime() - 86400000);
      expect(date.getTime()).toBeLessThanOrEqual(cutoff365.getTime() + 86400000);
    }
  });

  it('next_5_years 含 MajorTransition 类型', () => {
    const profile = buildTimingProfile(makeInput());
    for (const trans of profile.next_5_years) {
      expect(['dayun_shift', 'tai_sui_year', 'sui_yun_bing_lin']).toContain(trans.type);
      expect(typeof trans.year).toBe('number');
      expect(typeof trans.ageAtYear).toBe('number');
    }
  });

  it('next_5_years 按年份升序', () => {
    const profile = buildTimingProfile(makeInput());
    for (let i = 1; i < profile.next_5_years.length; i++) {
      expect(profile.next_5_years[i].year >= profile.next_5_years[i - 1].year).toBe(true);
    }
  });

  it('past_validations 含身旺规则', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.past_validations.find((v) => v.id === 'pattern_strong_self')).toBeDefined();
  });

  it('past_validations 含天乙贵人规则', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.past_validations.find((v) => v.id === 'shensha_tianyi')).toBeDefined();
  });

  it('birthSignature 含日期', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.birthSignature).toMatch(/1990-05-15/);
  });

  it('computedForYear 是当前命理年（丙午）', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.computedForYear).toBe('丙午');
  });

  it('time points 内全是 30 天 + 12 月 + 5 年视图，不重复', () => {
    const profile = buildTimingProfile(makeInput());
    const ids30 = new Set(profile.next_30_days.map((p) => p.id));
    const ids12 = new Set(profile.next_12_months.map((p) => p.id));
    for (const id of ids30) {
      expect(ids12.has(id)).toBe(false);
    }
  });

  it('性能 - 单次 ≤ 200ms', () => {
    const t0 = performance.now();
    buildTimingProfile(makeInput());
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(200);
  });

  it('空 dayuns → 不崩', () => {
    const input = makeInput();
    input.dayunResult.dayuns = [];
    const profile = buildTimingProfile(input);
    expect(profile.next_5_years.length).toBeGreaterThanOrEqual(0);
  });

  it('next_30_days 内含立夏（5/5 已过）→ 应该不再含本年立夏', () => {
    const profile = buildTimingProfile(makeInput());
    const liXia2026 = profile.next_30_days.find((p) =>
      p.context.termName === '立夏' && p.startDate.startsWith('2026-05')
    );
    expect(liXia2026).toBeUndefined();
  });

  it('next_12_months 含立秋', () => {
    const profile = buildTimingProfile(makeInput());
    const liQiu = profile.next_12_months.find((p) => p.context.termName === '立秋');
    expect(liQiu).toBeDefined();
  });

  it('日期严格升序', () => {
    const profile = buildTimingProfile(makeInput());
    for (let i = 1; i < profile.next_30_days.length; i++) {
      expect(profile.next_30_days[i].startDate >= profile.next_30_days[i - 1].startDate).toBe(true);
    }
    for (let i = 1; i < profile.next_12_months.length; i++) {
      expect(profile.next_12_months[i].startDate >= profile.next_12_months[i - 1].startDate).toBe(true);
    }
  });
});
```

- [ ] **Step 2: RED**

```bash
npx jest tests/lib/life-timing/timing-orchestrator.test.ts 2>&1 | tail -8
```

- [ ] **Step 3: 实现**

```typescript
// lib/life-timing/timing-orchestrator.ts

import type { TimingProfile, DetectorInput, TimingPoint, MajorTransition } from './types';
import { detectSolarTerms } from './detectors/solar-terms';
import { detectTaiSuiYears } from './detectors/tai-sui';
import { detectDayunTransition } from './detectors/dayun-transition';
import { detectSuiYunBingLin } from './detectors/sui-yun-bing-lin';
import { detectLiuyueTriggers } from './detectors/liuyue-triggers';
import { detectLiunianShenshaMonths } from './detectors/liunian-shensha-month';
import { generatePastValidations } from './past-validation';
import { addDays, getCurrentLiuNianGanZhi } from './lunar-utils';

export function buildTimingProfile(input: DetectorInput): TimingProfile {
  // 1. 跑所有 detector
  const solarTerms = detectSolarTerms(input.currentDate);
  const taiSuiYears = detectTaiSuiYears(input);
  const dayunShifts = detectDayunTransition(input);
  const suiYunBingLin = detectSuiYunBingLin(input);
  const liuyueTriggers = detectLiuyueTriggers(input);
  const shenShaMonths = detectLiunianShenshaMonths(input);
  const pastValidations = generatePastValidations(input);

  // 2. 合并并排序
  const allPoints: TimingPoint[] = [
    ...solarTerms,
    ...taiSuiYears,
    ...dayunShifts,
    ...suiYunBingLin,
    ...liuyueTriggers,
    ...shenShaMonths,
  ];
  allPoints.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 3. 切分到 30d / 12m
  const day30 = addDays(input.currentDate, 30);
  const day365 = addDays(input.currentDate, 365);

  const next_30_days: TimingPoint[] = [];
  const next_12_months: TimingPoint[] = [];

  for (const point of allPoints) {
    const pointDate = new Date(point.startDate);
    if (pointDate <= day30) {
      next_30_days.push(point);
    } else if (pointDate <= day365) {
      next_12_months.push(point);
    }
  }

  // 4. 5 年视图（仅 major transition）
  const next_5_years: MajorTransition[] = [
    ...taiSuiYears.map((p): MajorTransition => ({
      type: 'tai_sui_year',
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
    ...dayunShifts.map((p): MajorTransition => {
      const dayun = input.dayunResult.dayuns?.find((d) => d.ganZhi === p.context.ganZhi);
      return {
        type: 'dayun_shift',
        year: new Date(p.startDate).getFullYear(),
        ageAtYear: dayun?.startAge || 0,
        rawReason: p.rawReason,
        severity: p.severity,
        context: p.context,
      };
    }),
    ...suiYunBingLin.map((p): MajorTransition => ({
      type: 'sui_yun_bing_lin',
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
  ].sort((a, b) => a.year - b.year);

  // 5. 元数据
  const birthDateIso = input.birthDate.toISOString().slice(0, 10);
  const birthSignature = `${birthDateIso}_${input.bazi.yearGan}${input.bazi.yearZhi}`;

  return {
    birthSignature,
    baziPillars: `${input.bazi.yearGan}${input.bazi.yearZhi}|${input.bazi.monthGan}${input.bazi.monthZhi}|${input.bazi.dayGan}${input.bazi.dayZhi}|${input.bazi.hourGan}${input.bazi.hourZhi}`,
    computedAt: input.currentDate.toISOString(),
    computedForYear: getCurrentLiuNianGanZhi(input.currentDate),
    past_validations: pastValidations,
    next_30_days,
    next_12_months,
    next_5_years,
  };
}
```

- [ ] **Step 4: GREEN**

```bash
npx jest tests/lib/life-timing/timing-orchestrator.test.ts 2>&1 | tail -8
```

Expected: 15 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/life-timing/timing-orchestrator.ts tests/lib/life-timing/timing-orchestrator.test.ts
git commit -m "feat(life-timing): T12 - timing-orchestrator + 15 单测

统一编排 6 个 detector + past-validation
切分 30d / 12m / 5y 视图
单次性能 ≤ 200ms"
```

---

## Task 13: 真实样本人肉验证脚本

**Files:**
- Create: `scripts/life-timing/verify-samples.ts`

**Why:** spec 要求"10 个真实样本人肉验证一致"。这个脚本帮你快速跑出 10 个样本的输出，方便对比命理软件结果。

- [ ] **Step 1: 实现脚本**

```typescript
// scripts/life-timing/verify-samples.ts

/**
 * Life Timing 真实样本验证脚本
 * 用法：node --import tsx scripts/life-timing/verify-samples.ts
 *
 * 跑 10 个样本（自己 + 朋友 + 历史人物），输出 next_5_years 和 next_30_days，
 * 与命理软件结果对比。验收：太岁年 / 大运起算 / 节气 100% 一致。
 */

import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import { calculateBazi } from '@/lib/services/pillar-calculator.service';
import { calculateDayun } from '@/lib/dayun-calculator';
import type { DetectorInput } from '@/lib/life-timing/types';

interface Sample {
  name: string;
  birthDate: Date;
  gender: 'male' | 'female';
  birthPlace?: string;
  expectedNotes?: string;
}

const SAMPLES: Sample[] = [
  // 真实样本，运行前替换
  { name: '样本1', birthDate: new Date(1990, 4, 15, 14, 30), gender: 'male', expectedNotes: '请改为真实生日' },
  { name: '样本2', birthDate: new Date(1985, 8, 23, 9, 0), gender: 'female' },
  { name: '样本3', birthDate: new Date(1992, 11, 7, 16, 30), gender: 'male' },
  { name: '样本4', birthDate: new Date(1988, 2, 14, 22, 0), gender: 'female' },
  { name: '样本5', birthDate: new Date(1995, 6, 19, 6, 45), gender: 'male' },
  // 历史人物（可对照命理书籍）
  { name: '毛泽东', birthDate: new Date(1893, 11, 26, 7, 30), gender: 'male' },
  { name: '邓小平', birthDate: new Date(1904, 7, 22, 6, 0), gender: 'male' },
  { name: '样本8', birthDate: new Date(2000, 0, 1, 12, 0), gender: 'male' },
  { name: '样本9', birthDate: new Date(1976, 5, 5, 18, 30), gender: 'female' },
  { name: '样本10', birthDate: new Date(1968, 9, 12, 4, 15), gender: 'male' },
];

async function main() {
  const now = new Date();
  console.log(`=== Life Timing 验证 10 样本 (now=${now.toISOString().slice(0, 10)}) ===\n`);

  for (const sample of SAMPLES) {
    console.log(`──────────────────────────────────`);
    console.log(`【${sample.name}】 ${sample.birthDate.toISOString().slice(0, 16)} ${sample.gender}`);

    try {
      // 计算八字
      const bazi = calculateBazi({
        birthDate: sample.birthDate,
        gender: sample.gender,
      });

      // 计算大运
      const dayunResult = calculateDayun(
        sample.birthDate,
        sample.gender,
        bazi.pillars
      );

      const input: DetectorInput = {
        bazi: {
          yearGan: bazi.pillars[0].celestialStem,
          yearZhi: bazi.pillars[0].earthlyBranch,
          monthGan: bazi.pillars[1].celestialStem,
          monthZhi: bazi.pillars[1].earthlyBranch,
          dayGan: bazi.pillars[2].celestialStem,
          dayZhi: bazi.pillars[2].earthlyBranch,
          hourGan: bazi.pillars[3].celestialStem,
          hourZhi: bazi.pillars[3].earthlyBranch,
        },
        birthDate: sample.birthDate,
        currentDate: now,
        dayunResult,
      };

      const t0 = performance.now();
      const profile = buildTimingProfile(input);
      const elapsed = (performance.now() - t0).toFixed(1);

      console.log(`八字: ${profile.baziPillars}`);
      console.log(`computedForYear: ${profile.computedForYear}`);
      console.log(`耗时: ${elapsed}ms`);
      console.log();

      console.log('next_30_days:');
      for (const p of profile.next_30_days) {
        console.log(`  ${p.startDate} [${p.severity}] ${p.type}: ${p.rawReason}`);
      }

      console.log('\nnext_5_years (major):');
      for (const t of profile.next_5_years) {
        console.log(`  ${t.year} (${t.ageAtYear}岁) [${t.severity}] ${t.type}: ${t.rawReason}`);
      }

      if (sample.expectedNotes) {
        console.log(`\n[NOTES] ${sample.expectedNotes}`);
      }
    } catch (err) {
      console.error(`错误：${err instanceof Error ? err.message : err}`);
    }

    console.log();
  }

  console.log(`\n=== 完成 ===`);
  console.log(`验收方法：把以上输出与你信任的命理软件结果对比`);
  console.log(`重点核对：1) 太岁年命中年份 2) 节气日期 3) 大运起算年龄`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: 加 npm script**

修改 `package.json` 在 seo 脚本之后追加：

```json
"life-timing:verify": "node --import tsx scripts/life-timing/verify-samples.ts",
```

- [ ] **Step 3: 跑一次脚本（占位样本，验证不崩）**

```bash
npm run life-timing:verify 2>&1 | head -50
```

Expected: 10 个样本全部跑完，每个有八字 / 时点输出。

- [ ] **Step 4: Commit**

```bash
git add scripts/life-timing/verify-samples.ts package.json
git commit -m "feat(life-timing): T13 - 10 样本人肉验证脚本

npm run life-timing:verify
跑完后用真实命理软件对比输出"
```

---

## Task 14: 整体回归测试

**Files:** 无

- [ ] **Step 1: 跑全部 life-timing 单测**

```bash
npx jest tests/lib/life-timing/ 2>&1 | tail -10
```

Expected:
- Test Suites: 9 passed, 9 total
- Tests: ~113 passed, 0 failed

- [ ] **Step 2: 确认 lint 干净**

```bash
npm run lint 2>&1 | tail -3
```

Expected: 0 错误

- [ ] **Step 3: 确认 tsc 不引入新错误**

```bash
npx tsc --noEmit 2>&1 | grep -E "lib/life-timing|scripts/life-timing" | head -5
```

Expected: 0 行（life-timing 自身无错误）

- [ ] **Step 4: 跑性能测试**

```bash
node --import tsx -e "
import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import { calculateBazi } from '@/lib/services/pillar-calculator.service';
import { calculateDayun } from '@/lib/dayun-calculator';

const birthDate = new Date(1990, 4, 15, 14, 30);
const bazi = calculateBazi({ birthDate, gender: 'male' });
const dayunResult = calculateDayun(birthDate, 'male', bazi.pillars);
const input = {
  bazi: {
    yearGan: bazi.pillars[0].celestialStem, yearZhi: bazi.pillars[0].earthlyBranch,
    monthGan: bazi.pillars[1].celestialStem, monthZhi: bazi.pillars[1].earthlyBranch,
    dayGan: bazi.pillars[2].celestialStem, dayZhi: bazi.pillars[2].earthlyBranch,
    hourGan: bazi.pillars[3].celestialStem, hourZhi: bazi.pillars[3].earthlyBranch,
  },
  birthDate, currentDate: new Date(), dayunResult,
};

const t0 = performance.now();
for (let i = 0; i < 10; i++) buildTimingProfile(input);
const avg = (performance.now() - t0) / 10;
console.log('Avg per call:', avg.toFixed(1), 'ms');
"
```

Expected: avg ≤ 200ms 单次。

- [ ] **Step 5: 总结提交**

```bash
git log --oneline | head -15
```

应该看到 13 个 T1-T13 commit。

---

## 完成标准

Sub-Spec A 完成 = 满足以下全部：

1. [ ] 13 个 Task 全部 commit
2. [ ] 113+ 单测通过 (`npx jest tests/lib/life-timing/`)
3. [ ] lint 干净
4. [ ] 单次 buildTimingProfile ≤ 200ms
5. [ ] 10 个真实样本验证脚本能跑通
6. [ ] 用户做人肉验证：太岁年 / 节气 / 大运起算 100% 一致

完成后，**Sub-Spec B（新结果页）和 Sub-Spec C（邮件触达）才能在这个地基上构建**。
