import Link from 'next/link';

interface ContentBreadcrumbItem {
  label: string;
  href?: string;
}

export default function ContentBreadcrumbs({ items }: { items: ContentBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="font-semibold text-[color:var(--accent-strong)]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-[color:var(--ink)]' : ''}>{item.label}</span>
            )}
            {!isLast ? <span aria-hidden="true">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
