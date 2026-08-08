/**
 * Data-bound SVG frames for 星座/通书 structured surfaces.
 * Prefer these over AI bitmaps when scores, ranks, or labels must be exact.
 */

import type { ReactNode } from 'react';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type AstroRankRow = {
  key: string;
  title: string;
  score: number;
  stance?: PersonalDayStance;
};

const INK = '#1c1e21';
const MUTED = '#65676b';
const HAIR = '#e4e6eb';
const BRAND = '#3b5998';
const PAPER = '#f7f5f0';
const EMERALD = '#047857';
const AMBER = '#b45309';
const SLATE = '#64748b';

function barColor(score: number, stance?: PersonalDayStance) {
  if (stance === 'push' || score >= 62) return EMERALD;
  if (stance === 'conserve' || score <= 42) return AMBER;
  return BRAND;
}

function FrameShell({
  title,
  eyebrow,
  subtitle,
  width = 960,
  height = 540,
  children,
  className = '',
}: {
  title: string;
  eyebrow: string;
  subtitle?: string;
  width?: number;
  height?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${title}${subtitle ? ` · ${subtitle}` : ''}`}
      className={`h-auto w-full rounded-2xl border border-[color:var(--hairline)] bg-white shadow-sm ${className}`}
    >
      <defs>
        <linearGradient id="astroPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PAPER} />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="astroEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.18" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="url(#astroPaper)" rx="18" />
      <rect x="0" y="0" width="10" height={height} fill="url(#astroEdge)" rx="4" />
      <text x="36" y="40" fill={BRAND} fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="1.5">
        {eyebrow}
      </text>
      <text x="36" y="74" fill={INK} fontSize="26" fontFamily="system-ui,sans-serif" fontWeight="800">
        {title}
      </text>
      {subtitle ? (
        <text x="36" y="102" fill={MUTED} fontSize="14" fontFamily="system-ui,sans-serif">
          {subtitle}
        </text>
      ) : null}
      {children}
      <text x="36" y={height - 22} fill={SLATE} fontSize="12" fontFamily="system-ui,sans-serif">
        人生K线 · 引擎数据帧 · 节奏参考非决定论
      </text>
    </svg>
  );
}

/** Horizontal bar ranking of up to 12 rows — day/week compare. */
export function AstroRankingFrame({
  title,
  eyebrow = 'ENGINE RANK',
  subtitle,
  rows,
  scoreLabel = '分',
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  rows: AstroRankRow[];
  scoreLabel?: string;
  className?: string;
}) {
  const sorted = [...rows].sort((a, b) => b.score - a.score).slice(0, 12);
  const max = Math.max(100, ...sorted.map((r) => r.score), 1);
  const baseY = 128;
  const rowH = 30;
  const barMax = 520;
  const barX = 210;

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={128 + sorted.length * rowH + 48} className={className}>
      {sorted.map((row, i) => {
        const y = baseY + i * rowH;
        const w = Math.max(8, Math.round((row.score / max) * barMax));
        const color = barColor(row.score, row.stance);
        return (
          <g key={row.key}>
            <text x="36" y={y + 14} fill={MUTED} fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="600">
              {String(i + 1).padStart(2, '0')}
            </text>
            <text x="68" y={y + 14} fill={INK} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
              {row.title.length > 10 ? `${row.title.slice(0, 10)}…` : row.title}
            </text>
            <rect x={barX} y={y} width={barMax} height="16" rx="8" fill={HAIR} />
            <rect x={barX} y={y} width={w} height="16" rx="8" fill={color} opacity="0.9" />
            <text
              x={barX + barMax + 16}
              y={y + 13}
              fill={color}
              fontSize="15"
              fontFamily="ui-monospace,system-ui,sans-serif"
              fontWeight="800"
            >
              {row.score}
              {scoreLabel}
            </text>
          </g>
        );
      })}
    </FrameShell>
  );
}

/** Score ring + two side metrics — birth day / single pack. */
export function AstroScoreRingFrame({
  title,
  eyebrow = 'MATCH SCORE',
  subtitle,
  score,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  stance,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  score: number;
  leftLabel: string;
  leftValue: string | number;
  rightLabel: string;
  rightValue: string | number;
  stance?: PersonalDayStance;
  className?: string;
}) {
  const r = 72;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * c;
  const color = barColor(clamped, stance);
  const cx = 480;
  const cy = 280;

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} className={className}>
      <circle cx={cx} cy={cy} r={r + 10} fill="#fff" stroke={HAIR} strokeWidth="2" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={HAIR}
        strokeWidth="12"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={INK} fontSize="40" fontFamily="system-ui,sans-serif" fontWeight="800">
        {clamped}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={MUTED} fontSize="14" fontFamily="system-ui,sans-serif">
        综合匹配
      </text>

      <rect x="80" y="220" width="200" height="100" rx="16" fill="#fff" stroke={HAIR} />
      <text x="180" y="258" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        {leftLabel}
      </text>
      <text x="180" y="292" textAnchor="middle" fill={INK} fontSize="22" fontFamily="system-ui,sans-serif" fontWeight="800">
        {leftValue}
      </text>

      <rect x="680" y="220" width="200" height="100" rx="16" fill="#fff" stroke={HAIR} />
      <text x="780" y="258" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        {rightLabel}
      </text>
      <text x="780" y="292" textAnchor="middle" fill={INK} fontSize="22" fontFamily="system-ui,sans-serif" fontWeight="800">
        {rightValue}
      </text>

      <rect x="300" y="400" width="360" height="48" rx="12" fill={color} opacity="0.12" stroke={color} />
      <text x="480" y="430" textAnchor="middle" fill={color} fontSize="15" fontFamily="system-ui,sans-serif" fontWeight="700">
        {stance === 'push' ? '偏推进窗口' : stance === 'conserve' ? '偏守成窗口' : '偏稳健节奏'}
      </text>
    </FrameShell>
  );
}

/** Tear-off almanac day strip: gan-zhi + yi/ji chips from real pack. */
export function AlmanacDayStripFrame({
  title,
  dayGanZhi,
  lunarText,
  yi,
  ji,
  className,
}: {
  title: string;
  dayGanZhi: string;
  lunarText: string;
  yi: string[];
  ji: string[];
  className?: string;
}) {
  const yiShow = yi.slice(0, 5);
  const jiShow = ji.slice(0, 5);
  return (
    <FrameShell title={title} eyebrow="TONG-SHU" subtitle={`${dayGanZhi} · ${lunarText}`} height={360} className={className}>
      <rect x="36" y="130" width="280" height="160" rx="18" fill="#fff" stroke={HAIR} />
      <text x="176" y="180" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        日柱
      </text>
      <text x="176" y="230" textAnchor="middle" fill={BRAND} fontSize="36" fontFamily="system-ui,sans-serif" fontWeight="800">
        {dayGanZhi || '—'}
      </text>

      <text x="360" y="150" fill={EMERALD} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        宜
      </text>
      {yiShow.map((t, i) => (
        <g key={`yi-${t}-${i}`}>
          <rect x={360 + (i % 3) * 180} y={168 + Math.floor(i / 3) * 44} width="168" height="34" rx="10" fill="#ecfdf5" stroke="#a7f3d0" />
          <text
            x={360 + (i % 3) * 180 + 84}
            y={190 + Math.floor(i / 3) * 44}
            textAnchor="middle"
            fill={EMERALD}
            fontSize="13"
            fontFamily="system-ui,sans-serif"
            fontWeight="600"
          >
            {t.length > 6 ? `${t.slice(0, 6)}…` : t}
          </text>
        </g>
      ))}
      <text x="360" y={yiShow.length > 3 ? 268 : 230} fill={AMBER} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        忌
      </text>
      {jiShow.slice(0, 3).map((t, i) => (
        <g key={`ji-${t}-${i}`}>
          <rect x={360 + i * 180} y={yiShow.length > 3 ? 284 : 246} width="168" height="34" rx="10" fill="#fffbeb" stroke="#fcd34d" />
          <text
            x={360 + i * 180 + 84}
            y={yiShow.length > 3 ? 306 : 268}
            textAnchor="middle"
            fill={AMBER}
            fontSize="13"
            fontFamily="system-ui,sans-serif"
            fontWeight="600"
          >
            {t.length > 6 ? `${t.slice(0, 6)}…` : t}
          </text>
        </g>
      ))}
    </FrameShell>
  );
}

/** Tiny 24px stance mark for lists / chips. */
export function AstroStanceIcon({
  stance,
  className = 'h-5 w-5',
}: {
  stance: PersonalDayStance | string;
  className?: string;
}) {
  if (stance === 'push') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#ecfdf5" stroke={EMERALD} />
        <path d="M8 14 L12 8 L16 14" fill="none" stroke={EMERALD} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (stance === 'conserve') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#fffbeb" stroke={AMBER} />
        <path d="M8 10 L12 16 L16 10" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#eff6ff" stroke={BRAND} />
      <path d="M7 12 H17" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
