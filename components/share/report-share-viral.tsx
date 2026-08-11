'use client';

/**
 * Report viral share — invite friends to run their own chart.
 * Share text + link land on /analyze with source=share_viral attribution.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Share2, UserPlus } from 'lucide-react';
import { ConclusionShareCard } from '@/components/share/conclusion-share-card';
import { trackClientEvent } from '@/lib/analytics-client';

type Props = {
  reportId: string;
  /** e.g. 日主甲 · 用神水 */
  headline: string;
  lines?: string[];
  publicName?: string | null;
  locale?: string | null;
  className?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function ReportShareViral({
  reportId,
  headline,
  lines = [],
  publicName,
  locale,
  className = '',
}: Props) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.life-kline.com';
    // Short landing is QR-friendly; still carries attribution via /go/share → analyze
    const q = new URLSearchParams({
      ref: reportId.slice(0, 24),
      from: `report:${reportId}`,
    });
    return `${origin}/go/share?${q.toString()}`;
  }, [reportId]);

  const resultUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.life-kline.com';
    return `${origin}/result/${reportId}?source=share_view`;
  }, [reportId]);

  const inviteText = useMemo(() => {
    if (en) {
      return [
        publicName ? `${publicName}'s Life K-Line snapshot` : 'My Life K-Line snapshot',
        headline,
        ...lines.filter(Boolean).slice(0, 2),
        '',
        'Run your free chart (same method):',
        inviteUrl,
      ].join('\n');
    }
    return [
      publicName ? `${publicName} 的人生K线结构摘要` : '我的人生K线结构摘要',
      headline,
      ...lines.filter(Boolean).slice(0, 2),
      '',
      '你也可以免费测一份（同一套结构方法）：',
      inviteUrl,
    ].join('\n');
  }, [en, publicName, headline, lines, inviteUrl]);

  const track = (target: string) => {
    void trackClientEvent({
      eventName: 'share_viral_action',
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      meta: { reportId, target, source: 'report_share_viral' },
    });
  };

  const onCopyInvite = async () => {
    const ok = await copyText(inviteText);
    if (ok) {
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1800);
      track('copy_invite');
    }
  };

  const onShareInvite = async () => {
    track('native_share_invite');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: en ? 'Life K-Line — free chart' : '人生K线 · 免费结构报告',
          text: inviteText,
          url: inviteUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await onCopyInvite();
  };

  return (
    <section
      id="report-share-viral"
      className={`scroll-mt-header space-y-3 rounded-[12px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            {en ? 'Share · invite' : '分享 · 裂变'}
          </p>
          <h2 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
            {en ? 'Share your structure, invite a friend' : '分享你的结构，邀请朋友也测一份'}
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {en
              ? 'One-screen conclusion for social posts. Invite link opens free chart — no account required first.'
              : '一屏结论适合发朋友圈 / 群。邀请链接直达免费排盘，对方不必先注册。'}
          </p>
        </div>
        <Link
          href={inviteUrl}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-[color:var(--hairline-strong)] px-3 text-[12px] font-medium text-[color:var(--ink-2)] hover:border-[color:var(--ink-1)]"
          onClick={() => track('open_invite_link')}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {en ? 'Friend chart link' : '朋友测算链接'}
        </Link>
      </div>

      <ConclusionShareCard
        compact
        locale={locale}
        eyebrow={en ? 'Life K-Line · structure' : '人生K线 · 结构摘要'}
        title={headline}
        lines={lines.slice(0, 3)}
        url={resultUrl}
        qrUrl={inviteUrl}
        qrCaption={en ? 'Scan · free chart' : '扫码免费测算'}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onShareInvite()}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[color:var(--brand-strong)] px-3.5 text-[12px] font-semibold text-white hover:opacity-90"
        >
          <Share2 className="h-3.5 w-3.5" />
          {en ? 'Share invite' : '分享邀请文案'}
        </button>
        <button
          type="button"
          onClick={() => void onCopyInvite()}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[color:var(--hairline-strong)] bg-white px-3.5 text-[12px] font-medium text-[color:var(--ink-2)]"
        >
          {copiedInvite ? (
            <>
              <Check className="h-3.5 w-3.5 text-[color:var(--data-up)]" />
              {en ? 'Copied' : '已复制'}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {en ? 'Copy invite' : '复制邀请'}
            </>
          )}
        </button>
      </div>
      <p className="text-[10px] leading-relaxed text-[color:var(--ink-5)]">
        {en
          ? 'Invite attribution: source=share_viral · structure reference only.'
          : '邀请归因 source=share_viral · 结构与节奏参考，不替代专业意见。'}
      </p>
    </section>
  );
}
