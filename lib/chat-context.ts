import type { EventRecord, FortuneRecord, ToolSessionRecord } from '@/lib/user-types';
import { formatLocalDateKey, getCurrentLocalMonthKey } from '@/lib/utils';
import { getChatIntentPreset, type ChatIntent } from '@/lib/chat-intent';
import {
  getEventTransportSortTime,
  type EventDateKey,
  type EventViewImpact,
  type EventViewType,
} from '@/lib/event-view';
import { summarizeToolSessions } from '@/lib/tool-context';
import {
  buildConfidenceAnalysis,
  buildMonthlyWindows,
  buildReportActionSuggestions,
  buildScenarioViews,
  type ReportActionSuggestion,
} from '@/lib/report-v2';
import {
  buildTacitKnowledgeFocusTags,
  buildTacitKnowledgeSummary,
  sanitizeTacitKnowledgeInput,
} from '@/lib/tacit-knowledge';

export interface ChatContextEvent {
  id: string;
  title: string;
  date: EventDateKey;
  type: EventViewType;
  impact: EventViewImpact;
  validationStatus: 'accurate' | 'drift' | 'pending';
  reportId?: string;
  reason?: string;
  notes?: string;
}

export interface ChatReportContext {
  id: string;
  name: string;
  dayMaster: string;
  pattern: string;
  currentDaYun: string;
  currentLiuNian: string;
  yongShen: string[];
  topScenario: string;
  bestWindow: string;
  riskWindow: string;
  confidenceLevel: string;
}

export interface ChatCorrectionPrompt {
  key: string;
  question: string;
  helper: string;
}

export interface ChatExperienceContext {
  intent?: ChatIntent;
  summary: string;
  focusAreas: string[];
  suggestedPrompts: string[];
  correctionPrompts: ChatCorrectionPrompt[];
  recentEvents: ChatContextEvent[];
  recentTools?: Array<{
    toolSlug: string;
    toolTitle: string;
    category: string;
    headline: string;
    recommendedAction: string;
  }>;
  suggestedEventDrafts: ReportActionSuggestion[];
  validationSummary?: {
    accurateCount: number;
    driftCount: number;
    pendingCount: number;
    headline: string;
  };
  confirmedPastEventCount?: number;
  focusedEvent?: ChatContextEvent;
  report?: ChatReportContext;
}

export interface ChatEventDraft {
  title: string;
  type: EventViewType;
  date: EventDateKey;
  impact: EventViewImpact;
  description: string;
  reminderAdvanceDays: number;
  fortuneAnalysis: {
    source: 'chat_message';
    reportId?: string;
    question: string;
    answerSummary: string;
  };
  followUpAdvice: {
    shortTerm: string;
    longTerm: string;
  };
}

const GENERIC_PROMPTS = [
  '结合我的命局，现在最该优先推进哪一个方向？',
  '未来三个月最需要规避的风险是什么？',
  '如果我只能做一件事来改善当前节奏，最值得做什么？',
];

