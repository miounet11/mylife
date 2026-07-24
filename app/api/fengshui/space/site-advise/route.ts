import { NextRequest, NextResponse } from 'next/server';
import {
  adviseSites,
  type SiteCandidateInput,
  type SitePoiCounts,
  type SitePurpose,
} from '@/lib/fengshui/space/site-advisor';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PURPOSES: SitePurpose[] = ['house', 'shop', 'yinzhai'];

function emptyPoi(radiusM: number): SitePoiCounts {
  return {
    transit: 0,
    retail: 0,
    food: 0,
    education: 0,
    park: 0,
    office: 0,
    medical: 0,
    cemetery: 0,
    water: 0,
    road: 0,
    other: 0,
    radiusM,
    source: 'overpass',
  };
}

/** OpenStreetMap Overpass：统计半径内设施，用于人流/配套启发 */
async function fetchOverpassPoi(
  lat: number,
  lng: number,
  radiusM = 400,
): Promise<SitePoiCounts | null> {
  const detailQuery = `
[out:json][timeout:12];
(
  node(around:${radiusM},${lat},${lng})[railway~"station|halt|subway_entrance"];
  node(around:${radiusM},${lat},${lng})[public_transport];
  node(around:${radiusM},${lat},${lng})[highway=bus_stop];
  node(around:${radiusM},${lat},${lng})[shop];
  node(around:${radiusM},${lat},${lng})[amenity~"restaurant|cafe|fast_food|bar|food_court|school|kindergarten|college|university|hospital|clinic|doctors|grave_yard"];
  node(around:${radiusM},${lat},${lng})[leisure~"park|garden"];
  node(around:${radiusM},${lat},${lng})[office];
  node(around:${radiusM},${lat},${lng})[landuse=cemetery];
  way(around:${radiusM},${lat},${lng})[natural=water];
  way(around:${radiusM},${lat},${lng})[waterway];
);
out tags center ${80};
`.trim();

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'LifeKLineSiteAdvisor/1.0 (ops@life-kline.com)',
        },
        body: `data=${encodeURIComponent(detailQuery)}`,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        elements?: Array<{ tags?: Record<string, string> }>;
      };
      const p = emptyPoi(radiusM);
      for (const el of data.elements || []) {
        const t = el.tags || {};
        if (t.railway || t.public_transport || t.highway === 'bus_stop') p.transit += 1;
        else if (t.shop) p.retail += 1;
        else if (
          t.amenity === 'restaurant' ||
          t.amenity === 'cafe' ||
          t.amenity === 'fast_food' ||
          t.amenity === 'bar' ||
          t.amenity === 'food_court'
        ) {
          p.food += 1;
        } else if (
          t.amenity === 'school' ||
          t.amenity === 'kindergarten' ||
          t.amenity === 'college' ||
          t.amenity === 'university'
        ) {
          p.education += 1;
        } else if (t.leisure === 'park' || t.leisure === 'garden') p.park += 1;
        else if (t.office) p.office += 1;
        else if (
          t.amenity === 'hospital' ||
          t.amenity === 'clinic' ||
          t.amenity === 'doctors'
        ) {
          p.medical += 1;
        } else if (t.landuse === 'cemetery' || t.amenity === 'grave_yard') p.cemetery += 1;
        else if (t.natural === 'water' || t.waterway) p.water += 1;
        else p.other += 1;
      }
      // road: approximate from density if few roads tagged as nodes
      if (p.transit + p.retail + p.food > 0) p.road = Math.min(8, 1 + Math.floor((p.retail + p.food) / 4));
      return p;
    } catch {
      // try next endpoint
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const purposeRaw = String(body.purpose || 'house') as SitePurpose;
    const purpose = PURPOSES.includes(purposeRaw) ? purposeRaw : 'house';
    const enrichPoi = body.enrichPoi !== false;
    const radiusM = Math.min(800, Math.max(200, Number(body.radiusM) || 400));

    const rawList = Array.isArray(body.candidates) ? body.candidates : [];
    if (rawList.length === 0) {
      return NextResponse.json(
        { success: false, error: '请至少添加 1 个候选地址（可先用地图搜索）' },
        { status: 400 },
      );
    }

    const candidates: SiteCandidateInput[] = [];
    for (const raw of rawList.slice(0, 6)) {
      const lat = Number(raw.lat);
      const lng = Number(raw.lng);
      const address = String(raw.address || raw.name || '').trim();
      if (!address || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      let poi: Partial<SitePoiCounts> | undefined = raw.poi;
      if (enrichPoi && !poi) {
        const fetched = await fetchOverpassPoi(lat, lng, radiusM);
        if (fetched) poi = fetched;
      }

      candidates.push({
        id: raw.id ? String(raw.id) : undefined,
        label: raw.label ? String(raw.label).slice(0, 40) : undefined,
        address,
        lat,
        lng,
        facing: raw.facing ? String(raw.facing) : undefined,
        areaSqm: raw.areaSqm != null ? Number(raw.areaSqm) : undefined,
        floor: raw.floor != null ? Number(raw.floor) : undefined,
        industry: raw.industry ? String(raw.industry).slice(0, 40) : undefined,
        corner: Boolean(raw.corner),
        streetFront: raw.streetFront !== false,
        hasBackMountain: Boolean(raw.hasBackMountain),
        openMingTang: Boolean(raw.openMingTang),
        notes: raw.notes ? String(raw.notes).slice(0, 200) : undefined,
        poi,
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: '候选无效：需要 address + lat + lng' },
        { status: 400 },
      );
    }

    const result = adviseSites(purpose, candidates);
    return NextResponse.json({
      success: true,
      result,
      enriched: enrichPoi,
      message: result.summary,
    });
  } catch (error) {
    console.error('[site-advise]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '选址评估失败' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    purposes: PURPOSES,
    labels: {
      house: '选房子（阳宅）',
      shop: '选铺面 · 人流',
      yinzhai: '选阴宅',
    },
    usage: 'POST { purpose, candidates:[{address,lat,lng,...}], enrichPoi?: true }',
  });
}
