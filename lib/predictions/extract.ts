import type { MergedAgentResults } from '@/lib/agentic-report/types';
import type { Prediction, PredictionCategory } from './types';

type Candidate = {
  category: PredictionCategory;
  statement: string;
  evidence: string;
  confidence: number;
  dueDate?: string;
  window?: string;
  verifyChecklist?: string[];
};

const PREDICTION_CATEGORIES: PredictionCategory[] = ['career', 'wealth', 'marriage', 'health', 'timing'];

type StructuredPredictionInput = {
  category?: unknown;
  statement?: unknown;
  dueDate?: unknown;
  confidence?: unknown;
  verifyChecklist?: unknown;
  window?: unknown;
};

const AGENT_CATEGORY_MAP: Record<string, PredictionCategory> = {
  career_wealth: 'career',
  relationship_family: 'marriage',
  health_lifestyle: 'health',
  health_wellness: 'health',
  kline_narrative: 'timing',
  strategy_advisor: 'timing',
  temporal_spatial_advisor: 'timing',
};

const CATEGORY_KEYWORDS: Record<PredictionCategory, RegExp> = {
  career: /事业|职业|升迁|升职|跳槽|项目|职场|岗位|团队|领导/,
  wealth: /财富|收入|财运|投资|资金|理财|资产|营收|盈利/,
  marriage: /感情|婚姻|伴侣|恋爱|家庭|亲子|合作|关系|配偶/,
  health: /健康|身体|恢复|睡眠|压力|养生|作息|精力|体能/,
  timing: /阶段|周期|窗口|转折|高峰|低谷|运势|时序|节奏/,
};

