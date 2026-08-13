/**
 * How engine facts appear on each product surface.
 *
 * Three UI layers — pick one, do not invent a fourth:
 *   desk  — full 引擎结构台 (EngineSurfaceMount)
 *   cite  — jump chips into a desk on the same page (EngineSurfaceCite)
 *   lock  — compact natal facts + link away (EngineLockStrip)
 *
 * Compute always uses natal chain / GroundTruthPack.
 * Display only chooses how much of that pack the reader sees.
 */

export type EngineDisplayMode = 'desk' | 'cite' | 'lock';

export type EngineDisplaySurface =
  | 'report'
  | 'expert'
  | 'toolResult'
  | 'chatBound'
  | 'chatUnbound'
  | 'dimensions'
  | 'hehun'
  | 'naming'
  | 'almanac';

export type EngineDisplayPolicy = {
  surface: EngineDisplaySurface;
  mode: EngineDisplayMode;
  /** Mount EngineSurfaceMount on this page */
  mountDesk: boolean;
  /** Show EngineSurfaceCite (only when desk is on the same page) */
  showCite: boolean;
  /** Lock-strip / cite note */
  note: string;
  extraLabel?: string;
  extraHrefFallback?: string;
};

export const ENGINE_DISPLAY: Record<EngineDisplaySurface, EngineDisplayPolicy> = {
  report: {
    surface: 'report',
    mode: 'desk',
    mountDesk: true,
    showCite: true,
    note: '决策与叙事都挂在同一套引擎结构上',
    extraLabel: '引擎结构台',
    extraHrefFallback: '#engine-surface',
  },
  expert: {
    surface: 'expert',
    mode: 'desk',
    mountDesk: true,
    showCite: true,
    note: '专业对照与大众报告同一套盘',
    extraLabel: '引擎结构台',
    extraHrefFallback: '#engine-surface-expert',
  },
  toolResult: {
    surface: 'toolResult',
    mode: 'desk',
    mountDesk: true,
    showCite: true,
    note: '工具结果引用同一套引擎结构',
    extraLabel: '打开结构台',
    extraHrefFallback: '#engine-surface',
  },
  chatBound: {
    surface: 'chatBound',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '对话只解释这些结构，不另起一套算法',
    extraLabel: '报告结构台',
    extraHrefFallback: '/analyze',
  },
  chatUnbound: {
    surface: 'chatUnbound',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '未绑定报告 · 不编造日主用神',
    extraLabel: '去排盘',
    extraHrefFallback: '/analyze',
  },
  dimensions: {
    surface: 'dimensions',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '十维切片走四柱→用神→大运→K线主链，不另起盘',
    extraLabel: '完整报告',
    extraHrefFallback: '/analyze',
  },
  hehun: {
    surface: 'hehun',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '合婚对照同一套四柱 / 用神 / 大运，不另起纳音体系',
    extraLabel: '个人报告',
    extraHrefFallback: '/analyze',
  },
  naming: {
    surface: 'naming',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '起名对照生辰用神与康熙笔画，不另起命盘',
    extraLabel: '再起一批',
    extraHrefFallback: '/tools/naming',
  },
  almanac: {
    surface: 'almanac',
    mode: 'lock',
    mountDesk: false,
    showCite: false,
    note: '通书日运叠在日主用神上，权重低于命盘',
    extraLabel: '完整报告',
    extraHrefFallback: '/analyze',
  },
};

export function getEngineDisplay(surface: EngineDisplaySurface): EngineDisplayPolicy {
  return ENGINE_DISPLAY[surface];
}

/** User-facing reading order for /engines and docs. */
export const ENGINE_DISPLAY_LAYERS: Array<{
  mode: EngineDisplayMode;
  title: string;
  body: string;
  surfaces: string;
}> = [
  {
    mode: 'desk',
    title: '结构台',
    body: '完整报告、专业对照、工具结果页：展开四柱、用神、大运、K线、近月、通书。',
    surfaces: '报告 · 专业版 · 工具结果',
  },
  {
    mode: 'cite',
    title: '引用条',
    body: '结构台同页顶部的跳转芯片。叙事先读，需要核对时点进对应模块。',
    surfaces: '只出现在有结构台的页面',
  },
  {
    mode: 'lock',
    title: '锁定条',
    body: '对话、十维、合婚、起名、通书：只钉日主/用神/大运等关键事实，深读回报告结构台。',
    surfaces: '对话 · 十维 · 合婚 · 起名 · 通书',
  },
];
