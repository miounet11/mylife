/**
 * 人生数据底座 → LLM / 老师上下文
 * 短、结构化、可拼进 system / user 旁路，不替代引擎真值。
 */

import { buildLifeFoundation } from '@/lib/life-foundation/build';
import { buildAstroFromBirth, buildTaisuiLines } from '@/lib/life-foundation/zodiac';
import type { LifeFoundationSnapshot } from '@/lib/life-foundation/types';
import { PROFILE_SUPPLEMENT_DOMAINS, type SupplementDomain } from '@/lib/profile-settings-types';

export type FoundationPromptBundle = {
  overall: number;
  gradeLabel: string;
  lines: string[];
  /** 单段文本，适合 tacitSummary */
  block: string;
  /** 更短的个性化一句 */
  personalNote: string;
  foundation: LifeFoundationSnapshot;
};

const MAX_LINES = 14;

/** re-export：服务端与测试可从 prompt-context 或 zodiac 引用 */
export { buildTaisuiLines };

export function formatFoundationSnapshotLines(foundation: LifeFoundationSnapshot): string[] {
  const lines: string[] = [];
  lines.push(`【数据底座】完整度 ${foundation.overall}%（${foundation.gradeLabel}）`);

  if (foundation.fortuneName) {
    lines.push(`档案：${foundation.fortuneName}${foundation.hasReport ? ' · 已有结构报告' : ' · 尚无报告'}`);
  }

  // Birth layer values
  const birth = foundation.layers.find((l) => l.id === 'birth');
  if (birth) {
    const bits = birth.items
      .filter((i) => i.valueSummary && i.score > 0)
      .map((i) => `${i.label}=${i.valueSummary}`)
      .slice(0, 5);
    if (bits.length) lines.push(`生辰：${bits.join('；')}`);
  }

  // Astro
  const a = foundation.astro;
  if (a.sunSign || a.chineseZodiac) {
    const parts = [
      a.sunSign ? `太阳${a.sunSign}` : null,
      a.chineseZodiac ? `生肖${a.chineseZodiac}` : null,
      a.moonSign ? `月${a.moonSign}` : null,
      a.risingSign ? `升${a.risingSign}` : null,
      a.element ? `${a.element}象` : null,
    ].filter(Boolean);
    lines.push(`星盘：${parts.join(' · ')}`);
  }

  // Body
  const body = foundation.layers.find((l) => l.id === 'body');
  if (body) {
    const done = body.items.filter((i) => i.status === 'done');
    if (done.length) {
      lines.push(
        `体貌观测：${done.map((i) => `${i.label}${i.valueSummary ? `(${i.valueSummary})` : ''}`).join('；')}`,
      );
    }
  }

  // Life QA highlights
  const qa = foundation.layers.find((l) => l.id === 'life_qa');
  if (qa) {
    for (const item of qa.items) {
      if (item.id === 'qa_wizard' || !item.valueSummary || item.score < 20) continue;
      lines.push(`${item.label}：${item.valueSummary}`);
      if (lines.length >= MAX_LINES - 2) break;
    }
  }

  // Interaction / tools stats
  if (foundation.stats.eventCount > 0 || foundation.stats.toolRunCount > 0) {
    lines.push(
      `互动：事件 ${foundation.stats.eventCount} · 工具 ${foundation.stats.toolRunCount} · 对话补全 ${foundation.stats.chatProgressiveCount}`,
    );
  }

  // Next gap (one line) — helps model know what's missing
  const next = foundation.nextSteps[0];
  if (next && foundation.overall < 85) {
    lines.push(`底座缺口：${next.title}（${next.reason}）`);
  }

  return lines.slice(0, MAX_LINES);
}

export function buildFoundationPromptBundle(
  userId: string,
  fortuneId?: string | null,
): FoundationPromptBundle | null {
  try {
    const foundation = buildLifeFoundation(userId, fortuneId);
    const lines = formatFoundationSnapshotLines(foundation);

    // Enrich with taisui if birth available
    const birthDate = foundation.layers
      .find((l) => l.id === 'birth')
      ?.items.find((i) => i.id === 'birth_date')?.valueSummary;
    const taisui = buildTaisuiLines(birthDate || null);
    for (const t of taisui) {
      if (lines.length < MAX_LINES) lines.push(t);
    }

    const personalBits: string[] = [];
    if (foundation.astro.sunSign) personalBits.push(`太阳${foundation.astro.sunSign}`);
    if (foundation.astro.chineseZodiac) personalBits.push(`${foundation.astro.chineseZodiac}肖`);
    const concernItem = foundation.layers
      .find((l) => l.id === 'life_qa')
      ?.items.find((i) => i.id === 'qa_goals' || i.label.includes('目标') || i.label.includes('困惑'));
    // goals domain value
    const goalsLayer = foundation.layers.find((l) => l.id === 'life_qa');
    const goalsVal = goalsLayer?.items.find((i) => i.id === 'qa_goals')?.valueSummary;
    if (goalsVal) personalBits.push(goalsVal.split('·')[0]?.trim() || goalsVal);

    return {
      overall: foundation.overall,
      gradeLabel: foundation.gradeLabel,
      lines,
      block: lines.join('\n'),
      personalNote: personalBits.slice(0, 3).join(' · ') || foundation.gradeLabel,
      foundation,
    };
  } catch (e) {
    console.warn('[foundation] prompt bundle failed', e);
    return null;
  }
}

/** 将 supplements map 压成老师可读短行（含 astro / body） */
export function supplementMapToPromptLines(
  domains: Record<string, Record<string, string>>,
  maxLines = 10,
): string[] {
  const order: SupplementDomain[] = [
    'astro',
    'body',
    'goals',
    'career',
    'relationship',
    'residence',
    'wealth',
    'health',
  ];
  const lines: string[] = [];
  for (const domain of order) {
    const fields = domains[domain];
    if (!fields) continue;
    const def = PROFILE_SUPPLEMENT_DOMAINS[domain];
    if (!def) continue;
    const parts = Object.entries(fields)
      .filter(([, v]) => `${v || ''}`.trim())
      .map(([k, v]) => {
        const label = def.fields.find((f) => f.key === k)?.label || k;
        return `${label}=${v}`;
      });
    if (parts.length) {
      lines.push(`${def.label}：${parts.join('；')}`);
    }
    if (lines.length >= maxLines) break;
  }
  return lines;
}

/**
 * 从生日快速补星座行（无完整 foundation 时）
 */
export function quickAstroPromptLines(birthDate: string | null | undefined): string[] {
  if (!birthDate) return [];
  const a = buildAstroFromBirth(birthDate);
  const lines: string[] = [];
  if (a.sunSign) {
    lines.push(
      `太阳星座：${a.sunSign}${a.element ? `（${a.element}象）` : ''}${a.modality ? ` · ${a.modality}` : ''}`,
    );
  }
  if (a.chineseZodiac) lines.push(`生肖：${a.chineseZodiac}`);
  lines.push(...buildTaisuiLines(birthDate));
  return lines;
}
