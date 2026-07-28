/**
 * 人生数据底座 — 多源参数统一模型
 *
 * 固定数值 / 重要参数分层：
 * 1. birth     生辰八字（引擎硬输入）
 * 2. astro     星座星盘（西占 + 生肖，可由生日推导 + 自填上升/月亮）
 * 3. body      面相 / 手相（工具观测）
 * 4. life_qa   生活问答补全（职业/目标/关系/财/健康/居住）
 * 5. interact  互动校准（事件、对话渐进、文档）
 * 6. tools     工具信号（起名、空间场、合婚、十维度…）
 */

export type FoundationLayerId =
  | 'birth'
  | 'astro'
  | 'body'
  | 'life_qa'
  | 'interact'
  | 'tools';

export type FoundationItemStatus = 'done' | 'partial' | 'missing' | 'optional';

export type FoundationItem = {
  id: string;
  layerId: FoundationLayerId;
  label: string;
  description: string;
  status: FoundationItemStatus;
  /** 0–100 for this item */
  score: number;
  /** primary CTA */
  href: string;
  ctaLabel: string;
  /** secondary info line */
  valueSummary?: string | null;
  weight: number;
  fixed?: boolean;
};

export type FoundationLayer = {
  id: FoundationLayerId;
  title: string;
  subtitle: string;
  weight: number;
  score: number;
  status: FoundationItemStatus;
  items: FoundationItem[];
  /** recommended next action for this layer */
  nextHref?: string | null;
  nextLabel?: string | null;
};

export type FoundationNextStep = {
  priority: number;
  layerId: FoundationLayerId;
  title: string;
  reason: string;
  href: string;
  ctaLabel: string;
  itemId: string;
};

export type FoundationAstroSnapshot = {
  sunSign: string | null;
  sunSignEn: string | null;
  chineseZodiac: string | null;
  chineseZodiacYear: number | null;
  moonSign: string | null;
  risingSign: string | null;
  element: string | null;
  modality: string | null;
  source: 'computed' | 'supplement' | 'mixed' | 'none';
};

export type FoundationToolSignal = {
  toolSlug: string;
  title: string;
  lastAt: string | null;
  sessionId: string | null;
  href: string;
  count: number;
};

export type LifeFoundationSnapshot = {
  version: 1;
  overall: number;
  grade: 'empty' | 'starter' | 'building' | 'solid' | 'rich';
  gradeLabel: string;
  fortuneId: string | null;
  fortuneName: string | null;
  hasReport: boolean;
  layers: FoundationLayer[];
  nextSteps: FoundationNextStep[];
  astro: FoundationAstroSnapshot;
  toolSignals: FoundationToolSignal[];
  stats: {
    filledItems: number;
    totalCoreItems: number;
    eventCount: number;
    toolRunCount: number;
    documentCount: number;
    chatProgressiveCount: number;
  };
  updatedAt: string;
};
