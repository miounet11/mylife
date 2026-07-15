import type { MergedAgentResults } from '@/lib/agentic-report/types';
import type { LearningTrackKey } from '@/lib/learning-tracks';
import { resolveLearningTrackFromCategory } from '@/lib/learning-tracks';

export type ReportConclusion = {
  category: string;
  statement: string;
  trackKey: LearningTrackKey;
  priority: number;
};

const AGENT_PRIORITY: Record<string, number> = {
  strategy_advisor: 5,
  career_wealth: 4,
  kline_narrative: 3,
  relationship_family: 3,
  health_lifestyle: 2,
  core_constitution: 1,
};

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  career: /事业|职业|升迁|升职|跳槽|职场|岗位|低谷|高峰/,
  wealth: /财富|收入|财运|投资|理财|资产|守财|扩张/,
  relationship: /感情|婚姻|伴侣|恋爱|家庭|亲子|关系|配偶/,
  health: /健康|身体|恢复|睡眠|压力|养生|精力/,
  timing: /阶段|周期|窗口|转折|大运|流年|时序/,
  family: /家庭|亲子|父母|子女/,
  migration: /迁移|搬家|异地|城市/,
};

function inferCategory(text: string): string {
  const hits = Object.entries(CATEGORY_KEYWORDS)
    .map(([category, pattern]) => ({ category, score: pattern.test(text) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score);
  return hits[0]?.score ? hits[0].category : 'timing';
}

function collectStatements(agentKey: string, data: Record<string, unknown>): string[] {
  const statements: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim().length >= 8) statements.push(value.trim());
  };

  push(data.currentPhase);
  push(data.constitutionSummary);
  push(data.topPriority);
  push(data.primaryTrack);
  push(data.capitalDiscipline);
  push(data.relationshipFocus);
  push(data.healthFocus);

  if (Array.isArray(data.actions)) {
    for (const action of data.actions) push(action);
  }
  if (Array.isArray(data.peakYears)) {
    push(`高点年份：${data.peakYears.join('、')}`);
  }
  if (Array.isArray(data.troughYears)) {
    push(`低谷年份：${data.troughYears.join('、')}`);
  }

  if (!statements.length && agentKey) {
    const raw = JSON.stringify(data);
    if (raw.length > 20) statements.push(raw.slice(0, 120));
  }

  return statements;
}

export function extractReportConclusions(merged: MergedAgentResults): ReportConclusion[] {
  const conclusions: ReportConclusion[] = [];

  for (const [agentKey, data] of Object.entries(merged.merged)) {
    if (!data || typeof data !== 'object') continue;
    const priority = AGENT_PRIORITY[agentKey] || 1;
    for (const statement of collectStatements(agentKey, data as Record<string, unknown>)) {
      const category = inferCategory(statement);
      conclusions.push({
        category,
        statement,
        trackKey: resolveLearningTrackFromCategory(category),
        priority,
      });
    }
  }

  return conclusions
    .sort((a, b) => b.priority - a.priority)
    .filter((item, index, arr) => arr.findIndex((other) => other.statement === item.statement) === index)
    .slice(0, 6);
}

export function resolvePrimaryTrackFromConclusions(conclusions: ReportConclusion[]): LearningTrackKey {
  if (!conclusions.length) return 'intro';
  return conclusions[0]?.trackKey || 'intro';
}