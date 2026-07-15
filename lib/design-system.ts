/**
 * LK Design System v1 — 设计令牌与布局约定（TypeScript 侧引用）
 *
 * 视觉原则：
 * 1. 单主任务 — 每屏一个核心动作
 * 2. 渐进披露 — 高级选项默认折叠
 * 3. 结构阅读 — 蓝顶条 Hero + 白卡片内容区
 * 4. 响应式 Rail — mobile 单栏 / lg 双栏 / xl 三栏
 */

export const LK_LAYOUT = {
  frameMax: '80rem',
  contentMax: '47.5rem',
  railLeft: '10rem',
  railRight: '16.25rem',
} as const;

export const LK_TYPE = {
  display: '1.75rem',
  title: '1.375rem',
  subtitle: '1.125rem',
  body: '0.8125rem',
  caption: '0.75rem',
} as const;

export const LK_BREAKPOINTS = {
  railRight: 'lg',
  railLeft: 'xl',
} as const;

/** 布局基元：components/layout/ */
export const LK_LAYOUT_PRIMITIVES = [
  'AppPage',
  'FocusHero',
  'SectionHeader',
  'PortalLayout',
  'StatGrid',
  'StatusTile',
  'AlertBanner',
  'ReportViewer',
] as const;

/** 页面侧栏：components/analyze/portal-rail, profile/profile-rail, report/report-rail */
export const LK_RAIL_COMPONENTS = [
  'PortalRailLeft',
  'PortalRailRight',
  'ProfileRailRight',
  'ReportRailRight',
] as const;

/** 已接入 AppPage 的门户路由（本地） */
export const LK_PORTAL_ROUTES = [
  '/',
  '/analyze',
  '/membership',
  '/learn',
  '/profile',
  '/profile/settings',
  '/updates',
  '/updates/messages',
  '/result/[id]',
  '/tools',
  '/tools/[slug]',
  '/chat',
  '/events',
  '/docs',
  '/docs/[slug]',
  '/login',
  '/community',
  '/community/search',
  '/world-yi',
  '/knowledge',
  '/knowledge/[slug]',
  '/cases',
  '/cases/[slug]',
  '/history',
  '/community/category/[category]',
  '/tools/category/[category]',
  '/insights',
  '/insights/[type]/[slug]',
  '/reports',
  '/visual-assets/world-yi-six-step-method',
] as const;