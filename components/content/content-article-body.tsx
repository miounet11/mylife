import type { NormalizedSection } from '@/lib/content-article-view';
import {
  groupFiguresBySection,
  resolveContentIllustrations,
  type ContentIllustrationSignal,
} from '@/lib/content-illustrations';
import { ContentFigureBlock } from '@/components/content/content-figure';

type ContentArticleBodyProps = {
  sections: NormalizedSection[];
  entry: ContentIllustrationSignal;
  /** When false, skip illustration injection (rare). Default true. */
  enableIllustrations?: boolean;
};

export function ContentArticleBody({
  sections,
  entry,
  enableIllustrations = true,
}: ContentArticleBodyProps) {
  const figures = enableIllustrations
    ? resolveContentIllustrations(
      {
        ...entry,
        sectionCount: sections.length,
      },
      { min: 3, target: 4 },
    )
    : [];
  const { hero, afterSection, trailing } = groupFiguresBySection(figures, sections.length);
  let figureIndex = 0;

  return (
    <div className="space-y-5">
      {hero.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-1">
          {hero.map((figure) => {
            const index = figureIndex;
            figureIndex += 1;
            return <ContentFigureBlock key={`${figure.id}-hero`} figure={figure} index={index} />;
          })}
        </div>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <div key={`${section.heading}-${sectionIndex}`} className="space-y-4">
          <section>
            <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.65] text-[color:var(--ink-3)]">
              {section.body}
            </p>
          </section>
          {(afterSection[sectionIndex] || []).map((figure) => {
            const index = figureIndex;
            figureIndex += 1;
            return (
              <ContentFigureBlock
                key={`${figure.id}-s${sectionIndex}`}
                figure={figure}
                index={index}
              />
            );
          })}
        </div>
      ))}

      {trailing.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {trailing.map((figure) => {
            const index = figureIndex;
            figureIndex += 1;
            return (
              <ContentFigureBlock
                key={`${figure.id}-trail`}
                figure={figure}
                index={index}
                compact
              />
            );
          })}
        </div>
      ) : null}

      {figures.length > 0 ? (
        <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">
          本文含 {figures.length} 张图解（封面/结构/时位/行动或风险）。图解用于建立判断框架，不构成宿命结论；
          个人决策请结合测算报告与工具验证。
        </p>
      ) : null}
    </div>
  );
}
