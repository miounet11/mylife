import Link from 'next/link';
import ContentCardLink from '@/components/content-card-link';
import { ArrowRight, Globe2 } from 'lucide-react';

type KnowledgeItem = {
  entry: { slug: string; title: string; category: string | null; tags?: string[] | null };
  topicName?: string | null;
  synthesisType?: string | null;
  editorialTier?: string | null;
};

type CaseItem = {
  slug: string;
  title: string;
  scenario: string;
  tags?: string[] | null;
};

// v5-D60 FB 风右栏：trending sidebar 风
// 桌面 xl+ 显示 sticky；移动端外层让其出现在中流下方（流式布局）。
export default function HomeRightRail({
  featuredArticles,
  featuredCases,
}: {
  featuredArticles: KnowledgeItem[];
  featuredCases: CaseItem[];
}) {
  return (
    <aside className="w-full lg:w-[300px] lg:shrink-0">
      <div className="flex flex-col gap-2 xl:sticky-top-header">
        {/* Trending in 易学 */}
        <section className="fb-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">Trending in 易学</div>
            <Link
              href="/knowledge"
              className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
            >
              更多
            </Link>
          </div>
          <ul className="flex flex-col">
            {featuredArticles.map((item, idx) => (
              <li
                key={item.entry.slug}
                className={idx > 0 ? 'border-t border-[color:var(--fb-border)]' : ''}
              >
                <ContentCardLink
                  href={`/knowledge/${item.entry.slug}`}
                  page="/"
                  meta={{
                    surfaceKey: 'home_right_rail_knowledge',
                    contentType: 'knowledge',
                    slug: item.entry.slug,
                    title: item.entry.title,
                    category: item.entry.category,
                    tags: item.entry.tags,
                    topicName: item.topicName,
                    synthesisType: item.synthesisType,
                    editorialTier: item.editorialTier,
                  }}
                  className="block px-3 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                >
                  <div className="text-xs font-semibold text-[color:var(--fb-ink-3)]">
                    #{item.topicName || item.entry.category}
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                    {item.entry.title}
                  </div>
                </ContentCardLink>
              </li>
            ))}
          </ul>
        </section>

        {/* 案例 trending */}
        <section className="fb-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">真实案例</div>
            <Link
              href="/cases"
              className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
            >
              更多
            </Link>
          </div>
          <ul className="flex flex-col">
            {featuredCases.map((item, idx) => (
              <li
                key={item.slug}
                className={idx > 0 ? 'border-t border-[color:var(--fb-border)]' : ''}
              >
                <ContentCardLink
                  href={`/cases/${item.slug}`}
                  page="/"
                  meta={{
                    surfaceKey: 'home_right_rail_case',
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    category: item.scenario,
                    tags: item.tags,
                  }}
                  className="block px-3 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                >
                  <div className="text-xs font-semibold text-[color:var(--fb-ink-3)]">
                    #{item.scenario}
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              </li>
            ))}
          </ul>
        </section>

        {/* 世界易学说入口 */}
        <section className="fb-card overflow-hidden">
          <div className="border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">门户系统</div>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] bg-[color:var(--fb-blue)] text-white">
                <Globe2 className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[color:var(--fb-ink-1)]">
                  世界易学说
                </div>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--fb-ink-3)]">
                  把判断、阶段、行动组织成现代框架，连通八字 / 紫微 / 六爻 / 奇门 / 择日。
                </p>
              </div>
            </div>
            <Link
              href="/world-yi"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
            >
              进入世界易
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="border-t border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
            <Link
              href="/insights"
              className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
            >
              查看系统洞察
            </Link>
          </div>
        </section>

        {/* 全球资料 trending */}
        <section className="fb-card overflow-hidden">
          <div className="border-b border-[color:var(--fb-border)] px-3 py-2">
            <div className="fb-section-title">全球易学资料</div>
          </div>
          <ul className="flex flex-col">
            <li>
              <Link
                href="/knowledge/topics"
                className="block px-3 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
              >
                <div className="text-[13px] font-semibold text-[color:var(--fb-blue-link)]">
                  按主题浏览
                </div>
                <div className="mt-0.5 text-xs text-[color:var(--fb-ink-3)]">
                  八字 · 紫微 · 六爻 · 奇门 · 择日
                </div>
              </Link>
            </li>
            <li className="border-t border-[color:var(--fb-border)]">
              <Link
                href="/updates"
                className="block px-3 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
              >
                <div className="text-[13px] font-semibold text-[color:var(--fb-blue-link)]">
                  系统更新
                </div>
                <div className="mt-0.5 text-xs text-[color:var(--fb-ink-3)]">
                  方法论与算法迭代记录
                </div>
              </Link>
            </li>
            <li className="border-t border-[color:var(--fb-border)]">
              <Link
                href="/questions"
                className="block px-3 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
              >
                <div className="text-[13px] font-semibold text-[color:var(--fb-blue-link)]">
                  公开追问
                </div>
                <div className="mt-0.5 text-xs text-[color:var(--fb-ink-3)]">
                  看别人怎么把命盘问透
                </div>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  );
}
