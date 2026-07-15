import type { ReactNode } from 'react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { cn } from '@/lib/utils';

type SiteHeaderProps = {
  ctaHref?: string;
  ctaLabel?: string;
  compact?: boolean;
  ctaAnalytics?: {
    page: string;
    target: string;
    meta?: Record<string, unknown>;
  };
};

export function AppPage({
  children,
  header,
  showFooter = true,
  mainClassName = 'page-frame py-6 pb-16 md:py-8 md:pb-20',
}: {
  children: ReactNode;
  header?: SiteHeaderProps;
  showFooter?: boolean;
  mainClassName?: string;
}) {
  return (
    <div className="page-shell">
      <SiteHeader
        ctaHref={header?.ctaHref}
        ctaLabel={header?.ctaLabel}
        compact={header?.compact}
        ctaAnalytics={header?.ctaAnalytics}
      />
      <main className={cn(mainClassName)}>{children}</main>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
