/**
 * Fixed LLM lenses for personal almanac (星座站式固定入口，不开放自由 prompt).
 */

import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';
import type { UserChartSnapshot } from '@/lib/almanac/resolve-user-chart';

export type AlmanacLensId = 'overview' | 'career' | 'relation' | 'caution' | 'hours';

export type AlmanacLensDef = {
  id: AlmanacLensId;
  title: string;
  subtitle: string;
  icon: string;
  /** Short chip for UI */
  chip: string;
};

export const ALMANAC_LENSES: AlmanacLensDef[] = [
  {
    id: 'overview',
    title: '今日总览',
    subtitle: '一句话主基调 + 三件今日可做/慎做',
    icon: '◎',
    chip: '总览',
  },
  {
    id: 'career',
    title: '事业节奏',
    subtitle: '推进 / 协作 / 曝光相关窗口',
    icon: '業',
    chip: '事业',
  },
  {
    id: 'relation',
    title: '关系沟通',
    subtitle: '表达、边界与相处节奏',
    icon: '緣',
    chip: '关系',
  },
  {
    id: 'caution',
    title: '避险清单',
    subtitle: '今天最该降规格的动作',
    icon: '慎',
    chip: '避险',
  },
  {
    id: 'hours',
    title: '时辰用法',
    subtitle: '较顺时段怎么用、慎用时段怎么避',
    icon: '時',
    chip: '时辰',
  },
];

export function getAlmanacLens(id: string): AlmanacLensDef | null {
  return ALMANAC_LENSES.find((l) => l.id === id) || null;
}

export type AlmanacLensResult = {
  lensId: AlmanacLensId;
  title: string;
  mood: string;
  paragraphs: string[];
  bullets: string[];
  closing: string;
};

