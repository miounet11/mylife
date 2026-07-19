// @ts-nocheck
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  FileText,
  History,
  Loader2,
  Lightbulb,
  Pin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useLocale } from '@/components/i18n/locale-provider';
import type { ProfileSupplementRecommendation } from '@/lib/profile-supplement-recommendations';
import EmailTrustPanel from '@/components/email-trust-panel';
import SubscriptionFocusBanner from '@/components/subscription-focus-banner';
import ProgressiveProfileHub from '@/components/profile/progressive-profile-hub';
import { profileSettingsPanelCopy } from '@/lib/i18n/profile-settings-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import {
  MAX_PROFILE_DOCUMENT_CHARS,
  PROFILE_ACCURACY_OPTIONS,
  PROFILE_DOCUMENT_CATEGORY_OPTIONS,
  PROFILE_INTENT_OPTIONS,
  PROFILE_RELATION_OPTIONS,
  PROFILE_SUPPLEMENT_DOMAINS,
  type BirthAccuracy,
  type ProfileDocumentCategory,
  type ProfileDocumentVisibility,
  type ProfileFortuneView,
  type ProfileIntent,
  type ProfileSettingsResponse,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';

const SETTINGS_TIMEOUT_MS = 12_000;

type SettingsTab = 'basic' | 'supplements' | 'documents' | 'archives' | 'history';

type DraftFortune = {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthAccuracy: BirthAccuracy;
  intent: ProfileIntent | '';
  timezone: number;
  relationLabel: string;
};

type DraftSupplements = Record<SupplementDomain, Record<string, string>>;

type DraftDocument = {
  id: string;
  title: string;
  category: ProfileDocumentCategory;
  content: string;
  visibility: ProfileDocumentVisibility;
  pinned: boolean;
};

type NewArchiveDraft = {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthAccuracy: BirthAccuracy;
  relation: string;
  relationLabel: string;
};

const emptyDocument = (): DraftDocument => ({
  id: '',
  title: '',
  category: 'other',
  content: '',
  visibility: 'engine',
  pinned: false,
});

const emptyArchive = (): NewArchiveDraft => ({
  name: '',
  gender: 'male',
  birthDate: '',
  birthTime: '12:00',
  birthPlace: '北京',
  birthAccuracy: 'range',
  relation: 'child',
  relationLabel: '',
});

function buildDraftFortune(fortune: ProfileFortuneView | null | undefined): DraftFortune {
  return {
    name: fortune?.name || '',
    gender: fortune?.gender || 'male',
    birthDate: fortune?.birthDate || '',
    birthTime: fortune?.birthTime || '12:00',
    birthPlace: fortune?.birthPlace || '北京',
    birthAccuracy: fortune?.birthAccuracy || 'range',
    intent: fortune?.intent || '',
    timezone: fortune?.timezone ?? 8,
    relationLabel: fortune?.relationLabel || '',
  };
}

function buildDraftSupplements(settings: ProfileSettingsResponse | null): DraftSupplements {
  const domains = Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[];
  return domains.reduce((acc, domain) => {
    const existing = settings?.supplements.find((item) => item.domain === domain);
    acc[domain] = { ...(existing?.fields || {}) };
    return acc;
  }, {} as DraftSupplements);
}

function engineFieldsChanged(original: DraftFortune, draft: DraftFortune) {
  return (
    original.birthDate !== draft.birthDate
    || original.birthTime !== draft.birthTime
    || original.birthPlace.trim() !== draft.birthPlace.trim()
    || original.birthAccuracy !== draft.birthAccuracy
    || original.gender !== draft.gender
  );
}

const VALID_TABS: SettingsTab[] = ['basic', 'supplements', 'documents', 'archives', 'history'];

function resolveInitialTab(value: string): SettingsTab {
  return VALID_TABS.includes(value as SettingsTab) ? value as SettingsTab : 'basic';
}

