# Sub-Spec A: 命理时点检测引擎 详细设计

**日期**：2026-05-10
**状态**：待审
**依赖**：无（这是地基）
**被依赖**：Sub-Spec B（新结果页）、Sub-Spec C（邮件触达）
**总 spec**：`docs/superpowers/specs/2026-05-10-life-timing-advisor-master.md`

---

## 目标

构建命理时点检测引擎 — 一个**纯函数层**，给定用户八字和当前时间，确定性地输出未来 30 天 / 12 月 / 5 年的所有命理重要时点。

**不做**：界面、邮件、cron、LLM 调用。

**为什么独立**：地基错了上面全错。先让纯逻辑稳定 1 周，再往上建。

---

## 成功标准

1. **核心**：5 个 detector 单测覆盖率 ≥ 90%
2. **质量**：10 个真实样本（不同年龄/性别/出生地）人肉对照命理软件结果，全部一致
3. **性能**：单次完整检测（一个用户）≤ 200ms
4. **接口**：`timing-orchestrator.ts` 输出格式稳定，Sub-Spec B/C 可直接消费

---

## 不在范围

- LLM 文案生成（属于 Sub-Spec B 的 timing-narrator agent）
- 时点缓存到数据库（属于 Sub-Spec B/C 的具体集成方案）
- 邮件渲染（Sub-Spec C）
- 界面展示（Sub-Spec B）

---

## 架构

```
lib/life-timing/
├── types.ts                          ~80 行
├── detectors/
│   ├── solar-terms.ts                ~60 行   节气检测
│   ├── tai-sui.ts                    ~80 行   太岁年检测
│   ├── dayun-transition.ts           ~70 行   大运转换检测
│   ├── sui-yun-bing-lin.ts           ~40 行   岁运并临检测
│   └── liuyue-triggers.ts            ~180 行  流月触发检测
├── timing-orchestrator.ts            ~150 行  统一编排
├── past-validation.ts                ~120 行  过去印证生成（区块 2 用）
└── constants.ts                      ~80 行   12 地支关系表

tests/lib/life-timing/
├── detectors/
│   ├── solar-terms.test.ts           ~10 测试
│   ├── tai-sui.test.ts               ~15 测试
│   ├── dayun-transition.test.ts      ~10 测试
│   ├── sui-yun-bing-lin.test.ts      ~8 测试
│   └── liuyue-triggers.test.ts       ~20 测试
├── timing-orchestrator.test.ts       ~15 测试
└── past-validation.test.ts           ~10 测试
```

总代码量约 **860 行 + 88 测试**。

---

## 类型设计

### `lib/life-timing/types.ts`

```typescript
// 时点严重程度
export type TimingSeverity = 'notice' | 'caution' | 'critical';

// 时点类型（决定后续 narrator 用哪个 prompt 模板）
export type TimingType =
  | 'solar_term'           // 节气
  | 'tai_sui_value'        // 值太岁（本命年）
  | 'tai_sui_clash'        // 冲太岁
  | 'tai_sui_punish'       // 刑太岁
  | 'tai_sui_harm'         // 害太岁
  | 'tai_sui_break'        // 破太岁
  | 'dayun_transition'     // 大运转换
  | 'sui_yun_bing_lin'     // 岁运并临
  | 'liuyue_clash'         // 流月相冲
  | 'liuyue_fuyin'         // 流月伏吟
  | 'liuyue_combine'       // 流月三合/三会
  | 'liuyue_shensha'       // 流月触发神煞
  ;

// 单个时点
export interface TimingPoint {
  id: string;                          // '30d_0', '12m_3' 等
  type: TimingType;
  severity: TimingSeverity;
  startDate: string;                   // ISO 'YYYY-MM-DD'
  endDate?: string;                    // 时间窗口结束（如适用）
  
  // 命理依据原始文本（不展示给用户，给 narrator agent 输入用）
  rawReason: string;
  
  // 命理上下文（给 narrator 生成文案用）
  context: {
    pillar?: string;                   // 触发的柱
    ganzhi?: string;                   // 触发的干支
    relation?: string;                 // 关系名（"伏吟" / "三合" 等）
    shenSha?: string;                  // 神煞名
    [key: string]: unknown;
  };
  
  // narrator 生成后填充（Sub-Spec B 处理）
  userCopy?: {
    title: string;                     // 简短标题
    summary: string;                   // 一句话描述
    todoSuggestions: string[];         // "该做"
    avoidSuggestions: string[];        // "该避"
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
  rawTemplate: string;                 // 命理依据描述
  context: Record<string, unknown>;
}

// 完整输出
export interface TimingProfile {
  birthSignature: string;              // 用于检测变更
  baziPillars: string;                 // '庚午|戊午|辛酉|乙未'
  computedAt: string;                  // ISO timestamp
  computedForYear: string;             // '丙午' 等命理年
  
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
  dayunResult: import('@/lib/dayun-calculator').DayunResult;
  shenShaList?: Array<{ name: string; pillar?: string; impact?: string }>;
}
```

