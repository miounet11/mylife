import { DIMENSIONS, getDimension, listDimensionsByPriority } from '@/lib/dimensions/config';
import type { DimensionSlug } from '@/lib/dimensions/types';
import type { ToolCategoryKey } from '@/lib/portal-tools';

export type CrosslinkItem = {
  href: string;
  title: string;
  description: string;
  cta?: string;
  badge?: string;
  icon?: string;
};

export type ContentCrosslinks = {
  dimensions: CrosslinkItem[];
  tools: CrosslinkItem[];
  content: CrosslinkItem[];
  analyzeHref: string;
  primaryLabel: string;
};

type IntentKey = 'career' | 'wealth' | 'relationship' | 'yearly';

const INTENT_DIMENSIONS: Record<IntentKey, DimensionSlug[]> = {
  career: ['career-industry', 'study-career', 'partnership', 'fortune-rhythm'],
  wealth: ['investment', 'fortune-rhythm', 'career-industry'],
  relationship: ['marriage', 'partnership', 'living-environment'],
  yearly: ['fortune-rhythm', 'timing-selection', 'health', 'investment'],
};

const TRACK_INTENT: Record<string, IntentKey> = {
  intro: 'yearly',
  career: 'career',
  wealth: 'wealth',
  relationship: 'relationship',
  health: 'yearly',
  timing: 'yearly',
  family: 'relationship',
  migration: 'yearly',
  naming: 'yearly',
};

const KEYWORD_RULES: Array<{ re: RegExp; dimensions: DimensionSlug[]; tools: string[]; intent: IntentKey }> = [
  {
    re: /事业|职业|行业|跳槽|岗位|升职|工作/,
    dimensions: ['career-industry', 'study-career', 'partnership'],
    tools: ['/tools/timing-yearly-window'],
    intent: 'career',
  },
  {
    re: /财|投资|理财|财富|金钱|资产/,
    dimensions: ['investment', 'fortune-rhythm'],
    tools: ['/tools/timing-yearly-window'],
    intent: 'wealth',
  },
  {
    re: /婚|感情|恋爱|配偶|桃花|关系/,
    dimensions: ['marriage', 'partnership'],
    tools: ['/tools/daily-sign'],
    intent: 'relationship',
  },
  {
    re: /健康|身体|养生|调养/,
    dimensions: ['health', 'fortune-rhythm'],
    tools: ['/tools/daily-sign'],
    intent: 'yearly',
  },
  {
    re: /流年|大运|节奏|运势|转折|窗口/,
    dimensions: ['fortune-rhythm', 'timing-selection'],
    tools: ['/tools/timing-yearly-window'],
    intent: 'yearly',
  },
  {
    re: /起名|改名|姓名|字义/,
    dimensions: ['naming'],
    tools: ['/tools/naming'],
    intent: 'yearly',
  },
  {
    re: /搬家|迁移|方位|居家|环境|城市/,
    dimensions: ['living-environment', 'timing-selection'],
    tools: [],
    intent: 'yearly',
  },
  {
    re: /择时|择日|签约|出行/,
    dimensions: ['timing-selection', 'fortune-rhythm'],
    tools: ['/tools/timing-yearly-window'],
    intent: 'yearly',
  },
  {
    re: /学业|考试|升学|备考/,
    dimensions: ['study-career', 'timing-selection'],
    tools: [],
    intent: 'career',
  },
];

const TOOL_META: Record<string, { title: string; description: string }> = {
  '/tools/timing-yearly-window': {
    title: '2026 流年 / 年度主窗口',
    description: '快速看今年事业、关系、财富主窗口。',
  },
  '/tools/daily-sign': {
    title: '今日一签',
    description: '轻量日常节律提示，适合每日复访。',
  },
  '/tools/application-palmistry-reading': {
    title: '手相结构观察',
    description: '上传手掌照片，获得结构层辅助观察。',
  },
};

