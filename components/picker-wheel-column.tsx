'use client';

// v5-D10 (2026-05-17) PickerWheelColumn 升级
// - 加 a11y：listbox/option role + aria-selected + aria-label
// - 键盘支持：ArrowUp/Down 切换、Home/End 跳到首尾
// - iOS/桌面滚轮：scrollend 校正 + 防过冲；外部页面不跟随（overscroll contain）
// - 滚动停止后才 commit onChange，避免快速滚动时回调风暴
//
// Why: 此前滚轮快速滚动会触发大量 onChange + 父组件重新渲染，iOS 上还容易
//      把整页拉走；同时 button 列没有 listbox 语义，键盘和读屏体验差。

import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface PickerWheelOption {
  label: string;
  value: string;
}

interface PickerWheelColumnProps {
  label: string;
  options: PickerWheelOption[];
  value: string;
  onChange: (nextValue: string) => void;
  compact?: boolean;
  hideLabel?: boolean;
  showHighlight?: boolean;
}

export default function PickerWheelColumn({
  label,
  options,
  value,
  onChange,
  compact = false,
  hideLabel = false,
  showHighlight = true,
}: PickerWheelColumnProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef<number | null>(null);
  const syncingRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const metrics = useMemo(() => {
    const rowHeight = compact ? 38 : 44;
    const height = compact ? 174 : 210;
    const padding = (height - rowHeight) / 2;
    return { rowHeight, height, padding };
  }, [compact]);

  // 同步 value -> scrollTop（外部值变化时）
  useEffect(() => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0 || !containerRef.current) return;

    const container = containerRef.current;
    const targetTop = Math.max(0, index * metrics.rowHeight);
    if (lastScrollTopRef.current === targetTop) return;

    lastScrollTopRef.current = targetTop;
    syncingRef.current = true;
    container.scrollTop = targetTop;

    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      syncingRef.current = false;
      frameRef.current = null;
    });
  }, [metrics.rowHeight, options, value]);

  useEffect(() => {
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const settleToIndex = useCallback(() => {
    if (syncingRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const index = Math.max(
      0,
      Math.min(options.length - 1, Math.round(container.scrollTop / metrics.rowHeight))
    );
    // 终态对齐到 row 中心，避免 scroll-snap 在 iOS 上偶尔停在两行之间
    const targetTop = index * metrics.rowHeight;
    if (Math.abs(container.scrollTop - targetTop) > 1) {
      syncingRef.current = true;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 180);
    }
    const nextValue = options[index]?.value;
    if (nextValue && nextValue !== value) onChange(nextValue);
  }, [metrics.rowHeight, onChange, options, value]);

  // 滚动停止后再 commit；快速滚动期间不刷父
  const handleScroll = useCallback(() => {
    if (syncingRef.current) return;
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(settleToIndex, 110);
  }, [settleToIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = options.findIndex((option) => option.value === value);
      if (currentIndex < 0) return;
      let nextIndex = currentIndex;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') nextIndex = Math.min(options.length - 1, currentIndex + 1);
      else if (event.key === 'ArrowUp' || event.key === 'PageUp') nextIndex = Math.max(0, currentIndex - 1);
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = options.length - 1;
      else return;
      event.preventDefault();
      const nextValue = options[nextIndex]?.value;
      if (nextValue && nextValue !== value) onChange(nextValue);
    },
    [onChange, options, value],
  );

  return (
    <div className="min-w-0">
      {hideLabel ? null : (
        <div className={`text-center text-[color:var(--muted)] ${compact ? 'mb-1.5 text-xs' : 'mb-3 text-sm'}`}>
          {label}
        </div>
      )}
      <div className="relative overflow-hidden" style={{ height: metrics.height }}>
        {showHighlight ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-[var(--radius)] bg-[color:var(--accent-soft)]"
            style={{ height: compact ? 46 : 58 }}
          />
        ) : null}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain px-0 [touch-action:pan-y] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] [&::-webkit-scrollbar]:hidden"
          style={{ paddingBottom: metrics.padding, paddingTop: metrics.padding }}
        >
          <div className="space-y-0">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={`${label}-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(option.value)}
                  className={`relative z-20 flex w-full snap-center items-center justify-center text-center transition ${
                    selected
                      ? `${compact ? 'text-[19px]' : 'text-[20px]'} font-bold text-[color:var(--ink)]`
                      : `${compact ? 'text-[13px]' : 'text-[14px]'} text-[color:var(--muted)] opacity-72`
                  }`}
                  style={{ height: metrics.rowHeight }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