---

## constants.ts — 12 地支关系表

```typescript
// 12 地支
export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

// 10 天干
export const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

// 地支六冲
export const BRANCH_CLASH: Record<EarthlyBranch, EarthlyBranch> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
};

// 地支三刑
export const BRANCH_PUNISH: Record<EarthlyBranch, EarthlyBranch[]> = {
  '寅': ['巳', '申'],
  '巳': ['申', '寅'],
  '申': ['寅', '巳'],
  '丑': ['戌', '未'],
  '戌': ['未', '丑'],
  '未': ['丑', '戌'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],  // 自刑
};

// 地支六害
export const BRANCH_HARM: Record<EarthlyBranch, EarthlyBranch> = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};

// 地支六破
export const BRANCH_BREAK: Record<EarthlyBranch, EarthlyBranch> = {
  '子': '酉', '酉': '子',
  '丑': '辰', '辰': '丑',
  '寅': '亥', '亥': '寅',
  '卯': '午', '午': '卯',
  '巳': '申', '申': '巳',
  '未': '戌', '戌': '未',
};

// 地支三合
export const BRANCH_TRINE: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['申', '子', '辰'],     // 三合水局
  ['寅', '午', '戌'],     // 三合火局
  ['亥', '卯', '未'],     // 三合木局
  ['巳', '酉', '丑'],     // 三合金局
];

// 地支三会
export const BRANCH_DIRECTIONS: Array<[EarthlyBranch, EarthlyBranch, EarthlyBranch]> = [
  ['寅', '卯', '辰'],     // 三会东方木
  ['巳', '午', '未'],     // 三会南方火
  ['申', '酉', '戌'],     // 三会西方金
  ['亥', '子', '丑'],     // 三会北方水
];
```

---

## Detector 1: solar-terms.ts

### 职责
返回未来 12 月内的 4 主节气日期 + 严重程度。

### 实现

