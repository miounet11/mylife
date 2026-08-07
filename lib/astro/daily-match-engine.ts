/**
 * 星座 × 万年历 daily match engine.
 * Single pipeline for sign / zone / rising / birth × targetDate pages.
 */

import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import {
  buildPersonalDayOverlay,
  resolveDayMasterFromBirth,
} from '@/lib/almanac/personal-day';
import { stemElement } from '@/lib/almanac/elements';
import type { PersonalDayOverlay } from '@/lib/almanac/types';
import { buildCohortScore } from '@/lib/astro/cohort-score';
import {
  formatZhDate,
  isValidIsoDate,
  shiftIsoDate,
} from '@/lib/astro/daily-window';
import type {
  AstroDailyIdentity,
  AstroDailyMatchPack,
  AstroEvidence,
  AstroHourNote,
} from '@/lib/astro/daily-match-types';
import { getElementBySlug, getModalityBySlug, signsForElement, signsForModality } from '@/lib/astro/elements-catalog';
import { getRisingByKey } from '@/lib/astro/rising-data';
import { relatedWorldYiLinks, resolveSunSignFromDate } from '@/lib/astro/resolve';
import { getShengxiaoBySlug, shengxiaoFlowRelation } from '@/lib/astro/shengxiao-catalog';
import { getSignByKey } from '@/lib/astro/signs-data';
import type { SignKey, ZonePhase } from '@/lib/astro/types';
import { getZoneById, getZonesBySign, resolveZoneFromDate } from '@/lib/astro/zones-48';
import { ganZhiParts } from '@/lib/almanac/elements';
import { getChineseZodiac } from '@/lib/life-foundation/zodiac';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function tryBuildChartFromBirth(birthDate: string, birthHour = 12): {
  dayMaster: string;
  dayBranch: string;
  dayPillar: string;
  yongShen: string[];
  source: 'engine' | 'birth_noon';
  dayMasterElement?: string;
} | null {
  try {
    // Lazy require path that works when engine is present (prod + local)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buildChartFromBirth } = require('@/lib/almanac/resolve-user-chart') as typeof import('@/lib/almanac/resolve-user-chart');
    const chart = buildChartFromBirth({
      birthDate,
      birthTime: `${String(birthHour).padStart(2, '0')}:00`,
    });
    if (chart?.dayMaster) {
      return {
        dayMaster: chart.dayMaster,
        dayBranch: chart.dayBranch || '',
        dayPillar: chart.dayPillar || `${chart.dayMaster}${chart.dayBranch || ''}`,
        yongShen: chart.yongShen || [],
        source: chart.source === 'engine' ? 'engine' : 'birth_noon',
        dayMasterElement: chart.dayMasterElement,
      };
    }
  } catch {
    // fall through
  }
  const dm = resolveDayMasterFromBirth(birthDate, birthHour);
  if (!dm) return null;
  const el = stemElement(dm.dayMaster);
  return {
    dayMaster: dm.dayMaster,
    dayBranch: dm.dayBranch,
    dayPillar: dm.dayPillar,
    yongShen: el ? [el] : [],
    source: 'birth_noon',
    dayMasterElement: el || undefined,
  };
}

function personalToHours(personal: PersonalDayOverlay): {
  top: AstroHourNote[];
  avoid: AstroHourNote[];
} {
  const map = (h: PersonalDayOverlay['hours'][0]): AstroHourNote => ({
    ganZhi: h.ganZhi,
    timeLabel: h.timeLabel,
    score: h.personalScore,
    reason: h.reason,
    publicLuck: h.publicLuck,
  });
  return {
    top: personal.topHours.map(map),
    avoid: personal.avoidHours.map(map),
  };
}

