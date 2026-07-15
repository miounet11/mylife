import Link from 'next/link';
import { PRO_TERM_GLOSSARY } from '@/lib/report-pro-view';
import { termHref, termPlain } from '@/lib/knowledge-ladder';

/** 术语小白话：悬停可见，可点进知识库深读 */
export default function ProTermTip({
  term,
  children,
  learnHref,
}: {
  term: string;
  children?: React.ReactNode;
  /** 覆盖默认知识链接 */
  learnHref?: string;
}) {
  const tip = PRO_TERM_GLOSSARY[term] || termPlain(term) || '';
  const href = learnHref || termHref(term);

  if (!tip && !href) {
    return <span>{children || term}</span>;
  }

  if (href) {
    return (
      <Link
        href={href}
        title={tip || `了解：${term}`}
        className="cursor-help border-b border-dotted border-[color:var(--ink-4)] font-medium text-[color:var(--ink-1)] no-underline hover:border-solid"
      >
        {children || term}
      </Link>
    );
  }

  return (
    <abbr
      title={tip}
      className="cursor-help border-b border-dotted border-[color:var(--ink-4)] font-medium text-[color:var(--ink-1)] no-underline"
    >
      {children || term}
    </abbr>
  );
}
