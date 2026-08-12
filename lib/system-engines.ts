/**
 * Canonical roster of Life K-Line calculation engines.
 * Used by system capability (homepage / footer / API) — not marketing copy.
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
};

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
  },
  {
    id: 'yongshen',
    name: '用神 / 日主强弱',
    role: '得令得地得势 · 扶抑主用 · 调候分列',
    version: YONGSHEN_ENGINE_VERSION,
    path: 'lib/bazi-analyzer.ts',
    href: '/analyze',
    family: 'natal',
  },
  {
    id: 'dayun',
    name: '大运',
    role: '阳男阴女顺逆 · 节气起运 · 用神匹配',
    version: 'dayun-wuxing-v2',
    path: 'lib/dayun-calculator.ts',
    href: '/analyze',
    family: 'natal',
  },
  {
    id: 'kline',
    name: '人生K线',
    role: '原局+大运+流年加权，无正弦人造波',
    version: 'kline-v6',
    path: 'lib/kline-v6.ts',
    href: '/analyze',
    family: 'natal',
  },
  {
    id: 'shensha',
    name: '神煞',
    role: '天乙桃花驿马等辅助信号',
    version: 'shensha-v1',
    path: 'lib/shensha-calculator.ts',
    href: '/analyze',
    family: 'natal',
  },
  {
    id: 'chart-audit',
    name: '排盘核对',
    role: '填写时辰 vs 07:00 / 午时 / 晚子 / 真太阳',
    version: 'chart-audit-v1',
    path: 'lib/chart-audit.ts',
    href: '/docs/birth-info',
    family: 'natal',
  },
  {
    id: 'fortune-orchestrator',
    name: '报告编排',
    role: '四柱→用神→大运→K线→建议装配',
    version: 'fortune-v6',
    path: 'lib/fortune-engine.ts',
    href: '/analyze',
    family: 'natal',
  },
  {
    id: 'hehun',
    name: '合婚',
    role: '日柱 · 夫妻宫 · 用忌互补 · 大运同步',
    version: 'hehun-v1',
    path: 'lib/hehun-engine.ts',
    href: '/hehun',
    family: 'tool',
  },
  {
    id: 'naming',
    name: '起名',
    role: '康熙笔画 · 用神补益 · 音韵',
    version: 'kangxi-v1',
    path: 'lib/naming/kangxi-engine.ts',
    href: '/tools/naming',
    family: 'tool',
  },
  {
    id: 'fengshui',
    name: '风水空间',
    role: '户型 / 方位 / 人宅对照',
    version: 'space-v1',
    path: 'lib/fengshui/space',
    href: '/tools/fengshui-space',
    family: 'tool',
  },
  {
    id: 'xiangxue',
    name: '相学',
    role: '面相手相可见结构，禁疾病寿命定命',
    version: 'xiangxue-v3',
    path: 'lib/xiangxue/engines.ts',
    href: '/tools/physiognomy',
    family: 'tool',
  },
  {
    id: 'ziwei',
    name: '紫微',
    role: '命盘教学结构',
    version: 'ziwei-edu-v1',
    path: 'lib/ziwei/edu-chart.ts',
    href: '/tools/ziwei-edu',
    family: 'tool',
  },
  {
    id: 'almanac',
    name: '通书日运',
    role: '万年历 + 个人日主用神层',
    version: 'almanac-v1',
    path: 'lib/almanac',
    href: '/almanac',
    family: 'time',
  },
  {
    id: 'astro',
    name: '星座周期',
    role: '日/周/月/双人对照，低于命盘权重',
    version: 'astro-v1',
    path: 'lib/astro',
    href: '/astro',
    family: 'time',
  },
  {
    id: 'dimensions',
    name: '十维工具',
    role: '同一出生输入上的专项切片',
    version: 'dimensions-v1',
    path: 'lib/dimensions/engine-pack.ts',
    href: '/dimensions',
    family: 'tool',
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
