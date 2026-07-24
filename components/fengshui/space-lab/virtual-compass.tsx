'use client';

/**
 * Virtual compass — rotate plan / set entrance facing (product-grade orientation control)
 */

import { useCallback, useRef } from 'react';
import type { SpaceLabCopy } from '@/lib/i18n/space-lab-copy';

const FACINGS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'] as const;
const FACING_DEG: Record<string, number> = {
  北: 0,
  东北: 45,
  东: 90,
  东南: 135,
  南: 180,
  西南: 225,
  西: 270,
  西北: 315,
};

const FACING_EN: Record<string, string> = {
  北: 'N',
  东北: 'NE',
  东: 'E',
  东南: 'SE',
  南: 'S',
  西南: 'SW',
  西: 'W',
  西北: 'NW',
};

type Props = {
  planRotationDeg: number;
  entranceFacing: string;
  copy: SpaceLabCopy;
  locale?: string;
  onRotate: (deg: number) => void;
  onEntrance: (facing: string) => void;
  compact?: boolean;
};

function snap8(deg: number) {
  const d = ((deg % 360) + 360) % 360;
  const idx = Math.round(d / 45) % 8;
  return idx * 45;
}

function facingFromDeg(deg: number) {
  const s = snap8(deg);
  return FACINGS[s / 45] || '南';
}

export function VirtualCompass({
  planRotationDeg,
  entranceFacing,
  copy,
  locale,
  onRotate,
  onEntrance,
  compact,
}: Props) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const rot = ((planRotationDeg % 360) + 360) % 360;
  const entranceDeg = FACING_DEG[entranceFacing] ?? 180;

  const setFromPointer = useCallback(
    (clientX: number, clientY: number, snap: boolean) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // angle: 0 = north (up), clockwise
      let deg = (Math.atan2(clientX - cx, cy - clientY) * 180) / Math.PI;
      deg = ((deg % 360) + 360) % 360;
      if (snap) deg = snap8(deg);
      onRotate(Math.round(deg));
      if (snap) onEntrance(facingFromDeg(deg));
    },
    [onRotate, onEntrance],
  );

  const size = compact ? 120 : 148;
  const r = size / 2 - 8;

  return (
    <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2">
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--brand-strong)]">
          {copy.compass.title}
        </span>
        <span className="tabular-nums text-[10px] text-[color:var(--ink-5)]">
          {copy.compass.rotate} {rot}°
        </span>
      </div>
      <p className="mb-1.5 text-[9px] leading-snug text-[color:var(--ink-5)]">{copy.compass.drag}</p>

      <div className="flex items-start gap-2">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="shrink-0 cursor-crosshair touch-none select-none"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setFromPointer(e.clientX, e.clientY, false);
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            setFromPointer(e.clientX, e.clientY, false);
          }}
          onPointerUp={(e) => {
            dragging.current = false;
            setFromPointer(e.clientX, e.clientY, true);
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="#f8fafc"
            stroke="rgba(15,23,42,0.2)"
            strokeWidth="1.5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r * 0.72}
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth="1"
          />
          {FACINGS.map((f) => {
            const d = FACING_DEG[f];
            const rad = ((d - 90) * Math.PI) / 180;
            const x = size / 2 + Math.cos(rad) * (r - 14);
            const y = size / 2 + Math.sin(rad) * (r - 14);
            const active = entranceFacing === f;
            return (
              <g key={f}>
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 11 : 9}
                  fill={active ? '#0f172a' : '#e2e8f0'}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEntrance(f);
                    onRotate(d);
                  }}
                />
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill={active ? '#fff' : '#334155'}
                  className="pointer-events-none"
                >
                  {en ? FACING_EN[f] : f.length > 1 ? f.slice(0, 1) : f}
                </text>
              </g>
            );
          })}
          {/* north tick fixed on widget top = screen north after rotation? 
              Needle shows planRotation: where building north points */}
          <g transform={`rotate(${rot} ${size / 2} ${size / 2})`}>
            <polygon
              points={`${size / 2},${size / 2 - r + 6} ${size / 2 - 5},${size / 2 + 4} ${size / 2 + 5},${size / 2 + 4}`}
              fill="#dc2626"
            />
            <polygon
              points={`${size / 2},${size / 2 + r - 10} ${size / 2 - 4},${size / 2 - 2} ${size / 2 + 4},${size / 2 - 2}`}
              fill="#94a3b8"
            />
          </g>
          {/* entrance marker on ring */}
          <g transform={`rotate(${entranceDeg} ${size / 2} ${size / 2})`}>
            <rect
              x={size / 2 - 6}
              y={size / 2 + r - 4}
              width={12}
              height={5}
              rx={1}
              fill="#f59e0b"
            />
          </g>
          <circle cx={size / 2} cy={size / 2} r={3.5} fill="#0f172a" />
          <text
            x={size / 2}
            y={12}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#dc2626"
          >
            {copy.compass.north}
          </text>
        </svg>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-[10px] text-[color:var(--ink-4)]">
            {copy.compass.entrance}{' '}
            <span className="font-semibold text-[color:var(--ink-1)]">
              {en ? FACING_EN[entranceFacing] || entranceFacing : entranceFacing}
            </span>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {FACINGS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onEntrance(f);
                  onRotate(FACING_DEG[f]);
                }}
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                  entranceFacing === f
                    ? 'bg-[color:var(--ink-1)] text-white'
                    : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]'
                }`}
              >
                {en ? FACING_EN[f] : f}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="w-full rounded border border-[color:var(--hairline)] py-1 text-[9px] font-semibold text-[color:var(--ink-2)]"
            onClick={() => {
              const s = snap8(rot);
              onRotate(s);
              onEntrance(facingFromDeg(s));
            }}
          >
            {copy.compass.snap}
          </button>
        </div>
      </div>
    </div>
  );
}
