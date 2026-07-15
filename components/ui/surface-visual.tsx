/**
 * Branded surface visuals for homepage / portal / dimensions.
 * Position-aware mini illustrations (not generic emoji), so each entry
 * communicates meaning at a glance.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SurfaceVisualKey =
  | 'intent-career'
  | 'intent-wealth'
  | 'intent-relationship'
  | 'intent-yearly'
  | 'method-1'
  | 'method-2'
  | 'method-3'
  | 'method-4'
  | 'method-5'
  | 'tool-yearly'
  | 'tool-palm'
  | 'tool-daily'
  | 'tool-default'
  | 'dim-fortune-rhythm'
  | 'dim-career-industry'
  | 'dim-investment'
  | 'dim-naming'
  | 'dim-health'
  | 'dim-study-career'
  | 'dim-marriage'
  | 'dim-partnership'
  | 'dim-living-environment'
  | 'dim-timing-selection'
  | 'nav-home'
  | 'nav-analyze'
  | 'nav-member'
  | 'nav-dimensions'
  | 'nav-predictions'
  | 'nav-sign'
  | 'nav-docs'
  | 'nav-world-yi'
  | 'nav-tools'
  | 'nav-review'
  | 'nav-knowledge'
  | 'nav-cases'
  | 'nav-reports'
  | 'faq'
  | 'default';

const PALETTE: Record<string, { bg: string; fg: string; accent: string }> = {
  blue: { bg: '#eff6ff', fg: '#1d4ed8', accent: '#93c5fd' },
  teal: { bg: '#f0fdfa', fg: '#0f766e', accent: '#5eead4' },
  amber: { bg: '#fffbeb', fg: '#b45309', accent: '#fcd34d' },
  rose: { bg: '#fff1f2', fg: '#be123c', accent: '#fda4af' },
  violet: { bg: '#f5f3ff', fg: '#6d28d9', accent: '#c4b5fd' },
  slate: { bg: '#f8fafc', fg: '#334155', accent: '#cbd5e1' },
  emerald: { bg: '#ecfdf5', fg: '#047857', accent: '#6ee7b7' },
  indigo: { bg: '#eef2ff', fg: '#4338ca', accent: '#a5b4fc' },
};

type VisualDef = {
  palette: keyof typeof PALETTE;
  mark: ReactNode;
  label?: string;
};

function ChartBars() {
  return (
    <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M6 18 L6 12" />
      <path d="M11 18 L11 8" />
      <path d="M16 18 L16 10" />
      <path d="M4 20 H20" opacity="0.45" />
    </g>
  );
}

function Coin() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 7.5 V16.5" />
      <path d="M9.2 9.6 C9.2 8.4 10.4 7.6 12 7.6 C13.6 7.6 14.8 8.4 14.8 9.6 C14.8 10.8 13.5 11.4 12 11.8 C10.5 12.2 9.2 12.8 9.2 14 C9.2 15.2 10.4 16.2 12 16.2 C13.6 16.2 14.8 15.3 14.8 14.2" />
    </g>
  );
}

function Hearts() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M12 18.2 C8 15 5.8 12.6 5.8 9.8 C5.8 7.7 7.4 6.2 9.4 6.2 C10.7 6.2 11.7 6.9 12 7.7 C12.3 6.9 13.3 6.2 14.6 6.2 C16.6 6.2 18.2 7.7 18.2 9.8 C18.2 12.6 16 15 12 18.2 Z" />
    </g>
  );
}

function Timeline() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M4 12 H20" />
      <circle cx="7" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </g>
  );
}

function Hex() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M12 3.5 L19 7.5 V15.5 L12 19.5 L5 15.5 V7.5 Z" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </g>
  );
}

function Briefcase() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <path d="M9 8 V6.5 C9 5.7 9.7 5 10.5 5 H13.5 C14.3 5 15 5.7 15 6.5 V8" />
      <path d="M4 13 H20" />
    </g>
  );
}

function Book() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M5 5.5 H11 C12.1 5.5 13 6.4 13 7.5 V18.5 C13 17.7 12.3 17 11.5 17 H5 Z" />
      <path d="M19 5.5 H13 C11.9 5.5 11 6.4 11 7.5 V18.5 C11 17.7 11.7 17 12.5 17 H19 Z" />
    </g>
  );
}

function Leaf() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M6 16 C6 10 10 5 18 5 C18 13 13 17 7 17" />
      <path d="M9 14 C11 12 14 10 17 8" />
    </g>
  );
}

function HomeMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M4 11 L12 4.5 L20 11" />
      <path d="M7 10.5 V18.5 H17 V10.5" />
    </g>
  );
}

function StarMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M12 3.8 L14.3 9.2 L20 9.8 L15.8 13.7 L17 19.3 L12 16.4 L7 19.3 L8.2 13.7 L4 9.8 L9.7 9.2 Z" />
    </g>
  );
}

function GiftMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="5" y="9" width="14" height="10" rx="1.5" />
      <path d="M5 13 H19" />
      <path d="M12 9 V19" />
      <path d="M12 9 C10 6.5 7.5 6.5 7 8.2 C6.6 9.5 8.2 10.5 12 9" />
      <path d="M12 9 C14 6.5 16.5 6.5 17 8.2 C17.4 9.5 15.8 10.5 12 9" />
    </g>
  );
}

function LayersMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M12 4 L20 8 L12 12 L4 8 Z" />
      <path d="M4 12 L12 16 L20 12" />
      <path d="M4 16 L12 20 L20 16" />
    </g>
  );
}

function CalendarMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="4.5" y="6" width="15" height="14" rx="2" />
      <path d="M8 4.5 V7.5" />
      <path d="M16 4.5 V7.5" />
      <path d="M4.5 10.5 H19.5" />
      <path d="M9 14 H11" />
      <path d="M13 14 H15" />
    </g>
  );
}

function SparkMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M12 3.5 V7" />
      <path d="M12 17 V20.5" />
      <path d="M3.5 12 H7" />
      <path d="M17 12 H20.5" />
      <path d="M6.2 6.2 L8.5 8.5" />
      <path d="M15.5 15.5 L17.8 17.8" />
      <path d="M17.8 6.2 L15.5 8.5" />
      <path d="M8.5 15.5 L6.2 17.8" />
    </g>
  );
}

function DocMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M7 4 H14 L18 8 V20 H7 Z" />
      <path d="M14 4 V8 H18" />
      <path d="M10 12 H15" />
      <path d="M10 15.5 H15" />
    </g>
  );
}

function PalmMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 20 V11.5 C8 10.1 9.1 9 10.5 9 C11.9 9 13 10.1 13 11.5 V14" />
      <path d="M13 14 V8.5 C13 7.1 14.1 6 15.5 6 C16.9 6 18 7.1 18 8.5 V16" />
      <path d="M10.5 9 V6.5 C10.5 5.1 11.6 4 13 4 C14.4 4 15.5 5.1 15.5 6.5 V9" />
      <path d="M8 14 C6.3 14 5 15.3 5 17 V20" />
    </g>
  );
}

function CompassMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M14.8 9.2 L13.1 13.1 L9.2 14.8 L10.9 10.9 Z" fill="currentColor" stroke="none" />
    </g>
  );
}

function PeopleMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
      <circle cx="9" cy="9" r="2.6" />
      <circle cx="16" cy="10" r="2.2" />
      <path d="M4.5 18 C4.8 14.8 6.5 13.2 9 13.2 C11.5 13.2 13.2 14.8 13.5 18" />
      <path d="M13.2 18 C13.5 15.6 14.8 14.4 16.2 14.4 C17.8 14.4 19 15.7 19.3 18" />
    </g>
  );
}

function WrenchMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M14.5 6.2 C15.8 5.4 17.4 5.5 18.5 6.6 C19.6 7.7 19.7 9.3 18.9 10.6 L14.2 12.2 L11.8 9.8 Z" />
      <path d="M10.5 11.5 L5.2 16.8 C4.6 17.4 4.6 18.4 5.2 19 C5.8 19.6 6.8 19.6 7.4 19 L12.7 13.7" />
    </g>
  );
}

function GlobeMark() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12 H20" />
      <path d="M12 4 C15 7 15 17 12 20 C9 17 9 7 12 4 Z" />
    </g>
  );
}

function CheckCycle() {
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M8.2 12.2 L10.8 14.8 L16 9.4" />
    </g>
  );
}

const VISUALS: Record<SurfaceVisualKey, VisualDef> = {
  'intent-career': { palette: 'blue', mark: <Briefcase /> },
  'intent-wealth': { palette: 'amber', mark: <Coin /> },
  'intent-relationship': { palette: 'rose', mark: <Hearts /> },
  'intent-yearly': { palette: 'violet', mark: <Timeline /> },
  'method-1': { palette: 'indigo', mark: <Hex /> },
  'method-2': { palette: 'blue', mark: <LayersMark /> },
  'method-3': { palette: 'teal', mark: <Timeline /> },
  'method-4': { palette: 'violet', mark: <PeopleMark /> },
  'method-5': { palette: 'emerald', mark: <CheckCycle /> },
  'tool-yearly': { palette: 'violet', mark: <CalendarMark /> },
  'tool-palm': { palette: 'teal', mark: <PalmMark /> },
  'tool-daily': { palette: 'amber', mark: <SparkMark /> },
  'tool-default': { palette: 'slate', mark: <WrenchMark /> },
  'dim-fortune-rhythm': { palette: 'violet', mark: <ChartBars /> },
  'dim-career-industry': { palette: 'blue', mark: <Briefcase /> },
  'dim-investment': { palette: 'amber', mark: <Coin /> },
  'dim-naming': { palette: 'indigo', mark: <DocMark /> },
  'dim-health': { palette: 'emerald', mark: <Leaf /> },
  'dim-study-career': { palette: 'blue', mark: <Book /> },
  'dim-marriage': { palette: 'rose', mark: <Hearts /> },
  'dim-partnership': { palette: 'teal', mark: <PeopleMark /> },
  'dim-living-environment': { palette: 'amber', mark: <HomeMark /> },
  'dim-timing-selection': { palette: 'violet', mark: <CompassMark /> },
  'nav-home': { palette: 'slate', mark: <HomeMark /> },
  'nav-analyze': { palette: 'blue', mark: <StarMark /> },
  'nav-member': { palette: 'amber', mark: <GiftMark /> },
  'nav-dimensions': { palette: 'indigo', mark: <LayersMark /> },
  'nav-predictions': { palette: 'violet', mark: <CalendarMark /> },
  'nav-sign': { palette: 'amber', mark: <SparkMark /> },
  'nav-docs': { palette: 'slate', mark: <DocMark /> },
  'nav-world-yi': { palette: 'teal', mark: <GlobeMark /> },
  'nav-tools': { palette: 'blue', mark: <WrenchMark /> },
  'nav-review': { palette: 'emerald', mark: <CheckCycle /> },
  'nav-knowledge': { palette: 'indigo', mark: <Book /> },
  'nav-cases': { palette: 'rose', mark: <DocMark /> },
  'nav-reports': { palette: 'violet', mark: <ChartBars /> },
  faq: { palette: 'slate', mark: <DocMark /> },
  default: { palette: 'slate', mark: <Hex /> },
};

export function resolveDimensionVisualKey(slug: string): SurfaceVisualKey {
  const key = `dim-${slug}` as SurfaceVisualKey;
  return key in VISUALS ? key : 'default';
}

export function resolveIntentVisualKey(intent: string): SurfaceVisualKey {
  if (intent === 'career') return 'intent-career';
  if (intent === 'wealth') return 'intent-wealth';
  if (intent === 'relationship') return 'intent-relationship';
  if (intent === 'yearly') return 'intent-yearly';
  return 'default';
}

export function resolveToolVisualKey(href: string): SurfaceVisualKey {
  if (/timing-yearly|yearly|流年|window/.test(href)) return 'tool-yearly';
  if (/palm|手相/.test(href)) return 'tool-palm';
  if (/daily-sign|一签/.test(href)) return 'tool-daily';
  return 'tool-default';
}

export function SurfaceVisual({
  name,
  size = 40,
  className,
  title,
}: {
  name: SurfaceVisualKey;
  size?: number;
  className?: string;
  title?: string;
}) {
  const def = VISUALS[name] || VISUALS.default;
  const colors = PALETTE[def.palette] || PALETTE.slate;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[12px] border',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: colors.bg,
        borderColor: colors.accent,
        color: colors.fg,
      }}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <svg viewBox="0 0 24 24" width={Math.round(size * 0.52)} height={Math.round(size * 0.52)}>
        {def.mark}
      </svg>
    </span>
  );
}
