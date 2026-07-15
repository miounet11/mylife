import type { ProReportView } from '@/lib/report-pro-view';
import { READING_PATH_HINT } from '@/lib/content-voice';
import ProScoreBar from '@/components/report-pro/pro-score-bar';

export default function ProOverviewCard({
  overview,
}: {
  overview: ProReportView['overview'];
}) {
  const sections = overview.sections?.length
    ? overview.sections
    : overview.body
      ? [{ key: 'body', title: '总评', body: overview.body }]
      : [];

  return (
    <section id="pro-overview" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">命理总评</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            结构 · 用忌 · 岁运 · 行动
          </p>
        </div>
        <ProScoreBar score10={overview.score10} />
      </div>

      <p className="mt-2 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{READING_PATH_HINT}</p>

      {overview.oneLiner ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">一句话结论</div>
          <p className="mt-1 text-[14px] font-medium leading-[1.65] text-[color:var(--ink-1)]">
            {overview.oneLiner}
          </p>
        </div>
      ) : null}

      {overview.tags.length > 0 ? (
        <div className="mt-2 text-[12px] text-[color:var(--ink-5)]">{overview.tags.join(' · ')}</div>
      ) : null}

      {sections.length > 1 ? (
        <nav className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]" aria-label="总评分章导航">
          {sections.map((section, idx) => (
            <a
              key={section.key}
              href={`#overview-${section.key}`}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              {idx + 1}. {section.title.replace(/^[①-⑨\d.、\s]+/, '').slice(0, 10)}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <article
            key={section.key}
            id={`overview-${section.key}`}
            className="scroll-mt-header border-t border-[color:var(--hairline)] pt-3"
          >
            <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">{section.title}</h3>
            {section.readingHint ? (
              <p className="mt-1 text-[11px] leading-[1.5] text-[color:var(--ink-5)]">{section.readingHint}</p>
            ) : null}
            {section.bullets && section.bullets.length > 0 ? (
              <div className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
                {section.bullets.join(' · ')}
              </div>
            ) : null}
            <div className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.75] text-[color:var(--ink-2)]">
              {section.body}
            </div>
            {section.faq && section.faq.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-dashed border-[color:var(--hairline)] pt-3">
                {section.faq.map((item) => (
                  <li key={item.q} className="text-[12px] leading-[1.55]">
                    <div className="font-medium text-[color:var(--ink-1)]">Q：{item.q}</div>
                    <div className="mt-0.5 text-[color:var(--ink-5)]">A：{item.a}</div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      {!sections.length && overview.body ? (
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-[1.75] text-[color:var(--ink-2)]">
          {overview.body}
        </p>
      ) : null}
    </section>
  );
}
