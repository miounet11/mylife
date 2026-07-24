import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 逆地理：坐标 → 地址
 * 优先 Google，回退 Nominatim。
 */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ success: false, error: '需要 lat/lng' }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ success: false, error: '坐标超出范围' }, { status: 400 });
  }

  const googleKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  try {
    if (googleKey) {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('key', googleKey);
      url.searchParams.set('language', 'zh-CN');
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      const data = (await res.json()) as {
        status?: string;
        results?: Array<{
          formatted_address?: string;
          place_id?: string;
          address_components?: Array<{ long_name?: string; types?: string[] }>;
        }>;
      };
      if (data.status === 'OK' && data.results?.[0]) {
        const r = data.results[0];
        const city =
          r.address_components?.find((c) => c.types?.includes('locality'))?.long_name ||
          r.address_components?.find((c) => c.types?.includes('administrative_area_level_1'))
            ?.long_name ||
          '';
        return NextResponse.json({
          success: true,
          provider: 'google',
          address: r.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          name: city || r.formatted_address?.split(/[,，]/)[0],
          placeId: r.place_id,
          lat,
          lng,
          city,
        });
      }
    }

    const nom = new URL('https://nominatim.openstreetmap.org/reverse');
    nom.searchParams.set('lat', String(lat));
    nom.searchParams.set('lon', String(lng));
    nom.searchParams.set('format', 'json');
    nom.searchParams.set('accept-language', 'zh');
    nom.searchParams.set('zoom', '18');
    const res = await fetch(nom.toString(), {
      headers: {
        'User-Agent': 'LifeKLineSpaceLab/1.0 (contact: ops@life-kline.com)',
      },
      next: { revalidate: 0 },
    });
    const data = (await res.json()) as {
      display_name?: string;
      name?: string;
      place_id?: number;
      address?: Record<string, string>;
    };
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality ||
      data.address?.state ||
      '';
    return NextResponse.json({
      success: true,
      provider: googleKey ? 'google_fallback_nominatim' : 'nominatim',
      address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      name: data.name || city || data.display_name?.split(',')[0],
      placeId: data.place_id ? String(data.place_id) : undefined,
      lat,
      lng,
      city,
    });
  } catch (error) {
    console.error('[geo/reverse]', error);
    return NextResponse.json(
      {
        success: true,
        provider: 'coords',
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        name: '当前位置',
        lat,
        lng,
      },
      { status: 200 },
    );
  }
}
