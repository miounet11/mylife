import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Three-slot portal shell. Column templates must match which slots render:
 * without a left rail, the 3-column xl template would squeeze `main` into
 * `--rail-left` (~11rem) and Chinese text wraps one character per line.
 */
export function PortalLayout({
  left,
  main,
  right,
  className,
}: {
  left?: ReactNode;
  main: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'portal-grid',
        left ? 'portal-grid--with-left' : 'portal-grid--no-left',
        right ? 'portal-grid--with-right' : 'portal-grid--no-right',
        className,
      )}
    >
      {left ? <aside className="portal-rail-left">{left}</aside> : null}
      <div className="portal-main">{main}</div>
      {right ? <aside className="portal-rail-right">{right}</aside> : null}
    </div>
  );
}