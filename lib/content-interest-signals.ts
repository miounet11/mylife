// @ts-nocheck
import type { ManagedContentEntry, ManagedContentType } from '@/lib/content-store';
import type { EntityInsightType } from '@/lib/content';

export type StrategicCluster = {
  key: string;
  title: string;
  angle: string;
  keywords: string[];
  primaryType: ManagedContentType;
  subtype?: EntityInsightType;
  baseDemand: number;
  topic: string;
  audience: string;
};

export const STRATEGIC_CLUSTERS: StrategicCluster[] = [
  {
    key: 'solar-time',
    title: '真太阳时与时间精度',
    angle: '解释为什么时间精度直接影响排盘结果和用户信任',
    keywords: ['真太阳时', '排盘', '时柱', '节气', '出生时间'],
    primaryType: 'knowledge',
    baseDemand: 10,
    topic: '真太阳时为什么会影响排盘准确度',
    audience: '首次接触命理分析的新用户',
  },
  {
    key: 'report-reading',
    title: '报告解读与结果阅读',
    angle: '帮助普通用户快速读懂结构、趋势和建议',
    keywords: ['报告', '结果页', '怎么看', '命盘解读', '五行'],
    primaryType: 'knowledge',
    baseDemand: 9,
    topic: '普通用户如何快速读懂一份命理报告',
    audience: '已经看过结果页但理解不够深的用户',
  },
  {
    key: 'career-timing',
    title: '职业窗口与换岗节奏',
    angle: '聚焦换工作、跳槽、升职和职业节奏判断',
    keywords: ['事业', '职业', '跳槽', '换工作', '升职', '时机'],
    primaryType: 'case',
    baseDemand: 10,
    topic: '2026 年换工作与职业推进该怎么看时机窗口',
    audience: '25-40 岁职场用户',
  },
  {
    key: 'relationship-timing',
    title: '关系推进与婚恋节奏',
    angle: '围绕关系推进、风险窗口和互动节奏建立内容层',
    keywords: ['婚恋', '关系', '感情', '结婚', '复合', '时间窗口'],
    primaryType: 'case',
    baseDemand: 9,
    topic: '关系推进不是看会不会，而是看什么时候更稳',
    audience: '关注婚恋关系和互动风险的用户',
  },
  {
    key: 'wealth-risk',
    title: '财富选择与风险控制',
    angle: '从投资、创业、现金流和风险控制切入',
    keywords: ['财富', '投资', '创业', '破财', '现金流', '风险'],
    primaryType: 'knowledge',
    baseDemand: 8,
    topic: '命理报告在财富决策里更适合解决什么问题',
    audience: '关注财富节奏和风险控制的用户',
  },
  {
    key: 'city-migration',
    title: '城市迁移与地理位置',
    angle: '连接城市、地理位置、迁移和个人窗口',
    keywords: ['城市', '迁移', '换城市', '定居', '地理位置', '风水'],
    primaryType: 'insight',
    subtype: 'city',
    baseDemand: 8,
    topic: '城市迁移和地理位置变化会怎样影响个人节奏判断',
    audience: '考虑换城市、定居和发展路径的用户',
  },
  {
    key: 'industry-cycle',
    title: '行业周期与产业节奏',
    angle: '把行业运、产业运和个人职业选择连起来',
    keywords: ['行业', '产业', '行业运', '职业选择', '赛道', '周期'],
    primaryType: 'insight',
    subtype: 'industry',
    baseDemand: 9,
    topic: '行业周期变化时，个人职业决策应该怎样看节奏',
    audience: '关注赛道切换和行业窗口的用户',
  },
  {
    key: 'gaokao-study',
    title: '升学高考与教育选择',
    angle: '面向升学场景，强调时间窗口、方向判断和焦虑管理',
    keywords: ['高考', '升学', '专业选择', '教育', '考试', '升学规划'],
    primaryType: 'case',
    baseDemand: 8,
    topic: '升学焦虑里真正需要判断的是方向还是时机',
    audience: '学生家庭和升学规划用户',
  },
  {
    key: 'health-balance',
    title: '健康压力与身心平衡',
    angle: '用成熟表达方式解释健康节奏、压力和复原窗口',
    keywords: ['健康', '压力', '焦虑', '作息', '身体', '恢复'],
    primaryType: 'knowledge',
    baseDemand: 7,
    topic: '命理报告如何帮助理解压力周期和恢复窗口',
    audience: '关注身心压力和生活平衡的用户',
  },
  {
    key: 'organization-rhythm',
    title: '组织变化与公司节奏',
    angle: '围绕组织、公司和团队变化建立洞察内容',
    keywords: ['公司', '组织', '团队', '裁员', '组织调整', '管理'],
    primaryType: 'insight',
    subtype: 'company',
    baseDemand: 7,
    topic: '组织变化频繁时，个人该怎样判断进退节奏',
    audience: '经历组织变化的职场用户',
  },
  {
    key: 'world-yi-core',
    title: '世界易核心方法论',
    angle: '用世界易总论、六步判断法与结构时位框架建立站点独特认知',
    keywords: ['世界易', '六步判断', '结构时位', '判断法', '方法论', '时位环境', '世界易总论'],
    primaryType: 'knowledge',
    baseDemand: 12,
    topic: '世界易六步判断法怎样把命理结构变成可执行判断',
    audience: '想理解我们差异化方法论的新用户',
  },
  {
    key: 'world-yi-domains',
    title: '世界易六域应用',
    angle: '把事业、财富、关系、家庭、健康、迁移六域判断落到可读内容',
    keywords: ['世界易', '事业观', '财富观', '关系观', '家庭观', '健康观', '迁移观', '六域'],
    primaryType: 'knowledge',
    baseDemand: 11,
    topic: '世界易六域如何判断一个人在现实中的进退节奏',
    audience: '已接触世界易、希望看到场景化表达的用户',
  },
  {
    key: 'bazi-fundamentals',
    title: '八字基础与命理普及',
    angle: '系统普及天干地支、十神、五行等基础概念，降低命理理解门槛',
    keywords: ['八字', '天干', '地支', '十神', '五行', '命盘', '四柱', '用神', '格局', '神煞'],
    primaryType: 'knowledge',
    baseDemand: 11,
    topic: '普通人应该怎样建立八字命理的基础阅读框架',
    audience: '第一次接触命理、需要系统入门的新用户',
  },
  {
    key: 'life-kline-guide',
    title: '人生K线与报告使用',
    angle: '教用户读懂K线、报告与趋势窗口，并自然导向测算入口',
    keywords: ['人生k线', 'k线', '运势曲线', '报告', '结果页', '测算', '趋势窗口', '分析报告'],
    primaryType: 'knowledge',
    baseDemand: 10,
    topic: '人生K线报告最适合帮助用户解决哪些判断问题',
    audience: '已浏览内容、准备第一次生成报告的用户',
  },
  {
    key: 'family-order',
    title: '家庭秩序与代际节奏',
    angle: '围绕家庭分工、代际关系与家宅秩序建立世界易内容层',
    keywords: ['家庭', '家宅', '代际', '父母', '亲子', '家庭分工', '家庭秩序'],
    primaryType: 'case',
    baseDemand: 8,
    topic: '家庭角色失衡时，怎样判断修复与重分工的时机',
    audience: '面临家庭责任拉扯的用户',
  },
];

