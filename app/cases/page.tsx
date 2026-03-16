import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';

export const metadata = {
  title: '公开案例库 | 人生K线',
  description: '通过升学、事业、婚恋等真实场景案例，解释命理产品到底解决什么问题。',
};

export const dynamic = 'force-dynamic';

export default function CasesPage() {
  const localeGroups = new Map<ContentLocaleGroupKey, {
    groupLabel: string;
    groupDescription: string;
    sortOrder: number;
    entries: ReturnType<typeof listPublishedManagedContentEntriesByType>;
  }>();
  const caseEntries = listPublishedManagedContentEntriesByType('case');
  caseEntries.forEach((entry) => {
    const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
    const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';
    const presentation = getContentLocalePresentation(locale, market);
    const group = localeGroups.get(presentation.groupKey);
    if (group) {
      group.entries.push(entry);
      return;
    }

    localeGroups.set(presentation.groupKey, {
      groupLabel: presentation.groupLabel,
      groupDescription: presentation.groupDescription,
      sortOrder: presentation.sortOrder,
      entries: [entry],
    });
  });
  const groupedCaseEntries = [...localeGroups.entries()]
    .sort((left, right) => left[1].sortOrder - right[1].sortOrder)
    .map(([groupKey, group]) => ({
      groupKey,
      ...group,
    }));

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="cases_page_viewed" page="/cases" meta={{ surfaceKey: 'cases_page', contentType: 'case' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              场景化案例
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              用户不是来学术语，
              <span className="font-serif text-[color:var(--accent-strong)]">而是来解决具体问题。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              案例页把产品价值翻译成真实情境，既适合新用户理解，也适合持续扩展成高质量的内容资产。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['升学与焦虑判断', '职业换岗与时机窗口', '关系推进与风险节奏'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-5">
          <div className="flex flex-wrap gap-3">
            {groupedCaseEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                {group.groupLabel}
                <span className="text-xs text-[color:var(--muted)]">{group.entries.length} 篇</span>
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {groupedCaseEntries.map((group) => (
              <section key={group.groupKey} id={getLocaleAnchorId(group.groupKey)} className="space-y-4 scroll-mt-24">
                <div className="space-y-2">
                  <div className="section-label">{group.groupLabel}</div>
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{group.groupDescription}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.entries.map((item) => {
                    const locale = typeof item.meta?.locale === 'string' ? item.meta.locale : '';
                    const market = typeof item.meta?.market === 'string' ? item.meta.market : '';

                    return (
                      <ContentCardLink
                        key={item.slug}
                        href={`/cases/${item.slug}`}
                        page="/cases"
                        meta={{
                          surfaceKey: `cases_page:${group.groupKey}`,
                          contentType: 'case',
                          slug: item.slug,
                          title: item.title,
                          category: item.category,
                          tags: item.tags,
                          locale,
                          market,
                        }}
                        className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                          <span>{item.category}</span>
                          <ContentLocaleBadge locale={locale} market={market} compact />
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.excerpt}</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                          查看案例
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </ContentCardLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="案例页转化"
            sourceKey="cases_page"
            contentMeta={{ contentType: 'case', surfaceKey: 'cases_page' }}
            title="案例看完，马上测自己的命盘和阶段"
            description="案例负责证明产品能解决真实问题，真正的用户转化不该再绕回首页。这里就可以直接带着生日进入分析。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
