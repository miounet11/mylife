import { analyticsOperations } from '@/lib/database';
import { productSurfaceRoles, type ExperienceSurfaceKey } from '@/lib/product-experience';

export type ProductExperienceHealth = 'healthy' | 'warning' | 'critical' | 'neutral';

export interface ProductExperienceAnalyticsEventRow {
  event_name?: string | null;
  eventName?: string | null;
  page?: string | null;
  meta?: string | Record<string, unknown> | null;
  created_at?: string | null;
  createdAt?: string | null;
}

export interface ProductExperienceSurfaceAnalytics {
  surface: ExperienceSurfaceKey;
  label: string;
  successMetric: string;
  views: number;
  primaryActions: number;
  secondaryActions: number;
  nextStepActions: number;
  totalActions: number;
  conversionRate: number;
  health: ProductExperienceHealth;
  action: string;
  latestAt?: string | null;
}

export interface ProductExperienceAnalyticsSnapshot {
  days: number;
  generatedAt: string;
  rows: ProductExperienceSurfaceAnalytics[];
  totals: {
    surfaces: number;
    views: number;
    primaryActions: number;
    totalActions: number;
    healthy: number;
    warning: number;
    critical: number;
    neutral: number;
  };
}

type ProductExperiencePredicate = (event: NormalizedAnalyticsEvent) => boolean;

interface ProductExperienceSurfaceMetricConfig {
  surface: ExperienceSurfaceKey;
  views: ProductExperiencePredicate[];
  primaryActions: ProductExperiencePredicate[];
  secondaryActions?: ProductExperiencePredicate[];
  nextStepActions?: ProductExperiencePredicate[];
  healthyRate: number;
  warningRate: number;
  minimumViews?: number;
  warningAction: string;
  criticalAction: string;
}

interface NormalizedAnalyticsEvent {
  eventName: string;
  page: string;
  meta: Record<string, unknown>;
  createdAt?: string | null;
}

const DEFAULT_SAMPLE_FLOOR = 5;

