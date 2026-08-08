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

export type AstroMonthHeatCell = {
  date: string;
  day: number;
  score: number;
  stance?: PersonalDayStance;
  dayGanZhi?: string;
};

/** Month heat calendar — scores as cell fill intensity. */
export function AstroMonthHeatFrame({
  title,
  eyebrow = 'MONTH HEAT',
  subtitle,
  year,
  month,
  cells,
  avg,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  year: number;
  month: number;
  cells: AstroMonthHeatCell[];
  avg?: number;
  className?: string;
}) {
  // Monday-first week grid (ISO-ish for CN users often Sun-first — use Sun-first to match common calendars)
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay(); // 0 Sun
  const cellMap = new Map(cells.map((c) => [c.day, c]));
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalSlots = startPad + daysInMonth;
  const rows = Math.ceil(totalSlots / 7);
  const height = 150 + rows * 52 + 40;
  const cellW = 112;
  const cellH = 44;
  const originX = 80;
  const originY = 140;
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={height} className={className}>
      {avg != null ? (
        <text x="900" y="74" textAnchor="end" fill={BRAND} fontSize="22" fontFamily="system-ui,sans-serif" fontWeight="800">
          月均 {avg}
        </text>
      ) : null}
      {weekdays.map((w, i) => (
        <text
          key={w}
          x={originX + i * (cellW + 8) + cellW / 2}
          y={originY - 12}
          textAnchor="middle"
          fill={MUTED}
          fontSize="12"
          fontFamily="system-ui,sans-serif"
          fontWeight="600"
        >
          {w}
        </text>
      ))}
      {Array.from({ length: totalSlots }, (_, idx) => {
        const dayNum = idx - startPad + 1;
        const col = idx % 7;
        const row = Math.floor(idx / 7);
        const x = originX + col * (cellW + 8);
        const y = originY + row * (cellH + 8);
        if (dayNum < 1 || dayNum > daysInMonth) {
          return <rect key={`pad-${idx}`} x={x} y={y} width={cellW} height={cellH} rx="10" fill="#f0f0f0" opacity="0.35" />;
        }
        const cell = cellMap.get(dayNum);
        const score = cell?.score ?? 0;
        const color = barColor(score, cell?.stance);
        const opacity = 0.12 + (score / 100) * 0.55;
        return (
          <g key={dayNum}>
            <rect x={x} y={y} width={cellW} height={cellH} rx="10" fill={color} opacity={opacity} stroke={HAIR} />
            <text x={x + 10} y={y + 16} fill={INK} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="700">
              {dayNum}
            </text>
            <text x={x + cellW - 10} y={y + 16} textAnchor="end" fill={color} fontSize="13" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
              {score || '—'}
            </text>
            {cell?.dayGanZhi ? (
              <text x={x + 10} y={y + 34} fill={MUTED} fontSize="10" fontFamily="system-ui,sans-serif">
                {cell.dayGanZhi}
              </text>
            ) : null}
          </g>
        );
      })}
    </FrameShell>
  );
}

export type AstroWeekDayBar = {
  date: string;
  weekday: string;
  score: number;
  stance?: PersonalDayStance;
  dayGanZhi?: string;
};

/** Seven-day strip for identity week packs. */
export function AstroWeekStripFrame({
  title,
  eyebrow = 'WEEK STRIP',
  subtitle,
  days,
  avg,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  days: AstroWeekDayBar[];
  avg?: number;
  className?: string;
}) {
  const max = Math.max(100, ...days.map((d) => d.score), 1);
  const barMaxH = 160;
  const baseY = 360;
  const slot = 110;
  const startX = (960 - days.length * slot) / 2 + 20;

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={420} className={className}>
      {avg != null ? (
        <text x="900" y="74" textAnchor="end" fill={BRAND} fontSize="22" fontFamily="system-ui,sans-serif" fontWeight="800">
          周均 {avg}
        </text>
      ) : null}
      {days.map((d, i) => {
        const h = Math.max(8, Math.round((d.score / max) * barMaxH));
        const x = startX + i * slot;
        const color = barColor(d.score, d.stance);
        return (
          <g key={d.date}>
            <rect x={x} y={baseY - h} width="56" height={h} rx="10" fill={color} opacity="0.88" />
            <text x={x + 28} y={baseY - h - 10} textAnchor="middle" fill={color} fontSize="14" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
              {d.score}
            </text>
            <text x={x + 28} y={baseY + 22} textAnchor="middle" fill={INK} fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="700">
              {d.weekday}
            </text>
            <text x={x + 28} y={baseY + 40} textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="system-ui,sans-serif">
              {d.date.slice(5)}
            </text>
          </g>
        );
      })}
    </FrameShell>
  );
}

