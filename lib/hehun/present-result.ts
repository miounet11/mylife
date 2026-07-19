/**
 * Hehun result presentation (locale chrome only).
 * Engine scoring stays Chinese-native; this layer maps body chrome for EN UI.
 */

import type { HehunLayer, HehunResult } from '@/lib/hehun-engine';

const CJK_RE = /[\u3400-\u9fff]/;

function isEnglishLocale(locale?: string | null): boolean {
  const v = `${locale || ''}`.trim().toLowerCase().replace(/_/g, '-');
  return v === 'en' || v.startsWith('en-');
}

/** Band labels (engine union stays Chinese). */
export const HEHUN_BAND_EN: Record<HehunResult['band'], string> = {
  宜深化: 'Deepen carefully',
  可经营: 'Workable',
  宜谨慎: 'Proceed carefully',
  高摩擦: 'High friction',
};

/** Layer titles by engine `layer.key` (fallback by Chinese title). */
export const HEHUN_LAYER_TITLE_EN: Record<string, string> = {
  'day-stem': 'Day Master interaction',
  palace: 'Spouse palace (day branch)',
  yong: 'Favorable / unfavorable complement',
  dayun: 'Dayun sync',
  日主互动: 'Day Master interaction',
  '夫妻宫（日支）': 'Spouse palace (day branch)',
  用忌互补: 'Favorable / unfavorable complement',
  大运同步: 'Dayun sync',
};

/**
 * Exact-match do/avoid strings from hehun-engine (fixed templates + pickActions).
 * Keep keys identical to engine source strings.
 */
const DO_AVOID_EN: Record<string, string> = {
  // Fixed templates (always appended)
  '每月固定一次「无指责」对齐：时间、金钱、家人边界':
    'Hold a fixed monthly “no-blame” alignment: time, money, family boundaries',
  '重大承诺选双方情绪稳定、非低谷窗口推进':
    'Push major commitments only when both are emotionally steady—not in a low window',
  '避免用「合不合」替代具体沟通':
    'Don’t let “compatible or not” replace concrete communication',
  '避免在一方高压运势窗口逼迫领证/分手二选一':
    'Don’t force a register-or-break-up choice during either person’s high-pressure window',
  // pickActions do
  '把共同目标写成季度清单，放大日主亲和优势':
    'Write shared goals as a quarterly list to leverage Day Master affinity',
  '先约定居住/金钱/家人边界，再谈更大承诺':
    'Agree living / money / family boundaries before larger commitments',
  '共同资源往双方用神同向的项目倾斜':
    'Tilt shared resources toward projects aligned with both favorable elements',
  // pickActions avoid
  '避免公开场合争对错、争主导':
    'Avoid public fights over who is right or who leads',
  '避免在作息冲突期做不可逆决定':
    'Avoid irreversible decisions during schedule-conflict periods',
  '避免一方按自己用神强推，无视对方忌神':
    'Avoid one side pushing their own favorable path while ignoring the other’s unfavorables',
  // pickDayunActions
  '双方大运偏顺时，可共同推进购房/婚约/合伙等中长期事项':
    'When both Dayun are favorable, co-advance mid/long-term items (home, marriage, partnership)',
  '先对齐各自十年段优先级，再谈共同大投入':
    'Align each ten-year-segment priority before joint large investments',
  '避免在一方大运高压期逼迫重大关系承诺':
    'Don’t force major relationship commitments during either person’s high-pressure Dayun',
};

/**
 * Phrase dictionary: longer Chinese fragments first → EN.
 * Applied to layer summary/details (and leftover do/avoid / proNotes).
 * Placeholders (names, stems, branches, years) are preserved around matches.
 */
