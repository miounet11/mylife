/**
 * World Yi interpretive engine.
 * Does not recompute 日主/用神. Reads natal facts and era environment,
 * then emits the six-layer World Yi reading shown beside 易学.
 */

import type { FortuneAnalysisResult } from '@/lib/user-types';
import { buildEraEnvironmentSnapshot } from '@/lib/world-yi-era-snapshot';
import { WORLD_YI_MOTHER_TONGUE } from '@/lib/world-yi-architecture';
import { resolveYongShenPresentation, type YongShenPresentation } from '@/lib/yongshen-live';

export const WORLD_YI_ENGINE_VERSION = 'world-yi-interpret-v2';

export type WorldYiEngineLooseInput = {
  dayMaster?: string;
  yongShen?: unknown;
  pattern?: unknown;
  tenGods?: FortuneAnalysisResult['tenGods'];
  pillars?: unknown;
  fortune?: Partial<FortuneAnalysisResult['fortune']>;
  dayun?: unknown;
  analysis?: Partial<FortuneAnalysisResult['analysis']>;
  advice?: Partial<FortuneAnalysisResult['advice']>;
};

function asYongShenBlob(value: unknown): FortuneAnalysisResult['yongShen'] {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  return {
    dayMaster: `${row.dayMaster || ''}`.trim() || undefined,
    dayMasterElement: `${row.dayMasterElement || ''}`.trim() || undefined,
    strength: `${row.strength || ''}`.trim() || undefined,
    strengthDesc: `${row.strengthDesc || ''}`.trim() || undefined,
    yongShen: Array.isArray(row.yongShen) ? (row.yongShen as string[]) : undefined,
    xiShen: Array.isArray(row.xiShen) ? (row.xiShen as string[]) : undefined,
    jiShen: Array.isArray(row.jiShen) ? (row.jiShen as string[]) : undefined,
    analysis: `${row.analysis || ''}`.trim() || undefined,
  };
}

function patternFromLoose(value: unknown): FortuneAnalysisResult['pattern'] {
  if (typeof value === 'string' && value.trim()) {
    return { type: value.trim(), strength: '', quality: '', description: value.trim() };
  }
  const row = (value || {}) as Record<string, unknown>;
  const type = `${row.type || row.pattern || row.name || ''}`.trim();
  return {
    type,
    strength: `${row.strength || ''}`.trim(),
    quality: `${row.quality || ''}`.trim(),
    description: `${row.description || type}`.trim(),
  };
}

function dayunLabel(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  const current = (row.currentDayun || row.current || {}) as Record<string, unknown>;
  return `${current.ganZhi || current.ganzhi || row.ganZhi || ''}`.trim();
}

export function fortuneLikeFromLoose(input: WorldYiEngineLooseInput): FortuneAnalysisResult {
  const ys = asYongShenBlob(input.yongShen);
  const pattern = patternFromLoose(input.pattern);
  const dayun = dayunLabel(input.dayun);
  return {
    basic: {
      dayMaster: input.dayMaster || ys?.dayMaster || '',
      pillars: Array.isArray(input.pillars) ? (input.pillars as FortuneAnalysisResult['basic']['pillars']) : [],
    },
    yongShen: ys,
    fiveElements: {} as FortuneAnalysisResult['fiveElements'],
    tenGods: input.tenGods || { self: '', output: [], input: [], control: [], controlled: [] },
    pattern,
    fortune: {
      currentDaYun: input.fortune?.currentDaYun || dayun,
      currentLiuNian: input.fortune?.currentLiuNian || '',
      interaction: input.fortune?.interaction || '',
      nextYear: input.fortune?.nextYear || '',
      trend: input.fortune?.trend,
    },
    advice: (input.advice || {
      career: {} as FortuneAnalysisResult['advice']['career'],
      wealth: {} as FortuneAnalysisResult['advice']['wealth'],
      marriage: {} as FortuneAnalysisResult['advice']['marriage'],
      health: {} as FortuneAnalysisResult['advice']['health'],
      colors: [],
      directions: [],
      timing: [],
      yongShen: ys?.yongShen,
      jiShen: ys?.jiShen,
    }) as FortuneAnalysisResult['advice'],
    evidence: { statistics: {} as FortuneAnalysisResult['evidence']['statistics'], celebrities: [], similarCases: [] },
    analysis: {
      opening: `${input.analysis?.opening || ''}`,
      explanation: `${input.analysis?.explanation || ''}`,
    },
  } as FortuneAnalysisResult;
}

