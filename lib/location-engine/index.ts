import {
  CHINA_REGIONS,
  getCitiesByProvince,
  getDistrictsByCity,
  getLocationCoordinates,
  getProvinces,
  searchLocation,
} from './china-regions';
import { searchWorldLocation } from './world-regions';

export interface LocationOption {
  id: string;
  scope: 'china' | 'world';
  displayName: string;
  fullName: string;
  country: string;
  countryEn: string;
  province?: string;
  city?: string;
  district?: string;
  nameEn?: string;
  lng: number;
  lat: number;
  tz: number;
  timezoneLabel: string;
}

const SPECIAL_LOCATIONS: LocationOption[] = [
  {
    id: 'china:中国 香港:114.174:8',
    scope: 'china',
    displayName: '香港',
    fullName: '中国 香港',
    country: '中国',
    countryEn: 'China',
    city: '香港',
    lng: 114.174,
    lat: 22.320,
    tz: 8,
    timezoneLabel: 'UTC+8',
  },
  {
    id: 'china:中国 澳门:113.543:8',
    scope: 'china',
    displayName: '澳门',
    fullName: '中国 澳门',
    country: '中国',
    countryEn: 'China',
    city: '澳门',
    lng: 113.543,
    lat: 22.199,
    tz: 8,
    timezoneLabel: 'UTC+8',
  },
  {
    id: 'china:中国 台湾 台北:121.565:8',
    scope: 'china',
    displayName: '台北',
    fullName: '中国 台湾 台北',
    country: '中国',
    countryEn: 'China',
    province: '台湾',
    city: '台北',
    lng: 121.565,
    lat: 25.033,
    tz: 8,
    timezoneLabel: 'UTC+8',
  },
];

const WORLD_TIMEZONE_STANDARD_LONGITUDES: Record<string, number> = {
  'Asia/Tokyo': 135,
  'Asia/Seoul': 135,
  'Asia/Singapore': 105,
  'Asia/Kuala_Lumpur': 105,
  'Asia/Bangkok': 105,
  'Asia/Ho_Chi_Minh': 105,
  'Asia/Jakarta': 105,
  'Asia/Makassar': 120,
  'Asia/Manila': 120,
  'Asia/Kolkata': 82.5,
  'Asia/Dubai': 60,
  'Asia/Jerusalem': 35,
  'Asia/Novosibirsk': 105,
  'Asia/Yekaterinburg': 75,
  'Asia/Vladivostok': 150,
  'Europe/London': 0,
  'Europe/Dublin': 0,
  'Europe/Paris': 15,
  'Europe/Berlin': 15,
  'Europe/Rome': 15,
  'Europe/Madrid': 15,
  'Europe/Amsterdam': 15,
  'Europe/Brussels': 15,
  'Europe/Zurich': 15,
  'Europe/Vienna': 15,
  'Europe/Stockholm': 15,
  'Europe/Oslo': 15,
  'Europe/Copenhagen': 15,
  'Europe/Helsinki': 30,
  'Europe/Moscow': 45,
  'Europe/Warsaw': 15,
  'Europe/Prague': 15,
  'Europe/Athens': 30,
  'Europe/Lisbon': 0,
  'Europe/Istanbul': 30,
  'America/New_York': -75,
  'America/Chicago': -90,
  'America/Denver': -105,
  'America/Los_Angeles': -120,
  'America/Phoenix': -105,
  'America/Toronto': -75,
  'America/Vancouver': -120,
  'America/Edmonton': -105,
  'America/Mexico_City': -90,
  'America/Cancun': -75,
  'Pacific/Honolulu': -150,
  'America/Sao_Paulo': -45,
  'America/Argentina/Buenos_Aires': -45,
  'America/Santiago': -60,
  'America/Lima': -75,
  'America/Bogota': -75,
  'Australia/Sydney': 150,
  'Australia/Melbourne': 150,
  'Australia/Brisbane': 150,
  'Australia/Perth': 120,
  'Australia/Adelaide': 142.5,
  'Pacific/Auckland': 180,
  'Africa/Johannesburg': 30,
  'Africa/Cairo': 30,
  'Africa/Casablanca': 0,
  'Africa/Nairobi': 45,
  'Africa/Lagos': 15,
};

function formatTimezoneLabel(offset: number) {
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
}

function timezoneOffsetFromLabel(timezoneLabel: string) {
  const standardLongitude = WORLD_TIMEZONE_STANDARD_LONGITUDES[timezoneLabel] ?? 0;
  return standardLongitude / 15;
}

function makeLocationId(scope: 'china' | 'world', fullName: string, lng: number, tz: number) {
  return `${scope}:${fullName}:${lng}:${tz}`;
}

