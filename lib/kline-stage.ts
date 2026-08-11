/**
 * 人生 K 线 · 阶段人话结论
 * 把分数/极值翻译成「我现在在哪、接下来怎么走」——服务一眼可读，非占断。
 */

export type KlinePointLike = {
  year?: number;
  career?: number;
  wealth?: number;
  marriage?: number;
  health?: number;
  score?: number;
  evidence?: {
    ganZhi?: string;
    dayunGanZhi?: string | null;
    drivers?: string[];
    risks?: string[];
  };
};

export type KlineStageTone = 'rising' | 'steady' | 'pressure' | 'mixed';

export type KlineStageCalibrationHint = {
  year: number;
  kind: 'confirmed' | 'denied';
  title?: string;
};

export type KlineStageNarrative = {
  /** 一句主结论（结果页最大字） */
  headline: string;
  /** 一句支撑 */
  support: string;
  /** 阶段语气 */
  tone: KlineStageTone;
  /** 当前年龄（若有出生年） */
  age: number | null;
  currentYear: number;
  currentScore: number | null;
  /** 相对人生中位 */
  vsMedian: 'above' | 'near' | 'below' | null;
  /** 相对去年 */
  vsLastYear: number | null;
  /** 未来 3 年均值相对当前 */
  next3Trend: 'up' | 'flat' | 'down' | null;
  strongestDim: { key: string; label: string; score: number } | null;
  weakestDim: { key: string; label: string; score: number } | null;
  peak: { year: number; score: number; age: number | null; reason: string | null } | null;
  trough: { year: number; score: number; age: number | null; reason: string | null } | null;
  nextInflection: { year: number; kind: 'peak' | 'trough' | 'turn'; score: number } | null;
  actionHint: string;
  /** 校准软影响文案（不改分数） */
  calibrationNote: string | null;
};

function overallOf(p: KlinePointLike): number {
  if (typeof p.score === 'number' && p.score > 0) return p.score;
  const dims = [p.career, p.wealth, p.marriage, p.health]
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (!dims.length) return 0;
  return dims.reduce((a, b) => a + b, 0) / dims.length;
}

