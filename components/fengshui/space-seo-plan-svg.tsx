import type { SpaceSeoSceneSnapshot } from '@/lib/fengshui/space/seo-report';

const FILL: Record<string, string> = {
  living: '#f5e6b8',
  bedroom: '#f0d9a8',
  bath: '#e8eef5',
  kitchen: '#efe8dc',
  balcony: '#f7f3e8',
  corridor: '#f3efe6',
  storage: '#ebe4d8',
  shop: '#f5f0e6',
  office: '#e8eef5',
  yard: '#dce8d0',
  other: '#f0ebe3',
};

const FACE_DEG: Record<string, number> = {
  北: 0,
  东北: 45,
  东: 90,
  东南: 135,
  南: 180,
  西南: 225,
  西: 270,
  西北: 315,
};

function heatColor(v: number) {
  const t = Math.max(0, Math.min(1, v));
  const r = Math.round(40 + t * 200);
  const g = Math.round(90 + t * 80);
  const b = Math.round(180 - t * 80);
  return `rgba(${r},${g},${b},${0.08 + t * 0.28})`;
}

export function SpaceSeoPlanSvg({
  snap,
  className = '',
}: {
  snap: SpaceSeoSceneSnapshot;
  className?: string;
}) {
  const S = 400;
  const pad = 36;
  const inner = S - pad * 2;
  const cx = S / 2;
  const cy = S / 2;
  const R = inner * 0.48;

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      role="img"
      aria-label={`${snap.layout}朝${snap.facing}平面示意`}
      className={className}
    >
      <rect width={S} height={S} fill="#eef2e8" />
      <rect x={pad - 8} y={pad - 8} width={inner + 16} height={inner + 16} fill="#dce8d0" />
      <rect x={pad} y={pad} width={inner} height={inner} fill="#f8f6f1" />

      {Array.from({ length: snap.heatW * snap.heatW }, (_, i) => {
        const x = i % snap.heatW;
        const y = Math.floor(i / snap.heatW);
        const cell = inner / snap.heatW;
        return (
          <rect
            key={`h-${i}`}
            x={pad + x * cell}
            y={pad + y * cell}
            width={cell + 0.4}
            height={cell + 0.4}
            fill={heatColor(snap.heat[i] || 0)}
          />
        );
      })}

      {snap.zones.map((z) => (
        <g key={z.id}>
          <rect
            x={pad + z.x * inner}
            y={pad + z.y * inner}
            width={Math.max(4, z.w * inner)}
            height={Math.max(4, z.h * inner)}
            fill={FILL[z.kind] || FILL.other}
            stroke="rgba(15,23,42,0.45)"
            strokeWidth={1.2}
          />
          {z.w * inner > 28 && z.h * inner > 16 ? (
            <text
              x={pad + (z.x + z.w / 2) * inner}
              y={pad + (z.y + z.h / 2) * inner}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill="#1e293b"
            >
              {z.label}
            </text>
          ) : null}
        </g>
      ))}

      {(['北', '东', '南', '西'] as const).map((name) => {
        const deg = FACE_DEG[name];
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = cx + Math.cos(rad) * (R + 18);
        const y = cy + Math.sin(rad) * (R + 18);
        const hi = snap.enhanceFacings.includes(name);
        const lo = snap.reduceFacings.includes(name);
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={hi ? 800 : 600}
            fill={hi ? '#0f172a' : lo ? '#94a3b8' : '#475569'}
          >
            {name}
            {hi ? '·用' : lo ? '·忌' : ''}
          </text>
        );
      })}

      {snap.enhanceFacings.map((f) => {
        const deg = FACE_DEG[f];
        if (deg == null) return null;
        const start = ((deg - 22.5 - 90) * Math.PI) / 180;
        const end = ((deg + 22.5 - 90) * Math.PI) / 180;
        const x1 = cx + Math.cos(start) * R;
        const y1 = cy + Math.sin(start) * R;
        const x2 = cx + Math.cos(end) * R;
        const y2 = cy + Math.sin(end) * R;
        return (
          <path
            key={`arc-${f}`}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`}
            fill="rgba(15,23,42,0.06)"
            stroke="rgba(15,23,42,0.35)"
            strokeWidth={1}
          />
        );
      })}

      {snap.vents.map((v) => (
        <circle
          key={v.id}
          cx={pad + v.x * inner}
          cy={pad + v.y * inner}
          r={5}
          fill={v.kind === 'inlet' ? '#16a34a' : '#0284c7'}
        />
      ))}

      {(() => {
        const deg = FACE_DEG[snap.facing] ?? 180;
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = cx + Math.cos(rad) * (R + 2);
        const y = cy + Math.sin(rad) * (R + 2);
        return (
          <g>
            <circle cx={x} cy={y} r={11} fill="#ea580c" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#fff" fontWeight={700}>
              入
            </text>
          </g>
        );
      })()}

      <text x={pad} y={S - 10} fontSize={10} fill="#64748b">
        {snap.layout} · {snap.widthM.toFixed(1)}×{snap.depthM.toFixed(1)}m · {snap.facing}向
        {snap.yongLabel ? ` · 用神${snap.yongLabel}` : ''}
      </text>
    </svg>
  );
}
