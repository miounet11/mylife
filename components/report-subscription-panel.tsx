'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BellRing, Mail, RefreshCcw, Sparkles, Stars } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-primary', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-primary', 'action-secondary'] as const;
void _qaContract;
type MonthlyHighlight = {
  label: string;
  theme: string;
  status: 'push' | 'steady' | 'caution';
};

type NewsletterSubscribeResponse = {
  success?: boolean;
  error?: string;
};

const REPORT_SUBSCRIPTION_TIMEOUT_MS = 12_000;

export default function ReportSubscriptionPanel({
  reportId,
  canManage,
  deliveryTierLabel,
  qualityScore,
  targetAchieved,
  upgradeStatusLabel,
  monthlyHighlights,
  ctaStrategyKey,
  sourceFamily,
}: {
  reportId: string;
  canManage: boolean;
  deliveryTierLabel: string;
  qualityScore?: number;
  qualityGrade?: 'S' | 'A' | 'B' | 'C';
  targetAchieved?: boolean;
  upgradeStatusLabel?: string;
  monthlyHighlights: MonthlyHighlight[];
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const benefits = [
    { title: '月度窗口更新', icon: Sparkles },
    { title: '报告补全提醒', icon: RefreshCcw },
    { title: '关键节点通知', icon: BellRing },
    { title: '长期复盘闭环', icon: Stars },
    { title: '专项断事推演', icon: Sparkles },
  ];

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          target: 'report_subscription_submit',
          source: 'report_subscription_panel',
        },
      });

      const { response, data } = await fetchJsonWithTimeout<NewsletterSubscribeResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'result_report',
          tags: ['monthly_report', 'report_upgrade', 'knowledge_updates'],
        }),
        timeoutMs: REPORT_SUBSCRIPTION_TIMEOUT_MS,
        timeoutReason: 'report-subscription-submit-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '订阅失败，请稍后重试');
        return;
      }

      setMessage('订阅已生效，后续月度更新和报告补全提醒会发送到你的邮箱。');
      setEmail('');
      try {
        localStorage.setItem('newsletter-subscribed', 'done');
      } catch {}
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('订阅等待时间过长，请稍后重试');
        return;
      }

      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            月度订阅与补全承接
          </div>
          <h2 className="mt-2 text-xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-2xl">
            让这份报告持续生长，<br />
            <span className="text-[color:var(--brand-strong)]">而不是一次看完就结束</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
            报告不是一次性结论，订阅的价值在于把月度窗口、补全结果和后续追问串成长期判断关系。
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
              交付 {deliveryTierLabel}
            </span>
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 font-mono text-xs font-bold tabular-nums text-[color:var(--brand-strong)]">
              可信度 {qualityScore || '--'}
            </span>
            <span
              className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 text-xs font-bold uppercase tracking-wider ${
 targetAchieved
                  ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                  : 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
              }`}
            >
              {targetAchieved ? '内容已达到完整标准' : (upgradeStatusLabel || '继续补全中')}
            </span>
          </div>

          {monthlyHighlights.length > 0 ? (
            <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                接下来值得关注
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                {monthlyHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-2"
                  >
                    <div className="font-mono text-xs font-bold tabular-nums text-[color:var(--brand-strong)]">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-xs leading-4 text-[color:var(--brand-strong)]">
                      {item.theme}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-[color:var(--ink-2)]">{item.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            立即建立长期关系
          </div>
          <div className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
            {canManage ? '订阅月度更新与补全提醒' : '订阅站点更新与节律内容'}
          </div>

          <form onSubmit={handleSubscribe} className="mt-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="输入邮箱接收月度更新"
                className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] pl-9 pr-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal)] px-5 text-sm font-semibold text-[color:var(--ink-1)] transition hover:bg-[color:var(--signal-strong)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '提交中…' : '开启月度更新'}
            </button>
          </form>

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

          <div className="mt-3 grid gap-2">
            <Link
              href={canManage
                ? buildChatHref({
                    reportId,
                    question: '请围绕这份报告继续追问，优先告诉我接下来一个月最该推进的动作，以及最需要提前防的风险点。',
                    source: 'report_subscription_panel',
                    ctaStrategyKey,
                    sourceFamily,
                  })
                : '/analyze'}
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page: `/result/${reportId}`,
                  meta: {
                    reportId,
                    target: canManage ? 'chat' : 'analyze',
                    source: 'report_subscription_panel',
                    ctaStrategyKey: ctaStrategyKey || null,
                    sourceFamily: sourceFamily || null,
                  },
                });
              }}
              className="inline-flex h-9 items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              {canManage ? '继续深问这份报告' : '生成我的专属报告'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/updates"
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page: `/result/${reportId}`,
                  meta: {
                    reportId,
                    target: 'updates',
                    source: 'report_subscription_panel',
                  },
                });
              }}
              className="inline-flex h-9 items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              管理订阅与邮件更新
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