function median(nums: number[]): number {
  if (!nums.length) return 60;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function dimScores(p: KlinePointLike) {
  return [
    { key: 'career', label: '事业', score: Number(p.career) || 0 },
    { key: 'wealth', label: '财富', score: Number(p.wealth) || 0 },
    { key: 'marriage', label: '关系', score: Number(p.marriage) || 0 },
    { key: 'health', label: '健康', score: Number(p.health) || 0 },
  ];
}

function toneFromScores(current: number, next3: number | null, med: number): KlineStageTone {
  const forward = next3 == null ? 0 : next3 - current;
  if (current >= med + 6 && forward >= -1) return 'rising';
  if (current <= med - 6 || forward <= -4) return 'pressure';
  if (Math.abs(forward) <= 2 && Math.abs(current - med) <= 5) return 'steady';
  return 'mixed';
}

function headlineFor(params: {
  age: number | null;
  tone: KlineStageTone;
  strongest: string | null;
  weakest: string | null;
  next3Trend: 'up' | 'flat' | 'down' | null;
}): string {
  const ageBit = params.age != null ? `${params.age} 岁，` : '';
  const pair =
    params.strongest && params.weakest && params.strongest !== params.weakest
      ? `${params.strongest}强于${params.weakest}`
      : params.strongest
        ? `${params.strongest}相对占优`
        : '四维较均衡';

  if (params.tone === 'rising') {
    return `${ageBit}处在偏顺的阶段中段；${pair}，近两年宜主线加码、少开旁支。`;
  }
  if (params.tone === 'pressure') {
    return `${ageBit}阶段承压偏多；${pair}，近两年宜守结构、减并行、做减法。`;
  }
  if (params.tone === 'steady') {
    return `${ageBit}节奏偏稳；${pair}，适合巩固优势、小步验证再放大。`;
  }
  const fwd =
    params.next3Trend === 'up'
      ? '未来两年略抬升'
      : params.next3Trend === 'down'
        ? '未来两年略回落'
        : '未来两年波段并存';
  return `${ageBit}结构冷热不均；${pair}，${fwd}——先保强线、缓弱线。`;
}

function actionFor(tone: KlineStageTone, strongest: string | null, weakest: string | null): string {
  if (tone === 'rising') {
    return strongest
      ? `优先把资源集中在「${strongest}」相关事项；高峰窗口避免分心开太多线。`
      : '主线清晰时再加码；高峰期最怕并行过多。';
  }
  if (tone === 'pressure') {
    return weakest
      ? `先稳住「${weakest}」相关边界（合同、健康、关系），大事宜拆步、留缓冲。`
      : '大事拆步、留现金与关系缓冲，待曲线回升再扩。';
  }
  if (tone === 'steady') {
    return '适合复盘与补基础能力；用小实验验证方向，再决定是否加码。';
  }
  return strongest && weakest
    ? `保「${strongest}」、缓「${weakest}」；同一年不要四线同时开满。`
    : '分板块推进：强的做、弱的守。';
}

/** Soft narrative only — never mutates engine scores. */
export function buildCalibrationNarrativeNote(
  markers: KlineStageCalibrationHint[] | null | undefined,
  peakYear: number | null,
  troughYear: number | null,
): string | null {
  if (!Array.isArray(markers) || !markers.length) return null;
  const conf = markers.filter((m) => m.kind === 'confirmed');
  const den = markers.filter((m) => m.kind === 'denied');
  const bits: string[] = [];

  if (peakYear != null && conf.some((m) => Math.abs(m.year - peakYear) <= 2)) {
    bits.push(`你确认的经历落在高点附近（约 ${peakYear}），该段「宜推进」更值得当真`);
  }
  if (troughYear != null && conf.some((m) => Math.abs(m.year - troughYear) <= 2)) {
    bits.push(`你确认的经历靠近低谷年（约 ${troughYear}），防守窗口应更重视`);
  }
  if (den.length) {
    bits.push(`有 ${den.length} 个节点你标为未发生，对应年份只作对照、不强化`);
  }
  if (!bits.length && conf.length) {
    bits.push(
      `已对照 ${conf.length} 个真实节点（图上 ✓）；分数未改写，读图时优先看带校准的年份`,
    );
  }
  if (!bits.length) return null;
  return `${bits.join('。')}。`;
}

/**
 * 从 kline 点列生成阶段叙事（人话 + 结构化字段）。
 */
export function buildKlineStageNarrative(
  klineData?: KlinePointLike[] | null,
  opts?: {
    birthYear?: number;
    now?: Date;
    calibrationMarkers?: KlineStageCalibrationHint[] | null;
  },
): KlineStageNarrative | null {
  if (!Array.isArray(klineData) || klineData.length < 3) return null;

  const now = opts?.now || new Date();
  const currentYear = now.getFullYear();
  const birthYear =
    opts?.birthYear && opts.birthYear > 1900 && opts.birthYear < currentYear
      ? opts.birthYear
      : null;
  const age = birthYear != null ? currentYear - birthYear : null;

  const points = klineData
    .map((p) => {
      const year = Number(p.year);
      if (!Number.isFinite(year)) return null;
      return {
        year,
        score: Math.round(overallOf(p)),
        raw: p,
      };
    })
    .filter((p): p is { year: number; score: number; raw: KlinePointLike } => Boolean(p))
    .sort((a, b) => a.year - b.year);

  if (points.length < 3) return null;

  const scores = points.map((p) => p.score);
  const med = median(scores);
  const currentPt =
    points.find((p) => p.year === currentYear) ||
    points.reduce((best, p) =>
      Math.abs(p.year - currentYear) < Math.abs(best.year - currentYear) ? p : best,
    points[0]!);
  const currentScore = currentPt.score;
  const lastYearPt = points.find((p) => p.year === currentPt.year - 1);
  const vsLastYear =
    lastYearPt != null ? Math.round(currentScore - lastYearPt.score) : null;

  const next3 = points.filter(
    (p) => p.year > currentPt.year && p.year <= currentPt.year + 3,
  );
  const next3Avg = next3.length
    ? next3.reduce((s, p) => s + p.score, 0) / next3.length
    : null;
  const next3Trend: 'up' | 'flat' | 'down' | null =
    next3Avg == null
      ? null
      : next3Avg - currentScore >= 2.5
        ? 'up'
        : next3Avg - currentScore <= -2.5
          ? 'down'
          : 'flat';

  const dims = dimScores(currentPt.raw);
  const strongest = [...dims].sort((a, b) => b.score - a.score)[0] || null;
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0] || null;

  let peak = points[0]!;
  let trough = points[0]!;
  for (const p of points) {
    if (p.score > peak.score) peak = p;
    if (p.score < trough.score) trough = p;
  }

  // 简单拐点：未来 15 年内相对当前的首个局部极值
  let nextInflection: KlineStageNarrative['nextInflection'] = null;
  const future = points.filter((p) => p.year > currentPt.year && p.year <= currentPt.year + 15);
  for (let i = 1; i < future.length - 1; i++) {
    const prev = future[i - 1]!.score;
    const curr = future[i]!.score;
    const next = future[i + 1]!.score;
    if (curr >= prev && curr >= next && curr >= currentScore + 3) {
      nextInflection = { year: future[i]!.year, kind: 'peak', score: curr };
      break;
    }
    if (curr <= prev && curr <= next && curr <= currentScore - 3) {
      nextInflection = { year: future[i]!.year, kind: 'trough', score: curr };
      break;
    }
  }

  const tone = toneFromScores(currentScore, next3Avg, med);
  const vsMedian: KlineStageNarrative['vsMedian'] =
    currentScore >= med + 5 ? 'above' : currentScore <= med - 5 ? 'below' : 'near';

  const peakReason =
    (peak.raw.evidence?.drivers && peak.raw.evidence.drivers[0]) ||
    (peak.raw.evidence?.ganZhi ? `${peak.raw.evidence.ganZhi}流年` : null);
  const troughReason =
    (trough.raw.evidence?.risks && trough.raw.evidence.risks[0]) ||
    (trough.raw.evidence?.drivers && trough.raw.evidence.drivers[0]) ||
    null;

  const headline = headlineFor({
    age,
    tone,
    strongest: strongest?.label || null,
    weakest: weakest?.label || null,
    next3Trend,
  });

  const relBits: string[] = [];
  if (vsMedian === 'above') relBits.push('高于你人生中位');
  else if (vsMedian === 'below') relBits.push('低于你人生中位');
  else relBits.push('贴近你人生中位');
  if (vsLastYear != null && vsLastYear !== 0) {
    relBits.push(vsLastYear > 0 ? `较去年约 +${vsLastYear}` : `较去年约 ${vsLastYear}`);
  }
  if (nextInflection) {
    const kindLabel =
      nextInflection.kind === 'peak'
        ? '抬升窗口'
        : nextInflection.kind === 'trough'
          ? '回撤窗口'
          : '转折';
    relBits.push(`下一参考${kindLabel}约 ${nextInflection.year}`);
  }

  const support = `今年综合约 ${currentScore}（${relBits.join(' · ')}）。高点参考 ${peak.year}${
    birthYear ? `（约 ${peak.year - birthYear} 岁）` : ''
  }，低谷参考 ${trough.year}${birthYear ? `（约 ${trough.year - birthYear} 岁）` : ''}。`;

  const calibrationNote = buildCalibrationNarrativeNote(
    opts?.calibrationMarkers,
    peak.year,
    trough.year,
  );
  let actionHint = actionFor(tone, strongest?.label || null, weakest?.label || null);
  if (calibrationNote && confNearPressure(opts?.calibrationMarkers, trough.year)) {
    actionHint = `${actionHint} 结合你确认的低谷经历，先完成防守清单再谈扩张。`;
  }

  return {
    headline,
    support: calibrationNote ? `${support}${calibrationNote}` : support,
    tone,
    age,
    currentYear: currentPt.year,
    currentScore,
    vsMedian,
    vsLastYear,
    next3Trend,
    strongestDim: strongest,
    weakestDim: weakest,
    peak: {
      year: peak.year,
      score: peak.score,
      age: birthYear != null ? peak.year - birthYear : null,
      reason: peakReason,
    },
    trough: {
      year: trough.year,
      score: trough.score,
      age: birthYear != null ? trough.year - birthYear : null,
      reason: troughReason,
    },
    nextInflection,
    actionHint,
    calibrationNote,
  };
}

function confNearPressure(
  markers: KlineStageCalibrationHint[] | null | undefined,
  troughYear: number | null,
): boolean {
  if (!markers?.length || troughYear == null) return false;
  return markers.some(
    (m) => m.kind === 'confirmed' && Math.abs(m.year - troughYear) <= 2,
  );
}
