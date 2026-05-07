'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution, type ClientAttributionRecord } from '@/lib/client-attribution';

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
      const response = await fetch('/api/tools/run', {
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
      });
      const payload = await response.json();
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
    } catch {
      setError('网络异常，暂时无法运行工具');
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
    <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/82 p-5">
      <div className="text-sm font-semibold text-[color:var(--ink)]">补充一句当前场景</div>
      {!hasReport ? (
        <div className="mt-3 rounded-[1.2rem] border border-amber-200 bg-amber-50/85 px-4 py-3 text-xs leading-6 text-amber-900">
          这个工具需要先读取你的综合报告。先完成一次综合判断，再回来运行，会更快也更准。
        </div>
      ) : null}
      {submitting ? (
        <div className="mt-3 rounded-[1.2rem] border border-[color:var(--line)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
          生成中...
        </div>
      ) : null}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        placeholder={promptHint || '例如：我正在考虑 4 月换岗，这次是该继续争取还是先保守？'}
        className="smooth-input mt-4 w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
      />
      {signaturePromise || decisionLens ? (
        <div className="mt-4 rounded-[1.2rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
          {signaturePromise ? (
            <div>
              <span className="font-semibold text-[color:var(--accent-strong)]">这个工具会替你拆清：</span>
              {signaturePromise}
            </div>
          ) : null}
          {decisionLens ? (
            <div className={signaturePromise ? 'mt-2' : ''}>
              <span className="font-semibold text-[color:var(--accent-strong)]">判断视角：</span>
              {decisionLens}
            </div>
          ) : null}
        </div>
      ) : null}
      {examples.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <Sparkles className="h-3.5 w-3.5" />
            不想自己组织问题，可以直接点一个
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.slice(0, 3).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setNote(example)}
                className="rounded-full border border-[color:var(--line)] bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-[color:var(--ink)] transition hover:bg-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-2 text-right text-xs text-[color:var(--muted)]">
        {noteLength > 0 ? `已输入 ${noteLength} 字` : '也可以留空直接运行，系统会按这份综合报告给你先出一版判断。'}
      </div>
      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="action-primary action-main smooth-button mt-4 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          hasReport
            ? (noteLength > 0 ? '开始这个工具' : '直接开始这个工具')
            : '先完成综合判断'
        )}
      </button>
      {!hasReport ? (
        <Link href={analyzeHref} className="action-secondary mt-3 inline-flex items-center justify-between">
          去生成综合报告
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </form>
  );
}