function stanceMood(stance: PersonalDayOverlay['stance']) {
  if (stance === 'push') {
    return {
      line: '可推进（验证型）',
      mood: '今天偏「可试」：把已准备好的事推进半步，比开新战场更赚。',
    };
  }
  if (stance === 'conserve') {
    return {
      line: '宜守成复核',
      mood: '今天偏「守界」：少做承诺，多做复核，把摩擦挡在门外。',
    };
  }
  return {
    line: '稳节奏观望',
    mood: '今天偏「安顿」：理清顺序与边界，比抢速度更重要。',
  };
}

function buildSeoFaqs(pack: AstroDailyMatchPack): Array<{ question: string; answer: string }> {
  const stanceZh =
    pack.scores.stance === 'push'
      ? '可推进'
      : pack.scores.stance === 'conserve'
        ? '宜守成'
        : '稳节奏';
  return [
    {
      question: `${pack.identity.title}为什么今日偏「${stanceZh}」？`,
      answer:
        pack.evidence
          .slice(0, 3)
          .map((e) => e.label)
          .join('；') + '。综合结构分与通书层给出节奏建议，非宿命断语。',
    },
    {
      question: '和万年历公共黄历有什么区别？',
      answer: `公共层见日柱${pack.almanac.dayGanZhi}与宜忌；本页叠加${pack.identity.kind === 'birth' ? '你的日主/用神结构' : '星座/星区表达层与队列匹配'}，并给出时辰排序。`,
    },
    {
      question: '如何用到可验证动作？',
      answer: '先看证据链与较顺/慎用时辰，再决定是否推进；完整八字用神与阶段窗口请出结构报告或完善数据底座。',
    },
  ];
}

function expressionNote(args: {
  kind: string;
  signLabel?: string;
  zoneTitle?: string;
  rising?: string;
  stance: string;
  strengths?: string[];
  watchouts?: string[];
}): string {
  const bits: string[] = [];
  if (args.signLabel) bits.push(`${args.signLabel}主轴偏「${(args.strengths || []).slice(0, 2).join('、') || '节奏'}」`);
  if (args.zoneTitle) bits.push(`落在${args.zoneTitle}`);
  if (args.rising) bits.push(`上升强调${args.rising}`);
  bits.push(
    args.stance === 'push'
      ? '今日宜把优势用在已准备事项'
      : args.stance === 'conserve'
        ? '今日宜收敛过度表达与硬碰'
        : '今日宜稳住节奏、先理清边界',
  );
  if (args.watchouts?.[0]) bits.push(`表达层提醒：${args.watchouts[0]}`);
  return bits.join('。') + '。';
}

/**
 * Build full daily match pack. Returns null if identity or date invalid / quality fail.
 */
