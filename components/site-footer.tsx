'use client';

import Link from 'next/link';
import { Code2, Send } from 'lucide-react';
import { BrandLockup } from '@/components/brand/brand-lockup';
import SystemCapabilityFooterSignalsClient from '@/components/system-capability-footer-signals-client';
import { useLocale } from '@/components/i18n/locale-provider';
import LocaleSwitcher from '@/components/i18n/locale-switcher';
import {
  OFFICIAL_GITHUB_LABEL,
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';

const footerLinks: Array<{ href: string; labelKey: string; labelFallback?: string }> = [
  { href: '/analyze', labelKey: 'navAnalyze' },
  { href: '/tools', labelKey: 'navTools' },
  { href: '/dimensions', labelKey: 'navDimensions' },
  { href: '/almanac', labelKey: 'navAlmanac' },
  { href: '/hehun', labelKey: 'navHehun' },
  { href: '/tools/naming', labelKey: 'navNaming' },
  { href: '/tools/fengshui-space', labelKey: 'navSpace' },
  { href: '/knowledge', labelKey: 'navKnowledge' },
  { href: '/teachers', labelKey: 'navTeachers' },
  { href: '/cases', labelKey: 'navCases' },
  { href: '/learn', labelKey: 'navLearn' },
  { href: '/membership', labelKey: 'navMembership' },
  { href: '/docs', labelKey: 'navDocs' },
  { href: '/engines', labelKey: 'navEngines', labelFallback: '引擎' },
];

export default function SiteFooter() {
  const { t, locale } = useLocale();

  return (
    <footer className="mt-auto border-t border-[color:var(--hairline)] bg-[color:var(--paper)]">
      <div className="page-frame py-10 md:py-12">
        <div className="lk-grid-2 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <BrandLockup size={28} className="!items-start" />
            <p className="mt-3 max-w-md text-[14px] leading-[1.65] text-[color:var(--ink-3)]">
              {t('footerTagline')}
            </p>
            <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5" aria-label="footer">
              {footerLinks.map((item) => {
                const label = t(item.labelKey);
                const text =
                  !label || label === item.labelKey
                    ? item.labelFallback || item.labelKey
                    : label;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[14px] font-medium text-[color:var(--ink-3)] transition hover:text-[color:var(--ink-1)] hover:no-underline"
                  >
                    {text}
                  </Link>
                );
              })}
            </nav>

            {/* Popular destiny topics + tools (people-facing labels only) */}
            <div className="mt-6 max-w-xl text-[12px] leading-[1.7] text-[color:var(--ink-4)]">
              <span className="font-medium text-[color:var(--ink-3)]">热门关注：</span>
              {[
                { href: '/topics/q-should-i-change-job', label: '该不该换工作' },
                { href: '/topics/q-when-to-marry', label: '谈婚论嫁' },
                { href: '/world-yi/logic', label: '世界易定义' },
                { href: '/topics/q-move-city', label: '迁城择居' },
                { href: '/topics/dimension-fortune-rhythm', label: '运势节奏' },
                { href: '/topics/dimension-career-industry', label: '工作行业' },
                { href: '/topics/tool-bazi-chart', label: '八字排盘' },
                { href: '/hehun', label: '合婚' },
                { href: '/tools/naming', label: '起名' },
                { href: '/hotlist', label: '更新榜' },
              ].map((item, i) => (
                <span key={item.href}>
                  {i > 0 ? ' · ' : ''}
                  <Link href={item.href} className="hover:text-[color:var(--ink-2)] hover:underline">
                    {item.label}
                  </Link>
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[14px]">
              <a
                href={OFFICIAL_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2} />
                <span>
                  {t('footerTelegram')} · {OFFICIAL_TELEGRAM_HANDLE}
                </span>
              </a>
              <a
                href={OFFICIAL_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                <Code2 className="h-3.5 w-3.5" strokeWidth={2} />
                <span>{OFFICIAL_GITHUB_LABEL}</span>
              </a>
            </div>
            <p className="mt-1.5 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
              {t('footerTelegramCta')}
            </p>

            <div className="mt-5">
              <LocaleSwitcher variant="light" />
            </div>
          </div>
          <SystemCapabilityFooterSignalsClient />
        </div>
        <div className="mt-8 border-t border-[color:var(--hairline)] pt-5 text-[13px] leading-[1.55] text-[color:var(--ink-4)]">
          © {new Date().getFullYear()} Life K-Line · {t('footerLegal')}
        </div>
        {locale === 'en' && t('contentLangNote') ? (
          <div className="mt-2 text-[13px] text-[color:var(--ink-4)]">{t('contentLangNote')}</div>
        ) : null}
      </div>
    </footer>
  );
}