/** Pair dual scores + combined. */
export function AstroPairDualFrame({
  title,
  eyebrow = 'PAIR DAY',
  subtitle,
  aTitle,
  aScore,
  aStance,
  bTitle,
  bScore,
  bStance,
  combinedScore,
  combinedStance,
  pairBase,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  aTitle: string;
  aScore: number;
  aStance?: PersonalDayStance;
  bTitle: string;
  bScore: number;
  bStance?: PersonalDayStance;
  combinedScore: number;
  combinedStance?: PersonalDayStance;
  pairBase?: number;
  className?: string;
}) {
  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={380} className={className}>
      {/* A */}
      <rect x="48" y="140" width="240" height="180" rx="18" fill="#fff" stroke={HAIR} />
      <text x="168" y="180" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        {aTitle}
      </text>
      <text x="168" y="240" textAnchor="middle" fill={barColor(aScore, aStance)} fontSize="48" fontFamily="system-ui,sans-serif" fontWeight="800">
        {aScore}
      </text>
      <text x="168" y="280" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        当日引擎
      </text>

      {/* B */}
      <rect x="672" y="140" width="240" height="180" rx="18" fill="#fff" stroke={HAIR} />
      <text x="792" y="180" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        {bTitle}
      </text>
      <text x="792" y="240" textAnchor="middle" fill={barColor(bScore, bStance)} fontSize="48" fontFamily="system-ui,sans-serif" fontWeight="800">
        {bScore}
      </text>
      <text x="792" y="280" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif">
        当日引擎
      </text>

      {/* Combined */}
      <rect x="330" y="150" width="300" height="160" rx="20" fill={barColor(combinedScore, combinedStance)} opacity="0.12" stroke={barColor(combinedScore, combinedStance)} />
      <text x="480" y="200" textAnchor="middle" fill={MUTED} fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="700">
        合盘日合成
      </text>
      <text x="480" y="250" textAnchor="middle" fill={barColor(combinedScore, combinedStance)} fontSize="52" fontFamily="system-ui,sans-serif" fontWeight="800">
        {combinedScore}
      </text>
      {pairBase != null ? (
        <text x="480" y="285" textAnchor="middle" fill={MUTED} fontSize="12" fontFamily="system-ui,sans-serif">
          结构配对基线 {pairBase}
        </text>
      ) : null}
    </FrameShell>
  );
}

/** Evidence weight bars (signed). */
export function AstroEvidenceBarsFrame({
  title,
  eyebrow = 'EVIDENCE',
  subtitle,
  items,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  items: Array<{ code: string; label: string; weight: number }>;
  className?: string;
}) {
  const rows = items.slice(0, 8);
  const maxAbs = Math.max(8, ...rows.map((r) => Math.abs(r.weight)), 1);
  const midX = 480;
  const barMax = 200;
  const baseY = 130;
  const rowH = 36;
  const height = 130 + rows.length * rowH + 40;

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={height} className={className}>
      <line x1={midX} y1={120} x2={midX} y2={height - 40} stroke={HAIR} strokeWidth="2" />
      {rows.map((r, i) => {
        const y = baseY + i * rowH;
        const w = Math.round((Math.abs(r.weight) / maxAbs) * barMax);
        const positive = r.weight >= 0;
        const color = positive ? EMERALD : AMBER;
        const x = positive ? midX + 4 : midX - 4 - w;
        return (
          <g key={`${r.code}-${i}`}>
            <text x="36" y={y + 14} fill={MUTED} fontSize="11" fontFamily="ui-monospace,system-ui,sans-serif">
              {r.code}
            </text>
            <text x="130" y={y + 14} fill={INK} fontSize="12" fontFamily="system-ui,sans-serif">
              {r.label.length > 18 ? `${r.label.slice(0, 18)}…` : r.label}
            </text>
            <rect x={x} y={y} width={Math.max(6, w)} height="16" rx="6" fill={color} opacity="0.85" />
            <text
              x={positive ? midX + w + 14 : midX - w - 14}
              y={y + 13}
              textAnchor={positive ? 'start' : 'end'}
              fill={color}
              fontSize="13"
              fontFamily="ui-monospace,system-ui,sans-serif"
              fontWeight="800"
            >
              {positive ? `+${r.weight}` : r.weight}
            </text>
          </g>
        );
      })}
    </FrameShell>
  );
}

