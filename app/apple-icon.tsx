import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon 180x180 — 决策台风
// iOS 添加到主屏幕时使用的圆角图标
// 复用 app/icon.svg 的 K 线四柱构图，但调整为 180x180 尺寸
export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0b5f55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
          }}
        >
          <svg width="180" height="180" viewBox="0 0 100 100">
            {/* 四柱：年 / 月 / 日（实心纸白）/ 时 */}
            <rect
              x="16"
              y="32"
              width="9"
              height="40"
              rx="1.2"
              fill="none"
              stroke="#f5f7f2"
              strokeWidth="2.4"
            />
            <rect
              x="34"
              y="22"
              width="9"
              height="56"
              rx="1.2"
              fill="none"
              stroke="#f5f7f2"
              strokeWidth="2.4"
            />
            <rect x="52" y="14" width="9" height="70" rx="1.2" fill="#f5f7f2" />
            <rect
              x="70"
              y="36"
              width="9"
              height="36"
              rx="1.2"
              fill="none"
              stroke="#f5f7f2"
              strokeWidth="2.4"
            />
            {/* 判断基线 */}
            <line
              x1="4"
              y1="50"
              x2="96"
              y2="50"
              stroke="#f5f7f2"
              strokeWidth="1.4"
              strokeDasharray="4 3"
              opacity="0.36"
            />
            {/* 信号金菱 */}
            <path d="M 85 60 L 90 65 L 85 70 L 80 65 Z" fill="#c9a14a" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