export function buildAlmanacLensPrompts(input: {
  lens: AlmanacLensDef;
  pack: AlmanacDayPack;
  personal: PersonalDayOverlay | null;
  chart: UserChartSnapshot | null;
}): { system: string; user: string } {
  const { lens, pack, personal, chart } = input;

  const system = [
    '你是人生K线「个人黄历」顾问，文风接近优质星座日运：清晰、有画面感、可执行，但不恐吓、不宿命。',
    '输出严格 JSON：',
    '{"mood":"4-8字情绪基调","paragraphs":["2-3段叙述，每段40-80字"],"bullets":["3-5条要点"],"closing":"一句收束鼓励或边界"}',
    '硬约束：',
    '1) 必须使用用户日主/流日/通书信息，不得编造四柱。',
    '2) 禁止「大吉大凶」「必成/必败」「破财伤病」恐吓语。',
    '3) 用推进/观望/守成、验证、边界等语言。',
    '4) 不构成投资、医疗、法律建议。',
    '5) 中文简体。',
  ].join('\n');

  const user = [
    `镜头：${lens.id} · ${lens.title}`,
    `镜头目标：${lens.subtitle}`,
    '',
    `[通书 ${pack.date}]`,
    `日柱 ${pack.lunar.dayGanZhi} · 农历${pack.lunar.lunarText} · ${pack.weekdayLabel}`,
    pack.jieQi ? `节气 ${pack.jieQi}` : '',
    `宜：${pack.yi.slice(0, 8).join('、') || '—'}`,
    `忌：${pack.ji.slice(0, 6).join('、') || '—'}`,
    `冲煞：${pack.chong || '—'} · 煞${pack.sha || '—'}`,
    `黄道时：${pack.hours.filter((h) => h.luck === 'auspicious').map((h) => `${h.timeLabel}${h.ganZhi}`).join('、') || '—'}`,
    '',
    chart
      ? `[命盘] 日主 ${chart.dayMaster}${chart.dayBranch || ''} · 用神 ${(chart.yongShen || []).join('') || '未标'} · ${chart.strengthDesc || ''} · ${chart.analysisSnippet || ''}`
      : '[命盘] 未绑定，仅按通书写公共节奏（提醒用户绑定生辰）',
    personal
      ? `[结构日运] 分数 ${personal.score} · ${personal.stance} · ${personal.headline}\n可借力：${personal.favors.join('；')}\n宜注意：${personal.watchouts.join('；')}`
      : '[结构日运] 无',
    '',
    '请按镜头目标写当日个人黄历叙述。',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}

/** Deterministic fallback when LLM unavailable */
export function buildAlmanacLensFallback(input: {
  lens: AlmanacLensDef;
  pack: AlmanacDayPack;
  personal: PersonalDayOverlay | null;
}): AlmanacLensResult {
  const { lens, pack, personal } = input;
  const stance =
    personal?.stance === 'push'
      ? '宜小步验证'
      : personal?.stance === 'conserve'
        ? '宜守成复核'
        : '宜稳节奏';
  const mood =
    personal?.stance === 'push' ? '轻盈可试' : personal?.stance === 'conserve' ? '沉稳守界' : '平和安顿';

  const baseParas = [
    `${pack.date}，流日${pack.lunar.dayGanZhi}。通书宜「${pack.yi.slice(0, 3).join('、') || '从简'}」，忌「${pack.ji.slice(0, 2).join('、') || '过激'}」。${stance}。`,
    personal
      ? `对你日主${personal.dayMaster}而言，今日结构匹配约 ${personal.score} 分：${personal.headline.replace(/^今日结构倾向：/, '')}。`
      : '尚未绑定命盘时，先把通书当公共天气；绑定生辰后可看到专属日运与时辰排序。',
  ];

  const bulletsByLens: Record<AlmanacLensId, string[]> = {
    overview: [
      `主基调：${stance}`,
      personal?.topHours[0] ? `可借力时段：${personal.topHours[0].timeLabel}` : `黄道参考：优先黄道时办事`,
      pack.chong ? `注意冲煞：${pack.chong}` : '冲煞不明显，仍避免临时大决定',
      '写下一件 30 分钟内可完成的验证动作',
    ],
    career: [
      stance === '宜小步验证' ? '适合推进已准备好的事项，不适合临时开大题' : '会议与交付以「说清楚边界」为主',
      `通书与事业相关宜项：${pack.yi.filter((x) => /开市|交易|赴任|会友|见贵/.test(x)).slice(0, 2).join('、') || '无强相关，偏整理'}`,
      personal?.avoidHours[0] ? `慎用：${personal.avoidHours[0].timeLabel}` : '黑道时减少硬谈判',
    ],
    relation: [
      '沟通先复述对方重点，再给结论',
      pack.ji.some((j) => /嫁娶|词讼/.test(j)) ? '通书对契约/争辩偏慎，重要关系议题可改期' : '适合澄清期待，不适合翻旧账',
      '设一个「今晚只聊一件事」的边界',
    ],
    caution: [
      ...(personal?.watchouts.slice(0, 2) || ['避免一次押注式决定']),
      pack.ji[0] ? `通书忌：${pack.ji[0]}` : '忌冲动消费与口头承诺',
      '大额/长约/公开对线一律二次确认',
    ],
    hours: [
      ...(personal?.topHours.slice(0, 2).map((h) => `较顺：${h.timeLabel} ${h.ganZhi}（${h.reason}）`) ||
        pack.hours.filter((h) => h.luck === 'auspicious').slice(0, 2).map((h) => `黄道：${h.timeLabel} ${h.ganZhi}`)),
      ...(personal?.avoidHours.slice(0, 1).map((h) => `慎用：${h.timeLabel}（${h.reason}）`) ||
        pack.hours.filter((h) => h.luck === 'inauspicious').slice(0, 1).map((h) => `黑道慎用：${h.timeLabel}`)),
      '时辰交界前后 15 分钟留白',
    ],
  };

  return {
    lensId: lens.id,
    title: lens.title,
    mood,
    paragraphs: baseParas,
    bullets: bulletsByLens[lens.id] || bulletsByLens.overview,
    closing: '黄历是天气，结构是你的船——今天只做一件可复盘的事就够。',
  };
}
