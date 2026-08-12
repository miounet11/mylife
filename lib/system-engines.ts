/**
 * Canonical roster of Life K-Line calculation engines.
 * Developer handbook: docs/SYSTEM_ENGINES.md
 * Public page: /engines
 */

import { YONGSHEN_ENGINE_VERSION } from '@/lib/yongshen-engine-version';

export { YONGSHEN_ENGINE_VERSION };

export type SystemEngineId =
  | 'pillars'
  | 'yongshen'
  | 'dayun'
  | 'kline'
  | 'shensha'
  | 'chart-audit'
  | 'fortune-orchestrator'
  | 'hehun'
  | 'naming'
  | 'fengshui'
  | 'xiangxue'
  | 'ziwei'
  | 'almanac'
  | 'astro'
  | 'dimensions';

export type SystemEngineFamily = 'natal' | 'tool' | 'time';

export type SystemEngineEntry = {
  id: SystemEngineId;
  name: string;
  role: string;
  version: string;
  path: string;
  href: string;
  family: SystemEngineFamily;
  /** Public export to call. */
  entry: string;
  dependsOn: Array<SystemEngineId | 'wuxing-normalize' | 'solar-time' | 'calculation-identity'>;
  tests: string[];
  whenToUse: string;
};

export type SystemSupportModule = {
  id: string;
  name: string;
  path: string;
  role: string;
  entry: string;
};

/** Shared helpers — not product engines, but every engine should reuse these. */
export const SYSTEM_SUPPORT_MODULES: SystemSupportModule[] = [
  {
    id: 'wuxing-normalize',
    name: '五行键',
    path: 'lib/wuxing-normalize.ts',
    role: 'EN/CN 五行唯一比较键。内部 English，展示用 toElementCn。',
    entry: 'listHasElement / toElementCn / stemToElementEn / branchToElementEn',
  },
  {
    id: 'natal-engine-chain',
    name: '命盘主链入口',
    path: 'lib/natal-engine-chain.ts',
    role: '四柱→用神(司令分日)→大运→K线→神煞。十维/合婚/通书走这条，不要自己拼。',
    entry: 'runNatalEngineChain / resolveYongShenForPillars',
  },
  {
    id: 'fortune-context',
    name: '报告上下文',
    path: 'lib/fortune-context-builder.ts',
    role: '真太阳时 + natal chain + identity。给报告/十维/合婚预填。',
    entry: 'buildFortuneContextInput',
  },
  {
    id: 'solar-time',
    name: '真太阳时',
    path: 'lib/solar-time.ts',
    role: '经度校正钟表时间。排盘只校正一次。',
    entry: 'calculateTrueSolarTime / resolveEffectiveTiming',
  },
  {
    id: 'calculation-identity',
    name: '计算身份',
    path: 'lib/calculation-identity.ts',
    role: '钟表时间 vs 有效排盘时间锁定，升级不得换盘。',
    entry: 'buildChartCalculationIdentity',
  },
  {
    id: 'yongshen-live',
    name: '用神热读',
    path: 'lib/yongshen-live.ts',
    role: '读旧报告时按当前版本重算用神，不覆盖落库四柱。',
    entry: 'resolveLiveYongShen',
  },
  {
    id: 'yongshen-presentation',
    name: '用神表述',
    path: 'lib/yongshen-presentation.ts',
    role: '内部 English → 用户中文；调候不并入主用神。',
    entry: 'formatYongShenPublic / elementsToCn',
  },
  {
    id: 'liuyao',
    name: '六爻排卦（教学）',
    path: 'lib/liuyao/cast.ts',
    role: '三钱本卦/变卦结构，不评分、不断事。',
    entry: 'castLiuyao',
  },
];

export const NATAL_CHAIN_ORDER: SystemEngineId[] = [
  'pillars',
  'yongshen',
  'dayun',
  'kline',
  'shensha',
];

export const SYSTEM_ENGINE_FAMILY_LABEL: Record<SystemEngineFamily, string> = {
  natal: '命盘主链',
  tool: '专项工具',
  time: '时间层',
};

