import { ImageResponse } from 'next/og';

/** Hub OG — Latin-only for reliable Satori rendering without CJK fonts. */
export const runtime = 'nodejs';
export const alt = 'Life K-Line · Chinese Almanac Hub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
            LIFE K-LINE
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: 20,
            }}
          >
            Chinese Almanac
          </div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 18, opacity: 0.92 }}>
            Yi / Ji · 12 double-hours · personal day fortune
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
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700 }}>
            Canonical day URLs · multi-skin · multi-region
          </div>
          <div style={{ display: 'flex', fontSize: 20, marginTop: 12, opacity: 0.75 }}>
            www.life-kline.com/almanac
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
