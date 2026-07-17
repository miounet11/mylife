import Link from 'next/link';
import { buildTeacherChatHref, getTeacher, type TeacherId } from '@/lib/teachers';

const CONSULTANT_IDS: TeacherId[] = ['career', 'timing', 'wealth'];

/**
 * 报告首屏 P0 顾问卡：事业 / 时机 / 财务
 * 深链 mode=opening，时机卡可带 best/risk 窗口。
 * 不替代 TeacherPicker（全量老师列表）。
 */
export default function ReportConsultantCards({
  reportId,
  windows,
  source,
}: {
  reportId: string;
  windows?: { best?: string; risk?: string } | null;
  source?: string;
}) {
  const baseSource = source || `report:${reportId}:consultant_cards`;
  const best = `${windows?.best || ''}`.trim();
  const risk = `${windows?.risk || ''}`.trim();

  return (
    <section
      id="report-consultants"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5"
      aria-label="问顾问"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">先问一位顾问</h2>
          <p className="mt-0.5 max-w-xl text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
            事业 · 时机 · 财务 — 结合本盘开场，不预填长问
          </p>
        </div>
        <Link
          href="/teachers"
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          全部老师
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {CONSULTANT_IDS.map((teacherId) => {
          const teacher = getTeacher(teacherId);
          const windowHint =
            teacherId === 'timing'
              ? [best && `较有利：${best}`, risk && `需谨慎：${risk}`].filter(Boolean).join(' · ') ||
                best ||
                risk ||
                undefined
              : best || undefined;

          const href = buildTeacherChatHref({
            teacherId,
            reportId,
            window: windowHint || null,
            source: `${baseSource}:${teacherId}`,
          });

          const cta =
            teacherId === 'career'
              ? '问事业'
              : teacherId === 'timing'
                ? '问时机'
                : '问财务';

          return (
            <li key={teacherId}>
              <Link
                href={href}
                className="group flex items-baseline justify-between gap-3 py-2.5 no-underline hover:no-underline"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline">
                    {teacher.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-[1.45] text-[color:var(--ink-5)]">
                    {teacher.tagline}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-medium text-[color:var(--ink-2)] underline-offset-2 group-hover:underline">
                  {cta} →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
