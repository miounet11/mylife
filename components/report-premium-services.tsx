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
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;

const iconMap = {
  'event-simulation': CalendarClock,
  'event-verdict': ScrollText,
  'event-review': Compass,
  'meihua-enhancement': Sparkles,
} as const;

type PremiumServiceSubmitResponse = {
  success?: boolean;
  error?: string;
  data?: PremiumServiceRequestRecord;
};

const REPORT_PREMIUM_SERVICE_TIMEOUT_MS = 12_000;

/**
 * 深度专项服务 — 临床报告附录风格：
 * 单列服务清单 + 一份需求表，避免 2×2 卡片堆叠「适合/交付/三按钮」造成的东一块西一块。
 */
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
  const [selectedServiceKey, setSelectedServiceKey] = useState<PremiumServiceKey>(
    offers[0]?.key || 'event-simulation'
  );
  const [contactName, setContactName] = useState('');
  const [contactValue, setContactValue] = useState(initialEmail);
  const [preferredContact, setPreferredContact] = useState('邮箱');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<PremiumServiceRequestRecord[]>(initialRequests);
  const [formOpen, setFormOpen] = useState(false);

  if (!Array.isArray(offers) || offers.length === 0) {
    return null;
  }

  const selectedOffer = offers.find((item) => item.key === selectedServiceKey) || offers[0];

  const openForm = (serviceKey: PremiumServiceKey) => {
    setSelectedServiceKey(serviceKey);
    setFormOpen(true);
    setMessage('');
    setError('');
    if (!question.trim()) {
      const label = getPremiumServiceLabel(serviceKey);
      setQuestion(`我想申请「${label}」专项，当前最想解决的问题是：`);
    }
    // scroll into form after paint
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('premium-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOffer || submitting) return;

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
      const { response, data } = await fetchJsonWithTimeout<PremiumServiceSubmitResponse>(
        '/api/premium-services',
        {
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
          timeoutMs: REPORT_PREMIUM_SERVICE_TIMEOUT_MS,
          timeoutReason: 'report-premium-service-submit-timeout',
        }
      );
      if (!response.ok || !data.success) {
        setError(data.error || '提交失败，请稍后重试');
        return;
      }

      const created = data.data;
      if (created) {
        setRequests((current) => [created, ...current.filter((item) => item.id !== created.id)].slice(0, 6));
      }
      setMessage('专项需求已提交。后续可围绕这份报告继续沟通。');
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
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError('专项需求提交等待时间过长，请稍后重试');
        return;
      }
      setError('网络异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-[1.55] text-[color:var(--ink-4)] intro-copy">
        主报告已给出方向后，若你有一件具体事件需要更聚焦判断，再申请下列专项。先选一项，再填需求单。
      </p>

      {/* 单列清单：一行一项，避免 2 列卡片挤满 */}
      <ol className="divide-y divide-[color:var(--hairline)] rounded-[3px] border border-[color:var(--hairline)] bg-white">
        {offers.map((offer, index) => {
          const Icon = iconMap[offer.key];
          const active = selectedServiceKey === offer.key && formOpen;
          return (
            <li key={offer.key} className={`p-4 ${active ? 'bg-[#f0f4fb]' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold tabular-nums text-[color:var(--ink-5)]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">{offer.title}</h3>
                        {offer.badge ? (
                          <span className="inline-flex items-center whitespace-nowrap rounded-[3px] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--signal-strong)]">
                            {offer.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-4)] break-words">
                        {offer.tagline}
                      </p>
                      {offer.featuredSignal ? (
                        <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-3)] break-words">
                          {offer.featuredSignal}
                        </p>
                      ) : null}
                      {/* 适合/交付折叠为单行摘要，不再双栏方块 */}
                      <div className="mt-2 space-y-1 text-[11px] leading-[1.5] text-[color:var(--ink-4)]">
                        {offer.fitFor?.length ? (
                          <p className="break-words">
                            <span className="font-semibold text-[color:var(--ink-3)]">适合</span>
                            <span className="mx-1">·</span>
                            {offer.fitFor.slice(0, 3).join('；')}
                          </p>
                        ) : null}
                        {offer.deliverables?.length ? (
                          <p className="break-words">
                            <span className="font-semibold text-[color:var(--ink-3)]">交付</span>
                            <span className="mx-1">·</span>
                            {offer.deliverables.slice(0, 3).join('；')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
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
                          canManage,
                        },
                      });
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[3px] bg-[color:var(--signal)] px-3 text-[12px] font-semibold text-[color:var(--ink-1)] hover:bg-[color:var(--signal-strong)] hover:text-white"
                  >
                    {canManage ? offer.primaryCtaLabel : '申请专项'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openForm(offer.key)}
                    className="inline-flex h-9 items-center justify-center rounded-[3px] border border-[color:var(--hairline-strong)] bg-white px-3 text-[12px] font-semibold text-[color:var(--ink-3)] hover:border-[#3b5998] hover:text-[#3b5998]"
                  >
                    填需求单
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 单一表单：默认折叠，点「填需求单」展开 */}
      {formOpen ? (
        <div
          id="premium-form"
          className="scroll-mt-header rounded-[3px] border border-[color:var(--hairline)] bg-white p-4 md:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[14px] font-bold text-[color:var(--ink-1)]">提交专项服务需求</div>
              <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
                当前选择：
                <span className="font-semibold text-[color:var(--ink-2)]">
                  {selectedOffer?.title || '专项'}
                </span>
                。写清一件具体事情即可。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-[12px] font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]"
            >
              收起
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((offer) => (
              <button
                key={offer.key}
                type="button"
                onClick={() => setSelectedServiceKey(offer.key)}
                className={`inline-flex h-8 items-center rounded-[3px] border px-3 text-[12px] font-semibold transition ${
                  selectedServiceKey === offer.key
                    ? 'border-[#3b5998] bg-[#3b5998] text-white'
                    : 'border-[color:var(--hairline)] bg-[#f6f7f9] text-[color:var(--ink-3)] hover:border-[#3b5998]'
                }`}
              >
                {offer.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="称呼，可选"
                className="w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5 text-[13px] outline-none focus:border-[#3b5998]"
              />
              <input
                value={contactValue}
                onChange={(event) => setContactValue(event.target.value)}
                placeholder="邮箱 / 微信 / 手机号"
                className="w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5 text-[13px] outline-none focus:border-[#3b5998]"
              />
            </div>
            <input
              value={preferredContact}
              onChange={(event) => setPreferredContact(event.target.value)}
              placeholder="偏好联系渠道，例如邮箱、微信"
              className="w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5 text-[13px] outline-none focus:border-[#3b5998]"
            />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={`请直接写清楚你最想解决的具体事情，例如：${selectedOffer?.title}里，我最想知道的是什么？`}
              className="min-h-[120px] w-full rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5 text-[13px] leading-6 outline-none focus:border-[#3b5998]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-[#3b5998] px-5 text-[13px] font-semibold text-white disabled:opacity-60 hover:bg-[#2d4373]"
              >
                {submitting ? '提交中…' : `提交${selectedOffer?.title || '专项'}需求`}
              </button>
              <Link
                href={mapSecondaryHref(selectedOffer.key, reportId, canManage, ctaStrategyKey, sourceFamily)}
                className="action-secondary inline-flex h-10 items-center justify-center rounded-[3px] border border-[color:var(--hairline-strong)] bg-white px-4 text-[13px] font-semibold text-[color:var(--ink-3)] hover:border-[#3b5998]"
              >
                {selectedOffer.secondaryCtaLabel || '相关入口'}
              </Link>
            </div>
          </form>

          {message ? (
            <div className="mt-3 rounded-[3px] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-[13px] text-[color:var(--data-up)]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-[3px] bg-[color:var(--alert-soft)] px-3 py-2 text-[13px] text-[color:var(--alert)]">
              {error}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-[12px] text-[color:var(--ink-4)]">
          需要人工跟进时，点上方任意一项的「填需求单」。
        </p>
      )}

      {canManage && requests.length > 0 ? (
        <div className="rounded-[3px] border border-[color:var(--hairline)] bg-white p-4">
          <div className="text-[13px] font-bold text-[color:var(--ink-1)]">最近提交</div>
          <ul className="mt-3 space-y-2">
            {requests.map((item) => (
              <li
                key={item.id}
                className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                    {getPremiumServiceLabel(item.serviceKey)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${mapRequestStatusClass(item.status)}`}
                  >
                    {mapRequestStatusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                  {item.createdAt ? formatRequestTime(item.createdAt) : '刚刚提交'}
                </p>
                <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-3)] break-words">
                  {item.intake?.question || '已提交需求，等待继续补充。'}
                </p>
              </li>
            ))}
          </ul>
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
  if (!canManage) return '#premium';

  switch (key) {
    case 'event-simulation':
    case 'event-review':
      return `/events?reportId=${encodeURIComponent(reportId)}`;
    case 'meihua-enhancement':
      return '#subscription';
    default:
      return buildChatHref({
        reportId,
        question:
          '请围绕这份报告继续做结构追问，重点帮我判断：当前这件事更该推进、观察还是收手，前置条件是什么？',
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
  if (!canManage) return '#premium';

  return buildChatHref({
    reportId,
    intent: offer.key,
    question: `请围绕我这份报告继续评估「${offer.title}」这个专项方向：现在是否适合启动，最该先补什么条件，推进过程中最需要防什么风险？`,
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
      return 'bg-[color:var(--env-soft)] text-[color:var(--env)]';
    case 'in_progress':
      return 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
    case 'delivered':
      return 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
    case 'closed':
      return 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
    case 'cancelled':
      return 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]';
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
  if (Number.isNaN(date.getTime())) return value;

  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