```typescript
import { Solar } from 'lunar-javascript';
import type { TimingPoint } from '../types';

const FOUR_MAIN_TERMS = ['立春', '立夏', '立秋', '立冬'] as const;

export function detectSolarTerms(currentDate: Date): TimingPoint[] {
  const points: TimingPoint[] = [];
  
  // 检查未来 365 天内的每个节气
  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    
    const solar = Solar.fromDate(checkDate);
    const lunar = solar.getLunar();
    const jieQi = lunar.getJieQi();  // 当天是否是节气
    
    if (FOUR_MAIN_TERMS.includes(jieQi as any)) {
      points.push({
        id: `solar_${jieQi}_${checkDate.getFullYear()}`,
        type: 'solar_term',
        severity: jieQi === '立春' ? 'caution' : 'notice',
        startDate: checkDate.toISOString().slice(0, 10),
        endDate: addDays(checkDate, 7).toISOString().slice(0, 10),  // 过渡期 7 天
        rawReason: `${jieQi}节气过渡期，命理上能量切换的关键 7 天`,
        context: { termName: jieQi },
      });
    }
  }
  
  return points;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### 单测要点

```
- 当天是立春 → 返回包含立春的 TimingPoint
- 当天前 7 天是立夏 → 不包含（已过）
- 未来 30 天内有立秋 → 立秋包含
- 立春标 caution，其他 3 个节气标 notice
- 输出按日期升序
- 365 天内必然有 4 个主节气（不多不少）
```

---

## Detector 2: tai-sui.ts

### 职责
判断未来 12 月内是否进入或正处于太岁年（值/冲/刑/害/破），返回时点。

### 实现

```typescript
import { Solar } from 'lunar-javascript';
import { BRANCH_CLASH, BRANCH_PUNISH, BRANCH_HARM, BRANCH_BREAK, type EarthlyBranch } from '../constants';
import type { TimingPoint, DetectorInput } from '../types';

