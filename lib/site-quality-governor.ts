import fs from 'fs';
import path from 'path';
import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import {
  compareStrongCtaStrategies,
  compareWeakCtaStrategies,
  isRetentionWorkbenchSourceFamily,
  mapCtaSourceFamilyLabel,
  type CtaStrategyBreakdownRow,
} from '@/lib/cta-strategy';
import { analyticsOperations } from '@/lib/database';
import { buildReportRetroSnapshot } from '@/lib/report-retro';
import { getSystemOpsSnapshot } from '@/lib/system-ops';
import {
  readOpenAgentOpsTriageSnapshot,
  readOpenAgentReportReliabilitySnapshot,
  readOpenAgentSiteGovernorSnapshot,
  readWorldYiAutonomousCycleLedger,
} from '@/lib/world-yi-autonomous-state';

const SNAPSHOT_FILE = path.join(process.cwd(), 'data', 'runtime', 'site-quality-governor.snapshot.json');
const VALIDATION_CHECKS_FILE = path.join(process.cwd(), 'data', 'runtime', 'site-quality-validation-checks.snapshot.json');
const DEFAULT_RETRO_WINDOW_MINUTES = 24 * 60;
const DEFAULT_PRIORITY_LIMIT = 10;
const CHECK_SCORE_CAP_WITHOUT_EVIDENCE = 75;

export type SiteQualityStatus = 'healthy' | 'warning' | 'critical';
export type SiteQualityDimensionKey =
  | 'compatibility'
  | 'stability'
  | 'interaction_logic'
  | 'development_efficiency';

export interface SiteQualityCheckResult {
  key: string;
  label: string;
  status: 'passed' | 'failed' | 'unknown';
  detail?: string;
  checkedAt?: string;
}

export interface SiteQualityDimensionScore {
  key: SiteQualityDimensionKey;
  label: string;
  score: number;
  status: SiteQualityStatus;
  summary: string;
  evidence: string[];
}

export interface SiteQualityPriorityItem {
  key: string;
  dimension: SiteQualityDimensionKey;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  action: string;
  source: string;
}

export interface SiteQualityGovernorSnapshot {
  generatedAt: string;
  doctrine: string;
  retroWindowMinutes: number;
  overallScore: number;
  status: SiteQualityStatus;
  summary: string;
  wins: string[];
  risks: string[];
  dimensions: SiteQualityDimensionScore[];
  priorityQueue: SiteQualityPriorityItem[];
  validationChecks: SiteQualityCheckResult[];
  evidence: {
    behaviorWindow: {
      currentStart?: string;
      currentEnd?: string;
      previousStart?: string;
      previousEnd?: string;
      compareLabel?: string;
    };
    systemHealth: {
      severity: SiteQualityStatus;
      title: string;
      blockers: string[];
      healthySignals: string[];
    };
    interaction: {
      funnel: Array<{
        key: string;
        label: string;
        currentRate: number;
        previousRate: number;
        rateDelta: number;
      }>;
      topToolGap?: {
        slug: string;
        gapType: string;
        priorityScore: number;
        action: string;
      };
      topBouncePage?: {
        page: string;
        bounceRate: number;
        views: number;
        action: string;
      };
    };
    stability: {
      llmSuccessRate24h: number;
      llmAttempts24h: number;
      openModelCount: number;
      halfOpenModelCount: number;
      fallbackRate: number;
      weakestRoute?: {
        key: string;
        label: string;
        successRate: number;
        failed: number;
        fallbackRate: number;
      };
    };
    autonomy: {
      latestCycleAt?: string;
      latestCycleSuccess: boolean;
      latestCycleMode?: string;
      latestSiteGovernorStatus?: string;
      latestOpsTriageStatus?: string;
      latestReportReliabilityStatus?: string;
    };
  };
}

function ensureRuntimeDir() {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
}

