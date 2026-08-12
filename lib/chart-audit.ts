/**
 * 排盘核对：把「你填的时辰」和「盘上实际四柱」摊开。
 * 用户反馈 1984-10-08 18:25 看到的是寒露前/早上盘（癸酉…庚辰）。
 */

import { calculateFourPillars } from '@/lib/fortune-engine';
import { pillarsToFingerprint } from '@/lib/calculation-identity';

export type ChartAuditVariant = {
  key: string;
  label: string;
  fingerprint: string;
  note: string;
  matchesStored: boolean;
};

export type ChartAuditPack = {
  clockLabel: string;
  jieqiLine: string;
  storedFingerprint: string;
  likelyMorningDefault: boolean;
  variants: ChartAuditVariant[];
  headline: string;
  why: string;
  recomputeHref: string;
};

function fp(
  birthDate: Date,
  time: string,
  opts?: { sect?: 1 | 2; useTrueSolarTime?: boolean; birthPlace?: string | null },
): string {
  try {
    const pillars = calculateFourPillars(birthDate, time, 8, {
      sect: opts?.sect ?? 2,
      useTrueSolarTime: Boolean(opts?.useTrueSolarTime),
      birthPlace: opts?.birthPlace || null,
    });
    return pillarsToFingerprint(pillars);
  } catch {
    return '';
  }
}

function parseYmd(birthDate: string): Date | null {
  const m = `${birthDate || ''}`.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(d.getTime()) ? d : null;
}

function jieqiLine(birthDate: string, birthTime: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Solar } = require('lunar-javascript') as {
      Solar: {
        fromYmdHms: (
          y: number, m: number, d: number, h: number, mi: number, s: number,
        ) => {
          getLunar: () => {
            getPrevJie: () => { toString?: () => string; getSolar?: () => { toYmdHms?: () => string } };
            getNextJie: () => { toString?: () => string; getSolar?: () => { toYmdHms?: () => string } };
          };
        };
      };
    };
    const [y, mo, d] = birthDate.split('-').map(Number);
    const [h, mi] = (birthTime || '12:00').split(':').map(Number);
    const lunar = Solar.fromYmdHms(y, mo, d, h || 12, mi || 0, 0).getLunar();
    const prev = lunar.getPrevJie();
    const next = lunar.getNextJie();
    const prevName = prev?.toString?.() || '上一节';
    const prevAt = prev?.getSolar?.()?.toYmdHms?.() || '';
    const nextName = next?.toString?.() || '下一节';
    const nextAt = next?.getSolar?.()?.toYmdHms?.() || '';
    return `上一节气 ${prevName}${prevAt ? ` ${prevAt}` : ''}；下一节 ${nextName}${nextAt ? ` ${nextAt}` : ''}。月柱按交节时刻换，不是按日历日整日切。`;
  } catch {
    return '月柱按节气交节换月，同一天早晚可能不是同一个月柱。';
  }
}

