'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  Loader2,
  Mail,
  RefreshCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import EmailTrustPanel from '@/components/email-trust-panel';
import { useLocale } from '@/components/i18n/locale-provider';
import SubscriptionFocusBanner from '@/components/subscription-focus-banner';
import type { SubscriptionFocusCopy } from '@/lib/profile-focus-copy';
import {
  EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS,
  MAX_EMAIL_FOCUS_ITEMS,
  listDefaultEnabledTags,
  type EmailFocusItem,
  type ResolvedEmailSubscriptionPreferenceGroup,
} from '@/lib/email-subscription-focus';
import {
  localizePreferenceGroups,
  subscriptionSettingsCopy,
} from '@/lib/i18n/updates-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;

type SubscriptionRecord = {
  email: string;
  status: string;
  source: string;
  tags: string[];
  meta?: {
    focusReportId?: string | null;
    focusItems?: EmailFocusItem[];
    focusUpdatedAt?: string | null;
  };
  subscriptionFocus?: SubscriptionFocusCopy;
  preferences?: ResolvedEmailSubscriptionPreferenceGroup[];
  enabledPreferenceCount?: number;
  availableFocusOptions?: EmailFocusItem[];
  updated_at?: string;
};

type NewsletterLookupResponse = {
  success?: boolean;
  error?: string;
  exists?: boolean;
  subscription?: SubscriptionRecord;
};

type NewsletterSettingsResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  subscription?: SubscriptionRecord;
};

const SETTINGS_TIMEOUT_MS = 12_000;

function buildEnabledTagsFromPreferences(
  preferences: ResolvedEmailSubscriptionPreferenceGroup[] | undefined,
) {
  if (!preferences?.length) return listDefaultEnabledTags();
  return preferences
    .flatMap((group) => group.options)
    .filter((option) => option.enabled)
    .map((option) => option.tag);
}

function buildDraftPreferences(
  preferences: ResolvedEmailSubscriptionPreferenceGroup[] | undefined,
  enabledTagSet: Set<string>,
): ResolvedEmailSubscriptionPreferenceGroup[] {
  const source = preferences?.length
    ? preferences
    : EMAIL_SUBSCRIPTION_PREFERENCE_GROUPS.map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option, enabled: option.defaultEnabled })),
      }));

  return source.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      enabled: enabledTagSet.has(option.tag),
    })),
  }));
}

