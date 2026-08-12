/**
 * Feature immersion registry — brand media + accent for major hubs.
 * Art lives under /images/brand-immersion/ (see public/images/brand-immersion/manifest.json).
 */

export type ImmersionAccent =
  | 'teal'
  | 'ink'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate'
  | 'indigo';

export type ImmersionOverlay = 'light-paper' | 'deep-ink';

export type ImmersionSurfaceKey =
  | 'home'
  | 'analyze'
  | 'tools'
  | 'dimensions'
  | 'knowledge'
  | 'teachers'
  | 'profile'
  | 'hehun'
  | 'almanac'
  | 'naming'
  | 'fengshui'
  | 'predictions'
  | 'events'
  | 'membership'
  | 'cases';

export type ImmersionSurface = {
  key: ImmersionSurfaceKey;
  route: string;
  /** Default Chinese eyebrow (pages may override / localize) */
  eyebrow: string;
  mood: string;
  accent: ImmersionAccent;
  overlay: ImmersionOverlay;
  /** Filename without extension under /images/brand-immersion/ */
  artId: string;
  alt: string;
};

const BASE = '/images/brand-immersion';

export const IMMERSION_SURFACES: Record<ImmersionSurfaceKey, ImmersionSurface> = {
  home: {
    key: 'home',
    route: '/',
    eyebrow: '人生K线',
    mood: '从生辰到结构节奏',
    accent: 'ink',
    overlay: 'light-paper',
    artId: 'surface-home',
    alt: '人生K线首页：结构节奏意象',
  },
  analyze: {
    key: 'analyze',
    route: '/analyze',
    eyebrow: '测算工作台',
    mood: '结构优先的完整报告',
    accent: 'teal',
    overlay: 'deep-ink',
    artId: 'surface-analyze',
    alt: '测算工作台：人生节奏结构图',
  },
  tools: {
    key: 'tools',
    route: '/tools',
    eyebrow: '工具中心',
    mood: '按问题匹配工具',
    accent: 'slate',
    overlay: 'light-paper',
    artId: 'surface-tools',
    alt: '工具中心：模块化工具托盘',
  },
  dimensions: {
    key: 'dimensions',
    route: '/dimensions',
    eyebrow: '十维度',
    mood: '十个高频场景深拆',
    accent: 'violet',
    overlay: 'light-paper',
    artId: 'surface-dimensions',
    alt: '十维度：场景罗盘',
  },
  knowledge: {
    key: 'knowledge',
    route: '/knowledge',
    eyebrow: '知识库',
    mood: '方法与结构，不是神话',
    accent: 'indigo',
    overlay: 'light-paper',
    artId: 'surface-knowledge',
    alt: '知识库：结构阅读空间',
  },
  teachers: {
    key: 'teachers',
    route: '/teachers',
    eyebrow: '请老师',
    mood: '按问题选领域老师',
    accent: 'teal',
    overlay: 'deep-ink',
    artId: 'surface-teachers',
    alt: '请老师：顾问桌意象',
  },
  profile: {
    key: 'profile',
    route: '/profile',
    eyebrow: '我的档案',
    mood: '完整度与参数底座',
    accent: 'ink',
    overlay: 'light-paper',
    artId: 'surface-profile',
    alt: '我的档案：个人参数面板',
  },
  hehun: {
    key: 'hehun',
    route: '/hehun',
    eyebrow: '合婚双盘',
    mood: '双盘对照，结构匹配',
    accent: 'rose',
    overlay: 'light-paper',
    artId: 'surface-hehun',
    alt: '合婚：双盘对齐意象',
  },
  almanac: {
    key: 'almanac',
    route: '/almanac',
    eyebrow: '今日黄历',
    mood: '日节律与宜忌日历',
    accent: 'amber',
    overlay: 'light-paper',
    artId: 'surface-almanac',
    alt: '黄历：日节律意象',
  },
  naming: {
    key: 'naming',
    route: '/tools/naming',
    eyebrow: '起名工坊',
    mood: '用神与笔画结构',
    accent: 'indigo',
    overlay: 'light-paper',
    artId: 'surface-naming',
    alt: '起名工坊：字形结构意象',
  },
  fengshui: {
    key: 'fengshui',
    route: '/tools/fengshui-space',
    eyebrow: '空间场',
    mood: '环境层结构化分析',
    accent: 'slate',
    overlay: 'light-paper',
    artId: 'surface-fengshui',
    alt: '空间场：户型与方位意象',
  },
  predictions: {
    key: 'predictions',
    route: '/predictions',
    eyebrow: '预测回访',
    mood: '窗口与现实对照',
    accent: 'violet',
    overlay: 'deep-ink',
    artId: 'surface-predictions',
    alt: '预测回访：验证时间线',
  },
  events: {
    key: 'events',
    route: '/events',
    eyebrow: '事件日历',
    mood: '记录节点，验证判断',
    accent: 'teal',
    overlay: 'light-paper',
    artId: 'surface-events',
    alt: '事件日历：验证闭环时间线',
  },
  membership: {
    key: 'membership',
    route: '/membership',
    eyebrow: '会员',
    mood: '研究深度与提醒，不是命运保证',
    accent: 'amber',
    overlay: 'light-paper',
    artId: 'surface-membership',
    alt: '会员：研究访问意象',
  },
  cases: {
    key: 'cases',
    route: '/cases',
    eyebrow: '案例库',
    mood: '结构落到现实的路径',
    accent: 'rose',
    overlay: 'light-paper',
    artId: 'surface-cases',
    alt: '案例库：证据面板意象',
  },
};

export function getImmersionSurface(key: ImmersionSurfaceKey): ImmersionSurface {
  return IMMERSION_SURFACES[key];
}

/** Prefer webp when available (same basename). */
export function immersionArtSrc(artId: string, preferWebp = true): string {
  if (preferWebp) return `${BASE}/${artId}.webp`;
  return `${BASE}/${artId}.jpg`;
}

export function immersionArtJpg(artId: string): string {
  return `${BASE}/${artId}.jpg`;
}

export const LOGO_ICON_SRC = `${BASE}/logo-icon.webp`;
export const LOGO_ICON_JPG = `${BASE}/logo-icon.jpg`;
export const LOGO_WORDMARK_SRC = `${BASE}/logo-wordmark.webp`;

export const ACCENT_CHIP_CLASS: Record<ImmersionAccent, string> = {
  teal: 'text-[color:var(--brand-strong,#0b5f55)]',
  ink: 'text-[color:var(--ink-3)]',
  amber: 'text-[#b45309]',
  rose: 'text-[#be123c]',
  violet: 'text-[#6d28d9]',
  slate: 'text-[#475569]',
  indigo: 'text-[#4338ca]',
};

export const ACCENT_RING_CLASS: Record<ImmersionAccent, string> = {
  teal: 'ring-[color:var(--brand-strong,#0b5f55)]/20',
  ink: 'ring-[color:var(--ink-1)]/10',
  amber: 'ring-amber-500/20',
  rose: 'ring-rose-500/20',
  violet: 'ring-violet-500/20',
  slate: 'ring-slate-400/25',
  indigo: 'ring-indigo-500/20',
};
