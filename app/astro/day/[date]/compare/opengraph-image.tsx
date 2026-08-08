import { ImageResponse } from 'next/og';
import { buildDayComparePack } from '@/lib/astro/day-compare-engine';

/** Node + Latin + display:flex (Satori-safe). Live engine ranks. */
export const runtime = 'nodejs';
export const alt = 'Life K-Line · Zodiac day ranking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const pack = ok ? buildDayComparePack(date) : null;
  const top = (pack?.topSigns || []).slice(0, 5);
  const low = (pack?.lowSigns || []).slice(0, 3);
  const dayGan = pack?.dayGanZhi || '—';
  const max = Math.max(100, ...top.map((r) => r.composite), 1);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 42%, #f8fafc 42%)',
          padding: 48,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', color: '#e2e8f0' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, fontWeight: 700, opacity: 0.9 }}>
            LIFE K-LINE · DAY RANK
          </div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, marginTop: 12 }}>
            {ok ? date : 'Day'} · Day-stem {dayGan}
          </div>
          <div style={{ display: 'flex', fontSize: 22, marginTop: 8, opacity: 0.85 }}>
            Engine ranking · same tong-shu layer as almanac
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            marginTop: 28,
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: '#047857', marginBottom: 12 }}>
              Top match
            </div>
            {top.length ? (
              top.map((r, i) => {
                const w = Math.max(12, Math.round((r.composite / max) * 320));
                return (
                  <div
                    key={r.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 10,
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', width: 28, fontSize: 16, fontWeight: 700, color: '#64748b' }}>
                      {i + 1}
                    </div>
                    <div style={{ display: 'flex', width: 120, fontSize: 18, fontWeight: 700, color: '#1c1e21' }}>
                      {r.title.slice(0, 8)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        width: w,
                        height: 14,
                        borderRadius: 8,
                        background: r.composite >= 62 ? '#047857' : '#3b5998',
                      }}
                    />
                    <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: '#3b5998' }}>
                      {r.composite}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', fontSize: 18, color: '#64748b' }}>Ranking unavailable</div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 280,
              background: 'rgba(255,255,255,0.98)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: '#b45309', marginBottom: 12 }}>
              Steady / caution
            </div>
            {low.map((r) => (
              <div
                key={r.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  fontSize: 18,
                  color: '#1c1e21',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex' }}>{r.title.slice(0, 8)}</span>
                <span style={{ display: 'flex', color: '#b45309', fontWeight: 800 }}>{r.composite}</span>
              </div>
            ))}
            <div style={{ display: 'flex', marginTop: 'auto', fontSize: 14, color: '#64748b' }}>
              www.life-kline.com/astro/day/{ok ? date : ''}/compare
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
