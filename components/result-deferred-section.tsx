'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
      className="soft-card rounded-[1.75rem] p-5"
    >
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-[color:var(--accent-strong)]" />
        <div className="font-semibold text-[color:var(--ink)]">{title}</div>
      </div>
      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      <div className="mt-4 space-y-3">
        <div className="h-4 rounded-full bg-slate-100" />
        <div className="h-4 w-11/12 rounded-full bg-slate-100" />
        <div className="h-20 rounded-[1.25rem] bg-slate-50" />
      </div>
    </section>
  );
}