export function runWorldYiEngineFromLoose(input: WorldYiEngineLooseInput, year?: number): WorldYiEngineReading {
  return runWorldYiEngine(fortuneLikeFromLoose(input), year);
}

/** Compact prompt block so chat / agents cite the same engine output. */
export function formatWorldYiEnginePrompt(reading: WorldYiEngineReading): string {
  const y = reading.yixue;
  const layers = reading.layers.map((layer) => `${layer.name}：${layer.headline}。${layer.body}`).join('\n');
  return [
    `【世界易引擎 · ${reading.version}】`,
    `发挥偏「${reading.playType}」· ${reading.stage}期`,
    `易学事实：日主 ${y.dayMaster || '—'} · 强弱 ${y.strengthDesc || y.strength || '—'} · 格局 ${y.pattern || '—'} · 用神 ${(y.yongShen || []).join('、') || '—'} · 忌神 ${(y.jiShen || []).join('、') || '—'} · 大运 ${y.dayun || '—'} · 流年 ${y.liunian || '—'}`,
    layers,
    reading.refuse,
    '对话时引用这套判断语言，不得改写日主/扶抑用神。调候单独说。',
  ].join('\n');
}

/** Two charts, one environment — World Yi pair note for 合婚. */
export function worldYiPairNote(left: WorldYiEngineReading, right: WorldYiEngineReading): string {
  const sameStage = left.stage === right.stage;
  const stageLine = sameStage
    ? `双方都在「${left.stage}」期：共同动作要对齐这个阶段，不要一方抬升、一方硬守。`
    : `一方「${left.stage}」、一方「${right.stage}」：先对齐进退顺序，再谈承诺。`;
  return `两个出厂设置（${left.playType} × ${right.playType}）共一块硬约束。${stageLine}世界易不把合婚写成吉凶，只写结构是否匹配、阶段是否同向、环境是否付得起。`;
}

export type WorldYiPlayType = '建设' | '表达' | '协调' | '收敛';
export type WorldYiStage = '抬升' | '收敛' | '过渡';

export type WorldYiEngineLayer = {
  id: 'structure' | 'timing' | 'environment' | 'action' | 'risk' | 'review';
  name: string;
  headline: string;
  body: string;
};

export type WorldYiYixueFacts = {
  dayMaster: string;
  strength: string;
  strengthDesc: string;
  pattern: string;
  yongShen: string[];
  jiShen: string[];
  tiaohuoNote?: string;
  dayun: string;
  liunian: string;
};

export type WorldYiEngineReading = {
  version: string;
  playType: WorldYiPlayType;
  stage: WorldYiStage;
  yixue: WorldYiYixueFacts;
  layers: WorldYiEngineLayer[];
  motherTongue: string;
  refuse: string;
  methodologyHref: string;
};

function textOf(...parts: unknown[]): string {
  return parts
    .flatMap((p) => (Array.isArray(p) ? p : [p]))
    .map((p) => `${p || ''}`.trim())
    .filter(Boolean)
    .join(' ');
}

function inferPlayType(ys: YongShenPresentation | null, result: FortuneAnalysisResult): WorldYiPlayType {
  const blob = textOf(
    ys?.strength,
    ys?.strengthDesc,
    ys?.analysis,
    result.pattern?.type,
    result.pattern?.description,
    result.tenGods?.input,
    result.tenGods?.output,
    result.tenGods?.control,
    result.tenGods?.controlled,
  );
  const weak = /弱|不及|偏弱/.test(blob);
  const strong = /旺|太过|偏旺|身强/.test(blob);
  if (/食神|伤官|表达|输出/.test(blob) && !/收敛/.test(blob)) return '表达';
  if (/正印|偏印|建设|积累|得地/.test(blob) && weak) return '建设';
  if (/七杀|正官|收敛|克泄/.test(blob) && strong) return '收敛';
  if (/中和|平衡|财星|协调/.test(blob)) return '协调';
  if (weak) return '建设';
  if (strong) return '收敛';
  return '协调';
}

function inferStage(result: FortuneAnalysisResult): WorldYiStage {
  const blob = textOf(
    result.fortune?.trend,
    result.fortune?.currentDaYun,
    result.fortune?.currentLiuNian,
    result.fortune?.interaction,
    result.pattern?.strength,
  );
  if (/收|守|退|藏|衰|冬|休息/.test(blob) && !/升|开运/.test(blob)) return '收敛';
  if (/升|旺|开|进|扬|布局|突破/.test(blob)) return '抬升';
  return '过渡';
}