function inferCategory(text: string, fallback: PredictionCategory): PredictionCategory {
  const scores = (Object.keys(CATEGORY_KEYWORDS) as PredictionCategory[]).map((category) => ({
    category,
    score: CATEGORY_KEYWORDS[category].test(text) ? 1 : 0,
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best?.score ? best.category : fallback;
}

function hasTimeSignal(text: string): boolean {
  return /(\d{4})年|Q[1-4]|第[一二三四1-4]季度|[上下]半年|未来\s*\d+\s*个?月|今明两年|今年|明年|后年|季度|月份?|周内|月内/.test(
    text,
  );
}

function hasJudgmentSignal(text: string): boolean {
  return /将|会|宜|适合|注意|避免|窗口|机会|风险|上升|下降|好转|承压|突破|调整|推进|放缓/.test(text);
}

function endOfQuarter(year: number, quarter: number): string {
  const month = quarter * 3;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function addMonths(base: Date, months: number): string {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

function parseTimeWindow(text: string, reference = new Date()): { window?: string; dueDate: string } {
  const refYear = reference.getFullYear();

  const yearRange = text.match(/(\d{4})\s*[-–~至]\s*(\d{4})/);
  if (yearRange) {
    const endYear = Number(yearRange[2]);
    return { window: `${yearRange[1]}–${yearRange[2]}年`, dueDate: `${endYear}-12-31` };
  }

  const quarterRange = text.match(/(\d{4})年?\s*Q([1-4])\s*[-–~至]\s*Q([1-4])/i);
  if (quarterRange) {
    const year = Number(quarterRange[1]);
    const endQuarter = Number(quarterRange[3]);
    return {
      window: `${year}年Q${quarterRange[2]}-Q${endQuarter}`,
      dueDate: endOfQuarter(year, endQuarter),
    };
  }

  const singleQuarter = text.match(/(\d{4})年?\s*Q([1-4])/i) || text.match(/(\d{4})年?\s*第?([一二三四1-4])季度/);
  if (singleQuarter) {
    const year = Number(singleQuarter[1]);
    const quarterRaw = singleQuarter[2];
    const quarterMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, '1': 1, '2': 2, '3': 3, '4': 4 };
    const quarter = quarterMap[quarterRaw] || Number(quarterRaw);
    return { window: `${year}年Q${quarter}`, dueDate: endOfQuarter(year, quarter) };
  }

  const yearMatch = text.match(/(\d{4})年/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return { window: `${year}年`, dueDate: `${year}-12-31` };
  }

  if (/上半年/.test(text)) {
    return { window: `${refYear}年上半年`, dueDate: `${refYear}-06-30` };
  }
  if (/下半年/.test(text)) {
    return { window: `${refYear}年下半年`, dueDate: `${refYear}-12-31` };
  }

  const futureMonths = text.match(/未来\s*(\d+)\s*个?月/);
  if (futureMonths) {
    const months = Number(futureMonths[1]);
    return { window: `未来${months}个月`, dueDate: addMonths(reference, months) };
  }

  if (/今明两年/.test(text)) {
    return { window: '今明两年', dueDate: `${refYear + 1}-12-31` };
  }
  if (/明年/.test(text)) {
    return { window: `${refYear + 1}年`, dueDate: `${refYear + 1}-12-31` };
  }
  if (/后年/.test(text)) {
    return { window: `${refYear + 2}年`, dueDate: `${refYear + 2}-12-31` };
  }
  if (/今年/.test(text)) {
    return { window: `${refYear}年`, dueDate: `${refYear}-12-31` };
  }

  return { window: '未来12个月', dueDate: addMonths(reference, 12) };
}

function buildVerifyChecklist(category: PredictionCategory, statement: string): string[] {
  const base: Record<PredictionCategory, string[]> = {
    career: [
      '是否出现职位、项目或职责层面的实质变化？',
      '工作节奏与优先级是否按预测方向调整？',
      '关键合作或上级反馈是否与判断一致？',
    ],
    wealth: [
      '收入、现金流或资产结构是否有可观察变化？',
      '是否出现新的开支、投资或资金压力？',
      '财务决策结果是否与预测窗口吻合？',
    ],
    marriage: [
      '关系互动、承诺或家庭分工是否有明显变化？',
      '沟通质量与冲突频率是否符合预测方向？',
      '是否出现新的合作、分离或亲密节点？',
    ],
    health: [
      '精力、睡眠或恢复节奏是否出现预测中的波动？',
      '是否按建议调整了作息、运动或负荷？',
      '身体不适或压力信号是否如预测般显现？',
    ],
    timing: [
      '该时间窗口内整体节奏是否符合预测趋势？',
      '是否出现预测提到的高峰、低谷或转折点？',
      '关键决策的结果是否与阶段判断一致？',
    ],
  };

  const checklist = [...base[category]];
  if (/Q[1-4]|[上下]半年|季度/.test(statement)) {
    checklist.push('到期时对照季度/半年节点复盘一次。');
  }
  return checklist.slice(0, 4);
}

function collectStrings(value: unknown, prefix = ''): Array<{ text: string; path: string }> {
  if (typeof value === 'string' && value.trim()) {
    return [{ text: value.trim(), path: prefix }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) =>
      collectStrings(nested, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

function agentLabel(agentKey: string): string {
  const labels: Record<string, string> = {
    career_wealth: '事业财富 Agent',
    relationship_family: '关系家庭 Agent',
    health_lifestyle: '健康生活 Agent',
    health_wellness: '健康 Agent',
    kline_narrative: '趋势叙事 Agent',
    strategy_advisor: '策略顾问 Agent',
    temporal_spatial_advisor: '时空顾问 Agent',
  };
  return labels[agentKey] || agentKey;
}

function normalizeCategory(raw: unknown, fallback: PredictionCategory, statement = ''): PredictionCategory {
  if (typeof raw === 'string' && PREDICTION_CATEGORIES.includes(raw as PredictionCategory)) {
    return raw as PredictionCategory;
  }
  if (statement) {
    return inferCategory(statement, fallback);
  }
  return fallback;
}

function normalizeDueDate(raw: unknown, statement: string): string {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }
  return parseTimeWindow(statement).dueDate;
}

function normalizeVerifyChecklist(
  raw: unknown,
  category: PredictionCategory,
  statement: string,
): string[] {
  if (Array.isArray(raw)) {
    const items = raw.map((item) => String(item).trim()).filter(Boolean);
    if (items.length) return items.slice(0, 4);
  }
  return buildVerifyChecklist(category, statement);
}

function extractStructuredFromAgent(
  agentKey: string,
  payload: Record<string, unknown>,
  successRate: number,
): Candidate[] {
  const predictions = payload.predictions;
  if (!Array.isArray(predictions) || !predictions.length) return [];

  const fallbackCategory = AGENT_CATEGORY_MAP[agentKey] || 'timing';
  const evidence = agentLabel(agentKey);
  const defaultConfidence = confidenceForAgent(agentKey, successRate);
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const [index, item] of predictions.entries()) {
    if (!item || typeof item !== 'object') continue;
    const row = item as StructuredPredictionInput;
    const statement = typeof row.statement === 'string' ? row.statement.trim().replace(/\s+/g, ' ') : '';
    if (statement.length < 8 || statement.length > 220) continue;

    const category = normalizeCategory(row.category, fallbackCategory, statement);
    const dueDate = normalizeDueDate(row.dueDate, statement);
    const confidenceRaw = typeof row.confidence === 'number' ? row.confidence : Number(row.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.min(0.95, Math.max(0.55, confidenceRaw))
      : defaultConfidence;
    const window = typeof row.window === 'string' && row.window.trim() ? row.window.trim() : undefined;

    if (seen.has(statement)) continue;
    seen.add(statement);

    candidates.push({
      category,
      statement,
      evidence: `${evidence} · predictions[${index}]`,
      confidence,
      dueDate,
      window,
      verifyChecklist: normalizeVerifyChecklist(row.verifyChecklist, category, statement),
    });
  }

  return candidates;
}

function confidenceForAgent(agentKey: string, successRate: number): number {
  const base: Record<string, number> = {
    strategy_advisor: 0.82,
    career_wealth: 0.78,
    kline_narrative: 0.76,
    relationship_family: 0.74,
    health_lifestyle: 0.72,
    temporal_spatial_advisor: 0.7,
  };
  const agentBase = base[agentKey] ?? 0.68;
  return Math.min(0.95, Math.max(0.55, agentBase * (0.85 + successRate * 0.15)));
}

function extractFromAgent(
  agentKey: string,
  payload: Record<string, unknown>,
  successRate: number,
): Candidate[] {
  const fallbackCategory = AGENT_CATEGORY_MAP[agentKey] || 'timing';
  const evidence = agentLabel(agentKey);
  const confidence = confidenceForAgent(agentKey, successRate);
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  for (const { text, path } of collectStrings(payload, agentKey)) {
    if (text.length < 8 || text.length > 180) continue;
    if (!hasTimeSignal(text) && !hasJudgmentSignal(text)) continue;
    if (!hasTimeSignal(text) && path.endsWith('actions')) continue;

    const normalized = text.replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const category =
      agentKey === 'career_wealth'
        ? inferCategory(text, /财富|收入|投资|资金/.test(text) ? 'wealth' : 'career')
        : inferCategory(text, fallbackCategory);

    candidates.push({
      category,
      statement: normalized,
      evidence: `${evidence} · ${path}`,
      confidence,
    });
  }

  if (agentKey === 'kline_narrative') {
    const peakYears = Array.isArray(payload.peakYears) ? payload.peakYears : [];
    const troughYears = Array.isArray(payload.troughYears) ? payload.troughYears : [];
    for (const year of peakYears.slice(0, 2)) {
      const statement = `${year}年可能出现趋势高点窗口，宜把握推进节奏`;
      if (!seen.has(statement)) {
        seen.add(statement);
        candidates.push({
          category: 'timing',
          statement,
          evidence: `${evidence} · peakYears`,
          confidence,
        });
      }
    }
    for (const year of troughYears.slice(0, 2)) {
      const statement = `${year}年可能进入低谷整理期，宜收敛风险与调整预期`;
      if (!seen.has(statement)) {
        seen.add(statement);
        candidates.push({
          category: 'timing',
          statement,
          evidence: `${evidence} · troughYears`,
          confidence,
        });
      }
    }
  }

  return candidates;
}

export function extractPredictions(
  merged: MergedAgentResults,
  reportId: string,
  birthSignature = '',
): Prediction[] {
  const createdAt = new Date().toISOString();
  const agentKeys = [
    'career_wealth',
    'kline_narrative',
    'strategy_advisor',
    'health_lifestyle',
    'health_wellness',
    'relationship_family',
    'temporal_spatial_advisor',
  ];

  const candidates = agentKeys.flatMap((agentKey) => {
    const payload = merged.merged[agentKey];
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as Record<string, unknown>;
    const structured = extractStructuredFromAgent(agentKey, record, merged.successRate);
    if (structured.length) return structured;
    return extractFromAgent(agentKey, record, merged.successRate);
  });

  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.statement)) {
      unique.set(candidate.statement, candidate);
    }
  }

  return Array.from(unique.values())
    .slice(0, 12)
    .map((candidate, index) => {
      const timing = parseTimeWindow(candidate.statement);
      return {
        id: `${reportId}-pred-${index + 1}`,
        reportId,
        birthSignature,
        category: candidate.category,
        statement: candidate.statement,
        confidence: Number(candidate.confidence.toFixed(2)),
        dueDate: candidate.dueDate || timing.dueDate,
        window: candidate.window || timing.window,
        evidence: candidate.evidence,
        verifyChecklist: candidate.verifyChecklist || buildVerifyChecklist(candidate.category, candidate.statement),
        outcome: 'pending' as const,
        createdAt,
      };
    });
}