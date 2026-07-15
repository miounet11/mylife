/**
 * 合婚 / 双盘对照 MVP
 * 三层：日柱（夫妻宫）· 用忌互补 · 相处提示
 * 不另起玄学体系，用干支生克合冲 + 用神列表。
 */

import {
  GAN_CHONG,
  GAN_HE,
  GAN_TO_WUXING,
  ZHI_CHONG,
  ZHI_HAI,
  ZHI_HE,
  ZHI_XING,
} from '@/lib/bazi-constants';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';

const WX_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 五行相生 */
const SHENG: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/** 五行相克 */
const KE: Record<string, string> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

export interface HehunPersonInput {
  name?: string;
  /** 日主天干 */
  dayMaster: string;
  /** 日支（夫妻宫） */
  dayBranch: string;
  /** 可选四柱干支 */
  pillars?: string[];
  yongShen?: string[];
  jiShen?: string[];
  gender?: string;
  /** 当前大运干支（可选，用于大运同步层） */
  currentDayunGanZhi?: string;
  /** 当前大运品质 excellent/good/neutral/bad/poor */
  currentDayunQuality?: string;
  /** 当前大运与用神匹配 good/neutral/bad */
  currentDayunYongMatch?: string;
  /** 当前大运起止年 */
  currentDayunYears?: string;
}

export interface HehunLayer {
  key: string;
  title: string;
  score: number;
  status: 'good' | 'ok' | 'caution';
  summary: string;
  details: string[];
}

export interface HehunResult {
  score: number;
  band: '宜深化' | '可经营' | '宜谨慎' | '高摩擦';
  headline: string;
  layers: HehunLayer[];
  doList: string[];
  avoidList: string[];
  plainForCouple: string;
  proNotes: string[];
  knowledgeStamp: string;
  personA: { name: string; dayPillar: string; dayun?: string };
  personB: { name: string; dayPillar: string; dayun?: string };
}

