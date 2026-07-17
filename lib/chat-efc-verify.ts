/**
 * Post-answer EFC integrity check for chat.
 * Detects when LLM invents/rewrites day master or yong/ji shen vs locked report facts.
 */

export type ChatEfcTruth = {
  dayMaster?: string | null;
  yongShen?: string[] | null;
  jiShen?: string[] | null;
  currentDaYun?: string | null;
};

export type ChatEfcVerifyResult = {
  ok: boolean;
  issues: string[];
  /** Soft notice appended to user-facing answer when not ok */
  notice: string;
};

const WUXING = ['木', '火', '土', '金', '水'] as const;
const TIAN_GAN = '甲乙丙丁戊己庚辛壬癸';

function uniq(list: string[]): string[] {
  return [...new Set(list.map((x) => `${x || ''}`.trim()).filter(Boolean))];
}

function extractClaimedDayMasters(text: string): string[] {
  const hits: string[] = [];
  const re = /日主\s*[「『]?([甲乙丙丁戊己庚辛壬癸])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    hits.push(m[1]);
  }
  // "你是甲木日主" style
  const re2 = /([甲乙丙丁戊己庚辛壬癸])\s*日主/g;
  while ((m = re2.exec(text))) {
    hits.push(m[1]);
  }
  return uniq(hits);
}

function extractClaimedElements(text: string, label: '用神' | '忌神'): string[] {
  const hits: string[] = [];
  const re = new RegExp(`${label}\\s*[「『:：偏为是是]*\\s*([木火土金水、，,\\s]+)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const chunk = m[1] || '';
    for (const el of WUXING) {
      if (chunk.includes(el)) hits.push(el);
    }
  }
  return uniq(hits);
}

/**
 * Soft verify: only flag clear contradictions with known truth, not mere omissions.
 */
export function verifyChatAnswerAgainstEfc(
  answer: string,
  truth: ChatEfcTruth | null | undefined,
): ChatEfcVerifyResult {
  const issues: string[] = [];
  const text = `${answer || ''}`;
  if (!truth || !text.trim()) {
    return { ok: true, issues: [], notice: '' };
  }

  const day = `${truth.dayMaster || ''}`.trim().charAt(0);
  if (day && TIAN_GAN.includes(day)) {
    const claimed = extractClaimedDayMasters(text);
    const wrong = claimed.filter((c) => c !== day);
    if (wrong.length > 0) {
      issues.push(`日主表述与真值不符（真值 ${day}，文中出现 ${wrong.join('、')}）`);
    }
  }

  const yong = uniq(truth.yongShen || []).filter((e) => (WUXING as readonly string[]).includes(e));
  const ji = uniq(truth.jiShen || []).filter((e) => (WUXING as readonly string[]).includes(e));

  if (yong.length > 0) {
    const claimedYong = extractClaimedElements(text, '用神');
    // Flag if answer claims yong shen elements that are entirely outside truth set
    // and also claims something as 用神 that is in ji set
    const invented = claimedYong.filter((e) => !yong.includes(e));
    const flipped = claimedYong.filter((e) => ji.includes(e));
    if (flipped.length > 0) {
      issues.push(`把忌神当作用神表述（${flipped.join('、')}）`);
    } else if (invented.length > 0 && claimedYong.length > 0) {
      // Only if strongly asserted and no intersection
      const overlap = claimedYong.filter((e) => yong.includes(e));
      if (overlap.length === 0) {
        issues.push(`用神表述与真值不一致（真值 ${yong.join('、')}，文中 ${claimedYong.join('、')}）`);
      }
    }
  }

  if (issues.length === 0) {
    return { ok: true, issues: [], notice: '' };
  }

  const notice = [
    '',
    '---',
    '**结构校验提示**（系统自动）',
    `本回答部分字段可能与报告真值不完全一致：${issues.join('；')}。`,
    '请以报告锁定的日主 / 用忌 / 大运为准；需要时请点「重生成」或回到报告页继续追问。',
  ].join('\n');

  return { ok: false, issues, notice };
}

export function applyEfcVerifyToAnswer(
  answer: string,
  truth: ChatEfcTruth | null | undefined,
): { answer: string; efcOk: boolean; efcIssues: string[] } {
  const result = verifyChatAnswerAgainstEfc(answer, truth);
  if (result.ok) {
    return { answer, efcOk: true, efcIssues: [] };
  }
  // Avoid double-append
  if (answer.includes('**结构校验提示**')) {
    return { answer, efcOk: false, efcIssues: result.issues };
  }
  return {
    answer: `${answer.trim()}${result.notice}`,
    efcOk: false,
    efcIssues: result.issues,
  };
}
