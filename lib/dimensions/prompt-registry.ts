import type { DimensionSlug } from './types';
import { ENGINE_HARD_CONTRACT } from '@/lib/ground-truth/hard-contract';

export interface DimensionPromptContext {
  slug: DimensionSlug;
  title: string;
  question: string;
  disclaimer?: string;
  dayMaster?: string;
  yongShen?: string[];
  xiShen?: string[];
  jiShen?: string[];
  name?: string;
  gender?: string;
  /** 可选：LOCKED 字面块（日主/用神/大运/锚点年） */
  lockedFactsBlock?: string;
  currentDayun?: string;
  pattern?: string;
}

const SHARED_SYSTEM = [
  '你是「人生K线」十维度研判的文案润色师。引擎已给出结构化结论，你的任务是把每条 bullet 改写成更自然、连贯、有温度的中文，方便用户阅读与行动。',
  '',
  ENGINE_HARD_CONTRACT,
  '',
  '硬性约束（违反则视为失败）：',
  '1. 不得篡改引擎事实：年份、日期、分数、百分比、五行名称、行业/资产名称、日主、用神/忌神、大运干支等必须原样保留',
  '2. 不得新增引擎未给出的具体预测、收益承诺、医疗诊断或投资建议',
  '3. 每条 items 数量必须与输入一致，顺序不变',
  '4. section 的 key 必须与输入一致，不要增删 section',
  '5. 语气务实、尊重用户自主，避免宿命论与恐吓式表达',
  '6. 仅输出合法 JSON，不要 markdown 围栏或额外说明',
  '7. predictions 若输出，必须覆盖输入中全部 index（0..n-1），且不得改 dueDate/window 语义',
  '8. 禁止出现：收益率、稳赚、保本、翻倍、必涨、保证收益、确诊、处方、治愈',
  '9. 不得把忌神说成主用方向；不得新造大运干支或 K 线锚点年',
].join('\n');

const OUTPUT_SCHEMA = [
  '输出 JSON 结构：',
  '{',
  '  "sections": [{ "key": "与输入相同", "items": ["润色后的条目，数量与输入一致"] }],',
  '  "narrativeSummary": "可选，80字以内的一句话总览",',
  '  "predictions": [{ "index": 0, "statement": "润色后的预测陈述，保留原日期/年份/分数" }]',
  '}',
  'P0 维度（fortune-rhythm / career-industry / investment）强烈建议输出完整 predictions 数组；',
  'index 对应输入 predictions 下标，statement 须保留原条目的时间、数字与专有名词。',
].join('\n');

const SLUG_HINTS: Partial<Record<DimensionSlug, string>> = {
  'fortune-rhythm':
    'P0：强调阶段（抬升/收敛/震荡）、四线强弱与可验证小动作；保留分数与年份。',
  'career-industry':
    'P0：强调行业匹配理由与跳槽节奏，避免“必须转行”式绝对化；保留行业名与匹配分。',
  investment:
    'P0：强调节奏与仓位骨架，反复点明「非投资建议」；禁止任何收益率/保本措辞。',
  naming: '侧重五行补益与字义方向，不承诺改名效果。',
  health: '强调生活方式与调养节奏，明确非医学诊断。',
  'study-career': '侧重学科方向与备考节奏，鼓励可执行的小步计划。',
  marriage: '侧重关系节奏与沟通，避免绝对化姻缘断语。',
  partnership: '侧重合作对象画像与协作节奏，保持中性务实。',
  'living-environment': '侧重方位五行与居住能量，给出可操作的布置建议。',
  'timing-selection': '侧重择日逻辑与窗口排序，保留具体日期。',
};

export function buildDimensionEnhancePrompt(
  context: DimensionPromptContext,
  engineJson: string,
): { system: string; user: string } {
  const hint = SLUG_HINTS[context.slug] || '保持与维度主题一致，突出可执行建议。';

  const profileLines = [
    context.dayMaster ? `日主：${context.dayMaster}` : '',
    context.pattern ? `格局：${context.pattern}` : '',
    context.yongShen?.length ? `用神：${context.yongShen.join('、')}` : '',
    context.xiShen?.length ? `喜神：${context.xiShen.join('、')}` : '',
    context.jiShen?.length ? `忌神：${context.jiShen.join('、')}` : '',
    context.currentDayun ? `当前大运：${context.currentDayun}` : '',
    context.name ? `姓名：${context.name}` : '',
    context.gender ? `性别：${context.gender === 'male' ? '男' : '女'}` : '',
  ].filter(Boolean);

  const user = [
    `维度：${context.title}（${context.slug}）`,
    `用户问题：${context.question}`,
    `润色侧重：${hint}`,
    context.disclaimer ? `免责声明（勿改写或弱化）：${context.disclaimer}` : '',
    profileLines.length ? `命盘摘要：\n${profileLines.join('\n')}` : '',
    context.lockedFactsBlock
      ? `【LOCKED_ENGINE_FACTS · 输出中须保留字面】\n${context.lockedFactsBlock}`
      : '',
    '',
    '以下是引擎输出的 JSON，请润色 sections[].items 与可选的 predictions[].statement：',
    engineJson,
    '',
    OUTPUT_SCHEMA,
  ].filter(Boolean).join('\n');

  return { system: SHARED_SYSTEM, user };
}