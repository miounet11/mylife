'use client';

import Link from 'next/link';
import {
  buildTeacherChatHref,
  listReportTeachers,
  listTeachers,
  type TeacherDefinition,
} from '@/lib/teachers';
import { trackProductEvent } from '@/lib/product-analytics';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  isEnglishUiLocale,
  resolveTeacherPresentation,
} from '@/lib/i18n/teacher-copy';

type Variant = 'report' | 'gallery' | 'compact';

/** 老师选择：纯文字链接列表，无彩色图标 */
export default function TeacherPicker({
  reportId,
  city,
  variant = 'report',
  source,
  title,
  subtitle,
  locale: localeProp,
}: {
  reportId?: string;
  city?: string;
  variant?: Variant;
  source?: string;
  title?: string;
  subtitle?: string;
  /** UI locale — EN default titles + TEACHER_COPY_EN names when en */
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const effectiveLocale = localeProp ?? ctxLocale;
  const en = isEnglishUiLocale(effectiveLocale);

  const teachers: TeacherDefinition[] =
    variant === 'gallery' ? listTeachers({ galleryOnly: true }) : listReportTeachers();

  const heading =
    title ||
    (variant === 'gallery'
      ? en
        ? 'Consultants'
        : '请老师'
      : en
        ? 'Ask a consultant'
        : '问老师');
  const allLabel = en ? 'All' : '全部';

  return (
    <section
      id="pro-teachers"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">{heading}</h2>
          {subtitle ? (
            <p className="mt-0.5 max-w-xl text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{subtitle}</p>
          ) : null}
        </div>
        {variant !== 'gallery' ? (
          <Link
            href="/teachers"
            className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            {allLabel}
          </Link>
        ) : null}
      </div>

      <ul
        className={
          variant === 'compact'
            ? 'mt-3 flex flex-wrap gap-x-3 gap-y-2'
            : 'mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]'
        }
      >
        {teachers.map((t) => {
          const presentation = resolveTeacherPresentation(t, effectiveLocale);
          const href = buildTeacherChatHref({
            teacherId: t.id,
            reportId,
            city,
            // Opening mode: teacher first_mes + starters (no auto prefill)
            source: source || (reportId ? `report:${reportId}:teacher_picker` : 'teacher_picker'),
          });
          if (variant === 'compact') {
            return (
              <li key={t.id}>
                <Link
                  href={href}
                  onClick={() =>
                    trackProductEvent('mass_teacher_open', {
                      teacherId: t.id,
                      reportId: reportId || '',
                      surface: variant,
                    })
                  }
                  className="text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
                >
                  {presentation.name}
                </Link>
              </li>
            );
          }
          return (
            <li key={t.id}>
              <Link
                href={href}
                onClick={() =>
                  trackProductEvent('mass_teacher_open', {
                    teacherId: t.id,
                    reportId: reportId || '',
                    surface: variant,
                  })
                }
                className="group flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
              >
                <span className="text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                  {presentation.name}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-[12px] text-[color:var(--ink-5)]">
                  {presentation.tagline}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
