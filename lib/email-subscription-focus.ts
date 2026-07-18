export type EmailFocusItemCategory =
  | 'monthly_window'
  | 'report_highlight'
  | 'action'
  | 'custom';

export type EmailFocusItem = {
  key: string;
  label: string;
  value: string;
  category: EmailFocusItemCategory;
};

export type EmailSubscriptionMeta = {
  focusReportId?: string | null;
  focusItems?: EmailFocusItem[];
  focusUpdatedAt?: string | null;
};

export const MAX_EMAIL_FOCUS_ITEMS = 3;

export const LOGIN_AUTO_SUBSCRIPTION_TAGS = [
  'auth',
  'welcome',
  'updates',
  'monthly_report',
  'report_upgrade',
  'knowledge_updates',
  'timing:monthly',
  'timing:solar_terms',
  'timing:major_events',
  'timing:daily',
] as const;

export const REPORT_SUBSCRIPTION_TAGS = [
  'monthly_report',
  'report_upgrade',
  'knowledge_updates',
  'timing:monthly',
  'timing:solar_terms',
  'timing:major_events',
  'timing:daily',
] as const;

export const EMAIL_SUBSCRIPTION_SYSTEM_TAGS = ['auth', 'welcome'] as const;

export type EmailSubscriptionPreferenceOption = {
  tag: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

export type EmailSubscriptionPreferenceGroup = {
  key: string;
  title: string;
  description: string;
  options: EmailSubscriptionPreferenceOption[];
};

export const EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS: EmailSubscriptionPreferenceGroup[] = [
  {
    key: 'timing',
    title: '运势与时序提醒',
    description: '围绕你的测算结果，提醒你日常该注意的细节和关键时间点。',
    options: [
      {
        tag: 'timing:daily',
        label: '日常运势细节',
        description: '每天一条轻提醒：节奏提示与可验证动作，不恐吓、不替代完整报告。',
        defaultEnabled: true,
      },
      {
        tag: 'timing:monthly',
        label: '月度窗口汇总',
        description: '每月初发送本月值得留意的时点列表。',
        defaultEnabled: true,
      },
      {
        tag: 'timing:solar_terms',
        label: '节气过渡提醒',
        description: '立春、立夏、立秋、立冬前 7 天的生活建议。',
        defaultEnabled: true,
      },
      {
        tag: 'timing:major_events',
        label: '命理大事通知',
        description: '本命年、换大运、岁运并临等重大节点单独提醒。',
        defaultEnabled: true,
      },
    ],
  },
  {
    key: 'report',
    title: '报告与补全',
    description: '和你生成过的报告直接相关的后续更新。',
    options: [
      {
        tag: 'monthly_report',
        label: '月度报告更新',
        description: '报告关联的月度复盘和窗口变化。',
        defaultEnabled: true,
      },
      {
        tag: 'report_upgrade',
        label: '报告补全完成',
        description: '后台补全结束后通知你回来查看完整版。',
        defaultEnabled: true,
      },
    ],
  },
  {
    key: 'content',
    title: '内容与产品动态',
    description: '站点精选内容、案例和产品能力更新。',
    options: [
      {
        tag: 'knowledge_updates',
        label: '知识与案例',
        description: '精选文章、案例解读和命理知识更新。',
        defaultEnabled: true,
      },
      {
        tag: 'updates',
        label: '产品动态',
        description: '新功能、体验优化和重要公告。',
        defaultEnabled: true,
      },
    ],
  },
];

export const EMAIL_SUBSCRIPTION_CONFIGURABLE_TAGS = EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS
  .flatMap((group) => group.options.map((option) => option.tag));

export const EMAIL_SUBSCRIPTION_DEFAULT_TAGS = [
  ...EMAIL_SUBSCRIPTION_CONFIGURABLE_TAGS,
] as const;

export type ResolvedEmailSubscriptionPreference = EmailSubscriptionPreferenceOption & {
  enabled: boolean;
};

export type ResolvedEmailSubscriptionPreferenceGroup = Omit<EmailSubscriptionPreferenceGroup, 'options'> & {
  options: ResolvedEmailSubscriptionPreference[];
};

export function listDefaultEnabledTags() {
  return EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS
    .flatMap((group) => group.options)
    .filter((option) => option.defaultEnabled)
    .map((option) => option.tag);
}

export function normalizeEnabledTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set(EMAIL_SUBSCRIPTION_CONFIGURABLE_TAGS);
  return [...new Set(
    input
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => allowed.has(item)),
  )];
}

