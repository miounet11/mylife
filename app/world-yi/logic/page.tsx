import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import { PageJsonLd, PageSeoGeoSection, metadataFromPagePack } from '@/components/seo/page-seo-geo';
import { getPageSeoGeoPack } from '@/lib/page-seo-geo-packs';
import JsonLd from '@/components/seo/json-ld';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { WorldYiLogicDesk } from '@/components/world-yi/world-yi-logic-desk';
import {
  WORLD_YI_LOGIC_AXIOMS,
  WORLD_YI_TERMS,
  listWorldYiLayers,
} from '@/lib/world-yi-logic';
import { WORLD_YI_ARCHITECTURE, WORLD_YI_MOTHER_TONGUE } from '@/lib/world-yi-architecture';

export const metadata: Metadata = metadataFromPagePack('/world-yi/logic', {
  title: '世界易定义与处境｜结构时位环境如何解释现实｜人生K线',
  description:
    '世界易用当代变化重读易学、玄学、神学、心理学、星座与哲学。组织法：结构、时位、环境、动作、风险、复盘。测算报告与易学事实并行展示。',
});

export default function WorldYiLogicPage() {
  const seoPack = getPageSeoGeoPack('/world-yi/logic');
  const layers = listWorldYiLayers();

  return (
    <AppPage header={{ ctaHref: '/analyze?source=world_yi_logic', ctaLabel: '接到我的报告', compact: true }}>
      {seoPack ? <PageJsonLd pack={seoPack} /> : null}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: '首页', path: '/' },
          { name: '世界易', path: '/world-yi' },
          { name: '定义与处境', path: '/world-yi/logic' },
        ])}
      />
      <AnalyticsPageView
        eventName="world_yi_logic_viewed"
        page="/world-yi/logic"
        meta={{ surfaceKey: 'world_yi_logic' }}
      />

      <div className="page-content space-y-6 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="世界易 · 定义"
          title="先有定义，才能解释眼前这件事"
          description="先问像不像，再问好不好。结构是出厂设置，时位是抬升或收敛，环境是硬约束，动作必须 30 天可回访。用这一套组织法重读历史里的易、玄、神、心、星、哲。"
          actions={
            <>
              <Link href="/world-yi" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                世界易总入口
              </Link>
              <Link
                href="/knowledge/world-yi-methodology"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                六步判断法
              </Link>
              <Link
                href="/analyze?source=world_yi_logic"
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                接到报告
              </Link>
            </>
          }
        />

        <LightBirthBridge
          source="world_yi_logic"
          page="/world-yi/logic"
          title="定义是公共的，结构是你的"
          description="下面的层对所有人一样；接到报告后，易学给出日主用神，世界易引擎给出判断语言。"
        />

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            知识架构
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">新版本怎么分层</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            {WORLD_YI_MOTHER_TONGUE.join(' ')}
          </p>
          <ol className="mt-4 divide-y divide-[color:var(--hairline)]">
            {WORLD_YI_ARCHITECTURE.map((node, i) => (
              <li key={node.id} className="grid gap-1 py-3 md:grid-cols-[88px_minmax(0,1fr)]">
                <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                  {i + 1}. {node.name}
                </p>
                <div>
                  <p className="text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{node.role}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
                    {node.children.map((c) => c.label).join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            六层定义
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">判断顺序不可乱</h2>
          <ol className="mt-4 divide-y divide-[color:var(--hairline)]">
            {layers.map((layer) => (
              <li key={layer.id} className="grid gap-2 py-3 md:grid-cols-[88px_minmax(0,1fr)]">
                <div>
                  <p className="text-[13px] font-semibold text-[color:var(--ink-1)]">{layer.name}</p>
                  <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">{layer.oneLiner}</p>
                </div>
                <div className="space-y-1.5 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">
                  <p>{layer.definition}</p>
                  <p className="text-[12px] text-[color:var(--ink-4)]">田喻：{layer.fieldMetaphor}</p>
                  <p className="text-[12px] text-[color:var(--ink-5)]">
                    对应：{layer.baziAnchor} · {layer.refuse}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            核心用语
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">把术语从名词拉回动词</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {WORLD_YI_TERMS.map((term) => (
              <div key={term.id} className="border-t border-[color:var(--hairline)] pt-3">
                <dt className="text-[14px] font-semibold text-[color:var(--ink-1)]">{term.name}</dt>
                <dd className="mt-1 space-y-1 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">
                  <p>{term.definition}</p>
                  <p className="text-[12px] text-[color:var(--ink-4)]">{term.usedWhen}</p>
                  <p className="text-[12px] text-[color:var(--ink-5)]">{term.refuse}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            公理
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">
            {WORLD_YI_LOGIC_AXIOMS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <WorldYiLogicDesk />
        <PageSeoGeoSection pathOrSlug="/world-yi/logic" />
      </div>
    </AppPage>
  );
}