export function buildChatExperienceContext(params: {
  report?: FortuneRecord | null;
  events?: EventRecord[];
  toolSessions?: ToolSessionRecord[];
  focusEventId?: string;
  intent?: ChatIntent;
  now?: Date;
}): ChatExperienceContext {
  const now = params.now || new Date();
  const intentPreset = getChatIntentPreset(params.intent);
  const events = (params.events || [])
    .slice()
    .sort((left, right) => getEventTransportSortTime(left) - getEventTransportSortTime(right));
  const recentReferenceEvents = getReferenceEvents(events, now);
  const validationSummary = buildValidationSummary(events);
  const confirmedPastEvents = getConfirmedPastEvents(events).map(mapEvent);
  const toolMemory = summarizeToolSessions(params.toolSessions || [], params.report || null, 4);
  const focusedEvent = params.focusEventId ? events.find((item) => item.id === params.focusEventId) : undefined;
  const mappedFocusedEvent = focusedEvent ? mapEvent(focusedEvent) : undefined;
  const correctionPrompts = buildCorrectionPrompts(mappedFocusedEvent, params.report || null);

  if (!params.report) {
    return {
      intent: params.intent,
      summary: [
        intentPreset ? `当前会话已进入${intentPreset.entryLabel}。${intentPreset.helper}` : '',
        buildNoReportSummary(events),
        mappedFocusedEvent
          ? `当前用户希望围绕事件“${mappedFocusedEvent.title}”做纠偏分析。请优先解释偏差更可能来自时机、执行还是信息缺口。`
          : '',
      ].filter(Boolean).join('\n'),
      focusAreas: [
        intentPreset ? `专项：${intentPreset.entryLabel}` : '',
        ...(events.length > 0 ? ['最近事件复盘', '现实节奏校验'] : ['命局主轴', '阶段节奏', '风险规避']),
        ...(toolMemory?.focusAreas?.length ? [`最近工具：${toolMemory.focusAreas.join('、')}`] : []),
        validationSummary.headline,
        confirmedPastEvents.length > 0 ? `已确认历史印证：${confirmedPastEvents.length} 条` : '',
        mappedFocusedEvent ? `焦点事件：${mappedFocusedEvent.title}` : '',
      ].filter(Boolean),
      suggestedPrompts: buildPromptList(
        [...(intentPreset?.questions || []), ...GENERIC_PROMPTS],
        events,
        mappedFocusedEvent,
        correctionPrompts
      ),
      correctionPrompts,
      recentEvents: recentReferenceEvents.map(mapEvent),
      recentTools: toolMemory?.recentSessions?.map((item) => ({
        toolSlug: item.toolSlug,
        toolTitle: item.toolTitle,
        category: item.category,
        headline: item.headline,
        recommendedAction: item.recommendedAction,
      })) || [],
      suggestedEventDrafts: [],
      validationSummary,
      confirmedPastEventCount: confirmedPastEvents.length,
      focusedEvent: mappedFocusedEvent,
    };
  }

  const report = params.report;
  const tacitKnowledge = sanitizeTacitKnowledgeInput(report.analysis?.contextSignals?.tacitKnowledge);
  const tacitSummary = buildTacitKnowledgeSummary(tacitKnowledge);
  const tacitTags = buildTacitKnowledgeFocusTags(tacitKnowledge);
  const reportInput = {
    basic: report.bazi,
    fiveElements: report.fiveElements,
    tenGods: report.tenGods,
    pattern: report.pattern,
    fortune: report.fortune,
    advice: report.advice,
    evidence: report.evidence,
    analysis: report.analysis,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  };
  const scenarios = buildScenarioViews(reportInput);
  const calendarAnchor = getCurrentLocalMonthKey(now) || now;
  const windows = buildMonthlyWindows(reportInput, calendarAnchor);
  const confidence = buildConfidenceAnalysis(reportInput);
  const topScenario = scenarios
    .filter((item) => item.key !== 'overall')
    .sort((left, right) => right.score - left.score)[0];
  const bestWindow = [...windows].sort((left, right) => right.score - left.score)[0];
  const riskWindow = [...windows].sort((left, right) => left.score - right.score)[0];
  const recentEvents = recentReferenceEvents.map(mapEvent);
  const focusAreas = [
    intentPreset ? `专项：${intentPreset.entryLabel}` : '',
    report.pattern?.type ? `格局：${report.pattern.type}` : '',
    report.fortune?.currentDaYun ? `阶段：${report.fortune.currentDaYun}` : '',
    (report.advice?.yongShen || []).length > 0 ? `用神：${report.advice?.yongShen.join('、')}` : '',
    topScenario ? `主战场：${topScenario.actionLabel}` : '',
    bestWindow ? `最近优先窗口：${bestWindow.label}` : '',
    ...tacitTags.map((item) => `隐性状态：${item}`),
    validationSummary.headline,
    mappedFocusedEvent ? `焦点事件：${mappedFocusedEvent.title}` : '',
    confirmedPastEvents.length > 0 ? `已确认历史印证：${confirmedPastEvents.length} 条` : '',
  ].filter(Boolean);
  const suggestedPrompts = buildPromptList(
    [
      ...(intentPreset?.questions || []),
      mappedFocusedEvent ? `围绕“${mappedFocusedEvent.title}”这件事，最可能的偏差原因是什么？` : '',
      mappedFocusedEvent ? `如果我要修正“${mappedFocusedEvent.title}”的判断，下一步最该看什么？` : '',
      topScenario ? `${topScenario.title}现在最该怎么推进？` : '',
      bestWindow ? `如果把重点放在${bestWindow.label}，我应该提前准备什么？` : '',
      riskWindow ? `我该怎样规避${riskWindow.label}这段时间的风险？` : '',
    recentEvents[0] ? `结合我在${recentEvents[0].date}的“${recentEvents[0].title}”，我应该提前注意什么？` : '',
      toolMemory?.recentSessions?.[0]
        ? `结合我最近做的“${toolMemory.recentSessions[0].toolTitle}”，这次最该继续追问哪一层？`
        : '',
    ],
    events,
    mappedFocusedEvent,
    correctionPrompts
  );
  const suggestedEventDrafts = buildReportActionSuggestions(
    {
      ...reportInput,
      scenarioViews: scenarios,
      monthlyWindows: windows,
    },
    calendarAnchor
  );

  return {
    intent: params.intent,
    summary: [
      intentPreset ? `当前会话已进入${intentPreset.entryLabel}。${intentPreset.helper}` : '',
      '你正在继续追问同一份命理报告，请明确引用报告里的结构、行运、窗口和现实事件，不要给泛泛空话。',
      `报告核心：日主${report.bazi?.dayMaster || '未知'}，格局${report.pattern?.type || '以当前结构为准'}，当前大运${report.fortune?.currentDaYun || '以当前阶段判断为准'}，当前流年${report.fortune?.currentLiuNian || '以当年节奏继续校验'}。`,
      (report.advice?.yongShen || []).length > 0 ? `用神/喜神：${[...(report.advice?.yongShen || []), ...(report.advice?.xiShen || [])].join('、')}。` : '',
      topScenario ? `当前最值得展开的方向：${topScenario.title}，结论是“${topScenario.actionLabel}”。` : '',
      bestWindow ? `最近最佳窗口：${bestWindow.label}，原因：${bestWindow.reason}` : '',
      riskWindow ? `需要额外谨慎的窗口：${riskWindow.label}，原因：${riskWindow.reason}` : '',
      tacitSummary ? `用户还有一层没完全说出口但真实存在的隐性状态：${tacitSummary}。回答时要把这些压力、身体信号和关系气氛当成有效输入。` : '',
      intentPreset?.key === 'event-simulation'
        ? `回答时优先把事件拆成试探、推进、确认三段节奏。`
        : '',
      intentPreset?.key === 'event-verdict'
        ? '回答时优先给出倾向判断、依据和前置条件。'
        : '',
      intentPreset?.key === 'event-review'
        ? '回答时优先区分偏差来自时机、执行还是信息判断。'
        : '',
      intentPreset?.key === 'meihua-enhancement'
        ? '回答时优先聚焦近 7 天到 30 天的短周期变化。'
        : '',
      recentEvents.length > 0
        ? `用户最近事件：${recentEvents.map((item) => `${item.date} ${item.title}`).join('；')}。`
        : '当前还没有已记录的现实事件，可提醒用户把关键节点存成事件，后续复盘。',
      confirmedPastEvents.length > 0
        ? `用户已经亲自确认过 ${confirmedPastEvents.length} 条过去印证：${confirmedPastEvents.slice(0, 3).map((item) => item.title).join('；')}。回答时要把这些已验证的人生轨迹当成硬证据，而不是当成普通猜测。`
        : '',
      toolMemory ? `最近工具记录：${toolMemory.summary}` : '',
      mappedFocusedEvent
        ? `本次重点纠偏事件：${mappedFocusedEvent.title}。其当前状态为${mapValidationSummaryLabel(mappedFocusedEvent.validationStatus)}。`
        : '',
      validationSummary.headline ? `事件验证状态：${validationSummary.headline}。` : '',
      `报告可信度等级：${confidence.level}。回答时要区分稳定结论与短期时机判断。`,
    ]
      .filter(Boolean)
      .join('\n'),
    focusAreas,
    suggestedPrompts,
    correctionPrompts,
    recentEvents,
    recentTools: toolMemory?.recentSessions?.map((item) => ({
      toolSlug: item.toolSlug,
      toolTitle: item.toolTitle,
      category: item.category,
      headline: item.headline,
      recommendedAction: item.recommendedAction,
    })) || [],
    suggestedEventDrafts,
    validationSummary,
    confirmedPastEventCount: confirmedPastEvents.length,
    focusedEvent: mappedFocusedEvent,
    report: {
      id: report.id,
      name: report.name,
      dayMaster: report.bazi?.dayMaster || '未知',
      pattern: report.pattern?.type || '以当前结构为准',
      currentDaYun: report.fortune?.currentDaYun || '以当前阶段判断为准',
      currentLiuNian: report.fortune?.currentLiuNian || '以当年节奏继续校验',
      yongShen: report.advice?.yongShen || [],
      topScenario: topScenario?.title || '优先结合当前主线展开',
      bestWindow: bestWindow?.label || '继续按月度节奏观察',
      riskWindow: riskWindow?.label || '优先保守推进并持续验证',
      confidenceLevel: confidence.level,
    },
  };
}