export function mergeSubscriptionTags(
  existingTags: string[] = [],
  enabledTags: string[] = [],
) {
  const systemTags = existingTags.filter((tag) => (
    EMAIL_SUBSCRIPTION_SYSTEM_TAGS as readonly string[]
  ).includes(tag));
  return [...new Set([...systemTags, ...normalizeEnabledTags(enabledTags)])];
}

export function resolveSubscriptionPreferences(tags: string[] = []): ResolvedEmailSubscriptionPreferenceGroup[] {
  const tagSet = new Set(tags);
  return EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      enabled: tagSet.has(option.tag),
    })),
  }));
}

export function countEnabledPreferences(tags: string[] = []) {
  const tagSet = new Set(tags);
  return EMAIL_SUBSCRIPTION_CONFIGURABLE_TAGS.filter((tag) => tagSet.has(tag)).length;
}

export function parseEmailSubscriptionMeta(raw: unknown): EmailSubscriptionMeta {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return parseEmailSubscriptionMeta(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};

  const record = raw as Record<string, unknown>;
  const focusReportId = typeof record.focusReportId === 'string' ? record.focusReportId : null;
  const focusUpdatedAt = typeof record.focusUpdatedAt === 'string' ? record.focusUpdatedAt : null;
  const focusItems = normalizeEmailFocusItems(record.focusItems);

  return {
    focusReportId,
    focusItems,
    focusUpdatedAt,
  };
}

export function normalizeEmailFocusItems(input: unknown): EmailFocusItem[] {
  if (!Array.isArray(input)) return [];

  const items: EmailFocusItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const record = raw as Record<string, unknown>;
    const key = `${record.key || ''}`.trim();
    const label = `${record.label || ''}`.trim();
    const value = `${record.value || ''}`.trim();
    const category = normalizeFocusCategory(record.category);
    if (!key || !label || !value) continue;
    if (items.some((item) => item.key === key)) continue;
    items.push({ key, label, value, category });
    if (items.length >= MAX_EMAIL_FOCUS_ITEMS) break;
  }

  return items;
}

function normalizeFocusCategory(value: unknown): EmailFocusItemCategory {
  if (
    value === 'monthly_window'
    || value === 'report_highlight'
    || value === 'action'
    || value === 'custom'
  ) {
    return value;
  }
  return 'custom';
}

export function mergeEmailSubscriptionMeta(
  existing: EmailSubscriptionMeta | null | undefined,
  patch: EmailSubscriptionMeta,
): EmailSubscriptionMeta {
  const base = existing || {};
  return {
    ...base,
    ...patch,
    focusItems: patch.focusItems !== undefined ? patch.focusItems : base.focusItems,
  };
}

export function buildFocusOptionsFromReport(input: {
  monthlyHighlights?: Array<{ label: string; theme: string; status?: string }>;
  reportHighlights?: Array<{ label: string; value: string }>;
  actionSuggestions?: Array<{ title?: string; description?: string }>;
}): EmailFocusItem[] {
  const options: EmailFocusItem[] = [];

  for (const item of input.monthlyHighlights || []) {
    const label = `${item.label || ''}`.trim();
    const value = `${item.theme || ''}`.trim();
    if (!label || !value) continue;
    options.push({
      key: `monthly:${label}`,
      label,
      value,
      category: 'monthly_window',
    });
  }

  for (const item of input.reportHighlights || []) {
    const label = `${item.label || ''}`.trim();
    const value = `${item.value || ''}`.trim();
    if (!label || !value || value === '未知') continue;
    options.push({
      key: `highlight:${label}`,
      label,
      value,
      category: 'report_highlight',
    });
  }

  for (const [index, item] of (input.actionSuggestions || []).entries()) {
    const label = `${item.title || '行动建议'}`.trim();
    const value = `${item.description || ''}`.trim();
    if (!value) continue;
    options.push({
      key: `action:${index}`,
      label,
      value,
      category: 'action',
    });
  }

  const deduped: EmailFocusItem[] = [];
  for (const option of options) {
    if (deduped.some((item) => item.key === option.key)) continue;
    deduped.push(option);
    if (deduped.length >= 12) break;
  }

  return deduped;
}