const surfaceMetricConfigs: ProductExperienceSurfaceMetricConfig[] = [
  {
    surface: 'home',
    views: [isEvent('home_page_viewed', pageEquals('/'))],
    primaryActions: [
      isEvent('analyze_submitted', sourceIn(['home_direct', 'home', 'landing'])),
      isEvent('analyze_completed', sourceIn(['home_direct', 'home', 'landing'])),
      isEvent('report_generated', sourceIn(['home_direct', 'home', 'landing'])),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageEquals('/')),
      isEvent('tool_card_clicked', pageEquals('/')),
      isEvent('result_cta_clicked', pageEquals('/')),
    ],
    nextStepActions: [
      isEvent('analyze_page_viewed', sourceIn(['home_direct', 'home', 'landing'])),
      isEvent('knowledge_page_viewed', sourceIn(['home', 'landing'])),
    ],
    healthyRate: 22,
    warningRate: 8,
    minimumViews: 8,
    warningAction: '首页首屏已有动作，但测算承接仍偏弱。优先检查表单可见性、默认路径和恢复入口。',
    criticalAction: '首页访问没有有效进入测算。优先把出生信息表单、主按钮和第一份报告承诺继续前置。',
  },
  {
    surface: 'analyze',
    views: [isEvent('analyze_page_viewed', pageEquals('/analyze'))],
    primaryActions: [
      isEvent('analyze_submitted', and(pageEquals('/analyze'), not(sourceIn(['home_direct'])))),
      isEvent('analyze_completed', not(sourceIn(['home_direct']))),
      isEvent('report_generated', not(sourceIn(['home_direct']))),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageEquals('/analyze')),
      isEvent('result_cta_clicked', pageEquals('/analyze')),
    ],
    nextStepActions: [
      isEvent('report_viewed', sourceIn(['content', 'tool_detail_analyze_gate', 'direct'])),
    ],
    healthyRate: 35,
    warningRate: 15,
    warningAction: '录入页访问到提交仍有损耗。优先检查出生时间、地点确认和真太阳时说明是否阻塞。',
    criticalAction: '录入页没有形成稳定提交。优先压缩说明、减少非必要选择，并检查分析接口中断。',
  },
  {
    surface: 'result',
    views: [isEvent('report_viewed', resultPage())],
    primaryActions: [
      isEvent('result_cta_clicked', resultPage()),
      isEvent('report_upgrade_requested', resultPage()),
      isEvent('report_event_saved_from_result'),
      isEvent('report_past_event_saved_from_result'),
    ],
    secondaryActions: [
      isEvent('tool_card_clicked', resultPage()),
      isEvent('premium_service_requested', resultPage()),
    ],
    nextStepActions: [
      isEvent('result_chat_started', resultPage()),
      isEvent('chat_page_viewed', sourceStartsWith('result_report_followup')),
      isEvent('report_to_chat_completed', sourceStartsWith('result_')),
      isEvent('tool_detail_viewed', sourceStartsWith('result_report')),
      isEvent('events_page_viewed', sourceStartsWith('result_report')),
    ],
    healthyRate: 28,
    warningRate: 12,
    warningAction: '结果页有人继续动作，但分层深入还不够强。优先优化首屏主判断、三步动作和追问入口。',
    criticalAction: '结果页读完后断层明显。优先把追问、深入报告、专项工具和事件验证改成唯一主路径。',
  },
  {
    surface: 'tools',
    views: [isEvent('tools_page_viewed')],
    primaryActions: [
      isEvent('tool_card_clicked', pageEquals('/tools')),
      isEvent('tool_card_clicked', pageStartsWith('/tools/category/')),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageEquals('/tools')),
      isEvent('content_card_clicked', pageStartsWith('/tools/category/')),
    ],
    nextStepActions: [
      isEvent('tool_detail_viewed', sourceStartsWith('tools')),
      isEvent('analyze_page_viewed', sourceStartsWith('tools')),
    ],
    healthyRate: 25,
    warningRate: 10,
    warningAction: '工具中心能带来点击，但问题线选择还不够集中。优先精简分类首屏和推荐工具数量。',
    criticalAction: '工具中心访问后没有进入工具。优先隐藏大清单，把用户先引导到一条问题线。',
  },
  {
    surface: 'toolDetail',
    views: [isEvent('tool_detail_viewed', pageStartsWith('/tools/'))],
    primaryActions: [
      isEvent('result_cta_clicked', and(pageStartsWith('/tools/'), targetEquals('tool_detail_primary_start'))),
      isEvent('tool_run_started', pageStartsWith('/tools/')),
    ],
    secondaryActions: [
      isEvent('result_cta_clicked', and(pageStartsWith('/tools/'), targetEquals('tool_runner_requires_report'))),
      isEvent('premium_service_requested', pageStartsWith('/tools/')),
    ],
    nextStepActions: [
      isEvent('tool_result_viewed'),
      isEvent('analyze_page_viewed', sourceIn(['tool_detail_analyze_gate', 'tool_runner'])),
    ],
    healthyRate: 20,
    warningRate: 8,
    warningAction: '工具详情页开始率偏弱。优先重写免费价值、适合人群和首屏运行入口。',
    criticalAction: '工具详情页无法推动开跑。优先排查工具运行门槛、报告缺失提示和 CTA 可见性。',
  },
  {
    surface: 'toolResult',
    views: [isEvent('tool_result_viewed', pageStartsWith('/tool-result/'))],
    primaryActions: [
      isEvent('tool_card_clicked', pageStartsWith('/tool-result/')),
      isEvent('result_cta_clicked', pageStartsWith('/tool-result/')),
    ],
    secondaryActions: [
      isEvent('premium_service_requested', hasAttributionPagePrefix('/tool-result/')),
      isEvent('content_card_clicked', pageStartsWith('/tool-result/')),
    ],
    nextStepActions: [
      isEvent('chat_page_viewed', sourceStartsWith('tool_result_followup')),
      isEvent('report_viewed', sourceStartsWith('tool_result')),
    ],
    healthyRate: 30,
    warningRate: 12,
    warningAction: '工具结果有继续动作，但回到报告、追问和下一工具的闭环还不够强。',
    criticalAction: '工具结果读完后容易中断。优先强化继续深问、返回综合判断和下一工具三条路径。',
  },
  {
    surface: 'knowledge',
    views: [isEvent('knowledge_page_viewed', pageEquals('/knowledge'))],
    primaryActions: [
      isEvent('content_card_clicked', pageEquals('/knowledge')),
      isEvent('content_quick_analyze_started', pageEquals('/knowledge')),
    ],
    secondaryActions: [
      isEvent('tool_card_clicked', pageEquals('/knowledge')),
    ],
    nextStepActions: [
      isEvent('analyze_page_viewed', sourceIn(['content', 'knowledge', 'content_surface'])),
      isEvent('knowledge_article_viewed'),
    ],
    healthyRate: 14,
    warningRate: 5,
    warningAction: '知识首页已有阅读动作，但测算和工具承接弱。优先补专题路径和快捷测算入口。',
    criticalAction: '知识首页像信息流而不是学习路径。优先按专题地图、核心概念和个人测算重排。',
  },
  {
    surface: 'knowledgeArticle',
    views: [isEvent('knowledge_article_viewed', pageStartsWith('/knowledge/'))],
    primaryActions: [
      isEvent('content_quick_analyze_started', pageStartsWith('/knowledge/')),
      isEvent('tool_card_clicked', pageStartsWith('/knowledge/')),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageStartsWith('/knowledge/')),
    ],
    nextStepActions: [
      isEvent('analyze_page_viewed', sourceIn(['content', 'knowledge', 'content_surface'])),
      isEvent('tool_detail_viewed', sourceStartsWith('knowledge')),
    ],
    healthyRate: 12,
    warningRate: 4,
    warningAction: '文章能被点击，但还没有稳定带到测算或工具。优先补“读完下一步验证什么”。',
    criticalAction: '文章详情页读后无动作。优先重写摘要、首屏 CTA 和相关工具承接。',
  },
  {
    surface: 'cases',
    views: [isEvent('cases_page_viewed', pageEquals('/cases'))],
    primaryActions: [
      isEvent('content_card_clicked', pageEquals('/cases')),
      isEvent('content_quick_analyze_started', pageEquals('/cases')),
    ],
    secondaryActions: [
      isEvent('tool_card_clicked', pageEquals('/cases')),
    ],
    nextStepActions: [
      isEvent('case_article_viewed'),
      isEvent('analyze_page_viewed', sourceIn(['case', 'cases', 'content_surface'])),
    ],
    healthyRate: 14,
    warningRate: 5,
    warningAction: '案例库有阅读，但“相似场景到测算”的承接还偏弱。优先突出相似问题和个人验证入口。',
    criticalAction: '案例库没有形成继续阅读或测算。优先按场景分组，而不是只展示文章列表。',
  },
  {
    surface: 'caseArticle',
    views: [isEvent('case_article_viewed', pageStartsWith('/cases/'))],
    primaryActions: [
      isEvent('content_quick_analyze_started', pageStartsWith('/cases/')),
      isEvent('tool_card_clicked', pageStartsWith('/cases/')),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageStartsWith('/cases/')),
    ],
    nextStepActions: [
      isEvent('analyze_page_viewed', sourceIn(['case', 'cases', 'content_surface'])),
      isEvent('tool_detail_viewed', sourceStartsWith('case')),
    ],
    healthyRate: 12,
    warningRate: 4,
    warningAction: '案例详情有动作，但用户回到自己身上的路径还不够明显。',
    criticalAction: '案例详情容易只被围观。优先补“我和这个案例哪里相似”的测算与工具入口。',
  },
  {
    surface: 'chat',
    views: [isEvent('chat_page_viewed', pageEquals('/chat'))],
    primaryActions: [
      isEvent('chat_message_sent', pageEquals('/chat')),
      isEvent('chat_completed', pageEquals('/chat')),
    ],
    secondaryActions: [
      isEvent('chat_event_saved', pageEquals('/chat')),
    ],
    nextStepActions: [
      isEvent('events_page_viewed', sourceStartsWith('chat')),
      isEvent('report_viewed', sourceStartsWith('chat')),
    ],
    healthyRate: 45,
    warningRate: 20,
    warningAction: '追问页有进入但发问不足。优先检查预设问题、上下文提示和输入框首屏位置。',
    criticalAction: '追问入口没有变成真实对话。优先把报告/工具上下文和第一句追问自动带入。',
  },
  {
    surface: 'events',
    views: [isEvent('events_page_viewed', pageEquals('/events'))],
    primaryActions: [
      isEvent('event_created', pageEquals('/events')),
      isEvent('event_feedback_recorded', pageEquals('/events')),
    ],
    secondaryActions: [
      isEvent('result_cta_clicked', pageEquals('/events')),
    ],
    nextStepActions: [
      isEvent('chat_page_viewed', sourceStartsWith('event')),
      isEvent('report_viewed', sourceStartsWith('event')),
    ],
    healthyRate: 25,
    warningRate: 10,
    warningAction: '事件页有访问但验证回收偏弱。优先把待验证和偏差样本放到首屏。',
    criticalAction: '事件页没有形成反馈闭环。优先处理待验证、偏差纠偏和创建事件三件事。',
  },
  {
    surface: 'profile',
    views: [isEvent('profile_page_viewed', pageEquals('/profile'))],
    primaryActions: [
      isEvent('result_cta_clicked', pageEquals('/profile')),
      isEvent('tool_card_clicked', pageEquals('/profile')),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageEquals('/profile')),
    ],
    nextStepActions: [
      isEvent('history_page_viewed', sourceStartsWith('profile')),
      isEvent('report_viewed', sourceStartsWith('profile')),
      isEvent('chat_page_viewed', sourceStartsWith('profile')),
    ],
    healthyRate: 18,
    warningRate: 7,
    warningAction: '档案页可恢复任务，但点击不足。优先突出最近报告、最近工具和待处理事件。',
    criticalAction: '档案页像静态资料页。优先改成恢复工作台，减少用户重新找入口。',
  },
  {
    surface: 'history',
    views: [isEvent('history_page_viewed', pageEquals('/history'))],
    primaryActions: [
      isEvent('result_cta_clicked', pageEquals('/history')),
      isEvent('tool_card_clicked', pageEquals('/history')),
    ],
    secondaryActions: [
      isEvent('content_card_clicked', pageEquals('/history')),
    ],
    nextStepActions: [
      isEvent('report_viewed', sourceStartsWith('history')),
      isEvent('chat_page_viewed', sourceStartsWith('history')),
      isEvent('events_page_viewed', sourceStartsWith('history')),
    ],
    healthyRate: 18,
    warningRate: 7,
    warningAction: '历史页有回看但复盘动作不足。优先把待验证、待纠偏和最近报告放前面。',
    criticalAction: '历史页只承担归档，没有把样本转成下一轮判断。优先补事件反馈和纠偏追问。',
  },
];

