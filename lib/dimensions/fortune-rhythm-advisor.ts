import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';
import type { KlineAnchorV6 } from '@/lib/kline-v6';
import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import {
  averageLines,
  buildPrediction,
  clampConfidence,
  findKlinePoint,
  formatDateOffset,
  formatWuxingList,
  quarterOfDate,
  rankLifeLines,
  section,
  yearQuarterLabel,
} from './shared';

function resolveCurrentPhase(
  kline: CreateContextInput['truthInput']['kline'],
  anchors: KlineAnchorV6[],
): { text: string; score: number; tone: 'positive' | 'warning' | 'default' } {
  if (!kline.length) {
    return { text: '数据不足，建议先补齐出生资料后重试。', score: 0, tone: 'warning' };
  }
  const currentYear = new Date().getFullYear();
  const current = findKlinePoint(kline, currentYear);
  if (!current) {
    return { text: 'K 线点位缺失，建议重新生成完整报告。', score: 0, tone: 'warning' };
  }
  const score = averageLines(current);
  const nearest = anchors
    .filter((item) => item.year >= currentYear - 1 && item.year <= currentYear + 2)
    .sort((a, b) => Math.abs(a.year - currentYear) - Math.abs(b.year - currentYear))[0];

  if (score >= 62) {
    return {
      text: `整体处于抬升阶段（${currentYear} 综合约 ${Math.round(score)} 分），宜主动推进 1 件关键事项，而不是同步铺开多条战线。`,
      score,
      tone: 'positive',
    };
  }
  if (score <= 48) {
    return {
      text: `整体处于收敛阶段（${currentYear} 综合约 ${Math.round(score)} 分），宜先稳住基本盘（现金、健康、核心关系），再谈扩张。`,
      score,
      tone: 'warning',
    };
  }
  if (nearest?.type === 'turning') {
    return {
      text: `${currentYear} 附近出现节奏转折（锚点 ${nearest.year}，约 ${nearest.score} 分），建议以「小步验证」替代一次性豪赌。`,
      score,
      tone: 'default',
    };
  }
  return {
    text: `整体处于震荡整理阶段（${currentYear} 综合约 ${Math.round(score)} 分），适合修内功、清负债、等窗口。`,
    score,
    tone: 'default',
  };
}

function lineEvidenceItems(
  kline: CreateContextInput['truthInput']['kline'],
): string[] {
  const current = findKlinePoint(kline);
  if (!current) return ['暂无线条评分，请先完善出生信息。'];
  const ranked = rankLifeLines(current);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  return [
    `${current.year} 年四线：事业 ${Math.round(current.career)} / 财富 ${Math.round(current.wealth)} / 关系 ${Math.round(current.marriage)} / 健康 ${Math.round(current.health)}。`,
    `当前相对强项是「${strongest.label}」（${Math.round(strongest.score)} 分），优先把关键资源押在这条线上。`,
    `当前相对弱项是「${weakest.label}」（${Math.round(weakest.score)} 分），避免在该线做高杠杆决策。`,
  ];
}

function engineEvidenceItems(pack: CreateContextInput & { birthSignature: string }): string[] {
  const yongShen = pack.truthInput.yongShen;
  const current = findKlinePoint(pack.truthInput.kline || []);
  const evidence = current && 'evidence' in current ? (current as { evidence?: { drivers?: string[]; risks?: string[]; ganZhi?: string; dayunGanZhi?: string | null } }).evidence : undefined;
  const items = [
    yongShen
      ? `日主${yongShen.dayMaster}（${yongShen.dayMasterElement}），用神 ${formatWuxingList(yongShen.yongShen)}，忌神 ${formatWuxingList(yongShen.jiShen, '未显')}。格局：${yongShen.pattern?.pattern || '正格'}。`
      : '用神信息不足，节奏判断以降权方式给出。',
    evidence?.ganZhi ? `今年流年 ${evidence.ganZhi}${evidence.dayunGanZhi ? `，大运 ${evidence.dayunGanZhi}` : ''}。` : '',
    ...(evidence?.drivers || []).slice(0, 2).map((item) => `驱动：${item}`),
    ...(evidence?.risks || []).slice(0, 2).map((item) => `风险：${item}`),
    yongShen?.confidence?.boundary ? `可信度边界：${yongShen.confidence.boundary}` : '',
  ];
  return items.filter(Boolean);
}

