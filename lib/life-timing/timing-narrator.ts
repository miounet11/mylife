import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import type { TimingPoint } from './types';

interface NarratorOutput {
  title: string;
  summary: string;
  todoSuggestions: string[];
  avoidSuggestions: string[];
}

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

export async function narrateTimingPoint(point: TimingPoint): Promise<NarratorOutput | null> {
  const userPrompt = buildUserPrompt(point);
  const result = await callJsonLLM<NarratorOutput>({
    system: TIMING_NARRATOR_SYSTEM,
    user: userPrompt,
    temperature: 0.4,
    maxTokens: 250,
    timeoutMs: 18000,
    traceLabel: `timing-narrator:${point.type}`,
    scope: 'content',
    reasoningEffort: 'low',
  });
  if (!result) return null;
  if (!result.title || !result.summary) return null;
  return {
    title: result.title,
    summary: result.summary,
    todoSuggestions: Array.isArray(result.todoSuggestions) ? result.todoSuggestions.slice(0, 3) : [],
    avoidSuggestions: Array.isArray(result.avoidSuggestions) ? result.avoidSuggestions.slice(0, 3) : [],
  };
}

function buildUserPrompt(point: TimingPoint): string {
  const dateInfo = point.endDate ? `时间：${point.startDate} 至 ${point.endDate}` : `时间：${point.startDate}`;
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

/** 规则模板回退（LLM 失败时用） */
export function fallbackNarrate(point: TimingPoint): NarratorOutput {
  const presets = FALLBACK_PRESETS[point.type];
  if (presets) return presets;
  return {
    title: '留意这段时间',
    summary: point.rawReason.slice(0, 60),
    todoSuggestions: ['节奏放慢一档'],
    avoidSuggestions: ['不做大决定'],
  };
}

/** 给一组 TimingPoint 批量加 userCopy。失败的用 fallback 模板。 */
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
        const narrated = await narrateTimingPoint(point);
        result[idx] = { ...point, userCopy: narrated || fallbackNarrate(point) };
      } catch {
        result[idx] = { ...point, userCopy: fallbackNarrate(point) };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return result;
}

const FALLBACK_PRESETS: Partial<Record<TimingPoint['type'], NarratorOutput>> = {
  solar_term: {
    title: '节气过渡期',
    summary: '能量切换的 7 天，作息和情绪都更敏感。',
    todoSuggestions: ['早睡早起', '减少应酬'],
    avoidSuggestions: ['熬夜决策', '签长期合约'],
  },
  tai_sui_value: {
    title: '本命年',
    summary: '这一年命理上不宜大动，主守不主进。',
    todoSuggestions: ['专注现有事的稳定', '把扩张推到明年立春后'],
    avoidSuggestions: ['一次性押注', '高杠杆决策'],
  },
  tai_sui_clash: {
    title: '冲太岁年',
    summary: '今年容易遇到外部强冲击，节奏会被打乱。',
    todoSuggestions: ['留现金流缓冲', '减少长期承诺'],
    avoidSuggestions: ['硬扛对抗', '搬迁/换工作仓促决定'],
  },
  tai_sui_punish: {
    title: '刑太岁年',
    summary: '关系/合作上摩擦多，容易被牵连进麻烦。',
    todoSuggestions: ['合作前白纸黑字', '边界写清楚'],
    avoidSuggestions: ['替人担保', '介入他人纠纷'],
  },
  tai_sui_harm: {
    title: '害太岁年',
    summary: '隐性消耗多，容易"看似平稳但持续被吃掉"。',
    todoSuggestions: ['每月盘点开支与精力', '定期清理无效关系'],
    avoidSuggestions: ['碍于面子答应不情愿的事'],
  },
  tai_sui_break: {
    title: '破太岁年',
    summary: '变化频繁，但多为小波折非大事。',
    todoSuggestions: ['留弹性空间'],
    avoidSuggestions: ['硬定死时间表'],
  },
  dayun_transition: {
    title: '换大运',
    summary: '人生节奏从此切换 10 年，前 30 天最易做错决定。',
    todoSuggestions: ['先观察 1-2 个月再下大决定', '完成手上未结的事'],
    avoidSuggestions: ['立刻换赛道', '冲动结束当前阶段'],
  },
  sui_yun_bing_lin: {
    title: '岁运并临年',
    summary: '命理大忌，能量集中度极高，容易极端化。',
    todoSuggestions: ['一切重大决策延后 30 天再看', '加强健康监测'],
    avoidSuggestions: ['任何不可逆的承诺', '过度透支'],
  },
  liuyue_clash: {
    title: '变动月',
    summary: '这个月外部冲击多，节奏被打乱。',
    todoSuggestions: ['弹性安排日程'],
    avoidSuggestions: ['锁死的承诺'],
  },
  liuyue_fuyin: {
    title: '原局加倍月',
    summary: '原本就强的特质这个月会更明显，容易"用力过猛"。',
    todoSuggestions: ['有意识地慢一档'],
    avoidSuggestions: ['争对错', '硬碰硬'],
  },
  liuyue_combine: {
    title: '能量增强月',
    summary: '资源容易聚集，适合推进已经准备好的事。',
    todoSuggestions: ['集中精力推主线'],
    avoidSuggestions: ['同时开新摊子'],
  },
  liuyue_shensha_tianyi: {
    title: '贵人月',
    summary: '这个月关键时刻容易得到帮忙，主动开口求助有效。',
    todoSuggestions: ['主动联系可能给你建议的人'],
    avoidSuggestions: ['闷头硬抗'],
  },
  liuyue_shensha_wenchang: {
    title: '灵感月',
    summary: '学习、写作、表达类的事这个月特别顺。',
    todoSuggestions: ['集中输出', '写下重要思考'],
    avoidSuggestions: ['把这种月份用来做琐事'],
  },
  liuyue_shensha_taohua: {
    title: '社交活跃月',
    summary: '人际关系活跃，容易出现机会和诱惑。',
    todoSuggestions: ['多见人但留判断力'],
    avoidSuggestions: ['冲动承诺关系'],
  },
  liuyue_shensha_yima: {
    title: '变动月',
    summary: '可能涉及出差、搬迁、远行或环境改变。',
    todoSuggestions: ['提前预留弹性'],
    avoidSuggestions: ['这个月的长期承诺'],
  },
  liuyue_shensha_jiangxing: {
    title: '担当月',
    summary: '适合主导和担纲，能量足够支撑你站出来。',
    todoSuggestions: ['接下你犹豫的责任'],
    avoidSuggestions: ['继续躲在后面'],
  },
};