const PHRASE_EN: Array<[string, string]> = [
  // Fixed full-ish layer templates
  [
    '双方当前大运未提供，按中性处理；可从报告带入后重算。',
    'Neither current Dayun provided—treated as neutral; recompute after importing from reports.',
  ],
  ['补全双方当前大运后可看同步层', 'Fill both current Dayun to unlock the sync layer'],
  ['大运同步层待补全', 'Dayun sync layer pending full inputs'],
  ['大运信息有限，以日柱与用忌为主。', 'Limited Dayun data—lean on day pillars and favorable/unfavorable.'],
  ['日主信息不足，按中性处理。', 'Day Master info incomplete—treated as neutral.'],
  ['请补全日柱天干', 'Please complete the day-pillar heavenly stem'],
  ['日支信息不足。', 'Day branch info incomplete.'],
  ['请补全日支', 'Please complete the day branch'],
  ['用忌信息有限，以沟通与边界为主。', 'Limited favorable/unfavorable data—lean on communication and boundaries.'],
  ['用忌待补全', 'Favorable/unfavorable pending'],
  [
    '双方用神未提供，互补分按中性；建议从报告喜用忌导入',
    'Neither favorable element provided—complement score neutral; import from report xi/yong/ji',
  ],
  [
    '双方大运同处偏顺段，适合共同推进中长期规划',
    'Both Dayun in a favorable stretch—good for co-advancing mid/long-term plans',
  ],
  [
    '双方大运同处偏紧段，宜共同防守、减少硬承诺',
    'Both Dayun in a tight stretch—defend together and reduce hard commitments',
  ],
  [
    '日支相刑，摩擦多来自「怎么做」而非「爱不爱」',
    'Day-branch punishment: friction is more about “how” than “love or not”',
  ],
  [
    '日支相害，情绪误解成本高，需显性沟通',
    'Day-branch harm: high misread cost—need explicit communication',
  ],

  // Structured relation phrases
  ['天干合：', 'Stem combination: '],
  ['天干冲：', 'Stem clash: '],
  ['大运天干合', 'Dayun stem combination'],
  ['大运天干冲', 'Dayun stem clash'],
  ['大运地支合', 'Dayun branch combination'],
  ['大运地支冲', 'Dayun branch clash'],
  ['大运五行相生', 'Dayun five-element generation'],
  ['大运五行相克', 'Dayun five-element control'],
  ['日支六合', 'Day-branch six-harmony'],
  ['日支相冲', 'Day-branch clash'],
  ['日支相同', 'Same day branch'],
  ['日支夫妻宫', 'day-branch spouse palace'],
  ['日支', 'day branch'],
  ['夫妻宫', 'Spouse palace'],
  ['天干合', 'Stem combination'],
  ['天干冲', 'Stem clash'],

  // Dayun quality / sync
  ['更适合主动规划共同事项', 'better for proactively planning shared matters'],
  ['宜减外部扩张、先稳自身节奏', 'reduce external expansion; steady own rhythm first'],
  ['大运偏顺', 'Dayun favorable'],
  ['大运偏紧', 'Dayun tight'],
  ['现行大运', 'current Dayun'],
  ['现行运局参考', 'current luck cycle as reference'],
  ['大运未提供，仅按', 'Dayun not provided; using only'],
  ['外部节奏较易同向', 'external rhythm easier to align'],
  ['十年段目标感可能错位', 'decade-segment goals may misalign'],
  ['生活场域更易咬合', 'life domains easier to mesh'],
  ['迁移/家庭议题易反复', 'move/family topics may recur'],
  ['可互相借力', 'can borrow strength from each other'],
  ['决策时宜错峰', 'stagger decisions when choosing'],

  // Day stem / palace body
  ['亲和力与粘合力偏强', 'affinity and stickiness tend to be strong'],
  ['主张与节奏易顶牛，需明确分工', 'views and pace may lock horns—clarify division of labor'],
  ['付出/推动感偏', 'giving/push energy leans toward'],
  ['主导权需协商，避免压制', 'negotiate leadership; avoid suppressing'],
  ['同气相求', 'same-element affinity'],
  ['理解快，也易争主导', 'quick mutual understanding, also easy to compete for lead'],
  ['生活节奏与安全感较易咬合', 'life rhythm and security easier to mesh'],
  ['作息/家庭/空间议题易反复，宜先立约', 'schedule/family/space topics may recur—set ground rules first'],
  ['生活习惯理解快，也易放大同类问题', 'habits understood quickly; same-type issues may amplify'],
  ['互动中性，重在规则清晰', 'interaction neutral—clarity of rules matters most'],
  ['相处中性', 'interaction neutral'],

  // Element relation connectors (engine: `（木）生 / 克 …`) — before bare 与/岁
  ['）生 ', ') generates '],
  ['）克 ', ') controls '],

  // Yong/ji
  ['共用神', 'Shared favorable'],
  ['目标感容易一致', 'goals tend to align'],
  ['用神方向可支援', 'favorable direction can support'],
  ['用神触及', 'favorable touches'],
  ['忌神', 'unfavorable'],
  ['用神', 'favorable'],
  ['扩张时易踩对方雷区', 'expansion may step on the other’s landmines'],
  ['用忌互补', 'Favorable / unfavorable complement'],
  ['用忌', 'favorable/unfavorable'],
  ['喜用忌', 'xi/yong/ji'],

  // Weight / pro-note shells
  [
    '权重：日干 28% · 日支夫妻宫 32% · 用忌互补 22% · 大运同步 18%',
    'Weights: day stem 28% · day-branch spouse palace 32% · fav/unfav complement 22% · Dayun sync 18%',
  ],
  [
    '权重：日干 35% · 日支夫妻宫 40% · 用忌互补 25%',
    'Weights: day stem 35% · day-branch spouse palace 40% · fav/unfav complement 25%',
  ],
  ['日干', 'Day stem'],
  ['大运同步', 'Dayun sync'],
  ['日主互动', 'Day Master interaction'],
  ['按中性处理', 'treated as neutral'],
  ['中性', 'neutral'],
  ['大运', 'Dayun'],

  // Residual glue (after longer templates; keep short keys last)
  ['与 ', 'and '],
  ['岁', ' yrs'],
];

/** Five-element labels (applied after PHRASE_EN; stems/branches left as-is). */
const WUXING_EN: Array<[string, string]> = [
  ['木', 'Wood'],
  ['火', 'Fire'],
  ['土', 'Earth'],
  ['金', 'Metal'],
  ['水', 'Water'],
];

