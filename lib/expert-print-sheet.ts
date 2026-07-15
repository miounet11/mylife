/**
 * 专业排盘纸 · 一页摘要（打印 / 存 PDF）
 */

import type { ExpertDeskView } from '@/lib/report-expert-view';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';
import { presentReportText } from '@/lib/report-presentation';

export interface ExpertPrintSheet {
  brandLine: string;
  title: string;
  subtitle: string;
  metaRows: Array<{ label: string; value: string }>;
  pillars: Array<{ label: string; ganZhi: string; tenGod?: string; changSheng?: string }>;
  yongJi: { yong: string; xi: string; ji: string };
  dayunLine: string;
  suiyunLine: string;
  keyNotes: string[];
  clientOneLiner: string;
  footer: string;
  knowledgeStamp: string;
}

export function buildExpertPrintSheet(desk: ExpertDeskView): ExpertPrintSheet {
  const name = desk.input.name !== '—' ? desk.input.name : '案主';
  const pillars = desk.pillars.map((p) => ({
    label: p.label,
    ganZhi: p.ganZhi,
    tenGod: p.ganShiShen || undefined,
    changSheng: p.changSheng || undefined,
  }));

  const dayun = desk.dayun.current;
  const dayunLine = dayun
    ? `现行 ${dayun.ganZhi}（${dayun.startYear}–${dayun.endYear} · ${dayun.startAge}–${dayun.endAge}岁 · ${dayun.quality || '—'}）`
    : desk.suiyun.dayunGanZhi
      ? `大运 ${desk.suiyun.dayunGanZhi}`
      : '大运未落库';

  const suiyunLine = `岁运 ${desk.suiyun.dayunGanZhi || '—'} × ${desk.suiyun.liunianGanZhi || '—'} · ${presentReportText(desk.suiyun.summary, 80) || '见专业版'}`;

  const career = desk.domains.find((d) => d.key === 'career');
  const marriage = desk.domains.find((d) => d.key === 'marriage');

  const keyNotes = [
    `格局 ${desk.pattern.type || '—'} · 日主 ${desk.dayMaster}`,
    `空亡 ${desk.kongWang.join('') || '—'} · 神煞 ${desk.shenSha.slice(0, 4).join('、') || '—'}`,
    dayun?.description ? `大运：${presentReportText(dayun.description, 60)}` : '',
    career ? `事业：${presentReportText(career.general, 70)}` : '',
    marriage ? `关系：${presentReportText(marriage.general, 60)}` : '',
    desk.cosmos.temporal.solarTerm
      ? `节气 ${desk.cosmos.temporal.solarTerm} · ${desk.cosmos.economicCycle?.label || ''}`
      : '',
  ].filter(Boolean);

  const clientOneLiner =
    presentReportText(desk.suiyun.summary, 100) ||
    `宜顺 ${desk.yongJi.yongShen.join('、') || '用神'}，慎 ${desk.yongJi.jiShen.join('、') || '忌神'}。`;

  return {
    brandLine: `人生K线 · 专业排盘纸 · ${KNOWLEDGE_BASE.shortLabel}`,
    title: `${name} · 命盘摘要`,
    subtitle: `${desk.input.birthDate} ${desk.input.birthTime} · ${desk.input.gender || ''} · ${desk.input.birthPlace || ''}`.trim(),
    metaRows: [
      { label: '日主', value: desk.dayMaster || '—' },
      { label: '格局', value: desk.pattern.type || '—' },
      { label: '真太阳时', value: desk.solar.trueSolarText || desk.input.birthTime || '—' },
      { label: '时区', value: String(desk.input.timezone ?? '—') },
    ],
    pillars,
    yongJi: {
      yong: desk.yongJi.yongShen.join('、') || '—',
      xi: desk.yongJi.xiShen.join('、') || '—',
      ji: desk.yongJi.jiShen.join('、') || '—',
    },
    dayunLine,
    suiyunLine,
    keyNotes: keyNotes.slice(0, 6),
    clientOneLiner,
    footer: `仅供文化决策与自我管理参考 · 非医疗/法律/投资建议 · ${new Date().toISOString().slice(0, 10)}`,
    knowledgeStamp: KNOWLEDGE_BASE.shortLabel,
  };
}
