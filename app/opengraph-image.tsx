import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '人生K线 · 看清结构、阶段、环境与下一步动作';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 决策台风 og:image 1200x630
// 米色底 + 抽象 K 线 + wordmark + tagline + 信号金菱
// spec: docs/superpowers/specs/2026-05-07-design-system-final.md §9.2

const PILLARS = [
  { x: 60, y: 280, h: 200 },
  { x: 130, y: 250, h: 240 },
  { x: 200, y: 200, h: 300 },
  { x: 270, y: 180, h: 320 },
  { x: 340, y: 220, h: 270 },
  { x: 410, y: 160, h: 360 },
  { x: 480, y: 200, h: 300 },
  { x: 550, y: 240, h: 250 },
  { x: 620, y: 180, h: 350, mine: true },
  { x: 690, y: 160, h: 380, mine: true },
  { x: 760, y: 220, h: 290 },
  { x: 830, y: 250, h: 240 },
  { x: 900, y: 270, h: 210 },
  { x: 970, y: 240, h: 250 },
  { x: 1040, y: 200, h: 300 },
  { x: 1110, y: 220, h: 270 },
];

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #f9faf5 0%, #eef5ef 48%, #f4efe8 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px 84px',
          fontFamily: 'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          position: 'relative',
        }}
      >
        {/* 抽象 K 线背景 — 用 div 而不是 svg，避免 satori 多子节点检测 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            zIndex: 0,
          }}
        >
          <svg width="1200" height="630" viewBox="0 0 1200 630">
            <line
              x1="0"
              y1="380"
              x2="1200"
              y2="380"
              stroke="rgba(22,33,29,0.12)"
              strokeDasharray="6 6"
            />
            {PILLARS.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width="14"
                height={b.h}
                fill={b.mine ? '#0b5f55' : 'rgba(11,95,85,0.18)'}
              />
            ))}
            <path d="M 627 130 L 643 146 L 627 162 L 611 146 Z" fill="#c9a14a" />
          </svg>
        </div>

        {/* 顶部：brand mark + LIFE KLINE wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', width: '56px', height: '56px' }}>
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <rect
                x="3.5"
                y="9"
                width="2.5"
                height="14"
                rx="0.5"
                stroke="#074840"
                strokeWidth="1.4"
              />
              <rect
                x="10"
                y="6"
                width="2.5"
                height="20"
                rx="0.5"
                stroke="#074840"
                strokeWidth="1.4"
              />
              <rect x="16.5" y="3.5" width="2.5" height="25" rx="0.5" fill="#0b5f55" />
              <rect
                x="23"
                y="10"
                width="2.5"
                height="13"
                rx="0.5"
                stroke="#074840"
                strokeWidth="1.4"
              />
              <line
                x1="0"
                y1="16"
                x2="32"
                y2="16"
                stroke="#074840"
                strokeWidth="0.7"
                strokeDasharray="2 2"
                opacity="0.45"
              />
              <path d="M 28.5 19.5 L 30.5 21.5 L 28.5 23.5 L 26.5 21.5 Z" fill="#c9a14a" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#0a120e',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              人生K线
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#8b9690',
                letterSpacing: '0.25em',
                fontFamily: '"JetBrains Mono", monospace',
                display: 'flex',
              }}
            >
              LIFE KLINE
            </div>
          </div>
        </div>

        {/* 主标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: '40px',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#0a120e',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: '900px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ display: 'flex' }}>看清你的结构、阶段、环境</span>
            <span style={{ display: 'flex' }}>
              与<span style={{ color: '#0b5f55' }}>下一步动作</span>
            </span>
          </div>
          <div
            style={{
              marginTop: '24px',
              fontSize: '24px',
              fontWeight: 500,
              color: '#3a4a44',
              lineHeight: 1.5,
              maxWidth: '780px',
              display: 'flex',
            }}
          >
            真太阳时校正 · 世界易判断框架 · v3 多 Agent 报告链路
          </div>
        </div>

        {/* 底部信号条 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {['真太阳时', '600+ 话术库', '多 Agent 链路'].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '4px',
                  border: '1px solid rgba(22,33,29,0.16)',
                  background: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#3a4a44',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#a87f2c',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ display: 'flex', width: '14px', height: '14px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M 7 1 L 13 7 L 7 13 L 1 7 Z" fill="#c9a14a" />
              </svg>
            </div>
            <span style={{ display: 'flex' }}>www.life-kline.com</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
