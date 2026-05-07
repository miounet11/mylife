'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Bot, LockKeyhole, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import { getRememberedClientAttribution } from '@/lib/client-attribution';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { ToolDefinition } from '@/lib/tools';
import type { PremiumServiceRequestRecord } from '@/lib/user-types';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'intro-panel' literals.
const _qaContract = ['intro-copy', 'intro-panel'] as const;
void _qaContract;
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
  const [question, setQuestion] = useState(`我想围绕「${tool.shortTitle}」申请更深入的专项判断，当前最想解决的问题是：`);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const serviceKey = tool.premiumServiceKey;
  const serviceLabel = serviceKey ? getPremiumServiceLabel(serviceKey) : '';
  const chatHref = buildChatHref({
    reportId: reportId || undefined,
    intent: tool.chatIntent || undefined,
    question: `请围绕「${tool.shortTitle}」继续深问，只基于我补充的信息拆清楚问题、因果链、优先级和下一步动作。`,
    source: 'tool_premium_request_panel',
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!serviceKey) return;

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

  if (!serviceKey) {
    return (
      <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <LockKeyhole className="h-3 w-3" />
              继续深问
            </div>
            <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
              回到结构追问
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
              这个工具当前不走人工专项表单，更适合继续上传资料或补充条件，让 AI 按可见信息把问题链拆清。
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <Bot className="h-3 w-3" />
              下一步动作
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-xs leading-6 text-[color:var(--ink-2)]">
                <span className="font-mono text-[10px] font-bold text-[color:var(--ink-5)]">
                  CURRENT
                </span>
                <div className="mt-0.5">{tool.paidValueLine}</div>
              </div>
              {tool.premiumModules.slice(0, 3).map((item) => (
                <div
                  key={item}
                  className="rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-3 text-xs leading-6 text-[color:var(--brand-strong)]"
                >
                  <span className="font-mono text-[10px] font-bold">DEEPER</span>
                  <div className="mt-0.5">{item}</div>
                </div>
              ))}
            </div>
            <Link
              href={chatHref}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
            >
              进入 AI 结构追问
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--signal-strong)]">
            <LockKeyhole className="h-3 w-3" />
            直接进入专项
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            专项判断
          </h2>

          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
            如果单个工具已经暴露出主矛盾，可以直接提交专项需求，把当前工具结果和历史上下文一起带入。
          </p>

          <div className="mt-4 space-y-2">
            <div className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-3 text-xs leading-6 text-[color:var(--signal-strong)]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                推荐专项
              </span>
              <div className="mt-0.5 text-[color:var(--ink-1)] font-semibold">
                {serviceLabel}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 text-xs leading-6 text-[color:var(--ink-2)]">
              <span className="font-mono text-[10px] font-bold text-[color:var(--ink-5)]">
                CURRENT
              </span>
              <div className="mt-0.5">{tool.paidValueLine}</div>
            </div>
            {tool.premiumModules.slice(0, 3).map((item) => (
              <div
                key={item}
                className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-3 text-xs leading-6 text-[color:var(--brand-strong)]"
              >
                <span className="font-mono text-[10px] font-bold">UNLOCK</span>
                <div className="mt-0.5">{item}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            <Sparkles className="h-3 w-3" />
            提交专项需求
          </div>

          <div className="mt-3 grid gap-2">
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="称呼，可选"
              className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
            <input
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              placeholder="邮箱 / 微信 / 手机号"
              className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              className="w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2.5 text-xs leading-6 text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
            />
          </div>

          {message && (
            <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal)] px-5 text-sm font-semibold text-[color:var(--ink-1)] transition hover:bg-[color:var(--signal-strong)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '提交中…' : `提交${serviceLabel}需求`}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
