import { ArrowRight, CheckCircle2, Compass, Layers3, Route, ShieldCheck } from 'lucide-react';
import ResultCtaLink from '@/components/result-cta-link';
import type { LayeredReportJourney, ReportJourneyLayerStatus } from '@/lib/report-journey-router';

const layerIcons = {
  'first-report': CheckCircle2,
  'deep-report': Layers3,
  'category-report': Compass,
  'event-validation': ShieldCheck,
} as const;

function statusClasses(status: ReportJourneyLayerStatus) {
  if (status === 'current') return 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (status === 'next') return 'border-emerald-200 bg-emerald-50/80 text-emerald-800';
  if (status === 'watch') return 'border-amber-200 bg-amber-50/80 text-amber-900';
  return 'border-[color:var(--line)] bg-white/84 text-[color:var(--ink)]';
}

export default function ReportReadingPath({
  route,
  reportId,
  ctaStrategyKey,
  sourceFamily,
}: {
  route: LayeredReportJourney;
  reportId: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/72 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <Route className="h-3.5 w-3.5" />
            分层阅读路径
          </div>
          <h2 className="mt-3 text-xl font-black text-[color:var(--ink)] md:text-2xl">{route.headline}</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{route.summary}</p>
          {route.correctionHint ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-6 text-amber-900">
              {route.correctionHint}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 lg:w-64">
          <ResultCtaLink
            href={route.primaryAction.href}
            page={`/result/${reportId}`}
            target={route.primaryAction.target}
            className="action-primary action-main justify-between"
            meta={{
              reportId,
              workflowId: route.workflowId,
              source: route.source,
              ctaStrategyKey: ctaStrategyKey || null,
              sourceFamily: sourceFamily || null,
            }}
          >
            {route.primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </ResultCtaLink>
          <div className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{route.primaryAction.description}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {route.layers.map((layer) => {
          const Icon = layerIcons[layer.key];
          return (
            <ResultCtaLink
              key={layer.key}
              href={layer.href}
              page={`/result/${reportId}`}
              target={`report_journey_layer_${layer.key}`}
              className={`rounded-[1.1rem] border px-4 py-3.5 transition hover:border-[color:var(--accent)] ${statusClasses(layer.status)}`}
              meta={{
                reportId,
                workflowId: route.workflowId,
                layerKey: layer.key,
                source: route.source,
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Icon className="h-4 w-4" />
                  {layer.title}
                </div>
                <span className="rounded-full bg-white/78 px-2.5 py-1 text-[11px] font-semibold">
                  {layer.badge}
                </span>
              </div>
              <p className="mt-3 text-xs leading-6 opacity-85">{layer.description}</p>
            </ResultCtaLink>
          );
        })}
      </div>

      {route.categoryRoutes.length > 0 ? (
        <div className="mt-4 rounded-[1.1rem] bg-slate-50/80 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">专项推荐顺序</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {route.categoryRoutes.map((item) => (
              <ResultCtaLink
                key={item.toolSlug}
                href={item.href}
                page={`/result/${reportId}`}
                target={item.primary ? 'report_journey_primary_category' : 'report_journey_secondary_category'}
                className="rounded-[1rem] border border-[color:var(--line)] bg-white px-4 py-3.5 transition hover:border-[color:var(--accent)]"
                meta={{
                  reportId,
                  workflowId: route.workflowId,
                  toolSlug: item.toolSlug,
                  category: item.category,
                  source: route.source,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                }}
              >
                <div className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--muted)]">{item.categoryLabel}</div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm font-bold text-[color:var(--ink)]">
                  <span>{item.toolTitle}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent-strong)]" />
                </div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
              </ResultCtaLink>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
