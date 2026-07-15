import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Linear-style text list for hub entries (no card chrome / icon spam). */
export function EntryLinkGrid({
  items,
  className,
}: {
  items: Array<{ href: string; title: string; description: string }>;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex flex-col gap-0.5 py-3 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <span className="text-[14px] font-medium text-[color:var(--ink-1)] group-hover:underline">
              {item.title}
            </span>
            <span className="min-w-0 text-[12px] leading-[1.45] text-[color:var(--ink-5)] sm:max-w-[58%] sm:truncate sm:text-right">
              {item.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