export function detectTaiSuiYears(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const yearZhi = input.bazi.yearZhi as EarthlyBranch;
  
  // 检查当前年到未来 5 年的每年立春后的流年地支
  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);
    if (liChunDate < input.currentDate && yearOffset === 0) continue;  // 今年立春已过则跳本年
    
    const liuNianGanZhi = getLiuNianGanZhi(checkYear);
    const liuNianZhi = liuNianGanZhi.charAt(1) as EarthlyBranch;
    
    let type: TimingPoint['type'] | null = null;
    let severity: TimingPoint['severity'] = 'caution';
    let reason = '';
    
    // 值太岁
    if (liuNianZhi === yearZhi) {
      type = 'tai_sui_value';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相同，值太岁（本命年）`;
    }
    // 冲太岁
    else if (BRANCH_CLASH[liuNianZhi] === yearZhi) {
      type = 'tai_sui_clash';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相冲`;
    }
    // 刑太岁
    else if (BRANCH_PUNISH[liuNianZhi]?.includes(yearZhi)) {
      type = 'tai_sui_punish';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相刑`;
    }
    // 害太岁
    else if (BRANCH_HARM[liuNianZhi] === yearZhi) {
      type = 'tai_sui_harm';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相害`;
    }
    // 破太岁
    else if (BRANCH_BREAK[liuNianZhi] === yearZhi) {
      type = 'tai_sui_break';
      severity = 'notice';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相破`;
    }
    
    if (type) {
      points.push({
        id: `taisui_${type}_${checkYear}`,
        type,
        severity,
        startDate: liChunDate.toISOString().slice(0, 10),
        endDate: findLiChun(checkYear + 1).toISOString().slice(0, 10),
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

// 取一年的立春日期（北京时间）
function findLiChun(year: number): Date {
  // 立春稳定在 2月3日-2月5日，先粗略，准确日期 lunar-javascript 提供
  for (let day = 3; day <= 5; day++) {
    const solar = Solar.fromYmd(year, 2, day);
    const lunar = solar.getLunar();
    if (lunar.getJieQi() === '立春') {
      return new Date(year, 1, day);
    }
  }
  return new Date(year, 1, 4);  // fallback
}

// 取流年干支（当年立春到次年立春之间的命理年）
function getLiuNianGanZhi(year: number): string {
  const liChun = findLiChun(year);
  const solar = Solar.fromDate(liChun);
  return solar.getLunar().getYearInGanZhi();
}
```

### 单测要点

```
- 出生年支=午 + 当前年=2026（丙午）→ 值太岁 critical
- 出生年支=子 + 当前年=2026（丙午）→ 冲太岁 critical
- 出生年支=丑 + 当前年=2026（丙午）→ 害太岁 caution
- 出生年支=寅 + 当前年=2026 → 无太岁触发
- 立春前查 → 不算本年触发
- 立春后查 → 算本年触发
- 未来 5 年内最多检测出 5 个不同年份的 tai_sui
```

---

## Detector 3: dayun-transition.ts

### 职责
检测未来 12 月内是否要换大运。如果要，返回时点。

### 实现

```typescript
import type { TimingPoint, DetectorInput } from '../types';

export function detectDayunTransition(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult.dayuns || [];
  const currentAgeYears = computeAge(input.birthDate, input.currentDate);
  
  for (const dayun of dayuns) {
    const startAge = dayun.startAge;
    const startDate = addYearsToBirth(input.birthDate, startAge);
    const endDate = addYearsToBirth(input.birthDate, startAge + 10);
    
    // 检查是否在未来 12 月内开始
    const monthsUntilStart = monthsBetween(input.currentDate, startDate);
    if (monthsUntilStart >= 0 && monthsUntilStart <= 12) {
      points.push({
        id: `dayun_${dayun.ganZhi}_${startAge}`,
        type: 'dayun_transition',
        severity: 'critical',
        startDate: addDays(startDate, -30).toISOString().slice(0, 10),  // 提前 30 天预警
        endDate: endDate.toISOString().slice(0, 10),
        rawReason: `进入${dayun.ganZhi}大运（${startAge}-${startAge + 10}岁），10 年人生节奏切换`,
        context: {
          ganZhi: dayun.ganZhi,
          startAge,
          startDate: startDate.toISOString().slice(0, 10),
        },
      });
    }
  }
  
  return points;
}

function computeAge(birth: Date, current: Date): number {
  const years = current.getFullYear() - birth.getFullYear();
  const beforeBirthday = current.getMonth() < birth.getMonth() ||
    (current.getMonth() === birth.getMonth() && current.getDate() < birth.getDate());
  return beforeBirthday ? years - 1 : years;
}

function addYearsToBirth(birth: Date, years: number): Date {
  const result = new Date(birth);
  result.setFullYear(birth.getFullYear() + years);
  return result;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### 单测要点

```
- 当前 34.5 岁 + 35 岁换大运 → 命中（提前 30 天 startDate）
- 当前 30 岁 + 35 岁换大运 → 不命中（5 年后）
- 未来 12 月内换大运 → severity=critical
- 大运起算为 birth + startAge 年，验证日期精确
- DayunResult 为空 → 返回空数组（不崩）
```

---

## Detector 4: sui-yun-bing-lin.ts

### 职责
检测大运干支与流年干支完全相同的"岁运并临"年。

### 实现

```typescript
import type { TimingPoint, DetectorInput } from '../types';
import { detectTaiSuiYears } from './tai-sui';

export function detectSuiYunBingLin(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult.dayuns || [];
  
  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);
    if (liChunDate < input.currentDate && yearOffset === 0) continue;
    
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
        startDate: liChunDate.toISOString().slice(0, 10),
        endDate: findLiChun(checkYear + 1).toISOString().slice(0, 10),
        rawReason: `${checkYear}年（${liuNianGanZhi}）大运干支与流年干支完全相同，命理称岁运并临`,
        context: {
          year: checkYear,
          ganZhi: liuNianGanZhi,
        },
      });
    }
  }
  
  return points;
}

