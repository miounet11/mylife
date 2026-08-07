import { ImageResponse } from 'next/og';

/** Node + Latin + display:flex — matches working almanac OG pattern. */
export const runtime = 'nodejs';
export const alt = 'Life K-Line · Zodiac week';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const ok = /^\d{4}-W\d{2}$/i.test(weekId);
  const label = ok ? weekId.toUpperCase() : 'WEEK';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #312e81 0%, #4c1d95 46%, #f5f3ff 46%)',
          padding: 56,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', color: '#ede9fe' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              opacity: 0.92,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            LIFE K-LINE · ZODIAC WEEK
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, marginTop: 24, lineHeight: 1 }}>
            {label}
          </div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 16, opacity: 0.9 }}>
            12-sign weekly ranking · engine averages
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 16,
            padding: 28,
            color: '#4c1d95',
          }}
        >
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700 }}>
            Open full week compare
          </div>
          <div style={{ display: 'flex', fontSize: 20, marginTop: 12, opacity: 0.75 }}>
            www.life-kline.com/astro/week/{ok ? weekId : ''}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
