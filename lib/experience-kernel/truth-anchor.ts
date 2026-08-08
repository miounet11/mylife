import type { TruthAnchor } from '@/lib/experience-kernel/types';

type ReportLike = {
  id?: string;
  dayMaster?: string;
  yongShen?: string[] | null;
  currentDaYun?: string | null;
  pattern?: { type?: string } | null;
};

/**
 * Normalize report → truth anchor for chat / skill injection.
 * hasEngineLock is true only when day master is present (minimal EFC lock).
 */
export function buildTruthAnchor(report?: ReportLike | null, reportId?: string | null): TruthAnchor {
  const dayMaster = `${report?.dayMaster || ''}`.trim() || null;
  const yong = Array.isArray(report?.yongShen)
    ? report!.yongShen!.map((x) => `${x}`.trim()).filter(Boolean)
    : [];
  return {
    reportId: reportId || report?.id || null,
    dayMaster,
    yongShen: yong.length ? yong : null,
    currentDaYun: `${report?.currentDaYun || ''}`.trim() || null,
    patternType: `${report?.pattern?.type || ''}`.trim() || null,
    hasEngineLock: !!dayMaster,
  };
}

/** System-prompt fragment: force model to cite lock or admit unbound. */
export function formatTruthAnchorContract(anchor: TruthAnchor): string {
  if (!anchor.hasEngineLock) {
    return [
      '【会话真值】本会话未绑定可验证命盘报告。',
      '禁止编造日主、用神、大运、流年吉凶；五个结构标题仍须写满，用通用决策框架。',
    ].join('\n');
  }
  return [
    '【会话真值 · 锁定】',
    anchor.reportId ? `报告ID：${anchor.reportId}` : '',
    anchor.dayMaster ? `日主：${anchor.dayMaster}` : '',
    anchor.yongShen?.length ? `用神：${anchor.yongShen.join('、')}` : '',
    anchor.currentDaYun ? `当前大运：${anchor.currentDaYun}` : '',
    anchor.patternType ? `格局参考：${anchor.patternType}` : '',
    '判断依据中必须点名以上真值至少一项，禁止改写。',
  ]
    .filter(Boolean)
    .join('\n');
}