// 共用 tai-sui.ts 的 findLiChun / getLiuNianGanZhi（实际实现时提到 utils）
import { findLiChun, getLiuNianGanZhi } from './tai-sui';
```

注意：`findLiChun` 和 `getLiuNianGanZhi` 实际实现时**抽到 `lib/life-timing/lunar-utils.ts`**，多 detector 共享。

### 单测要点

```
- 大运乙巳 + 流年乙巳 → 命中
- 大运乙巳 + 流年丙午 → 不命中
- 该年龄不在任何大运区间 → 不命中（不崩）
- severity 一律 critical
- 一生 1-2 次属正常，多于 3 次说明算错
```

---

## Detector 5: liuyue-triggers.ts

### 职责
检测未来 12 个月，每月流月与命局的关键作用。

### 实现概要

```typescript
import { Solar } from 'lunar-javascript';
import {
  BRANCH_CLASH, BRANCH_TRINE, BRANCH_DIRECTIONS,
  type EarthlyBranch
} from '../constants';
import type { TimingPoint, DetectorInput } from '../types';

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
    checkDate.setDate(15);  // 月中作为代表日
    
    const solar = Solar.fromDate(checkDate);
    const lunar = solar.getLunar();
    const liuYueZhi = lunar.getMonthInGanZhi().charAt(1) as EarthlyBranch;
    const liuYueGanZhi = lunar.getMonthInGanZhi();
    
    // 1. 检查冲（与四柱任一支相冲）
    fourPillars.forEach((pillarZhi, idx) => {
      if (BRANCH_CLASH[liuYueZhi] === pillarZhi) {
        points.push(makePoint('liuyue_clash', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}相冲，变动月`));
      }
    });
    
    // 2. 检查伏吟（流月支 = 任一柱支）
    fourPillars.forEach((pillarZhi, idx) => {
      if (liuYueZhi === pillarZhi) {
        points.push(makePoint('liuyue_fuyin', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}伏吟，原局力量加倍`));
      }
    });
    
    // 3. 检查三合（流月与命局其他二支构成三合）
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
    
    // 4. 检查神煞触发
    if (input.shenShaList) {
      input.shenShaList.forEach((shenSha) => {
        // 简化：神煞名命中流月支
        if (matchesShenSha(shenSha, liuYueZhi)) {
          const isNegative = ['羊刃', '劫煞', '亡神', '灾煞'].includes(shenSha.name);
          points.push(makePoint('liuyue_shensha', isNegative ? 'caution' : 'notice', checkDate, {
            shenSha: shenSha.name,
            liuYueGanZhi,
          }, `${liuYueGanZhi}月触发${shenSha.name}`));
        }
      });
    }
  }
  
  return points;
}

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'] as const;