export function buildChartAudit(input: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  storedFingerprint?: string | null;
  useSeparateZiHour?: boolean;
  reportId?: string | null;
}): ChartAuditPack | null {
  const birthDate = `${input.birthDate || ''}`.trim().slice(0, 10);
  const dateObj = parseYmd(birthDate);
  if (!dateObj) return null;

  const clock = `${input.birthTime || ''}`.trim() || '12:00';
  const hour = Number(clock.split(':')[0] || 12);
  const stored = `${input.storedFingerprint || ''}`.replace(/\s+/g, ' ').trim();
  const place = input.birthPlace || null;

  const asClock = fp(dateObj, clock, { sect: 2, birthPlace: place });
  const asNoon = fp(dateObj, '12:00', { sect: 2, birthPlace: place });
  const asMorning = fp(dateObj, '07:00', { sect: 2, birthPlace: place });
  const asLateZi = fp(dateObj, clock, { sect: 1, birthPlace: place });
  const asSolar = fp(dateObj, clock, { sect: 2, useTrueSolarTime: true, birthPlace: place });

  const variants: ChartAuditVariant[] = [
    {
      key: 'clock',
      label: `按填写 ${clock}`,
      fingerprint: asClock,
      note: '钟表时 · 晚子不换日（默认）',
      matchesStored: Boolean(stored && asClock && stored === asClock),
    },
    {
      key: 'morning',
      label: '若按当天 07:00',
      fingerprint: asMorning,
      note: '寒露等交节之前，月柱可能还是上个月',
      matchesStored: Boolean(stored && asMorning && stored === asMorning),
    },
    {
      key: 'noon',
      label: '若按 12:00（未填时辰常见默认）',
      fingerprint: asNoon,
      note: '时辰未知时常落到午时',
      matchesStored: Boolean(stored && asNoon && stored === asNoon),
    },
    {
      key: 'latezi',
      label: '晚子换日',
      fingerprint: asLateZi,
      note: '23:00–23:59 按次日日柱',
      matchesStored: Boolean(stored && asLateZi && stored === asLateZi),
    },
    {
      key: 'solar',
      label: '真太阳时',
      fingerprint: asSolar,
      note: '按出生地经度校正',
      matchesStored: Boolean(stored && asSolar && stored === asSolar),
    },
  ];

  const seen = new Set<string>();
  const unique: ChartAuditVariant[] = [];
  for (const v of variants) {
    if (!v.fingerprint) continue;
    const dedupeKey = `${v.key}:${v.fingerprint}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    unique.push(v);
  }

  const morningHit = Boolean(
    stored &&
      asMorning &&
      stored === asMorning &&
      asClock &&
      stored !== asClock &&
      Number.isFinite(hour) &&
      hour >= 12,
  );

  const matched = unique.find((v) => v.matchesStored);
  const headline = morningHit
    ? `盘上四柱更像「当天早上 / 交节前」，不像你填的 ${clock}`
    : matched
      ? `当前盘与「${matched.label}」一致`
      : stored
        ? `当前盘 ${stored}`
        : `按 ${clock} 排为 ${asClock || '—'}`;

  const why = morningHit
    ? `同一天可能跨节气。例如寒露若在上午，07:00 仍是上月，${clock} 已换月。若你记得时辰是下午，请用同一公历日期和 ${clock} 重算，不要用「只填日期」。`
    : `月柱看交节时刻，时柱看时辰。晚子换日、真太阳时会改日柱或时柱，不会悄悄改用神算法。`;

  const params = new URLSearchParams();
  params.set('birthDate', birthDate);
  params.set('birthTime', clock);
  if (place) params.set('place', String(place).slice(0, 40));
  if (input.reportId) params.set('fromReport', input.reportId);
  params.set('source', 'chart_audit_recompute');

  return {
    clockLabel: `${birthDate} ${clock}`,
    jieqiLine: jieqiLine(birthDate, clock),
    storedFingerprint: stored,
    likelyMorningDefault: morningHit,
    variants: unique,
    headline,
    why,
    recomputeHref: `/analyze?${params.toString()}`,
  };
}

export function chartAuditToChatAddon(pack: ChartAuditPack): string {
  const lines = [
    '【排盘核对】用户在质疑四柱。只解释选项，不要改口编一套新盘。',
    `填写：${pack.clockLabel}`,
    pack.storedFingerprint ? `盘上：${pack.storedFingerprint}` : '',
    pack.jieqiLine,
    ...pack.variants.slice(0, 4).map((v) => `${v.label} → ${v.fingerprint}${v.matchesStored ? '（与盘上相同）' : ''}`),
    pack.likelyMorningDefault
      ? '很像时辰没带上、按早上/交节前排的。请引导用同一公历+时辰重算。'
      : '若用户给的「应该是」与以上任一变体相同，承认那种算法选择；否则请他核对应公历还是农历。',
  ].filter(Boolean);
  return lines.join('\n');
}