function mapChinaResult(result: ReturnType<typeof searchLocation>[number]): LocationOption {
  return {
    id: makeLocationId('china', result.fullName, result.longitude, 8),
    scope: 'china',
    displayName: result.district || result.city || result.province,
    fullName: result.fullName,
    country: '中国',
    countryEn: 'China',
    province: result.province,
    city: result.city,
    district: result.district,
    lng: result.longitude,
    lat: result.latitude,
    tz: 8,
    timezoneLabel: 'UTC+8',
  };
}

function mapWorldResult(result: ReturnType<typeof searchWorldLocation>[number]): LocationOption {
  const tz = timezoneOffsetFromLabel(result.timezone);
  return {
    id: makeLocationId('world', result.fullName, result.longitude, tz),
    scope: 'world',
    displayName: result.city || result.country,
    fullName: result.fullName,
    country: result.country,
    countryEn: result.country,
    city: result.city,
    nameEn: result.city,
    lng: result.longitude,
    lat: result.latitude,
    tz,
    timezoneLabel: result.timezone,
  };
}

function dedupeLocations(items: LocationOption[]) {
  return items.filter((item, index, array) => index === array.findIndex((current) => current.id === item.id));
}

function scoreLocation(item: LocationOption, query: string) {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!normalizedQuery) return 0;

  const fields = [
    item.displayName,
    item.fullName,
    item.country,
    item.countryEn,
    item.province || '',
    item.city || '',
    item.district || '',
    item.nameEn || '',
  ].map((value) => value.toLowerCase().replace(/\s+/g, ''));

  if (fields.includes(normalizedQuery)) return 120;
  if (fields.some((field) => field.startsWith(normalizedQuery))) return 100;
  if (fields.some((field) => field.includes(normalizedQuery))) return 80;
  return 0;
}

export function searchLocations(query: string, limit: number = 20): LocationOption[] {
  if (!query.trim()) {
    return getFeaturedLocations().slice(0, limit);
  }

  const chinaResults = searchLocation(query).map(mapChinaResult);
  const worldResults = searchWorldLocation(query).map(mapWorldResult);
  const specialResults = SPECIAL_LOCATIONS.filter((location) => scoreLocation(location, query) > 0);

  return dedupeLocations([...specialResults, ...chinaResults, ...worldResults])
    .map((item) => ({ item, score: scoreLocation(item, query) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.item.scope !== right.item.scope) return left.item.scope === 'china' ? -1 : 1;
      return left.item.fullName.localeCompare(right.item.fullName, 'zh-CN');
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function getFeaturedLocations(): LocationOption[] {
  const worldFeatured = [
    ...searchWorldLocation('Tokyo').slice(0, 1),
    ...searchWorldLocation('Seoul').slice(0, 1),
    ...searchWorldLocation('Singapore').slice(0, 1),
    ...searchWorldLocation('New York').slice(0, 1),
    ...searchWorldLocation('Hong Kong').slice(0, 1),
    ...searchWorldLocation('Taipei').slice(0, 1),
  ].map(mapWorldResult);

  const hardcodedChina = [
    buildChinaLocation('北京市', '北京市'),
    buildChinaLocation('上海市', '上海市'),
    buildChinaLocation('广东省', '广州市'),
    buildChinaLocation('广东省', '深圳市'),
    buildChinaLocation('浙江省', '杭州市'),
    buildChinaLocation('四川省', '成都市'),
  ].filter(Boolean) as LocationOption[];

  return dedupeLocations([...hardcodedChina, ...SPECIAL_LOCATIONS, ...worldFeatured]);
}

export function getChinaProvinces() {
  return getProvinces();
}

export function getChinaCities(provinceName: string) {
  return getCitiesByProvince(provinceName);
}

export function getChinaDistricts(provinceName: string, cityName: string) {
  return getDistrictsByCity(provinceName, cityName);
}

export function buildChinaLocation(provinceName: string, cityName?: string, districtName?: string): LocationOption | null {
  const coordinates = getLocationCoordinates(provinceName, cityName, districtName);
  if (!coordinates) return null;

  const fullName = [provinceName, cityName, districtName].filter(Boolean).join(' ');
  return {
    id: makeLocationId('china', fullName, coordinates.longitude, 8),
    scope: 'china',
    displayName: districtName || cityName || provinceName,
    fullName,
    country: '中国',
    countryEn: 'China',
    province: provinceName,
    city: cityName,
    district: districtName,
    lng: coordinates.longitude,
    lat: coordinates.latitude,
    tz: 8,
    timezoneLabel: 'UTC+8',
  };
}

export function getChinaRegionSummary() {
  const provinceCount = CHINA_REGIONS.length;
  const cityCount = CHINA_REGIONS.reduce((count, province) => count + province.cities.length, 0);
  const districtCount = CHINA_REGIONS.reduce(
    (count, province) => count + province.cities.reduce((cityCount, city) => cityCount + city.districts.length, 0),
    0
  );

  return { provinceCount, cityCount, districtCount };
}

export function getTimezoneDisplay(location: LocationOption) {
  return location.scope === 'china' ? formatTimezoneLabel(location.tz) : location.timezoneLabel;
}
