import type { ReportActionSuggestion } from '@/lib/report-v2';

function cleanQueryValue(value?: string | null) {
  const normalized = `${value || ''}`.trim();
  return normalized ? normalized : '';
}

export function buildChatHref(params: {
  reportId?: string | null;
  eventId?: string | null;
  intent?: string | null;
  question?: string | null;
  source?: string | null;
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
}) {
  const query = new URLSearchParams();
  const reportId = cleanQueryValue(params.reportId);
  const eventId = cleanQueryValue(params.eventId);
  const intent = cleanQueryValue(params.intent);
  const question = cleanQueryValue(params.question);
  const source = cleanQueryValue(params.source);
  const ctaStrategyKey = cleanQueryValue(params.ctaStrategyKey);
  const sourceFamily = cleanQueryValue(params.sourceFamily);

  if (reportId) query.set('reportId', reportId);
  if (eventId) query.set('eventId', eventId);
  if (intent) query.set('intent', intent);
  if (question) query.set('question', question);
  if (source) query.set('source', source);
  if (ctaStrategyKey) query.set('ctaStrategyKey', ctaStrategyKey);
  if (sourceFamily) query.set('sourceFamily', sourceFamily);

  const serialized = query.toString();
  return serialized ? `/chat?${serialized}` : '/chat';
}

export function buildReportFollowupQuestion(params: {
  actionSuggestions?: ReportActionSuggestion[] | null;
  defaultQuestion?: string | null;
}) {
  const primarySuggestion = params.actionSuggestions?.[0];
  if (primarySuggestion) {
    return `请围绕“${primarySuggestion.title}”这个动作，按结构、阶段、环境、动作四层继续拆解：我现在该怎么推进，先满足什么条件，最需要防什么偏差？`;
  }

  return cleanQueryValue(params.defaultQuestion)
    || '请围绕我这份报告里当前最重要的主线，按结构、阶段、环境、动作四层继续拆解：我现在最该先做什么，为什么，最需要防什么误判？';
}

// v5-B1 (2026-05-08): 把单条 followup 升级成 3 条上下文化追问
// 让用户在结果页第一屏就看到「哦原来可以这样问」——这是承接率从 8% 拉到 25% 的关键
export interface ReportFollowupSuggestion {
  // 显示在卡片上的短标题（≤ 12 字）
  label: string;
  // 实际预填到聊天的完整问题
  question: string;
  // 用于埋点 / 分析
  intent: 'next-action' | 'window' | 'risk' | 'pattern' | 'general';
}

export function buildReportFollowupSuggestions(params: {
  publicName?: string;
  patternType?: string | null;
  dayMaster?: string | null;
  actionSuggestions?: ReportActionSuggestion[] | null;
  topMonthlyWindow?: { label?: string; theme?: string; status?: string } | null;
  hasRiskScenario?: boolean;
}): ReportFollowupSuggestion[] {
  const suggestions: ReportFollowupSuggestion[] = [];
  const name = params.publicName || '我';

  // 1) 第一条：围绕最近一个动作建议（最具体）
  const primaryAction = params.actionSuggestions?.[0];
  if (primaryAction) {
    suggestions.push({
      label: `怎么推进「${primaryAction.title}」`,
      question: `请围绕"${primaryAction.title}"这个动作，按结构、阶段、环境、动作四层继续拆解：${name}现在该怎么推进，先满足什么条件，最需要防什么偏差？`,
      intent: 'next-action',
    });
  }

  // 2) 第二条：围绕最近的窗口/月份（时间锚点）
  if (params.topMonthlyWindow?.label) {
    const win = params.topMonthlyWindow;
    suggestions.push({
      label: `${win.label} 怎么用`,
      question: `${win.label}这个窗口对${name}来说意味着什么？${win.theme ? `主题是"${win.theme}"。` : ''}我应该在这个时间点做什么、避开什么，怎么和当前主线动作对齐？`,
      intent: 'window',
    });
  }

  // 3) 第三条：围绕格局或日主（结构层）— 永远会有
  if (params.patternType && params.patternType !== '未知') {
    suggestions.push({
      label: `${params.patternType}怎么落地`,
      question: `${name}是${params.patternType}${params.dayMaster ? `（日主${params.dayMaster}）` : ''}。这个格局在我当前的人生阶段，怎么落地成具体可执行的判断框架？哪些场景是顺势、哪些场景需要小心？`,
      intent: 'pattern',
    });
  }

  // 4) 兜底：风险/警示问法（如果以上都不到 3 条）
  if (suggestions.length < 3 && params.hasRiskScenario) {
    suggestions.push({
      label: '当前最大风险',
      question: `${name}这份报告里最容易被忽略、但其实风险最高的判断点是哪个？为什么是它，我现在该用什么动作来对冲？`,
      intent: 'risk',
    });
  }

  // 5) 通用兜底
  if (suggestions.length === 0) {
    suggestions.push({
      label: '主线该怎么走',
      question: `请围绕${name}这份报告里当前最重要的主线，按结构、阶段、环境、动作四层继续拆解：我现在最该先做什么，为什么，最需要防什么误判？`,
      intent: 'general',
    });
  }

  // 最多取 3 条
  return suggestions.slice(0, 3);
}

