/**
 * 用神/喜忌 — 用户向统一表述层
 *
 * 引擎内部仍可用 English keys（wood/fire…）供 K 线匹配。
 * 凡对用户、工具页、聊天、Agent、内容文案输出，一律走本模块：
 *   1) 主用神 = 扶抑（身弱印比 / 身强克泄）
 *   2) 调候单独说，不并入主用神列表
 *   3) 理由链用得令/得地/得势白话，不抛司令术语
 */

import type { YongShenResult } from '@/lib/bazi-analyzer';
import { localizeElementList, localizeElementToken } from '@/lib/report-presentation';

/** Agent / 产品文案共用的读法纪律（最普及子平心智） */
export const YONGSHEN_USER_DOCTRINE = [
  '主用神按「扶抑」取：身弱/偏弱喜印比生扶；身旺/偏旺喜官杀、财、食伤克泄。',
  '调候（冬火夏水等）是季节调节，单独说明，不得与主用神并列成「身弱却用火」的误读。',
  '喜神辅助主用神；忌神是高压窗口少硬刚的方向，不是诅咒。',
  '对用户表述用得令/得地/得势与印比官杀白话，避免司令、分野等内行术语。',
  '不得改写引擎给出的日主强弱、主用神、忌神列表；可解释、可翻译，不可另起一套喜忌。',
].join('\n');

export type PublicYongShenView = {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  strength: string;
  strengthDesc: string;
  score: number;
  actionHint: string;
  headline: string;
  tiaohuoElement?: string;
  tiaohuoNote?: string;
  reasonChain: string[];
  analysis: string;
  /** 一行：用神水木 · 忌金土 · 调候火 */
  chipLine: string;
  /** Agent 锁定事实块 */
  lockedFacts: string;
};

export function elementsToCn(list: unknown): string[] {
  return localizeElementList(Array.isArray(list) ? (list as string[]) : []);
}

export function elementToCn(token: unknown): string {
  return localizeElementToken(`${token ?? ''}`);
}

/** 从引擎结果生成全站统一的用户向视图 */
export function formatYongShenPublic(ys: YongShenResult | null | undefined): PublicYongShenView | null {
  if (!ys) return null;

  const yongShen = elementsToCn(ys.yongShen);
  const xiShen = elementsToCn(ys.xiShen);
  const jiShen = elementsToCn(ys.jiShen);
  const uf = ys.userFacing;
  const tiaohuoElement = ys.tiaohuo?.element
    ? elementToCn(ys.tiaohuo.element)
    : undefined;
  const actionHint =
    uf?.actionHint ||
    inferActionHint(ys.strength, ys.strengthDesc);
  const headline =
    uf?.headline ||
    `日主${ys.dayMasterElement || ys.dayMaster || ''}「${ys.strengthDesc || '待分析'}」，${actionHint}${
      yongShen.length ? `；主用神${yongShen.join('、')}` : ''
    }`;
  const tiaohuoNote =
    uf?.tiaohuoNote ||
    (ys.tiaohuo
      ? `${ys.tiaohuo.reason}（${tiaohuoElement || elementToCn(ys.tiaohuo.element)}作调候辅助，不是扶抑主用神）`
      : undefined);

  const reasonChain =
    ys.threeGain?.reasonChain?.map(String).filter(Boolean) ||
    buildMinimalReasonChain(ys, yongShen, jiShen, tiaohuoNote);

  const chipParts = [
    yongShen.length ? `用神 ${yongShen.join('、')}` : '',
    tiaohuoElement ? `调候 ${tiaohuoElement}` : '',
    xiShen.filter((e) => e !== tiaohuoElement).length
      ? `喜 ${xiShen.filter((e) => e !== tiaohuoElement).join('、')}`
      : '',
    jiShen.length ? `忌 ${jiShen.join('、')}` : '',
  ].filter(Boolean);

  const lockedFacts = [
    `日主：${ys.dayMaster || '—'}（${ys.dayMasterElement || '—'}）`,
    `强弱：${ys.strengthDesc || ys.strength || '—'}（${actionHint}）`,
    `主用神（扶抑）：${yongShen.join('、') || '—'}`,
    tiaohuoNote ? `调候（辅助）：${tiaohuoNote}` : '调候：不显',
    `喜神：${xiShen.join('、') || '—'}`,
    `忌神：${jiShen.join('、') || '—'}`,
    `读法：先扶抑主用神，再看调候/喜神；忌神高压窗口慎触。`,
  ].join('\n');

  return {
    yongShen,
    xiShen,
    jiShen,
    strength: ys.strength || '',
    strengthDesc: ys.strengthDesc || '',
    score: typeof ys.score === 'number' ? ys.score : 0,
    actionHint,
    headline,
    tiaohuoElement,
    tiaohuoNote,
    reasonChain,
    analysis: ys.analysis || headline,
    chipLine: chipParts.join(' · ') || '喜用待分析',
    lockedFacts,
  };
}

