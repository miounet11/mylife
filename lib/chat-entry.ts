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
