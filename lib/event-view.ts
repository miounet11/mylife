import { formatLocalDateKey, parseLocalDate } from '@/lib/utils';

export type EventViewType = 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
export type EventViewImpact = 'positive' | 'negative' | 'neutral';
export type EventDateKey = string;

export interface EventViewModel {
  id: string;
  type: EventViewType;
  title: string;
  dateKey: EventDateKey;
  date: Date;
  time?: string;
  description: string;
  impact: EventViewImpact;
  dateStatus?: string;
  occurrenceWindow?: string;
  isEstimatedPastEvent?: boolean;
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
  fortuneAnalysis?: {
    source?: string;
    reportId?: string;
    suggestionKey?: string;
    reason?: string;
    title?: string;
  };
  followUpAdvice?: {
    shortTerm?: string;
    longTerm?: string;
  };
  userFeedback?: {
    wasAccurate?: boolean;
    userNotes?: string;
  };
}

export interface EventTransportRecord {
  id: string;
  userId?: string;
  type: EventViewType;
  title: string;
  date: EventDateKey;
  time?: string;
  description?: string;
  impact: EventViewImpact;
  fortuneAnalysis?: Record<string, unknown>;
  userFeedback?: Record<string, unknown>;
  followUpAdvice?: Record<string, unknown>;
  reminderEnabled?: boolean;
  reminderAdvanceDays?: number;
  reminderMethod?: string;
}

const EVENT_TYPES: EventViewType[] = ['career', 'wealth', 'marriage', 'health', 'family', 'other'];
const EVENT_IMPACTS: EventViewImpact[] = ['positive', 'negative', 'neutral'];
type RawEventRecord = Record<string, any>;

function isRawEventRecord(event: unknown): event is RawEventRecord {
  return !!event && typeof event === 'object';
}

function getEventSortTime(dateKey?: EventDateKey, time?: string) {
  const parsed = parseLocalDate(time ? `${dateKey || ''}T${time}` : dateKey || '');
  return parsed?.getTime() ?? Number.POSITIVE_INFINITY;
}

export function parseEventViewDate(dateKey?: EventDateKey, time?: string) {
  const dateTime = time ? `${dateKey || ''}T${time}` : dateKey || '';
  return parseLocalDate(dateTime) || new Date(0);
}

export function getEventTransportSortTime(event: Pick<EventTransportRecord, 'date' | 'time'>) {
  return getEventSortTime(event.date, event.time);
}

export function getEventViewSortTime(event: Pick<EventViewModel, 'dateKey' | 'time'>) {
  return getEventSortTime(event.dateKey, event.time);
}

export function formatEventDateKey(dateKey?: EventDateKey, fallback = '未记录') {
  if (!dateKey) {
    return fallback;
  }

  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    return `${matched[1]}-${matched[2]}-${matched[3]}`;
  }

  const parsed = parseLocalDate(dateKey);
  if (!parsed) {
    return dateKey;
  }

  return formatLocalDateKey(parsed);
}

export function formatEventQueueDateKey(dateKey?: EventDateKey, fallback = '未记录') {
  const normalized = formatEventDateKey(dateKey, fallback);
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matched) {
    return normalized;
  }

  return `${matched[1]}.${matched[2]}.${matched[3]}`;
}

export function getEstimatedPastEventDateKey(now = new Date()): EventDateKey {
  return formatLocalDateKey(now);
}

export function buildEstimatedPastEventDescription(description: string, occurrenceWindow?: string) {
  const detail = description.trim();
  const windowHint = occurrenceWindow?.trim();
  const suffix = windowHint
    ? `系统先按今天建档，真实日期待补充；你回忆时可优先参考“${windowHint}”这个时间范围。`
    : '系统先按今天建档，真实日期待补充；请尽快回到事件页改成真实发生日期。';

  return `${detail}（${suffix}）`;
}

export function isEstimatedPastEventRecord(event?: {
  fortuneAnalysis?: {
    templateKind?: string;
    dateStatus?: string;
    occurrenceWindow?: string;
  };
}) {
  return event?.fortuneAnalysis?.templateKind === 'past_event'
    && event?.fortuneAnalysis?.dateStatus === 'estimated_today_pending_correction';
}

export function getEstimatedPastEventPrompt(event?: {
  title?: string;
  fortuneAnalysis?: {
    occurrenceWindow?: string;
  };
}) {
  if (!event) {
    return '这是一条历史印证样本，当前日期仍是暂估值，请尽快改成真实发生日期。';
  }

  const title = event.title || '这条事件';
  const occurrenceWindow = event.fortuneAnalysis?.occurrenceWindow?.trim();
  if (occurrenceWindow) {
    return `${title} 当前先按暂估日期建档，建议优先按“${occurrenceWindow}”回忆真实发生时间。`;
  }

  return `${title} 当前先按暂估日期建档，请尽快补成真实发生日期。`;
}

