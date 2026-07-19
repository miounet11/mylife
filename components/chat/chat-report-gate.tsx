'use client';

import Link from 'next/link';
import { trackFunnel } from '@/components/funnel-tracker';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

type Props = {
  reportId?: string | null;
  /** URL asked for this report id (may fail ownership bind for guests) */
  requestedReportId?: string | null;
  /** Server actually bound this report to the session */
  boundReportId?: string | null;
  contextBound?: boolean | null;
  intent?: string | null;
  source?: string | null;
  /** compact = thin bar; card = larger empty-state panel */
  variant?: 'bar' | 'card';
  locale?: string | null;
};

function buildAnalyzeHref(intent?: string | null, source?: string | null) {
  const params = new URLSearchParams();
  params.set('source', source || 'chat_empty');
  if (intent) params.set('intent', intent);
  return `/analyze?${params.toString()}`;
}

/**
 * Shown when /chat has no bound report for this guest session.
 * Quiet notice — text links only.
 */
export default function ChatReportGate({
  reportId,
  requestedReportId,
  boundReportId,
  contextBound,
  intent,
  source,
  variant = 'card',
  locale,
}: Props) {
  const en = isEnglishUiLocale(locale);
  const t = (zh: string, enText: string) => (en ? enText : zh);
  const effectiveBound = boundReportId || (contextBound === true ? reportId : null) || null;
  const requested = requestedReportId || reportId || null;

  if (effectiveBound) return null;

  const href = buildAnalyzeHref(intent, source || 'chat_empty');
  const freeChat = /palmistry|home-layout|meihua|手相|户型|梅花/.test(`${intent || ''}`);
  const unboundPublic =
    Boolean(requested) && !effectiveBound && contextBound === false;

  const title = unboundPublic
    ? t(
        '这是公开报告视图，当前会话未绑定该命盘',
        'Public report view — this session is not bound to that chart',
      )
    : freeChat
      ? t(
          '专项模式可先聊，结构判断仍建议先有报告',
          'Special mode can start now; structure judgment still works better with a report',
        )
      : t('先有报告，再追问', 'Get a report first, then follow up');

  const body = unboundPublic
    ? t(
        '链接里的报告属于生成时的浏览器会话（或需登录合并档案）。你仍可浏览公开结论；若要基于此盘追问，请使用生成时的设备，或重新生成一份属于你的报告。',
        'The linked report belongs to the browser session that created it (or needs a signed-in merged profile). You can still browse public conclusions; to follow up on this chart, use the original device or create your own report.',
      )
    : freeChat
      ? t(
          '手相/户型等可直接上传材料；若你想问事业财运窗口，请先生成结构报告。',
          'Palm / floor-plan and similar modes can upload materials first. For career/wealth windows, create a structure report first.',
        )
      : t(
          '当前未绑定命盘报告。直接闲聊事业/财运/关系，依据会偏弱。建议先生成完整报告。',
          'No chart report is bound. Free-form career/wealth/relationship chat will be weakly grounded. Create a full report first.',
        );

  const track = (surface: string) =>
    trackFunnel('chat_to_analyze_click', {
      source: source || 'chat_empty',
      intent: intent || 'career',
      surface,
      unbound: unboundPublic ? '1' : '0',
    });

  if (variant === 'bar') {
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--hairline)] py-2 text-[13px]">
        <span className="text-[color:var(--ink-2)]">{title}</span>
        <Link
          href={href}
          onClick={() => track('bar')}
          className="shrink-0 text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          {unboundPublic
            ? t('生成我的报告', 'Create my report')
            : t('去生成报告', 'Create report')}
        </Link>
      </div>
    );
  }

  return (
    <div className="border-y border-[color:var(--hairline)] py-3">
      <div className="text-[14px] font-medium text-[color:var(--ink-1)]">{title}</div>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{body}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link
          href={href}
          onClick={() => track('sticky_card')}
          className="text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          {unboundPublic
            ? t('生成我的结构报告', 'Create my structure report')
            : t('立即生成结构报告', 'Create structure report now')}
        </Link>
        {unboundPublic && requested ? (
          <Link
            href={`/result/${encodeURIComponent(requested)}?source=chat_unbound_public`}
            className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
          >
            {t('仍可打开公开报告', 'Still open public report')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
