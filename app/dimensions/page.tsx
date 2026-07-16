import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionGrid from '@/components/dimensions/dimension-grid';
import JsonLd from '@/components/seo/json-ld';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { listDimensionsByPriority, MVP_DIMENSION_SLUGS, DIMENSIONS } from '@/lib/dimensions/config';
import {
  INTENT_HINT,
  INTENT_LABEL,
  intentPrimaryCta,
  parseSourceIntent,
} from '@/lib/dimensions/intent-source';
import {
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildPageMetadata,
  buildServiceJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '十维度深度研判｜运势节奏、事业行业、投资婚恋等场景入口',
  description:
    '人生K线十维度把用户最关心的问题拆成可执行场景：运势节奏、工作行业、投资理财、谈婚论嫁、健康、起名、择时等。基于八字引擎输出结论、行动建议与可验证预测，并与知识库、工具中心内链互通。',
  path: '/dimensions',
  keywords: [
    '十维度研判',
    '运势节奏分析',
    '八字事业行业',
    '八字投资理财',
    '谈婚论嫁择时',
    '起名改名五行',
    '人生K线',
  ],
});

export default async function DimensionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; intent?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const source = `${sp.source || sp.intent || ''}`.trim();
  const intent = parseSourceIntent(source);
  const p0 = listDimensionsByPriority('p0');
  const p1Count = listDimensionsByPriority('p1').length;
  const p2Count = listDimensionsByPriority('p2').length;
  const primary = intentPrimaryCta(intent);
  const primaryHref = source
    ? `${primary.href}${primary.href.includes('?') ? '&' : '?'}source=${encodeURIComponent(source)}`
    : primary.href;

  const itemList = buildItemListJsonLd(
    '人生K线十维度深度研判',
    DIMENSIONS.map((item) => ({ name: item.title, path: `/dimensions/${item.slug}` })),
  );
  const service = buildServiceJsonLd({
    name: '人生K线十维度深度研判',
    description: '问题导向的命理场景研判，输出结构判断、行动建议与可回访预测。',
    path: '/dimensions',
    areaServed: ['中国', '北美华人社区', '澳洲华人社区', '欧洲华人社区', '东亚华人社区'],
  });
  const faq = buildFaqJsonLd([
    {
      question: '十维度和完整八字报告有什么区别？',
      answer:
        '完整报告看全局结构；十维度先回答一个具体问题（如行业、投资、婚恋）。可先维度后报告，也可先报告后维度深挖。',
    },
    {
      question: '十维度结论可以验证吗？',
      answer: '可以。每条场景会输出带时间窗的预测，并同步到预测回访，支持命中/部分/未命中反馈。',
    },
    {
      question: '适合海外用户吗？',
      answer:
        '适合。结构判断基于出生信息；环境层可结合城市观察与迁移维度，用于海外华人阶段决策参考。',
    },
  ]);

  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '完整报告', compact: true }}>
      <AnalyticsPageView
        eventName="dimensions_page_viewed"
        page="/dimensions"
        meta={{
          surfaceKey: 'dimensions',
          p0Count: p0.length,
          p1Count,
          p2Count,
          source: source || null,
          intent,
        }}
      />
      <JsonLd data={itemList} />
      <JsonLd data={service} />
      <JsonLd data={faq} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-16 md:space-y-6 md:py-8">
        <FocusHero
          eyebrow="十维度"
          title={intent === 'general' ? '场景研判' : INTENT_LABEL[intent]}
          description={INTENT_HINT[intent]}
          actions={
            <>
              <Link
                href={primaryHref}
                className="font-medium text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                {primary.label}
              </Link>
              <Link href="/predictions" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                预测回访
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                工具
              </Link>
              <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                完整报告
              </Link>
            </>
          }
        />

        {intent !== 'general' ? (
          <p className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
            来源：工作台主题「{INTENT_LABEL[intent]}」。下面已把更相关的维度排在前面，也可直接
            <Link href={primaryHref} className="mx-1 text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              {primary.label}
            </Link>
            。
          </p>
        ) : null}

        <DimensionGrid intent={intent} source={source} />

        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
          <Link href="/analyze" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            完整报告
          </Link>
          <Link href="/teachers" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            请老师
          </Link>
          <Link href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            合婚
          </Link>
          <Link href="/learn" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            专题
          </Link>
        </nav>

        <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
          已开放 {MVP_DIMENSION_SLUGS.length} 个可用场景
          {p0.length ? ` · 常用：${p0.map((item) => item.title).join('、')}` : ''}
          {p1Count || p2Count ? ` · 另有 ${p1Count + p2Count} 个在扩展` : ''}。
        </p>
      </div>
    </AppPage>
  );
}