export function buildChatEventDraft(params: {
  question: string;
  answer: string;
  context?: ChatExperienceContext | null;
  now?: Date;
}): ChatEventDraft {
  const now = params.now || new Date();
  const context = params.context || null;
  const referenceDraft = context?.suggestedEventDrafts?.[0];
  const eventType = referenceDraft?.type
    ? (referenceDraft.type as ChatEventDraft['type'])
    : mapQuestionToEventType(params.question, context?.report?.topScenario);
  const title = buildChatEventTitle(params.question, referenceDraft?.title);
  const date = referenceDraft?.date || formatDate(now);
  const answerSummary = compactText(params.answer, 120);
  const impact = mapAnswerImpact(params.answer);

  return {
    title,
    type: eventType,
    date,
    impact,
    description: [
      `问题：${compactText(params.question, 48)}`,
      `结论：${answerSummary}`,
    ].join('\n'),
    reminderAdvanceDays: referenceDraft ? 5 : 3,
    fortuneAnalysis: {
      source: 'chat_message',
      reportId: context?.report?.id,
      question: compactText(params.question, 120),
      answerSummary,
    },
    followUpAdvice: {
      shortTerm: context?.report
        ? `围绕${context.report.topScenario}持续跟踪这次决策是否与报告判断一致。`
        : '记录结果后复盘这次建议是否有效，避免命理建议停留在抽象层。',
      longTerm: '事件发生后补充真实结果，再回到聊天页继续追问偏差原因和下一步动作。',
    },
  };
}

