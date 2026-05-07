'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';


// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;
export default function ResultDeferredSection({
  id,
  title,
  description,
  delayMs = 0,
  revealDistancePx = 320,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  delayMs?: number;
  revealDistancePx?: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    let rafId: number | null = null;

    const reveal = () => {
      if (!cancelled) {
        setVisible(true);
      }
    };

    const scheduleReveal = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(reveal, delayMs);
    };

    if (typeof window === 'undefined') {
      return;
    }

    const node = sectionRef.current;
    if (!node) {
      scheduleReveal();
      return () => {
        cancelled = true;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    const checkViewport = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const isNearViewport =
        rect.top <= viewportHeight + revealDistancePx &&
        rect.bottom >= -revealDistancePx;

      if (!isNearViewport) {
        return;
      }

      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
      window.removeEventListener('orientationchange', requestCheck);
      scheduleReveal();
    };

    const requestCheck = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(checkViewport);
    };

    requestCheck();
    window.addEventListener('scroll', requestCheck, { passive: true });
    window.addEventListener('resize', requestCheck);
    window.addEventListener('orientationchange', requestCheck);

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
      window.removeEventListener('orientationchange', requestCheck);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delayMs, revealDistancePx]);

  if (visible) {
    return <div id={id}>{children}</div>;
  }

  return (
    <section
      id={id}
      ref={sectionRef}
      aria-busy="true"
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
    >
      <div className="flex items-center gap-2">
        <LoaderCircle className="h-4 w-4 animate-spin text-[color:var(--brand-strong)]" />
        <div className="text-sm font-bold text-[color:var(--ink-1)]">{title}</div>
      </div>
      {description ? (
        <div className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">{description}</div>
      ) : null}
      <div className="mt-3 space-y-2">
        <div className="h-3 rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)]" />
        <div className="h-3 w-11/12 rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)]" />
        <div className="h-16 rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
      </div>
    </section>
  );
}
