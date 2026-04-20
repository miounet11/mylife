'use client';

import { useState } from 'react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution } from '@/lib/client-attribution';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { ToolDefinition } from '@/lib/tools';
import type { PremiumServiceRequestRecord } from '@/lib/user-types';

export default function ToolPremiumRequestPanel({
  tool,
  reportId,
  page,
}: {
  tool: ToolDefinition;
  reportId?: string;
  page: string;
}) {
  const [contactName, setContactName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [question, setQuestion] = useState(`我想围绕“${tool.shortTitle}”申请更深入的专项判断，当前最想解决的问题是：`);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const serviceKey = tool.premiumServiceKey || 'event-verdict';
  const serviceLabel = getPremiumServiceLabel(serviceKey);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (question.trim().length < 8) {
      setError('请先写清楚你最想解决的一件事情。');
      return;
    }

    if (!contactValue.trim()) {
      setError('请留下邮箱、微信或手机号。');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/premium-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          toolSlug: tool.slug,
          serviceKey,
          contactName,
          contactValue,
          preferredContact: '工具页提交',
          question,
          attribution: getRememberedClientAttribution(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '提交失败，请稍后再试');
        return;
      }

      const created = data.data as PremiumServiceRequestRecord | undefined;
      setMessage(created ? '专项需求已提交，系统会把当前工具和你的历史测算一起带入后续跟进。' : '专项需求已提交。');
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page,
        meta: {
          target: 'tool_premium_request_submit',
          toolSlug: tool.slug,
          serviceKey,
          reportId: reportId || null,
          attributionSource: getRememberedClientAttribution()?.source || null,
          attributionTarget: getRememberedClientAttribution()?.target || null,
        },
      });
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="section-label">
            <LockKeyhole className="h-3.5 w-3.5" />
            直接进入专项
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
            专项判断
          </h2>

          <div className="intro-copy mt-3 text-sm text-[color:var(--muted)]">
            如果单个工具已经暴露出主矛盾，可以直接提交专项需求，把当前工具结果和历史上下文一起带入。
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.25rem] bg-white/82 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              推荐专项：{serviceLabel}
            </div>
            <div className="rounded-[1.25rem] bg-white/82 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              当前付费点：{tool.paidValueLine}
            </div>
            {tool.premiumModules.slice(0, 3).map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-[color:var(--accent-soft)] px-4 py-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                解锁后会展开：{item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="intro-panel rounded-[1.75rem] border border-[color:var(--line)] bg-white/84 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Sparkles className="h-4 w-4" />
            提交专项需求
          </div>

          <div className="mt-4 grid gap-4">
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="称呼，可选"
              className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)]"
            />
            <input
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              placeholder="邮箱 / 微信 / 手机号"
              className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)]"
            />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              className="w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-xs leading-6 outline-none focus:border-[color:var(--accent)]"
            />
          </div>

          {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 inline-flex items-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? '提交中...' : `提交${serviceLabel}需求`}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
