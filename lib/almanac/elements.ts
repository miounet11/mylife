/** Five-element helpers for personal day overlay (deterministic, no LLM). */

export type WuXing = '木' | '火' | '土' | '金' | '水';

const STEM_WX: Record<string, WuXing> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const BRANCH_WX: Record<string, WuXing> = {
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
  申: '金',
  酉: '金',
  亥: '水',
  子: '水',
};

/** 生: 木→火→土→金→水→木 */
const SHENG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/** 克: 木→土→水→火→金→木 */
const KE: Record<WuXing, WuXing> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

const BRANCH_CHONG: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
};

export function stemElement(stem: string): WuXing | null {
  return STEM_WX[stem?.[0] || ''] || STEM_WX[stem || ''] || null;
}

export function branchElement(branch: string): WuXing | null {
  const b = branch?.slice(-1) || branch;
  return BRANCH_WX[b] || null;
}

export function ganZhiParts(ganZhi: string): { stem: string; branch: string } {
  const s = `${ganZhi || ''}`.trim();
  return { stem: s[0] || '', branch: s[1] || '' };
}

export function relation(from: WuXing, to: WuXing): 'same' | 'generates' | 'generated_by' | 'controls' | 'controlled_by' | 'other' {
  if (from === to) return 'same';
  if (SHENG[from] === to) return 'generates';
  if (SHENG[to] === from) return 'generated_by';
  if (KE[from] === to) return 'controls';
  if (KE[to] === from) return 'controlled_by';
  return 'other';
}

export function isBranchClash(a: string, b: string): boolean {
  return BRANCH_CHONG[a] === b;
}

/** 黄道六神 */
export const HUANG_DAO_SHEN = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命'] as const;

export function isHuangDaoShen(tianShen: string): boolean {
  return HUANG_DAO_SHEN.some((x) => `${tianShen || ''}`.includes(x));
}
