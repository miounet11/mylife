import { PROFILE_RELATION_OPTIONS } from '@/lib/profile-settings-types';

export type SubscriptionFocusContext = {
  focusReportId?: string | null;
  focusFortuneName?: string | null;
  focusFortuneRelation?: string | null;
  focusFortuneRelationLabel?: string | null;
};

export type SubscriptionFocusCopy = {
  shortLabel: string;
  headline: string;
  description: string;
  settingsHref: string;
  isSet: boolean;
};

export function resolveRelationDisplayLabel(
  relation?: string | null,
  relationLabel?: string | null,
): string | null {
  if (relationLabel?.trim()) return relationLabel.trim();
  if (!relation) return null;
  const option = PROFILE_RELATION_OPTIONS.find((item) => item.key === relation);
  return option?.label || relation;
}

export function buildSubscriptionFocusCopy(ctx: SubscriptionFocusContext): SubscriptionFocusCopy {
  const name = ctx.focusFortuneName?.trim() || null;
  const relation = resolveRelationDisplayLabel(ctx.focusFortuneRelation, ctx.focusFortuneRelationLabel);

  if (!ctx.focusReportId || !name) {
    return {
      shortLabel: '未关联档案',
      headline: '邮件提醒尚未关联具体档案',
      description: '日常/月度/节气邮件会基于你关联的测算档案生成。建议在资料设置中指定一份档案。',
      settingsHref: '/profile/settings?tab=archives',
      isSet: false,
    };
  }

  const display = relation && relation !== '本人' ? `${name}（${relation}）` : name;
  const settingsHref = `/profile/settings?fortuneId=${encodeURIComponent(ctx.focusReportId)}&tab=archives`;

  return {
    shortLabel: display,
    headline: `当前提醒基于「${display}」档案`,
    description: '日常运势、月度窗口与节气提醒会优先参考这份档案的命盘与补充资料。',
    settingsHref,
    isSet: true,
  };
}

export function buildEmailSubscriptionFocusFooterText(
  ctx: SubscriptionFocusContext,
  baseUrl: string,
): string {
  const copy = buildSubscriptionFocusCopy(ctx);
  if (!copy.isSet) {
    return `尚未关联测算档案。可在 ${baseUrl}/profile/settings?tab=archives 指定。`;
  }
  return `当前提醒基于「${copy.shortLabel}」档案。可在 ${baseUrl}${copy.settingsHref} 调整。`;
}

export function buildEmailSubscriptionFocusFooterHtml(
  ctx: SubscriptionFocusContext,
  baseUrl: string,
): string {
  const copy = buildSubscriptionFocusCopy(ctx);
  const href = `${baseUrl}${copy.settingsHref}`;
  if (!copy.isSet) {
    return `
      <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
        尚未关联测算档案。
        <a href="${href}" style="color:#6b7280">去资料设置指定档案</a>
      </p>
    `;
  }
  return `
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
      ${copy.headline}。
      <a href="${href}" style="color:#6b7280">调整提醒档案</a>
    </p>
  `;
}