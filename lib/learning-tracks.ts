export type LearningTrackKey =
  | 'intro'
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'family'
  | 'health'
  | 'migration'
  | 'application'
  | 'classics';

export type LearningStepKind = 'knowledge' | 'case' | 'tool' | 'insight' | 'action' | 'hub';

export interface LearningTrackStep {
  key: string;
  kind: LearningStepKind;
  label: string;
  href: string;
  readMinutes?: number;
  required?: boolean;
  slug?: string;
}

export interface LearningTrack {
  key: LearningTrackKey;
  title: string;
  subtitle: string;
  description: string;
  icon: 'compass' | 'briefcase' | 'coins' | 'heart' | 'home' | 'activity' | 'plane' | 'sparkles' | 'library';
  targetCount: number;
  steps: LearningTrackStep[];
  hubHref?: string;
  relatedReportCategories?: string[];
}

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    key: 'intro',
    title: '入门轨',
    subtitle: '基础概念与读盘顺序',
    description: '日主、用神、大运流年、报告读法与世界易基础，适合第一次阅读完整报告的用户。',
    icon: 'compass',
    targetCount: 10,
    hubHref: '/world-yi',
    steps: [
      {
        key: 'day-master',
        kind: 'knowledge',
        label: '日主是什么',
        href: '/knowledge/kb-day-master-plain',
        readMinutes: 6,
        required: true,
        slug: 'kb-day-master-plain',
      },
      {
        key: 'yong-shen',
        kind: 'knowledge',
        label: '用神与喜神',
        href: '/knowledge/kb-yong-shen-guide',
        readMinutes: 8,
        required: true,
        slug: 'kb-yong-shen-guide',
      },
      {
        key: 'ji-shen',
        kind: 'knowledge',
        label: '忌神是什么',
        href: '/knowledge/kb-ji-shen-boundary',
        readMinutes: 6,
        slug: 'kb-ji-shen-boundary',
      },
      {
        key: 'dayun-liunian',
        kind: 'knowledge',
        label: '大运与流年',
        href: '/knowledge/kb-dayun-liunian',
        readMinutes: 7,
        slug: 'kb-dayun-liunian',
      },
      {
        key: 'kline-read',
        kind: 'knowledge',
        label: '人生K线怎么看',
        href: '/knowledge/kb-life-kline-read',
        readMinutes: 8,
        slug: 'kb-life-kline-read',
      },
      {
        key: 'solar-time',
        kind: 'knowledge',
        label: '真太阳时与命盘',
        href: '/knowledge/true-solar-time-guide',
        readMinutes: 6,
        required: true,
        slug: 'true-solar-time-guide',
      },
      {
        key: 'read-report',
        kind: 'knowledge',
        label: '如何阅读分析报告',
        href: '/knowledge/how-to-read-bazi-report',
        readMinutes: 8,
        required: true,
        slug: 'how-to-read-bazi-report',
      },
      {
        key: 'methodology',
        kind: 'knowledge',
        label: '世界易方法论',
        href: '/knowledge/world-yi-methodology',
        readMinutes: 10,
        required: true,
        slug: 'world-yi-methodology',
      },
      {
        key: 'six-step',
        kind: 'hub',
        label: '六步判断法（图解）',
        href: '/visual-assets/world-yi-six-step-method',
        readMinutes: 5,
        required: true,
      },
      {
        key: 'first-analyze',
        kind: 'action',
        label: '生成判断报告',
        href: '/analyze',
        readMinutes: 5,
        required: true,
      },
    ],
  },
  {
    key: 'career',
    title: '事业轨',
    subtitle: '角色匹配 · 阶段重排',
    description: '从事业观到阶段判断，再用案例和工具验证职业推进节奏。',
    icon: 'briefcase',
    targetCount: 10,
    hubHref: '/world-yi/domains/career',
    relatedReportCategories: ['career', 'timing'],
    steps: [
      { key: 'career-view', kind: 'knowledge', label: '世界易事业观', href: '/knowledge/world-yi-career-role-fit', readMinutes: 8, required: true, slug: 'world-yi-career-role-fit' },
      { key: 'career-reset', kind: 'knowledge', label: '事业重排法：先判断阶段再换赛道', href: '/knowledge/world-yi-career-stage-reset', readMinutes: 7, slug: 'world-yi-career-stage-reset' },
      { key: 'career-case', kind: 'case', label: '案例：收入上来就想扩张', href: '/cases/world-yi-case-wealth-expansion', readMinutes: 5, slug: 'world-yi-case-wealth-expansion' },
      { key: 'career-tool', kind: 'tool', label: '事业专项工具', href: '/tools/category/career', readMinutes: 10 },
      { key: 'career-validate', kind: 'action', label: '用事件中心验证职业判断', href: '/events', readMinutes: 5 },
    ],
  },
  {
    key: 'wealth',
    title: '财富轨',
    subtitle: '节奏 · 守财 · 扩张',
    description: '理解财富进入方式、保留能力与扩张节奏，避免把短期波动当长期结构。',
    icon: 'coins',
    targetCount: 10,
    hubHref: '/knowledge/world-yi-wealth-rhythm',
    relatedReportCategories: ['wealth', 'timing'],
    steps: [
      { key: 'wealth-rhythm', kind: 'knowledge', label: '世界易财富观', href: '/knowledge/world-yi-wealth-rhythm', readMinutes: 8, required: true, slug: 'world-yi-wealth-rhythm' },
      { key: 'wealth-retention', kind: 'knowledge', label: '守财观：财富留存系统', href: '/knowledge/world-yi-wealth-retention-discipline', readMinutes: 7, slug: 'world-yi-wealth-retention-discipline' },
      { key: 'wealth-case', kind: 'case', label: '案例：扩张节奏与阶段', href: '/cases/world-yi-case-wealth-expansion', readMinutes: 5, slug: 'world-yi-case-wealth-expansion' },
      { key: 'wealth-tool', kind: 'tool', label: '财富专项工具', href: '/tools/category/wealth', readMinutes: 10 },
      { key: 'wealth-validate', kind: 'action', label: '对照流年验证财务节点', href: '/events', readMinutes: 5 },
    ],
  },
  {
    key: 'relationship',
    title: '关系轨',
    subtitle: '节奏 · 边界 · 修复',
    description: '关系问题先看排序与节奏，再看合不合；用案例理解冲突与修复路径。',
    icon: 'heart',
    targetCount: 10,
    hubHref: '/knowledge/world-yi-relationship-order',
    relatedReportCategories: ['relationship', 'family'],
    steps: [
      { key: 'relation-order', kind: 'knowledge', label: '世界易关系观', href: '/knowledge/world-yi-relationship-order', readMinutes: 8, required: true, slug: 'world-yi-relationship-order' },
      { key: 'relation-pacing', kind: 'knowledge', label: '关系节奏论', href: '/knowledge/world-yi-relationship-pacing-order', readMinutes: 7, slug: 'world-yi-relationship-pacing-order' },
      { key: 'relation-repair', kind: 'knowledge', label: '关系修复观', href: '/knowledge/world-yi-relationship-conflict-repair', readMinutes: 7, slug: 'world-yi-relationship-conflict-repair' },
      { key: 'relation-case', kind: 'case', label: '案例：家庭排序先崩了', href: '/cases/world-yi-case-family-duty', readMinutes: 5, slug: 'world-yi-case-family-duty' },
      { key: 'relation-tool', kind: 'tool', label: '关系专项工具', href: '/tools/category/relationship', readMinutes: 10 },
    ],
  },
  {
    key: 'family',
    title: '家庭轨',
    subtitle: '代际 · 分工 · 家宅',
    description: '现代家庭难点在代际责任、亲密边界与排序能力，家宅是长期环境层。',
    icon: 'home',
    targetCount: 10,
    hubHref: '/knowledge/world-yi-family-generational-order',
    steps: [
      { key: 'family-order', kind: 'knowledge', label: '世界易家庭观', href: '/knowledge/world-yi-family-generational-order', readMinutes: 8, required: true, slug: 'world-yi-family-generational-order' },
      { key: 'family-rebalance', kind: 'knowledge', label: '家庭重分工', href: '/knowledge/world-yi-family-role-rebalance', readMinutes: 7, slug: 'world-yi-family-role-rebalance' },
      { key: 'home-order', kind: 'knowledge', label: '世界易家宅观', href: '/knowledge/world-yi-home-order', readMinutes: 7, slug: 'world-yi-home-order' },
      { key: 'family-case', kind: 'case', label: '案例：夹在伴侣与父母之间', href: '/cases/world-yi-case-family-duty', readMinutes: 5, slug: 'world-yi-case-family-duty' },
      { key: 'family-tool', kind: 'tool', label: '家庭专项工具', href: '/tools/category/family', readMinutes: 10 },
    ],
  },
  {
    key: 'health',
    title: '健康轨',
    subtitle: '恢复 · 节奏 · 边界',
    description: '谈节奏、恢复与风险信号，强调系统层面观察，不替代医疗诊断。',
    icon: 'activity',
    targetCount: 8,
    hubHref: '/knowledge/world-yi-health-boundary',
    relatedReportCategories: ['health'],
    steps: [
      { key: 'health-boundary', kind: 'knowledge', label: '健康边界：不替代医疗', href: '/knowledge/world-yi-health-boundary', readMinutes: 6, required: true, slug: 'world-yi-health-boundary' },
      { key: 'health-recovery', kind: 'knowledge', label: '恢复观：系统恢复窗口', href: '/knowledge/world-yi-health-recovery-order', readMinutes: 7, slug: 'world-yi-health-recovery-order' },
      { key: 'health-tool', kind: 'tool', label: '健康专项工具', href: '/tools/category/health', readMinutes: 10 },
      { key: 'health-validate', kind: 'action', label: '记录身体信号与阶段对照', href: '/events', readMinutes: 5 },
    ],
  },
  {
    key: 'migration',
    title: '迁移轨',
    subtitle: '留回 · 身份 · 环境',
    description: '迁移不是换地图，而是重新匹配你与环境的成本结构；海外华人专题在此展开。',
    icon: 'plane',
    targetCount: 10,
    hubHref: '/knowledge/world-yi-migration-stage-logic',
    steps: [
      { key: 'migration-logic', kind: 'knowledge', label: '世界易迁移观', href: '/knowledge/world-yi-migration-stage-logic', readMinutes: 8, required: true, slug: 'world-yi-migration-stage-logic' },
      { key: 'migration-fit', kind: 'knowledge', label: '迁移匹配法', href: '/knowledge/world-yi-migration-environment-fit', readMinutes: 7, slug: 'world-yi-migration-environment-fit' },
      { key: 'overseas-map', kind: 'knowledge', label: '全球华人判断地图', href: '/knowledge/world-yi-global-chinese-decision-map', readMinutes: 9, slug: 'world-yi-global-chinese-decision-map' },
      { key: 'migration-case', kind: 'case', label: '案例：海归最难的是选阶段', href: '/cases/world-yi-case-return-or-stay', readMinutes: 5, slug: 'world-yi-case-return-or-stay' },
      { key: 'city-insight', kind: 'insight', label: '城市观察：温哥华', href: '/insights/city/world-yi-vancouver', readMinutes: 6, slug: 'world-yi-vancouver' },
      { key: 'migration-tool', kind: 'tool', label: '迁移专项工具', href: '/tools/category/migration', readMinutes: 10 },
    ],
  },
  {
    key: 'application',
    title: '应用轨',
    subtitle: '择时 · 起名 · 家宅',
    description: '把择时、起名、寻物、家宅写成可复用的生活判断，而非神秘感。',
    icon: 'sparkles',
    targetCount: 10,
    hubHref: '/world-yi/applications',
    steps: [
      { key: 'timing', kind: 'knowledge', label: '世界易择时观', href: '/knowledge/world-yi-timing-selection', readMinutes: 7, required: true, slug: 'world-yi-timing-selection' },
      { key: 'naming', kind: 'knowledge', label: '世界易起名观', href: '/knowledge/world-yi-naming-system', readMinutes: 7, slug: 'world-yi-naming-system' },
      { key: 'lost-found', kind: 'knowledge', label: '世界易寻物观', href: '/knowledge/world-yi-lost-and-found', readMinutes: 6, slug: 'world-yi-lost-and-found' },
      { key: 'relocation-case', kind: 'case', label: '案例：搬家后状态更差', href: '/cases/world-yi-case-house-relocation', readMinutes: 5, slug: 'world-yi-case-house-relocation' },
      { key: 'application-tool', kind: 'tool', label: '应用专项工具', href: '/tools/category/application', readMinutes: 10 },
    ],
  },
  {
    key: 'classics',
    title: '典籍轨',
    subtitle: '64卦 · 节气 · 紫微',
    description: '传统命理百科按世界易结构读法接入，从词典走向判断框架。',
    icon: 'library',
    targetCount: 20,
    hubHref: '/knowledge/topics',
    steps: [
      { key: 'decision-language', kind: 'knowledge', label: '易学语言的现代翻译', href: '/knowledge/world-yi-decision-language', readMinutes: 8, required: true, slug: 'world-yi-decision-language' },
      { key: 'five-foundations', kind: 'knowledge', label: '五大学理基础', href: '/knowledge/world-yi-five-foundations', readMinutes: 10, slug: 'world-yi-five-foundations' },
      { key: 'topics-hub', kind: 'hub', label: '百科专题地图（64卦/节气/紫微）', href: '/knowledge', readMinutes: 15 },
      { key: 'classics-tool', kind: 'tool', label: '工具中心：按术数深入', href: '/tools', readMinutes: 10 },
    ],
  },
];

