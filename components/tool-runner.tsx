'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution } from '@/lib/client-attribution';

export default function ToolRunner({
  toolSlug,
  reportId,
}: {
  toolSlug: string;
  reportId?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const noteLength = note.trim().length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');
    const attribution = getRememberedClientAttribution();
    void trackClientEvent({
      eventName: 'tool_run_started',
      page: `/tools/${toolSlug}`,
      meta: {
        toolSlug,
        reportId: reportId || null,
        noteLength: note.trim().length,
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

      router.push(`/tool-result/${payload.data.sessionId}`);
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
      <div className="intro-copy mt-2">输入 12-40 字即可，系统会自动结合你的档案与历史结果。</div>
      <div className="intro-panel mt-3">本次结果会自动保存，下次运行可直接继承。</div>
      {submitting ? (
        <div className="mt-3 rounded-[1.2rem] border border-[color:var(--line)] bg-white px-4 py-3 text-xs text-[color:var(--muted)]">
          正在生成中，通常只需要几秒。请不要重复点击提交。
        </div>
      ) : null}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        placeholder="例如：我正在考虑 4 月换岗，这次是该继续争取还是先保守？"
        className="smooth-input mt-4 w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
      />
      <div className="mt-2 text-right text-xs text-[color:var(--muted)]">
        {noteLength > 0 ? `已输入 ${noteLength} 字` : '建议输入 12-40 字，会更准确'}
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
            正在生成结果...
          </>
        ) : (
          '开始这个工具'
        )}
      </button>
    </form>
  );
}
