/**
 * Data-bound SVG frames for report chapters.
 * Educational structure + optional live window/score props (never invent 用神).
 */

import type { ReactNode } from 'react';

const INK = '#1c1e21';
const MUTED = '#65676b';
const HAIR = '#e4e6eb';
const BRAND = '#3b5998';
const PAPER = '#f7f5f0';
const EMERALD = '#047857';
const AMBER = '#b45309';

function Shell({
  title,
  eyebrow,
  height = 280,
  children,
  className = '',
}: {
  title: string;
  eyebrow: string;
  height?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 960 ${height}`}
      role="img"
      aria-label={title}
      className={`h-auto w-full rounded-2xl border border-[color:var(--hairline)] bg-white shadow-sm ${className}`}
    >
      <defs>
        <linearGradient id="rpPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PAPER} />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="960" height={height} fill="url(#rpPaper)" rx="16" />
      <rect x="0" y="0" width="8" height={height} fill={BRAND} opacity="0.2" />
      <text x="28" y="36" fill={BRAND} fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="1.2">
        {eyebrow}
      </text>
      <text x="28" y="64" fill={INK} fontSize="22" fontFamily="system-ui,sans-serif" fontWeight="800">
        {title}
      </text>
      {children}
      <text x="28" y={height - 16} fill="#94a3b8" fontSize="11" fontFamily="system-ui,sans-serif">
        人生K线 · 结构示意 · 节奏参考非决定论
      </text>
    </svg>
  );
}

/** Best / risk windows for consultant timing card. */
export function ReportWindowsFrame({
  best,
  risk,
  className,
}: {
  best?: string | null;
  risk?: string | null;
  className?: string;
}) {
  const b = `${best || ''}`.trim() || '待报告填充';
  const r = `${risk || ''}`.trim() || '待报告填充';
  return (
    <Shell title="时机窗口（报告层）" eyebrow="TIMING WINDOWS" height={240} className={className}>
      <rect x="28" y="90" width="440" height="100" rx="16" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="48" y="122" fill={EMERALD} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        有利窗
      </text>
      <text x="48" y="158" fill={INK} fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="700">
        {b.length > 22 ? `${b.slice(0, 22)}…` : b}
      </text>

      <rect x="492" y="90" width="440" height="100" rx="16" fill="#fffbeb" stroke="#fcd34d" />
      <text x="512" y="122" fill={AMBER} fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700">
        谨慎窗
      </text>
      <text x="512" y="158" fill={INK} fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="700">
        {r.length > 22 ? `${r.slice(0, 22)}…` : r}
      </text>
    </Shell>
  );
}

/** Year / phase score spark for life K-line summary. */
export function ReportScoreSparkFrame({
  title = '人生K线阶段分',
  points,
  className,
}: {
  title?: string;
  points: Array<{ label: string; score: number }>;
  className?: string;
}) {
  const rows = points.slice(0, 12);
  if (!rows.length) return null;
  const max = Math.max(100, ...rows.map((p) => p.score), 1);
  const barMaxH = 110;
  const baseY = 220;
  const slot = Math.min(72, 860 / rows.length);
  const startX = (960 - rows.length * slot) / 2;

  return (
    <Shell title={title} eyebrow="LIFE K-LINE" height={280} className={className}>
      {rows.map((p, i) => {
        const h = Math.max(6, Math.round((p.score / max) * barMaxH));
        const x = startX + i * slot;
        const color = p.score >= 60 ? EMERALD : p.score <= 40 ? AMBER : BRAND;
        return (
          <g key={`${p.label}-${i}`}>
            <rect x={x + 10} y={baseY - h} width={slot - 20} height={h} rx="8" fill={color} opacity="0.88" />
            <text x={x + slot / 2} y={baseY - h - 8} textAnchor="middle" fill={color} fontSize="12" fontFamily="ui-monospace,system-ui,sans-serif" fontWeight="800">
              {Math.round(p.score)}
            </text>
            <text x={x + slot / 2} y={baseY + 18} textAnchor="middle" fill={MUTED} fontSize="11" fontFamily="system-ui,sans-serif">
              {String(p.label).slice(0, 5)}
            </text>
          </g>
        );
      })}
    </Shell>
  );
}

/** Decision loop five steps — educational, no invented personal data. */
export function ReportDecisionLoopFrame({ className }: { className?: string }) {
  const steps = ['依据', '结论', '动作', '风险', '验证'];
  return (
    <Shell title="决策闭环" eyebrow="DECISION LOOP" height={220} className={className}>
      {steps.map((s, i) => {
        const x = 48 + i * 180;
        return (
          <g key={s}>
            {i > 0 ? (
              <path d={`M ${x - 28} 140 H ${x - 8}`} stroke={HAIR} strokeWidth="3" />
            ) : null}
            <rect x={x} y="100" width="140" height="72" rx="14" fill="#fff" stroke={BRAND} opacity="0.95" />
            <text x={x + 70} y="128" textAnchor="middle" fill={MUTED} fontSize="12" fontFamily="system-ui,sans-serif">
              {i + 1}
            </text>
            <text x={x + 70} y="154" textAnchor="middle" fill={INK} fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="800">
              {s}
            </text>
          </g>
        );
      })}
    </Shell>
  );
}
