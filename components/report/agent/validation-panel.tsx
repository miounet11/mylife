'use client';

import type { VerifyResult } from '@/lib/agentic-report/types';
import { useLocale } from '@/components/i18n/locale-provider';
import {
  reportValidationCopy,
  resolveReportChromeLocale,
} from '@/lib/i18n/report-chrome-copy';

export default function ReportValidationPanel({
  verify,
  locale: localeProp,
}: {
  verify?: VerifyResult;
  locale?: string | null;
}) {
  const { locale: ctxLocale } = useLocale();
  const copy = reportValidationCopy(resolveReportChromeLocale(localeProp ?? ctxLocale));

  if (!verify) return null;

  return (
    <section id="validation" className="fb-card scroll-mt-header p-4 md:p-5">
      <div className="lk-section-eyebrow">{copy.agentEyebrow}</div>
      <h2 className="mt-1 text-base font-bold text-[color:var(--ink-1)]">{copy.agentTitle}</h2>
      <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">
        {copy.agentRulesSummary(verify.rulesPassed, verify.totalRules)}
        <span className="ml-1 font-semibold text-[color:var(--brand-strong)]">{verify.verdict}</span>
      </p>
      {verify.checks.length ? (
        <ul className="mt-3 space-y-1.5 text-[12px] text-[color:var(--ink-3)]">
          {verify.checks.slice(0, 5).map((check) => (
            <li
              key={check.rule}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2"
            >
              <span className={check.passed ? 'text-[color:var(--success)]' : 'text-[color:var(--alert)]'}>
                {check.passed ? '✓' : '✗'}
              </span>{' '}
              {check.rule}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