const CONTENT_BY_DIMENSION: Partial<Record<DimensionSlug, CrosslinkItem[]>> = {
  'career-industry': [
    {
      href: '/knowledge/world-yi-career-stage-logic',
      title: '事业阶段与角色匹配',
      description: '理解事业线的结构判断框架。',
      cta: '阅读',
    },
  ],
  investment: [
    {
      href: '/knowledge/world-yi-wealth-rhythm',
      title: '世界易财富观',
      description: '财富进入与留存的节奏逻辑。',
      cta: '阅读',
    },
  ],
  marriage: [
    {
      href: '/cases/world-yi-case-family-duty',
      title: '家庭排序案例',
      description: '关系冲突中的结构排序。',
      cta: '阅读案例',
    },
  ],
  health: [
    {
      href: '/knowledge/world-yi-health-boundary',
      title: '健康边界',
      description: '命理观察与医疗判断的边界。',
      cta: '阅读',
    },
  ],
  'fortune-rhythm': [
    {
      href: '/docs/read-first-report',
      title: '报告读法',
      description: '结论 → 动作 → 验证 的阅读顺序。',
      cta: '阅读',
    },
  ],
  naming: [
    {
      href: '/knowledge/world-yi-naming-system',
      title: '世界易起名观',
      description: '姓名作为环境层补充。',
      cta: '阅读',
    },
  ],
  'timing-selection': [
    {
      href: '/knowledge/world-yi-timing-selection',
      title: '世界易择时观',
      description: '择时服务于动作顺序。',
      cta: '阅读',
    },
  ],
  'living-environment': [
    {
      href: '/knowledge/world-yi-migration-stage-logic',
      title: '世界易迁移观',
      description: '迁移是重匹配，不是换地图。',
      cta: '阅读',
    },
  ],
};

function uniqByHref(items: CrosslinkItem[]): CrosslinkItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function dimensionToItem(slug: DimensionSlug, reason?: string): CrosslinkItem | null {
  const def = getDimension(slug);
  if (!def) return null;
  return {
    href: `/dimensions/${def.slug}?source=content_crosslink`,
    title: def.title,
    description: reason || def.question,
    cta: '开始研判',
    badge: def.priority === 'p0' ? '推荐' : def.priority === 'p1' ? '可用' : '实验',
    icon: def.icon,
  };
}

function toolToItem(href: string): CrosslinkItem | null {
  const meta = TOOL_META[href];
  if (!meta) return null;
  return {
    href: `${href}${href.includes('?') ? '&' : '?'}source=content_crosslink`,
    title: meta.title,
    description: meta.description,
    cta: '免费测试',
    badge: '工具',
  };
}

export function resolveIntentFromText(text: string, trackKey?: string | null): IntentKey {
  if (trackKey && TRACK_INTENT[trackKey]) return TRACK_INTENT[trackKey];
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(text)) return rule.intent;
  }
  return 'yearly';
}

