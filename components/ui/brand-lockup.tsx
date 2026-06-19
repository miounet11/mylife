// 人生 K 线 · wordmark + brandmark 组合
// "人生 [K] 线" — K 字用衬线，其他汉字 PingFang
// 副标 LIFE KLINE 全大写，等宽体，letter-spacing +0.18em
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §2.2

import * as React from 'react';
import Link from 'next/link';
import { BrandMark } from './brand-mark';
import { cn } from '@/lib/utils';

interface BrandLockupProps {
  size?: 'sm' | 'md' | 'lg';
  withSubtitle?: boolean;
  withSignal?: boolean;
  href?: string | null;
  className?: string;
  ariaLabel?: string;
}

const sizeMap = {
  sm: { mark: 24, title: 'text-sm',   sub: 'text-xs'  },
  md: { mark: 32, title: 'text-base', sub: 'text-xs' },
  lg: { mark: 40, title: 'text-lg',   sub: 'text-xs'     },
} as const;

export function BrandLockup({
  size = 'md',
  withSubtitle = true,
  withSignal = true,
  href = '/',
  className,
  ariaLabel = '回到人生K线首页',
}: BrandLockupProps) {
  const s = sizeMap[size];

  const content = (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark size={s.mark} withSignal={withSignal} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-black text-[color:var(--ink-1,#0a120e)]', s.title)}>
          人生<span className="font-serif">K</span>线
        </span>
        {withSubtitle && (
          <span
            className={cn(
              'mt-0.5 font-mono uppercase text-[color:var(--ink-5,#8b9690)]',
              s.sub,
            )}
            style={{ letterSpacing: '0.18em' }}
          >
            LIFE KLINE
          </span>
        )}
      </span>
    </span>
  );

  if (href === null) {
    return content;
  }

  return (
    <Link href={href} aria-label={ariaLabel} className="inline-flex">
      {content}
    </Link>
  );
}