export type InterestClusterPriority = {
  cluster: StrategicCluster;
  publishedCount: number;
  draftCount: number;
  sampleTitles: string[];
  coveredTypes: Set<ManagedContentType>;
  signal: number;
  demandScore: number;
  priorityScore: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function matchesKeywords(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

export function entryText(entry: ManagedContentEntry) {
  return normalizeText([
    entry.title,
    entry.excerpt,
    entry.category || '',
    entry.name || '',
    entry.tags.join(' '),
    entry.sections.flatMap((section) => [section.title, ...section.paragraphs]).join(' '),
  ].join(' '));
}

export function rowText(meta: Record<string, unknown>) {
  const tags = Array.isArray(meta.tags) ? meta.tags.join(' ') : '';
  return normalizeText([
    `${meta.title || ''}`,
    `${meta.category || ''}`,
    `${meta.name || ''}`,
    `${meta.slug || ''}`,
    `${meta.toolSlug || ''}`,
    `${meta.toolCategory || ''}`,
    `${meta.serviceKey || ''}`,
    `${meta.reportTheme || ''}`,
    `${meta.scenarioKey || ''}`,
    `${meta.eventType || ''}`,
    `${meta.source || ''}`,
    tags,
  ].join(' '));
}

export function getPublishedTypesForCluster(entries: ManagedContentEntry[], cluster: StrategicCluster) {
  const matchingEntries = entries.filter((entry) => matchesKeywords(entryText(entry), cluster.keywords));
  const publishedEntries = matchingEntries.filter((entry) => entry.status === 'published');
  const byType = new Set(publishedEntries.map((entry) => entry.contentType));

  return {
    publishedCount: publishedEntries.length,
    draftCount: matchingEntries.filter((entry) => entry.status === 'draft').length,
    sampleTitles: matchingEntries.slice(0, 3).map((entry) => entry.title),
    coveredTypes: byType,
  };
}

export function isBacklogPublishableEntry(entry: ManagedContentEntry) {
  if (!entry.title?.trim() || !entry.slug?.trim()) {
    return false;
  }

  const excerptLength = entry.excerpt?.trim()?.length || 0;
  const sections = entry.sections || [];
  const textLength = sections.reduce((sum, section) => {
    const title = section.title?.trim() || '';
    const paragraphs = (section.paragraphs || []).join('\n');
    return sum + title.length + paragraphs.length;
  }, 0);

  if (sections.length >= 2 && (textLength >= 250 || excerptLength >= 60)) {
    return true;
  }
  if (sections.length >= 1 && (textLength >= 500 || excerptLength >= 100)) {
    return true;
  }
  return textLength >= 800;
}

export function buildInterestClusterPriorities(params: {
  entries: ManagedContentEntry[];
  clusterSignalBuckets: Record<string, number>;
}): InterestClusterPriority[] {
  return STRATEGIC_CLUSTERS.map((cluster) => {
    const coverage = getPublishedTypesForCluster(params.entries, cluster);
    const signal = params.clusterSignalBuckets[cluster.key] || 0;
    const demandScore = cluster.baseDemand * 10 + signal * 6;
    const priorityScore = demandScore
      + Math.max(0, 3 - coverage.publishedCount) * 20
      + coverage.draftCount * 2
      - Math.max(0, coverage.publishedCount - 4) * 8;

    return {
      cluster,
      publishedCount: coverage.publishedCount,
      draftCount: coverage.draftCount,
      sampleTitles: coverage.sampleTitles,
      coveredTypes: coverage.coveredTypes,
      signal,
      demandScore,
      priorityScore,
    };
  }).sort((left, right) => right.priorityScore - left.priorityScore);
}

export function matchEntryClusters(entry: ManagedContentEntry) {
  const text = entryText(entry);
  return STRATEGIC_CLUSTERS.filter((cluster) => matchesKeywords(text, cluster.keywords));
}

export function hasSchedulerPublishBacklogPressure(
  draftReserveCount: number,
  draftReserveTarget: number,
  ratio = 2,
) {
  return draftReserveTarget > 0 && draftReserveCount > draftReserveTarget * ratio;
}