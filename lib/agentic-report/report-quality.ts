import type { PipelineResult } from './types';
import { extractReportConclusions } from '@/lib/report-conclusions';
import { resolveLearningTrackFromCategory } from '@/lib/learning-tracks';
import { extractPredictions } from '@/lib/predictions/extract';

const PLACEHOLDER_RE = /待补充|TODO|undefined|null|占位|\[trimmed/i;
const TEMPLATE_RE = /当前世界状态|世界处于|扩张后段|试探性/;

export type ReportQualityPack = {
  intent: string;
  birthAccuracy: string;
  qualityScore: number;
  degraded: boolean;
  reasons: string[];
  conclusions: ReturnType<typeof extractReportConclusions>;
  predictions: ReturnType<typeof extractPredictions>;
  deliveryNotes: string[];
};

function scorePipeline(
  result: PipelineResult,
  options?: { birthAccuracy?: string; intent?: string },
): { score: number; reasons: string[]; degraded: boolean } {
  const reasons: string[] = [];
  let score = 0.72;

  const successRate = Number(result?.merged?.successRate ?? 0);
  if (successRate >= 0.8) score += 0.12;
  else if (successRate >= 0.5) score += 0.04;
  else {
    score -= 0.12;
    reasons.push('多代理成功率偏低，结论已按可解释引擎口径收敛');
  }

  const tasks = Array.isArray(result?.run?.tasks) ? result.run.tasks : [];
  const okCount = tasks.filter((item) => item?.status === 'ok').length;
  if (tasks.length && okCount < Math.ceil(tasks.length * 0.4)) {
    score -= 0.1;
    reasons.push('关键代理输出不足，已启用兜底结构');
  }

  const verifyPassed = Boolean((result as { verify?: { passed?: boolean } })?.verify?.passed);
  if (verifyPassed) score += 0.06;
  else reasons.push('格式校验未完全通过，已降权表达');

  const mergedText = JSON.stringify(result?.merged?.merged || {});
  if (PLACEHOLDER_RE.test(mergedText)) {
    score -= 0.1;
    reasons.push('检测到不完整片段，已过滤不可执行表述');
  }
  if (TEMPLATE_RE.test(mergedText) && successRate < 0.5) {
    score -= 0.04;
    reasons.push('表述偏模板化，已补充引擎结构化结论');
  }

  if (options?.birthAccuracy === 'range' || options?.birthAccuracy === 'unknown') {
    score -= 0.03;
  }
  if (!options?.intent || options.intent === 'yearly') {
    // neutral: yearly is valid default, not a penalty
  }

  score = Math.max(0.35, Math.min(0.95, score));
  return { score, reasons, degraded: score < 0.62 || reasons.length >= 2 };
}

function engineBackedConclusions(result: PipelineResult, intent: string) {
  const engine = (result as any)?.context?.engine || (result as any)?.context?.context?.engine;
  if (!engine?.constitution) return [] as ReturnType<typeof extractReportConclusions>;

  const year = new Date().getFullYear();
  const dayMaster = engine.constitution.dayMaster || '日主';
  const pattern = engine.constitution.patternType || '正格';
  const strength = engine.constitution.strength || '中和';
  const yong = Array.isArray(engine.constitution.yongShen)
    ? engine.constitution.yongShen.filter(Boolean).join('、')
    : '';
  const ji = Array.isArray(engine.constitution.jiShen)
    ? engine.constitution.jiShen.filter(Boolean).join('、')
    : '';
  const score = Number(engine.derivedFacts?.currentScore) || 50;
  const age = Number(engine.derivedFacts?.currentAge) || 0;

  const careerWin = engine.timeWindows?.career?.[0];
  const wealthWin = engine.timeWindows?.wealth?.[0];
  const relWin = engine.timeWindows?.relationship?.[0];

  const items: ReturnType<typeof extractReportConclusions> = [
    {
      category: 'timing',
      statement: `${dayMaster}日主·${pattern}·${strength}${yong ? `，用神优先${yong}` : ''}${ji ? `，忌神回避${ji}` : ''}；当前约${age}岁，综合节奏分${score}`,
      trackKey: resolveLearningTrackFromCategory('timing'),
      priority: 5,
    },
  ];

  if (intent === 'wealth' || intent === 'yearly') {
    items.push({
      category: 'wealth',
      statement: wealthWin
        ? `财富窗口参考 ${wealthWin.startYear || wealthWin.from || year}-${wealthWin.endYear || wealthWin.to || year + 2}：先做可复核的现金流与仓位纪律，再谈扩张`
        : `${year}年财富侧宜「小步试探 + 安全垫」，避免无对冲的高杠杆`,
      trackKey: resolveLearningTrackFromCategory('wealth'),
      priority: 4,
    });
  }
  if (intent === 'career' || intent === 'yearly') {
    items.push({
      category: 'career',
      statement: careerWin
        ? `事业窗口参考 ${careerWin.startYear || careerWin.from || year}-${careerWin.endYear || careerWin.to || year + 2}：优先完成一件可被外部验证的成果`
        : `事业上优先完成 1 件可验证成果，再决定是否扩编制/换赛道`,
      trackKey: resolveLearningTrackFromCategory('career'),
      priority: 4,
    });
  }
  if (intent === 'relationship' || intent === 'marriage') {
    items.push({
      category: 'relationship',
      statement: relWin
        ? `关系窗口参考 ${relWin.startYear || relWin.from || year}-${relWin.endYear || relWin.to || year + 2}：先处理关键沟通节点，再谈承诺`
        : `关系议题先处理一个关键沟通节点，再推进长期承诺`,
      trackKey: resolveLearningTrackFromCategory('relationship'),
      priority: 4,
    });
  }
  if (intent === 'health' || intent === 'yearly') {
    items.push({
      category: 'health',
      statement: `健康底盘决定执行力：把睡眠/运动做成可打卡习惯，忌神相关负荷期主动降噪`,
      trackKey: resolveLearningTrackFromCategory('health'),
      priority: 3,
    });
  }

  return items.slice(0, 5);
}

/**
 * Normalize and enrich pipeline output for user-facing report quality.
 * Safe for both full agentic success and partial/fallback paths.
 */
export function buildReportQualityPack(
  result: PipelineResult,
  options?: {
    intent?: string | null;
    birthAccuracy?: string | null;
    reportId?: string | null;
  },
): ReportQualityPack {
  const intent = `${options?.intent || 'yearly'}`.trim() || 'yearly';
  const birthAccuracy = `${options?.birthAccuracy || 'range'}`.trim() || 'range';
  const { score, reasons, degraded } = scorePipeline(result, { birthAccuracy, intent });

  let conclusions = extractReportConclusions(result.merged || { merged: {}, successRate: 0, errors: [] }).map(
    (item) => ({
      ...item,
      statement: item.statement.replace(PLACEHOLDER_RE, '').trim() || item.statement,
    }),
  );

  // Drop pure template noise when we have better engine lines
  const templateHeavy =
    conclusions.length > 0 &&
    conclusions.filter((c) => TEMPLATE_RE.test(c.statement)).length >= Math.ceil(conclusions.length * 0.6);

  if (conclusions.length < 3 || templateHeavy) {
    const backed = engineBackedConclusions(result, intent);
    const existing = new Set(conclusions.map((c) => c.statement.slice(0, 24)));
    for (const item of backed) {
      if (existing.has(item.statement.slice(0, 24))) continue;
      conclusions.push(item);
    }
    if (templateHeavy) {
      conclusions = [
        ...backed,
        ...conclusions.filter((c) => !TEMPLATE_RE.test(c.statement)),
      ];
    }
  }

  const reportId = options?.reportId || `report_${Date.now()}`;
  let predictions = extractPredictions(result.merged || { merged: {}, successRate: 0, errors: [] }, reportId).map(
    (item) => ({
      ...item,
      statement: item.statement.replace(PLACEHOLDER_RE, '').trim() || item.statement,
    }),
  );

  // Ensure at least 3 actionable predictions even on thin agent output
  if (predictions.length < 3) {
    const year = new Date().getFullYear();
    const engine = (result as any)?.context?.engine;
    const yong = Array.isArray(engine?.constitution?.yongShen)
      ? engine.constitution.yongShen.filter(Boolean).slice(0, 2).join('、')
      : '';
    const fillers = [
      {
        category: 'timing' as const,
        statement: `${year}年Q3前完成一次阶段复盘，确认主战线是否仍值得投入`,
        dueDate: `${year}-09-30`,
        confidence: Math.max(0.58, score - 0.05),
        evidence: yong ? `质量层 · 用神${yong}` : '质量层 · 默认时序预测',
        window: `${year}年Q3`,
      },
      {
        category:
          intent === 'wealth'
            ? ('wealth' as const)
            : intent === 'relationship' || intent === 'marriage'
              ? ('marriage' as const)
              : ('career' as const),
        statement:
          intent === 'wealth'
            ? '未来90天内不宜做无安全垫的高杠杆扩张'
            : intent === 'relationship' || intent === 'marriage'
              ? '未来90天优先处理一段关键关系沟通，再谈长期承诺'
              : '未来90天优先完成一件可验证的事业/能力成果',
        dueDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        confidence: Math.max(0.56, score - 0.08),
        evidence: '质量层 · 意图默认预测',
        window: '未来90天',
      },
      {
        category: 'timing' as const,
        statement: `${year + 1}年上半年适合重新校准目标与资源分配`,
        dueDate: `${year + 1}-06-30`,
        confidence: Math.max(0.55, score - 0.1),
        evidence: '质量层 · 年度窗口',
        window: `${year + 1}年上半年`,
      },
    ];
    for (const filler of fillers) {
      if (predictions.length >= 3) break;
      predictions.push({
        id: `quality_${reportId}_${predictions.length + 1}`,
        reportId,
        birthSignature: '',
        category: filler.category,
        statement: filler.statement,
        confidence: filler.confidence,
        dueDate: filler.dueDate,
        window: filler.window,
        evidence: filler.evidence,
        verifyChecklist: ['是否按计划执行？', '结果是否可观察？'],
        outcome: 'pending',
        createdAt: new Date().toISOString(),
        source: 'report',
      });
    }
  }

  const deliveryNotes: string[] = [];
  if (birthAccuracy === 'unknown' || birthAccuracy === 'range') {
    deliveryNotes.push('出生时辰不够精确，时柱相关判断已降权，优先参考年月结构与阶段节奏。');
  }
  if (intent === 'yearly') {
    deliveryNotes.push(
      '本次按年度总览口径组织；若更关心事业/财运/关系，可再生成对应主题或进入十维度场景。',
    );
  }
  if (degraded) {
    deliveryNotes.push('本报告已切换为可解释引擎优先口径：少做绝对断言，多给可验证动作。');
  }
  deliveryNotes.push(...reasons.slice(0, 2));

  return {
    intent,
    birthAccuracy,
    qualityScore: Math.round(score * 100) / 100,
    degraded,
    reasons,
    conclusions: conclusions.slice(0, 6),
    predictions: predictions.slice(0, 6),
    deliveryNotes: Array.from(new Set(deliveryNotes)).slice(0, 5),
  };
}
