'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  analyzeHehun,
  type HehunLayer,
  type HehunPersonInput,
  type HehunResult,
} from '@/lib/hehun-engine';
import {
  buildHehunHref,
  hehunBirthPairFromQuery,
  hehunFromBirthPair,
  hehunPersonFromQuery,
  personFromPillarSummary,
} from '@/lib/hehun-prefill';
import {
  loadRememberedHehunBirthPair,
  saveRememberedHehunBirthPair,
} from '@/lib/birth-form-storage';
import {
  birthDateInputMax,
  birthDateInputMin,
  validateBirthDateString,
} from '@/lib/birth-date-validate';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';
import type { ProfileFortuneView, ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { trackProductEvent } from '@/lib/product-analytics';
import {
  formatPlaceWithLongitude,
  getQuickPickCities,
  resolveCityLongitude,
  type CityLongitude,
} from '@/lib/geo/city-longitudes';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { useLocale } from '@/components/i18n/locale-provider';
import type { SiteLocale } from '@/lib/i18n/site-locale';

const GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
const ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');

/** Dual-side birth form value (engine BirthInput shape on submit). */
type BirthSideValue = {
  date: string;
  time: string;
  gender: 'male' | 'female';
  name: string;
  /** Optional place; may encode lon as "城市 · 104.1°E" for true solar */
  birthPlace: string;
};

type HehunChromeCopy = ReturnType<typeof hehunChromeCopy>;

function hehunChromeCopy(locale: SiteLocale) {
  const en = locale === 'en';
  return {
    loading: en ? 'Loading compatibility tool…' : '载入合婚工具…',
    layersFour: en
      ? 'Four layers: Day Master · Spouse palace · Favorable/unfavorable · Dayun sync'
      : '四层：日主 · 夫妻宫 · 用忌 · 大运同步',
    layersThree: en
      ? 'Three layers: Day Master · Spouse palace · Favorable/unfavorable (add Dayun to unlock sync)'
      : '三层：日主互动 · 夫妻宫 · 用忌互补（补大运后可开同步层）',
    birthSectionTitle: en
      ? 'Compare from both birthdays (no full report needed)'
      : '双方生日对盘（无需完整报告）',
    birthSectionDesc: en
      ? 'Enter both birth details; the engine derives Day Master, favorable/unfavorable elements, and current Dayun, then compares. Birth place optional: true solar time when longitude resolves.'
      : '填双方出生信息，引擎即时排出日主、用忌与现行大运后再合婚对照。出生地可选：可解析经度时按真太阳时排盘。',
    sideABirth: en ? 'Person A birth' : '甲方出生',
    sideBBirth: en ? 'Person B birth' : '乙方出生',
    runFromBirth: en ? 'Start compatibility from both birthdays' : '用双方生日开始合婚',
    charting: en ? 'Charting…' : '排盘中…',
    pickProfileA: en ? 'Pick Person A from profile' : '从档案选甲方',
    pickProfileB: en ? 'Pick Person B (partner) from profile' : '从档案选乙方（伴侣）',
    selectProfile: en ? 'Select profile…' : '选择档案…',
    selectPartner: en ? 'Select partner / other profile…' : '选择伴侣/对方档案…',
    primary: en ? '(primary)' : '（主）',
    profileHintBefore: en ? 'Tip: add a spouse chart in' : '提示：在',
    profileLink: en ? 'My profile' : '我的档案',
    profileHintAfter: en
      ? 'to compare in one click here.'
      : '添加「配偶」关系命盘后，可在此一键对照。',
    sideA: en ? 'Person A' : '甲方',
    sideB: en ? 'Person B' : '乙方',
    runCompare: en ? 'Start compatibility compare' : '开始合婚对照',
    doList: en ? 'Do' : '宜做',
    avoidList: en ? 'Avoid' : '慎做',
    plainDelivery: en ? 'Plain-language summary' : '白话交付',
    copyPlain: en ? 'Copy plain text' : '复制白话',
    copiedPlain: en ? 'Copied' : '已复制白话',
    copyShare: en ? 'Copy share link' : '复制分享链接',
    proNotes: en ? 'Pro notes' : '专业底稿',
    disclaimer: en
      ? 'Compatibility is for relationship rhythm reference only—not a substitute for real choices or legal advice.'
      : '合婚用于相处与节奏参考，不替代双方现实选择与法律咨询。',
    date: en ? 'Date' : '日期',
    time: en ? 'Time' : '时辰',
    gender: en ? 'Gender' : '性别',
    male: en ? 'Male' : '男',
    female: en ? 'Female' : '女',
    name: en ? 'Name' : '称呼',
    birthPlace: en ? 'Birth place (optional, true solar)' : '出生地（可选，真太阳时）',
    placePlaceholder: en ? 'e.g. Shanghai or Chengdu · 104.1°E' : '例如：上海 或 成都 · 104.1°E',
    trueSolarPreviewNote: en
      ? 'Preview · engine estimates true solar from longitude on compare'
      : '预览 · 对盘时引擎按经度估算真太阳时',
    trueSolarNeedLon: en
      ? 'Longitude not recognized: tap a city chip or enter “City · 104.1°E”'
      : '未识别经度：可点城市芯片，或手填「城市 · 104.1°E」',
    placeDefaultHint: en
      ? 'Pick a city to write longitude; without it the engine defaults to Beijing longitude'
      : '选城市可写入经度；未填时引擎默认按北京经度估算',
    dayMaster: en ? 'Day Master' : '日主',
    dayBranch: en ? 'Day branch (spouse palace)' : '日支（夫妻宫）',
    yongShen: en ? 'Favorable (comma-separated)' : '用神（逗号分隔）',
    jiShen: en ? 'Unfavorable (comma-separated)' : '忌神（逗号分隔）',
    currentDayun: en ? 'Current Dayun' : '现行大运',
    dayunQuality: en ? 'Dayun quality' : '大运品质',
    dayunYears: en ? 'Dayun years (optional)' : '大运起止年（可选）',
    dayunPlaceholder: en ? 'e.g. 壬寅' : '如：壬寅',
    yearsPlaceholder: en ? 'e.g. 2024-2033' : '如：2024-2033',
    qualityUnset: en ? 'Not set' : '未填',
    qualityExcellent: en ? 'Very smooth' : '极顺',
    qualityGood: en ? 'Favorable' : '偏顺',
    qualityNeutral: en ? 'Neutral' : '中平',
    qualityBad: en ? 'Tight' : '偏紧',
    qualityPoor: en ? 'Under pressure' : '承压',
    dayunFilledPrefix: en ? 'Dayun' : '已填大运',
    dayunFilledSuffix: en
      ? 'filled — Dayun sync layer will run on compare'
      : '，对照时将启用「大运同步」层',
    dayunFromReport: en
      ? 'Enter via report “Compatibility dual chart (bring this chart)” to auto-fill current Dayun'
      : '从报告「合婚双盘（带入本盘）」进入可自动带入现行大运',
    noteFromShare: en
      ? 'Recomputed compatibility from both birthdays in the share link.'
      : '已从分享链接用双方生日重算合婚结果。',
    noteRemembered: en
      ? 'Filled remembered birthdays on this device — ready to compare.'
      : '已填入本机记住的双方生日，可直接对盘。',
    noteLoadedProfile: (name: string, pillar: string) =>
      en ? `Loaded from profile: ${name} (${pillar})` : `已从档案载入：${name}（${pillar}）`,
    noteProfileMissingPillars: en
      ? 'Profile has a chart but missing pillar summary; pick day pillar manually, or open a full report to bring it in.'
      : '档案有命盘但缺四柱摘要，请手动选日柱；完整报告页可一键带入。',
    notePrefillA: en
      ? 'Person A prefilled from report/link; pick partner as Person B from profile if needed.'
      : '已从报告/链接预填甲方，可再从档案选乙方伴侣。',
    noteNoLogin: en
      ? 'Not signed in or no profile: fill both birthdays, or enter day pillars manually.'
      : '未登录或无档案时，可填双方生日对盘，或手动填写日柱。',
    noteProfileFail: en
      ? 'Could not load profile; fill both birthdays or enter day pillars manually.'
      : '档案读取失败，可填双方生日或手动日柱。',
    noteNoSummary: (label: string) =>
      en
        ? `“${label}” has no pillar summary yet — open its report, then enter compatibility from the report entry.`
        : `「${label}」暂无四柱摘要，请打开其报告后从报告入口进入合婚。`,
    noteLoadedSide: (side: 'a' | 'b', name: string, pillar: string) =>
      en
        ? `Loaded ${side === 'a' ? 'Person A' : 'Person B'}: ${name} ${pillar}`
        : `已载入${side === 'a' ? '甲方' : '乙方'}：${name} ${pillar}`,
    noteInvalidA: (msg?: string) =>
      en
        ? `Person A: ${msg || 'Enter a valid birth date'}`
        : `甲方：${msg || '请填写有效出生日期'}`,
    noteInvalidB: (msg?: string) =>
      en
        ? `Person B: ${msg || 'Enter a valid birth date'}`
        : `乙方：${msg || '请填写有效出生日期'}`,
    placeHintBoth: en ? ' (both)' : '（双方）',
    placeHintA: en ? ' (Person A)' : '（甲方）',
    placeHintB: en ? ' (Person B)' : '（乙方）',
    placeEngineHint: (who: string) =>
      en
        ? ` · Birth place sent to engine${who} for true solar estimate`
        : ` · 出生地已传入引擎${who}估算真太阳时`,
    noteBirthOk: (detail: string) =>
      en ? `Recomputed from both birth details: ${detail}` : `已用双方出生信息重算引擎：${detail}`,
    noteBirthFailDefault: en
      ? 'Could not chart from birth details; check date and time'
      : '出生信息无法排盘，请检查日期时辰',
    shareOk: en
      ? 'Share link copied (names omitted; day pillars / birth params only — recipient can recompute)'
      : '分享链接已复制（不含姓名；仅日柱/生日参数，对方打开可重算）',
    shareFail: en ? 'Copy failed; copy the URL bar parameters manually' : '复制失败，请手动复制地址栏参数',
    trueSolarApprox: (sign: string, absMin: number, hhmm: string) =>
      en
        ? `True solar ~ ${sign}${absMin} min · ${hhmm}`
        : `真太阳时约 ${sign}${absMin} 分 · ${hhmm}`,
    dayunShort: en ? 'Dayun' : '运',
    selfName: en ? 'Self' : '本人',
    otherName: en ? 'Partner' : '对方',
    sideAName: en ? 'Person A' : '甲方',
    sideBName: en ? 'Person B' : '乙方',
  };
}

/** EN result chrome: band labels (engine stays Chinese). */
const HEHUN_BAND_EN: Record<HehunResult['band'], string> = {
  宜深化: 'Deepen carefully',
  可经营: 'Workable',
  宜谨慎: 'Proceed carefully',
  高摩擦: 'High friction',
};

/** Layer titles by engine `layer.key` (fallback by Chinese title). */
const HEHUN_LAYER_TITLE_EN: Record<string, string> = {
  'day-stem': 'Day Master interaction',
  palace: 'Spouse palace (day branch)',
  yong: 'Favorable / unfavorable complement',
  dayun: 'Dayun sync',
  日主互动: 'Day Master interaction',
  '夫妻宫（日支）': 'Spouse palace (day branch)',
  用忌互补: 'Favorable / unfavorable complement',
  大运同步: 'Dayun sync',
};

function hehunBandLabel(band: HehunResult['band'], locale: SiteLocale): string {
  return locale === 'en' ? HEHUN_BAND_EN[band] ?? band : band;
}

function hehunLayerTitle(layer: HehunLayer, locale: SiteLocale): string {
  if (locale !== 'en') return layer.title;
  return HEHUN_LAYER_TITLE_EN[layer.key] ?? HEHUN_LAYER_TITLE_EN[layer.title] ?? layer.title;
}

function hehunHeadlineDisplay(result: HehunResult, locale: SiteLocale): string {
  if (locale !== 'en') return result.headline;
  const bandEn = hehunBandLabel(result.band, 'en');
  return `${result.personA.name} & ${result.personB.name}: ${result.score}/100 · ${bandEn}`;
}

const EMPTY_BIRTH_A: BirthSideValue = {
  date: '',
  time: '12:00',
  gender: 'male',
  name: '本人',
  birthPlace: '',
};
const EMPTY_BIRTH_B: BirthSideValue = {
  date: '',
  time: '12:00',
  gender: 'female',
  name: '对方',
  birthPlace: '',
};

const EMPTY_A: HehunPersonInput = {
  name: '本人',
  dayMaster: '甲',
  dayBranch: '子',
  yongShen: ['木'],
  jiShen: ['金'],
};
const EMPTY_B: HehunPersonInput = {
  name: '对方',
  dayMaster: '庚',
  dayBranch: '午',
  yongShen: ['金'],
  jiShen: ['木'],
};

export default function HehunWorkspace({ locale: localeProp }: { locale?: SiteLocale } = {}) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale;
  const copy = useMemo(() => hehunChromeCopy(locale), [locale]);
  const en = locale === 'en';

  const search = useSearchParams();
  const [a, setA] = useState<HehunPersonInput>(EMPTY_A);
  const [b, setB] = useState<HehunPersonInput>(EMPTY_B);
  const [fortunes, setFortunes] = useState<ProfileFortuneView[]>([]);
  const [loadNote, setLoadNote] = useState('');
  const [result, setResult] = useState<HehunResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [booted, setBooted] = useState(false);
  const [birthA, setBirthA] = useState<BirthSideValue>(EMPTY_BIRTH_A);
  const [birthB, setBirthB] = useState<BirthSideValue>(EMPTY_BIRTH_B);
  const [birthBusy, setBirthBusy] = useState(false);
  const [birthNote, setBirthNote] = useState('');
  const [shareNote, setShareNote] = useState('');

  useEffect(() => {
    trackProductEvent('hehun_page_viewed', {
      hasPrefill: Boolean(search.get('aDm') || search.get('reportId') || search.get('aBirth')),
      reportId: search.get('reportId') || '',
    });
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = hehunChromeCopy(locale);
      const fromQueryA = hehunPersonFromQuery('a', search);
      const fromQueryB = hehunPersonFromQuery('b', search);
      const birthPair = hehunBirthPairFromQuery(search);
      let usedBirthShare = false;

      if (birthPair.a) {
        setBirthA({
          date: birthPair.a.birthDate,
          time: birthPair.a.birthTime,
          gender: birthPair.a.gender,
          name: birthPair.a.name,
          birthPlace: '',
        });
      }
      if (birthPair.b) {
        setBirthB({
          date: birthPair.b.birthDate,
          time: birthPair.b.birthTime,
          gender: birthPair.b.gender,
          name: birthPair.b.name,
          birthPlace: '',
        });
      }

      // Share link with birth pair → recompute engine persons
      if (birthPair.a && birthPair.b && !fromQueryA) {
        try {
          const { personA, personB } = hehunFromBirthPair(
            {
              birthDate: birthPair.a.birthDate,
              birthTime: birthPair.a.birthTime,
              gender: birthPair.a.gender,
              name: birthPair.a.name,
            },
            {
              birthDate: birthPair.b.birthDate,
              birthTime: birthPair.b.birthTime,
              gender: birthPair.b.gender,
              name: birthPair.b.name,
            },
          );
          if (!cancelled) {
            setA(personA);
            setB(personB);
            const r = analyzeHehun(personA, personB);
            setResult(r);
            usedBirthShare = true;
            setLoadNote(c.noteFromShare);
            setBirthNote(
              `${personA.name} ${personA.dayMaster}${personA.dayBranch} × ${personB.name} ${personB.dayMaster}${personB.dayBranch}`,
            );
          }
        } catch {
          // fall through
        }
      } else if (!birthPair.a && !birthPair.b) {
        const remembered = loadRememberedHehunBirthPair();
        if (remembered && !cancelled) {
          setBirthA({
            date: remembered.a.birthDate,
            time: remembered.a.birthTime,
            gender: remembered.a.gender,
            name: remembered.a.name,
            birthPlace: remembered.a.birthPlace || '',
          });
          setBirthB({
            date: remembered.b.birthDate,
            time: remembered.b.birthTime,
            gender: remembered.b.gender,
            name: remembered.b.name,
            birthPlace: remembered.b.birthPlace || '',
          });
          setBirthNote(c.noteRemembered);
        }
      }

      if (fromQueryA) {
        setA(fromQueryA);
        if (fromQueryA.currentDayunGanZhi || fromQueryA.dayMaster) {
          trackProductEvent('hehun_prefill_used', {
            reportId: search.get('reportId') || '',
            hasDayun: Boolean(fromQueryA.currentDayunGanZhi),
          });
        }
      }
      if (fromQueryB) setB(fromQueryB);

      try {
        const res = await fetch('/api/profile/settings', { cache: 'no-store' });
        const data = (await res.json()) as ProfileSettingsResponse & { success?: boolean };
        if (!cancelled && res.ok && data.success && Array.isArray(data.fortunes)) {
          setFortunes(data.fortunes);
          if (!fromQueryA && !usedBirthShare) {
            const primary = data.fortunes.find((f) => f.isPrimary) || data.fortunes[0];
            if (primary) {
              const person = personFromPillarSummary(primary.pillarSummary, {
                name: primary.name || primary.relationLabel || c.selfName,
              });
              if (person) {
                setA(person);
                setLoadNote(
                  c.noteLoadedProfile(
                    person.name || c.selfName,
                    `${person.dayMaster}${person.dayBranch}`,
                  ),
                );
              } else {
                setLoadNote(c.noteProfileMissingPillars);
              }
            }
          } else if (fromQueryA) {
            setLoadNote(c.notePrefillA);
          }
        } else if (!fromQueryA && !usedBirthShare && !cancelled) {
          setLoadNote(c.noteNoLogin);
        }
      } catch {
        if (!cancelled && !usedBirthShare) setLoadNote(c.noteProfileFail);
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, locale]);

  const canRun = useMemo(() => a.dayMaster && a.dayBranch && b.dayMaster && b.dayBranch, [a, b]);

  function applyFortune(side: 'a' | 'b', fortuneId: string) {
    const f = fortunes.find((x) => x.id === fortuneId);
    if (!f) return;
    const person = personFromPillarSummary(f.pillarSummary, {
      name: f.name || f.relationLabel || (side === 'a' ? copy.selfName : copy.otherName),
    });
    if (!person) {
      setLoadNote(copy.noteNoSummary(f.name || f.relation));
      return;
    }
    if (side === 'a') setA(person);
    else setB(person);
    setLoadNote(
      copy.noteLoadedSide(
        side,
        person.name || (side === 'a' ? copy.selfName : copy.otherName),
        `${person.dayMaster}${person.dayBranch}`,
      ),
    );
  }

  function run() {
    const r = analyzeHehun(a, b);
    setResult(r);
    trackProductEvent('hehun_run', {
      score: r.score,
      layers: r.layers.length,
      hasDayun: Boolean(a.currentDayunGanZhi || b.currentDayunGanZhi),
      source: 'manual_or_profile',
    });
  }

  function runFromBirth() {
    const checkA = validateBirthDateString(birthA.date);
    const checkB = validateBirthDateString(birthB.date);
    if (!checkA.ok) {
      setBirthNote(copy.noteInvalidA(checkA.message));
      return;
    }
    if (!checkB.ok) {
      setBirthNote(copy.noteInvalidB(checkB.message));
      return;
    }
    setBirthBusy(true);
    setBirthNote('');
    try {
      const placeA = birthA.birthPlace.trim();
      const placeB = birthB.birthPlace.trim();
      const { personA, personB } = hehunFromBirthPair(
        {
          birthDate: checkA.dateKey || birthA.date,
          birthTime: birthA.time || '12:00',
          gender: birthA.gender,
          name: birthA.name || copy.sideAName,
          ...(placeA ? { birthPlace: placeA } : {}),
        },
        {
          birthDate: checkB.dateKey || birthB.date,
          birthTime: birthB.time || '12:00',
          gender: birthB.gender,
          name: birthB.name || copy.sideBName,
          ...(placeB ? { birthPlace: placeB } : {}),
        },
      );
      setA(personA);
      setB(personB);
      const r = analyzeHehun(personA, personB);
      setResult(r);
      saveRememberedHehunBirthPair({
        a: {
          birthDate: birthA.date,
          birthTime: birthA.time || '12:00',
          gender: birthA.gender,
          name: birthA.name || copy.selfName,
          ...(placeA ? { birthPlace: placeA } : { birthPlace: '' }),
        },
        b: {
          birthDate: birthB.date,
          birthTime: birthB.time || '12:00',
          gender: birthB.gender,
          name: birthB.name || copy.otherName,
          ...(placeB ? { birthPlace: placeB } : { birthPlace: '' }),
        },
      });
      const placeHint =
        placeA || placeB
          ? copy.placeEngineHint(
              placeA && placeB
                ? copy.placeHintBoth
                : placeA
                  ? copy.placeHintA
                  : copy.placeHintB,
            )
          : '';
      setBirthNote(
        copy.noteBirthOk(
          `${personA.name} ${personA.dayMaster}${personA.dayBranch}` +
            (personA.currentDayunGanZhi ? ` · ${copy.dayunShort}${personA.currentDayunGanZhi}` : '') +
            ` × ${personB.name} ${personB.dayMaster}${personB.dayBranch}` +
            (personB.currentDayunGanZhi ? ` · ${copy.dayunShort}${personB.currentDayunGanZhi}` : '') +
            placeHint,
        ),
      );
      trackProductEvent('hehun_run', {
        score: r.score,
        layers: r.layers.length,
        hasDayun: Boolean(personA.currentDayunGanZhi || personB.currentDayunGanZhi),
        source: 'birth_pair',
      });
    } catch (error) {
      setBirthNote(error instanceof Error ? error.message : copy.noteBirthFailDefault);
    } finally {
      setBirthBusy(false);
    }
  }

  async function copyPlain() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.plainForCouple);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyShareLink() {
    // 隐私默认：不附带真实姓名，仅结构 + 生日参数
    const href = buildHehunHref({
      personA: a,
      personB: b,
      birthA: birthA.date
        ? {
            birthDate: birthA.date,
            birthTime: birthA.time,
            gender: birthA.gender,
          }
        : null,
      birthB: birthB.date
        ? {
            birthDate: birthB.date,
            birthTime: birthB.time,
            gender: birthB.gender,
          }
        : null,
      privacy: true,
    });
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${href}` : href;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote(copy.shareOk);
      setTimeout(() => setShareNote(''), 2800);
      trackProductEvent('hehun_run', {
        score: result?.score || 0,
        layers: result?.layers.length || 0,
        source: 'share_link_privacy',
      });
    } catch {
      setShareNote(copy.shareFail);
    }
  }

  if (!booted) {
    return (
      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-6 text-[13px] text-[#64748b]">
        {copy.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KnowledgeBaseStamp />
        <p className="text-[11px] text-[#64748b]">
          {a.currentDayunGanZhi || b.currentDayunGanZhi ? copy.layersFour : copy.layersThree}
        </p>
      </div>

      {loadNote ? (
        <p className="rounded-[8px] border border-[#e9e5ff] bg-[#f5f3ff] px-3 py-2 text-[12px] text-[#5b21b6]">
          {loadNote}
        </p>
      ) : null}

      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <div className="text-[13px] font-semibold text-[#0f172a]">{copy.birthSectionTitle}</div>
        <p className="mt-1 text-[11px] text-[#64748b]">{copy.birthSectionDesc}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <BirthSideForm
            title={copy.sideABirth}
            value={birthA}
            onChange={setBirthA}
            copy={copy}
            en={en}
          />
          <BirthSideForm
            title={copy.sideBBirth}
            value={birthB}
            onChange={setBirthB}
            copy={copy}
            en={en}
          />
        </div>
        {birthNote ? (
          <p className="mt-2 rounded-[8px] border border-[#e9e5ff] bg-[#f5f3ff] px-3 py-2 text-[12px] text-[#5b21b6]">
            {birthNote}
          </p>
        ) : null}
        <button
          type="button"
          disabled={birthBusy || !birthA.date || !birthB.date}
          onClick={runFromBirth}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--ink-1)] bg-white px-5 text-[14px] font-medium text-[color:var(--ink-1)] disabled:opacity-50"
        >
          {birthBusy ? copy.charting : copy.runFromBirth}
        </button>
      </div>

      {fortunes.length > 0 ? (
        <div className="grid gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-4 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold text-[#64748b]">
            {copy.pickProfileA}
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              defaultValue=""
              onChange={(e) => e.target.value && applyFortune('a', e.target.value)}
            >
              <option value="">{copy.selectProfile}</option>
              {fortunes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.relationLabel || f.relation}
                  {f.pillarSummary ? ` · ${f.pillarSummary.slice(0, 12)}` : ''}
                  {f.isPrimary ? copy.primary : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold text-[#64748b]">
            {copy.pickProfileB}
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              defaultValue=""
              onChange={(e) => e.target.value && applyFortune('b', e.target.value)}
            >
              <option value="">{copy.selectPartner}</option>
              {fortunes.map((f) => (
                <option key={`b-${f.id}`} value={f.id}>
                  {f.name || f.relationLabel || f.relation}
                  {f.relation && f.relation !== 'self' ? ` · ${f.relationLabel || f.relation}` : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="sm:col-span-2 text-[11px] text-[#94a3b8]">
            {copy.profileHintBefore}
            <Link href="/profile" className="mx-1 text-[color:var(--ink-1)] underline-offset-2 hover:underline">
              {copy.profileLink}
            </Link>
            {copy.profileHintAfter}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PersonForm title={copy.sideA} value={a} onChange={setA} copy={copy} />
        <PersonForm title={copy.sideB} value={b} onChange={setB} copy={copy} />
      </div>

      <button
        type="button"
        disabled={!canRun}
        onClick={run}
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-5 text-[14px] font-medium text-white disabled:opacity-50"
      >
        {copy.runCompare}
      </button>

      {result ? (
        <div className="space-y-4 border-y border-[color:var(--hairline)] py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{result.knowledgeStamp}</div>
              <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">
                {hehunHeadlineDisplay(result, locale)}
              </h2>
              <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
                {result.personA.name} {result.personA.dayPillar}
                {result.personA.dayun ? ` · ${copy.dayunShort}${result.personA.dayun}` : ''} ×{' '}
                {result.personB.name} {result.personB.dayPillar}
                {result.personB.dayun ? ` · ${copy.dayunShort}${result.personB.dayun}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[24px] tabular-nums text-[color:var(--ink-1)]">{result.score}</div>
              <div className="text-[11px] text-[color:var(--ink-5)]">
                {hehunBandLabel(result.band, locale)}
              </div>
            </div>
          </div>

          <div
            className={`grid gap-0 border-t border-[color:var(--hairline)] ${
              result.layers.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'
            }`}
          >
            {result.layers.map((layer) => (
              <div
                key={layer.key}
                className="border-b border-[color:var(--hairline)] py-3 md:border-r md:px-3 md:first:pl-0 md:last:border-r-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[12px] font-medium text-[color:var(--ink-1)]">
                    {hehunLayerTitle(layer, locale)}
                  </div>
                  <span className="font-mono text-[12px] tabular-nums text-[color:var(--ink-5)]">
                    {layer.score}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{layer.summary}</p>
                <ul className="mt-2 space-y-0.5">
                  {layer.details.map((d) => (
                    <li key={d} className="text-[11px] text-[color:var(--ink-5)]">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid gap-0 border-t border-[color:var(--hairline)] md:grid-cols-2">
            <div className="border-b border-[color:var(--hairline)] py-3 md:border-b-0 md:border-r md:pr-4">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{copy.doList}</div>
              <ul className="mt-1.5 space-y-1">
                {result.doList.map((x) => (
                  <li key={x} className="text-[12px] text-[color:var(--ink-2)]">
                    · {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-3 md:pl-4">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{copy.avoidList}</div>
              <ul className="mt-1.5 space-y-1">
                {result.avoidList.map((x) => (
                  <li key={x} className="text-[12px] text-[color:var(--ink-2)]">
                    · {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[color:var(--hairline)] pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-[12px] font-medium text-[color:var(--ink-1)]">{copy.plainDelivery}</div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyPlain}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  {copied ? copy.copiedPlain : copy.copyPlain}
                </button>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  {copy.copyShare}
                </button>
              </div>
            </div>
            {shareNote ? (
              <p className="mt-1 text-[11px] text-[color:var(--brand-strong)]">{shareNote}</p>
            ) : null}
            <pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-[1.65] text-[color:var(--ink-3)]">
              {result.plainForCouple}
            </pre>
          </div>

          <div className="border-t border-[color:var(--hairline)] pt-3">
            <div className="text-[12px] font-medium text-[color:var(--ink-1)]">{copy.proNotes}</div>
            <ul className="mt-1.5 space-y-1">
              {result.proNotes.map((n) => (
                <li key={n} className="text-[12px] text-[color:var(--ink-5)]">
                  · {n}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-[color:var(--ink-5)]">{copy.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}

function BirthSideForm({
  title,
  value,
  onChange,
  copy,
  en,
}: {
  title: string;
  value: BirthSideValue;
  onChange: (v: BirthSideValue) => void;
  copy: HehunChromeCopy;
  en: boolean;
}) {
  const quickCities = useMemo(() => getQuickPickCities().slice(0, 8), []);
  const resolvedLon = useMemo(
    () => resolveCityLongitude(value.birthPlace),
    [value.birthPlace],
  );
  const activeCityId = useMemo(() => {
    if (!value.birthPlace) return null;
    const hit = quickCities.find(
      (c) =>
        value.birthPlace.includes(c.zh) ||
        value.birthPlace.toLowerCase().includes(c.en.toLowerCase()),
    );
    return hit?.id ?? null;
  }, [value.birthPlace, quickCities]);

  /** Educational client preview — engine also applies true solar when place resolves. */
  const trueSolarPreview = useMemo(() => {
    if (!value.date || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !resolvedLon) return null;
    const [y, m, d] = value.date.split('-').map(Number);
    const [hh, mm] = (value.time || '12:00').split(':').map((n) => Number(n) || 0);
    if (!y || !m || !d) return null;
    try {
      const st = calculateTrueSolarTime(y, m, d, hh, mm, 0, resolvedLon.longitude, 8);
      const sign = st.correctionMinutes >= 0 ? '+' : '−';
      const absMin = Math.abs(Math.round(st.correctionMinutes));
      const hhmm = `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}`;
      return copy.trueSolarApprox(sign, absMin, hhmm);
    } catch {
      return null;
    }
  }, [value.date, value.time, resolvedLon, copy]);

  function pickCity(city: CityLongitude) {
    onChange({ ...value, birthPlace: formatPlaceWithLongitude(city.zh, city.longitude) });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
      <div className="birth-form-title">{title}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="birth-form-label">
          {copy.date}
          <input
            type="date"
            className="birth-form-control"
            min={birthDateInputMin()}
            max={birthDateInputMax()}
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
          />
        </label>
        <label className="birth-form-label">
          {copy.time}
          <input
            type="time"
            className="birth-form-control"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
          />
        </label>
        <label className="birth-form-label">
          {copy.gender}
          <select
            className="birth-form-control"
            value={value.gender}
            onChange={(e) =>
              onChange({ ...value, gender: e.target.value === 'female' ? 'female' : 'male' })
            }
          >
            <option value="male">{copy.male}</option>
            <option value="female">{copy.female}</option>
          </select>
        </label>
        <label className="birth-form-label">
          {copy.name}
          <input
            className="birth-form-control"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
      </div>

      <div className="mt-2">
        <label className="birth-form-label">
          {copy.birthPlace}
          <input
            type="text"
            className="birth-form-control"
            value={value.birthPlace}
            onChange={(e) => onChange({ ...value, birthPlace: e.target.value })}
            placeholder={copy.placePlaceholder}
          />
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {quickCities.map((city) => {
            const active = activeCityId === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => pickCity(city)}
                className={
                  active
                    ? 'rounded-full border border-[color:var(--ink-1)] bg-[color:var(--ink-1)] px-2.5 py-0.5 text-[11px] text-white'
                    : 'rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[11px] text-[color:var(--ink-3)] transition hover:border-[color:var(--ink-1)] hover:text-[color:var(--ink-1)]'
                }
              >
                {en ? city.en : city.zh}
              </button>
            );
          })}
        </div>
        {trueSolarPreview ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/60 px-2.5 py-0.5 text-[11px] text-[color:var(--ink-2)]">
              {trueSolarPreview}
            </span>
            <span className="text-[11px] text-[color:var(--ink-5)]">{copy.trueSolarPreviewNote}</span>
          </div>
        ) : value.birthPlace.trim() && !resolvedLon ? (
          <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">{copy.trueSolarNeedLon}</p>
        ) : (
          <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">{copy.placeDefaultHint}</p>
        )}
      </div>
    </div>
  );
}

function PersonForm({
  title,
  value,
  onChange,
  copy,
}: {
  title: string;
  value: HehunPersonInput;
  onChange: (v: HehunPersonInput) => void;
  copy: HehunChromeCopy;
}) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="text-[13px] font-bold text-[#0f172a]">{title}</div>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        {copy.name}
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={value.name || ''}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-semibold text-[#64748b]">
          {copy.dayMaster}
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.dayMaster}
            onChange={(e) => onChange({ ...value, dayMaster: e.target.value })}
          >
            {GAN.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          {copy.dayBranch}
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.dayBranch}
            onChange={(e) => onChange({ ...value, dayBranch: e.target.value })}
          >
            {ZHI.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        {copy.yongShen}
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={(value.yongShen || []).join(',')}
          onChange={(e) =>
            onChange({
              ...value,
              yongShen: e.target.value
                .split(/[,，\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        {copy.jiShen}
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={(value.jiShen || []).join(',')}
          onChange={(e) =>
            onChange({
              ...value,
              jiShen: e.target.value
                .split(/[,，\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-semibold text-[#64748b]">
          {copy.currentDayun}
          <input
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
            placeholder={copy.dayunPlaceholder}
            value={value.currentDayunGanZhi || ''}
            onChange={(e) =>
              onChange({
                ...value,
                currentDayunGanZhi: e.target.value.trim().slice(0, 2) || undefined,
              })
            }
          />
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          {copy.dayunQuality}
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.currentDayunQuality || ''}
            onChange={(e) =>
              onChange({
                ...value,
                currentDayunQuality: e.target.value || undefined,
              })
            }
          >
            <option value="">{copy.qualityUnset}</option>
            <option value="excellent">{copy.qualityExcellent}</option>
            <option value="good">{copy.qualityGood}</option>
            <option value="neutral">{copy.qualityNeutral}</option>
            <option value="bad">{copy.qualityBad}</option>
            <option value="poor">{copy.qualityPoor}</option>
          </select>
        </label>
      </div>
      <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
        {copy.dayunYears}
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          placeholder={copy.yearsPlaceholder}
          value={value.currentDayunYears || ''}
          onChange={(e) =>
            onChange({
              ...value,
              currentDayunYears: e.target.value.trim() || undefined,
            })
          }
        />
      </label>
      {value.currentDayunGanZhi ? (
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          {copy.dayunFilledPrefix} {value.currentDayunGanZhi}
          {value.currentDayunQuality ? ` · ${value.currentDayunQuality}` : ''}
          {value.currentDayunYears ? ` · ${value.currentDayunYears}` : ''}
          {copy.dayunFilledSuffix}
        </p>
      ) : (
        <p className="mt-2 text-[10px] text-[#94a3b8]">{copy.dayunFromReport}</p>
      )}
    </div>
  );
}