const ZHI_WX: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export function analyzeHehun(a: HehunPersonInput, b: HehunPersonInput): HehunResult {
  const nameA = (a.name || '甲方').trim() || '甲方';
  const nameB = (b.name || '乙方').trim() || '乙方';
  const dmA = (a.dayMaster || '').slice(0, 1);
  const dmB = (b.dayMaster || '').slice(0, 1);
  const brA = (a.dayBranch || '').slice(0, 1);
  const brB = (b.dayBranch || '').slice(0, 1);

  const dayStemLayer = scoreDayStem(dmA, dmB, nameA, nameB);
  const palaceLayer = scoreSpousePalace(brA, brB, nameA, nameB);
  const yongLayer = scoreYongComplement(a.yongShen || [], a.jiShen || [], b.yongShen || [], b.jiShen || [], nameA, nameB);
  const dayunLayer = scoreDayunSync(a, b, nameA, nameB);

  const hasDayun = Boolean(a.currentDayunGanZhi || b.currentDayunGanZhi);
  const score = hasDayun
    ? Math.round(
        dayStemLayer.score * 0.28 +
          palaceLayer.score * 0.32 +
          yongLayer.score * 0.22 +
          dayunLayer.score * 0.18
      )
    : Math.round(dayStemLayer.score * 0.35 + palaceLayer.score * 0.4 + yongLayer.score * 0.25);

  const layers = hasDayun
    ? [dayStemLayer, palaceLayer, yongLayer, dayunLayer]
    : [dayStemLayer, palaceLayer, yongLayer];

  const band = scoreBand(score);
  const headline = `${nameA} 与 ${nameB}：综合 ${score}/100 · ${band}`;

  const doList = unique([
    ...pickActions(dayStemLayer, palaceLayer, yongLayer, 'do'),
    ...pickDayunActions(dayunLayer, 'do'),
    '每月固定一次「无指责」对齐：时间、金钱、家人边界',
    '重大承诺选双方情绪稳定、非低谷窗口推进',
  ]).slice(0, 6);

  const avoidList = unique([
    ...pickActions(dayStemLayer, palaceLayer, yongLayer, 'avoid'),
    ...pickDayunActions(dayunLayer, 'avoid'),
    '避免用「合不合」替代具体沟通',
    '避免在一方高压运势窗口逼迫领证/分手二选一',
  ]).slice(0, 6);

  const plainLines = [
    `【合婚白话 · ${KNOWLEDGE_BASE.shortLabel}】`,
    `${headline}`,
    ``,
    `1）日主互动：${dayStemLayer.summary}`,
    `2）夫妻宫（日支）：${palaceLayer.summary}`,
    `3）用忌互补：${yongLayer.summary}`,
  ];
  if (hasDayun) {
    plainLines.push(`4）大运同步：${dayunLayer.summary}`);
  }
  plainLines.push(
    ``,
    `宜做：`,
    ...doList.map((x, i) => `  ${i + 1}. ${x}`),
    `慎做：`,
    ...avoidList.map((x, i) => `  ${i + 1}. ${x}`),
    ``,
    `说明：合婚用于相处与节奏参考，不替代双方现实选择与法律咨询。`
  );

  const weightNote = hasDayun
    ? '权重：日干 28% · 日支夫妻宫 32% · 用忌互补 22% · 大运同步 18%'
    : '权重：日干 35% · 日支夫妻宫 40% · 用忌互补 25%';

  return {
    score,
    band,
    headline,
    layers,
    doList,
    avoidList,
    plainForCouple: plainLines.join('\n'),
    proNotes: [
      `${nameA} 日柱 ${dmA}${brA} · 用 ${(a.yongShen || []).join('、') || '—'} · 忌 ${(a.jiShen || []).join('、') || '—'} · 大运 ${a.currentDayunGanZhi || '—'}`,
      `${nameB} 日柱 ${dmB}${brB} · 用 ${(b.yongShen || []).join('、') || '—'} · 忌 ${(b.jiShen || []).join('、') || '—'} · 大运 ${b.currentDayunGanZhi || '—'}`,
      weightNote,
      ...dayStemLayer.details.slice(0, 2),
      ...palaceLayer.details.slice(0, 2),
      ...(hasDayun ? dayunLayer.details.slice(0, 2) : []),
    ],
    knowledgeStamp: KNOWLEDGE_BASE.shortLabel,
    personA: {
      name: nameA,
      dayPillar: `${dmA}${brA}`,
      dayun: a.currentDayunGanZhi || undefined,
    },
    personB: {
      name: nameB,
      dayPillar: `${dmB}${brB}`,
      dayun: b.currentDayunGanZhi || undefined,
    },
  };
}

