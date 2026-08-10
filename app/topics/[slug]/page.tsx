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
  listContentForEntity,
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

  const publishedArticles = listContentForEntity({
    entityKind: parsed.kind,
    entitySlug: parsed.entitySlug,
    limit: 10,
  });

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
          「{hub.name}」帮助你把一件真实的人生问题拆开：不先贴吉凶标签，而是看结构是否匹配、时位是否允许、环境有没有硬约束。
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
          <li>先读本主题下的相关知识与案例</li>
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
      </section>

      {publishedArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink-1)]">相关阅读</h2>
          <p className="mt-1 text-sm text-[color:var(--ink-4)]">
            围绕本主题的深度文章与案例，便于继续拆解你的具体处境。
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {publishedArticles.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 hover:border-[color:var(--brand)]"
                >
                  <div className="mt-1 font-medium text-[color:var(--ink-1)]">{item.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-[color:var(--ink-3)]">{item.excerpt}</p>
                </Link>
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
