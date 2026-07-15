'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ExpertClientPack } from '@/lib/report-expert-client-pack';
import type { ExpertPrintSheet } from '@/lib/expert-print-sheet';
import { getExpertCrmForReport } from '@/lib/expert-crm';
import { buildExpertHandoffPack } from '@/lib/expert-handoff';
import { trackProductEvent } from '@/lib/product-analytics';

/** 面谈结束：一键复制完整交付包 */
export default function ExpertHandoffBar({
  clientPack,
  printSheet,
  reportId,
}: {
  clientPack: ExpertClientPack;
  printSheet: ExpertPrintSheet;
  reportId?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyHandoff() {
    const crm = reportId ? getExpertCrmForReport(reportId) : null;
    const text = buildExpertHandoffPack({
      clientPack,
      printSheet,
      crmNote: crm,
      reportId,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackProductEvent('expert_handoff_copied', {
        reportId: reportId || '',
        hasCrm: Boolean(crm),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <section id="ex-handoff" className="scroll-mt-header no-print border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">面谈结束 · 交付</div>
          <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
            合并：排盘纸摘要 + 案主白话 + 30 天行动
            {reportId ? ' + 本机 CRM 承诺' : ''}
            。可粘贴微信/邮件/笔记。
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <button
            type="button"
            onClick={() => void copyHandoff()}
            className="text-[color:var(--ink-1)] underline-offset-2 hover:underline"
          >
            {copied ? '已复制交付包' : '复制完整交付包'}
          </button>
          <a href="#ex-print-sheet" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            排盘纸
          </a>
          <Link href="/expert-crm" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            CRM 台
          </Link>
        </div>
      </div>
    </section>
  );
}
