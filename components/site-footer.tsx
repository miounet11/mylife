'use client';

import Link from 'next/link';
import { Github, Send } from 'lucide-react';
import SystemCapabilityFooterSignalsClient from '@/components/system-capability-footer-signals-client';
import { useLocale } from '@/components/i18n/locale-provider';
import LocaleSwitcher from '@/components/i18n/locale-switcher';
import {
  OFFICIAL_GITHUB_LABEL,
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';

const footerLinks: Array<{ href: string; labelKey?: string; label?: string }> = [
  { href: '/world-yi', labelKey: 'navWorldYi' },
  { href: '/knowledge', labelKey: 'navKnowledge' },
  { href: '/cases', labelKey: 'navCases' },
  { href: '/learn', labelKey: 'navLearn' },
  { href: '/docs', labelKey: 'navDocs' },
  { href: '/membership', labelKey: 'navMembership' },
  { href: '/movement', label: '运动与传播' },
];

export default function SiteFooter() {
  const { t, locale } = useLocale();
  const brand = t('brandName');

  return (
    <footer className="mt-auto border-t border-[color:var(--hairline)] bg-[color:var(--paper)]">
      <div className="page-frame py-10 md:py-12">
        <div className="lk-grid-2 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.015em] text-[color:var(--ink-1)]">
              {locale === 'en' ? (
                <>
                  Life <span className="font-serif">K</span>-Line · LIFE KLINE
                </>
              ) : (
                <>
                  {brand.includes('K') ? (
                    <>
                      {brand.slice(0, brand.indexOf('K'))}
                      <span className="font-serif">K</span>
                      {brand.slice(brand.indexOf('K') + 1)}
                    </>
                  ) : (
                    brand
                  )}{' '}
                  · LIFE KLINE
                </>
              )}
            </div>
            <p className="mt-3 max-w-md text-[14px] leading-[1.65] text-[color:var(--ink-3)]">
              {t('footerTagline')}
            </p>
            <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5" aria-label="footer">
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[14px] font-medium text-[color:var(--ink-3)] transition hover:text-[color:var(--ink-1)] hover:no-underline"
                >
                  {item.labelKey ? t(item.labelKey) : item.label}
                </Link>
              ))}
            </nav>

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
                <Github className="h-3.5 w-3.5" strokeWidth={2} />
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
