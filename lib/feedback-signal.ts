/**
 * Classify site_feedback rows: product freeform vs automated calibration signals.
 * Client-safe (no Node imports).
 */

export type FeedbackSignalKind =
  | 'freeform'
  | 'birth_hour'
  | 'accuracy'
  | 'past_event'
  | 'smoke';

export function classifyFeedbackSignal(message: string): FeedbackSignalKind {
  const m = `${message || ''}`.trim();
  if (!m) return 'freeform';
  if (/冒烟|smoke\s*test|公网冒烟/i.test(m)) return 'smoke';
  if (/出生时辰把握|birth[_ ]?certainty|templateKey=birth/i.test(m)) return 'birth_hour';
  if (/报告准确度反馈|accuracy[_-]?rating/i.test(m)) return 'accuracy';
  if (
    /用户标记为未发生|校准：报告节点|calibration[_-]?past|templateKey=(career|relationship|health|money)/i.test(
      m,
    )
  ) {
    return 'past_event';
  }
  return 'freeform';
}

export function feedbackSignalLabel(kind: FeedbackSignalKind): string {
  switch (kind) {
    case 'birth_hour':
      return '时辰校准';
    case 'accuracy':
      return '准确度评分';
    case 'past_event':
      return '过去节点校准';
    case 'smoke':
      return '冒烟测试';
    default:
      return '用户留言';
  }
}

export function isActionableFreeformFeedback(message: string): boolean {
  return classifyFeedbackSignal(message) === 'freeform';
}

/** Parse structured calibration tags written by pro-user-calibration. */
export function parseCalibrationMeta(message: string): {
  kind: FeedbackSignalKind;
  reportId: string | null;
  templateKey: string | null;
  level: string | null;
  denied: boolean;
} {
  const m = `${message || ''}`;
  const reportId =
    m.match(/reportId\s*[=:]\s*(report_[a-zA-Z0-9_]+)/i)?.[1] ||
    m.match(/\b(report_[a-zA-Z0-9_]+)\b/)?.[1] ||
    null;
  const templateKey = m.match(/templateKey\s*[=:]\s*([a-zA-Z0-9_]+)/i)?.[1] || null;
  const level =
    m.match(/level\s*[=:]\s*([a-zA-Z0-9_]+)/i)?.[1] ||
    (m.includes('整体较准')
      ? 'good'
      : m.includes('部分准')
        ? 'partial'
        : m.includes('偏差较大')
          ? 'bad'
          : m.includes('时辰确定')
            ? 'exact'
            : m.includes('大概知道')
              ? 'approx'
              : m.includes('时辰不确定')
                ? 'unknown'
                : null);
  const kind = classifyFeedbackSignal(m);
  const denied = /未发生|没有发生|标记为未发生|denied/i.test(m);
  return { kind, reportId, templateKey, level, denied };
}
