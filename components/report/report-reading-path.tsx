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
  if (status === 'current') return 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]';
  if (status === 'next') return 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  if (status === 'watch') return 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] text-[color:var(--ink-2)]';
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
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Route className="h-3 w-3" />
            分层阅读路径
          </div>
          <h2 className="mt-2 text-lg font-black leading-snug text-[color:var(--ink-1)] md:text-xl">
            {route.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{route.summary}</p>
          {route.correctionHint ? (
            <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]">
              {route.correctionHint}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 lg:w-64">
          <ResultCtaLink
            href={route.primaryAction.href}
            page={`/result/${reportId}`}
            target={route.primaryAction.target}
            className="inline-flex h-10 w-full items-center justify-between gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
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
          <div className="mt-1.5 text-[10px] leading-4 text-[color:var(--ink-5)]">
            {route.primaryAction.description}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {route.layers.map((layer) => {
          const Icon = layerIcons[layer.key];
          return (
            <ResultCtaLink
              key={layer.key}
              href={layer.href}
              page={`/result/${reportId}`}
              target={`report_journey_layer_${layer.key}`}
              className={`rounded-[var(--radius)] border px-3 py-3 transition hover:border-[color:var(--brand)] ${statusClasses(layer.status)}`}
              meta={{
                reportId,
                workflowId: route.workflowId,
                layerKey: layer.key,
                source: route.source,
                ctaStrategyKey: ctaStrategyKey || null,
                sourceFamily: sourceFamily || null,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <Icon className="h-3.5 w-3.5" />
                  {layer.title}
                </div>
                <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {layer.badge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 opacity-85">{layer.description}</p>
            </ResultCtaLink>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            测算方式 / 结果组合
          </div>
          <div className="mt-2 text-sm font-bold text-[color:var(--ink-1)]">
            {route.measurementSummary.totalStages > 0
              ? `${route.measurementSummary.totalStages} 个环节 · 均分 ${Math.round(route.measurementSummary.averageScore)}`
              : '测算环节待补齐'}
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">
            {route.measurementSummary.resultCombinationSummary}
          </p>
          {route.measurementSummary.strongStages.length > 0 ? (
            <div className="mt-2 grid gap-1.5 md:grid-cols-2">
              {route.measurementSummary.strongStages.slice(0, 4).map((stage) => (
                <div key={stage.id} className="rounded-[var(--radius-sm)] border border-[rgba(47,125,82,0.25)] bg-[rgba(47,125,82,0.08)] px-2 py-1.5 text-[10px] leading-4 text-[color:var(--data-up)]">
                  {stage.label}：{Math.round(stage.score)} 分 · {stage.conclusion}
                </div>
              ))}
            </div>
          ) : null}
          {route.measurementSummary.optimizationPriorities.length > 0 ? (
            <div className="mt-2 space-y-1">
              {route.measurementSummary.optimizationPriorities.map((stage) => (
                <div key={stage.id} className="rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-2 py-1.5 text-[10px] leading-4 text-[color:var(--signal-strong)]">
                  {stage.label}：{stage.reason} · 优先级建议：{stage.optimizationHint}
                </div>
              ))}
            </div>
          ) : null}
          {route.measurementSummary.stages.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {route.measurementSummary.stages.map((stage) => {
                const toneClass = stage.status === 'strong'
                  ? 'border-[rgba(47,125,82,0.25)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                  : stage.status === 'stable'
                    ? 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-2)]'
                    : 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
                return (
                  <div key={stage.id} className={`rounded-[var(--radius-sm)] border px-2.5 py-2 text-[10px] leading-4 ${toneClass}`}>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[color:var(--ink-1)]">
                      <span className="truncate">{stage.order}. {stage.label}</span>
                      <span className="shrink-0 font-mono">{Math.round(stage.score)} 分</span>
                    </div>
                    <div className="mt-1 text-[10px] leading-4 text-[color:var(--ink-4)]">{stage.conclusion}</div>
                    <div className="mt-1 text-[10px] leading-4 text-[color:var(--ink-5)]">优化建议：{stage.optimizationHint}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            组合路线
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {route.combinationRoutes.map((item) => (
              <ResultCtaLink
                key={item.key}
                href={item.href}
                page={`/result/${reportId}`}
                target={`report_journey_combination_${item.key}`}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 py-2 transition hover:border-[color:var(--brand)]"
                meta={{
                  reportId,
                  workflowId: route.workflowId,
                  combinationKey: item.key,
                  source: route.source,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                }}
              >
                <div className="text-xs font-bold text-[color:var(--ink-1)]">{item.label}</div>
                <div className="mt-1 text-[10px] leading-4 text-[color:var(--ink-4)]">{item.reason}</div>
                {item.boundary ? <div className="mt-1 text-[10px] leading-4 text-[color:var(--ink-5)]">{item.boundary}</div> : null}
              </ResultCtaLink>
            ))}
          </div>
        </div>
      </div>

      {route.categoryRoutes.length > 0 ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            专项推荐顺序
          </div>
          <div className="mt-2.5 grid gap-2 md:grid-cols-3">
            {route.categoryRoutes.map((item) => (
              <ResultCtaLink
                key={item.toolSlug}
                href={item.href}
                page={`/result/${reportId}`}
                target={item.primary ? 'report_journey_primary_category' : 'report_journey_secondary_category'}
                className="group rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 transition hover:border-[color:var(--brand)]"
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
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                  {item.categoryLabel}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm font-bold text-[color:var(--ink-1)]">
                  <span className="truncate">{item.toolTitle}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-[color:var(--ink-5)] transition group-hover:text-[color:var(--brand-strong)]" />
                </div>
                <div className="mt-1 text-[10px] leading-4 text-[color:var(--ink-4)]">{item.reason}</div>
              </ResultCtaLink>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
