import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import {
  ERA_FOUR_PHASES,
  ERA_HYPOTHESES,
  ERA_THREE_LAYERS,
  WORLD_YI_ERA_METHOD_BLURB,
  WORLD_YI_ERA_METHOD_BLURB_EN,
  listEraKnowledgeLinks,
} from '@/lib/world-yi-era-timing';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import JsonLd from '@/components/seo/json-ld';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = metadataFromPagePack('/world-yi/era-timing', {
  title: '世界易时代天时｜星象周期·社会压力·技术阶段｜人生K线',
  description:
    '把天文/占星周期写成时代环境层：外行星拐点、土木社会压力、火逆摩擦窗口与四象阶段。可回测假设，不替代个人结构与大运。',
});

export default async function WorldYiEraTimingPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const en = locale === 'en';
  const seoPack = getPageSeoGeoPack('/world-yi/era-timing');
  const knowledge = listEraKnowledgeLinks();

  return (
    <AppPage
      header={{
        ctaHref: '/analyze?source=world_yi_era_timing',
        ctaLabel: en ? 'My report' : '接到我的报告',
        compact: true,
      }}
    >
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: en ? 'Home' : '首页', path: '/' },
          { name: en ? 'World Yi' : '世界易', path: '/world-yi' },
          { name: en ? 'Era timing' : '时代天时', path: '/world-yi/era-timing' },
        ])}
      />
      <JsonLd
        data={buildItemListJsonLd(
          en ? 'World Yi era-timing knowledge' : '世界易时代天时知识',
          knowledge.map((k) => ({ name: en ? k.titleEn : k.title, path: k.href })),
        )}
      />
      <AnalyticsPageView
        eventName="world_yi_era_timing_viewed"
        page="/world-yi/era-timing"
        meta={{ surfaceKey: 'world_yi_era_timing', geoReady: true }}
      />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={en ? 'World Yi · Era timing' : '世界易 · 时代天时'}
          title={en ? 'Sky time as environment layer' : '天时是环境层，不是命运开关'}
          description={en ? WORLD_YI_ERA_METHOD_BLURB_EN : WORLD_YI_ERA_METHOD_BLURB}
          actions={
            <>
              <Link href="/world-yi/cities" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {en ? 'City theme' : '城市主题'}
              </Link>
              <Link
                href="/tools/zodiac"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Personal zodiac' : '个人星座'}
              </Link>
              <Link
                href="/analyze?source=world_yi_era_timing&intent=yearly"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {en ? 'Structure report' : '结构报告'}
              </Link>
            </>
          }
          footer={
            <span className="text-[12px] text-[color:var(--ink-5)]">
              {en
                ? 'Macro lens · pair with day-master structure · falsifiable hypotheses'
                : '宏观透镜 · 对齐日主结构 · 假设可回访证伪'}
            </span>
          }
        />

        <LightBirthBridge
          source="world_yi_era_timing"
          page="/world-yi/era-timing"
          title={en ? 'Connect era base color to your chart' : '把时代底色接到你的命盘'}
          description={
            en
              ? 'Era timing sets the weather. Your report locks structure and personal decade windows so the match is personal.'
              : '时代天时讲天气；结构报告锁定日主与个人大运，对照才是你自己的。'
          }
        />

        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">
            {en ? 'How World Yi places celestial cycles' : '世界易如何安放星象周期'}
          </h2>
          <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '1. Structure first' : '1. 结构优先'}</strong>
              {' — '}
              {en
                ? 'Day master & useful-god style are not rewritten by outer planets.'
                : '日主与用神发挥方式不被外行星改写。'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">{en ? '2. Personal timing' : '2. 个人时位'}</strong>
              {' — '}
              {en
                ? 'Decade/year windows decide whether you amplify or conserve in this weather.'
                : '大运流年决定你在这波天气里是放大还是收敛。'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">
                {en ? '3. Dual environment' : '3. 双重环境'}
              </strong>
              {' — '}
              {en
                ? 'City = spatial pressure; era timing = temporal pressure.'
                : '城市 = 空间压力；时代天时 = 时间压力。'}
            </li>
            <li>
              <strong className="text-[color:var(--ink-1)]">
                {en ? '4. Action & falsify' : '4. 动作与证伪'}
              </strong>
              {' — '}
              {en
                ? 'Log hypotheses on the event calendar; score hit / partial / miss later.'
                : '假设写入事件日历，事后打分：命中 / 部分 / 落空。'}
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Three-layer analysis' : '三层星象分析'}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {ERA_THREE_LAYERS.map((layer) => (
              <li
                key={layer.id}
                className="flex h-full flex-col rounded-xl border border-[color:var(--hairline)] bg-white p-4"
              >
                <div className="text-[11px] text-[color:var(--ink-5)]">
                  {en ? layer.worldYiSlotEn : layer.worldYiSlot}
                </div>
                <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">
                  {en ? layer.titleEn : layer.title}
                </h3>
                <p className="mt-1 text-[11px] text-[color:var(--brand)]">
                  {en ? layer.symbolsEn : layer.symbols}
                </p>
                <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                  {en ? layer.bodyEn : layer.body}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-3)]">
                  <strong className="text-[color:var(--ink-2)]">{en ? 'Do' : '宜'}</strong>
                  {' · '}
                  {en ? layer.doEn : layer.do}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
                  <strong>{en ? 'Don’t' : '忌'}</strong>
                  {' · '}
                  {en ? layer.dontEn : layer.dont}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Four-phase stage model' : '四象阶段论'}
          </h2>
          <p className="mb-3 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {en
              ? 'From garage incubation to rule-making — map tech/industry stage to how your structure prefers to work.'
              : '从车库孵化到规则制定：把技术/行业阶段对照你的结构更适合哪种发挥方式。'}
          </p>
          <ol className="grid gap-3 sm:grid-cols-2">
            {ERA_FOUR_PHASES.map((phase) => (
              <li
                key={phase.id}
                className="rounded-xl border border-[color:var(--hairline)] bg-white p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[color:var(--ink-1)]">
                    <span className="mr-2 text-[color:var(--ink-5)]">{phase.order}</span>
                    {en ? phase.titleEn : phase.title}
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
                  {en ? phase.metaphorEn : phase.metaphor}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
                  {en ? phase.careerHintEn : phase.careerHint}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
                  {en ? phase.structureAskEn : phase.structureAsk}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Open hypotheses (score later)' : '开放假设（事后打分）'}
          </h2>
          <p className="mb-3 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {en
              ? 'Inspired by popular Uranus×mansion tech narratives. Treated as calibratable claims — not scientific proof or investment advice.'
              : '受「天王星×星宿×技术阶段」类叙事启发。按可校准主张处理——不是科学定论，也不是投资建议。'}
          </p>
          <ul className="space-y-3">
            {ERA_HYPOTHESES.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">
                    {en ? h.labelEn : h.label}
                  </h3>
                  <span className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[10px] text-[color:var(--ink-4)]">
                    {h.status === 'open' ? (en ? 'Open' : '开放') : en ? 'Watching' : '观察中'} ·{' '}
                    {en ? `by ${h.observeByEn}` : `回访截止 ${h.observeBy}`}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
                  {en ? h.claimEn : h.claim}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
                  <strong className="text-[color:var(--ink-4)]">{en ? 'Falsify if' : '证伪条件'}</strong>
                  {' — '}
                  {en ? h.falsifyIfEn : h.falsifyIf}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-[14px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Deep reads' : '深入阅读'}
          </h2>
          <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {knowledge.map((k) => (
              <li key={k.href}>
                <Link href={k.href} className="block py-3 no-underline hover:no-underline">
                  <h3 className="text-[14px] font-medium text-[color:var(--ink-1)] hover:underline">
                    {en ? k.titleEn : k.title}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                    {en ? k.summaryEn : k.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <strong className="text-[color:var(--ink-2)]">{en ? 'Product stance' : '产品立场'}</strong>
          {en
            ? ' — Personal zodiac tools stay lightweight expression. Era timing is macro weather. Single indicators never override structure, cash flow, visa, or health. Market variables are complex; treat cycle narratives as one lens among many.'
            : ' — 个人星座工具保持轻量表达层；时代天时是宏观天气。单一指标永不覆盖结构、现金流、签证与健康。市场变量复杂，周期叙事只是多透镜之一。'}
        </section>

        <div className="grid gap-2 sm:grid-cols-3">
          <Link
            href="/world-yi/cities"
            className="rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--ink-1)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
          >
            {en ? 'Spatial: cities' : '空间：城市主题'}
          </Link>
          <Link
            href="/dimensions/fortune-rhythm"
            className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-center text-[12px] font-semibold text-[color:var(--ink-1)] no-underline hover:border-[color:var(--brand)] hover:no-underline"
          >
            {en ? 'Personal rhythm' : '个人运势节奏'}
          </Link>
          <Link
            href="/analyze?source=world_yi_era_timing&intent=yearly"
            className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand)] px-3 py-2.5 text-center text-[12px] font-semibold text-white no-underline hover:bg-[color:var(--brand-strong)] hover:no-underline"
          >
            {en ? 'Generate report' : '生成结构报告'}
          </Link>
        </div>

        <PageSeoGeoSection pathOrSlug="/world-yi/era-timing" />
      </div>
    </AppPage>
  );
}
