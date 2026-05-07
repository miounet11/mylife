'use client';

// 决策台 · 报告主区 client 包装
// 提供 ref 给 ReportModeToggle，不改变 children 渲染语义
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §5.2

import * as React from 'react';
import { ReportModeToggle } from '@/components/report-mode-toggle';

interface ReportSurfaceProps {
  children: React.ReactNode;
  toggleAnchor?: 'top-right' | 'top-bar';
}

export function ReportSurface({ children, toggleAnchor = 'top-bar' }: ReportSurfaceProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <div
        className={
          toggleAnchor === 'top-right'
            ? 'absolute right-0 top-0 z-10'
            : 'sticky top-14 z-20 -mx-4 mb-4 flex items-center justify-end gap-2 border-b border-[color:var(--hairline)] bg-[color:var(--bg)]/92 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8'
        }
      >
        <ReportModeToggle scopeRef={ref} />
      </div>
      {children}
    </div>
  );
}
