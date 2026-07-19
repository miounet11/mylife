'use client';

import Link from 'next/link';
import { BadgeCheck, BookOpenCheck, MailCheck, MessageCircleReply, Shield } from 'lucide-react';
import { useLocale } from '@/components/i18n/locale-provider';
import { emailTrustCopy } from '@/lib/i18n/email-trust-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { normalizeSiteLocale } from '@/lib/i18n/site-locale';

const ICONS = [Shield, MailCheck, MessageCircleReply, BookOpenCheck] as const;

export default function EmailTrustPanel({
  email,
  compact = false,
  locale: localeProp,
}: {
  email?: string;
  compact?: boolean;
  /** Optional override when parent already resolved locale */
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale =
    normalizeSiteLocale(localeProp) || ctxLocale || 'zh-CN';
  const copy = emailTrustCopy(locale);

  const messagesHref = email
    ? `/updates/messages?email=${encodeURIComponent(email)}`
    : '/updates/messages';

  const items = copy.items.map((item, i) => ({
    icon: ICONS[i] || Shield,
    title: item.title,
    text: item.text,
  }));

  if (compact) {
    return (
      <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
            <BadgeCheck className="h-4 w-4" />
            {copy.compactTitle}
          </div>
          <Link href={messagesHref} className="text-xs font-semibold text-[color:var(--brand-strong)] hover:underline">
            {copy.compactLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-card overflow-hidden">
      <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          <BadgeCheck className="h-3.5 w-3.5" />
          {copy.badge}
        </div>
        <h2 className="mt-1.5 text-[18px] font-bold text-[color:var(--fb-ink-1)]">
          {copy.title}
        </h2>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[color:var(--fb-ink-2)]">
          {copy.description}
        </p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-1)]">
                <Icon className="h-4 w-4 text-[color:var(--brand-strong)]" />
                {item.title}
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">{item.text}</p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--fb-border)] px-4 py-3">
        <Link href={messagesHref} className="fb-btn fb-btn-primary inline-flex h-9 items-center px-4 text-[13px]">
          {copy.enterMailCenter}
        </Link>
        <Link href="/updates#my-updates-center" className="fb-btn inline-flex h-9 items-center px-4 text-[13px]">
          {copy.manageSubscription}
        </Link>
      </div>
    </div>
  );
}
