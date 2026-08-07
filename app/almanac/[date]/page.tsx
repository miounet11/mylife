import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AlmanacApp from '@/components/almanac/almanac-app';
import AlmanacAstroBridge from '@/components/almanac/almanac-astro-bridge';
import AlmanacTearSheet from '@/components/almanac/almanac-tear-sheet';
import AnalyticsPageView from '@/components/analytics-page-view';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { AppPage } from '@/components/layout/app-page';
import JsonLd from '@/components/seo/json-ld';
import { buildAlmanacDayPack, todayDateString } from '@/lib/almanac/day-pack';
import { buildPersonalDayOverlay } from '@/lib/almanac/personal-day';
import { resolveUserChartForAlmanac } from '@/lib/almanac/resolve-user-chart';
import { getAuthSession } from '@/lib/auth';
import {
  almanacDaySeoCopy,
  almanacFaqCopy,
  almanacHubCopy,
  almanacUiCopy,
} from '@/lib/i18n/almanac-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
  buildProductLanguageAlternates,
  withLocalePrefix,
} from '@/lib/seo';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ date: string }>;
  searchParams?: Promise<{ skin?: string; region?: string; lang?: string }>;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return Boolean(buildAlmanacDayPack(date));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = (await getRequestLocale(sp.lang)) as SiteLocale;
  if (!isValidDate(date)) {
    return { title: locale === 'en' ? 'Almanac' : '万年历' };
  }
  const pack = buildAlmanacDayPack(date)!;
  const seo = almanacDaySeoCopy(locale, {
    date,
    dayGanZhi: pack.lunar.dayGanZhi,
    lunarText: pack.lunar.lunarText,
    yi: pack.yi,
    ji: pack.ji,
    liuYao: pack.liuYao,
    western: locale === 'en' ? pack.westernSignEn : pack.westernSign,
  });
  const path = `/almanac/${date}`;
  const uiLocale = locale === 'en' ? 'en' : locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';

  const base = buildPageMetadata({
    title: seo.title,
    description: (seo.description || pack.longSummary).slice(0, 160),
    path: withLocalePrefix(path, uiLocale),
    locale: uiLocale,
    keywords: seo.keywords,
    type: 'article',
    multiLanguage: true,
    languages: buildProductLanguageAlternates(path),
  });
  // Prefer file-based opengraph-image route; keep absolute fallback for scrapers
  const ogPath = `/almanac/${date}/opengraph-image`;
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [{ url: absoluteUrl(ogPath), width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      ...base.twitter,
      images: [absoluteUrl(ogPath)],
    },
  };
}

export default async function AlmanacDatePage({ params, searchParams }: PageProps) {
  const { date } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = (await getRequestLocale(sp.lang)) as SiteLocale;
  const hub = almanacHubCopy(locale);
  const ui = almanacUiCopy(locale);

  if (date === 'today') {
    const q = new URLSearchParams();
    if (sp.skin) q.set('skin', sp.skin);
    if (sp.region) q.set('region', sp.region);
    if (sp.lang) q.set('lang', sp.lang);
    const qs = q.toString();
    redirect(`/almanac/${todayDateString()}${qs ? `?${qs}` : ''}`);
  }
  if (!isValidDate(date)) notFound();

  const pack = buildAlmanacDayPack(date)!;
  const year = pack.year;
  const month = pack.month;

  const session = await getAuthSession();
  const userId = session.user?.id || (await getOrCreateGuestUserId().catch(() => null));
  const chart = await resolveUserChartForAlmanac(userId);
  const personal = chart ? buildPersonalDayOverlay(pack, chart) : null;
  const faqs = almanacFaqCopy(locale, date, pack);

  const path = `/almanac/${date}`;
  const seo = almanacDaySeoCopy(locale, {
    date,
    dayGanZhi: pack.lunar.dayGanZhi,
    lunarText: pack.lunar.lunarText,
    yi: pack.yi,
    ji: pack.ji,
    liuYao: pack.liuYao,
    western: locale === 'en' ? pack.westernSignEn : pack.westernSign,
  });

  return (
    <AppPage header={{ ctaHref: '/analyze?source=almanac_day', ctaLabel: hub.ctaReport, compact: true }}>
      <AnalyticsPageView
        eventName="almanac_day_viewed"
        page={path}
        meta={{
          surfaceKey: 'almanac_day',
          date,
          locale,
          hasPersonal: Boolean(personal),
          geoReady: true,
        }}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          {
            name: locale === 'en' ? 'Home' : locale === 'zh-Hant' ? '首頁' : '首页',
            path: '/',
          },
          {
            name: locale === 'en' ? 'Almanac' : locale === 'zh-Hant' ? '萬年曆' : '万年历',
            path: '/almanac',
          },
          { name: date, path },
        ])}
      />
      <JsonLd
        data={buildArticleJsonLd({
          title: seo.title,
          description: seo.description,
          path,
          keywords: seo.keywords,
          inLanguage: locale === 'en' ? 'en' : locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN',
        })}
      />
      <JsonLd data={buildFaqJsonLd(faqs)} />
      {/* AI / GEO hint meta via JSON-LD dataset */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: seo.title,
          description: pack.longSummary,
          url: absoluteUrl(path),
          keywords: seo.keywords.join(', '),
          inLanguage: locale === 'en' ? 'en' : 'zh',
          creator: { '@type': 'Organization', name: 'Life K-Line' },
        }}
      />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <Link
            href={sp.lang ? `/almanac?lang=${sp.lang}` : '/almanac'}
            className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            ← {ui.backToday}
          </Link>
          <span className="text-[color:var(--ink-5)]">/</span>
          <span className="text-[color:var(--ink-3)]">{date}</span>
          <span className="text-[color:var(--ink-5)]">·</span>
          <Link
            href={`${path}?lang=zh-CN`}
            className="text-[12px] text-[color:var(--ink-4)] underline-offset-2 hover:underline"
          >
            简
          </Link>
          <Link
            href={`${path}?lang=zh-Hant`}
            className="text-[12px] text-[color:var(--ink-4)] underline-offset-2 hover:underline"
          >
            繁
          </Link>
          <Link
            href={`${path}?lang=en`}
            className="text-[12px] text-[color:var(--ink-4)] underline-offset-2 hover:underline"
          >
            EN
          </Link>
        </div>

        {/* SSR traditional sheet for SEO + first paint */}
        <AlmanacTearSheet pack={pack} personal={personal} />

        {/* Same-day zodiac engine bridge */}
        <AlmanacAstroBridge date={date} />

        {!personal ? (
          <LightBirthBridge
            source="almanac_day"
            page={path}
            title={ui.bindTitle}
            description={ui.bindDesc}
          />
        ) : null}

        <AlmanacApp
          initialYear={year}
          initialMonth={month}
          initialDate={date}
          navigateOnSelect
          initialSkin={sp.skin || 'tear'}
          initialRegion={sp.region}
          locale={locale}
          suppressDefaultTear
        />

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">
            {locale === 'en' ? 'FAQ' : locale === 'zh-Hant' ? '常見問題' : '常见问题'}
          </h2>
          <ul className="mt-3 space-y-3">
            {faqs.map((f) => (
              <li key={f.question}>
                <h3 className="text-[13px] font-semibold text-[color:var(--ink-2)]">{f.question}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{f.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppPage>
  );
}
