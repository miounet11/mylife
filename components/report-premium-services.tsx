'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarClock, Compass, ScrollText, Sparkles } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { getRememberedClientAttribution } from '@/lib/client-attribution';
import { buildChatHref } from '@/lib/chat-entry';
import {
  getPremiumServiceLabel,
  type PremiumServiceKey,
  type PremiumServiceOffer,
} from '@/lib/report-premium-services';
import type { PremiumServiceRequestRecord } from '@/lib/user-types';

const iconMap = {
  'event-simulation': CalendarClock,
  'event-verdict': ScrollText,
  'event-review': Compass,
  'meihua-enhancement': Sparkles,
} as const;

export default function ReportPremiumServices({
  reportId,
  canManage,
  offers,
  initialEmail = '',
  initialRequests = [],
  ctaStrategyKey,
  sourceFamily,
}: {
  reportId: string;
  canManage: boolean;
  offers: PremiumServiceOffer[];
  initialEmail?: string;
  initialRequests?: PremiumServiceRequestRecord[];
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const [selectedServiceKey, setSelectedServiceKey] = useState<PremiumServiceKey>(offers[0]?.key || 'event-simulation');
  const [contactName, setContactName] = useState('');
  const [contactValue, setContactValue] = useState(initialEmail);
  const [preferredContact, setPreferredContact] = useState('邮箱');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<PremiumServiceRequestRecord[]>(initialRequests);

  if (!Array.isArray(offers) || offers.length === 0) {
    return null;
  }

  const selectedOffer = offers.find((item) => item.key === selectedServiceKey) || offers[0];

  const handlePrefill = (serviceKey: PremiumServiceKey) => {
    setSelectedServiceKey(serviceKey);
    setMessage('');
    setError('');
    if (question.trim()) {
      return;
    }

    const label = getPremiumServiceLabel(serviceKey);
    setQuestion(`我想申请“${label}”专项，当前最想解决的问题是：`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOffer || submitting) {
      return;
    }

    if (question.trim().length < 8) {
      setError('请先写清楚你想解决的具体事情。');
      return;
    }

    if (!contactValue.trim()) {
      setError('请留下邮箱、微信或手机号，方便后续跟进。');
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
          serviceKey: selectedOffer.key,
          contactName,
          contactValue,
          preferredContact,
          question,
          attribution: getRememberedClientAttribution(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '提交失败，请稍后重试');
        return;
      }

      const created = data.data as PremiumServiceRequestRecord | undefined;
      if (created) {
        setRequests((current) => [created, ...current.filter((item) => item.id !== created.id)].slice(0, 6));
      }
      setMessage('专项需求已提交，后续可围绕这份报告继续沟通，系统也会保留这次需求记录。');
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          target: 'premium_service_request_submit',
          source: 'report_premium_services',
          serviceKey: selectedOffer.key,
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
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="section-label">付费深度增强</div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
            深度专项服务
          </h2>
        </div>

        <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-4 py-4 text-sm text-[color:var(--ink)] lg:max-w-sm">
          先锁定一件具体事件
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {offers.map((offer) => {
          const Icon = iconMap[offer.key];
          return (
            <div key={offer.key} className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{offer.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{offer.tagline}</div>
                  </div>
                </div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                  {offer.badge}
                </span>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                {offer.featuredSignal}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">适合这类用户</div>
                  <div className="mt-3 grid gap-2">
                    {offer.fitFor.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">用户能拿到什么</div>
                  <div className="mt-3 grid gap-2">
                    {offer.deliverables.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={mapPrimaryHref(offer, reportId, canManage, ctaStrategyKey, sourceFamily)}
                  onClick={() => {
                    void trackClientEvent({
                      eventName: 'result_cta_clicked',
                      page: `/result/${reportId}`,
                      meta: {
                        reportId,
                        target: offer.key,
                        source: 'report_premium_services',
                        intent: offer.key,
                      },
                    });
                  }}
                  className="action-secondary inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white"
                >
                  {canManage ? offer.primaryCtaLabel : '生成我的专属报告'}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={mapSecondaryHref(offer.key, reportId, canManage, ctaStrategyKey, sourceFamily)}
                  onClick={() => {
                    void trackClientEvent({
                      eventName: 'result_cta_clicked',
                      page: `/result/${reportId}`,
                      meta: {
                        reportId,
                        target: `${offer.key}_secondary`,
                        source: 'report_premium_services',
                      },
                    });
                  }}
                  className="action-secondary"
                >
                  {offer.secondaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {canManage ? (
                  <button
                    type="button"
                    onClick={() => handlePrefill(offer.key)}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]"
                  >
                    提交需求单
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {canManage ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="soft-card rounded-[1.75rem] p-5">
            <div className="text-sm font-semibold text-[color:var(--ink)]">提交专项服务需求</div>
            <div className="intro-copy mt-2">把你最想解决的一个现实问题写清楚，系统会把当前报告与需求一起交给后续服务链路。</div>

            <div className="mt-4 flex flex-wrap gap-2">
              {offers.map((offer) => (
                <button
                  key={offer.key}
                  type="button"
                  onClick={() => setSelectedServiceKey(offer.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedServiceKey === offer.key
                      ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white'
                      : 'action-secondary py-2 text-[color:var(--ink)]'
                  }`}
                >
                  {offer.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
              <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                <div className="font-semibold">{selectedOffer?.title}</div>
                <div className="mt-1 text-[color:var(--muted)]">{selectedOffer?.tagline}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <input
                value={preferredContact}
                onChange={(event) => setPreferredContact(event.target.value)}
                placeholder="偏好的联系渠道，例如邮箱、微信"
                className="w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)]"
              />

              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={`请直接写清楚你最想解决的具体事情，例如：${selectedOffer?.title}里，我最想知道的是什么？`}
                className="min-h-[150px] w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-xs leading-6 outline-none focus:border-[color:var(--accent)]"
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? '提交中...' : `提交${selectedOffer?.title || '专项'}需求单`}
              </button>
            </form>

            {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
            {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          </div>

          <div className="soft-card rounded-[1.75rem] p-5">
            <div className="text-sm font-semibold text-[color:var(--ink)]">最近提交的专项需求</div>

            <div className="mt-4 grid gap-3">
              {requests.length > 0 ? requests.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{getPremiumServiceLabel(item.serviceKey)}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapRequestStatusClass(item.status)}`}>
                      {mapRequestStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    {item.createdAt ? formatRequestTime(item.createdAt) : '刚刚提交'}
                  </div>
                  <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                    {`${item.intake?.question || '已提交需求，等待继续补充。'}`}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm text-[color:var(--muted)]">暂无专项需求</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function mapSecondaryHref(
  key: PremiumServiceOffer['key'],
  reportId: string,
  canManage: boolean,
  ctaStrategyKey?: string,
  sourceFamily?: string
) {
  if (!canManage) {
    return '/analyze';
  }

  switch (key) {
    case 'event-simulation':
      return `/events?reportId=${encodeURIComponent(reportId)}`;
    case 'event-review':
      return `/events?reportId=${encodeURIComponent(reportId)}`;
    case 'meihua-enhancement':
      return '#subscription';
    default:
      return buildChatHref({
        reportId,
        question: '请围绕这份报告继续做结构追问，重点帮我判断：当前这件事更该推进、观察还是收手，前置条件是什么？',
        source: 'report_premium_services_secondary',
        ctaStrategyKey,
        sourceFamily,
      });
  }
}

function mapPrimaryHref(
  offer: PremiumServiceOffer,
  reportId: string,
  canManage: boolean,
  ctaStrategyKey?: string,
  sourceFamily?: string
) {
  if (!canManage) {
    return '/analyze';
  }

  return buildChatHref({
    reportId,
    intent: offer.key,
    question: `请围绕我这份报告继续评估“${offer.title}”这个专项方向：现在是否适合启动，最该先补什么条件，推进过程中最需要防什么风险？`,
    source: 'report_premium_services_primary',
    ctaStrategyKey,
    sourceFamily,
  });
}

function mapRequestStatusLabel(status: PremiumServiceRequestRecord['status']) {
  switch (status) {
    case 'contacted':
      return '已跟进';
    case 'in_progress':
      return '处理中';
    case 'delivered':
      return '已交付';
    case 'closed':
      return '已结束';
    case 'cancelled':
      return '已取消';
    default:
      return '新提交';
  }
}

function mapRequestStatusClass(status: PremiumServiceRequestRecord['status']) {
  switch (status) {
    case 'contacted':
      return 'bg-sky-50 text-sky-700';
    case 'in_progress':
      return 'bg-amber-50 text-amber-800';
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700';
    case 'closed':
      return 'bg-slate-100 text-slate-700';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  }
}

function formatRequestTime(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (matched) {
    return `${matched[2]}-${matched[3]} ${matched[4]}:${matched[5]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