function readPersistedValidationChecks() {
  try {
    const payload = JSON.parse(fs.readFileSync(VALIDATION_CHECKS_FILE, 'utf8')) as {
      checks?: SiteQualityCheckResult[];
    };
    return Array.isArray(payload?.checks) ? payload.checks : [];
  } catch {
    return [];
  }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function statusFromScore(score: number): SiteQualityStatus {
  if (score < 65) return 'critical';
  if (score < 85) return 'warning';
  return 'healthy';
}

function prioritySeverityRank(severity: SiteQualityPriorityItem['severity']) {
  if (severity === 'critical') return 3;
  if (severity === 'warning') return 2;
  return 1;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function hoursSince(value?: string) {
  if (!value) return null;
  const ageMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return null;
  return Math.round(ageMs / (60 * 60 * 1000));
}

function pushPriority(
  queue: SiteQualityPriorityItem[],
  item: SiteQualityPriorityItem | null | undefined,
) {
  if (!item) return;
  if (queue.some((existing) => existing.key === item.key)) return;
  queue.push(item);
}

function buildCompatibilitySummary(params: {
  score: number;
  failedChecks: SiteQualityCheckResult[];
  missingSessionPageViews: number;
  evidenceCount: number;
}) {
  if (params.failedChecks.length > 0) {
    return `构建/校验已有 ${params.failedChecks.length} 项失败，兼容性不能按“理论上没问题”处理。`;
  }
  if (params.evidenceCount === 0) {
    return '还没有接入 build/lint/test/QA 结果，这一维目前只能给保守分。';
  }
  if (params.missingSessionPageViews > 0) {
    return `页面浏览仍有 ${params.missingSessionPageViews} 条缺 session，兼容性与埋点一致性还没完全站稳。`;
  }
  if (params.score >= 90) {
    return '构建校验与客户端基础链路目前没有明显兼容性红旗。';
  }
  return '兼容性整体可控，但还需要把校验结果持续接回固定评估链路。';
}

function buildStabilitySummary(params: {
  score: number;
  llmAttempts24h: number;
  llmSuccessRate24h: number;
  fallbackRate: number;
  weakestRoute?: { label: string; successRate: number } | null;
}) {
  if (params.llmAttempts24h > 0 && params.llmSuccessRate24h < 60) {
    return `近 24 小时模型成功率只有 ${params.llmSuccessRate24h}% ，当前稳定性主要受模型链路拖累。`;
  }
  if (params.fallbackRate >= 15) {
    return `最近报告回退率 ${params.fallbackRate}% 偏高，交付稳定性还没有进到放心区。`;
  }
  if ((params.weakestRoute?.successRate || 100) < 90) {
    return `${params.weakestRoute?.label || '关键链路'} 成功率偏低，稳定性已经开始直接影响用户体感。`;
  }
  if (params.score >= 90) {
    return '系统健康、接口成功率和报告交付目前都处在相对稳定区间。';
  }
  return '稳定性没有完全失守，但还需要继续压降失败率、熔断和回退。';
}

function buildInteractionSummary(params: {
  score: number;
  reportToChat?: { currentRate: number; rateDelta: number } | null;
  reportToEvent?: { currentRate: number; rateDelta: number } | null;
  toolToRun?: { currentRate: number; rateDelta: number } | null;
  topToolGap?: { slug: string } | null;
  topWeakDevice?: { deviceType: string; weakestRate: number; authVerifyRate: number; toolToRunRate: number; reportToChatRate: number } | null;
  weakRecallReportSource?: { source: string; chatCompletionRate: number } | null;
  weakRecallToolSource?: { source: string; sentToRunRate: number } | null;
  weakRetentionWorkbenchSource?: { sourceFamily: string; clickToChatRate: number; chatCompletionRate: number } | null;
}) {
  if (isWeakRetentionWorkbenchItem(params.weakRetentionWorkbenchSource as CtaStrategyBreakdownRow | null)) {
    return `复访工作台里的“${mapCtaSourceFamilyLabel(params.weakRetentionWorkbenchSource?.sourceFamily || '')}”还没把回访用户接成继续使用，档案/历史/事件页应该直接恢复上一条任务。`;
  }
  if ((params.weakRecallReportSource?.chatCompletionRate || 100) < 25) {
    return `生命周期报告召回里的“${params.weakRecallReportSource?.source}”回流后仍接不住聊天，召回链路还没形成真正复访。`;
  }
  if ((params.weakRecallToolSource?.sentToRunRate || 100) < 20) {
    return `生命周期工具召回里的“${params.weakRecallToolSource?.source}”回流后仍停在看工具，没有形成实际开跑。`;
  }
  if ((params.topWeakDevice?.weakestRate || 100) < 20) {
    return `${mapDeviceLabel(params.topWeakDevice?.deviceType)}已经出现明显设备侧断点，应该先按设备修最弱链路。`;
  }
  if ((params.reportToChat?.rateDelta || 0) < 0) {
    return `结果页到聊天的承接在下降，报告不是没流量，而是“继续问下去”的动作不够近。`;
  }
  if ((params.reportToEvent?.rateDelta || 0) < 0) {
    return '结果页到事件沉淀转弱，用户看完报告后没有被足够快地带进验证闭环。';
  }
  if ((params.toolToRun?.currentRate || 100) < 25) {
    return `工具探索不等于工具使用，当前 detail -> run 还是主要断点。`;
  }
  if (params.topToolGap) {
    return `${params.topToolGap.slug} 暴露出最典型的工具链路断点，值得先做样板修复。`;
  }
  if (params.score >= 90) {
    return '结果页、工具页与后续动作的承接整体顺滑，没有明显第一屏断点。';
  }
  return '交互逻辑还有提升空间，重点不是加更多内容，而是把下一步动作再前移。';
}

function buildDevEfficiencySummary(params: {
  score: number;
  latestCycleHours: number | null;
  latestCycleSuccess: boolean;
  checkCount: number;
  successfulOpenAgentReviews: number;
}) {
  if (params.checkCount === 0) {
    return '没有把 build/lint/test/QA 结果接进治理器，开发效率暂时还依赖人工记忆。';
  }
  if (params.latestCycleHours === null) {
    return '自治账本还没有最近样本，说明问题发现与复盘节奏不够制度化。';
  }
  if (!params.latestCycleSuccess) {
    return '最近一次自治循环没有完整成功，说明自动化治理链路仍有断点。';
  }
  if (params.successfulOpenAgentReviews < 2) {
    return '自动评审基础已经有了，但质量评审快照还没形成稳定的多层覆盖。';
  }
  if (params.score >= 90) {
    return '固定评估、自治循环和质量快照都已具备，开发迭代正在更接近闭环。';
  }
  return '开发效率基础不错，但还要继续把“评估证据”接进每轮迭代的默认流程。';
}

function mapDeviceLabel(deviceType?: string | null) {
  if (deviceType === 'mobile') return '移动端';
  if (deviceType === 'desktop') return '桌面端';
  if (deviceType === 'tablet') return '平板';
  if (deviceType === 'bot') return '机器人';
  return '未知设备';
}

function mapAttributionSourceLabel(source?: string | null): string {
  const normalized = `${source || ''}`.trim();
  if (!normalized) return '直接访问';
  if (normalized.startsWith('knowledge_article:')) return `知识文章 · ${normalized.replace('knowledge_article:', '')}`;
  if (normalized.startsWith('case_article:')) return `案例文章 · ${normalized.replace('case_article:', '')}`;
  if (normalized.startsWith('tool_detail')) return '工具详情页';
  if (normalized.startsWith('lifecycle_report_followup:')) return `报告召回 · ${mapAttributionSourceLabel(normalized.replace(/^lifecycle_report_followup:/, ''))}`;
  if (normalized.startsWith('lifecycle_tool_interest:')) return `工具召回 · ${mapAttributionSourceLabel(normalized.replace(/^lifecycle_tool_interest:/, ''))}`;
  if (normalized === 'updates_page') return '更新中心';
  if (normalized === 'direct') return '直接访问';
  return normalized;
}

function getCtaStrategyItems(items?: CtaStrategyBreakdownRow[]) {
  return (items || []).filter((item) => item.clicks > 0 || item.chatPageViews > 0);
}

function buildRetentionWorkbenchAction(sourceFamily: string) {
  if (sourceFamily === 'profile_page') {
    return '把最近报告、最近聊天和“接着问”的恢复入口压到档案页第一屏，不要让回访用户先看静态资料再决定。';
  }
  if (sourceFamily === 'history_page') {
    return '把待纠偏样本、最近漂移和“继续纠偏这条判断”的 CTA 聚合到历史页上半屏，避免用户停在记录列表。';
  }
  if (sourceFamily === 'events_page') {
    return '把临近事件、过期待验证事件和“围绕这个节点继续判断”的 CTA 前移到事件工作台顶部，直接带入聊天上下文。';
  }
  return '把复访用户最需要恢复的任务前移到第一屏，避免回访再次退化成浏览。';
}

function isWeakRetentionWorkbenchItem(item?: CtaStrategyBreakdownRow | null) {
  if (!item || !isRetentionWorkbenchSourceFamily(item.sourceFamily)) {
    return false;
  }
  return item.chatCompletionRate < 40 || item.clickToChatRate < 60;
}

export function buildSiteQualityGovernorSnapshot(params?: {
  retroWindowMinutes?: number;
  validationChecks?: SiteQualityCheckResult[];
  priorityLimit?: number;
}) : SiteQualityGovernorSnapshot {
  const retroWindowMinutes = Math.max(60, Math.floor(params?.retroWindowMinutes || DEFAULT_RETRO_WINDOW_MINUTES));
  const priorityLimit = Math.max(4, Math.min(20, Math.floor(params?.priorityLimit || DEFAULT_PRIORITY_LIMIT)));
  const inputValidationChecks = params?.validationChecks?.length
    ? params.validationChecks
    : readPersistedValidationChecks();
  const validationChecks = inputValidationChecks.map((item) => ({
    ...item,
    label: item.label || item.key,
    status: item.status || 'unknown',
  }));
  const overview = analyticsOperations.getOverview();
  const systemOps = getSystemOpsSnapshot({ mode: 'summary' });
  const retro = buildReportRetroSnapshot({ windowMinutes: retroWindowMinutes, sectionLimit: 8 });
  const workboard = getAdminQualityWorkboard();
  const siteGovernor = readOpenAgentSiteGovernorSnapshot();
  const opsTriage = readOpenAgentOpsTriageSnapshot();
  const reportReliability = readOpenAgentReportReliabilitySnapshot();
  const latestCycle = readWorldYiAutonomousCycleLedger(1)[0];
  const priorityQueue: SiteQualityPriorityItem[] = [];
  const wins: string[] = [];

  const failedChecks = validationChecks.filter((item) => item.status === 'failed');
  const unknownChecks = validationChecks.filter((item) => item.status === 'unknown');
  const checkEvidenceCount = validationChecks.filter((item) => item.status !== 'unknown').length;

  let compatibilityScore = validationChecks.length > 0 ? 88 : CHECK_SCORE_CAP_WITHOUT_EVIDENCE;
  if (validationChecks.length === 0) {
    pushPriority(priorityQueue, {
      key: 'compatibility-missing-checks',
      dimension: 'compatibility',
      severity: 'warning',
      title: '质量治理还没有接到固定 build/lint/test/QA 结果',
      detail: '当前只能用运行态与漏斗信号估计兼容性，缺少真正的构建与表层校验结论。',
      action: '把 `npm run test`、`npm run build`、`npm run lint`、`npm run qa:public-surfaces` 作为每轮固定评估项接回 governor 快照。',
      source: 'site-quality-governor',
    });
  }
  if (failedChecks.length > 0) {
    compatibilityScore -= failedChecks.length * 15;
    pushPriority(priorityQueue, {
      key: 'compatibility-failed-checks',
      dimension: 'compatibility',
      severity: 'critical',
      title: '固定校验存在失败项',
      detail: `失败项：${failedChecks.map((item) => item.label).join('、')}`,
      action: '先清空失败检查，再继续扩大功能迭代；兼容性问题不应该带着已知失败继续向前推。',
      source: 'validation-checks',
    });
  }
  if (unknownChecks.length > 0) {
    compatibilityScore -= unknownChecks.length * 4;
  }
  if (retro.analytics.missingSessionPageViews > 0) {
    compatibilityScore -= Math.min(10, retro.analytics.missingSessionPageViews * 2);
    pushPriority(priorityQueue, {
      key: 'compatibility-missing-session-pageviews',
      dimension: 'compatibility',
      severity: 'warning',
      title: '页面浏览埋点仍有缺失 session 的样本',
      detail: `最近回顾窗口里有 ${retro.analytics.missingSessionPageViews} 条页面浏览事件没有串上 session。`,
      action: '继续检查客户端首屏与埋点初始化路径，避免浏览器差异或 hydration 早期路径让页面行为样本失真。',
      source: 'report-retro',
    });
  }
  const deviceCoverageRate = overview.deviceMeasurementSummary?.currentWindow?.coverageRate || 0;
  if (deviceCoverageRate > 0 && deviceCoverageRate < 60) {
    compatibilityScore -= Math.min(12, Math.round((60 - deviceCoverageRate) / 4));
    pushPriority(priorityQueue, {
      key: 'compatibility-device-coverage',
      dimension: 'compatibility',
      severity: deviceCoverageRate < 35 ? 'critical' : 'warning',
      title: '设备埋点覆盖率还不够支撑稳定经营判断',
      detail: `最近 3 天设备事件覆盖率只有 ${deviceCoverageRate}% ，设备趋势和按端漏斗仍容易失真。`,
      action: '继续把关键首屏、注册、结果页、工具页埋点统一挂上 device profile，先保证经营判断口径稳定。',
      source: 'analytics.deviceMeasurementSummary',
    });
  }
  compatibilityScore = clampScore(compatibilityScore);
  const compatibilityEvidence = uniqueStrings([
    validationChecks.length > 0
      ? `已接入 ${validationChecks.length} 个固定校验结果`
      : '尚未接入固定 build/lint/test/QA 结果',
    failedChecks.length > 0 ? `失败校验 ${failedChecks.length} 项` : '当前没有已知失败校验样本',
    retro.analytics.missingSessionPageViews > 0
      ? `缺 session 页面浏览 ${retro.analytics.missingSessionPageViews} 条`
      : '页面浏览埋点 session 基本串通',
    deviceCoverageRate > 0 ? `最近设备事件覆盖率 ${deviceCoverageRate}%` : '最近没有设备覆盖率样本',
  ]);
  if (failedChecks.length === 0 && retro.analytics.missingSessionPageViews === 0 && validationChecks.length > 0) {
    wins.push('构建校验与页面埋点目前没有明显兼容性红旗。');
  }

  let stabilityScore = 100;
  const llmSnapshot = overview.systemHealth?.llmSnapshot || {
    attempts24h: 0,
    successRate24h: 100,
    openModelCount: 0,
    halfOpenModelCount: 0,
  };
  const weakestRoute = (overview.routeHealthBreakdown || [])
    .filter((item) => item.total > 0)
    .sort((left, right) => left.successRate - right.successRate || right.failed - left.failed)[0];
  if (systemOps.severity === 'critical') {
    stabilityScore -= 24;
  } else if (systemOps.severity === 'warning') {
    stabilityScore -= 10;
  }
  if (llmSnapshot.attempts24h > 0) {
    if (llmSnapshot.successRate24h < 20) {
      stabilityScore -= 30;
    } else if (llmSnapshot.successRate24h < 60) {
      stabilityScore -= 18;
    } else if (llmSnapshot.successRate24h < 80) {
      stabilityScore -= 8;
    }
  }
  stabilityScore -= Math.min(18, Math.round((retro.reports.fallbackRate || 0) * 0.7));
  if ((weakestRoute?.successRate || 100) < 85) {
    stabilityScore -= 14;
  } else if ((weakestRoute?.successRate || 100) < 95) {
    stabilityScore -= 6;
  }
  if ((llmSnapshot.openModelCount || 0) > 0 || (llmSnapshot.halfOpenModelCount || 0) > 0) {
    stabilityScore -= 8;
  }
  stabilityScore = clampScore(stabilityScore);
  const topFailureHotspot = overview.requestFailureHotspots?.[0];
  if (llmSnapshot.attempts24h > 0 && llmSnapshot.successRate24h < 60) {
    pushPriority(priorityQueue, {
      key: 'stability-llm-success-rate',
      dimension: 'stability',
      severity: 'critical',
      title: '模型成功率正在直接伤害产品稳定性',
      detail: `近 24 小时模型成功率 ${llmSnapshot.successRate24h}% ，开路熔断 ${llmSnapshot.openModelCount || 0} 个，半开探测 ${llmSnapshot.halfOpenModelCount || 0} 个。`,
      action: '先压模型失败与熔断恢复，再放大用户层迭代；当底层不稳时，交互改造的收益会被吞掉。',
      source: 'system-health',
    });
  }
  if (retro.reports.fallbackRate >= 10) {
    pushPriority(priorityQueue, {
      key: 'stability-report-fallback-rate',
      dimension: 'stability',
      severity: retro.reports.fallbackRate >= 20 ? 'critical' : 'warning',
      title: '报告回退率仍偏高',
      detail: `最近回顾窗口里回退率 ${retro.reports.fallbackRate}% ，说明高质量交付还不稳定。`,
      action: '持续收紧 report reliability guard，并优先回看被真实查看的 basic / fallback 报告样本。',
      source: 'report-retro',
    });
  }
  if (weakestRoute && weakestRoute.successRate < 90) {
    pushPriority(priorityQueue, {
      key: `stability-route-${weakestRoute.key}`,
      dimension: 'stability',
      severity: weakestRoute.successRate < 80 ? 'critical' : 'warning',
      title: `${weakestRoute.label} 成功率偏低`,
      detail: `当前成功率 ${weakestRoute.successRate}% ，失败 ${weakestRoute.failed} 次，降级 ${weakestRoute.fallbackCount} 次。`,
      action: topFailureHotspot
        ? `优先检查 ${topFailureHotspot.label} 相关失败热点，再回看该链路的超时、错误类型与降级策略。`
        : '优先查看该路由的失败热点与延迟样本，先降失败再谈扩功能。',
      source: 'analytics.routeHealthBreakdown',
    });
  }
  const stabilityEvidence = uniqueStrings([
    `系统健康评级 ${systemOps.severity}`,
    llmSnapshot.attempts24h > 0
      ? `近 24 小时模型成功率 ${llmSnapshot.successRate24h}%`
      : '近 24 小时没有模型调用样本',
    `最近报告回退率 ${retro.reports.fallbackRate}%`,
    weakestRoute ? `${weakestRoute.label} 成功率 ${weakestRoute.successRate}%` : '当前没有明显的路由故障样本',
  ]);
  if (stabilityScore >= 90) {
    wins.push('模型、接口和报告交付当前处在相对稳定区间。');
  }

  let interactionScore = 100;
  const reportToChat = overview.recentBehaviorShift?.funnel?.find((item) => item.key === 'report_to_chat') || null;
  const reportToEvent = overview.recentBehaviorShift?.funnel?.find((item) => item.key === 'report_to_event') || null;
  const toolToRun = overview.recentBehaviorShift?.funnel?.find((item) => item.key === 'tool_to_run') || null;
  const topWeakDevice = (overview.deviceFunnelBreakdown || [])
    .filter((item) => item.sampleState !== 'sparse')
    .map((item) => ({
      deviceType: item.deviceType,
      weakestRate: Math.min(item.reportToChatRate, item.toolToRunRate, item.authVerifyRate),
      authVerifyRate: item.authVerifyRate,
      toolToRunRate: item.toolToRunRate,
      reportToChatRate: item.reportToChatRate,
    }))
    .sort((left, right) => left.weakestRate - right.weakestRate)[0];
  const weakRecallReportSource = (overview.lifecycleRecall?.reportFollowupBySource || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.chatCompletionRate - right.chatCompletionRate || right.sent - left.sent)[0];
  const weakRecallToolSource = (overview.lifecycleRecall?.toolInterestBySource || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.sentToRunRate - right.sentToRunRate || right.sent - left.sent)[0];
  const retentionWorkbenchStrategies = getCtaStrategyItems(overview.ctaStrategyBreakdown)
    .filter((item) => item.strategyKey === 'retention_workbench_resume' && isRetentionWorkbenchSourceFamily(item.sourceFamily));
  const weakRetentionWorkbenchSource = [...retentionWorkbenchStrategies]
    .sort(compareWeakCtaStrategies)[0];
  const strongRetentionWorkbenchSource = [...retentionWorkbenchStrategies]
    .sort(compareStrongCtaStrategies)[0];
  const weakestSourceFunnel = (overview.sourceFunnel || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const weakestSourceDeviceFunnel = (overview.sourceDeviceFunnel || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const strongestSourceShift = (overview.recentSourceShift || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const rightMagnitude =
        Math.abs(right.analyzeSessionsDelta)
        + Math.abs(right.reportViewSessionsDelta)
        + Math.abs(right.viewToChatRateDelta)
        + Math.abs(right.viewToToolRunRateDelta);
      const leftMagnitude =
        Math.abs(left.analyzeSessionsDelta)
        + Math.abs(left.reportViewSessionsDelta)
        + Math.abs(left.viewToChatRateDelta)
        + Math.abs(left.viewToToolRunRateDelta);
      return rightMagnitude - leftMagnitude;
    })[0];
  const weakestWeeklySource = (overview.weeklySourceTrend || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const topToolGap = workboard.prioritizedToolJourneyGaps[0];
  const topBouncePage = workboard.prioritizedBouncePages[0];
  if (isWeakRetentionWorkbenchItem(weakRetentionWorkbenchSource)) {
    interactionScore -= weakRetentionWorkbenchSource!.chatCompletionRate < 25 ? 12 : 6;
    if (weakRetentionWorkbenchSource!.clickToChatRate < 50) {
      interactionScore -= 6;
    }
  }
  if ((weakRecallReportSource?.chatCompletionRate || 100) < 25) {
    interactionScore -= 12;
  } else if ((weakRecallReportSource?.chatCompletionRate || 100) < 40) {
    interactionScore -= 6;
  }
  if ((weakRecallToolSource?.sentToRunRate || 100) < 20) {
    interactionScore -= 10;
  } else if ((weakRecallToolSource?.sentToRunRate || 100) < 35) {
    interactionScore -= 5;
  }
  if ((weakestSourceFunnel?.viewToChatRate || 100) < 20) {
    interactionScore -= 12;
  } else if ((weakestSourceFunnel?.viewToChatRate || 100) < 35) {
    interactionScore -= 6;
  }
  if (strongestSourceShift?.direction === 'down') {
    interactionScore -= strongestSourceShift.sampleState === 'enough' ? 10 : 5;
  }
  if ((weakestWeeklySource?.viewToChatRate || 100) < 20) {
    interactionScore -= 10;
  } else if ((weakestWeeklySource?.viewToChatRate || 100) < 35) {
    interactionScore -= 5;
  }
  if ((topWeakDevice?.weakestRate || 100) < 20) {
    interactionScore -= 12;
  } else if ((topWeakDevice?.weakestRate || 100) < 35) {
    interactionScore -= 6;
  }
  if ((reportToChat?.currentRate || 100) < 20) {
    interactionScore -= 22;
  } else if ((reportToChat?.currentRate || 100) < 35) {
    interactionScore -= 10;
  }
  if ((reportToChat?.rateDelta || 0) < 0) {
    interactionScore -= Math.min(12, Math.abs(reportToChat?.rateDelta || 0) * 2);
  }
  if ((reportToEvent?.currentRate || 100) < 15) {
    interactionScore -= 18;
  } else if ((reportToEvent?.currentRate || 100) < 25) {
    interactionScore -= 8;
  }
  if ((reportToEvent?.rateDelta || 0) < 0) {
    interactionScore -= Math.min(10, Math.abs(reportToEvent?.rateDelta || 0) * 1.5);
  }
  if ((toolToRun?.currentRate || 100) < 20) {
    interactionScore -= 22;
  } else if ((toolToRun?.currentRate || 100) < 40) {
    interactionScore -= 10;
  }
  if ((toolToRun?.rateDelta || 0) < 0) {
    interactionScore -= Math.min(10, Math.abs(toolToRun?.rateDelta || 0) * 1.4);
  }
  if ((topToolGap?.priorityScore || 0) >= 60) {
    interactionScore -= 10;
  }
  if ((topBouncePage?.views || 0) >= 10 && (topBouncePage?.bounceRate || 0) >= 70) {
    interactionScore -= 8;
  }
  interactionScore = clampScore(interactionScore);
  if ((reportToChat?.rateDelta || 0) < 0) {
    pushPriority(priorityQueue, {
      key: 'interaction-report-to-chat',
      dimension: 'interaction_logic',
      severity: reportToChat && reportToChat.currentRate < 20 ? 'critical' : 'warning',
      title: '结果页到聊天的承接在变弱',
      detail: `最近完整 3 天结果页会话 -> 聊天提问为 ${reportToChat?.currentRate || 0}% ，较前 3 天 ${reportToChat?.rateDelta || 0} 个点。`,
      action: '把“继续追问这份报告”的 CTA 前移到结果页第一屏，并明确提示为什么应该继续问，而不是只给一个入口按钮。',
      source: 'recentBehaviorShift.funnel',
    });
  }
  retentionWorkbenchStrategies
    .filter((item) => isWeakRetentionWorkbenchItem(item))
    .slice(0, 3)
    .forEach((item) => {
      pushPriority(priorityQueue, {
        key: `interaction-retention-workbench-${item.sourceFamily}`,
        dimension: 'interaction_logic',
        severity: item.chatCompletionRate < 20 || item.clickToChatRate < 35 ? 'critical' : 'warning',
        title: `复访工作台里的${mapCtaSourceFamilyLabel(item.sourceFamily)}没有接住继续使用`,
        detail: `${mapCtaSourceFamilyLabel(item.sourceFamily)}当前 CTA ${item.clicks} -> 聊天页 ${item.chatPageViews}（${item.clickToChatRate}%） -> 完成 ${item.chatCompleted}（${item.chatCompletionRate}%）。`,
        action: buildRetentionWorkbenchAction(item.sourceFamily),
        source: 'analytics.ctaStrategyBreakdown',
      });
    });
  if (weakRecallReportSource && weakRecallReportSource.chatCompletionRate < 35) {
    pushPriority(priorityQueue, {
      key: `interaction-lifecycle-report-source-${weakRecallReportSource.source}`,
      dimension: 'interaction_logic',
      severity: weakRecallReportSource.chatCompletionRate < 20 ? 'critical' : 'warning',
      title: '报告召回里的弱来源没有被接住',
      detail: `来源“${weakRecallReportSource.source}”的报告召回聊天完成率只有 ${weakRecallReportSource.chatCompletionRate}%。`,
      action: '重写这类来源用户的邮件主题、首屏文案和结果页继续追问承接，让 GEO/SEO 回流不是回来看一眼就走。',
      source: 'analytics.lifecycleRecall.reportFollowupBySource',
    });
  }
  if (weakRecallToolSource && weakRecallToolSource.sentToRunRate < 30) {
    pushPriority(priorityQueue, {
      key: `interaction-lifecycle-tool-source-${weakRecallToolSource.source}`,
      dimension: 'interaction_logic',
      severity: weakRecallToolSource.sentToRunRate < 15 ? 'critical' : 'warning',
      title: '工具召回里的弱来源没有形成开跑',
      detail: `来源“${weakRecallToolSource.source}”的工具召回 sent -> run 只有 ${weakRecallToolSource.sentToRunRate}%。`,
      action: '优先修这类内容来源回流后的工具首屏、示例问题和直接运行承接，不要让邮件只带回浏览不带回使用。',
      source: 'analytics.lifecycleRecall.toolInterestBySource',
    });
  }
  if (weakestSourceFunnel && weakestSourceFunnel.viewToChatRate < 30) {
    pushPriority(priorityQueue, {
      key: `interaction-source-funnel-${weakestSourceFunnel.source}`,
      dimension: 'interaction_logic',
      severity: weakestSourceFunnel.viewToChatRate < 15 ? 'critical' : 'warning',
      title: '主来源漏斗存在明确弱来源',
      detail: `来源“${mapAttributionSourceLabel(weakestSourceFunnel.source)}”当前 analyze ${weakestSourceFunnel.analyzeSessions}，结果页查看率 ${weakestSourceFunnel.reportToViewRate}% ，结果页 -> 聊天仅 ${weakestSourceFunnel.viewToChatRate}%。`,
      action: '按这个来源重写 analyze 完成后的结果页首屏承接、继续提问文案与工具引导，不要让高意向来源在结果页掉下去。',
      source: 'analytics.sourceFunnel',
    });
  }
  if (weakestSourceDeviceFunnel && weakestSourceDeviceFunnel.viewToChatRate < 25) {
    pushPriority(priorityQueue, {
      key: `interaction-source-device-funnel-${weakestSourceDeviceFunnel.source}-${weakestSourceDeviceFunnel.deviceType}`,
      dimension: 'interaction_logic',
      severity: weakestSourceDeviceFunnel.viewToChatRate < 12 ? 'critical' : 'warning',
      title: '来源与设备组合出现二级断点',
      detail: `${mapDeviceLabel(weakestSourceDeviceFunnel.deviceType)}上的“${mapAttributionSourceLabel(weakestSourceDeviceFunnel.source)}”结果页 -> 聊天只有 ${weakestSourceDeviceFunnel.viewToChatRate}%。`,
      action: '按设备单独检查这类来源用户的首屏 CTA、排版顺序和继续追问按钮位置，优先修移动端高意图来源。',
      source: 'analytics.sourceDeviceFunnel',
    });
  }
  if (strongestSourceShift && strongestSourceShift.direction === 'down') {
    pushPriority(priorityQueue, {
      key: `interaction-source-shift-${strongestSourceShift.source}`,
      dimension: 'interaction_logic',
      severity: strongestSourceShift.sampleState === 'enough' && strongestSourceShift.viewToChatRateDelta < -10 ? 'critical' : 'warning',
      title: '最近几天有具体来源在回落',
      detail: `来源“${mapAttributionSourceLabel(strongestSourceShift.source)}”最近 analyze ${strongestSourceShift.analyzeSessionsDelta > 0 ? '+' : ''}${strongestSourceShift.analyzeSessionsDelta}，结果页查看 ${strongestSourceShift.reportViewSessionsDelta > 0 ? '+' : ''}${strongestSourceShift.reportViewSessionsDelta}，结果页 -> 聊天 ${strongestSourceShift.viewToChatRateDelta > 0 ? '+' : ''}${strongestSourceShift.viewToChatRateDelta}pt。`,
      action: '先不要泛化改全站，按这个来源重写入口落点、结果页第一屏追问理由和回流邮件文案，确认短周期指标止跌后再继续放量。',
      source: 'analytics.recentSourceShift',
    });
  }
  if (weakestWeeklySource && weakestWeeklySource.viewToChatRate < 30) {
    pushPriority(priorityQueue, {
      key: `interaction-weekly-source-${weakestWeeklySource.source}`,
      dimension: 'interaction_logic',
      severity: weakestWeeklySource.viewToChatRate < 15 ? 'critical' : 'warning',
      title: '来源周趋势显示持续承接不足',
      detail: `来源“${mapAttributionSourceLabel(weakestWeeklySource.source)}”在 ${weakestWeeklySource.weekLabel} analyze ${weakestWeeklySource.analyzeSessions}，结果页 -> 聊天只有 ${weakestWeeklySource.viewToChatRate}%。`,
      action: '把这类 GEO/SEO 来源的内容承诺、测算入口、结果页首屏和后续召回统一成一条旅程，避免持续获得流量但无法形成复访。',
      source: 'analytics.weeklySourceTrend',
    });
  }
  if ((reportToEvent?.rateDelta || 0) < 0 || (reportToEvent?.currentRate || 100) < 15) {
    pushPriority(priorityQueue, {
      key: 'interaction-report-to-event',
      dimension: 'interaction_logic',
      severity: (reportToEvent?.currentRate || 0) < 10 ? 'critical' : 'warning',
      title: '结果页到事件沉淀没有接住',
      detail: `最近完整 3 天结果页会话 -> 事件沉淀为 ${reportToEvent?.currentRate || 0}% ，较前 3 天 ${reportToEvent?.rateDelta || 0} 个点。`,
      action: '把事件沉淀与“过去是否发生过这些节点”的确认动作前移到结果页上半屏，减少用户滚动后才看到验证入口的问题。',
      source: 'recentBehaviorShift.funnel',
    });
  }
  if ((toolToRun?.currentRate || 100) < 25 || ['start_cta', 'cta_to_run'].includes(topToolGap?.gapType || '')) {
    pushPriority(priorityQueue, {
      key: `interaction-tool-run-${topToolGap?.slug || 'overall'}`,
      dimension: 'interaction_logic',
      severity: (toolToRun?.currentRate || 0) < 15 || ['start_cta', 'cta_to_run'].includes(topToolGap?.gapType || '') ? 'critical' : 'warning',
      title: '工具页 detail -> run 摩擦过高',
      detail: topToolGap
        ? `${topToolGap.slug} 当前暴露的主断点是 ${topToolGap.gapType}，优先级 ${topToolGap.priorityScore}。`
        : `最近完整 3 天工具详情会话 -> 工具开跑只有 ${toolToRun?.currentRate || 0}%。`,
      action: topToolGap?.action || '降低工具启动门槛，提供示例问题、直接运行兜底，以及更强的“这个工具到底替你解决什么”首屏说明。',
      source: topToolGap ? 'admin-quality-workboard' : 'recentBehaviorShift.funnel',
    });
  }
  if (topWeakDevice && topWeakDevice.weakestRate < 35) {
    const weakestLinkLabel = topWeakDevice.authVerifyRate <= topWeakDevice.toolToRunRate
      && topWeakDevice.authVerifyRate <= topWeakDevice.reportToChatRate
      ? '注册完成'
      : topWeakDevice.toolToRunRate <= topWeakDevice.reportToChatRate
        ? '工具启动'
        : '结果页追问';
    pushPriority(priorityQueue, {
      key: `interaction-device-${topWeakDevice.deviceType}`,
      dimension: 'interaction_logic',
      severity: topWeakDevice.weakestRate < 20 ? 'critical' : 'warning',
      title: `${mapDeviceLabel(topWeakDevice.deviceType)}出现设备侧主断点`,
      detail: `${mapDeviceLabel(topWeakDevice.deviceType)}当前最弱链路是${weakestLinkLabel}，最低转化只有 ${topWeakDevice.weakestRate}%。`,
      action: weakestLinkLabel === '注册完成'
        ? '优先检查这端验证码输入、提交反馈和验证完成后的跳转承接，避免高意向注册在设备端被卡死。'
        : weakestLinkLabel === '工具启动'
          ? '优先检查这端工具首屏 CTA、输入门槛和提交后反馈，避免“看了但没跑”。'
          : '优先检查这端结果页首屏 CTA、追问文案和聊天入口位置，避免报告被看完后没有下一步。',
      source: 'analytics.deviceFunnelBreakdown',
    });
  }
  if ((topBouncePage?.views || 0) >= 10 && (topBouncePage?.bounceRate || 0) >= 70) {
    pushPriority(priorityQueue, {
      key: `interaction-bounce-${topBouncePage.page}`,
      dimension: 'interaction_logic',
      severity: 'warning',
      title: '高曝光页面跳出偏高',
      detail: `${topBouncePage.page} 当前跳出率 ${topBouncePage.bounceRate}% ，已有 ${topBouncePage.views} 次查看。`,
      action: topBouncePage.action,
      source: 'admin-quality-workboard',
    });
  }
  const interactionEvidence = uniqueStrings([
    weakRetentionWorkbenchSource ? `复访工作台弱入口 ${mapCtaSourceFamilyLabel(weakRetentionWorkbenchSource.sourceFamily)} / CTA->chat ${weakRetentionWorkbenchSource.clickToChatRate}% / 完成 ${weakRetentionWorkbenchSource.chatCompletionRate}%` : null,
    strongRetentionWorkbenchSource ? `复访工作台最强入口 ${mapCtaSourceFamilyLabel(strongRetentionWorkbenchSource.sourceFamily)} / CTA->chat ${strongRetentionWorkbenchSource.clickToChatRate}% / 完成 ${strongRetentionWorkbenchSource.chatCompletionRate}%` : null,
    weakRecallReportSource ? `报告召回弱来源 ${weakRecallReportSource.source} / 聊天完成 ${weakRecallReportSource.chatCompletionRate}%` : null,
    weakRecallToolSource ? `工具召回弱来源 ${weakRecallToolSource.source} / sent->run ${weakRecallToolSource.sentToRunRate}%` : null,
    weakestSourceFunnel ? `主来源漏斗弱来源 ${weakestSourceFunnel.source} / view->chat ${weakestSourceFunnel.viewToChatRate}%` : null,
    weakestSourceDeviceFunnel ? `来源设备断点 ${weakestSourceDeviceFunnel.source} @ ${mapDeviceLabel(weakestSourceDeviceFunnel.deviceType)} / view->chat ${weakestSourceDeviceFunnel.viewToChatRate}%` : null,
    strongestSourceShift ? `短期来源变化 ${strongestSourceShift.source} / ${strongestSourceShift.direction} / chat ${strongestSourceShift.viewToChatRateDelta >= 0 ? '+' : ''}${strongestSourceShift.viewToChatRateDelta}pt` : null,
    weakestWeeklySource ? `周来源弱承接 ${weakestWeeklySource.source} / view->chat ${weakestWeeklySource.viewToChatRate}%` : null,
    reportToChat ? `结果页 -> 聊天 ${reportToChat.currentRate}% (${reportToChat.rateDelta >= 0 ? '+' : ''}${reportToChat.rateDelta})` : null,
    reportToEvent ? `结果页 -> 事件 ${reportToEvent.currentRate}% (${reportToEvent.rateDelta >= 0 ? '+' : ''}${reportToEvent.rateDelta})` : null,
    toolToRun ? `工具详情 -> 开跑 ${toolToRun.currentRate}% (${toolToRun.rateDelta >= 0 ? '+' : ''}${toolToRun.rateDelta})` : null,
    topWeakDevice ? `${mapDeviceLabel(topWeakDevice.deviceType)}最弱链路 ${topWeakDevice.weakestRate}%` : null,
    topToolGap ? `头号工具断点 ${topToolGap.slug} / ${topToolGap.gapType}` : null,
  ]);
  if (strongRetentionWorkbenchSource && strongRetentionWorkbenchSource.chatCompletionRate >= 50 && strongRetentionWorkbenchSource.clickToChatRate >= 60) {
    wins.push(`复访工作台在${mapCtaSourceFamilyLabel(strongRetentionWorkbenchSource.sourceFamily)}上已经能稳定把回访带回聊天。`);
  }
  if ((overview.recentBehaviorShift?.signals || []).length > 0) {
    wins.push(...overview.recentBehaviorShift.signals.slice(0, 2));
  }

  let developmentEfficiencyScore = 90;
  const latestCycleHours = hoursSince(latestCycle?.finishedAt);
  const successfulOpenAgentReviews = [siteGovernor, opsTriage, reportReliability]
    .filter((item) => item?.status === 'success')
    .length;
  if (validationChecks.length === 0) {
    developmentEfficiencyScore = Math.min(developmentEfficiencyScore, CHECK_SCORE_CAP_WITHOUT_EVIDENCE);
  }
  if (!latestCycle) {
    developmentEfficiencyScore -= 16;
  } else if (!latestCycle.success) {
    developmentEfficiencyScore -= 18;
  } else if ((latestCycleHours || 0) > 72) {
    developmentEfficiencyScore -= 8;
  }
  if (siteGovernor?.status !== 'success') {
    developmentEfficiencyScore -= 6;
  }
  if (opsTriage?.status !== 'success') {
    developmentEfficiencyScore -= 4;
  }
  if (reportReliability?.status !== 'success') {
    developmentEfficiencyScore -= 4;
  }
  if (systemOps.services.content.severity === 'critical' || systemOps.services.knowledge.severity === 'critical') {
    developmentEfficiencyScore -= 8;
  } else if (systemOps.services.content.severity === 'warning' || systemOps.services.knowledge.severity === 'warning') {
    developmentEfficiencyScore -= 3;
  }
  developmentEfficiencyScore = clampScore(developmentEfficiencyScore);
  if (validationChecks.length === 0) {
    pushPriority(priorityQueue, {
      key: 'dev-efficiency-missing-fixed-evals',
      dimension: 'development_efficiency',
      severity: 'warning',
      title: '固定评估器还没有完全制度化',
      detail: '治理器已经能聚合运行态和漏斗，但还没有持续吃到 build/lint/test/QA 结果。',
      action: '把固定评估结果写进每轮开发默认流程，避免“感觉改好了”代替真实验证。',
      source: 'site-quality-governor',
    });
  }
  if (!latestCycle) {
    pushPriority(priorityQueue, {
      key: 'dev-efficiency-missing-cycle-ledger',
      dimension: 'development_efficiency',
      severity: 'warning',
      title: '最近没有自治循环账本样本',
      detail: '说明最近的自动化评估与优先级留痕还不稳定。',
      action: '让站点质量 governor 进入固定周期执行，并把最新快照作为运维与产品复盘入口。',
      source: 'world-yi-autonomous-cycle-ledger',
    });
  } else if (!latestCycle.success) {
    pushPriority(priorityQueue, {
      key: 'dev-efficiency-latest-cycle-failed',
      dimension: 'development_efficiency',
      severity: 'critical',
      title: '最近一次自治循环没有完整成功',
      detail: `失败阶段：${latestCycle.failedPhaseKeys.join('、') || 'unknown'}`,
      action: '先把自治链路重新跑通，否则评估与执行会重新退回人工、碎片化状态。',
      source: 'world-yi-autonomous-cycle-ledger',
    });
  }
  if (siteGovernor?.status !== 'success') {
    pushPriority(priorityQueue, {
      key: 'dev-efficiency-site-governor-review',
      dimension: 'development_efficiency',
      severity: 'info',
      title: 'OpenAgent 站点治理复审还没有稳定接入',
      detail: '现有仓库已经具备 site governor 能力，但还需要把它纳入默认自治循环与固定复盘流程。',
      action: '把 OpenAgent site governor review 纳入自治循环，并和本地 quality governor 快照一起保存。',
      source: 'open-agent-site-governor',
    });
  }
  const developmentEvidence = uniqueStrings([
    latestCycle ? `最近自治循环 ${latestCycle.success ? '成功' : '失败'} / ${latestCycle.mode}` : '还没有自治循环账本样本',
    latestCycleHours !== null ? `最近自治循环距今 ${latestCycleHours} 小时` : null,
    `OpenAgent 质量评审成功快照 ${successfulOpenAgentReviews}/3`,
    validationChecks.length > 0 ? `固定检查接入 ${validationChecks.length} 项` : '固定检查尚未接入',
  ]);
  if (latestCycle?.success && successfulOpenAgentReviews >= 2) {
    wins.push('自动化账本与质量复审基础已经成型，可以开始按固定回合做小步优化。');
  }

  if (siteGovernor?.status === 'success') {
    const topConversionWorkstream = siteGovernor.plan.workstreams.find((item) => item.area === 'conversion');
    if (topConversionWorkstream) {
      pushPriority(priorityQueue, {
        key: `open-agent-workstream-${topConversionWorkstream.target}`,
        dimension: 'interaction_logic',
        severity: topConversionWorkstream.priority === 'P0' ? 'critical' : 'warning',
        title: topConversionWorkstream.target,
        detail: topConversionWorkstream.issue,
        action: topConversionWorkstream.action,
        source: 'open-agent-site-governor',
      });
    }
    const topPerformanceWorkstream = siteGovernor.plan.workstreams.find((item) => item.area === 'performance');
    if (topPerformanceWorkstream) {
      pushPriority(priorityQueue, {
        key: `open-agent-performance-${topPerformanceWorkstream.target}`,
        dimension: 'stability',
        severity: topPerformanceWorkstream.priority === 'P0' ? 'critical' : 'warning',
        title: topPerformanceWorkstream.target,
        detail: topPerformanceWorkstream.issue,
        action: topPerformanceWorkstream.action,
        source: 'open-agent-site-governor',
      });
    }
  }

  const dimensions: SiteQualityDimensionScore[] = [
    {
      key: 'compatibility',
      label: '兼容性',
      score: compatibilityScore,
      status: statusFromScore(compatibilityScore),
      summary: buildCompatibilitySummary({
        score: compatibilityScore,
        failedChecks,
        missingSessionPageViews: retro.analytics.missingSessionPageViews,
        evidenceCount: checkEvidenceCount,
      }),
      evidence: compatibilityEvidence,
    },
    {
      key: 'stability',
      label: '稳定性',
      score: stabilityScore,
      status: statusFromScore(stabilityScore),
      summary: buildStabilitySummary({
        score: stabilityScore,
        llmAttempts24h: llmSnapshot.attempts24h || 0,
        llmSuccessRate24h: llmSnapshot.successRate24h || 0,
        fallbackRate: retro.reports.fallbackRate || 0,
        weakestRoute: weakestRoute || null,
      }),
      evidence: stabilityEvidence,
    },
    {
      key: 'interaction_logic',
      label: '交互逻辑',
      score: interactionScore,
      status: statusFromScore(interactionScore),
      summary: buildInteractionSummary({
        score: interactionScore,
        reportToChat,
        reportToEvent,
        toolToRun,
        topWeakDevice: topWeakDevice || null,
        topToolGap: topToolGap || null,
        weakRecallReportSource: weakRecallReportSource || null,
        weakRecallToolSource: weakRecallToolSource || null,
        weakRetentionWorkbenchSource: weakRetentionWorkbenchSource || null,
      }),
      evidence: interactionEvidence,
    },
    {
      key: 'development_efficiency',
      label: '开发效率',
      score: developmentEfficiencyScore,
      status: statusFromScore(developmentEfficiencyScore),
      summary: buildDevEfficiencySummary({
        score: developmentEfficiencyScore,
        latestCycleHours,
        latestCycleSuccess: !!latestCycle?.success,
        checkCount: validationChecks.length,
        successfulOpenAgentReviews,
      }),
      evidence: developmentEvidence,
    },
  ];

  const overallScore = clampScore(
    compatibilityScore * 0.18
    + stabilityScore * 0.32
    + interactionScore * 0.32
    + developmentEfficiencyScore * 0.18
  );
  const status = statusFromScore(overallScore);
  const weakestDimension = [...dimensions].sort((left, right) => left.score - right.score)[0];
  const sortedPriorityCandidates = [...priorityQueue]
    .sort((left, right) => {
      const severityDelta = prioritySeverityRank(right.severity) - prioritySeverityRank(left.severity);
      if (severityDelta !== 0) return severityDelta;
      return left.dimension.localeCompare(right.dimension);
    });
  const guaranteedDimensionItems: SiteQualityPriorityItem[] = [];
  const guaranteedDimensions = new Set<SiteQualityDimensionKey>();
  for (const item of sortedPriorityCandidates) {
    if (guaranteedDimensions.has(item.dimension)) {
      continue;
    }
    guaranteedDimensionItems.push(item);
    guaranteedDimensions.add(item.dimension);
  }
  const selectedPriorityKeys = new Set(guaranteedDimensionItems.map((item) => item.key));
  const sortedPriorityQueue = [
    ...guaranteedDimensionItems,
    ...sortedPriorityCandidates.filter((item) => !selectedPriorityKeys.has(item.key)),
  ].slice(0, priorityLimit);
  const risks = sortedPriorityQueue
    .slice(0, 6)
    .map((item) => `${item.title}：${item.detail}`);

  const summary = uniqueStrings([
    weakestDimension
      ? `当前最弱维度是${weakestDimension.label}（${weakestDimension.score} 分）。`
      : '',
    overview.recentBehaviorShift?.warnings?.[0] || '',
    topToolGap?.gapType === 'cta_to_run' || topToolGap?.gapType === 'start_cta'
      ? '工具探索已经有了，但启动链路还没有接住意图最强的用户。'
      : '',
    status === 'healthy'
      ? '现在最适合做窄幅优化并持续比较改动前后效果。'
      : '当前不应该靠感觉扩功能，应该优先修复分数最低和优先级最高的链路。',
  ]).join(' ');

  const snapshot: SiteQualityGovernorSnapshot = {
    generatedAt: new Date().toISOString(),
    doctrine: '固定评估器 + 小步修改 + 统一比较窗口 + 只保留胜出的改动',
    retroWindowMinutes,
    overallScore,
    status,
    summary,
    wins: uniqueStrings([
      ...wins,
      ...(systemOps.healthySignals || []).slice(0, 2),
    ]).slice(0, 6),
    risks,
    dimensions,
    priorityQueue: sortedPriorityQueue,
    validationChecks,
    evidence: {
      behaviorWindow: {
        currentStart: overview.recentBehaviorShift?.window?.currentStart,
        currentEnd: overview.recentBehaviorShift?.window?.currentEnd,
        previousStart: overview.recentBehaviorShift?.window?.previousStart,
        previousEnd: overview.recentBehaviorShift?.window?.previousEnd,
        compareLabel: overview.recentBehaviorShift?.window?.compareLabel,
      },
      systemHealth: {
        severity: systemOps.severity,
        title: systemOps.title,
        blockers: systemOps.blockers.slice(0, 4),
        healthySignals: systemOps.healthySignals.slice(0, 4),
      },
      interaction: {
        funnel: (overview.recentBehaviorShift?.funnel || []).map((item) => ({
          key: item.key,
          label: item.label,
          currentRate: item.currentRate,
          previousRate: item.previousRate,
          rateDelta: item.rateDelta,
        })),
        topToolGap: topToolGap ? {
          slug: topToolGap.slug,
          gapType: topToolGap.gapType,
          priorityScore: topToolGap.priorityScore,
          action: topToolGap.action,
        } : undefined,
        topBouncePage: topBouncePage ? {
          page: topBouncePage.page,
          bounceRate: topBouncePage.bounceRate,
          views: topBouncePage.views,
          action: topBouncePage.action,
        } : undefined,
      },
      stability: {
        llmSuccessRate24h: llmSnapshot.successRate24h || 0,
        llmAttempts24h: llmSnapshot.attempts24h || 0,
        openModelCount: llmSnapshot.openModelCount || 0,
        halfOpenModelCount: llmSnapshot.halfOpenModelCount || 0,
        fallbackRate: retro.reports.fallbackRate || 0,
        weakestRoute: weakestRoute ? {
          key: weakestRoute.key,
          label: weakestRoute.label,
          successRate: weakestRoute.successRate,
          failed: weakestRoute.failed,
          fallbackRate: weakestRoute.fallbackRate,
        } : undefined,
      },
      autonomy: {
        latestCycleAt: latestCycle?.finishedAt,
        latestCycleSuccess: !!latestCycle?.success,
        latestCycleMode: latestCycle?.mode,
        latestSiteGovernorStatus: siteGovernor?.status,
        latestOpsTriageStatus: opsTriage?.status,
        latestReportReliabilityStatus: reportReliability?.status,
      },
    },
  };

  return snapshot;
}

export function writeSiteQualityGovernorSnapshot(snapshot: SiteQualityGovernorSnapshot) {
  ensureRuntimeDir();
  fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

export function writeSiteQualityValidationChecksSnapshot(checks: SiteQualityCheckResult[]) {
  ensureRuntimeDir();
  fs.writeFileSync(VALIDATION_CHECKS_FILE, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    checks,
  }, null, 2)}\n`, 'utf8');
  return checks;
}

export function refreshSiteQualityGovernorSnapshot(params?: {
  retroWindowMinutes?: number;
  validationChecks?: SiteQualityCheckResult[];
  priorityLimit?: number;
}) {
  return writeSiteQualityGovernorSnapshot(buildSiteQualityGovernorSnapshot(params));
}

export function readSiteQualityGovernorSnapshot() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) as SiteQualityGovernorSnapshot;
  } catch {
    return null;
  }
}

export function renderSiteQualityGovernorTextReport(snapshot: SiteQualityGovernorSnapshot) {
  const lines: string[] = [];
  lines.push('# Site Quality Governor');
  lines.push('');
  lines.push(`generatedAt: ${snapshot.generatedAt}`);
  lines.push(`overallScore: ${snapshot.overallScore}`);
  lines.push(`status: ${snapshot.status}`);
  lines.push(`retroWindowMinutes: ${snapshot.retroWindowMinutes}`);
  lines.push(`doctrine: ${snapshot.doctrine}`);
  lines.push('');
  lines.push(`summary: ${snapshot.summary}`);
  lines.push('');
  lines.push('## Dimensions');
  snapshot.dimensions.forEach((dimension) => {
    lines.push(`- ${dimension.label}: ${dimension.score} (${dimension.status})`);
    lines.push(`  summary: ${dimension.summary}`);
    dimension.evidence.slice(0, 3).forEach((item) => {
      lines.push(`  evidence: ${item}`);
    });
  });
  lines.push('');
  lines.push('## Priority Queue');
  if (snapshot.priorityQueue.length === 0) {
    lines.push('- none');
  } else {
    snapshot.priorityQueue.forEach((item, index) => {
      lines.push(`${index + 1}. [${item.severity}] ${item.title}`);
      lines.push(`   dimension: ${item.dimension}`);
      lines.push(`   detail: ${item.detail}`);
      lines.push(`   action: ${item.action}`);
      lines.push(`   source: ${item.source}`);
    });
  }
  lines.push('');
  lines.push('## Wins');
  if (snapshot.wins.length === 0) {
    lines.push('- none');
  } else {
    snapshot.wins.forEach((item) => lines.push(`- ${item}`));
  }
  lines.push('');
  lines.push('## Risks');
  if (snapshot.risks.length === 0) {
    lines.push('- none');
  } else {
    snapshot.risks.forEach((item) => lines.push(`- ${item}`));
  }

  return `${lines.join('\n')}\n`;
}