function inferActionHint(strength: string, strengthDesc: string): string {
  const s = `${strength || ''} ${strengthDesc || ''}`;
  if (/very_strong|strong|极旺|偏旺|身旺/.test(s) && !/偏弱|极弱/.test(s)) {
    return '宜克泄（官杀、财、食伤一类）';
  }
  if (/very_weak|weak|极弱|偏弱|身弱/.test(s)) {
    return '宜生扶（印、比劫一类）';
  }
  if (/偏弱/.test(strengthDesc || '')) return '宜生扶（印、比劫一类）';
  if (/偏旺/.test(strengthDesc || '')) return '宜克泄（官杀、财、食伤一类）';
  return '宜补偏调候，不强求一边倒';
}

function buildMinimalReasonChain(
  ys: YongShenResult,
  yong: string[],
  ji: string[],
  tiaohuoNote?: string,
): string[] {
  const lines = [
    `日主${ys.dayMasterElement || ys.dayMaster || ''}「${ys.strengthDesc || '待分析'}」`,
    yong.length
      ? `按扶抑：主用神取${yong.join('、')}${ji.length ? `，忌${ji.join('、')}` : ''}`
      : '按扶抑综合取用',
  ];
  if (tiaohuoNote) lines.push(`另需调候：${tiaohuoNote}`);
  return lines;
}

/** 建议句里插入主用神（中文） */
export function yongPhrase(ys: YongShenResult | null | undefined, fallback = '结构用神'): string {
  const pub = formatYongShenPublic(ys);
  if (!pub?.yongShen.length) return fallback;
  return pub.yongShen.slice(0, 2).join('、');
}

export function jiPhrase(ys: YongShenResult | null | undefined, fallback = '过度消耗方向'): string {
  const pub = formatYongShenPublic(ys);
  if (!pub?.jiShen.length) return fallback;
  return pub.jiShen.slice(0, 2).join('、');
}

/** 内容页/知识库：用神读法固定段落 */
export const YONGSHEN_CONTENT_BLURB = {
  title: '用神怎么读',
  summary:
    '主用神按扶抑：身弱喜印比生扶，身旺喜克泄。调候（如冬火夏水）是季节调节，单独看，不要和主用神混成一套「既弱又用火」的矛盾说法。',
  faqs: [
    [
      '用神和调候有什么区别？',
      '用神是扶抑主线（帮你平衡日主强弱）；调候是季节温度调节，作辅助，不替代主用神。',
    ],
    [
      '身弱为什么还提火？',
      '若出生在冬天，火是调候暖局，不是说你以火为扶身主用。主用仍是水木一类印比。',
    ],
    [
      '多个用神如何取舍？',
      '优先 1–2 个主用神方向做可验证动作；喜神/调候作第二优先级。',
    ],
  ] as Array<[string, string]>,
};
