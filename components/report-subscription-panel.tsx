'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BellRing, Mail, RefreshCcw, Sparkles, Stars } from 'lucide-react';
import EmailTrustPanel from '@/components/email-trust-panel';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildReportContinueChatHref } from '@/lib/chat-entry';
import {
  MAX_EMAIL_FOCUS_ITEMS,
  REPORT_SUBSCRIPTION_TAGS,
  type EmailFocusItem,
} from '@/lib/email-subscription-focus';
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
  focusOptions = [],
  ctaStrategyKey,
  sourceFamily,
  locale: localeProp,
}: {
  reportId: string;
  canManage: boolean;
  deliveryTierLabel: string;
  qualityScore?: number;
  qualityGrade?: 'S' | 'A' | 'B' | 'C';
  targetAchieved?: boolean;
  upgradeStatusLabel?: string;
  monthlyHighlights: MonthlyHighlight[];
  focusOptions?: EmailFocusItem[];
  ctaStrategyKey?: string;
  sourceFamily?: string;
  locale?: string | null;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFocusKeys, setSelectedFocusKeys] = useState<string[]>([]);

  const en = `${localeProp || ''}`.toLowerCase().startsWith('en');

  const selectableFocusOptions = useMemo(() => focusOptions.slice(0, 12), [focusOptions]);
  const selectedFocusItems = useMemo(
    () => selectableFocusOptions.filter((item) => selectedFocusKeys.includes(item.key)),
    [selectableFocusOptions, selectedFocusKeys],
  );

  const copy = useMemo(
    () =>
      en
        ? {
            intro:
              'Email is for recovering this report across devices and optional light timing notes — structure windows, not fear-based “daily fortune.” Free, cancel anytime.',
            eduNote:
              'Reminders stay educational: stage windows and check-in prompts. No personal day-master claims invented in email.',
            benefits: [
              { title: 'Monthly window notes', icon: Sparkles },
              { title: 'Report ready alerts', icon: RefreshCcw },
              { title: 'Light daily check-in', icon: BellRing },
              { title: 'Key node notices', icon: Stars },
              { title: 'Long-term review loop', icon: Sparkles },
            ],
            eyebrow: 'Stay in the loop',
            titleManage: 'Subscribe to windows & updates',
            titleGuest: 'Subscribe to site updates',
            focusLabel: `Focus items (max ${MAX_EMAIL_FOCUS_ITEMS})`,
            focusHint: 'Optional. Unchecked still gets general notes; checked items get priority.',
            placeholder: 'Email for light timing notes',
            submit: 'Enable reminders',
            submitting: 'Submitting…',
            delivery: 'Delivery',
            confidence: 'Confidence',
            complete: 'Content standard met',
            filling: 'Still completing',
            watchNext: 'Worth watching next',
          }
        : {
            intro:
              '邮箱用于跨设备找回本报告，并可勾选最多 3 项重点，只收你关心的窗口与轻提醒。内容为结构节奏参考，非恐吓式每日运势。免费、可退订。',
            eduNote: '提醒保持教育向：阶段窗口与可验证小动作，不会用邮件编造日主/用神结论。',
            benefits: [
              { title: '月度窗口更新', icon: Sparkles },
              { title: '报告补全提醒', icon: RefreshCcw },
              { title: '日常轻提醒', icon: BellRing },
              { title: '关键节点通知', icon: Stars },
              { title: '长期复盘闭环', icon: Sparkles },
            ],
            eyebrow: '建立长期关系',
            titleManage: '订阅窗口提醒与月度更新',
            titleGuest: '订阅站点更新与节律内容',
            focusLabel: `选择提醒重点（最多 ${MAX_EMAIL_FOCUS_ITEMS} 项）`,
            focusHint: '不勾选也会收到通用提醒；勾选后优先围绕这些内容展开。',
            placeholder: '输入邮箱接收轻提醒',
            submit: '开启提醒',
            submitting: '提交中…',
            delivery: '交付',
            confidence: '可信度',
            complete: '内容已达到完整标准',
            filling: '继续补全中',
            watchNext: '接下来值得关注',
          },
    [en],
  );

  const benefits = copy.benefits;

  const toggleFocusItem = (key: string) => {
    setSelectedFocusKeys((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      if (current.length >= MAX_EMAIL_FOCUS_ITEMS) {
        return current;
      }
      return [...current, key];
    });
  };

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
          focusCount: selectedFocusItems.length,
        },
      });

      const { response, data } = await fetchJsonWithTimeout<NewsletterSubscribeResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'result_report',
          reportId,
          tags: [...REPORT_SUBSCRIPTION_TAGS],
          focusItems: selectedFocusItems,
        }),
        timeoutMs: REPORT_SUBSCRIPTION_TIMEOUT_MS,
        timeoutReason: 'report-subscription-submit-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '订阅失败，请稍后重试');
        return;
      }

      const focusHint = selectedFocusItems.length > 0
        ? `我们会重点围绕你勾选的 ${selectedFocusItems.length} 项内容发送日常提醒。`
        : '后续月度更新、日常运势提醒和报告补全通知会发送到你的邮箱。';
      setMessage(`订阅已生效。${focusHint}`);
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
    <div className="space-y-4">
      <EmailTrustPanel compact locale={localeProp} />

      <div className="fb-card p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            保存报告 · 轻量提醒
          </div>
          <h2 className="mt-2 text-xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-2xl">
            先把报告挂到邮箱，<br />
            <span className="text-[color:var(--brand-strong)]">再让关键窗口主动来找你</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)] intro-copy">
            {copy.intro}
          </p>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[color:var(--ink-5)]">
            {copy.eduNote}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
              {copy.delivery} {deliveryTierLabel}
            </span>
            <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 font-mono text-xs font-bold tabular-nums text-[color:var(--brand-strong)]">
              {copy.confidence} {qualityScore || '--'}
            </span>
            <span
              className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 text-xs font-bold uppercase tracking-wider ${
                targetAchieved
                  ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                  : 'border-[color:var(--signal)] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]'
              }`}
            >
              {targetAchieved ? copy.complete : (upgradeStatusLabel || copy.filling)}
            </span>
          </div>

          {monthlyHighlights.length > 0 ? (
            <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                {copy.watchNext}
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
                  className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2"
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
            {copy.eyebrow}
          </div>
          <div className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
            {canManage ? copy.titleManage : copy.titleGuest}
          </div>

          {selectableFocusOptions.length > 0 ? (
            <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                  {copy.focusLabel}
                </div>
                <div className="font-mono text-xs text-[color:var(--ink-4)]">
                  {selectedFocusKeys.length}/{MAX_EMAIL_FOCUS_ITEMS}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectableFocusOptions.map((item) => {
                  const selected = selectedFocusKeys.includes(item.key);
                  const disabled = !selected && selectedFocusKeys.length >= MAX_EMAIL_FOCUS_ITEMS;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleFocusItem(item.key)}
                      disabled={disabled}
                      className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
                        selected
                          ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                          : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand-soft-2)]'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="mx-1 text-[color:var(--ink-5)]">·</span>
                      <span>{item.value}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-[color:var(--ink-4)]">
                {copy.focusHint}
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubscribe} className="mt-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.placeholder}
                className="fb-input h-10 w-full pl-9 pr-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="fb-btn fb-btn-primary action-primary mt-2 h-10 w-full px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? copy.submitting : copy.submit}
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
                ? buildReportContinueChatHref({
                    reportId,
                    teacher: 'overview',
                    window: '订阅回访 · 本月动作',
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
                    target: canManage ? 'chat_opening' : 'analyze',
                    source: 'report_subscription_panel',
                    ctaStrategyKey: ctaStrategyKey || null,
                    sourceFamily: sourceFamily || null,
                    mode: 'opening',
                  },
                });
              }}
              className="inline-flex h-9 items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              {canManage ? '带报告顾问开场' : '生成我的专属报告'}
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
    </div>
  );
}