function mapEvent(event: EventRecord): ChatContextEvent {
  const wasAccurate = (event.userFeedback as { wasAccurate?: boolean } | undefined)?.wasAccurate;
  const analysis = (event.fortuneAnalysis as { reportId?: string; reason?: string } | undefined) || {};
  const feedback = (event.userFeedback as { userNotes?: string } | undefined) || {};
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    type: event.type,
    impact: event.impact,
    validationStatus: wasAccurate === true ? 'accurate' : wasAccurate === false ? 'drift' : 'pending',
    reportId: analysis.reportId,
    reason: analysis.reason,
    notes: feedback.userNotes,
  };
}

function getReferenceEvents(events: EventRecord[], now: Date) {
  const nowTime = now.getTime();
  const upcoming = events.filter((item) => getEventTransportSortTime(item) >= nowTime);
  if (upcoming.length > 0) {
    return upcoming.slice(0, 3);
  }

  return events.slice(-3).reverse();
}

function getConfirmedPastEvents(events: EventRecord[]) {
  return events.filter((event) => {
    const feedback = (event.userFeedback as { wasAccurate?: boolean } | undefined) || {};
    const analysis = (event.fortuneAnalysis as { templateKind?: string } | undefined) || {};
    return feedback.wasAccurate === true && analysis.templateKind === 'past_event';
  });
}

function buildPromptList(
  basePrompts: string[],
  events: EventRecord[],
  focusedEvent?: ChatContextEvent,
  correctionPrompts: ChatCorrectionPrompt[] = []
) {
  const prompts = [...correctionPrompts.map((item) => item.question), ...basePrompts, ...GENERIC_PROMPTS];
  if (focusedEvent) {
    prompts.unshift(`请直接帮我纠偏“${focusedEvent.title}”这件事。`);
  }
  if (events.length > 0) {
    prompts.push('这些现实事件和报告判断是否一致？我应该如何验证准确度？');
  }
  if (getConfirmedPastEvents(events).length > 0) {
    prompts.push('既然这些过去节点已经被我确认发生过，接下来最可能重复出现的模式是什么？');
  }
  if (events.some((item) => (item.userFeedback as { wasAccurate?: boolean } | undefined)?.wasAccurate === false)) {
    prompts.push('哪些判断已经出现偏差？偏差更可能来自时机、时辰还是我自己的执行问题？');
  }

  return [...new Set(prompts.filter(Boolean))].slice(0, 4);
}