/** Compact top/low strip for almanac bridge (no full 12). */
export function AstroMiniRankStrip({
  title,
  top,
  low,
  className = '',
}: {
  title: string;
  top: AstroRankRow[];
  low: AstroRankRow[];
  className?: string;
}) {
  const height = 220;
  return (
    <FrameShell title={title} eyebrow="DAY SNAPSHOT" subtitle="同日引擎 · 点完整排名看证据" height={height} className={className}>
      <text x="80" y="140" fill={EMERALD} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        较顺
      </text>
      {top.slice(0, 3).map((r, i) => (
        <g key={`t-${r.key}`}>
          <rect x={80 + i * 140} y="155" width="128" height="44" rx="12" fill="#ecfdf5" stroke="#a7f3d0" />
          <text x={80 + i * 140 + 64} y="174" textAnchor="middle" fill={INK} fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="700">
            {r.title.replace(/座$/, '').slice(0, 6)}
          </text>
          <text x={80 + i * 140 + 64} y="190" textAnchor="middle" fill={EMERALD} fontSize="14" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
            {r.score}
          </text>
        </g>
      ))}
      <text x="560" y="140" fill={AMBER} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        宜稳
      </text>
      {low.slice(0, 3).map((r, i) => (
        <g key={`l-${r.key}`}>
          <rect x={560 + i * 120} y="155" width="110" height="44" rx="12" fill="#fffbeb" stroke="#fcd34d" />
          <text x={560 + i * 120 + 55} y="174" textAnchor="middle" fill={INK} fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="700">
            {r.title.replace(/座$/, '').slice(0, 5)}
          </text>
          <text x={560 + i * 120 + 55} y="190" textAnchor="middle" fill={AMBER} fontSize="14" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
            {r.score}
          </text>
        </g>
      ))}
    </FrameShell>
  );
}

/** Hour score sparkline from ranked hour notes. */
export function AstroHourSparkFrame({
  title,
  eyebrow = 'HOURS',
  subtitle,
  hours,
  className,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  hours: Array<{ label: string; ganZhi?: string; score: number }>;
  className?: string;
}) {
  const rows = hours.slice(0, 12);
  if (!rows.length) {
    return (
      <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle || '暂无时辰分'} height={200} className={className}>
        <text x="480" y="150" textAnchor="middle" fill={MUTED} fontSize="14" fontFamily="system-ui,sans-serif">
          今日无明显时辰峰谷标注
        </text>
      </FrameShell>
    );
  }
  const max = Math.max(100, ...rows.map((h) => h.score), 1);
  const barMaxH = 140;
  const baseY = 320;
  const slot = Math.min(70, 860 / rows.length);
  const startX = (960 - rows.length * slot) / 2;

  return (
    <FrameShell title={title} eyebrow={eyebrow} subtitle={subtitle} height={380} className={className}>
      {rows.map((h, i) => {
        const barH = Math.max(6, Math.round((h.score / max) * barMaxH));
        const x = startX + i * slot;
        const color = barColor(h.score);
        return (
          <g key={`${h.label}-${i}`}>
            <rect x={x + 8} y={baseY - barH} width={slot - 16} height={barH} rx="8" fill={color} opacity="0.88" />
            <text x={x + slot / 2} y={baseY - barH - 8} textAnchor="middle" fill={color} fontSize="11" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
              {h.score}
            </text>
            <text x={x + slot / 2} y={baseY + 18} textAnchor="middle" fill={INK} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600">
              {(h.label || h.ganZhi || '').slice(0, 4)}
            </text>
          </g>
        );
      })}
    </FrameShell>
  );
}

