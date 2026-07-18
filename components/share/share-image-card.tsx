import * as React from 'react';

export type ShareImageCardProps = {
  /** Brand wordmark, default 人生K线 */
  brand?: string;
  /** Main title, e.g. 日主甲木 · 当前宜稳 */
  title: string;
  /** 2–3 short supporting lines */
  lines?: string[];
  /** Footer left/right; defaults to structure disclaimer + domain */
  footerLeft?: string;
  footerRight?: string;
  /**
   * Layout preset:
   * - portrait: 1080×1350 friendly (小红书)
   * - landscape: 1200×630 friendly (OG / WeChat link card)
   */
  variant?: 'portrait' | 'landscape';
  className?: string;
};

/**
 * Pure presentational share card for conclusion screenshots.
 * Linear / editorial aesthetic — no superstition marketing, no fake stats.
 * Sized via aspect-ratio so it can be scaled for 1080×1350 or 1200×630 export.
 */
export function ShareImageCard({
  brand = '人生K线',
  title,
  lines = [],
  footerLeft = '结构参考',
  footerRight = 'life-kline.com',
  variant = 'portrait',
  className = '',
}: ShareImageCardProps) {
  const isPortrait = variant === 'portrait';
  const displayLines = lines.filter(Boolean).slice(0, 3);

  return (
    <div
      className={`relative overflow-hidden bg-[#f7f8f9] text-[#0f1115] ${className}`}
      style={{
        aspectRatio: isPortrait ? '1080 / 1350' : '1200 / 630',
        width: '100%',
        maxWidth: isPortrait ? 360 : 480,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
      data-share-image-card
      data-variant={variant}
    >
      {/* Soft paper gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #eef0f3 0%, #ffffff 42%, #f7f8f9 100%)',
        }}
      />

      {/* Abstract K-line decoration */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] w-full opacity-40"
        viewBox="0 0 1080 400"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="220"
          x2="1080"
          y2="220"
          stroke="#d0d4db"
          strokeDasharray="6 8"
          strokeWidth="1.5"
        />
        {[
          [80, 160, 90],
          [160, 120, 130],
          [240, 140, 100],
          [320, 90, 160],
          [400, 110, 140],
          [480, 70, 190],
          [560, 100, 150],
          [640, 55, 210],
          [720, 95, 155],
          [800, 75, 175],
          [880, 115, 125],
          [960, 85, 165],
        ].map(([x, y, h], i) => {
          const active = i === 7;
          return (
            <rect
              key={x}
              x={x}
              y={y}
              width="18"
              height={h}
              rx="2"
              fill={active ? '#4338ca' : '#d0d4db'}
              opacity={active ? 0.9 : 0.55}
            />
          );
        })}
        <path
          d="M 900 300 L 918 318 L 900 336 L 882 318 Z"
          fill="#c9a227"
          opacity="0.85"
        />
      </svg>

      {/* Content */}
      <div
        className={`relative flex h-full flex-col ${
          isPortrait ? 'px-8 py-9' : 'px-7 py-6'
        }`}
      >
        {/* Brand row */}
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-black tracking-tight text-white"
            style={{ background: '#4338ca' }}
            aria-hidden
          >
            K
          </span>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-[#0f1115]">
              {brand}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8b929e]">
              LIFE KLINE
            </div>
          </div>
        </div>

        {/* Divider accent */}
        <div
          className="mt-6 h-px w-12"
          style={{ background: '#4338ca', opacity: 0.55 }}
        />

        {/* Title */}
        <h2
          className={`mt-5 font-semibold leading-[1.25] tracking-[-0.02em] text-[#0f1115] ${
            isPortrait ? 'text-[28px]' : 'text-[24px]'
          }`}
        >
          {title}
        </h2>

        {/* Lines */}
        {displayLines.length > 0 ? (
          <ul className={`mt-4 space-y-2 ${isPortrait ? 'max-w-[92%]' : 'max-w-full'}`}>
            {displayLines.map((line) => (
              <li
                key={line}
                className={`leading-[1.55] text-[#3c4149] ${
                  isPortrait ? 'text-[15px]' : 'text-[13px]'
                }`}
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex-1" />

        {/* Disclaimer + footer */}
        <p className="text-[11px] leading-[1.45] text-[#8b929e]">
          结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[#e6e8eb] pt-3">
          <span className="text-[11px] font-medium tracking-wide text-[#6b7280]">
            {footerLeft}
          </span>
          <span className="font-mono text-[11px] tracking-wide text-[#8b929e]">
            {footerRight}
          </span>
        </div>
      </div>
    </div>
  );
}