function makePoint(
  type: TimingPoint['type'],
  severity: TimingPoint['severity'],
  date: Date,
  context: Record<string, unknown>,
  reason: string
): TimingPoint {
  return {
    id: `liuyue_${type}_${date.getFullYear()}_${date.getMonth() + 1}_${context.pillarIdx ?? '_'}`,
    type,
    severity,
    startDate: monthStart(date).toISOString().slice(0, 10),
    endDate: monthEnd(date).toISOString().slice(0, 10),
    rawReason: reason,
    context,
  };
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function matchesShenSha(shenSha: { name: string }, branch: EarthlyBranch): boolean {
  // 简化版：实际应根据神煞规则查 lib/services 现有 shenSha 逻辑
  // 此处做轻量映射，详细在实现时补
  return false;
}
```

### 单测要点

```
- 月支与年支冲 → 命中 liuyue_clash
- 月支等于日支 → 命中 liuyue_fuyin
- 月支为申，命局有子辰 → 命中 liuyue_combine（三合水局）
- 12 月遍历 → 不漏月不重复月
- 同一月可触发多种关系（不互斥）
- 严重程度按规则分配
```

---

## past-validation.ts

### 职责
基于命理结构生成"过去印证"模板（区块 2 用）。**不是预测过去**，而是说"这种结构的人通常在 X 类时间下会有 Y 反应"。

### 实现

```typescript
import type { PastValidation, DetectorInput } from './types';

export function generatePastValidations(input: DetectorInput): PastValidation[] {
  const validations: PastValidation[] = [];
  
  // 规则 1: 基于格局
  const pattern = input.dayunResult?.pattern;  // 假设有
  if (pattern === '身弱') {
    validations.push({
      id: 'pattern_weak_self',
      category: 'pattern',
      rawTemplate: '身弱结构的人，在外部压力大的时候容易透支身体或情绪',
      context: { pattern: '身弱' },
    });
  }
  if (pattern === '身旺') {
    validations.push({
      id: 'pattern_strong_self',
      category: 'pattern',
      rawTemplate: '身旺结构的人，长期靠"硬扛"行事，容易在关系上消耗',
      context: { pattern: '身旺' },
    });
  }
  
  // 规则 2: 基于神煞
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
  
  // 规则 3: 基于已过去的大运
  const pastDayuns = (input.dayunResult.dayuns || [])
    .filter((d) => d.startAge < computeAge(input.birthDate, input.currentDate));
  
  if (pastDayuns.length >= 2) {
    const recentPast = pastDayuns[pastDayuns.length - 1];
    if (recentPast.quality === 'good') {
      validations.push({
        id: 'dayun_imprint_recent_good',
        category: 'dayun_imprint',
        rawTemplate: `过去 10 年（${recentPast.ganZhi}大运）你应该有过一段做事相对顺手的时间`,
        context: { ganZhi: recentPast.ganZhi },
      });
    }
  }
  
  return validations.slice(0, 4);  // 最多 4 条，区块 2 视觉密度合适
}

function computeAge(birth: Date, current: Date): number {
  const years = current.getFullYear() - birth.getFullYear();
  return years;
}
```

### 单测要点

```
- 身弱命局 → 输出 pattern_weak_self
- 神煞含羊刃 → 输出 shensha_yangren
- 神煞同时含文昌+天乙 → 输出 2 条
- 没有命理特征 → 输出空数组（不崩）
- 总条数 ≤ 4
```

---

## timing-orchestrator.ts

### 职责
统一编排 5 个 detector + past-validation，输出完整 TimingProfile。

```typescript
import type { TimingProfile, DetectorInput, TimingPoint } from './types';
import { detectSolarTerms } from './detectors/solar-terms';
import { detectTaiSuiYears } from './detectors/tai-sui';
import { detectDayunTransition } from './detectors/dayun-transition';
import { detectSuiYunBingLin } from './detectors/sui-yun-bing-lin';
import { detectLiuyueTriggers } from './detectors/liuyue-triggers';
import { generatePastValidations } from './past-validation';

export function buildTimingProfile(input: DetectorInput): TimingProfile {
  // 1. 跑所有 detector
  const solarTerms = detectSolarTerms(input.currentDate);
  const taiSuiYears = detectTaiSuiYears(input);
  const dayunShifts = detectDayunTransition(input);
  const suiYunBingLin = detectSuiYunBingLin(input);
  const liuyueTriggers = detectLiuyueTriggers(input);
  const pastValidations = generatePastValidations(input);
  
  // 2. 合并并按距离切分
  const allPoints = [
    ...solarTerms,
    ...taiSuiYears,
    ...dayunShifts,
    ...suiYunBingLin,
    ...liuyueTriggers,
  ];
  
  // 排序按 startDate
  allPoints.sort((a, b) => a.startDate.localeCompare(b.startDate));
  
  // 切分到 30d / 12m
  const now = input.currentDate;
  const day30 = addDays(now, 30);
  const day365 = addDays(now, 365);
  
  const next_30_days: TimingPoint[] = [];
  const next_12_months: TimingPoint[] = [];
  
  for (const point of allPoints) {
    const pointDate = new Date(point.startDate);
    if (pointDate <= day30) next_30_days.push(point);
    else if (pointDate <= day365) next_12_months.push(point);
  }
  
  // 3. 5 年视图：major transition only
  const next_5_years = [
    ...taiSuiYears.map((p) => ({
      type: 'tai_sui_year' as const,
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
    ...dayunShifts.map((p) => ({
      type: 'dayun_shift' as const,
      year: new Date(p.startDate).getFullYear(),
      ageAtYear: input.dayunResult.dayuns?.find((d) => d.ganZhi === p.context.ganZhi)?.startAge || 0,
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
    ...suiYunBingLin.map((p) => ({
      type: 'sui_yun_bing_lin' as const,
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
  ].sort((a, b) => a.year - b.year);
  
  // 4. 计算 birthSignature
  const birthSignature = `${input.birthDate.toISOString().slice(0, 10)}_${input.bazi.yearGan}${input.bazi.yearZhi}`;
  
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

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getCurrentLiuNianGanZhi(currentDate: Date): string {
  // 用 lunar-javascript 取
  // ...
  return '';
}
```

---

## 性能要求

每次 `buildTimingProfile` 完整调用 ≤ 200ms。

主要耗时：

- 5 个 detector 串行 ≈ 60-100ms
- past-validation ≈ 5ms
- 排序 + 切分 ≈ 10ms

如果未来 lunar-javascript 调用累积超过 100ms，考虑缓存节气日期表（一年一次足够）。

---

## 验收清单

代码层：

- [ ] 5 个 detector 全部通过单测，覆盖率 ≥ 90%
- [ ] timing-orchestrator 通过 15+ 单测
- [ ] past-validation 通过 10+ 单测
- [ ] `npm run lint` 0 错误
- [ ] `npm run test` 新增 88+ 测试全过
- [ ] `npx tsc --noEmit` 无新增错误

人肉验证（10 个真实样本）：

- [ ] 选 10 个不同年龄/性别/出生地的人（自己 + 朋友 + 历史人物）
- [ ] 每个人的 next_5_years 与已知命理软件结果对比，**太岁年和大运起算年份**全部一致（这两项是确定性数学，不容差错）
- [ ] 每个人的 next_30_days 至少有 1 个明确的命理时点（排除"什么都没发生"）
- [ ] tai-sui 检测的太岁年与权威干支对照表（如《历书》）100% 一致
- [ ] 节气日期与气象局公布日期对比，误差 ≤ 1 天

性能：

- [ ] `buildTimingProfile` 单次调用 ≤ 200ms（用 console.time 测）

---

## 不依赖

Sub-Spec A 是地基，**完全不依赖**：

- LLM
- 数据库（暂不写库，纯函数）
- 网络请求
- 现有的 agent 系统

只复用：

- `lib/dayun-calculator` 的 DayunResult 类型和实例
- `lunar-javascript` 库
- `lib/services/pillar-calculator.service.ts` 的八字计算（但实际不调用，由调用方传入）

**这种解耦的好处**：未来 Sub-Spec B、C 集成时可以**完全无副作用地用纯逻辑测试**。

---

## 后续 Sub-Spec 怎么用 A 的输出

### Sub-Spec B 怎么用：

```typescript
// app/r/[id]/page.tsx (新)
const profile = buildTimingProfile({
  bazi: report.basic.bazi,
  birthDate: report.basic.birthDate,
  currentDate: new Date(),
  dayunResult: report.dayunResult,
  shenShaList: report.shenSha?.list,
});

// 然后调 timing-narrator agent 给每个 TimingPoint 加 userCopy
const profileWithCopy = await runTimingNarrator(profile);

// 渲染 6 区块
return <ResultPageV2 profile={profileWithCopy} />;
```

### Sub-Spec C 怎么用：

```typescript
// scripts/timing-email-cron-handler.ts
const subscribedUsers = listActiveSubscriptions({ category: 'monthly' });

for (const user of subscribedUsers) {
  const profile = buildTimingProfile({ ... });  // 重跑（不读缓存）
  const copy = await runTimingNarrator(profile.next_30_days);
  
  await enqueueMonthlyDigestEmail({
    email: user.email,
    points: profile.next_30_days,
    copy,
  });
}
```

---

## 总结

Sub-Spec A 是 **9 个文件 + 88 个测试 + 约 860 行代码**，4-5 天完成。

完成后 Sub-Spec B 和 C 才能开始。

完成验收的硬指标：**10 个真实样本人肉验证一致**。比单测重要 10 倍。
