/**
 * 专业一键交付包：话术 + 排盘纸摘要 + CRM 承诺
 * 从业者结束面谈时复制/存档即可。
 */

import type { ExpertClientPack } from '@/lib/report-expert-client-pack';
import type { ExpertPrintSheet } from '@/lib/expert-print-sheet';
import type { ExpertCrmNote } from '@/lib/expert-crm';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';

export function buildExpertHandoffPack(params: {
  clientPack: ExpertClientPack;
  printSheet: ExpertPrintSheet;
  crmNote?: ExpertCrmNote | null;
  reportId?: string;
  reportUrl?: string;
}): string {
  const { clientPack, printSheet, crmNote, reportId } = params;
  const reportUrl =
    params.reportUrl ||
    (reportId ? `https://www.life-kline.com/result/${reportId}?view=expert` : '');

  const pillarsLine = printSheet.pillars.map((p) => `${p.label}${p.ganZhi}`).join(' ');

  const lines = [
    `【人生K线 · 对客交付包 · ${KNOWLEDGE_BASE.shortLabel}】`,
    printSheet.title,
    printSheet.subtitle,
    reportUrl ? `报告：${reportUrl}` : '',
    '',
    '—— 排盘纸摘要 ——',
    `四柱：${pillarsLine}`,
    `用 ${printSheet.yongJi.yong} / 喜 ${printSheet.yongJi.xi} / 忌 ${printSheet.yongJi.ji}`,
    printSheet.dayunLine,
    printSheet.suiyunLine,
    `对客一句：${printSheet.clientOneLiner}`,
    '',
    '—— 案主白话 ——',
    clientPack.clientPlain,
    '',
    '—— 30 天行动 ——',
    ...clientPack.closingActions.map((a, i) => `${i + 1}. ${a}`),
    '',
  ];

  if (crmNote) {
    lines.push(
      '—— 客户脚本（本机）——',
      `客户：${crmNote.clientName} · ${crmNote.status}`,
      crmNote.nextFollowUp ? `回访日：${crmNote.nextFollowUp}` : '',
      crmNote.commitments ? `承诺：${crmNote.commitments}` : '',
      crmNote.sessionNotes ? `面谈：${crmNote.sessionNotes}` : '',
      ''
    );
  }

  lines.push(
    '—— 边界 ——',
    clientPack.disclaimer,
    KNOWLEDGE_BASE.publicClaim || '',
    `生成时间：${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
  );

  return lines.filter((x) => x !== undefined).join('\n').trim() + '\n';
}
