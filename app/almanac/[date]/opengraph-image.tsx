import { ImageResponse } from 'next/og';

/** Node runtime: edge + CJK without fonts often 502 on PM2. Latin-only layout is reliable. */
export const runtime = 'nodejs';
export const alt = 'Life K-Line · Chinese Almanac';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dayNum = ok ? String(Number(date.slice(8, 10)) || date.slice(8, 10)) : '—';
  const ymd = ok ? date : 'Almanac';
  const weekday = ok
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC',
      })
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #0f3d2e 0%, #1a5c45 46%, #eef4ef 46%)',
          padding: 56,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', color: '#ecfdf5' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              opacity: 0.92,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            LIFE K-LINE · ALMANAC
          </div>
          <div style={{ display: 'flex', fontSize: 32, marginTop: 18, opacity: 0.95 }}>
            {ymd}
            {weekday ? `  ·  ${weekday}` : ''}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 148,
              fontWeight: 800,
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            {dayNum}
          </div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 10, opacity: 0.9 }}>
            Tong-shu · 12 hours · personal day match
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 16,
            padding: 28,
            color: '#14532d',
          }}
        >
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700 }}>
            Daily Chinese almanac (yi / ji)
          </div>
          <div style={{ display: 'flex', fontSize: 22, marginTop: 10, opacity: 0.85 }}>
            Public calendar layer + day-master structure when birth data is bound
          </div>
          <div style={{ display: 'flex', fontSize: 20, marginTop: 16, opacity: 0.7 }}>
            www.life-kline.com/almanac/{ok ? date : ''}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
