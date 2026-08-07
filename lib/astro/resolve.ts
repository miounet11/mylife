import { ASTRO_SIGNS, getSignByKey } from '@/lib/astro/signs-data';
import { approximateRisingByHour, getRisingByKey } from '@/lib/astro/rising-data';
import { resolveZoneFromDate } from '@/lib/astro/zones-48';
import type { AstroSignProfile, AstroZone48, RisingProfile, SignKey } from '@/lib/astro/types';

function mdToNum(md: string): number {
  const [m, d] = md.split('-').map(Number);
  return m * 100 + d;
}

export function resolveSunSignFromDate(date: string | null | undefined): AstroSignProfile | null {
  if (!date) return null;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const md = mdToNum(`${m[2]}-${m[3]}`);
  for (const sign of ASTRO_SIGNS) {
    const start = mdToNum(sign.start);
    const end = mdToNum(sign.end);
    if (start > end) {
      if (md >= start || md <= end) return sign;
    } else if (md >= start && md <= end) {
      return sign;
    }
  }
  return null;
}

export type AstroLookupResult = {
  date: string;
  hour: number | null;
  sun: AstroSignProfile | null;
  zone: AstroZone48 | null;
  risingApprox: RisingProfile | null;
  risingKey: SignKey | null;
  disclaimer: string;
};

export function lookupAstro(date: string, hour?: number | null): AstroLookupResult {
  const sun = resolveSunSignFromDate(date);
  const zone = resolveZoneFromDate(date);
  let risingKey: SignKey | null = null;
  let risingApprox: RisingProfile | null = null;
  if (hour != null && Number.isFinite(hour)) {
    risingKey = approximateRisingByHour(Number(hour));
    risingApprox = getRisingByKey(risingKey);
  }
  return {
    date,
    hour: hour != null && Number.isFinite(hour) ? Number(hour) : null,
    sun,
    zone,
    risingApprox,
    risingKey,
    disclaimer:
      '太阳星座与 48 星区按民用公历分界；上升为地方时粗算（约 2 小时一换），精确上升需出生地经纬度与真太阳时。表达层参考，非医疗投资建议。可与八字结构报告、世界易方法交叉使用。',
  };
}

export function relatedWorldYiLinks(signKey?: SignKey | null) {
  const base = [
    { href: '/world-yi', label: '世界易总论' },
    { href: '/world-yi/era-timing', label: '时代天时' },
    { href: '/world-yi/cities', label: '城市主题' },
    { href: '/almanac', label: '今日黄历' },
    { href: '/analyze?source=astro', label: '结构报告' },
    { href: '/tools/zodiac', label: '写入数据底座' },
  ];
  if (!signKey) return base;
  const sign = getSignByKey(signKey);
  if (!sign) return base;
  // Domain emphasis by element
  if (sign.element === '火') {
    return [{ href: '/world-yi/domains/career', label: '事业分科' }, ...base];
  }
  if (sign.element === '土') {
    return [{ href: '/world-yi/domains/wealth', label: '财富分科' }, ...base];
  }
  if (sign.element === '水') {
    return [{ href: '/world-yi/domains/relationship', label: '关系分科' }, ...base];
  }
  return [{ href: '/world-yi/global', label: '全球对照' }, ...base];
}