export function getProductExperienceAnalyticsSnapshot(days = 30): ProductExperienceAnalyticsSnapshot {
  const rows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE datetime(created_at) >= datetime('now', ?)
    ORDER BY datetime(created_at) DESC
    LIMIT 12000
  `, [`-${days} days`]) as ProductExperienceAnalyticsEventRow[];

  return buildProductExperienceAnalyticsSnapshot(rows, {
    days,
    generatedAt: new Date().toISOString(),
  });
}

export function buildProductExperienceAnalyticsSnapshot(
  rows: ProductExperienceAnalyticsEventRow[],
  options: {
    days?: number;
    generatedAt?: string;
  } = {}
): ProductExperienceAnalyticsSnapshot {
  const events = rows.map(normalizeAnalyticsEvent).filter((event) => event.eventName);
  const rowsBySurface = productSurfaceRoles.map<ProductExperienceSurfaceAnalytics>((role) => {
    const config = surfaceMetricConfigs.find((item) => item.surface === role.surface);
    if (!config) {
      return {
        surface: role.surface,
        label: role.label,
        successMetric: role.successMetric,
        views: 0,
        primaryActions: 0,
        secondaryActions: 0,
        nextStepActions: 0,
        totalActions: 0,
        conversionRate: 0,
        health: 'neutral',
        action: '当前页面角色还没有接入行为映射，需要补充埋点或统计规则。',
        latestAt: null,
      };
    }

    const accumulator = events.reduce<{
      views: number;
      primaryActions: number;
      secondaryActions: number;
      nextStepActions: number;
      latestAt?: string | null;
    }>((current, event) => {
      const matchedView = matchesAny(config.views, event);
      const matchedPrimary = matchesAny(config.primaryActions, event);
      const matchedSecondary = !matchedPrimary && matchesAny(config.secondaryActions || [], event);
      const matchedNextStep = !matchedPrimary && !matchedSecondary && matchesAny(config.nextStepActions || [], event);

      if (matchedView) {
        current.views += 1;
      }
      if (matchedPrimary) {
        current.primaryActions += 1;
      } else if (matchedSecondary) {
        current.secondaryActions += 1;
      } else if (matchedNextStep) {
        current.nextStepActions += 1;
      }

      if (matchedView || matchedPrimary || matchedSecondary || matchedNextStep) {
        current.latestAt = pickLatestTimestamp(current.latestAt, event.createdAt);
      }

      return current;
    }, {
      views: 0,
      primaryActions: 0,
      secondaryActions: 0,
      nextStepActions: 0,
      latestAt: null,
    });

    const totalActions = accumulator.primaryActions + accumulator.secondaryActions + accumulator.nextStepActions;
    const conversionRate = accumulator.views > 0
      ? Math.min(100, Math.round((accumulator.primaryActions / accumulator.views) * 100))
      : 0;
    const health = resolveHealth({
      views: accumulator.views,
      conversionRate,
      healthyRate: config.healthyRate,
      warningRate: config.warningRate,
      minimumViews: config.minimumViews || DEFAULT_SAMPLE_FLOOR,
    });

    return {
      surface: role.surface,
      label: role.label,
      successMetric: role.successMetric,
      views: accumulator.views,
      primaryActions: accumulator.primaryActions,
      secondaryActions: accumulator.secondaryActions,
      nextStepActions: accumulator.nextStepActions,
      totalActions,
      conversionRate,
      health,
      action: resolveAction(health, config),
      latestAt: accumulator.latestAt || null,
    };
  });

  return {
    days: options.days || 30,
    generatedAt: options.generatedAt || new Date().toISOString(),
    rows: rowsBySurface,
    totals: summarizeRows(rowsBySurface),
  };
}

function summarizeRows(rows: ProductExperienceSurfaceAnalytics[]): ProductExperienceAnalyticsSnapshot['totals'] {
  return rows.reduce<ProductExperienceAnalyticsSnapshot['totals']>((current, row) => {
    current.surfaces += 1;
    current.views += row.views;
    current.primaryActions += row.primaryActions;
    current.totalActions += row.totalActions;
    current[row.health] += 1;
    return current;
  }, {
    surfaces: 0,
    views: 0,
    primaryActions: 0,
    totalActions: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    neutral: 0,
  });
}

function resolveHealth(input: {
  views: number;
  conversionRate: number;
  healthyRate: number;
  warningRate: number;
  minimumViews: number;
}): ProductExperienceHealth {
  if (input.views < input.minimumViews) {
    return 'neutral';
  }
  if (input.conversionRate >= input.healthyRate) {
    return 'healthy';
  }
  if (input.conversionRate >= input.warningRate) {
    return 'warning';
  }
  return 'critical';
}

function resolveAction(health: ProductExperienceHealth, config: ProductExperienceSurfaceMetricConfig) {
  if (health === 'healthy') {
    return '当前路径已能完成页面角色，继续保持主动作清晰，并观察后续样本变化。';
  }
  if (health === 'warning') {
    return config.warningAction;
  }
  if (health === 'critical') {
    return config.criticalAction;
  }
  return '样本不足，先继续收集浏览和关键动作；如果长期无样本，检查页面埋点是否触发。';
}

function matchesAny(predicates: ProductExperiencePredicate[], event: NormalizedAnalyticsEvent) {
  return predicates.some((predicate) => predicate(event));
}

function normalizeAnalyticsEvent(row: ProductExperienceAnalyticsEventRow): NormalizedAnalyticsEvent {
  return {
    eventName: `${row.event_name || row.eventName || ''}`,
    page: `${row.page || ''}`,
    meta: parseMeta(row.meta),
    createdAt: row.created_at || row.createdAt || null,
  };
}

function parseMeta(meta: string | Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!meta) {
    return {};
  }
  if (typeof meta === 'object') {
    return meta;
  }

  try {
    const parsed = JSON.parse(meta) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function pickLatestTimestamp(left?: string | null, right?: string | null) {
  if (!right) {
    return left || null;
  }
  if (!left) {
    return right;
  }

  const leftTime = toTimestamp(left);
  const rightTime = toTimestamp(right);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return rightTime > leftTime ? right : left;
  }
  return right > left ? right : left;
}

function toTimestamp(value: string) {
  const normalized = value.includes('T') || /[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
    ? value
    : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized).getTime();
}

function isEvent(eventName: string, predicate?: ProductExperiencePredicate): ProductExperiencePredicate {
  return (event) => event.eventName === eventName && (!predicate || predicate(event));
}

function pageEquals(page: string): ProductExperiencePredicate {
  return (event) => event.page === page;
}

function pageStartsWith(prefix: string): ProductExperiencePredicate {
  return (event) => event.page.startsWith(prefix);
}

function resultPage(): ProductExperiencePredicate {
  return (event) => event.page.startsWith('/result/') || event.page.startsWith('/r/');
}

function targetEquals(target: string): ProductExperiencePredicate {
  return (event) => getMetaString(event.meta, 'target') === target;
}

function sourceIn(sources: string[]): ProductExperiencePredicate {
  return (event) => sources.includes(getSourceValue(event.meta));
}

function sourceStartsWith(prefix: string): ProductExperiencePredicate {
  return (event) => getSourceValue(event.meta).startsWith(prefix);
}

function hasAttributionPagePrefix(prefix: string): ProductExperiencePredicate {
  return (event) => {
    const attribution = event.meta.attribution;
    if (!attribution || typeof attribution !== 'object' || Array.isArray(attribution)) {
      return false;
    }
    const page = getMetaString(attribution as Record<string, unknown>, 'page');
    return page.startsWith(prefix);
  };
}

function and(...predicates: ProductExperiencePredicate[]): ProductExperiencePredicate {
  return (event) => predicates.every((predicate) => predicate(event));
}

function not(predicate: ProductExperiencePredicate): ProductExperiencePredicate {
  return (event) => !predicate(event);
}

function getSourceValue(meta: Record<string, unknown>) {
  const directSource = getMetaString(meta, 'source');
  if (directSource) {
    return directSource;
  }

  const attribution = meta.attribution;
  if (attribution && typeof attribution === 'object' && !Array.isArray(attribution)) {
    return getMetaString(attribution as Record<string, unknown>, 'source');
  }

  return '';
}

function getMetaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return typeof value === 'string' ? value : '';
}
