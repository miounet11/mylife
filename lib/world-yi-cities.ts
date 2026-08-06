/**
 * World Yi city theme hub helpers.
 * Cities are an *environment layer* in structure → timing → environment → action → risk,
 * not lucky/unlucky labels. Feeds /world-yi/cities and insight city pages.
 */

import { GEO_CITY_SEEDS } from '@/lib/seo';

export type WorldYiCityCard = {
  slug: string;
  href: string;
  hrefEn: string;
  city: string;
  cityEn: string;
  region: string;
  regionEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  focus: string[];
  focusEn: string[];
  /** Soft tempo tag for UI chips — not a luck rating */
  tempo: 'high' | 'dense' | 'steady' | 'hub';
  analyzeHref: string;
};

function tempoFor(city: string, region: string): WorldYiCityCard['tempo'] {
  if (/上海|深圳|纽约|香港|新加坡|迪拜|东京|伦敦/.test(city)) return 'high';
  if (/北京|广州|杭州|洛杉矶/.test(city)) return 'dense';
  if (/武汉|西安|香港|新加坡|迪拜/.test(city) || /湾区|枢纽|中东/.test(region)) return 'hub';
  return 'steady';
}

const TEMPO_LABEL: Record<WorldYiCityCard['tempo'], { zh: string; en: string }> = {
  high: { zh: '高节奏', en: 'High tempo' },
  dense: { zh: '高密度', en: 'Dense' },
  steady: { zh: '稳节奏', en: 'Steady' },
  hub: { zh: '枢纽型', en: 'Hub' },
};

export function tempoLabel(tempo: WorldYiCityCard['tempo'], en = false) {
  return en ? TEMPO_LABEL[tempo].en : TEMPO_LABEL[tempo].zh;
}

export function listWorldYiCityCards(): WorldYiCityCard[] {
  return GEO_CITY_SEEDS.map((c) => {
    const key = c.slug.replace(/^world-yi-city-/, '');
    return {
      slug: c.slug,
      href: `/insights/city/${c.slug}`,
      hrefEn: `/insights/city/world-yi-en-city-${key}`,
      city: c.city,
      cityEn: c.cityEn,
      region: c.region,
      regionEn: c.regionEn,
      title: c.title,
      titleEn: c.titleEn,
      summary: c.summary,
      summaryEn: c.summaryEn,
      focus: c.focus,
      focusEn: c.focusEn,
      tempo: tempoFor(c.city, c.region),
      analyzeHref: `/analyze?source=world_yi_city&intent=yearly&city=${encodeURIComponent(c.city)}`,
    };
  });
}

export function groupWorldYiCitiesByRegion(): Array<{
  region: string;
  regionEn: string;
  cities: WorldYiCityCard[];
}> {
  const map = new Map<string, WorldYiCityCard[]>();
  for (const card of listWorldYiCityCards()) {
    const list = map.get(card.region) || [];
    list.push(card);
    map.set(card.region, list);
  }
  return Array.from(map.entries()).map(([region, cities]) => ({
    region,
    regionEn: cities[0]?.regionEn || region,
    cities,
  }));
}

/** One-line method blurb for city theme (shareable, anti-superstition). */
export const WORLD_YI_CITY_METHOD_BLURB =
  '城市不是吉凶标签，而是环境层压力测试：成本、行业密度、社交半径与节奏，会放大或削弱你的用神发挥方式。世界易路径：结构 → 时位 → 环境 → 动作 → 风险。';