const TRACK_BY_KEY = new Map(LEARNING_TRACKS.map((track) => [track.key, track]));

export function getLearningTrack(key: LearningTrackKey): LearningTrack {
  return TRACK_BY_KEY.get(key) || LEARNING_TRACKS[0];
}

export function getAllLearningTracks(): LearningTrack[] {
  return LEARNING_TRACKS;
}

const CATEGORY_TO_TRACK: Record<string, LearningTrackKey> = {
  career: 'career',
  wealth: 'wealth',
  relationship: 'relationship',
  health: 'health',
  family: 'family',
  migration: 'migration',
  timing: 'application',
  application: 'application',
};

export function resolveLearningTrackFromCategory(category?: string | null): LearningTrackKey {
  if (!category) return 'intro';
  return CATEGORY_TO_TRACK[category] || 'intro';
}

export function resolveLearningTrackFromThemes(themes?: string[]): LearningTrackKey {
  if (!themes?.length) return 'intro';
  const priority: LearningTrackKey[] = ['career', 'wealth', 'relationship', 'family', 'health', 'migration', 'application'];
  for (const key of priority) {
    if (themes.includes(key)) return key;
  }
  if (themes.includes('timing')) return 'application';
  return 'intro';
}

export function resolveTrackFromReportConclusions(
  conclusions: Array<{ category: string; trackKey?: LearningTrackKey }>,
): LearningTrackKey {
  if (!conclusions.length) return 'intro';

  const scores = new Map<LearningTrackKey, number>();
  for (const conclusion of conclusions) {
    const direct = conclusion.trackKey;
    if (direct) {
      scores.set(direct, (scores.get(direct) || 0) + 2);
    }
    for (const track of LEARNING_TRACKS) {
      if (track.relatedReportCategories?.includes(conclusion.category)) {
        scores.set(track.key, (scores.get(track.key) || 0) + 1);
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || resolveLearningTrackFromCategory(conclusions[0]?.category);
}