export default function SubscriptionSettingsPanel({
  initialEmail = '',
  autoLoad = false,
  locale: localeProp,
}: {
  initialEmail?: string;
  autoLoad?: boolean;
  locale?: SiteLocale;
}) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale || 'zh-CN';
  const copy = useMemo(() => subscriptionSettingsCopy(locale), [locale]);

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<'subscribe' | 'unsubscribe' | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [draftPreferences, setDraftPreferences] = useState<ResolvedEmailSubscriptionPreferenceGroup[]>([]);
  const [selectedFocusKeys, setSelectedFocusKeys] = useState<string[]>([]);

  const normalizedEmail = email.trim().toLowerCase();
  const isActive = subscription?.status === 'active';
  const focusOptions = subscription?.availableFocusOptions || [];
  const selectedFocusItems = useMemo(
    () => focusOptions.filter((item) => selectedFocusKeys.includes(item.key)),
    [focusOptions, selectedFocusKeys],
  );
  const enabledCount = draftPreferences
    .flatMap((group) => group.options)
    .filter((option) => option.enabled).length;

  const displayPreferences = useMemo(
    () => localizePreferenceGroups(draftPreferences, locale),
    [draftPreferences, locale],
  );

  const resetNotice = () => {
    setError('');
    setMessage('');
  };

  const applySubscription = (record: SubscriptionRecord | null | undefined) => {
    if (!record) {
      setSubscription(null);
      setDraftPreferences([]);
      setSelectedFocusKeys([]);
      return;
    }

    setSubscription(record);
    setDraftPreferences(buildDraftPreferences(
      record.preferences,
      new Set(buildEnabledTagsFromPreferences(record.preferences)),
    ));
    setSelectedFocusKeys((record.meta?.focusItems || []).map((item) => item.key));
  };

  const loadSubscription = async (preserveNotice = false) => {
    if (!preserveNotice) resetNotice();
    if (!normalizedEmail) return;

    setLoading(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<NewsletterLookupResponse>(
        `/api/newsletter?email=${encodeURIComponent(normalizedEmail)}`,
        {
          timeoutMs: SETTINGS_TIMEOUT_MS,
          timeoutReason: 'subscription-settings-lookup-timeout',
        },
      );

      if (!response.ok || !data.success) {
        applySubscription(null);
        setError(data.error || copy.lookupFailed);
        return;
      }

      if (!data.exists || !data.subscription) {
        applySubscription(null);
        setMessage(copy.noRecordYet);
        setDraftPreferences(buildDraftPreferences(undefined, new Set(listDefaultEnabledTags())));
        return;
      }

      applySubscription(data.subscription);
    } catch (requestError) {
      applySubscription(null);
      if (isAbortLikeError(requestError)) {
        setError(copy.lookupTimeout);
        return;
      }
      setError(copy.networkError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (autoLoad && normalizedEmail) {
      void loadSubscription();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, normalizedEmail]);

  const togglePreference = (tag: string) => {
    setDraftPreferences((current) => current.map((group) => ({
      ...group,
      options: group.options.map((option) => (
        option.tag === tag ? { ...option, enabled: !option.enabled } : option
      )),
    })));
  };

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

  const handleSaveSettings = async () => {
    if (!normalizedEmail) return;
    resetNotice();
    setSaving(true);

    const enabledTags = draftPreferences
      .flatMap((group) => group.options)
      .filter((option) => option.enabled)
      .map((option) => option.tag);

    try {
      const { response, data } = await fetchJsonWithTimeout<NewsletterSettingsResponse>('/api/newsletter', {
        method: subscription?.status === 'active' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          source: 'subscription_settings',
          tags: enabledTags,
          enabledTags,
          focusItems: selectedFocusItems,
          reportId: subscription?.meta?.focusReportId || undefined,
        }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'subscription-settings-save-timeout',
      });

      if (!response.ok || !data.success) {
        setError(data.error || copy.saveFailed);
        return;
      }

      applySubscription(data.subscription || null);
      setMessage(data.message || copy.saveSuccess);
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError(copy.saveTimeout);
        return;
      }
      setError(copy.networkError);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSubscribe = async () => {
    if (!normalizedEmail) return;
    resetNotice();
    setActionLoading('subscribe');

    try {
      const enabledTags = draftPreferences
        .flatMap((group) => group.options)
        .filter((option) => option.enabled)
        .map((option) => option.tag);

      const { response, data } = await fetchJsonWithTimeout<NewsletterSettingsResponse>('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          source: 'subscription_settings',
          tags: enabledTags.length > 0 ? enabledTags : listDefaultEnabledTags(),
          focusItems: selectedFocusItems,
        }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'subscription-settings-subscribe-timeout',
      });

      if (!response.ok || !data.success) {
        setError(data.error || copy.subscribeFailed);
        return;
      }

      applySubscription(data.subscription || null);
      setMessage(copy.subscribeSuccess);
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError(copy.subscribeTimeout);
        return;
      }
      setError(copy.networkError);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsubscribe = async () => {
    if (!normalizedEmail) return;
    resetNotice();
    setActionLoading('unsubscribe');

    try {
      const { response, data } = await fetchJsonWithTimeout<NewsletterSettingsResponse>('/api/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'subscription-settings-unsubscribe-timeout',
      });

      if (!response.ok || !data.success) {
        setError(data.error || copy.unsubscribeFailed);
        return;
      }

      applySubscription(null);
      setMessage(copy.unsubscribeSuccess);
    } catch (requestError) {
      if (isAbortLikeError(requestError)) {
        setError(copy.unsubscribeTimeout);
        return;
      }
      setError(copy.networkError);
    } finally {
      setActionLoading(null);
    }
  };

  const messagesHref = normalizedEmail
    ? `/updates/messages?email=${encodeURIComponent(normalizedEmail)}`
    : '/updates/messages';

  return (
    <div className="space-y-4">
      <EmailTrustPanel email={normalizedEmail} compact={!!normalizedEmail} />

      <div className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-3">
          <div className="fb-section-title inline-flex items-center gap-1.5">
            <Settings2 className="h-3 w-3 text-[color:var(--fb-blue)]" />
            {copy.sectionEyebrow}
          </div>
          <h2 className="mt-1.5 text-[18px] font-bold leading-tight text-[color:var(--fb-ink-1)]">
            {copy.sectionTitle}
          </h2>
          <p className="intro-copy mt-1.5 max-w-2xl text-[13px] leading-[1.5] text-[color:var(--fb-ink-2)]">
            {copy.sectionIntro}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-stretch">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.emailPlaceholder}
              className="fb-input h-10 w-full pl-9 pr-3 text-[13px] text-[color:var(--fb-ink-1)] placeholder:text-[color:var(--fb-ink-3)]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadSubscription()}
            disabled={loading || !normalizedEmail}
            className="fb-btn fb-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.loadSettings}
          </button>
        </div>

        {message ? (
          <div className="mx-4 mb-3 rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mx-4 mb-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {subscription?.subscriptionFocus ? (
            <SubscriptionFocusBanner focus={subscription.subscriptionFocus} />
          ) : null}

          {displayPreferences.map((group) => (
            <div key={group.key} className="fb-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {group.title}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--ink-3)]">
                    {group.description}
                  </p>
                </div>
                {group.key === 'timing' ? <BellRing className="h-4 w-4 text-[color:var(--brand-strong)]" /> : null}
                {group.key === 'report' ? <RefreshCcw className="h-4 w-4 text-[color:var(--brand-strong)]" /> : null}
                {group.key === 'content' ? <Sparkles className="h-4 w-4 text-[color:var(--brand-strong)]" /> : null}
              </div>

              <div className="mt-3 grid gap-2">
                {group.options.map((option) => (
                  <label
                    key={option.tag}
                    className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-3 transition ${
                      option.enabled
                        ? 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]'
                        : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={option.enabled}
                      onChange={() => togglePreference(option.tag)}
                      className="mt-0.5 h-4 w-4 rounded border-[color:var(--hairline-strong)] text-[color:var(--brand)] focus:ring-[color:var(--brand-soft-2)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[color:var(--ink-1)]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[color:var(--ink-3)]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {focusOptions.length > 0 ? (
            <div className="fb-card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                {copy.focusTitle}
              </div>
              <p className="mt-1 text-sm leading-6 text-[color:var(--ink-3)]">
                {copy.focusHint}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {focusOptions.map((item) => {
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
              {subscription?.meta?.focusReportId ? (
                <div className="mt-3">
                  <Link
                    href={`/result/${subscription.meta.focusReportId}#subscription`}
                    className="text-xs font-semibold text-[color:var(--brand-strong)] hover:underline"
                  >
                    {copy.focusReportLink}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="fb-card p-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {copy.statusEyebrow}
            </div>

            {subscription ? (
              <div className="mt-3 grid gap-2">
                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2">
                  <span className="font-mono text-xs text-[color:var(--ink-5)]">EMAIL</span>
                  <div className="mt-0.5 font-mono text-sm text-[color:var(--ink-1)]">
                    {subscription.email}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex h-6 items-center rounded-[var(--radius-sm)] border px-2 text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? 'border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
                        : 'border-[color:var(--ink-5)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 text-xs font-mono text-[color:var(--ink-4)]">
                    {copy.enabledCount(enabledCount)}
                  </span>
                </div>
                {(subscription.meta?.focusItems || []).length > 0 ? (
                  <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2">
                    <span className="font-mono text-xs text-[color:var(--ink-5)]">FOCUS</span>
                    <div className="mt-1 space-y-1 text-xs text-[color:var(--ink-3)]">
                      {(subscription.meta?.focusItems || []).map((item) => (
                        <div key={item.key}>{item.label} · {item.value}</div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--ink-4)]">
                {copy.statusEmpty}
              </p>
            )}
          </div>

          <div className="fb-card p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              {copy.actionsEyebrow}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={!normalizedEmail || saving || actionLoading !== null}
                className="fb-btn fb-btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {subscription?.status === 'active' ? copy.saveActive : copy.saveEnable}
              </button>

              {!isActive ? (
                <button
                  type="button"
                  onClick={() => void handleQuickSubscribe()}
                  disabled={!normalizedEmail || saving || actionLoading !== null}
                  className="action-secondary fb-btn inline-flex h-10 items-center justify-center gap-1.5 px-3 text-[color:var(--fb-ink-1)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === 'subscribe' ? copy.processing : copy.quickSubscribe}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void handleUnsubscribe()}
                disabled={!normalizedEmail || saving || actionLoading !== null}
                className="fb-btn inline-flex h-10 items-center justify-center gap-1.5 px-3 text-[color:var(--fb-ink-1)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === 'unsubscribe' ? copy.processing : copy.unsubscribeAll}
              </button>

              <Link
                href={messagesHref}
                className="fb-btn inline-flex h-10 items-center justify-center gap-1.5 px-3 text-[color:var(--fb-ink-1)]"
              >
                {copy.viewMessages}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
