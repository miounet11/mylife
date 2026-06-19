'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution, type ClientAttributionRecord } from '@/lib/client-attribution';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

const TOOL_RUN_TIMEOUT_MS = 20_000;

export default function ToolRunner({
  toolSlug,
  reportId,
  promptHint,
  signaturePromise,
  decisionLens,
  examples = [],
  analyzeHref = '/analyze',
  hasReport = true,
  entrySource = '',
}: {
  toolSlug: string;
  reportId?: string;
  promptHint?: string;
  signaturePromise?: string;
  decisionLens?: string;
  examples?: string[];
  analyzeHref?: string;
  hasReport?: boolean;
  entrySource?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const noteLength = note.trim().length;

  const buildAttribution = (): ClientAttributionRecord | null => {
    const remembered = getRememberedClientAttribution();
    if (remembered) {
      return remembered;
    }

    if (!entrySource) {
      return null;
    }

    return {
      eventName: 'tool_detail_viewed',
      page: `/tools/${toolSlug}`,
      source: entrySource,
      toolSlug,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!hasReport) {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: `/tools/${toolSlug}`,
        meta: {
          target: 'tool_runner_requires_report',
          toolSlug,
          source: 'tool_runner',
        },
      });
      router.push(analyzeHref);
      return;
    }

    setSubmitting(true);
    setError('');
    const attribution = buildAttribution();
    void trackClientEvent({
      eventName: 'tool_run_started',
      page: `/tools/${toolSlug}`,
      meta: {
        phase: 'client_intent',
        confirmed: false,
        toolSlug,
        reportId: reportId || null,
        noteLength: note.trim().length,
        source: entrySource || attribution?.source || null,
        attributionSource: attribution?.source || null,
        attributionTarget: attribution?.target || null,
      },
    });

    try {
      const { response, data: payload } = await fetchJsonWithTimeout<any>('/api/tools/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolSlug,
          reportId,
          note,
          attribution,
        }),
        timeoutMs: TOOL_RUN_TIMEOUT_MS,
        timeoutReason: 'tool-run-timeout',
      });
      if (!response.ok || !payload.success) {
        setError(payload.error || '运行失败，请稍后再试');
        void trackClientEvent({
          eventName: 'result_cta_clicked',
          page: `/tools/${toolSlug}`,
          meta: {
            target: 'tool_run_failed',
            toolSlug,
            reportId: reportId || null,
            reason: payload.error || 'unknown',
            attributionSource: attribution?.source || null,
            attributionTarget: attribution?.target || null,
          },
        });
        if (payload.redirectTo) {
          router.push(payload.redirectTo);
        }
        return;
      }

      const resultHref = entrySource
        ? `/tool-result/${payload.data.sessionId}?source=${encodeURIComponent(entrySource)}`
        : `/tool-result/${payload.data.sessionId}`;
      router.push(resultHref);
    } catch (runError) {
      setError(isAbortLikeError(runError) ? '工具运行等待时间过长，请稍后重试' : '网络异常，暂时无法运行工具');
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: `/tools/${toolSlug}`,
        meta: {
          target: 'tool_run_network_error',
          toolSlug,
          reportId: reportId || null,
          attributionSource: attribution?.source || null,
          attributionTarget: attribution?.target || null,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        补充一句当前场景
      </div>
      {!hasReport ? (
        <div className="mt-2 rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]">
          这个工具需要先读取你的综合报告。先完成一次综合判断，再回来运行，会更快也更准。
        </div>
      ) : null}
      {submitting ? (
        <div className="mt-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--ink-4)]">
          <Loader2 className="mr-1.5 inline-block h-3 w-3 animate-spin" />
          生成中…
        </div>
      ) : null}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        placeholder={promptHint || '例如：我正在考虑 4 月换岗，这次是该继续争取还是先保守？'}
        className="mt-3 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2.5 text-sm leading-6 text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
      />
      {signaturePromise || decisionLens ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 text-xs leading-6 text-[color:var(--ink-3)]">
          {signaturePromise ? (
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">SCOPE</span>
              <div className="mt-0.5 text-[color:var(--ink-2)]">{signaturePromise}</div>
            </div>
          ) : null}
          {decisionLens ? (
            <div className={signaturePromise ? 'mt-2' : ''}>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">LENS</span>
              <div className="mt-0.5 text-[color:var(--ink-2)]">{decisionLens}</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {examples.length > 0 ? (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            <Sparkles className="h-3 w-3" />
            不想自己组织问题，直接点一个
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {examples.slice(0, 3).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setNote(example)}
                className="inline-flex max-w-full items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 py-1 text-left text-xs font-semibold text-[color:var(--ink-3)] line-clamp-2 transition hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-2 text-right text-xs font-mono tabular-nums text-[color:var(--ink-5)]">
        {noteLength > 0 ? `${noteLength} chars` : 'optional · 也可直接运行'}
      </div>
      {error ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            生成中…
          </>
        ) : hasReport ? (
          noteLength > 0 ? '开始这个工具' : '直接开始这个工具'
        ) : (
          '先完成综合判断'
        )}
      </button>
      {!hasReport ? (
        <Link
          href={analyzeHref}
          className="mt-2 inline-flex h-10 w-full items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-4 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
        >
          去生成综合报告
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </form>
  );
}