function scoreDayunSync(
  a: HehunPersonInput,
  b: HehunPersonInput,
  nameA: string,
  nameB: string
): HehunLayer {
  const dzA = (a.currentDayunGanZhi || '').trim();
  const dzB = (b.currentDayunGanZhi || '').trim();
  const details: string[] = [];
  let score = 55;

  if (!dzA && !dzB) {
    return {
      key: 'dayun',
      title: '大运同步',
      score: 55,
      status: 'ok',
      summary: '双方当前大运未提供，按中性处理；可从报告带入后重算。',
      details: ['补全双方当前大运后可看同步层'],
    };
  }

  if (dzA) details.push(`${nameA} 现行大运 ${dzA}${a.currentDayunYears ? `（${a.currentDayunYears}）` : ''}`);
  if (dzB) details.push(`${nameB} 现行大运 ${dzB}${b.currentDayunYears ? `（${b.currentDayunYears}）` : ''}`);

  // 双方大运品质
  const qA = (a.currentDayunQuality || '').toLowerCase();
  const qB = (b.currentDayunQuality || '').toLowerCase();
  const matchA = (a.currentDayunYongMatch || '').toLowerCase();
  const matchB = (b.currentDayunYongMatch || '').toLowerCase();

  if (qA === 'excellent' || qA === 'good') {
    score += 8;
    details.push(`${nameA} 大运偏顺（${qA || matchA || 'good'}），更适合主动规划共同事项`);
  } else if (qA === 'bad' || qA === 'poor') {
    score -= 8;
    details.push(`${nameA} 大运偏紧（${qA}），宜减外部扩张、先稳自身节奏`);
  }
  if (qB === 'excellent' || qB === 'good') {
    score += 8;
    details.push(`${nameB} 大运偏顺（${qB || matchB || 'good'}）`);
  } else if (qB === 'bad' || qB === 'poor') {
    score -= 8;
    details.push(`${nameB} 大运偏紧（${qB}）`);
  }

  // 大运干支生克合冲
  if (dzA.length >= 2 && dzB.length >= 2) {
    const gA = dzA[0]!;
    const gB = dzB[0]!;
    const zA = dzA[1]!;
    const zB = dzB[1]!;
    if (GAN_HE[gA] === gB) {
      score += 10;
      details.push(`大运天干合 ${gA}${gB}，外部节奏较易同向`);
    }
    if (GAN_CHONG[gA] === gB) {
      score -= 10;
      details.push(`大运天干冲 ${gA}${gB}，十年段目标感可能错位`);
    }
    if (ZHI_HE[zA] === zB) {
      score += 8;
      details.push(`大运地支合 ${zA}${zB}，生活场域更易咬合`);
    }
    if (ZHI_CHONG[zA] === zB) {
      score -= 10;
      details.push(`大运地支冲 ${zA}${zB}，迁移/家庭议题易反复`);
    }

    const wxA = WX_CN[GAN_TO_WUXING[gA] || ''] || ZHI_WX[zA] || '';
    const wxB = WX_CN[GAN_TO_WUXING[gB] || ''] || ZHI_WX[zB] || '';
    if (wxA && wxB) {
      if (SHENG[wxA] === wxB || SHENG[wxB] === wxA) {
        score += 6;
        details.push(`大运五行相生（${wxA}–${wxB}），可互相借力`);
      } else if (KE[wxA] === wxB || KE[wxB] === wxA) {
        score -= 6;
        details.push(`大运五行相克（${wxA}–${wxB}），决策时宜错峰`);
      }
    }
  } else if (dzA && !dzB) {
    details.push(`${nameB} 大运未提供，仅按 ${nameA} 现行运局参考`);
  } else if (dzB && !dzA) {
    details.push(`${nameA} 大运未提供，仅按 ${nameB} 现行运局参考`);
  }

  // 双方同时偏顺或同时偏紧 → 同步感
  const bothGood =
    (qA === 'excellent' || qA === 'good' || matchA === 'good') &&
    (qB === 'excellent' || qB === 'good' || matchB === 'good');
  const bothTight =
    (qA === 'bad' || qA === 'poor' || matchA === 'bad') &&
    (qB === 'bad' || qB === 'poor' || matchB === 'bad');
  if (bothGood) {
    score += 6;
    details.push('双方大运同处偏顺段，适合共同推进中长期规划');
  }
  if (bothTight) {
    score -= 4;
    details.push('双方大运同处偏紧段，宜共同防守、减少硬承诺');
  }

  score = clamp(score);
  return {
    key: 'dayun',
    title: '大运同步',
    score,
    status: statusOf(score),
    summary: details[0] || '大运信息有限，以日柱与用忌为主。',
    details: details.length ? details : ['大运同步层待补全'],
  };
}

function pickDayunActions(dayun: HehunLayer, kind: 'do' | 'avoid'): string[] {
  if (dayun.key !== 'dayun') return [];
  if (kind === 'do') {
    if (dayun.status === 'good') return ['双方大运偏顺时，可共同推进购房/婚约/合伙等中长期事项'];
    if (dayun.status === 'caution') return ['先对齐各自十年段优先级，再谈共同大投入'];
    return [];
  }
  if (dayun.status === 'caution') return ['避免在一方大运高压期逼迫重大关系承诺'];
  return [];
}