export function buildAstroDailyMatchPack(
  targetDate: string,
  identity: AstroDailyIdentity,
): AstroDailyMatchPack | null {
  if (!isValidIsoDate(targetDate)) return null;
  const pack = buildAlmanacDayPack(targetDate);
  if (!pack?.lunar?.dayGanZhi) return null;

  let kind = identity.kind;
  let key = '';
  let title = '';
  let subtitle = '';
  let signKey: SignKey | undefined;
  let zoneId: string | undefined;
  let sign = null as ReturnType<typeof getSignByKey>;
  let zone = null as ReturnType<typeof getZoneById>;
  let rising = null as ReturnType<typeof getRisingByKey>;
  let zonePhase: ZonePhase | null = null;

  let natal: AstroDailyMatchPack['natal'] = null;
  let structureScore = 50;
  let expressionScore = 50;
  let stance: PersonalDayOverlay['stance'] = 'steady';
  let stars = 3;
  let favors: string[] = [];
  let watchouts: string[] = [];
  let topHours: AstroHourNote[] = [];
  let avoidHours: AstroHourNote[] = [];
  let evidence: AstroEvidence[] = [];
  let moodLine = '';
  let headline = '';
  let worldYiBridge = '';
  let exprNote = '';
  let compositeWeight = { s: 0.5, e: 0.5 };

  if (identity.kind === 'sign') {
    sign = getSignByKey(identity.key);
    if (!sign) return null;
    signKey = sign.key;
    key = sign.key;
    title = sign.zh;
    subtitle = `${sign.en} · ${sign.element}象 · ${sign.modality}`;
    worldYiBridge = sign.worldYiBridge;
    const cohort = buildCohortScore({
      pack,
      element: sign.element,
      modality: sign.modality,
      identityLabel: sign.zh,
    });
    structureScore = cohort.structure;
    expressionScore = cohort.expression;
    stance = cohort.stance;
    stars = cohort.stars;
    favors = cohort.favors;
    watchouts = cohort.watchouts;
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = cohort.evidence;
    moodLine = cohort.moodLine;
    headline = cohort.headline;
    exprNote = expressionNote({
      kind: 'sign',
      signLabel: sign.zh,
      stance,
      strengths: sign.strengths,
      watchouts: sign.watchouts,
    });
    natal = {
      dayMaster: '',
      dayPillar: '',
      dayBranch: '',
      yongShen: [],
      source: 'cohort',
      sun: { zh: sign.zh, key: sign.key },
    };
    compositeWeight = { s: 0.5, e: 0.5 };
  } else if (identity.kind === 'zone') {
    zone = getZoneById(identity.id);
    if (!zone) return null;
    sign = getSignByKey(zone.signKey);
    if (!sign) return null;
    signKey = sign.key;
    zoneId = zone.id;
    zonePhase = zone.phase;
    key = zone.id;
    title = zone.title;
    subtitle = `${zone.start}–${zone.end} · 第${zone.index}区 · ${sign.element}象`;
    worldYiBridge = sign.worldYiBridge;
    const cohort = buildCohortScore({
      pack,
      element: sign.element,
      modality: sign.modality,
      zonePhase: zone.phase,
      identityLabel: zone.title,
    });
    structureScore = cohort.structure;
    expressionScore = cohort.expression;
    stance = cohort.stance;
    stars = cohort.stars;
    favors = cohort.favors;
    watchouts = cohort.watchouts;
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = cohort.evidence;
    moodLine = cohort.moodLine;
    headline = cohort.headline;
    exprNote = expressionNote({
      kind: 'zone',
      signLabel: sign.zh,
      zoneTitle: zone.title,
      stance,
      strengths: sign.strengths,
      watchouts: sign.watchouts,
    });
    if (zone.actionTip) favors = [zone.actionTip, ...favors].slice(0, 5);
    natal = {
      dayMaster: '',
      dayPillar: '',
      dayBranch: '',
      yongShen: [],
      source: 'cohort',
      sun: { zh: sign.zh, key: sign.key },
      zone: { id: zone.id, title: zone.title },
    };
    compositeWeight = { s: 0.55, e: 0.45 };
  } else if (identity.kind === 'rising') {
    rising = getRisingByKey(identity.key);
    sign = getSignByKey(identity.key);
    if (!rising || !sign) return null;
    signKey = sign.key;
    key = rising.key;
    title = `上升${rising.zh}`;
    subtitle = `ASC ${rising.en} · 第一印象层`;
    worldYiBridge = rising.worldYiBridge;
    const cohort = buildCohortScore({
      pack,
      element: sign.element,
      modality: sign.modality,
      risingMode: true,
      identityLabel: title,
    });
    structureScore = cohort.structure;
    expressionScore = cohort.expression + 6;
    stance = cohort.stance;
    stars = cohort.stars;
    favors = cohort.favors;
    watchouts = [...cohort.watchouts, ...(rising.watchouts.slice(0, 1).map((w) => `呈现层：${w}`))];
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = cohort.evidence;
    moodLine = cohort.moodLine;
    headline = cohort.headline;
    exprNote = expressionNote({
      kind: 'rising',
      signLabel: sign.zh,
      rising: rising.firstImpression.slice(0, 24),
      stance,
      strengths: rising.strengths,
      watchouts: rising.watchouts,
    });
    natal = {
      dayMaster: '',
      dayPillar: '',
      dayBranch: '',
      yongShen: [],
      source: 'cohort',
      sun: { zh: sign.zh, key: sign.key },
    };
    compositeWeight = { s: 0.4, e: 0.6 };
  } else if (identity.kind === 'birth') {
    if (!isValidIsoDate(identity.birthDate)) return null;
    const y = Number(identity.birthDate.slice(0, 4));
    if (y < 1900 || y > 2100) return null;
    const chart = tryBuildChartFromBirth(identity.birthDate, identity.birthHour ?? 12);
    if (!chart) return null;
    const sun = resolveSunSignFromDate(identity.birthDate);
    const birthZone = resolveZoneFromDate(identity.birthDate);
    const cz = getChineseZodiac(identity.birthDate);
    sign = sun;
    signKey = sun?.key;
    zone = birthZone;
    zoneId = birthZone?.id;
    key = identity.birthDate;
    title = `${formatZhDate(identity.birthDate)}出生`;
    subtitle = [
      sun ? `${sun.zh}` : null,
      birthZone ? birthZone.title : null,
      `日柱${chart.dayPillar}`,
      cz ? `${cz.animal}肖` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const personal = buildPersonalDayOverlay(pack, {
      dayMaster: chart.dayMaster,
      dayBranch: chart.dayBranch,
      dayPillar: chart.dayPillar,
      yongShen: chart.yongShen,
      dayMasterElement: chart.dayMasterElement,
    });
    if (!personal) return null;

    structureScore = personal.score;
    stance = personal.stance;
    stars = personal.stars;
    favors = personal.favors;
    watchouts = personal.watchouts;
    const hours = personalToHours(personal);
    topHours = hours.top;
    avoidHours = hours.avoid;
    const sm = stanceMood(personal.stance);
    moodLine = personal.moodLine || sm.mood;
    headline = personal.headline || `${title} · ${sm.line}`;

    evidence = [
      {
        code: 'NATAL_DAY_PILLAR',
        label: `本命日柱（午时近似）${chart.dayPillar} · 日主${chart.dayMaster}`,
        weight: 12,
      },
      {
        code: 'FLOW_DAY',
        label: `流日日柱 ${pack.lunar.dayGanZhi}`,
        weight: 8,
      },
      {
        code: 'YONG_SHEN',
        label: chart.yongShen.length
          ? `用神参考 ${chart.yongShen.join('、')}（${chart.source === 'engine' ? '引擎' : '日主五行近似'}）`
          : '用神未全量，以日主五行为准',
        weight: 6,
      },
    ];
    if (sun) {
      evidence.push({
        code: 'SUN_ZONE',
        label: `太阳${sun.zh}${birthZone ? ` · ${birthZone.title}` : ''}`,
        weight: 4,
      });
    }
    if (pack.yi[0]) {
      evidence.push({
        code: 'TONGSHU_YI',
        label: `通书宜 ${pack.yi.slice(0, 3).join('、')}`,
        weight: 3,
      });
    }

    // Expression from sun/zone if available
    if (sun) {
      const cohort = buildCohortScore({
        pack,
        element: sun.element,
        modality: sun.modality,
        zonePhase: birthZone?.phase,
        identityLabel: sun.zh,
      });
      expressionScore = cohort.expression;
      worldYiBridge = sun.worldYiBridge;
      exprNote = expressionNote({
        kind: 'birth',
        signLabel: sun.zh,
        zoneTitle: birthZone?.title,
        stance,
        strengths: sun.strengths,
        watchouts: sun.watchouts,
      });
    } else {
      expressionScore = 50;
      exprNote = '表达层星座未解析；结构层以日主为准。';
      worldYiBridge = '先看日主与流日结构，再看阶段与环境（世界易）。';
    }

    natal = {
      birthDate: identity.birthDate,
      dayMaster: chart.dayMaster,
      dayPillar: chart.dayPillar,
      dayBranch: chart.dayBranch,
      yongShen: chart.yongShen,
      source: chart.source,
      sun: sun ? { zh: sun.zh, key: sun.key } : undefined,
      zone: birthZone ? { id: birthZone.id, title: birthZone.title } : undefined,
      chineseZodiac: cz?.animal,
    };
    compositeWeight = { s: 0.7, e: 0.3 };
  } else if (identity.kind === 'element') {
    const el = getElementBySlug(identity.slug);
    if (!el) return null;
    key = el.slug;
    title = `${el.zh}象星座`;
    subtitle = `${el.en} · ${el.blurb}`;
    worldYiBridge = el.worldYi;
    const memberKeys = signsForElement(el.zh);
    sign = getSignByKey(memberKeys[0]);
    signKey = sign?.key;
    const cohort = buildCohortScore({
      pack,
      element: el.zh,
      modality: '基本',
      identityLabel: title,
    });
    structureScore = cohort.structure;
    expressionScore = cohort.expression;
    stance = cohort.stance;
    stars = cohort.stars;
    favors = [
      ...cohort.favors,
      `同象成员：${memberKeys.map((k) => getSignByKey(k)?.zh).filter(Boolean).join('、')}`,
    ].slice(0, 5);
    watchouts = cohort.watchouts;
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = [
      ...cohort.evidence,
      { code: 'ELEMENT_GROUP', label: `${el.zh}象队列（${memberKeys.length} 座）`, weight: 2 },
    ];
    moodLine = cohort.moodLine;
    headline = cohort.headline;
    exprNote = `${el.blurb}${el.worldYi}`;
    natal = {
      dayMaster: '—',
      dayPillar: '—',
      dayBranch: '—',
      yongShen: [],
      source: 'cohort',
      sun: sign ? { zh: sign.zh, key: sign.key } : undefined,
    };
    compositeWeight = { s: 0.55, e: 0.45 };
  } else if (identity.kind === 'modality') {
    const mod = getModalityBySlug(identity.slug);
    if (!mod) return null;
    key = mod.slug;
    title = `${mod.zh}宫星座`;
    subtitle = `${mod.en} · ${mod.blurb}`;
    const memberKeys = signsForModality(mod.zh);
    sign = getSignByKey(memberKeys[0]);
    signKey = sign?.key;
    worldYiBridge = '模式（基本/固定/变动）决定启动、持守与调节；世界易强调阶段窗口与动作密度。';
    const cohort = buildCohortScore({
      pack,
      element: sign?.element || '火',
      modality: mod.zh,
      identityLabel: title,
    });
    structureScore = cohort.structure;
    expressionScore = cohort.expression;
    stance = cohort.stance;
    stars = cohort.stars;
    favors = [
      ...cohort.favors,
      `同模式：${memberKeys.map((k) => getSignByKey(k)?.zh).filter(Boolean).join('、')}`,
    ].slice(0, 5);
    watchouts = cohort.watchouts;
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = [
      ...cohort.evidence,
      { code: 'MODALITY_GROUP', label: `${mod.zh}宫队列`, weight: 2 },
    ];
    moodLine = cohort.moodLine;
    headline = cohort.headline;
    exprNote = mod.blurb;
    natal = {
      dayMaster: '—',
      dayPillar: '—',
      dayBranch: '—',
      yongShen: [],
      source: 'cohort',
    };
    compositeWeight = { s: 0.5, e: 0.5 };
  } else if (identity.kind === 'shengxiao') {
    const sx = getShengxiaoBySlug(identity.slug);
    if (!sx) return null;
    key = sx.slug;
    title = `属${sx.zh}`;
    subtitle = `${sx.en} · 地支${sx.branch} · ${sx.keywords.join('、')}`;
    worldYiBridge = '生肖层用流日地支冲合做节奏提示；完整阶段判断仍以八字日主与大运为准。';
    const { branch: flowBranch } = ganZhiParts(pack.lunar.dayGanZhi);
    const rel = shengxiaoFlowRelation(sx.branch, flowBranch);
    // Map animal keywords loosely to elements via branch
    const branchElMap: Record<string, '火' | '土' | '风' | '水'> = {
      子: '水',
      亥: '水',
      寅: '火',
      卯: '火',
      巳: '火',
      午: '火',
      申: '风',
      酉: '风',
      辰: '土',
      戌: '土',
      丑: '土',
      未: '土',
    };
    const cohort = buildCohortScore({
      pack,
      element: branchElMap[sx.branch] || '土',
      modality: '固定',
      identityLabel: title,
    });
    structureScore = clamp(cohort.structure + rel.scoreDelta, 0, 100);
    expressionScore = cohort.expression;
    stance =
      structureScore >= 62 ? 'push' : structureScore <= 42 ? 'conserve' : 'steady';
    stars = clamp(Math.round(structureScore / 20), 1, 5);
    favors = [...cohort.favors];
    watchouts = [...cohort.watchouts];
    if (rel.kind === 'he') favors.unshift(`生肖层：${rel.label}，协作与人情窗口略宽。`);
    if (rel.kind === 'chong') watchouts.unshift(`生肖层：${rel.label}，重大决定宜放缓复核。`);
    if (rel.kind === 'same') watchouts.unshift(`生肖层：${rel.label}，宜稳健忌冲动大变。`);
    topHours = cohort.topHours;
    avoidHours = cohort.avoidHours;
    evidence = [
      { code: 'SX_BRANCH', label: `生肖地支${sx.branch}`, weight: 6 },
      { code: 'SX_FLOW', label: rel.label, weight: rel.scoreDelta },
      ...cohort.evidence.slice(0, 5),
    ];
    const sm = stanceMood(stance);
    moodLine = sm.mood;
    headline = `${title} · ${sm.line} · 日柱 ${pack.lunar.dayGanZhi}`;
    exprNote = `${sx.blurb}关键词：${sx.keywords.join('、')}。${rel.label}。`;
    natal = {
      dayMaster: '—',
      dayPillar: '—',
      dayBranch: sx.branch,
      yongShen: [],
      source: 'cohort',
      chineseZodiac: sx.zh,
    };
    compositeWeight = { s: 0.65, e: 0.35 };
  } else {
    return null;
  }

  const composite = clamp(
    Math.round(structureScore * compositeWeight.s + expressionScore * compositeWeight.e),
    0,
    100,
  );
  if (evidence.length < 3) {
    evidence.push({
      code: 'DAY_PILLAR_BASE',
      label: `流日 ${pack.lunar.dayGanZhi} · 农历${pack.lunar.lunarText}`,
      weight: 0,
    });
  }

  const zhDate = formatZhDate(targetDate);
  const seoTitle =
    kind === 'birth'
      ? `${title}（${natal?.sun?.zh || '星座'}${natal?.zone ? natal.zone.title.replace(/^[^·]*·/, '·') : ''}）${zhDate}运势｜结构匹配｜人生K线`
      : `${title} ${zhDate}运势｜通书×${kind === 'rising' ? '呈现' : '结构'}｜人生K线`;

  const seoDesc = [
    `${title}${zhDate}`,
    `日柱${pack.lunar.dayGanZhi}`,
    `综合${composite}分·${stance === 'push' ? '可推进' : stance === 'conserve' ? '宜守成' : '稳节奏'}`,
    favors[0] ? favors[0].slice(0, 40) : '',
    '引擎匹配通书与结构，非医疗投资建议。',
  ]
    .filter(Boolean)
    .join('。')
    .slice(0, 158);

  const siblings: Array<{ href: string; label: string }> = [];
  if (signKey) {
    siblings.push({ href: `/astro/signs/${signKey}/day/${targetDate}`, label: `${sign?.zh || '本座'}今日` });
    siblings.push({ href: `/astro/rising/${signKey}/day/${targetDate}`, label: `上升${sign?.zh || ''}今日` });
    for (const z of getZonesBySign(signKey).slice(0, 4)) {
      siblings.push({ href: `/astro/zones/${z.id}/day/${targetDate}`, label: z.title });
    }
  }
  siblings.push({ href: `/almanac/${targetDate}`, label: '当日黄历' });
  siblings.push({ href: `/astro/day/${targetDate}`, label: '全日星座入口' });

  const worldYiHrefs = relatedWorldYiLinks(signKey).map((l) => l.href);

  const result: AstroDailyMatchPack = {
    targetDate,
    identity: {
      kind,
      key,
      title,
      subtitle,
      signKey,
      zoneId,
    },
    almanac: {
      dayGanZhi: pack.lunar.dayGanZhi,
      lunarText: pack.lunar.lunarText,
      yi: pack.yi,
      ji: pack.ji,
      chong: pack.chongShengXiao || pack.chong,
      sha: pack.sha,
      jieQi: pack.jieQi,
      hoursSummary: pack.hours.map((h) => ({
        ganZhi: h.ganZhi,
        timeLabel: h.timeLabel,
        luck: h.luck,
      })),
      westernSign: pack.westernSign,
      packPath: `/almanac/${targetDate}`,
    },
    natal:
      natal && natal.source === 'cohort' && !natal.dayMaster
        ? { ...natal, dayMaster: '—', dayPillar: '—', dayBranch: '—' }
        : natal,
    scores: {
      structure: structureScore,
      expression: expressionScore,
      composite,
      stars: clamp(stars, 1, 5),
      stance,
    },
    narrative: {
      headline,
      moodLine,
      favors: favors.slice(0, 5),
      watchouts: watchouts.slice(0, 5),
      topHours,
      avoidHours,
      expressionNote: exprNote,
      worldYiBridge: worldYiBridge || '结构、时位与动作——世界易方法可与本日节奏对照。',
    },
    evidence: evidence.slice(0, 8),
    bridges: {
      almanac: `/almanac/${targetDate}`,
      worldYi: worldYiHrefs.slice(0, 4),
      analyze: `/analyze?source=astro_daily&date=${targetDate}`,
      foundation: '/profile/foundation?source=astro_daily',
      siblingDays: {
        prev: shiftIsoDate(targetDate, -1),
        next: shiftIsoDate(targetDate, 1),
      },
      siblings: siblings.slice(0, 10),
    },
    seo: {
      title: seoTitle.slice(0, 70),
      description: seoDesc,
      keywords: [
        title,
        zhDate,
        '运势',
        pack.lunar.dayGanZhi,
        '黄历',
        '星座',
        kind === 'zone' ? '48星区' : '',
        kind === 'birth' ? '生日运势' : '',
        kind === 'rising' ? '上升星座' : '',
      ].filter(Boolean),
      faqs: [],
    },
    disclaimer:
      kind === 'birth'
        ? '结构层：日柱默认公历生日午时近似，精确用神需完整时辰与出生地。通书为宜忌公共层。服务节奏管理，不构成医疗/投资/法律建议。'
        : '表达层（星座/星区/上升）与通书公共层队列匹配；非个人完整命盘。服务节奏管理，不构成医疗/投资/法律建议。',
    quality: { ok: true, evidenceCount: evidence.length },
  };

  result.seo.faqs = buildSeoFaqs(result);

  if (!result.quality.ok || result.evidence.length < 3 || !result.almanac.dayGanZhi) {
    return null;
  }
  return result;
}

export function pathForIdentity(identity: AstroDailyIdentity, date: string): string {
  if (identity.kind === 'sign') return `/astro/signs/${identity.key}/day/${date}`;
  if (identity.kind === 'zone') return `/astro/zones/${identity.id}/day/${date}`;
  if (identity.kind === 'rising') return `/astro/rising/${identity.key}/day/${date}`;
  if (identity.kind === 'element') return `/astro/elements/${identity.slug}/day/${date}`;
  if (identity.kind === 'modality') return `/astro/modality/${identity.slug}/day/${date}`;
  if (identity.kind === 'shengxiao') return `/astro/shengxiao/${identity.slug}/day/${date}`;
  return `/astro/birth/${identity.birthDate}/day/${date}`;
}
