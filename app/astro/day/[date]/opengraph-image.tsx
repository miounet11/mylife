import { ImageResponse } from 'next/og';

/** Node runtime: edge + CJK without fonts often 502 on PM2. Latin-only + display:flex (Satori). */
export const runtime = 'nodejs';
export const alt = 'Life K-Line · Zodiac day';
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
  const ymd = ok ? date : 'Zodiac day';
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
          background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 46%, #eef2ff 46%)',
          padding: 56,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', color: '#e0e7ff' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              opacity: 0.92,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            LIFE K-LINE · ZODIAC DAY
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
            12 signs · engine match · tong-shu
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 16,
            padding: 28,
            color: '#312e81',
          }}
        >
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700 }}>
            Structured daily ranking
          </div>
          <div style={{ display: 'flex', fontSize: 22, marginTop: 10, opacity: 0.85 }}>
            Public zodiac layer · same engine as almanac
          </div>
          <div style={{ display: 'flex', fontSize: 20, marginTop: 16, opacity: 0.7 }}>
            www.life-kline.com/astro/day/{ok ? date : ''}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
