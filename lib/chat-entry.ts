import type { ReportActionSuggestion } from '@/lib/report-v2';

function cleanQueryValue(value?: string | null) {
  const normalized = `${value || ''}`.trim();
  return normalized ? normalized : '';
}

export function normalizeAttributionSource(value?: string | null) {
  const source = cleanQueryValue(value);
  if (!source) return '';

  const collapsedSegments: string[] = [];
  for (const segment of source.split(':')) {
    const cleanSegment = segment.trim();
    if (!cleanSegment || cleanSegment === collapsedSegments[collapsedSegments.length - 1]) continue;
    collapsedSegments.push(cleanSegment);
  }

  return collapsedSegments.join(':');
}

export function buildReportChatSource(entrySource?: string | null) {
  const source = normalizeAttributionSource(entrySource);
  if (!source) return 'result_report_followup';
  if (source === 'result_report_followup' || source.startsWith('result_report_followup:')) return source;
  if (source.startsWith('lifecycle_report_followup')) return source;

  return `result_report_followup:${source}`;
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
  const source = normalizeAttributionSource(params.source);
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
// v5-B4 (2026-05-08): 接入更多上下文（场景视图、纠偏洞察、最逾期事件）
// 让用户在结果页第一屏就看到「哦原来可以这样问」——这是承接率从 8% 拉到 25% 的关键
export interface ReportFollowupSuggestion {
  // 显示在卡片上的短标题（≤ 12 字）
  label: string;
  // 实际预填到聊天的完整问题
  question: string;
  // 用于埋点 / 分析
  intent: 'next-action' | 'window' | 'risk' | 'pattern' | 'general' | 'scenario' | 'correction' | 'event-validation';
}

// v5-B4 上下文化追问生成的输入
// 每个字段都是可选 — 缺失项时该路径自动跳过
export function buildReportFollowupSuggestions(params: {
  publicName?: string;
  patternType?: string | null;
  dayMaster?: string | null;
  actionSuggestions?: Array<{ title?: string; description?: string }> | null;
  topMonthlyWindow?: { label?: string; theme?: string; status?: string } | null;
  hasRiskScenario?: boolean;
  // v5-B4 新增字段
  cautionScenario?: { title?: string; summary?: string; risks?: string[] } | null;
  pushScenario?: { title?: string; summary?: string; focus?: string[] } | null;
  correctionLevel?: 'healthy' | 'watch' | 'action' | null;
  correctionSummary?: string | null;
  pendingOverdueEvent?: { title?: string; date?: string; overdueDays?: number } | null;
}): ReportFollowupSuggestion[] {
  const suggestions: ReportFollowupSuggestion[] = [];
  const name = params.publicName || '我';

  // ────── 优先级 1：复盘逾期事件（最具体、最有反馈闭环价值）──────
  const pe = params.pendingOverdueEvent;
  if (pe?.title && pe.overdueDays && pe.overdueDays >= 3) {
    suggestions.push({
      label: `回收"${pe.title.slice(0, 8)}"`,
      question: `${pe.date} 我预设的"${pe.title}"已经过去 ${pe.overdueDays} 天，结果如何？请帮我对照原报告的判断，看哪一项验证准了、哪一项偏了，下次同类事件该怎么修正。`,
      intent: 'event-validation',
    });
  }

  // ────── 优先级 2：风险/警示场景（明确指向需要"先避坑"）──────
  const cs = params.cautionScenario;
  if (cs?.title) {
    const riskBullet = cs.risks?.[0] ? `（具体警示：${cs.risks[0]}）` : '';
    suggestions.push({
      label: `${cs.title}的坑怎么避`,
      question: `${name}的${cs.title}当前是 caution 状态${cs.summary ? `——${cs.summary}` : ''}${riskBullet}。请帮我把这个警示翻译成 3 条"现在不要做"的具体动作，以及一个"什么时候可以重新启动"的判断条件。`,
      intent: 'scenario',
    });
  }

  // ────── 优先级 3：纠偏 action 级别（用户已经偏了需要修正）──────
  if (params.correctionLevel === 'action') {
    suggestions.push({
      label: '当前最该纠的偏差',
      question: `报告显示${name}有需要纠偏的判断${params.correctionSummary ? `：${params.correctionSummary}` : ''}。请告诉我：偏差更可能来自时机、执行还是信息判断失真？如果重做一次，节奏应该前移、后移还是分段？给我下一次同类事件的 3 条纠偏检查点。`,
      intent: 'correction',
    });
  }

  // ────── 优先级 4：第一个动作建议（最具体的下一步）──────
  const primaryAction = params.actionSuggestions?.[0];
  if (primaryAction?.title) {
    suggestions.push({
      label: `怎么推进「${primaryAction.title}」`,
      question: `请围绕"${primaryAction.title}"这个动作${primaryAction.description ? `（${primaryAction.description.slice(0, 30)}）` : ''}，按结构、阶段、环境、动作四层继续拆解：${name}现在该怎么推进，先满足什么条件，最需要防什么偏差？`,
      intent: 'next-action',
    });
  }

  // ────── 优先级 5：push 场景（可以加速的领域）──────
  const ps = params.pushScenario;
  if (ps?.title && !cs) {
    const focusBullet = ps.focus?.[0] ? `（重点是 ${ps.focus[0]}）` : '';
    suggestions.push({
      label: `${ps.title}怎么加速`,
      question: `${name}的${ps.title}当前是 push 状态${focusBullet}。请帮我把这个机会翻译成 3 条"现在该做"的动作，以及怎么判断什么时候要从激进切回稳健。`,
      intent: 'scenario',
    });
  }

  // ────── 优先级 6：最近月运窗口 ──────
  if (params.topMonthlyWindow?.label) {
    const win = params.topMonthlyWindow;
    suggestions.push({
      label: `${win.label} 怎么用`,
      question: `${win.label}这个窗口对${name}来说意味着什么？${win.theme ? `主题是"${win.theme}"。` : ''}我应该在这个时间点做什么、避开什么，怎么和当前主线动作对齐？`,
      intent: 'window',
    });
  }

  // ────── 优先级 7：格局结构层（永远兜底）──────
  if (params.patternType && params.patternType !== '未知') {
    suggestions.push({
      label: `${params.patternType}怎么落地`,
      question: `${name}是${params.patternType}${params.dayMaster ? `（日主${params.dayMaster}）` : ''}。这个格局在我当前的人生阶段，怎么落地成具体可执行的判断框架？哪些场景是顺势、哪些场景需要小心？`,
      intent: 'pattern',
    });
  }

  // ────── 优先级 8：风险通用问法（仅在以上都不够 3 条时补） ──────
  if (suggestions.length < 3 && params.hasRiskScenario) {
    suggestions.push({
      label: '当前最大风险',
      question: `${name}这份报告里最容易被忽略、但其实风险最高的判断点是哪个？为什么是它，我现在该用什么动作来对冲？`,
      intent: 'risk',
    });
  }

  // ────── 通用兜底（确保至少 1 条）──────
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

