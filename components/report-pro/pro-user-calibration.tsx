'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';
import { trackClientEvent } from '@/lib/analytics-client';
import {
  buildEstimatedPastEventDescription,
  getEstimatedPastEventDateKey,
} from '@/lib/event-view';
import { presentReportText } from '@/lib/report-presentation';

type PastTemplate = {
  key: string;
  title: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  description: string;
  reason: string;
  confidenceLabel?: 'high' | 'medium';
  occurrenceWindow?: string;
};

type SaveResponse = { success?: boolean; error?: string };

/**
 * 正常报告区的校准交互：用真实经历提升后续测算准确率
 * - 过去节点是否发生
 * - 报告准不准
 * - 时辰把握程度
 */
export default function ProUserCalibration({
  reportId,
  canManage = false,
  pastEventTemplates = [],
}: {
  reportId: string;
  canManage?: boolean;
  pastEventTemplates?: PastTemplate[];
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<string[]>([]);
  const [accuracy, setAccuracy] = useState<'good' | 'partial' | 'bad' | null>(null);
  const [birthCertainty, setBirthCertainty] = useState<'exact' | 'approx' | 'unknown' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const markDone = (key: string) => setDoneKeys((c) => (c.includes(key) ? c : [...c, key]));

  const savePast = async (item: PastTemplate, occurred: boolean) => {
    if (!canManage || busyKey) return;
    setBusyKey(item.key);
    setError('');
    try {
      if (occurred) {
        const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: item.type,
            title: item.title,
            date: getEstimatedPastEventDateKey(),
            description: buildEstimatedPastEventDescription(item.description, item.occurrenceWindow),
            impact: item.type === 'health' ? 'negative' : 'neutral',
            reminderEnabled: false,
            source: 'pro_calibration',
            page: `/result/${reportId}`,
            fortuneAnalysis: {
              source: 'pro_calibration',
              reportId,
              suggestionKey: item.key,
              reason: item.reason,
              title: item.title,
              templateKind: 'past_event',
              occurrenceWindow: item.occurrenceWindow,
            },
            userFeedback: {
              wasAccurate: true,
              userNotes: '用户确认：该节点确实发生过。',
            },
          }),
          timeoutMs: 12_000,
          timeoutReason: 'calibration-past-save',
        });
        if (!response.ok || !data.success) {
          setError(data.error || '保存失败');
          return;
        }
      } else {
        // 未发生：记一条反馈，帮助系统降权该模板
        const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'content_wrong',
            message: `校准：报告节点「${item.title}」用户标记为未发生。窗口：${item.occurrenceWindow || '未知'}。原因参考：${item.reason || ''}`,
            pageUrl: typeof window !== 'undefined' ? window.location.href : `/result/${reportId}`,
          }),
          timeoutMs: 12_000,
          timeoutReason: 'calibration-past-miss',
        });
        if (!response.ok || !data.success) {
          setError(data.error || '提交失败');
          return;
        }
      }
      markDone(item.key);
      void trackClientEvent({
        eventName: occurred ? 'calibration_past_confirmed' : 'calibration_past_denied',
        page: `/result/${reportId}`,
        meta: { reportId, templateKey: item.key },
      });
      setMessage(occurred ? '已记录「发生过」，后续判断会参考这条样本。' : '已记录「未发生」，感谢校准。');
    } catch (e) {
      setError(isAbortLikeError(e) ? '请求超时，请重试' : '网络异常');
    } finally {
      setBusyKey(null);
    }
  };

  const submitAccuracy = async (level: 'good' | 'partial' | 'bad') => {
    if (busyKey) return;
    setBusyKey(`acc-${level}`);
    setError('');
    try {
      const label =
        level === 'good' ? '整体较准' : level === 'partial' ? '部分准' : '偏差较大';
      const category = level === 'good' ? 'suggestion' : 'content_wrong';
      const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: `报告准确度反馈：${label}。reportId=${reportId}`,
          pageUrl: typeof window !== 'undefined' ? window.location.href : `/result/${reportId}`,
        }),
        timeoutMs: 12_000,
        timeoutReason: 'calibration-accuracy',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '提交失败');
        return;
      }
      setAccuracy(level);
      markDone(`acc-${level}`);
      void trackClientEvent({
        eventName: 'calibration_accuracy',
        page: `/result/${reportId}`,
        meta: { reportId, level },
      });
      setMessage('感谢反馈，会用于改进后续测算。');
    } catch (e) {
      setError(isAbortLikeError(e) ? '请求超时，请重试' : '网络异常');
    } finally {
      setBusyKey(null);
    }
  };

  const submitBirthCertainty = async (level: 'exact' | 'approx' | 'unknown') => {
    if (busyKey) return;
    setBusyKey(`birth-${level}`);
    setError('');
    try {
      const label =
        level === 'exact' ? '时辰确定' : level === 'approx' ? '时辰大概知道' : '时辰不确定';
      const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'suggestion',
          message: `出生时辰把握：${label}。reportId=${reportId}。时辰不确定时后续应降低时柱相关权重。`,
          pageUrl: typeof window !== 'undefined' ? window.location.href : `/result/${reportId}`,
        }),
        timeoutMs: 12_000,
        timeoutReason: 'calibration-birth',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '提交失败');
        return;
      }
      setBirthCertainty(level);
      void trackClientEvent({
        eventName: 'calibration_birth_certainty',
        page: `/result/${reportId}`,
        meta: { reportId, level },
      });
      setMessage(
        level === 'unknown'
          ? '已记下时辰不确定。若能补准确时辰，重测会明显更准。'
          : '已记下，感谢补充。'
      );
    } catch (e) {
      setError(isAbortLikeError(e) ? '请求超时，请重试' : '网络异常');
    } finally {
      setBusyKey(null);
    }
  };

  const templates = pastEventTemplates.slice(0, 4);

  return (
    <section id="pro-calibration" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="text-[12px] font-medium text-[color:var(--ink-5)]">校准</div>
      <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--ink-1)]">用真实经历校准这份报告</h2>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
        点几下即可，帮助后续判断更贴近你的现实。
      </p>

      {/* 1. 准确度 */}
      <div className="mt-4 border-t border-[color:var(--hairline)] pt-3">
        <div className="text-[13px] font-medium text-[color:var(--ink-1)]">1. 这份报告整体准不准？</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
          {(
            [
              { key: 'good' as const, label: '整体较准' },
              { key: 'partial' as const, label: '部分准' },
              { key: 'bad' as const, label: '偏差较大' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={!!busyKey}
              onClick={() => void submitAccuracy(opt.key)}
              className={`underline-offset-2 ${
                accuracy === opt.key
                  ? 'font-medium text-[color:var(--ink-1)]'
                  : 'text-[color:var(--ink-3)] hover:underline'
              }`}
            >
              {accuracy === opt.key ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : null}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 时辰 */}
      <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
        <div className="text-[13px] font-medium text-[color:var(--ink-1)]">2. 出生时辰你有多确定？</div>
        <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
          时辰不准会主要影响「时柱」相关判断（子女、晚景、部分节奏）。
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(
            [
              { key: 'exact' as const, label: '确定' },
              { key: 'approx' as const, label: '大概知道' },
              { key: 'unknown' as const, label: '不确定' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={!!busyKey}
              onClick={() => void submitBirthCertainty(opt.key)}
              className={`text-[13px] underline-offset-2 ${
                birthCertainty === opt.key
                  ? 'font-medium text-[color:var(--ink-1)]'
                  : 'text-[color:var(--ink-3)] hover:underline'
              }`}
            >
              {birthCertainty === opt.key ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : null}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 过去节点 */}
      {templates.length > 0 ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="text-[13px] font-medium text-[color:var(--ink-1)]">
            3. 这些节点是否在你身上发生过？
          </div>
          <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
            「发生了」记入事件样本；「没有」帮助少推类似模板。
          </p>
          <ul className="mt-2 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
            {templates.map((item) => {
              const done = doneKeys.includes(item.key);
              const title = presentReportText(item.title, 40);
              const windowText = presentReportText(item.occurrenceWindow, 32);
              return (
                <li key={item.key} className="py-2.5">
                  <div className="text-[13px] font-medium text-[color:var(--ink-1)]">{title}</div>
                  {windowText ? (
                    <div className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">可能时段 · {windowText}</div>
                  ) : null}
                  {done ? (
                    <div className="mt-1.5 text-[12px] text-[color:var(--ink-5)]">已记录</div>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                      <button
                        type="button"
                        disabled={!canManage || !!busyKey}
                        onClick={() => void savePast(item, true)}
                        className="text-[color:var(--ink-1)] underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {busyKey === item.key ? '…' : '发生了'}
                      </button>
                      <button
                        type="button"
                        disabled={!!busyKey}
                        onClick={() => void savePast(item, false)}
                        className="text-[color:var(--ink-3)] underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        没有
                      </button>
                      {!canManage ? (
                        <span className="text-[11px] text-[color:var(--ink-5)]">
                          登录后「发生了」可写入事件本
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-[12px] font-semibold text-[#047857]">{message}</p>
      ) : null}
      {error ? <p className="mt-2 text-[12px] text-[color:var(--alert)]">{error}</p> : null}
    </section>
  );
}
