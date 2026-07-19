/**
 * Shared birth-city longitudes for true-solar UI and place resolve.
 * Engine (`fortune-engine`) also has a table; explicit "City · 104.1°E" in
 * birthPlace is preferred so parseLongitudeFromBirthPlace hits high confidence.
 */

export type CityLongitude = {
  id: string;
  zh: string;
  en: string;
  /** Degrees east (negative = west) */
  longitude: number;
};

/** Common cities used as quick-picks (approx. city-center longitudes). */
export const CITY_LONGITUDES: readonly CityLongitude[] = [
  { id: 'beijing', zh: '北京', en: 'Beijing', longitude: 116.4 },
  { id: 'shanghai', zh: '上海', en: 'Shanghai', longitude: 121.5 },
  { id: 'guangzhou', zh: '广州', en: 'Guangzhou', longitude: 113.3 },
  { id: 'shenzhen', zh: '深圳', en: 'Shenzhen', longitude: 114.1 },
  { id: 'hangzhou', zh: '杭州', en: 'Hangzhou', longitude: 120.2 },
  { id: 'nanjing', zh: '南京', en: 'Nanjing', longitude: 118.8 },
  { id: 'chengdu', zh: '成都', en: 'Chengdu', longitude: 104.1 },
  { id: 'chongqing', zh: '重庆', en: 'Chongqing', longitude: 106.6 },
  { id: 'wuhan', zh: '武汉', en: 'Wuhan', longitude: 114.3 },
  { id: 'xian', zh: '西安', en: 'Xi’an', longitude: 108.9 },
  { id: 'tianjin', zh: '天津', en: 'Tianjin', longitude: 117.2 },
  { id: 'suzhou', zh: '苏州', en: 'Suzhou', longitude: 120.6 },
  { id: 'hongkong', zh: '香港', en: 'Hong Kong', longitude: 114.2 },
  { id: 'taipei', zh: '台北', en: 'Taipei', longitude: 121.6 },
  { id: 'singapore', zh: '新加坡', en: 'Singapore', longitude: 103.8 },
  { id: 'tokyo', zh: '东京', en: 'Tokyo', longitude: 139.7 },
  { id: 'newyork', zh: '纽约', en: 'New York', longitude: -74.0 },
  { id: 'losangeles', zh: '洛杉矶', en: 'Los Angeles', longitude: -118.2 },
  { id: 'london', zh: '伦敦', en: 'London', longitude: -0.1 },
  { id: 'paris', zh: '巴黎', en: 'Paris', longitude: 2.4 },
] as const;

/** Compact quick-picks for analyze / tools birth forms. */
export const QUICK_PICK_CITY_IDS = [
  'beijing',
  'shanghai',
  'guangzhou',
  'chengdu',
  'shenzhen',
  'hangzhou',
  'wuhan',
  'xian',
  'hongkong',
  'taipei',
] as const;

export function getQuickPickCities(): CityLongitude[] {
  const byId = new Map(CITY_LONGITUDES.map((c) => [c.id, c]));
  return QUICK_PICK_CITY_IDS.map((id) => byId.get(id)).filter(
    (c): c is CityLongitude => Boolean(c),
  );
}

/**
 * Encode place so the engine's parseLongitudeFromBirthPlace sees explicit lon:
 * matches `(-?\d+(?:\.\d+)?)\s*°?\s*[经E]`.
 * West longitudes are signed negative with °E (engine does not match W).
 * Example: `成都 · 104.1°E`, `纽约 · -74°E`
 */
export function formatPlaceWithLongitude(nameZh: string, longitude: number): string {
  const lon = Math.round(longitude * 10) / 10;
  return `${nameZh.trim()} · ${lon}°E`;
}

/** Parse explicit longitude from free-text place (aligned with fortune-engine). */
export function parseLongitudeFromPlaceText(birthPlace?: string | null): number | null {
  if (!birthPlace) return null;
  const direct =
    birthPlace.match(/(-?\d+(?:\.\d+)?)\s*°?\s*[经E]/i) ||
    birthPlace.match(/longitude\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
  if (!direct) return null;
  const value = Number(direct[1]);
  return Number.isFinite(value) && value >= -180 && value <= 180 ? value : null;
}

export type ResolvedCityLongitude = {
  longitude: number;
  matchedPlace: string;
  city: CityLongitude | null;
  source: 'explicit' | 'city';
  confidence: 'high' | 'medium';
};

/**
 * Resolve longitude from birthPlace free text.
 * Prefers explicit °E/°W / 经, then longest city-name substring match.
 */
export function resolveCityLongitude(birthPlace?: string | null): ResolvedCityLongitude | null {
  const input = birthPlace?.trim() || '';
  if (!input) return null;

  const explicit = parseLongitudeFromPlaceText(input);
  if (explicit !== null) {
    const city =
      CITY_LONGITUDES.find((c) => input.includes(c.zh) || input.toLowerCase().includes(c.en.toLowerCase())) ||
      null;
    return {
      longitude: explicit,
      matchedPlace: city?.zh || 'explicit-longitude',
      city,
      source: 'explicit',
      confidence: 'high',
    };
  }

  // Prefer longer names first so 洛杉矶 beats 杉 if ever added
  const ranked = [...CITY_LONGITUDES].sort((a, b) => b.zh.length - a.zh.length);
  for (const city of ranked) {
    if (input.includes(city.zh)) {
      return {
        longitude: city.longitude,
        matchedPlace: city.zh,
        city,
        source: 'city',
        confidence: 'medium',
      };
    }
  }
  const lower = input.toLowerCase();
  for (const city of ranked) {
    if (lower.includes(city.en.toLowerCase())) {
      return {
        longitude: city.longitude,
        matchedPlace: city.zh,
        city,
        source: 'city',
        confidence: 'medium',
      };
    }
  }

  return null;
}

/**
 * Educational city list (ziwei edu UI) — finite longitudes only for chips;
 * "overseas" sentinel stays in edu-chart consumers if needed.
 */
export function toEduCityLongitudes(): Array<CityLongitude & { longitude: number }> {
  return CITY_LONGITUDES.filter((c) =>
    ['beijing', 'shanghai', 'guangzhou', 'chengdu'].includes(c.id),
  ).map((c) => ({ ...c }));
}
