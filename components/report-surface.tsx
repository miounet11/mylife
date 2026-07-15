import type { ReactNode } from 'react';

export function ReportSurface({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
