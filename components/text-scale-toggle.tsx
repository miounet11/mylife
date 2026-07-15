'use client';

import { useEffect, useState } from 'react';
import {
  applyTextScale,
  persistTextScale,
  readStoredTextScale,
  type TextScale,
} from '@/lib/text-scale';
import { cn } from '@/lib/utils';

/**
 * 标准 / 大字 — 中年友好可读模式
 * 偏好存 localStorage，首屏由 layout 内联脚本恢复避免闪动。
 */
export default function TextScaleToggle({
  className,
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'chrome';
}) {
  const [scale, setScale] = useState<TextScale>('normal');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readStoredTextScale();
    setScale(next);
    applyTextScale(next);
    setReady(true);
  }, []);

  const onPick = (next: TextScale) => {
    setScale(next);
    persistTextScale(next);
  };

  const shell =
    variant === 'light'
      ? 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]'
      : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius)] border p-0.5',
        shell,
        className,
      )}
      role="group"
      aria-label="字号"
      data-no-i18n
    >
      {(
        [
          { key: 'normal' as const, label: '标准' },
          { key: 'large' as const, label: '大字' },
        ] as const
      ).map((opt) => {
        const active = ready ? scale === opt.key : opt.key === 'normal';
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onPick(opt.key)}
            className={cn(
              'inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-[calc(var(--radius)-2px)] px-2 text-[12px] font-medium transition',
              active
                ? 'bg-[color:var(--paper)] text-[color:var(--ink-1)] shadow-sm'
                : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]',
            )}
            aria-pressed={active}
            title={opt.key === 'large' ? '放大正文与按钮，便于阅读' : '默认字号'}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
