import Link from 'next/link';
import { CONTENT_ARTICLES } from '@/lib/content-seeds';

export default function RelatedContent({
  slug,
  trackKey,
  type,
}: {
  slug: string;
  trackKey: string;
  type: 'knowledge' | 'case' | 'insight';
}) {
  const related = CONTENT_ARTICLES.filter(
    (item) => item.slug !== slug && item.trackKey === trackKey && item.type === type,
  ).slice(0, 3);

  if (!related.length) return null;

  const hrefFor = (item: (typeof related)[number]) => {
    if (item.type === 'case') return `/cases/${item.slug}`;
    if (item.type === 'insight' && item.insightType) return `/insights/${item.insightType}/${item.slug}`;
    return `/knowledge/${item.slug}`;
  };

  return (
    <section className="mt-8">
      <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">同主题继续阅读</h2>
      <ul className="mt-1 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {related.map((item) => (
          <li key={item.slug}>
            <Link
              href={hrefFor(item)}
              className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
            >
              <span className="text-[13px] text-[color:var(--ink-1)] hover:underline">{item.title}</span>
              {item.readMinutes ? (
                <span className="shrink-0 text-[11px] text-[color:var(--ink-5)]">约 {item.readMinutes} 分</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
