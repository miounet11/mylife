import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AnalyticsPageView from '@/components/analytics-page-view';
import DimensionsShowcase from '@/components/dimensions/dimensions-showcase';
import { CapabilityIllustrationPanel } from '@/components/content/capability-illustration-panel';
import { AppPage } from '@/components/layout/app-page';
import { EntryLinkGrid } from '@/components/layout/entry-link-grid';
import { FocusHero } from '@/components/layout/focus-hero';
import ToolRecommendations from '@/components/tool-recommendations';
import { toolCategoryToIntent } from '@/lib/content-crosslinks';
import {
  presentToolEntries,
  toolCategoryMetaCopy,
  toolCategoryPageCopy,
} from '@/lib/i18n/tools-catalog-copy';
import { getRequestLocale } from '@/lib/i18n/server-locale';
import { toolCategoryCapabilitySurface } from '@/lib/page-illustrations/capability-map';
import {
  getToolCategory,
  getToolsForCategory,
} from '@/lib/portal-tools';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const chrome = toolCategoryPageCopy(locale);
  const key = getToolCategory(category);
  if (!key) return { title: chrome.metaFallback };
  const meta = toolCategoryMetaCopy(locale, key);
  return { title: `${meta.title}｜${chrome.metaSuffix}` };
}

export default async function ToolCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const sp = searchParams ? await searchParams : {};
  const locale = await getRequestLocale(sp.lang);
  const key = getToolCategory(category);
  if (!key) notFound();

  const meta = toolCategoryMetaCopy(locale, key);
  const chrome = toolCategoryPageCopy(locale);
  const intent = toolCategoryToIntent(key);
  const tools = presentToolEntries(getToolsForCategory(key), locale);

  return (
    <AppPage header={{ ctaHref: '/dimensions', ctaLabel: chrome.ctaDimensions, compact: true }}>
      <AnalyticsPageView
        eventName="tools_page_viewed"
        page={`/tools/category/${key}`}
        meta={{ surfaceKey: 'tools', category: key }}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow={chrome.eyebrow}
          title={meta.title}
          description={meta.description}
          actions={
            <>
              <Link
                href={`/dimensions?source=tool_category_${key}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {chrome.relatedDimensions}
              </Link>
              <Link
                href={`/analyze?intent=${intent}&source=tool_category_${key}`}
                className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {chrome.fullReport}
              </Link>
              <Link href="/tools" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
                {chrome.allTools}
              </Link>
            </>
          }
        />

        <CapabilityIllustrationPanel
          surface={toolCategoryCapabilitySurface(key)}
          title={chrome.capabilityTitle(meta.title)}
          compact
          priority
          showCopy={false}
        />

        <DimensionsShowcase
          title={chrome.similarScenes}
          description={chrome.similarScenesDesc}
          limit={3}
          source={`tool_category_${key}`}
          compact
        />

        <section>
          <h2 className="mb-1 text-[12px] font-medium text-[color:var(--ink-5)]">{chrome.toolsInCategory}</h2>
          <EntryLinkGrid items={tools} />
        </section>

        <ToolRecommendations category={key} />
      </div>
    </AppPage>
  );
}