function scoreDayStem(dmA: string, dmB: string, nameA: string, nameB: string): HehunLayer {
  const details: string[] = [];
  let score = 55;
  if (!dmA || !dmB) {
    return {
      key: 'day-stem',
      title: '日主互动',
      score: 50,
      status: 'ok',
      summary: '日主信息不足，按中性处理。',
      details: ['请补全日柱天干'],
    };
  }

  if (GAN_HE[dmA] === dmB) {
    score += 22;
    details.push(`天干合：${dmA}${dmB}，亲和力与粘合力偏强`);
  }
  if (GAN_CHONG[dmA] === dmB) {
    score -= 20;
    details.push(`天干冲：${dmA}${dmB}，主张与节奏易顶牛，需明确分工`);
  }

  const wa = WX_CN[GAN_TO_WUXING[dmA] || ''] || '';
  const wb = WX_CN[GAN_TO_WUXING[dmB] || ''] || '';
  if (wa && wb) {
    if (SHENG[wa] === wb) {
      score += 12;
      details.push(`${nameA}（${wa}）生 ${nameB}（${wb}），付出/推动感偏 ${nameA}`);
    } else if (SHENG[wb] === wa) {
      score += 12;
      details.push(`${nameB}（${wb}）生 ${nameA}（${wa}），付出/推动感偏 ${nameB}`);
    } else if (KE[wa] === wb) {
      score -= 10;
      details.push(`${nameA}（${wa}）克 ${nameB}（${wb}），主导权需协商，避免压制`);
    } else if (KE[wb] === wa) {
      score -= 10;
      details.push(`${nameB}（${wb}）克 ${nameA}（${wa}），主导权需协商，避免压制`);
    } else if (wa === wb) {
      score += 4;
      details.push(`同气相求（${wa}），理解快，也易争主导`);
    }
  }

  score = clamp(score);
  return {
    key: 'day-stem',
    title: '日主互动',
    score,
    status: statusOf(score),
    summary: details[0] || `${nameA}${dmA} 与 ${nameB}${dmB} 互动中性，重在规则清晰。`,
    details: details.length ? details : [`日干 ${dmA} vs ${dmB}`],
  };
}

function scoreSpousePalace(brA: string, brB: string, nameA: string, nameB: string): HehunLayer {
  const details: string[] = [];
  let score = 58;
  if (!brA || !brB) {
    return {
      key: 'palace',
      title: '夫妻宫（日支）',
      score: 50,
      status: 'ok',
      summary: '日支信息不足。',
      details: ['请补全日支'],
    };
  }

  if (ZHI_HE[brA] === brB) {
    score += 20;
    details.push(`日支六合 ${brA}${brB}，生活节奏与安全感较易咬合`);
  }
  if (ZHI_CHONG[brA] === brB) {
    score -= 22;
    details.push(`日支相冲 ${brA}${brB}，作息/家庭/空间议题易反复，宜先立约`);
  }
  if (ZHI_XING[brA] === brB || ZHI_XING[brB] === brA) {
    score -= 12;
    details.push(`日支相刑，摩擦多来自「怎么做」而非「爱不爱」`);
  }
  if (ZHI_HAI[brA] === brB) {
    score -= 10;
    details.push(`日支相害，情绪误解成本高，需显性沟通`);
  }
  if (brA === brB) {
    score += 6;
    details.push(`日支相同（${brA}），生活习惯理解快，也易放大同类问题`);
  }

  score = clamp(score);
  return {
    key: 'palace',
    title: '夫妻宫（日支）',
    score,
    status: statusOf(score),
    summary: details[0] || `${nameA}日支${brA} 与 ${nameB}日支${brB} 相处中性。`,
    details: details.length ? details : [`夫妻宫 ${brA} vs ${brB}`],
  };
}

function scoreYongComplement(
  yongA: string[],
  jiA: string[],
  yongB: string[],
  jiB: string[],
  nameA: string,
  nameB: string
): HehunLayer {
  const details: string[] = [];
  let score = 55;
  const setA = new Set(yongA);
  const setB = new Set(yongB);
  const jiSetA = new Set(jiA);
  const jiSetB = new Set(jiB);

  const sharedYong = yongA.filter((x) => setB.has(x));
  const aHelpsB = yongA.filter((x) => setB.has(x) || [...setB].some((y) => SHENG[x] === y));
  const conflict = yongA.filter((x) => jiSetB.has(x));
  const conflict2 = yongB.filter((x) => jiSetA.has(x));

  if (sharedYong.length) {
    score += 10 + sharedYong.length * 4;
    details.push(`共用神 ${sharedYong.join('、')}，目标感容易一致`);
  }
  if (aHelpsB.length && !sharedYong.length) {
    score += 8;
    details.push(`${nameA} 用神方向可支援 ${nameB}`);
  }
  if (conflict.length) {
    score -= 12;
    details.push(`${nameA} 用神触及 ${nameB} 忌神（${conflict.join('、')}），扩张时易踩对方雷区`);
  }
  if (conflict2.length) {
    score -= 12;
    details.push(`${nameB} 用神触及 ${nameA} 忌神（${conflict2.join('、')}）`);
  }
  if (!yongA.length && !yongB.length) {
    details.push('双方用神未提供，互补分按中性；建议从报告喜用忌导入');
  }

  score = clamp(score);
  return {
    key: 'yong',
    title: '用忌互补',
    score,
    status: statusOf(score),
    summary: details[0] || '用忌信息有限，以沟通与边界为主。',
    details: details.length ? details : ['用忌待补全'],
  };
}

