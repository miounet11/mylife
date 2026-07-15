import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';

/** 双轨共用：知识库版本戳 — 淡化展示 */
export default function KnowledgeBaseStamp({
  variant = 'chip',
  className = '',
}: {
  variant?: 'chip' | 'banner' | 'footer';
  className?: string;
}) {
  if (variant === 'banner') {
    return (
      <div className={`border-y border-[color:var(--hairline)] py-2.5 text-[12px] leading-[1.55] ${className}`}>
        <div className="font-medium text-[color:var(--ink-2)]">{KNOWLEDGE_BASE.shortLabel}</div>
        <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{KNOWLEDGE_BASE.publicClaim}</p>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <p className={`text-[11px] text-[color:var(--ink-5)] ${className}`} title={KNOWLEDGE_BASE.publicClaim}>
        {KNOWLEDGE_BASE.footerLine}
      </p>
    );
  }

  return (
    <span
      className={`text-[11px] text-[color:var(--ink-5)] ${className}`}
      title={KNOWLEDGE_BASE.publicClaim}
    >
      {KNOWLEDGE_BASE.shortLabel}
    </span>
  );
}