/** Product engines that compute a chart / score / pack. */
export const SYSTEM_ENGINES: SystemEngineEntry[] = [
  {
    id: 'pillars',
    name: '四柱排盘',
    role: '公历+节气+晚子/真太阳 → 年月日时',
    version: 'eightchar-sect2',
    path: 'lib/fortune-engine.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'calculateFourPillars',
    dependsOn: ['solar-time', 'calculation-identity'],
    tests: ['lib/__tests__/bazi-pillars-regression.test.ts', 'lib/__tests__/chart-audit.test.ts'],
    whenToUse: '任何需要年月日时四柱的地方。禁止另写 Solar/Lunar 排盘。',
  },
  {
    id: 'yongshen',
    name: '用神 / 日主强弱',
    role: '得令得地得势 · 扶抑主用 · 调候分列',
    version: YONGSHEN_ENGINE_VERSION,
    path: 'lib/bazi-analyzer.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'determineYongShen',
    dependsOn: ['pillars'],
    tests: ['lib/__tests__/bazi-analyzer.test.ts', 'lib/__tests__/yongshen-presentation.test.ts'],
    whenToUse: '必须带 birthDate/hour 以启用司令分日。内部 yongShen[] 是 English。',
  },
  {
    id: 'dayun',
    name: '大运',
    role: '阳男阴女顺逆 · 节气起运 · 用神匹配',
    version: 'dayun-wuxing-v2',
    path: 'lib/dayun-calculator.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'calculateDayun / resolveDayunList',
    dependsOn: ['pillars', 'yongshen', 'wuxing-normalize'],
    tests: ['lib/__tests__/dayun-normalize.test.ts'],
    whenToUse: '传入同一套 yongShen。读列表用 resolveDayunList（dayuns = dayunList）。',
  },
  {
    id: 'kline',
    name: '人生K线',
    role: '原局+大运+流年加权，无正弦人造波',
    version: 'kline-v6',
    path: 'lib/kline-v6.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'generateLifeKlineV6 / generateMonthlyKlineV6',
    dependsOn: ['pillars', 'yongshen', 'dayun', 'wuxing-normalize'],
    tests: ['lib/__tests__/kline-views.test.ts', 'lib/__tests__/kline-single-exit.test.ts'],
    whenToUse: '画趋势只走 V6。禁止 Math.sin 人造周期。',
  },
  {
    id: 'shensha',
    name: '神煞',
    role: '天乙桃花驿马等辅助信号',
    version: 'shensha-v1',
    path: 'lib/shensha-calculator.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'calculateShenSha',
    dependsOn: ['pillars'],
    tests: ['lib/__tests__/bazi-analyzer.test.ts'],
    whenToUse: '辅助验证，不得覆盖用神/大运主判。',
  },
  {
    id: 'chart-audit',
    name: '排盘核对',
    role: '填写时辰 vs 07:00 / 午时 / 晚子 / 真太阳',
    version: 'chart-audit-v1',
    path: 'lib/chart-audit.ts',
    href: '/docs/birth-info',
    family: 'natal',
    entry: 'buildChartAudit',
    dependsOn: ['pillars', 'solar-time'],
    tests: ['lib/__tests__/chart-audit.test.ts'],
    whenToUse: '用户质疑四柱或节气边界时并排重算。',
  },
  {
    id: 'fortune-orchestrator',
    name: '报告编排',
    role: '四柱→用神→大运→K线→建议装配',
    version: 'fortune-v6',
    path: 'lib/fortune-engine.ts',
    href: '/analyze',
    family: 'natal',
    entry: 'analyzeFortune',
    dependsOn: ['pillars', 'yongshen', 'dayun', 'kline', 'shensha'],
    tests: ['lib/__tests__/report-pro-view.test.ts', 'lib/__tests__/report-quality.test.ts'],
    whenToUse: '完整报告落库。新工具不要复制这份编排，走 natal chain。',
  },
  {
    id: 'hehun',
    name: '合婚',
    role: '日柱 · 夫妻宫 · 用忌互补 · 大运同步',
    version: 'hehun-v1',
    path: 'lib/hehun-engine.ts',
    href: '/hehun',
    family: 'tool',
    entry: 'analyzeHehun / personFromBirthInput',
    dependsOn: ['pillars', 'yongshen', 'dayun', 'wuxing-normalize'],
    tests: ['lib/__tests__/hehun-prefill.test.ts', 'lib/__tests__/hehun-present-result.test.ts'],
    whenToUse: '双方盘对照。用 normalizeElementList 比用忌，勿另起纳音体系。',
  },
  {
    id: 'naming',
    name: '起名',
    role: '康熙笔画 · 用神补益 · 音韵',
    version: 'kangxi-v1',
    path: 'lib/naming/kangxi-engine.ts',
    href: '/tools/naming',
    family: 'tool',
    entry: 'generatePersonNames / scoreName',
    dependsOn: ['yongshen', 'wuxing-normalize'],
    tests: ['lib/__tests__/naming-generate.test.ts'],
    whenToUse: '用神可传 English 或中文。字库五行是中文，比较前 toElementCn。',
  },
  {
    id: 'fengshui',
    name: '风水空间',
    role: '户型 / 方位 / 人宅对照',
    version: 'space-v1',
    path: 'lib/fengshui/space',
    href: '/tools/fengshui-space',
    family: 'tool',
    entry: 'space report / site-advise APIs',
    dependsOn: ['pillars', 'yongshen'],
    tests: ['lib/__tests__/fengshui-engine.test.ts', 'lib/__tests__/fengshui-full-report.test.ts'],
    whenToUse: '空间场与人宅合参。禁疾病寿命定命。',
  },
  {
    id: 'xiangxue',
    name: '相学',
    role: '面相手相可见结构，禁疾病寿命定命',
    version: 'xiangxue-v3',
    path: 'lib/xiangxue/engines.ts',
    href: '/tools/physiognomy',
    family: 'tool',
    entry: 'heuristicXiangxue',
    dependsOn: [],
    tests: [],
    whenToUse: '只描述可见结构。可选用神作对照，不覆盖命盘。',
  },
  {
    id: 'ziwei',
    name: '紫微',
    role: '命盘教学结构',
    version: 'ziwei-edu-v1',
    path: 'lib/ziwei/edu-chart.ts',
    href: '/tools/ziwei-edu',
    family: 'tool',
    entry: 'buildEduZiweiChart',
    dependsOn: ['pillars'],
    tests: ['lib/__tests__/ziwei-edu-chart.test.ts'],
    whenToUse: '教学盘。不替代四柱主链。',
  },
  {
    id: 'almanac',
    name: '通书日运',
    role: '万年历 + 个人日主用神层',
    version: 'almanac-v1',
    path: 'lib/almanac',
    href: '/almanac',
    family: 'time',
    entry: 'buildAlmanacDayPack / buildPersonalDayOverlay',
    dependsOn: ['pillars', 'yongshen', 'wuxing-normalize'],
    tests: [],
    whenToUse: '当日宜忌 × 日主用神。权重低于命盘。',
  },
  {
    id: 'astro',
    name: '星座周期',
    role: '日/周/月/双人对照，低于命盘权重',
    version: 'astro-v1',
    path: 'lib/astro',
    href: '/astro',
    family: 'time',
    entry: 'buildAstroDailyMatchPack',
    dependsOn: ['almanac', 'yongshen'],
    tests: ['lib/__tests__/astro-daily-match.test.ts'],
    whenToUse: '大众入口。有生辰时叠个人层，仍不得压过四柱结论。',
  },
  {
    id: 'dimensions',
    name: '十维工具',
    role: '同一出生输入上的专项切片',
    version: 'dimensions-v1',
    path: 'lib/dimensions/engine-pack.ts',
    href: '/dimensions',
    family: 'tool',
    entry: 'buildDimensionEnginePack',
    dependsOn: ['pillars', 'yongshen', 'dayun', 'kline'],
    tests: ['lib/__tests__/dimension-advisors.test.ts', 'lib/__tests__/dimension-smoke-validate.test.ts'],
    whenToUse: '必须 buildFortuneContextInput / natal chain，禁止维度自己排盘。',
  },
];

export const SYSTEM_ENGINE_COUNT = SYSTEM_ENGINES.length;

export function getSystemEngineCatalog() {
  const natal = SYSTEM_ENGINES.filter((e) => e.family === 'natal');
  const tool = SYSTEM_ENGINES.filter((e) => e.family === 'tool');
  const time = SYSTEM_ENGINES.filter((e) => e.family === 'time');
  return {
    count: SYSTEM_ENGINE_COUNT,
    natal: natal.length,
    tool: tool.length,
    time: time.length,
    yongShenVersion: YONGSHEN_ENGINE_VERSION,
    engines: SYSTEM_ENGINES,
    byFamily: { natal, tool, time } as Record<SystemEngineFamily, SystemEngineEntry[]>,
  };
}

export function engineCapabilityLine(): string {
  return `命理引擎 ${SYSTEM_ENGINE_COUNT} 套（排盘/用神/大运/K线/合婚/通书…）`;
}

export function getSystemEngine(id: SystemEngineId): SystemEngineEntry | undefined {
  return SYSTEM_ENGINES.find((e) => e.id === id);
}
