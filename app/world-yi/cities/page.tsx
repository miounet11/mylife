import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import {
  WORLD_YI_CITY_METHOD_BLURB,
  groupWorldYiCitiesByRegion,
  listWorldYiCityCards,
  tempoLabel,
} from '@/lib/world-yi-cities';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import JsonLd from '@/components/seo/json-ld';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = metadataFromPagePack('/world-yi/cities', {
  title: '世界易城市主题｜迁城择地·环境层压力测试｜人生K线',
  description:
    '把城市当成环境层而非吉凶标签：对照成本、行业密度与节奏，接到居家环境维度与个人结构报告。覆盖国内与海外华人城市。',
});

export default async function WorldYiCitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const en = locale === 'en';
  const groups = groupWorldYiCitiesByRegion();
  const all = listWorldYiCityCards();
  const seoPack = getPageSeoGeoPack('/world-yi/cities');

  return (
    <AppPage header={{ ctaHref: '/analyze?source=world_yi_cities', ctaLabel: en ? 'My report' : '接到我的报告', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: en ? 'Home' : '首页', path: '/' },
          { name: en ? 'World Yi' : '世界易', path: '/world-yi' },
          { name: en ? 'Cities' : '城市主题', path: '/world-yi/cities' },
        ])}
      />
      <JsonLd
        data={buildItemListJsonLd(
          en ? 'World Yi city lenses' : '世界易城市观察',
          all.map((c) => ({ name: en ? c.titleEn : c.title, path: en ? c.hrefEn : c.href })),
        )}
      />
      <AnalyticsPageView
        eventName="world_yi_cities_viewed"
        page="/world-yi/cities"
        meta={{ surfaceKey: 'world_yi_cities', cityCount: all.length, geoReady: true }}
      />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'World Yi · City theme' : '世界易 · 城市主题'}
          title={en ? 'City as environment layer' : '城市是环境层，不是吉凶名单'}
          description={
            en
              ? 'Structure → timing → environment → action → risk. Read density, cost, and industry tempo — then test with your own chart.'
              : WORLD_YI_CITY_METHOD_BLURB
          }
          actions={
            <>
              <Link href="/insights" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'All insights' : '全部洞察'}
              </Link>
              <Link
                href="/dimensions/living-environment"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Living environment' : '居家环境维度'}
              </Link>
              <Link
                href="/analyze?source=world_yi_cities&intent=yearly"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Generate report' : '生成结构报告'}
              </Link>
            </>
          }
          footer={
            <span className="text-[12px] text-[color:var(--ink-5)]">
              {en ? `${all.length} cities · domestic + diaspora` : `${all.length} 座城市 · 国内与海外华人场景`}
            </span>
          }
        />

        <LightBirthBridge
          source="world_yi_cities"
          page="/world-yi/cities"
          title={en ? 'Connect the city lens to your chart' : '把城市观察接到你的命盘'}
          description={
            en
              ? 'City pages explain environment pressure. Your report locks day-master and useful-god rhythm so the match is personal.'
              : '城市页讲环境压力；结构报告锁定日主与用神节奏，对照才是你自己的。'
          }
        />

        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">
            {en ? 'How we read cities' : '我们如何读城市'}
          </h2>
          <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '1. Structure' : '1. 结构'}</strong>
              {' — '}
              {en
                ? 'Day master & useful-god style: build / express / coordinate / conserve.'
                : '日主与用神发挥方式：建设 / 表达 / 协调 / 收敛。'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '2. Timing' : '2. 时位'}</strong>
              {' — '}
              {en
                ? 'Is this decade/year a re-layout window or a conserve window?'
                : '当前大运流年是允许重排环境，还是宜守成验证？'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '3. Environment' : '3. 环境'}</strong>
              {' — '}
              {en
                ? 'City cost, industry density, commute, family duty — pressure test, not fate.'
                : '城市成本、行业密度、通勤与家庭责任：压力测试，不是地理定命。'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '4. Action & risk' : '4. 动作与风险'}</strong>
              {' — '}
              {en
                ? '30–90 day reversible tests before a one-way bet.'
                : '先做 30–90 天可逆验证，再谈一次押注式迁城。'}
            </li>
          </ol>
        </section>

        {groups.map((group) => (
          <section key={group.region}>
            <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">
              {en ? group.regionEn : group.region}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={en ? city.hrefEn : city.href}
                    className="flex h-full flex-col rounded-xl border border-[color:var(--hairline)] bg-white p-4 no-underline transition hover:border-[color:var(--brand)] hover:no-underline"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-[color:var(--ink-5)]">
                          {en ? city.regionEn : city.region}
                        </div>
                        <h3 className="mt-0.5 text-[16px] font-bold text-[color:var(--ink-1)]">
                          {en ? city.cityEn : city.city}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[10px] text-[color:var(--ink-4)]">
                        {tempoLabel(city.tempo, en)}
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                      {en ? city.summaryEn : city.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(en ? city.focusEn : city.focus).map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] text-[color:var(--ink-4)]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <span className="mt-3 text-[12px] font-semibold text-[color:var(--brand)]">
                      {en ? 'Open city lens →' : '打开城市观察 →'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <strong className="text-[color:var(--ink-2)]">
            {en ? 'Product stance' : '产品立场'}
          </strong>
          {en
            ? ' — We do not rank “lucky cities”. We help you pressure-test environment against structure and timing, then design reversible actions. Video-style city content is welcome when it stays falsifiable.'
            : ' — 我们不做「幸运城市排行」。我们把城市当环境压力测试，对齐结构与时位后，设计可逆动作。短视频式城市话题可以接入，但结论必须可验证、不恐吓。'}
        </section>

        <PageSeoGeoSection pathOrSlug="/world-yi/cities" />
      </div>
    </AppPage>
  );
}