export function buildFortuneRhythmReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_fortune_${birthSignature}_${Date.now()}`;
  const kline = truthInput.kline || [];
  const anchors = truthInput.anchors || [];
  const currentYear = new Date().getFullYear();
  const phase = resolveCurrentPhase(kline, anchors);
  const current = findKlinePoint(kline, currentYear);
  const ranked = current ? rankLifeLines(current) : [];

  const futureAnchors = anchors
    .filter((item) => item.year >= currentYear && item.year <= currentYear + 12)
    .sort((a, b) => a.year - b.year)
    .slice(0, 6);

  const nextPeak = futureAnchors.find((item) => item.type === 'peak');
  const nextTrough = futureAnchors.find((item) => item.type === 'trough');
  const nextTurning = futureAnchors.find((item) => item.type === 'turning');

  const confidenceBase = truthInput.yongShen?.confidence?.score
    ? truthInput.yongShen.confidence.score / 100
    : 0.72;

  const sections = [
    section('core', '核心结论', [phase.text], phase.tone === 'warning' ? 'warning' : 'positive'),
    section('lines', '四线强弱', lineEvidenceItems(kline)),
    section(
      'turning',
      '未来转折点',
      futureAnchors.length
        ? futureAnchors.map((item) => {
            const label = item.type === 'peak' ? '高点' : item.type === 'trough' ? '低点' : item.type === 'turning' ? '转折' : '平稳';
            return `${item.year} 年（${label}，约 ${item.score} 分）：${item.reason}`;
          })
        : ['未来一年未检测到显著拐点，建议按季度复盘节奏，不因“等待大运”而停摆。'],
    ),
    section('windows', '节奏窗口建议', [
      `近 30 天（${yearQuarterLabel(currentYear, quarterOfDate())} 内）：完成一件能立刻落地的小动作，验证当前节奏是否顺畅。`,
      '近 90 天：围绕一个主目标做阶段复盘，避免同时铺开超过 2 条主战线。',
      nextPeak
        ? `${nextPeak.year} 高点窗口前 3-6 个月启动关键项目准备（能力、人脉、现金流）。`
        : '近 365 天：在未见明确高点前，优先积累可迁移成果，而不是押注一次性机会。',
      nextTrough
        ? `${nextTrough.year} 低点窗口前主动收敛风险敞口（杠杆、多线投入、情绪化决策）。`
        : '低谷未显化时，仍预留下半年调整空间，避免把全年计划锁死。',
    ]),
    section('actions', '行动建议', [
      ranked[0]
        ? `本季主攻「${ranked[0].label}」线：把 60% 精力押在这条线上，其余只做维护。`
        : '本季只选一个主目标，建立可验证里程碑。',
      nextTurning
        ? `${nextTurning.year} 转折附近用「小试验」代替大承诺，先验证再加码。`
        : '遇到选择时，优先可逆决策，保留二次调整权。',
      '把本页 3 条预测同步到「预测回访」，到期后反馈命中情况，校准下一轮判断。',
    ]),
    section('evidence', '引擎证据', engineEvidenceItems(pack), 'muted'),
    section('notes', '注意事项', [
      '节奏判断基于命盘结构 + K 线模型，不替代你对现实约束的评估。',
      '时辰未知会降低流年精度，建议后续补齐出生时辰再生成完整报告。',
      '分数是相对强弱，不是命运定级；重点在行动排序与复盘。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'p1', {
      category: 'timing',
      statement: nextPeak
        ? `${nextPeak.year}年Q2-Q3整体节奏抬升（锚点约${nextPeak.score}分），适合推进一件关键事项`
        : `${currentYear + 1}年上半年适合完成一次节奏校准与目标重排`,
      dueDate: nextPeak ? `${nextPeak.year}-09-30` : formatDateOffset(365),
      confidence: clampConfidence(confidenceBase + 0.04),
      evidence: nextPeak
        ? `运势节奏 · K线高点锚点 ${nextPeak.year}（${nextPeak.score}分）`
        : '运势节奏 · 12个月校准窗口',
      window: nextPeak ? `${nextPeak.year}年Q2-Q3` : `${currentYear + 1}年上半年`,
      verifyChecklist: ['是否感到推进阻力下降？', '关键事项是否有实质进展？', '是否只主攻一条主战线？'],
    }),
    buildPrediction(reportId, birthSignature, 'p2', {
      category: 'timing',
      statement: nextTrough
        ? `${nextTrough.year}年宜主动收敛战线（低点约${nextTrough.score}分），避免多线高投入`
        : `${currentYear}年Q4适合做一次全面复盘与取舍`,
      dueDate: nextTrough ? `${nextTrough.year}-06-30` : formatDateOffset(180),
      confidence: clampConfidence(confidenceBase),
      evidence: nextTrough
        ? `运势节奏 · K线低点锚点 ${nextTrough.year}`
        : '运势节奏 · 年末复盘窗口',
      window: nextTrough ? `${nextTrough.year}年` : `${currentYear}年Q4`,
      verifyChecklist: ['是否减少了无效消耗？', '现金流/精力是否更稳？'],
    }),
    buildPrediction(reportId, birthSignature, 'p3', {
      category: 'timing',
      statement: ranked[0]
        ? `未来90天在「${ranked[0].label}」线上完成一个可验证小成果（当前约${Math.round(ranked[0].score)}分）`
        : '未来90天内适合验证一个「小步快跑」动作是否有效',
      dueDate: formatDateOffset(90),
      confidence: clampConfidence(confidenceBase - 0.02),
      evidence: ranked[0]
        ? `运势节奏 · ${ranked[0].label}线相对强势`
        : '运势节奏 · 90天行动窗口',
      window: '未来90天',
      verifyChecklist: ['90天内是否完成验证？', '是否据此调整了下一步计划？'],
    }),
  ];

  return {
    slug: 'fortune-rhythm',
    title: '运势节奏研判',
    question: '我现在处在什么阶段？下一个转折点何时？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['节奏判断用于行动排序，不构成命运定论。'],
    meta: {
      anchorCount: anchors.length,
      currentYear,
      compositeScore: Math.round(phase.score),
      strongestLine: ranked[0]?.label || '',
      weakestLine: ranked[ranked.length - 1]?.label || '',
      priority: 'p0',
    },
  };
}
