import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 地点搜索：优先 Google Geocoding（若配置 GOOGLE_MAPS_API_KEY），
 * 否则 OpenStreetMap Nominatim（需合规 User-Agent）。
 */
export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ success: false, error: '请输入地址关键词' }, { status: 400 });
  }

  const googleKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  try {
    if (googleKey) {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', q);
      url.searchParams.set('key', googleKey);
      url.searchParams.set('language', 'zh-CN');
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      const data = (await res.json()) as {
        results?: Array<{
          formatted_address?: string;
          place_id?: string;
          geometry?: { location?: { lat: number; lng: number } };
          address_components?: unknown;
        }>;
        status?: string;
      };
      if (data.status === 'OK' && data.results?.length) {
        const items = data.results.slice(0, 8).map((r) => ({
          address: r.formatted_address || q,
          lat: r.geometry?.location?.lat ?? 0,
          lng: r.geometry?.location?.lng ?? 0,
          placeId: r.place_id,
          name: r.formatted_address,
          source: 'google' as const,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.formatted_address || q)}`,
          embedUrl: `https://www.google.com/maps?q=${r.geometry?.location?.lat},${r.geometry?.location?.lng}&z=17&output=embed`,
        }));
        return NextResponse.json({ success: true, provider: 'google', items });
      }
    }

    // Nominatim fallback
    const nom = new URL('https://nominatim.openstreetmap.org/search');
    nom.searchParams.set('q', q);
    nom.searchParams.set('format', 'json');
    nom.searchParams.set('limit', '8');
    nom.searchParams.set('accept-language', 'zh');
    const res = await fetch(nom.toString(), {
      headers: {
        'User-Agent': 'LifeKLineSpaceLab/1.0 (contact: ops@life-kline.com)',
      },
      next: { revalidate: 0 },
    });
    const data = (await res.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
      place_id?: number;
      name?: string;
    }>;
    const items = (data || []).slice(0, 8).map((r) => {
      const lat = Number(r.lat) || 0;
      const lng = Number(r.lon) || 0;
      const address = r.display_name || q;
      return {
        address,
        lat,
        lng,
        placeId: r.place_id ? String(r.place_id) : undefined,
        name: r.name || address.split(',')[0],
        source: 'nominatim' as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        embedUrl: `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`,
      };
    });
    return NextResponse.json({
      success: true,
      provider: googleKey ? 'google_fallback_nominatim' : 'nominatim',
      items,
      hint: googleKey
        ? undefined
        : '未配置 GOOGLE_MAPS_API_KEY 时使用 OpenStreetMap；仍可打开 Google 地图链接确认。',
    });
  } catch (error) {
    console.error('[geo/place-search]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '搜索失败' },
      { status: 500 },
    );
  }
}
