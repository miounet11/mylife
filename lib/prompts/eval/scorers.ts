/**
 * 5 维评分器。
 * 输入：一份模型 JSON 输出 + 对应 EvalCase。
 * 输出：每维 0-100 分 + 加权 total。
 *
 * 评分实现是纯函数，不依赖模型也不依赖网络，便于在 CI 跑。
 * human_taste 默认置 80，留接口给 LLM judge 或人工覆盖。
 */
import type { EvalCase, EvalScore } from '../types';
import { SCORE_WEIGHTS } from '../types';

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function flatten(obj: unknown, acc: string[] = [], excludeKeys: Set<string> = new Set()): string[] {
  if (obj == null) return acc;
  if (typeof obj === 'string') {
    acc.push(obj);
    return acc;
  }
  if (typeof obj !== 'object') {
    acc.push(String(obj));
    return acc;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v) => flatten(v, acc, excludeKeys));
    return acc;
  }
  Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
    if (excludeKeys.has(k)) return;
    flatten(v, acc, excludeKeys);
  });
  return acc;
}

function countFieldsPresent(output: unknown, required: string[]): { hit: number; total: number } {
  if (!output || typeof output !== 'object') return { hit: 0, total: required.length };
  let hit = 0;
  for (const path of required) {
    const parts = path.split('.');
    let cur: any = output;
    let ok = true;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object' || !(p in cur)) {
        ok = false;
        break;
      }
      cur = cur[p];
    }
    if (ok && cur !== '' && cur != null) hit += 1;
  }
  return { hit, total: required.length };
}

export interface ScorerOptions {
  /** 必填字段路径，例如 ['pattern.type', 'analysis.summary'] */
  requiredFields?: string[];
  /** 反模式黑名单（额外叠加在 case.mustExclude 上） */
  globalAntiPatterns?: string[];
  /** 引擎真值字段对比：output 里对应路径必须等于该值 */
  engineTruth?: Record<string, unknown>;
  /** 是否注入 LLM judge 得分（0-100），不传时 human_taste 默认 80 */
  humanTaste?: number;
}

export function scoreOutput(
  output: unknown,
  evalCase: EvalCase,
  options: ScorerOptions = {}
): EvalScore {
  const notes: string[] = [];

  // 1) structure_completeness
  const required = options.requiredFields || [];
  const { hit, total } = countFieldsPresent(output, required);
  const structure_completeness = total === 0 ? 100 : clamp((hit / total) * 100);
  if (total > 0 && hit < total) {
    notes.push(`completeness: ${hit}/${total}`);
  }

  // 2) evidence_density —— 启发式：判断句里带数字/年份/锚点关键词的比例
  // 跳过 citations 这种技术 metadata 字段，避免误判反模式。
  const TECH_FIELDS = new Set(['citations']);
  const allText = flatten(output, [], TECH_FIELDS).join(' ');
  const sentences = allText.split(/[。！？!?\n]/).filter((s) => s.trim().length >= 6);
  const evidenced = sentences.filter((s) => /\d|大运|流年|节气|立春|用神|忌神|月|年/.test(s));
  const evidence_density = sentences.length === 0
    ? 50
    : clamp((evidenced.length / sentences.length) * 100);

  // 3) anti_pattern_hit —— 命中越多分越低
  const bans = [
    ...(evalCase.mustExclude || []),
    ...(options.globalAntiPatterns || []),
  ];
  let hits = 0;
  for (const ban of bans) {
    if (ban && allText.includes(ban)) {
      hits += 1;
      notes.push(`anti_pattern hit: "${ban}"`);
    }
  }
  const anti_pattern_hit = clamp(100 - hits * 20);

  // 4) engine_consistency —— evalCase / options.engineTruth 里给的字段，必须在 output 里完全匹配
  const truth = { ...(evalCase.engineTruth || {}), ...(options.engineTruth || {}) };
  const truthKeys = Object.keys(truth);
  let matched = 0;
  for (const key of truthKeys) {
    const parts = key.split('.');
    let cur: any = output;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') {
        cur = undefined;
        break;
      }
      cur = cur[p];
    }
    if (JSON.stringify(cur) === JSON.stringify(truth[key])) {
      matched += 1;
    } else {
      notes.push(`engine_truth miss: ${key} expected=${JSON.stringify(truth[key])} actual=${JSON.stringify(cur)}`);
    }
  }
  const engine_consistency = truthKeys.length === 0 ? 100 : clamp((matched / truthKeys.length) * 100);

  // 5) must_include 命中：每漏一条扣 evidence_density 10 分
  let evidenceAdjusted = evidence_density;
  if (evalCase.mustInclude?.length) {
    const miss = evalCase.mustInclude.filter((s) => !allText.includes(s));
    if (miss.length) {
      evidenceAdjusted = clamp(evidence_density - miss.length * 10);
      notes.push(`mustInclude miss: ${miss.join(', ')}`);
    }
  }

  const human_taste = options.humanTaste ?? 80;

  const scores = {
    structure_completeness,
    evidence_density: evidenceAdjusted,
    anti_pattern_hit,
    engine_consistency,
    human_taste,
  };

  const total_weighted =
    scores.structure_completeness * SCORE_WEIGHTS.structure_completeness +
    scores.evidence_density * SCORE_WEIGHTS.evidence_density +
    scores.anti_pattern_hit * SCORE_WEIGHTS.anti_pattern_hit +
    scores.engine_consistency * SCORE_WEIGHTS.engine_consistency +
    scores.human_taste * SCORE_WEIGHTS.human_taste;

  return {
    caseId: evalCase.id,
    promptId: evalCase.promptId,
    promptVersion: 'unknown',
    scores,
    total: Math.round(total_weighted * 10) / 10,
    notes,
  };
}

/** 把一组 EvalScore 聚合成平均分（每维 + total）。 */
export function aggregateScores(scores: EvalScore[]) {
  if (!scores.length) {
    return { count: 0, avg: null as null | EvalScore['scores'], total: 0 };
  }
  const avg = {
    structure_completeness: 0,
    evidence_density: 0,
    anti_pattern_hit: 0,
    engine_consistency: 0,
    human_taste: 0,
  };
  let total = 0;
  for (const s of scores) {
    avg.structure_completeness += s.scores.structure_completeness;
    avg.evidence_density += s.scores.evidence_density;
    avg.anti_pattern_hit += s.scores.anti_pattern_hit;
    avg.engine_consistency += s.scores.engine_consistency;
    avg.human_taste += s.scores.human_taste;
    total += s.total;
  }
  const n = scores.length;
  return {
    count: n,
    avg: {
      structure_completeness: +(avg.structure_completeness / n).toFixed(1),
      evidence_density: +(avg.evidence_density / n).toFixed(1),
      anti_pattern_hit: +(avg.anti_pattern_hit / n).toFixed(1),
      engine_consistency: +(avg.engine_consistency / n).toFixed(1),
      human_taste: +(avg.human_taste / n).toFixed(1),
    },
    total: +(total / n).toFixed(1),
  };
}