export function resolveContentCrosslinks(input: {
  slug?: string;
  title?: string;
  summary?: string;
  trackKey?: string | null;
  source?: string;
}): ContentCrosslinks {
  const blob = [input.title, input.summary, input.trackKey, input.slug].filter(Boolean).join(' ');
  const intent = resolveIntentFromText(blob, input.trackKey);

  const dimensionSlugs: DimensionSlug[] = [...(INTENT_DIMENSIONS[intent] || [])];
  const toolHrefs: string[] = [];

  for (const rule of KEYWORD_RULES) {
    if (!rule.re.test(blob)) continue;
    for (const slug of rule.dimensions) {
      if (!dimensionSlugs.includes(slug)) dimensionSlugs.push(slug);
    }
    for (const href of rule.tools) {
      if (!toolHrefs.includes(href)) toolHrefs.push(href);
    }
  }

  // Always surface at least one P0 when empty
  if (!dimensionSlugs.length) {
    dimensionSlugs.push(...listDimensionsByPriority('p0').map((item) => item.slug));
  }

  if (!toolHrefs.length) {
    toolHrefs.push('/tools/timing-yearly-window', '/tools/daily-sign');
  }

  const dimensions = uniqByHref(
    dimensionSlugs
      .slice(0, 4)
      .map((slug) => dimensionToItem(slug, `与「${input.title || '本文'}」主题相关`))
      .filter((item): item is CrosslinkItem => Boolean(item)),
  );

  const tools = uniqByHref(
    toolHrefs
      .slice(0, 3)
      .map((href) => toolToItem(href))
      .filter((item): item is CrosslinkItem => Boolean(item)),
  );

  const content = uniqByHref(
    dimensionSlugs
      .flatMap((slug) => CONTENT_BY_DIMENSION[slug] || [])
      .filter((item) => !input.slug || !item.href.includes(input.slug))
      .slice(0, 3),
  );

  return {
    dimensions,
    tools,
    content,
    analyzeHref: `/analyze?intent=${intent}&source=${encodeURIComponent(
      input.source || (input.slug ? `content_${input.slug}` : 'content_crosslink'),
    )}`,
    primaryLabel:
      intent === 'career'
        ? '生成事业结构报告'
        : intent === 'wealth'
          ? '生成财富结构报告'
          : intent === 'relationship'
            ? '生成关系结构报告'
            : '生成完整判断报告',
  };
}

/** Dimension → content / tools outbound links for dimension detail pages. */
export function resolveDimensionOutbound(slug: DimensionSlug): ContentCrosslinks {
  const def = getDimension(slug);
  const intent = def?.relatedIntent || 'yearly';
  const toolsBySlug: Partial<Record<DimensionSlug, string[]>> = {
    'fortune-rhythm': ['/tools/timing-yearly-window', '/tools/daily-sign'],
    'career-industry': ['/tools/timing-yearly-window'],
    investment: ['/tools/timing-yearly-window'],
    marriage: ['/tools/daily-sign'],
    health: ['/tools/daily-sign'],
    'timing-selection': ['/tools/timing-yearly-window'],
    naming: [],
  };

  const dimensions = listDimensionsByPriority('p0')
    .filter((item) => item.slug !== slug)
    .slice(0, 2)
    .map((item) => dimensionToItem(item.slug, '继续深耕推荐维度'))
    .filter((item): item is CrosslinkItem => Boolean(item));

  // add one related sibling from same intent
  const siblings = (INTENT_DIMENSIONS[intent] || [])
    .filter((item) => item !== slug)
    .slice(0, 2)
    .map((item) => dimensionToItem(item, '同主题相邻维度'))
    .filter((item): item is CrosslinkItem => Boolean(item));

  const tools = (toolsBySlug[slug] || ['/tools/timing-yearly-window'])
    .map((href) => toolToItem(href))
    .filter((item): item is CrosslinkItem => Boolean(item));

  return {
    dimensions: uniqByHref([...siblings, ...dimensions]).slice(0, 3),
    tools,
    content: CONTENT_BY_DIMENSION[slug] || [],
    analyzeHref: `/analyze?intent=${intent}&source=dimension_${slug}`,
    primaryLabel: '生成完整结构报告',
  };
}

export function listFeaturedDimensions(limit = 6): CrosslinkItem[] {
  return DIMENSIONS.filter((item) => item.maturity === 'mvp')
    .sort((a, b) => {
      const order = { p0: 0, p1: 1, p2: 2 } as const;
      return order[a.priority] - order[b.priority] || a.order - b.order;
    })
    .slice(0, limit)
    .map((item) => ({
      href: `/dimensions/${item.slug}`,
      title: item.title,
      description: item.question,
      cta: '开始研判',
      badge: item.priority === 'p0' ? '推荐' : item.priority === 'p1' ? '可用' : '实验',
      icon: item.icon,
    }));
}

export function toolCategoryToIntent(category: ToolCategoryKey): IntentKey {
  if (category === 'career') return 'career';
  if (category === 'wealth') return 'wealth';
  if (category === 'relationship' || category === 'family') return 'relationship';
  return 'yearly';
}
