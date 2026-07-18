import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import ToolRecommendations from '@/components/tool-recommendations';
import { toolCategoryToIntent } from '@/lib/content-crosslinks';
import {
  getToolCategory,
  getToolsForCategory,
  TOOL_CATEGORY_META,
} from '@/lib/portal-tools';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const key = getToolCategory(category);
  if (!key) return { title: '工具分类' };
  return { title: `${TOOL_CATEGORY_META[key].title}｜工具中心` };
}

export default async function ToolCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const key = getToolCategory(category);
  if (!key) notFound();

  const meta = TOOL_CATEGORY_META[key];
  const intent = toolCategoryToIntent(key);

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: '十维度', compact: true }}>
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page={`/tools/category/${key}`}
        meta={{ surfaceKey: 'tools', category: key }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="工具分类"
          title={meta.title}
          description={meta.description}
          actions={
            <>
              <Link
                href={`/dimensions?source=tool_category_${key}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                相关十维度
              </Link>
              <Link
                href={`/analyze?intent=${intent}&source=tool_category_${key}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                完整报告
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                全部工具
              </Link>
            </>
          }
        />

        <PageIllustrationStrip
          surface={`tools/category/${key}`}
          title="本类图解"
          compact
          limit={1}
        />

        <DimensionsShowcase
          title="同类场景"
          description="工具适合快测；场景研判带结构判断。"
          limit={3}
          source={`tool_category_${key}`}
          compact
        />

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">本类工具</h2>
          <EntryLinkGrid items={getToolsForCategory(key)} />
        </section>

        <ToolRecommendations category={key} />
      </div>
    </AppPage>
  );
}