function buildCorrectionPrompts(focusedEvent?: ChatContextEvent, report?: FortuneRecord | null): ChatCorrectionPrompt[] {
  if (!focusedEvent || focusedEvent.validationStatus !== 'drift') {
    return [];
  }

  const clue = compactText([focusedEvent.reason, focusedEvent.notes].filter(Boolean).join('；'), 40);
  const domain = mapEventDomainLabel(focusedEvent.type);

  return [
    {
      key: 'root_cause',
      question: `这次“${focusedEvent.title}”的偏差，更像时机问题、执行问题，还是信息缺口？`,
      helper: clue ? `已记录线索：${clue}` : '先把偏差原因拆开，再决定要修正判断还是修正动作。',
    },
    {
      key: 'timing_window',
      question: `如果重做一次“${focusedEvent.title}”，最佳推进窗口应该前移、后移，还是分段推进？`,
      helper: report?.fortune?.currentDaYun
        ? `把它重新放回 ${report.fortune.currentDaYun} 的阶段节奏里校准时机。`
        : '把这次偏差放回时间轴，重新判断推进节奏。',
    },
    {
      key: 'birth_time_check',
      question: '这次偏差是否提示我需要复核出生时间或时柱敏感度？',
      helper: `如果 ${domain} 判断连续出现偏差，就要排查底层输入是否需要复核。`,
    },
    {
      key: 'impact_scope',
      question: `这次偏差会影响整份报告，还是只影响 ${domain} 这一个局部判断？`,
      helper: '先判断影响范围，再决定是局部纠偏还是整份报告重估。',
    },
  ];
}

function buildNoReportSummary(events: EventRecord[]) {
  if (events.length === 0) {
    return '当前没有锚定报告，也没有事件记录。先帮助用户把问题收敛成一个明确主题，再给出结构化建议。';
  }

  return `当前没有锚定报告，但用户已经记录了${events.length}个事件。回答时可以先围绕最近事件做复盘，再建议用户回到报告或重新测算。`;
}

function buildValidationSummary(events: EventRecord[]) {
  const accurateCount = events.filter((item) => (item.userFeedback as { wasAccurate?: boolean } | undefined)?.wasAccurate === true).length;
  const driftCount = events.filter((item) => (item.userFeedback as { wasAccurate?: boolean } | undefined)?.wasAccurate === false).length;
  const pendingCount = Math.max(events.length - accurateCount - driftCount, 0);

  let headline = '';
  if (accurateCount > 0 || driftCount > 0 || pendingCount > 0) {
    headline = `事件验证：准确 ${accurateCount}，偏差 ${driftCount}，待验证 ${pendingCount}`;
  }

  return {
    accurateCount,
    driftCount,
    pendingCount,
    headline,
  };
}

function mapValidationSummaryLabel(status: ChatContextEvent['validationStatus']) {
  switch (status) {
    case 'accurate':
      return '已验证准确';
    case 'drift':
      return '已记录偏差';
    default:
      return '待验证';
  }
}

function mapEventDomainLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '局部';
  }
}

function buildChatEventTitle(question: string, fallback?: string) {
  const trimmed = question.replace(/[？?。！!]/g, '').trim();
  if (!trimmed) {
    return fallback || '聊天复盘事件';
  }

  if (trimmed.length <= 22) {
    return trimmed;
  }

  return `${trimmed.slice(0, 22)}...`;
}

function mapQuestionToEventType(question: string, topScenario?: string): ChatEventDraft['type'] {
  const text = `${question} ${topScenario || ''}`;
  if (/(工作|事业|升职|面试|跳槽|创业|职业)/.test(text)) return 'career';
  if (/(财|投资|收入|赚钱|资产|现金)/.test(text)) return 'wealth';
  if (/(感情|关系|婚|对象|恋爱|伴侣)/.test(text)) return 'marriage';
  if (/(身体|健康|手术|睡眠|情绪|恢复)/.test(text)) return 'health';
  if (/(家庭|父母|孩子|家人)/.test(text)) return 'family';
  return 'other';
}

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function mapAnswerImpact(answer: string): ChatEventDraft['impact'] {
  if (/(风险|谨慎|回避|不宜|延后|控制)/.test(answer)) return 'negative';
  if (/(适合|推进|有利|可行|机会|顺势)/.test(answer)) return 'positive';
  return 'neutral';
}

function formatDate(date: Date) {
  return formatLocalDateKey(date);
}
