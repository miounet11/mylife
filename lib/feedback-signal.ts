/**
 * Classify site_feedback rows: product freeform vs automated calibration signals.
 * Client-safe (no Node imports).
 */

export type FeedbackSignalKind =
  | 'freeform'
  | 'birth_hour'
  | 'accuracy'
  | 'past_event'
  | 'appearance'
  | 'empty_form'
  | 'smoke'
  | 'cohort';

/** Preset 报错模板只填了标题、用户没写正文。 */
export function isBlankStructuredFeedback(message: string): boolean {
  const body = `${message || ''}`
    .replace(/^【[^】]+】\s*/u, '')
    .replace(/报告ID[：:].+\n?/g, '')
    .replace(/系统用神[：:].+\n?/g, '')
    .replace(/系统忌神[：:].+\n?/g, '')
    .replace(/强弱[：:].+\n?/g, '')
    .replace(/老师[：:].+\n?/g, '')
    .replace(/我认为[：:]\s*/g, '')
    .replace(/问题描述[：:]?\s*/g, '')
    .replace(/我发现的问题[：:]\s*/g, '')
    .trim();
  return body.length < 4;
}

export function classifyFeedbackSignal(message: string): FeedbackSignalKind {
  const m = `${message || ''}`.trim();
  if (!m) return 'freeform';
  if (/冒烟|smoke\s*test|公网冒烟/i.test(m)) return 'smoke';
  if (/世代校准|cohort[_-]?claim|童年背景|金钱思维矩阵/.test(m)) return 'cohort';
  if (/外貌与生活校准/.test(m)) return 'appearance';
  if (/【(喜忌|报告|对话)报错】/.test(m) && isBlankStructuredFeedback(m)) return 'empty_form';
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
    case 'appearance':
      return '外貌生活校准';
    case 'empty_form':
      return '空报错模板';
    case 'smoke':
      return '冒烟测试';
    case 'cohort':
      return '世代校准';
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
