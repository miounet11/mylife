/**
 * Client-safe feedback types/constants (no Node/sqlite imports).
 */

export const FEEDBACK_CATEGORIES = [
  { key: 'page_error', label: '页面报错 / 白屏' },
  { key: 'layout_broken', label: '布局错乱' },
  { key: 'content_wrong', label: '内容错误 / 不准' },
  { key: 'feature_broken', label: '功能不可用' },
  { key: 'suggestion', label: '改进建议' },
  { key: 'message', label: '普通留言' },
  { key: 'other', label: '其他' },
] as const;

export type FeedbackCategoryKey = (typeof FEEDBACK_CATEGORIES)[number]['key'];

export type SiteFeedbackStatus = 'new' | 'read' | 'done' | 'ignored';

export type SiteFeedbackRecord = {
  id: string;
  category: FeedbackCategoryKey;
  message: string;
  pageUrl: string | null;
  userAgent: string | null;
  clientIp: string | null;
  userId: string | null;
  status: SiteFeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

export function isValidFeedbackCategory(value: string): value is FeedbackCategoryKey {
  return FEEDBACK_CATEGORIES.some((item) => item.key === value);
}

export function getFeedbackCategoryLabel(key: string) {
  return FEEDBACK_CATEGORIES.find((item) => item.key === key)?.label || key;
}