/** Light label swaps for proNotes lines (order matters for multi-char keys). */
const PRO_NOTE_LABELS: Array<[string, string]> = [
  ['日柱', 'Day pillar'],
  ['权重', 'Weights'],
  ['大运', 'Dayun'],
  [' 用 ', ' Fav '],
  [' 忌 ', ' Unfav '],
  ['· 用 ', '· Fav '],
  ['· 忌 ', '· Unfav '],
];

export function presentHehunBand(band: HehunResult['band'], locale?: string | null): string {
  if (!isEnglishLocale(locale)) return band;
  return HEHUN_BAND_EN[band] ?? band;
}

export function presentHehunLayerTitle(layer: Pick<HehunLayer, 'key' | 'title'>, locale?: string | null): string {
  if (!isEnglishLocale(locale)) return layer.title;
  return HEHUN_LAYER_TITLE_EN[layer.key] ?? HEHUN_LAYER_TITLE_EN[layer.title] ?? layer.title;
}

/** Residual CJK punctuation → ASCII after phrase map (stems/branches may remain). */
function normalizeCjkPunct(text: string): string {
  return text
    .replace(/，/g, ', ')
    .replace(/、/g, ', ')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/（/g, ' (')
    .replace(/）/g, ')')
    .replace(/「/g, '"')
    .replace(/」/g, '"')
    .replace(/。/g, '.')
    .replace(/ {2,}/g, ' ')
    .replace(/, ,/g, ',')
    .trim();
}

function mapPhraseText(text: string): string {
  if (!text || !CJK_RE.test(text)) return text;
  let out = text;
  for (const [zh, en] of PHRASE_EN) {
    if (out.includes(zh)) out = out.split(zh).join(en);
  }
  // Element names after structural phrases (木/火/土/金/水 in details)
  for (const [zh, en] of WUXING_EN) {
    if (out.includes(zh)) out = out.split(zh).join(en);
  }
  return normalizeCjkPunct(out);
}

function mapDoAvoidItem(item: string): string {
  if (DO_AVOID_EN[item]) return DO_AVOID_EN[item]!;
  return mapPhraseText(item);
}

function mapProNote(note: string): string {
  // Full phrases first (weight lines), then light label swaps for leftovers.
  let out = mapPhraseText(note);
  for (const [zh, en] of PRO_NOTE_LABELS) {
    if (out.includes(zh)) out = out.split(zh).join(en);
  }
  return out;
}

function presentLayer(layer: HehunLayer): HehunLayer {
  return {
    ...layer,
    title: presentHehunLayerTitle(layer, 'en'),
    summary: mapPhraseText(layer.summary),
    details: layer.details.map(mapPhraseText),
  };
}

function rebuildPlainForCoupleEn(
  result: HehunResult,
  layers: HehunLayer[],
  headline: string,
  doList: string[],
  avoidList: string[],
): string {
  const stamp = result.knowledgeStamp;
  const byKey = (key: string) => layers.find((l) => l.key === key);
  const day = byKey('day-stem');
  const palace = byKey('palace');
  const yong = byKey('yong');
  const dayun = byKey('dayun');

  const lines = [
    `[Compatibility plain · ${stamp}]`,
    headline,
    ``,
    `1) Day Master interaction: ${day?.summary ?? ''}`,
    `2) Spouse palace (day branch): ${palace?.summary ?? ''}`,
    `3) Favorable / unfavorable complement: ${yong?.summary ?? ''}`,
  ];
  if (dayun) {
    lines.push(`4) Dayun sync: ${dayun.summary}`);
  }
  lines.push(
    ``,
    `Do:`,
    ...doList.map((x, i) => `  ${i + 1}. ${x}`),
    `Avoid:`,
    ...avoidList.map((x, i) => `  ${i + 1}. ${x}`),
    ``,
    `Note: Compatibility is for relationship rhythm reference only—not a substitute for real choices or legal advice.`,
  );
  return lines.join('\n');
}

/**
 * Present a hehun engine result for UI locale.
 * Non-en → returned unchanged. en → body chrome (band/titles/do-avoid/summaries/plain/proNotes) in English.
 */
export function presentHehunResult(result: HehunResult, locale?: string | null): HehunResult {
  if (!isEnglishLocale(locale)) return result;

  const bandEn = presentHehunBand(result.band, 'en');
  const nameA = result.personA.name;
  const nameB = result.personB.name;
  const headline = `${nameA} & ${nameB}: ${result.score}/100 · ${bandEn}`;

  const layers = result.layers.map(presentLayer);
  const doList = result.doList.map(mapDoAvoidItem);
  const avoidList = result.avoidList.map(mapDoAvoidItem);
  const proNotes = result.proNotes.map(mapProNote);
  const plainForCouple = rebuildPlainForCoupleEn(result, layers, headline, doList, avoidList);

  return {
    ...result,
    // Presentation-only: English band label (engine type remains Chinese union)
    band: bandEn as HehunResult['band'],
    headline,
    layers,
    doList,
    avoidList,
    plainForCouple,
    proNotes,
  };
}