function playHint(play: WorldYiPlayType): string {
  if (play === '建设') return '擅长积累与落地。抬升期做验证，不要一上来就全面扩张。';
  if (play === '表达') return '擅长连接与传播。把可见输出做成 30 天验证，而不是空转热度。';
  if (play === '收敛') return '擅长复盘与守成。先减负荷、清库存，再谈新开。';
  return '擅长整合与平衡。动作颗粒度要小，让两边约束都付得起。';
}

function stageHint(stage: WorldYiStage): string {
  if (stage === '抬升') return '抬升期：验证与布局，允许试错，方向对即可。';
  if (stage === '收敛') return '收敛期：清理、守成、修复。硬扩张是错位。';
  return '过渡期：先写清 90 天窗口，只做低后悔的验证，不一次押死。';
}

export function runWorldYiEngine(result: FortuneAnalysisResult, year?: number): WorldYiEngineReading {
  const ys = resolveYongShenPresentation(result);
  const playType = inferPlayType(ys, result);
  const stage = inferStage(result);
  const era = buildEraEnvironmentSnapshot(year);
  const dayMaster = ys?.live?.dayMaster || result.yongShen?.dayMaster || result.basic?.dayMaster || '';
  const yixue: WorldYiYixueFacts = {
    dayMaster,
    strength: ys?.strength || result.yongShen?.strength || result.pattern?.strength || '',
    strengthDesc: ys?.strengthDesc || result.yongShen?.strengthDesc || '',
    pattern: result.pattern?.type || '',
    yongShen: ys?.yongShen || result.yongShen?.yongShen || result.advice?.yongShen || [],
    jiShen: ys?.jiShen || result.yongShen?.jiShen || result.advice?.jiShen || [],
    tiaohuoNote: ys?.tiaohuoNote,
    dayun: result.fortune?.currentDaYun || '',
    liunian: result.fortune?.currentLiuNian || '',
  };

  const yong = yixue.yongShen.join('、') || '（按扶抑）';
  const ji = yixue.jiShen.join('、') || '高压侧';
  const action =
    ys?.actionHint ||
    (stage === '收敛' ? '本周只做一件清理或交接，不新开项目。' : '本周做一件可被别人看见的小验证。');

  const layers: WorldYiEngineLayer[] = [
    {
      id: 'structure',
      name: '结构',
      headline: `发挥偏「${playType}」`,
      body: `日主 ${dayMaster || '—'} · ${yixue.strengthDesc || yixue.strength || '结构待标注'}。主用神 ${yong}。${playHint(playType)}先问像不像，再问好不好。`,
    },
    {
      id: 'timing',
      name: '时位',
      headline: `${stage}期`,
      body: `${yixue.dayun || '当前大运'} · ${yixue.liunian || '当前流年'}。${stageHint(stage)}未兑现的能力或决定，按余气阶段看，不当成结局。`,
    },
    {
      id: 'environment',
      name: '环境',
      headline: `${era.year} 宏观天气 · ${era.phase.title}`,
      body: `${era.phaseNote} 城市、家庭、现金流付不起时，降维执行，不改日主。`,
    },
    {
      id: 'action',
      name: '动作',
      headline: '30 天可回访',
      body: `${action} 写入日历，30 天后只回看成没做成、反馈是什么。`,
    },
    {
      id: 'risk',
      name: '风险',
      headline: stage === '收敛' ? '防错位扩张' : '防把未兑现当成失败',
      body: `忌神侧 ${ji} 少硬刚。${ys?.tiaohuoNote ? `${ys.tiaohuoNote}。` : ''}不替代医疗、法律或具体投资标的。`,
    },
    {
      id: 'review',
      name: '复盘',
      headline: '用事实校正',
      body: '窗口有没有出现、动作有没有做、环境有没有改。错了改解释，不改历史，也不说「气没到」。',
    },
  ];

  return {
    version: WORLD_YI_ENGINE_VERSION,
    playType,
    stage,
    yixue,
    layers,
    motherTongue: WORLD_YI_MOTHER_TONGUE.join(''),
    refuse: '世界易不改写日主与扶抑用神；易学给事实，世界易给判断语言。',
    methodologyHref: '/knowledge/world-yi-methodology',
  };
}