function scoreBand(score: number): HehunResult['band'] {
  if (score >= 75) return '宜深化';
  if (score >= 58) return '可经营';
  if (score >= 42) return '宜谨慎';
  return '高摩擦';
}

function statusOf(score: number): 'good' | 'ok' | 'caution' {
  if (score >= 70) return 'good';
  if (score >= 50) return 'ok';
  return 'caution';
}

function clamp(n: number) {
  return Math.max(15, Math.min(95, Math.round(n)));
}

function pickActions(
  day: HehunLayer,
  palace: HehunLayer,
  yong: HehunLayer,
  kind: 'do' | 'avoid'
): string[] {
  const out: string[] = [];
  if (kind === 'do') {
    if (day.status === 'good') out.push('把共同目标写成季度清单，放大日主亲和优势');
    if (palace.status === 'caution') out.push('先约定居住/金钱/家人边界，再谈更大承诺');
    if (yong.status === 'good') out.push('共同资源往双方用神同向的项目倾斜');
  } else {
    if (day.status === 'caution') out.push('避免公开场合争对错、争主导');
    if (palace.status === 'caution') out.push('避免在作息冲突期做不可逆决定');
    if (yong.status === 'caution') out.push('避免一方按自己用神强推，无视对方忌神');
  }
  return out;
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

/** 从报告结果尽量抽出合婚输入（含当前大运） */
export function personFromReportResult(
  result: {
    basic?: { dayMaster?: string; pillars?: Array<{ celestialStem?: string; earthlyBranch?: string; ganZhi?: string }> };
    advice?: { yongShen?: string[]; jiShen?: string[] };
    yongShen?: { yongShen?: string[]; jiShen?: string[] };
    fortune?: { currentDaYun?: string };
    dayun?: {
      currentDayun?: {
        ganZhi?: string;
        quality?: string;
        yongShenMatch?: string;
        startYear?: number;
        endYear?: number;
      } | null;
      current?: {
        ganZhi?: string;
        quality?: string;
        yongShenMatch?: string;
        startYear?: number;
        endYear?: number;
      } | null;
    };
  },
  name?: string
): HehunPersonInput {
  const pillars = result.basic?.pillars || [];
  const day = pillars[2];
  const dayMaster =
    result.basic?.dayMaster ||
    day?.celestialStem ||
    (typeof day?.ganZhi === 'string' ? day.ganZhi[0] : '') ||
    '';
  const dayBranch =
    day?.earthlyBranch || (typeof day?.ganZhi === 'string' ? day.ganZhi[1] : '') || '';
  const cur = result.dayun?.currentDayun || result.dayun?.current || null;
  const dayunGz =
    cur?.ganZhi ||
    (() => {
      const m = `${result.fortune?.currentDaYun || ''}`.match(
        /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/
      );
      return m?.[0] || '';
    })();
  const years =
    cur?.startYear && cur?.endYear ? `${cur.startYear}-${cur.endYear}` : undefined;
  return {
    name,
    dayMaster,
    dayBranch,
    pillars: pillars.map((p) => p.ganZhi || `${p.celestialStem || ''}${p.earthlyBranch || ''}`),
    yongShen: result.advice?.yongShen || result.yongShen?.yongShen || [],
    jiShen: result.advice?.jiShen || result.yongShen?.jiShen || [],
    currentDayunGanZhi: dayunGz || undefined,
    currentDayunQuality: cur?.quality || undefined,
    currentDayunYongMatch: cur?.yongShenMatch || undefined,
    currentDayunYears: years,
  };
}