export function getEventViewFocusDate(events: EventViewModel[], now = new Date()) {
  if (events.length === 0) {
    return null;
  }

  const nowTime = now.getTime();
  const sorted = [...events].sort((left, right) => getEventViewSortTime(left) - getEventViewSortTime(right));
  const pending = sorted.filter((event) => event.userFeedback?.wasAccurate === undefined);
  const overduePending = pending.filter((event) => getEventViewSortTime(event) < nowTime);
  const upcomingPending = pending.find((event) => getEventViewSortTime(event) >= nowTime);
  const nextUpcoming = sorted.find((event) => getEventViewSortTime(event) >= nowTime);

  if (overduePending.length > 0) {
    return overduePending[overduePending.length - 1]?.date || null;
  }

  if (upcomingPending) {
    return upcomingPending.date;
  }

  if (nextUpcoming) {
    return nextUpcoming.date;
  }

  return sorted[sorted.length - 1]?.date || null;
}

export function toEventViewModel(event: Record<string, any>): EventViewModel {
  const type = EVENT_TYPES.includes(event.type) ? event.type : 'other';
  const impact = EVENT_IMPACTS.includes(event.impact) ? event.impact : 'neutral';
  const dateKey = typeof event.date === 'string' ? event.date : '';
  const time = event.time || undefined;
  const fortuneAnalysis = event.fortuneAnalysis || undefined;
  const isEstimatedPastEvent = isEstimatedPastEventRecord({
    fortuneAnalysis,
  });

  return {
    id: event.id,
    type,
    title: event.title,
    dateKey,
    date: parseEventViewDate(dateKey, time),
    time,
    description: event.description || '',
    impact,
    dateStatus: typeof fortuneAnalysis?.dateStatus === 'string' ? fortuneAnalysis.dateStatus : undefined,
    occurrenceWindow: typeof fortuneAnalysis?.occurrenceWindow === 'string' ? fortuneAnalysis.occurrenceWindow : undefined,
    isEstimatedPastEvent,
    reminder: {
      enabled: !!(event.reminderEnabled ?? event.reminder_enabled),
      advanceDays: event.reminderAdvanceDays ?? event.reminder_advance_days ?? 0,
      method: (event.reminderMethod || event.reminder_method || 'app') as 'app' | 'email' | 'sms',
    },
    fortuneAnalysis,
    followUpAdvice: event.followUpAdvice || undefined,
    userFeedback: event.userFeedback || undefined,
  };
}

export function toEventViewModels(events: ReadonlyArray<unknown>): EventViewModel[] {
  return events.filter(isRawEventRecord).map((event) => toEventViewModel(event));
}

export function normalizeEventTransportRecord(event: Record<string, any>): EventTransportRecord {
  const type = EVENT_TYPES.includes(event.type) ? event.type : 'other';
  const impact = EVENT_IMPACTS.includes(event.impact) ? event.impact : 'neutral';
  const date = typeof event.date === 'string' ? event.date : '';

  return {
    id: String(event.id || ''),
    userId: typeof event.userId === 'string'
      ? event.userId
      : typeof event.user_id === 'string'
        ? event.user_id
        : undefined,
    type,
    title: typeof event.title === 'string' ? event.title : '',
    date,
    time: typeof event.time === 'string' && event.time ? event.time : undefined,
    description: typeof event.description === 'string' && event.description ? event.description : undefined,
    impact,
    fortuneAnalysis: event.fortuneAnalysis || event.fortune_analysis || undefined,
    userFeedback: event.userFeedback || event.user_feedback || undefined,
    followUpAdvice: event.followUpAdvice || event.follow_up_advice || undefined,
    reminderEnabled: typeof event.reminderEnabled === 'boolean'
      ? event.reminderEnabled
      : typeof event.reminder_enabled === 'boolean'
        ? event.reminder_enabled
        : typeof event.reminder_enabled === 'number'
          ? event.reminder_enabled === 1
          : undefined,
    reminderAdvanceDays: typeof event.reminderAdvanceDays === 'number'
      ? event.reminderAdvanceDays
      : typeof event.reminder_advance_days === 'number'
        ? event.reminder_advance_days
        : undefined,
    reminderMethod: typeof event.reminderMethod === 'string'
      ? event.reminderMethod
      : typeof event.reminder_method === 'string'
        ? event.reminder_method
        : undefined,
  };
}

export function normalizeEventTransportRecords(events: ReadonlyArray<unknown>): EventTransportRecord[] {
  return events.filter(isRawEventRecord).map((event) => normalizeEventTransportRecord(event));
}
