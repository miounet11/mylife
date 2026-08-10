/**
 * Direct-answer lead for article/detail pages (people-facing copy only).
 * Internal SEO/GEO labels must never appear in the UI.
 */
export default function ArticleGeoLead({
  answerSummary,
  searchIntents = [],
  entityKeywords = [],
  title = '这篇在回答什么',
}: {
  answerSummary?: string | null;
  searchIntents?: string[] | null;
  entityKeywords?: string[] | null;
  title?: string;
}) {
  const summary = `${answerSummary || ''}`.trim();
  if (summary.length < 24) return null;
  const intents = (searchIntents || []).filter(Boolean).slice(0, 6);
  const entities = (entityKeywords || []).filter(Boolean).slice(0, 10);

  return (
    <aside
      className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      data-article-answer-lead="1"
      aria-label="直接回答"
    >
      <p className="text-[11px] font-bold tracking-[0.08em] text-[color:var(--brand-strong)]">
        直接回答
      </p>
      <h2 className="mt-1 text-[16px] font-bold tracking-tight text-[color:var(--ink-1)]">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)] md:text-[14px]">{summary}</p>
      {intents.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {intents.map((intent) => (
            <li
              key={intent}
              className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-4)]"
            >
              {intent}
            </li>
          ))}
        </ul>
      ) : null}
      {entities.length > 0 ? (
        <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--ink-5)]">
          相关概念：{entities.join(' · ')}
        </p>
      ) : null}
    </aside>
  );
}
