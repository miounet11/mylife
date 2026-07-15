import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import type { TimingPoint } from './types';
import {
  type NarratorOutput,
  TIMING_NARRATOR_SYSTEM_EN,
  fallbackNarrate,
  withBilingualUserCopy,
} from './user-copy-i18n';

// re-export for callers that imported fallbackNarrate from this module
export { fallbackNarrate, withBilingualUserCopy };
export type { NarratorOutput };

const TIMING_NARRATOR_SYSTEM = `你是一个把命理时点翻译成生活语言的助手。

硬规则（违反会被拒绝）：
1. 禁用术语：用神/喜神/忌神/十神/正财/偏财/七杀/食神/比肩/劫财/伤官/正印/偏印/调候/通关。
2. 干支可以保留作为时间标记，例如"丙午年（2026）"，但不要堆砌"地支相冲""天干相合"等术语。
3. 时间锚点必须给到周-级（如"5月中下旬"），不要"未来某段时间"。
4. 必须给"该做"和"该避"两个具体行动建议（合计 2-4 条），不要"注意身体""保持稳定"这种空话。
5. summary 一句话 ≤ 60 字，不要发挥成段落。
6. title 5-12 字，简洁有力。

只输出 JSON：
{
  "title": "<5-12字标题>",
  "summary": "<一句话 60 字内>",
  "todoSuggestions": ["<具体动作 1>", "<具体动作 2>"],
  "avoidSuggestions": ["<具体回避 1>", "<具体回避 2>"]
}`;

function normalizeNarrator(result: NarratorOutput | null): NarratorOutput | null {
  if (!result || !result.title || !result.summary) return null;
  return {
    title: result.title,
    summary: result.summary,
    todoSuggestions: Array.isArray(result.todoSuggestions) ? result.todoSuggestions.slice(0, 3) : [],
    avoidSuggestions: Array.isArray(result.avoidSuggestions) ? result.avoidSuggestions.slice(0, 3) : [],
  };
}

export async function narrateTimingPoint(
  point: TimingPoint,
  locale: 'zh-CN' | 'en' = 'zh-CN'
): Promise<NarratorOutput | null> {
  const system = locale === 'en' ? TIMING_NARRATOR_SYSTEM_EN : TIMING_NARRATOR_SYSTEM;
  const userPrompt = buildUserPrompt(point, locale);
  const result = await callJsonLLM<NarratorOutput>({
    system,
    user: userPrompt,
    temperature: 0.4,
    maxTokens: 280,
    timeoutMs: 18000,
    traceLabel: `timing-narrator:${locale}:${point.type}`,
    scope: 'content',
    reasoningEffort: 'low',
  });
  return normalizeNarrator(result);
}

function buildUserPrompt(point: TimingPoint, locale: 'zh-CN' | 'en'): string {
  const dateInfo = point.endDate
    ? locale === 'en'
      ? `Window: ${point.startDate} to ${point.endDate}`
      : `时间：${point.startDate} 至 ${point.endDate}`
    : locale === 'en'
      ? `Date: ${point.startDate}`
      : `时间：${point.startDate}`;

  if (locale === 'en') {
    return [
      `Timing type: ${point.type}`,
      `Severity: ${point.severity}`,
      dateInfo,
      `Structural basis (Chinese engine): ${point.rawReason}`,
      `Context: ${JSON.stringify(point.context)}`,
      '',
      'Rewrite into plain English life language: how the user will feel, what to do, what to avoid.',
      'Do not dump jargon. Keep engine facts consistent (same window, same severity intent).',
    ].join('\n');
  }

  return [
    `命理时点类型：${point.type}`,
    `严重程度：${point.severity}`,
    dateInfo,
    `命理依据：${point.rawReason}`,
    `上下文：${JSON.stringify(point.context)}`,
    '',
    '请把以上命理依据翻译成"未来这段时间，你会怎样"的生活语言。'
      + '不要 paraphrase 命理依据，要写"用户层面会怎么感受/可以怎么做/该避什么"。',
  ].join('\n');
}

/**
 * Generate bilingual userCopy (zh + en) for a list of points.
 * LLM preferred; fallback templates always fill both languages.
 */
export async function narrateTimingPoints(points: TimingPoint[]): Promise<TimingPoint[]> {
  if (points.length === 0) return points;
  const concurrency = 3;
  const result: TimingPoint[] = new Array(points.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= points.length) break;
      const point = points[idx];
      try {
        const [zh, en] = await Promise.all([
          narrateTimingPoint(point, 'zh-CN'),
          narrateTimingPoint(point, 'en'),
        ]);
        result[idx] = {
          ...point,
          userCopy: zh || fallbackNarrate(point, 'zh-CN'),
          userCopyEn: en || fallbackNarrate(point, 'en'),
        };
      } catch {
        result[idx] = withBilingualUserCopy(point);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return result;
}

/** Sync bilingual fallback only (used at resolve/cache write). */
export function attachFallbackUserCopy(points: TimingPoint[]): TimingPoint[] {
  return points.map((p) => withBilingualUserCopy(p));
}
