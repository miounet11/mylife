'use client';

/** 商铺色彩方案色块展示 */
export function ShopColorSwatch({
  label,
  hex,
  element,
  reason,
}: {
  label: string;
  hex: string;
  element: string;
  reason: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 shrink-0 rounded-full border border-[color:var(--hairline)]"
        style={{ backgroundColor: hex }}
      />
      <div>
        <div className="text-sm font-medium text-[color:var(--ink-1)]">
          {label}（{element}）
        </div>
        <div className="text-xs text-[color:var(--ink-3)]">{reason}</div>
        <div className="font-mono text-[10px] text-[color:var(--ink-4)]">{hex}</div>
      </div>
    </div>
  );
}