export default function ProfileSettingsPanel({
  locale: localeProp,
  initialFortuneId = '',
  initialTab = '',
  initialHighlight = '',
}: {
  locale?: SiteLocale;
  initialFortuneId?: string;
  initialTab?: string;
  initialHighlight?: string;
}) {
  const { locale: ctxLocale } = useLocale();
  const locale: SiteLocale = localeProp || ctxLocale || 'zh-CN';
  const copy = useMemo(() => profileSettingsPanelCopy(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docSaving, setDocSaving] = useState(false);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<ProfileSettingsResponse | null>(null);
  const [activeFortuneId, setActiveFortuneId] = useState(initialFortuneId);
  const [draftFortune, setDraftFortune] = useState<DraftFortune>(buildDraftFortune(null));
  const [draftSupplements, setDraftSupplements] = useState<DraftSupplements>(buildDraftSupplements(null));
  const [originalFortune, setOriginalFortune] = useState<DraftFortune>(buildDraftFortune(null));
  const [draftDocument, setDraftDocument] = useState<DraftDocument>(emptyDocument());
  const [newArchive, setNewArchive] = useState<NewArchiveDraft>(emptyArchive());
  const [activeTab, setActiveTab] = useState<SettingsTab>(resolveInitialTab(initialTab));
  const [missingRecommendations, setMissingRecommendations] = useState<ProfileSupplementRecommendation[]>([]);
  const [subscriptionFocusReportId, setSubscriptionFocusReportId] = useState<string | null>(null);

  const activeFortune = useMemo(
    () => settings?.fortunes.find((item) => item.id === activeFortuneId) || settings?.fortunes[0] || null,
    [settings, activeFortuneId],
  );

  const engineChanged = useMemo(
    () => engineFieldsChanged(originalFortune, draftFortune),
    [originalFortune, draftFortune],
  );

  const resetNotice = () => {
    setError('');
    setMessage('');
  };

  const applySettings = (payload: ProfileSettingsResponse | null | undefined) => {
    if (!payload) {
      setSettings(null);
      return;
    }

    setSettings(payload);
    const fortune = payload.fortunes.find((item) => item.id === payload.activeFortuneId)
      || payload.fortunes[0]
      || null;
    if (fortune) {
      setActiveFortuneId(fortune.id);
      const draft = buildDraftFortune(fortune);
      setDraftFortune(draft);
      setOriginalFortune(draft);
    }
    setDraftSupplements(buildDraftSupplements(payload));
  };

  const loadSettings = async (fortuneId?: string, preserveNotice = false) => {
    if (!preserveNotice) resetNotice();
    setLoading(true);

    try {
      const query = fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}` : '';
      const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
        `/api/profile/settings${query}`,
        { timeoutMs: SETTINGS_TIMEOUT_MS, timeoutReason: 'profile-settings-load-timeout' },
      );

      if (!response.ok || !data.success) {
        setError(data.error || copy.loadFailed);
        applySettings(null);
        return;
      }

      applySettings(data);
      setSubscriptionFocusReportId(data.subscriptionFocus?.focusReportId || null);
      await loadRecommendations(fortuneId || data.activeFortuneId || undefined);
    } catch (requestError) {
      applySettings(null);
      if (isAbortLikeError(requestError)) {
        setError(copy.loadTimeout);
        return;
      }
      setError(copy.networkError);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (fortuneId?: string) => {
    const query = fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}` : '';
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        missing?: ProfileSupplementRecommendation[];
      }>(`/api/profile/recommendations${query}`, {
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-recommendations',
      });
      if (response.ok && data.success) {
        setMissingRecommendations(data.missing || []);
      }
    } catch {
      setMissingRecommendations([]);
    }
  };

  useEffect(() => {
    void loadSettings(initialFortuneId || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialHighlight || activeTab !== 'supplements') return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`supplement-${initialHighlight.replace(':', '-')}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [initialHighlight, activeTab, loading]);

  const handleFortuneSwitch = async (fortuneId: string) => {
    setActiveFortuneId(fortuneId);
    setDraftDocument(emptyDocument());
    await loadSettings(fortuneId);
  };

  const handleSave = async () => {
    if (!activeFortuneId) return;
    resetNotice();

    if (engineChanged) {
      const confirmed = window.confirm(copy.confirmRecalc);
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
        settings?: ProfileSettingsResponse;
      }>(`/api/profile/fortunes/${activeFortuneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draftFortune,
          intent: draftFortune.intent || null,
          confirmRecalc: engineChanged,
        }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-save-fortune-timeout',
      });

      if (!response.ok || !data.success) {
        if (data.error === 'CONFIRM_RECALC_REQUIRED') {
          setError(copy.confirmRecalcRequired);
          return;
        }
        setError(data.error || copy.saveBasicFailed);
        return;
      }

      const supplementDomains = Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[];
      for (const domain of supplementDomains) {
        await fetchJsonWithTimeout(`/api/profile/supplements/${domain}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fortuneId: activeFortuneId, fields: draftSupplements[domain] }),
          timeoutMs: SETTINGS_TIMEOUT_MS,
          timeoutReason: `profile-settings-save-supplement-${domain}`,
        });
      }

      await loadSettings(activeFortuneId, true);
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

  const handleSaveDocument = async () => {
    if (!activeFortuneId || !draftDocument.title.trim() || !draftDocument.content.trim()) {
      setError(copy.documentTitleRequired);
      return;
    }
    resetNotice();
    setDocSaving(true);

    try {
      const endpoint = draftDocument.id
        ? `/api/profile/documents/${draftDocument.id}`
        : '/api/profile/documents';
      const method = draftDocument.id ? 'PATCH' : 'POST';
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
        settings?: ProfileSettingsResponse;
      }>(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fortuneId: activeFortuneId,
          title: draftDocument.title,
          category: draftDocument.category,
          content: draftDocument.content,
          visibility: draftDocument.visibility,
          pinned: draftDocument.pinned,
        }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-save-document-timeout',
      });

      if (!response.ok || !data.success) {
        setError(data.error || copy.saveDocumentFailed);
        return;
      }

      applySettings(data.settings);
      setDraftDocument(emptyDocument());
      setMessage(data.message || copy.documentSaved);
    } catch {
      setError(copy.networkError);
    } finally {
      setDocSaving(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm(copy.confirmDeleteDocument)) return;
    resetNotice();
    setDocSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        settings?: ProfileSettingsResponse;
      }>(`/api/profile/documents/${documentId}?fortuneId=${encodeURIComponent(activeFortuneId)}`, {
        method: 'DELETE',
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-delete-document-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || copy.deleteDocumentFailed);
        return;
      }
      applySettings(data.settings);
      setMessage(copy.documentDeleted);
    } catch {
      setError(copy.networkError);
    } finally {
      setDocSaving(false);
    }
  };

  const handleCreateArchive = async () => {
    if (!newArchive.name.trim() || !newArchive.birthDate) {
      setError(copy.archiveNameRequired);
      return;
    }
    resetNotice();
    setArchiveSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
        fortuneId?: string;
        settings?: ProfileSettingsResponse;
      }>('/api/profile/fortunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newArchive, fortuneId: activeFortuneId }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-create-archive-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || copy.createArchiveFailed);
        return;
      }
      setNewArchive(emptyArchive());
      if (data.settings) applySettings(data.settings);
      if (data.fortuneId) setActiveFortuneId(data.fortuneId);
      setMessage(data.message || copy.archiveCreated);
    } catch {
      setError(copy.networkError);
    } finally {
      setArchiveSaving(false);
    }
  };

  const handleSetPrimary = async (fortuneId: string) => {
    resetNotice();
    setArchiveSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        settings?: ProfileSettingsResponse;
      }>(`/api/profile/fortunes/${fortuneId}/set-primary`, {
        method: 'POST',
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-set-primary-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || copy.setPrimaryFailed);
        return;
      }
      applySettings(data.settings);
      setMessage(copy.primarySet);
    } catch {
      setError(copy.networkError);
    } finally {
      setArchiveSaving(false);
    }
  };

  const handleExtractFromReport = async () => {
    if (!activeFortuneId) return;
    resetNotice();
    setDocSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        draft?: DraftDocument & { fortuneId?: string | null };
        message?: string;
        settings?: ProfileSettingsResponse;
      }>('/api/profile/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'report',
          sourceId: activeFortuneId,
          fortuneId: activeFortuneId,
          autoSave: false,
        }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-extract-report',
      });
      if (!response.ok || !data.success || !data.draft) {
        setError(data.error || copy.extractFailed);
        return;
      }
      setDraftDocument({
        id: '',
        title: data.draft.title,
        category: data.draft.category,
        content: data.draft.content,
        visibility: 'engine',
        pinned: false,
      });
      setActiveTab('documents');
      setMessage(copy.extractSuccess);
    } catch {
      setError(copy.networkError);
    } finally {
      setDocSaving(false);
    }
  };

  const handleLinkSubscriptionFocus = async (fortuneId: string) => {
    resetNotice();
    setArchiveSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        message?: string;
        focusReportId?: string;
      }>('/api/profile/subscription-focus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fortuneId }),
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-link-subscription',
      });
      if (!response.ok || !data.success) {
        setError(data.error || copy.linkSubscriptionFailed);
        return;
      }
      setSubscriptionFocusReportId(data.focusReportId || fortuneId);
      if (data.settings) {
        applySettings(data.settings);
      }
      setMessage(data.message || copy.linkSubscriptionSuccess);
    } catch {
      setError(copy.networkError);
    } finally {
      setArchiveSaving(false);
    }
  };

  const handleDeleteArchive = async (fortuneId: string) => {
    if (!window.confirm(copy.confirmDeleteArchive)) return;
    resetNotice();
    setArchiveSaving(true);
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success?: boolean;
        error?: string;
        settings?: ProfileSettingsResponse;
      }>(`/api/profile/fortunes/${fortuneId}/delete`, {
        method: 'POST',
        timeoutMs: SETTINGS_TIMEOUT_MS,
        timeoutReason: 'profile-settings-delete-archive-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || copy.deleteArchiveFailed);
        return;
      }
      applySettings(data.settings);
      setMessage(copy.archiveDeleted);
    } catch {
      setError(copy.networkError);
    } finally {
      setArchiveSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[color:var(--ink-5)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {copy.loading}
      </div>
    );
  }

  if (!settings?.fortunes.length) {
    return (
      <div className="border-y border-[color:var(--hairline)] py-6">
        <h2 className="text-[16px] font-semibold text-[color:var(--ink-1)]">{copy.emptyTitle}</h2>
        <p className="mt-1.5 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
          {copy.emptyDescription}
        </p>
        <Link
          href="/analyze"
          className="mt-3 inline-block text-[13px] text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          {copy.emptyCta}
        </Link>
      </div>
    );
  }

  const tabs: Array<{ key: SettingsTab; label: string }> = [
    { key: 'basic', label: copy.tabBasic },
    { key: 'supplements', label: copy.tabSupplements },
    { key: 'documents', label: copy.tabDocuments },
    { key: 'archives', label: copy.tabArchives },
    { key: 'history', label: copy.tabHistory },
  ];

  return (
    <div className="space-y-5">
      <EmailTrustPanel email={settings.account.email || ''} compact />

      <ProgressiveProfileHub fortuneId={activeFortuneId} />

      <div className="overflow-hidden border-y border-[color:var(--hairline)]">
        <div className="border-b border-[color:var(--hairline)] py-3">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">{copy.panelEyebrow}</div>
          <h2 className="mt-0.5 text-[15px] font-semibold text-[color:var(--ink-1)]">
            {copy.panelTitle}
          </h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
            {copy.panelHint}
          </p>
        </div>

        <div className="border-b border-[color:var(--hairline)] py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
            <span className="text-[color:var(--ink-2)]">
              {settings.account.email || settings.account.name}
            </span>
            <span className="text-[12px] text-[color:var(--ink-5)]">
              {copy.completeness(settings.completeness)}
              {settings.completenessBreakdown?.intentHint
                ? ` · ${settings.completenessBreakdown.intentHint}`
                : ''}
            </span>
            {settings.pendingRecalc ? (
              <span className="text-[12px] text-[color:var(--ink-5)]">
                {copy.recalcPending(settings.pendingRecalc.status)}
              </span>
            ) : null}
            <select
              value={activeFortuneId}
              onChange={(event) => void handleFortuneSwitch(event.target.value)}
              className="fb-input ml-auto h-8 min-w-[10rem] px-2.5 text-[12px]"
            >
              {settings.fortunes.map((fortune) => (
                <option key={fortune.id} value={fortune.id}>
                  {fortune.name}
                  {fortune.relationLabel ? `（${fortune.relationLabel}）` : fortune.isPrimary ? `（${copy.selfLabel}）` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-x-4 overflow-x-auto border-b border-[color:var(--hairline)] py-2.5 text-[13px]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? 'shrink-0 font-medium text-[color:var(--ink-1)]'
                  : 'shrink-0 text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]'
              }
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 py-5">
          {error ? (
            <div className="rounded-[var(--radius)] border border-[color:var(--alert-soft)] bg-[color:var(--alert-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--alert)]">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-[var(--radius)] border border-[color:var(--success-soft)] bg-[color:var(--success-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[color:var(--success)]">
              {message}
            </div>
          ) : null}

          {activeTab === 'basic' ? (
            <div className="space-y-5">
              {engineChanged ? (
                <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>{copy.engineChangedWarning}</span>
                </div>
              ) : null}
              {activeFortune?.pillarSummary ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-3.5 py-2.5 text-[13px] text-[color:var(--ink-2)]">
                  {copy.pillarSummary(activeFortune.pillarSummary)}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  [copy.labelName, 'name', 'text'],
                  [copy.labelRelationNote, 'relationLabel', 'text'],
                ].map(([label, key]) => (
                  <label key={key} className="space-y-1.5 text-[13px]">
                    <span className="font-medium text-[color:var(--ink-2)]">{label}</span>
                    <input
                      value={draftFortune[key as keyof DraftFortune] as string}
                      onChange={(event) => setDraftFortune((c) => ({ ...c, [key]: event.target.value }))}
                      className="fb-input h-9 w-full px-3 text-[13px]"
                    />
                  </label>
                ))}
                <label className="space-y-1.5 text-[13px]">
                  <span className="font-medium text-[color:var(--ink-2)]">{copy.labelGender}</span>
                  <select value={draftFortune.gender} onChange={(e) => setDraftFortune((c) => ({ ...c, gender: e.target.value as 'male' | 'female' }))} className="fb-input h-9 w-full px-3 text-[13px]">
                    <option value="male">{copy.genderMale}</option>
                    <option value="female">{copy.genderFemale}</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-[13px]">
                  <span className="font-medium text-[color:var(--ink-2)]">{copy.labelBirthDate}</span>
                  <input type="date" value={draftFortune.birthDate} onChange={(e) => setDraftFortune((c) => ({ ...c, birthDate: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]" />
                </label>
                <label className="space-y-1.5 text-[13px]">
                  <span className="font-medium text-[color:var(--ink-2)]">{copy.labelBirthTime}</span>
                  <input type="time" value={draftFortune.birthTime} disabled={draftFortune.birthAccuracy === 'unknown'} onChange={(e) => setDraftFortune((c) => ({ ...c, birthTime: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px] disabled:opacity-50" />
                </label>
                <label className="space-y-1.5 text-[13px]">
                  <span className="font-medium text-[color:var(--ink-2)]">{copy.labelBirthPlace}</span>
                  <input value={draftFortune.birthPlace} onChange={(e) => setDraftFortune((c) => ({ ...c, birthPlace: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]" />
                </label>
              </div>
              <div className="space-y-2.5">
                <div className="text-[13px] font-medium text-[color:var(--ink-2)]">{copy.labelBirthAccuracy}</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {PROFILE_ACCURACY_OPTIONS.map((option) => (
                    <button key={option.key} type="button" onClick={() => setDraftFortune((c) => ({ ...c, birthAccuracy: option.key, birthTime: option.key === 'unknown' ? '12:00' : c.birthTime }))} className={`rounded-[var(--radius)] border px-3.5 py-3 text-left text-[13px] transition ${draftFortune.birthAccuracy === option.key ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]' : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:border-[color:var(--hairline-strong)]'}`}>
                      <div className="font-medium text-[color:var(--ink-2)]">{option.label}</div>
                      <div className="mt-1 text-[12px] leading-[1.45] text-[color:var(--ink-3)]">{option.text}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="text-[13px] font-medium text-[color:var(--ink-2)]">{copy.labelIntent}</div>
                <div className="grid gap-2 md:grid-cols-2">
                  {PROFILE_INTENT_OPTIONS.map((option) => (
                    <button key={option.key} type="button" onClick={() => setDraftFortune((c) => ({ ...c, intent: option.key }))} className={`rounded-[var(--radius)] border px-3.5 py-3 text-left text-[13px] transition ${draftFortune.intent === option.key ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]' : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:border-[color:var(--hairline-strong)]'}`}>
                      <div className="font-medium text-[color:var(--ink-2)]">{option.label}</div>
                      <div className="mt-1 text-[12px] leading-[1.45] text-[color:var(--ink-3)]">{option.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'supplements' ? (
            <div className="space-y-5">
              <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-sm text-[color:var(--ink-2)]">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{copy.supplementsIntro}</span>
              </div>
              {missingRecommendations.length > 0 ? (
                <div className="rounded-[var(--radius)] border border-amber-200 bg-amber-50 p-3">
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                    <Lightbulb className="h-4 w-4" />
                    {copy.recommendPriority}
                  </div>
                  <div className="mt-2 space-y-2">
                    {missingRecommendations.slice(0, 4).map((item) => (
                      <button
                        key={`${item.domain}:${item.fieldKey}`}
                        type="button"
                        onClick={() => {
                          setDraftSupplements((current) => ({
                            ...current,
                            [item.domain]: { ...current[item.domain] },
                          }));
                          const el = document.getElementById(`supplement-${item.domain}-${item.fieldKey}`);
                          el?.focus();
                        }}
                        className="block w-full rounded border border-amber-100 bg-white px-3 py-2 text-left text-sm text-amber-900"
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-amber-800">{item.reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {(Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[]).map((domain) => {
                const config = PROFILE_SUPPLEMENT_DOMAINS[domain];
                return (
                  <section key={domain} className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--hairline)] p-4 md:p-5">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{config.label}</h3>
                      <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">{config.description}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {config.fields.map((field) => (
                        <label key={field.key} className="space-y-1.5 text-[13px]">
                          <span className="font-medium text-[color:var(--ink-2)]">{field.label}</span>
                          <input
                            id={`supplement-${domain}-${field.key}`}
                            value={draftSupplements[domain][field.key] || ''}
                            onChange={(event) => setDraftSupplements((current) => ({
                              ...current,
                              [domain]: { ...current[domain], [field.key]: event.target.value },
                            }))}
                            placeholder={field.placeholder}
                            className="fb-input h-9 w-full px-3 text-[13px]"
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}

          {activeTab === 'documents' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-sm text-[color:var(--ink-2)]">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{copy.documentsIntro}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleExtractFromReport()}
                  disabled={docSaving || !activeFortuneId}
                  className="inline-flex h-8 items-center gap-1 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-white px-3 text-xs font-semibold"
                >
                  {docSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {copy.extractFromReport}
                </button>
              </div>

              {(settings.documents || []).map((doc) => (
                <div key={doc.id} className="rounded-[var(--radius)] border border-[color:var(--hairline)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-1)]">
                        {doc.pinned ? <Pin className="h-3.5 w-3.5 text-[color:var(--brand)]" /> : null}
                        {doc.title}
                      </div>
                      <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">
                        {PROFILE_DOCUMENT_CATEGORY_OPTIONS.find((item) => item.key === doc.category)?.label || doc.category}
                        {' · '}
                        {doc.visibility === 'engine' ? copy.visibilityEngine : copy.visibilityPrivate}
                        {' · '}
                        {copy.wordCount(doc.wordCount)}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[color:var(--ink-2)]">{doc.content}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => setDraftDocument({ id: doc.id, title: doc.title, category: doc.category, content: doc.content, visibility: doc.visibility, pinned: doc.pinned })} className="rounded border border-[color:var(--hairline)] px-2 py-1 text-xs">{copy.edit}</button>
                      <button type="button" onClick={() => void handleDeleteDocument(doc.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}

              <section className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--hairline)] p-4 md:p-5">
                <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{draftDocument.id ? copy.editDocument : copy.newDocument}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="font-semibold">{copy.labelTitle}</span>
                    <input value={draftDocument.title} onChange={(e) => setDraftDocument((c) => ({ ...c, title: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]" />
                  </label>
                  <label className="space-y-1.5 text-[13px]">
                    <span className="font-semibold">{copy.labelCategory}</span>
                    <select value={draftDocument.category} onChange={(e) => setDraftDocument((c) => ({ ...c, category: e.target.value as ProfileDocumentCategory }))} className="fb-input h-9 w-full px-3 text-[13px]">
                      {PROFILE_DOCUMENT_CATEGORY_OPTIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-[13px]">
                    <span className="font-semibold">{copy.labelVisibility}</span>
                    <select value={draftDocument.visibility} onChange={(e) => setDraftDocument((c) => ({ ...c, visibility: e.target.value as ProfileDocumentVisibility }))} className="fb-input h-9 w-full px-3 text-[13px]">
                      <option value="engine">{copy.visibilityEngineOption}</option>
                      <option value="private">{copy.visibilityPrivateOption}</option>
                    </select>
                  </label>
                </div>
                <label className="space-y-1.5 text-[13px]">
                  <span className="font-semibold">{copy.labelBody(draftDocument.content.length, MAX_PROFILE_DOCUMENT_CHARS)}</span>
                  <textarea value={draftDocument.content} onChange={(e) => setDraftDocument((c) => ({ ...c, content: e.target.value.slice(0, MAX_PROFILE_DOCUMENT_CHARS) }))} rows={6} className="w-full rounded-[var(--radius)] border border-[color:var(--hairline)] px-3 py-2" />
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draftDocument.pinned} onChange={(e) => setDraftDocument((c) => ({ ...c, pinned: e.target.checked }))} />
                  {copy.pinHint}
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleSaveDocument()} disabled={docSaving} className="fb-btn fb-btn-primary h-9 gap-1.5 px-4 text-[13px] disabled:opacity-60">
                    {docSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {copy.saveDocument}
                  </button>
                  {draftDocument.id ? (
                    <button type="button" onClick={() => setDraftDocument(emptyDocument())} className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[color:var(--hairline)] px-3 text-sm">{copy.cancelEdit}</button>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'archives' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-sm text-[color:var(--ink-2)]">
                <Users className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{copy.archivesIntro}</span>
              </div>
              {settings.subscriptionFocus ? (
                <SubscriptionFocusBanner focus={settings.subscriptionFocus} />
              ) : null}
              {settings.fortunes.map((fortune) => (
                <div key={fortune.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] p-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">
                      {fortune.name}
                      {fortune.isPrimary ? <span className="ml-2 rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-xs text-[color:var(--brand)]">{copy.primaryBadge}</span> : null}
                    </div>
                    <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">
                      {copy.archiveMeta(fortune.relationLabel || fortune.relation, fortune.birthDate, fortune.completeness)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subscriptionFocusReportId !== fortune.id ? (
                      <button type="button" onClick={() => void handleLinkSubscriptionFocus(fortune.id)} disabled={archiveSaving} className="rounded border border-[color:var(--hairline)] px-2 py-1 text-xs">{copy.linkEmailReminders}</button>
                    ) : (
                      <span className="rounded border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 py-1 text-xs text-[color:var(--brand)]">{copy.emailRemindersActive}</span>
                    )}
                    {!fortune.isPrimary ? (
                      <button type="button" onClick={() => void handleSetPrimary(fortune.id)} disabled={archiveSaving} className="rounded border border-[color:var(--hairline)] px-2 py-1 text-xs">{copy.setAsDefault}</button>
                    ) : null}
                    {!fortune.isPrimary && settings.fortunes.length > 1 ? (
                      <button type="button" onClick={() => void handleDeleteArchive(fortune.id)} disabled={archiveSaving} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600">{copy.delete}</button>
                    ) : null}
                  </div>
                </div>
              ))}

              <section className="space-y-3 rounded-[var(--radius-md)] border border-[color:var(--hairline)] p-4 md:p-5">
                <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--ink-1)]">
                  <Plus className="h-4 w-4" />
                  {copy.newFamilyArchive}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={newArchive.name} onChange={(e) => setNewArchive((c) => ({ ...c, name: e.target.value }))} placeholder={copy.placeholderName} className="fb-input h-9 w-full px-3 text-[13px]" />
                  <select value={newArchive.relation} onChange={(e) => setNewArchive((c) => ({ ...c, relation: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]">
                    {PROFILE_RELATION_OPTIONS.filter((item) => item.key !== 'self').map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                  <input value={newArchive.relationLabel} onChange={(e) => setNewArchive((c) => ({ ...c, relationLabel: e.target.value }))} placeholder={copy.placeholderRelationNote} className="fb-input h-9 w-full px-3 text-[13px]" />
                  <select value={newArchive.gender} onChange={(e) => setNewArchive((c) => ({ ...c, gender: e.target.value as 'male' | 'female' }))} className="fb-input h-9 w-full px-3 text-[13px]">
                    <option value="male">{copy.genderMale}</option>
                    <option value="female">{copy.genderFemale}</option>
                  </select>
                  <input type="date" value={newArchive.birthDate} onChange={(e) => setNewArchive((c) => ({ ...c, birthDate: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]" />
                  <input type="time" value={newArchive.birthTime} onChange={(e) => setNewArchive((c) => ({ ...c, birthTime: e.target.value }))} className="fb-input h-9 w-full px-3 text-[13px]" />
                  <input value={newArchive.birthPlace} onChange={(e) => setNewArchive((c) => ({ ...c, birthPlace: e.target.value }))} placeholder={copy.placeholderBirthPlace} className="fb-input h-10 w-full px-3 text-sm md:col-span-2" />
                </div>
                <button type="button" onClick={() => void handleCreateArchive()} disabled={archiveSaving} className="fb-btn fb-btn-primary h-9 gap-1.5 px-4 text-[13px] disabled:opacity-60">
                  {archiveSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {copy.createArchive}
                </button>
              </section>
            </div>
          ) : null}

          {activeTab === 'history' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 text-sm text-[color:var(--ink-2)]">
                <History className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{copy.historyIntro}</span>
              </div>
              {(settings.changeLog || []).length === 0 ? (
                <p className="text-sm text-[color:var(--ink-3)]">{copy.historyEmpty}</p>
              ) : (
                settings.changeLog.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius)] border border-[color:var(--hairline)] px-3 py-2 text-sm">
                    <div className="font-medium text-[color:var(--ink-2)]">{item.summary}</div>
                    <div className="mt-1 text-[12px] text-[color:var(--ink-3)]">{item.createdAt || copy.justNow}</div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        {(activeTab === 'basic' || activeTab === 'supplements') ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--hairline)] py-3.5">
            <div className="text-[12px] leading-[1.45] text-[color:var(--ink-5)]">
              {copy.footerNote}
            </div>
            <div className="flex items-center gap-x-4">
              <Link
                href="/profile"
                className="text-[13px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                {copy.backToProfile}
              </Link>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-4 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {copy.saveProfile}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}