import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import { StickyAnalyzeBar } from '@/components/conversion/sticky-analyze-bar';
import JsonLd from '@/components/seo/json-ld';
import {
  getDestinyEntityHub,
  listDestinyEntityHubs,
  slotsForEntity,
  type DestinyEntityKind,
} from '@/lib/content-os';
import { buildPageMetadata, absoluteUrl } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function parseTopicSlug(raw: string): { kind: DestinyEntityKind; entitySlug: string } | null {
  const slug = decodeURIComponent(raw || '').trim();
  const prefixes: Array<{ prefix: string; kind: DestinyEntityKind }> = [
    { prefix: 'dimension-', kind: 'dimension' },
    { prefix: 'q-', kind: 'life-question' },
    { prefix: 'city-', kind: 'city' },
    { prefix: 'industry-', kind: 'industry' },
    { prefix: 'day-master-', kind: 'day-master' },
    { prefix: 'tool-', kind: 'tool' },
    { prefix: 'stage-', kind: 'life-stage' },
    { prefix: 'method-', kind: 'methodology' },
    { prefix: 'faq-', kind: 'faq' },
  ];
  for (const item of prefixes) {
    if (slug.startsWith(item.prefix)) {
      return { kind: item.kind, entitySlug: slug.slice(item.prefix.length) };
    }
  }
  const hub = listDestinyEntityHubs().find((h) => h.slug === slug || h.href.endsWith(`/${slug}`));
  if (hub) return { kind: hub.kind, entitySlug: hub.slug };
  return null;
}

export async function generateStaticParams() {
  return listDestinyEntityHubs().map((hub) => ({
    slug: hub.href.replace('/topics/', ''),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseTopicSlug(slug);
  const hub =
    getDestinyEntityHub(slug) ||
    (parsed
      ? listDestinyEntityHubs().find(
          (h) => h.kind === parsed.kind && h.slug === parsed.entitySlug,
        )
      : null);

  if (!hub) {
    return buildPageMetadata({
      title: '主题未找到',
      description: '人生命运主题库',
      path: `/topics/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${hub.name}｜人生命运主题`,
    description: `${hub.description} 从结构·时位·环境出发做可验证判断，连接人生K线工具与十维度研判。`,
    path: hub.href,
    keywords: [hub.name, '人生命运', '人生K线', '八字', hub.kind],
    type: 'article',
    multiLanguage: true,
  });
}

export default async function TopicEntityPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseTopicSlug(slug);
  if (!parsed) notFound();

  const hub =
    getDestinyEntityHub(slug) ||
    listDestinyEntityHubs().find(
      (h) => h.kind === parsed.kind && h.slug === parsed.entitySlug,
    );
  if (!hub) notFound();

  const relatedSlots = slotsForEntity(parsed.kind, parsed.entitySlug, [
    'zh-CN',
    'zh-TW',
    'en-US',
  ]).slice(0, 12);

  const sibling = listDestinyEntityHubs()
    .filter((h) => h.kind === hub.kind && h.slug !== hub.slug)
    .slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.name,
    description: hub.description,
    url: absoluteUrl(hub.href),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Life K-Line 人生K线',
      url: 'https://www.life-kline.com',
    },
  };

  return (
    <AppPage>
      <AnalyticsPageView page={hub.href} />
      <JsonLd data={jsonLd} />
      <FocusHero
        eyebrow={`主题实体 · ${hub.kind}`}
        title={hub.name}
        description={hub.description}
        actions={
          <>
            <Link
              href="/analyze"
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              免费排盘验证
            </Link>
            <Link
              href="/topics"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              返回主题库
            </Link>
            <Link
              href="/dimensions"
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              十维度
            </Link>
          </>
        }
      />

      <section className="mx-auto max-w-3xl px-4 py-6 space-y-4 text-[15px] leading-relaxed text-[color:var(--ink-2)]">
        <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">这个主题解决什么</h2>
        <p>
          「{hub.name}」是人生K线内容体系中的<strong>命运实体页</strong>
          （对标成熟站点的 App/游戏实体 SEO 页）。我们不堆吉凶标签，而是把问题拆成：
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            <strong>结构</strong>：你的日主发挥方式与用神方向像不像这件事
          </li>
          <li>
            <strong>时位</strong>：大运/流年窗口是否允许推进或应收敛
          </li>
          <li>
            <strong>环境</strong>：城市、行业、家庭与现金流硬约束
          </li>
          <li>
            <strong>动作</strong>：30–90 天可验证的一小步
          </li>
          <li>
            <strong>风险</strong>：不适用边界与回访校准
          </li>
        </ol>

        <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">建议路径</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>阅读本主题相关知识/案例（Content OS 持续补齐）</li>
          <li>
            <Link href="/analyze" className="underline">
              生成人生K线
            </Link>{' '}
            或进入对应十维度
          </li>
          <li>
            用{' '}
            <Link href="/predictions" className="underline">
              预测回访
            </Link>{' '}
            验证窗口
          </li>
          <li>需要深聊时进入请老师 / 对话</li>
        </ol>

        <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">多语言覆盖计划</h2>
        <p>
          同一实体会按市场扩展：zh-CN / zh-TW / zh-HK / zh-SG / zh-MY / zh-US / en-US / en-GB /
          en-SG。英文与繁体为原生改写标准，不是整站机翻。
        </p>
      </section>

      {relatedSlots.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">规划中的内容矩阵</h2>
          <p className="mt-1 text-sm text-[color:var(--ink-4)]">
            由 Content OS 按优先级生成；下列为该实体在多语言下的主题槽位。
          </p>
          <ul className="mt-4 space-y-2">
            {relatedSlots.map((slot) => (
              <li
                key={slot.key}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--paper-2,#f5f5f4)] px-2 py-0.5 text-xs text-[color:var(--ink-3)]">
                    {slot.locale}
                  </span>
                  <span className="rounded-full bg-[color:var(--paper-2,#f5f5f4)] px-2 py-0.5 text-xs text-[color:var(--ink-3)]">
                    {slot.template}
                  </span>
                  <span className="rounded-full bg-[color:var(--paper-2,#f5f5f4)] px-2 py-0.5 text-xs text-[color:var(--ink-4)]">
                    {slot.contentType}
                  </span>
                </div>
                <p className="mt-1 font-medium text-[color:var(--ink-1)]">{slot.topic}</p>
                <p className="mt-0.5 text-[color:var(--ink-3)]">{slot.angle}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sibling.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">同类型主题</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sibling.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-sm hover:border-[color:var(--brand)]"
              >
                <div className="font-medium text-[color:var(--ink-1)]">{item.name}</div>
                <div className="mt-1 line-clamp-2 text-[color:var(--ink-4)]">{item.description}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <StickyAnalyzeBar />
    </AppPage>
  );
}
