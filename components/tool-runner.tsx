'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution, type ClientAttributionRecord } from '@/lib/client-attribution';
import { loadRememberedBirthForm, saveRememberedBirthForm } from '@/lib/birth-form-storage';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

const TOOL_RUN_TIMEOUT_MS = 45_000;

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
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState('');
  const [rememberedHint, setRememberedHint] = useState('');
  const noteLength = note.trim().length;
  const birthReady = Boolean(birthDate && /^\d{4}-\d{2}-\d{2}/.test(birthDate));
  const canRunWithBirth = !hasReport && birthReady;
  const canSubmit = hasReport || canRunWithBirth;

  useEffect(() => {
    if (hasReport) return;
    const remembered = loadRememberedBirthForm();
    if (!remembered) return;
    setBirthDate(remembered.birthDate);
    setBirthTime(remembered.birthTime || '12:00');
    setGender(remembered.gender);
    if (remembered.name) setName(remembered.name);
    setRememberedHint('已填入本机记住的出生信息，可修改后再运行。');
  }, [hasReport]);

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

    if (!hasReport && !birthReady) {
      setError('请填写出生日期，或先完成综合判断');
      return;
    }

    setSubmitting(true);
    setError('');
    const attribution = buildAttribution();
    const birthOnly = !hasReport && birthReady;
    void trackClientEvent({
      eventName: 'tool_run_started',
      page: `/tools/${toolSlug}`,
      meta: {
        phase: 'client_intent',
        confirmed: false,
        toolSlug,
        reportId: reportId || null,
        birthOnly,
        noteLength: note.trim().length,
        source: entrySource || attribution?.source || null,
        attributionSource: attribution?.source || null,
        attributionTarget: attribution?.target || null,
      },
    });

    try {
      const body: Record<string, unknown> = {
        toolSlug,
        note,
        attribution,
      };
      if (hasReport && reportId) {
        body.reportId = reportId;
      } else if (birthOnly) {
        body.birthDate = birthDate;
        body.birthTime = birthTime || '12:00';
        body.gender = gender;
        if (name.trim()) body.name = name.trim();
        saveRememberedBirthForm({
          birthDate,
          birthTime: birthTime || '12:00',
          gender,
          name: name.trim(),
        });
      }

      const { response, data: payload } = await fetchJsonWithTimeout<any>('/api/tools/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
            birthOnly,
            reason: payload.error || 'unknown',
            attributionSource: attribution?.source || null,
            attributionTarget: attribution?.target || null,
          },
        });
        // Prefer birth form over hard redirect when allowBirthOnly
        if (payload.redirectTo && !payload.allowBirthOnly && !birthOnly) {
          router.push(payload.redirectTo);
        }
        return;
      }

      const sessionId = payload.data?.sessionId;
      if (!sessionId) {
        setError('结果已生成但缺少会话 ID，请重试');
        return;
      }
      const resultHref = entrySource
        ? `/tool-result/${sessionId}?source=${encodeURIComponent(entrySource)}`
        : `/tool-result/${sessionId}`;
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
        {hasReport ? '补充一句当前场景' : '填生日即可测 · 可选场景'}
      </div>

      {!hasReport ? (
        <div className="mt-3 space-y-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
          <p className="text-xs leading-5 text-[color:var(--ink-3)]">
            尚未关联综合报告时，可先用出生信息即时重算引擎真值，再给出本工具主题判断。完整报告会更细。
          </p>
          {rememberedHint ? (
            <p className="text-[11px] text-[color:var(--brand-strong)]">{rememberedHint}</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-[11px] font-semibold text-[color:var(--ink-4)]">
              出生日期 <span className="text-[color:var(--alert)]">*</span>
              <input
                type="date"
                required={!hasReport}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2 text-sm text-[color:var(--ink-1)] outline-none focus:border-[color:var(--brand)]"
              />
            </label>
            <label className="block text-[11px] font-semibold text-[color:var(--ink-4)]">
              出生时辰
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2 text-sm text-[color:var(--ink-1)] outline-none focus:border-[color:var(--brand)]"
              />
            </label>
            <label className="block text-[11px] font-semibold text-[color:var(--ink-4)]">
              性别（排大运）
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value === 'female' ? 'female' : 'male')}
                className="mt-1 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2 text-sm text-[color:var(--ink-1)] outline-none focus:border-[color:var(--brand)]"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </label>
            <label className="block text-[11px] font-semibold text-[color:var(--ink-4)]">
              称呼（可选）
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：本人"
                className="mt-1 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2 text-sm text-[color:var(--ink-1)] outline-none focus:border-[color:var(--brand)] placeholder:text-[color:var(--ink-5)]"
              />
            </label>
          </div>
        </div>
      ) : null}

      {submitting ? (
        <div className="mt-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs text-[color:var(--ink-4)]">
          <Loader2 className="mr-1.5 inline-block h-3 w-3 animate-spin" />
          {hasReport ? '生成中…' : '正在按出生信息重算引擎并生成…'}
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
        disabled={submitting || !canSubmit}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            生成中…
          </>
        ) : hasReport ? (
          noteLength > 0 ? '开始这个工具' : '直接开始这个工具'
        ) : birthReady ? (
          '用出生信息开始这个工具'
        ) : (
          '请先填写出生日期'
        )}
      </button>
      {!hasReport ? (
        <Link
          href={analyzeHref}
          className="mt-2 inline-flex h-10 w-full items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-4 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
        >
          或生成完整综合报告（更细）
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </form>
  );
}
