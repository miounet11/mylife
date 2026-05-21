'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import FortuneProgress from '../fortune-progress';
import BirthPlaceModal from '../birth-place-modal';
import AdvancedOptionsDisclosure from './advanced-options-disclosure';
import AutoAdvanceToast from './auto-advance-toast';
import BirthTimeCard from './birth-time-card';
import BirthPlaceCard from './birth-place-card';
import EntryProgressBar from './entry-progress-bar';
import FormBanners from './form-banners';
import GenderPicker from './gender-picker';
import RelationPicker from './relation-picker';
import SubmitButton from './submit-button';
import { useAnalyzeSubmit } from './use-analyze-submit';
import { clearAnalyzeDraft, readAnalyzeDraft } from '@/lib/analyze-draft';
import { trackClientEvent } from '@/lib/analytics-client';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { type LocationOption } from '@/lib/location-engine';
import {
  DEFAULT_CASE_TYPES,
  UNKNOWN_LOCATION,
  buildLunarArrFromBirthday,
  buildProgressSegments,
  createDefaultInfoData,
  formatAddressLabel,
  formatBirthLabel,
  getAnalyzeEntryProgress,
  getBirthdayParts,
  normalizeBirthPlaceLabel,
  padPart,
  parseBirthTimeConfirm,
  type CaseTypeOption,
  type FormLocationState,
  type PaipanInfoData,
} from '@/lib/paipan-form';
import {
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';

const BirthTimeModal = dynamic(() => import('../birth-time-modal'), {
  ssr: false,
});

const SETTING_MIDNIGHT_KEY = 'setting_midnight';

function subtractOneHour(year: number, month: number, day: number, hour: number, minute: number) {
  const date = new Date(year, month - 1, day, hour, minute, 0);
  date.setHours(date.getHours() - 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

function computeSunTime(infoData: PaipanInfoData, locationState: FormLocationState) {
  const { year, month, day, hour, minute } = getBirthdayParts(infoData.birthday);

  if (infoData.unknowhour === 1) {
    return `${infoData.birthday.split(' ')[0]} 00:00`;
  }

  if (locationState.addressData[0] === '未知地') {
    return infoData.birthday;
  }

  const normalizedClock = infoData.xls
    ? subtractOneHour(year, month, day, hour, minute)
    : { year, month, day, hour, minute };

  const solarTime = calculateTrueSolarTime(
    normalizedClock.year,
    normalizedClock.month,
    normalizedClock.day,
    normalizedClock.hour,
    normalizedClock.minute,
    0,
    locationState.longitude,
    infoData.hw && infoData.bjtime ? 8 : locationState.timezone
  );

  return `${solarTime.year}-${padPart(solarTime.month)}-${padPart(solarTime.day)} ${padPart(solarTime.hour)}:${padPart(solarTime.minute)}`;
}

function createSetTimeInfo(midnightValue: 0 | 1) {
  return [
    { name: '夏令时', value: 0 as 0 | 1 },
    { name: '真太阳时', value: 1 as 0 | 1 },
    { name: '早晚子时', value: midnightValue },
  ];
}

function maskEmail(email?: string | null) {
  const normalized = `${email || ''}`.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return '';
  }

  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) {
    return normalized;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}


export default function FortuneForm({
  returnHref,
  returnLabel,
  returnSource,
}: {
  returnHref?: string;
  returnLabel?: string;
  returnSource?: string;
}) {
  const [infoData, setInfoData] = useState<PaipanInfoData>(createDefaultInfoData);
  const [locationState, setLocationState] = useState<FormLocationState>(UNKNOWN_LOCATION);
  const [caseTypes] = useState<CaseTypeOption[]>(DEFAULT_CASE_TYPES);
  const [setTimeInfo, setSetTimeInfo] = useState(() => createSetTimeInfo(0));
  const [datetimeIndex, setDatetimeIndex] = useState<0 | 1 | 2>(0);
  const [datetimeIndexReal, setDatetimeIndexReal] = useState<0 | 1 | 2>(0);
  const [addressIndex, setAddressIndex] = useState<0 | 1>(0);
  const [showDatetime, setShowDatetime] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [sessionState, setSessionState] = useState<{
    authenticated: boolean;
    user: {
      email: string | null;
      emailVerified?: boolean;
    } | null;
  } | null>(null);
  const [tacitContext, setTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [showTacitComposer, setShowTacitComposer] = useState(false);
  // v5-D39 多档案：可选 relation
  const [relationKey, setRelationKey] = useState<import('@/lib/relation').RelationKey | null>(null);
  const [relationLabel, setRelationLabel] = useState<string>('');
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [hasAutoOpenedPlace, setHasAutoOpenedPlace] = useState(false);
  const [autoAdvancePending, setAutoAdvancePending] = useState(false);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

  useEffect(() => {
    try {
      const midnightValue = window.localStorage.getItem(SETTING_MIDNIGHT_KEY) === '1' ? 1 : 0;
      setSetTimeInfo(createSetTimeInfo(midnightValue));
    } catch {
      // localStorage 不可用，保持默认（早晚子时关闭）
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await response.json();

        if (!cancelled) {
          setSessionState({
            authenticated: !!data.authenticated,
            user: data.user || null,
          });
        }
      } catch {
        if (!cancelled) {
          setSessionState({ authenticated: false, user: null });
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const draft = readAnalyzeDraft();
    if (!draft) {
      return;
    }

    const birthday = `${draft.birthDate} ${draft.birthTime}`;
    setInfoData((current) => ({
      ...current,
      sex: draft.gender === 'male' ? 1 : 0,
      type: 0,
      birthday,
      sunTime: birthday,
      unknowhour: 0,
      lunarArr: buildLunarArrFromBirthday(birthday),
    }));
    setDatetimeIndex(0);
    setDatetimeIndexReal(0);
    // 草稿恢复用户：跳过领着走，用户可自由编辑任一字段
    setHasAutoOpenedPlace(true);
    clearAnalyzeDraft();
  }, []);

  // 领着走：时间确认后展示 2 秒可撤销 toast，到时打开地点弹窗
  // 一次性、可中断、草稿用户跳过、本次会话取消后不再触发
  useEffect(() => {
    if (
      !timeConfirmed
      || locationConfirmed
      || hasAutoOpenedPlace
      || showDatetime
      || autoAdvancePending
      || autoAdvanceCancelled
    ) {
      return;
    }
    setAutoAdvancePending(true);
  }, [
    timeConfirmed,
    locationConfirmed,
    hasAutoOpenedPlace,
    showDatetime,
    autoAdvancePending,
    autoAdvanceCancelled,
  ]);

  const handleAutoAdvanceCancel = useCallback(() => {
    setAutoAdvancePending(false);
    setAutoAdvanceCancelled(true);
  }, []);

  const handleAutoAdvanceComplete = useCallback(() => {
    setAutoAdvancePending(false);
    setHasAutoOpenedPlace(true);
    // 若用户在 toast 倒计时期间已手动打开过地点弹窗，不再重复触发
    setShowAddress((current) => current || true);
  }, []);

  const computedSunTime = useMemo(() => computeSunTime(infoData, locationState), [infoData, locationState]);

  useEffect(() => {
    if (infoData.sunTime === computedSunTime) {
      return;
    }

    setInfoData((current) => ({ ...current, sunTime: computedSunTime }));
  }, [computedSunTime, infoData.sunTime]);

  const birthLabel = formatBirthLabel(infoData, datetimeIndexReal);
  const addressLabel = formatAddressLabel(locationState.addressData);
  const selectedCaseType = useMemo(
    () => caseTypes.find((item) => item.id === infoData.typeId)?.name || '综合判断',
    [caseTypes, infoData.typeId]
  );
  const hasKnownLocation = locationState.addressData[0] !== '未知地';
  const hasKnownBirthHour = infoData.unknowhour === 0;
  const usesSolarTime = setTimeInfo[1].value === 1;
  const { canSubmit, readinessScore } = useMemo(
    () =>
      getAnalyzeEntryProgress({
        timeConfirmed,
        locationConfirmed,
        hasKnownBirthHour,
        hasKnownLocation,
        usesSolarTime,
      }),
    [timeConfirmed, locationConfirmed, hasKnownBirthHour, hasKnownLocation, usesSolarTime]
  );
  // v5-D59 (2026-05-21): 表单首次有效交互埋点
  // 5h 漏斗 41 PV → 2 submitted（4.9%），需要拆段定位流失点：
  //   pageview → form_started → submitted
  // form_started = 用户至少把"时间"或"地点"两步中的一步确认了
  const [formStartedTracked, setFormStartedTracked] = useState(false);
  useEffect(() => {
    if (formStartedTracked) return;
    if (!timeConfirmed && !locationConfirmed) return;
    setFormStartedTracked(true);
    void trackClientEvent({
      eventName: 'analyze_form_started',
      page: typeof window !== 'undefined' ? window.location.pathname : '/analyze',
      meta: {
        first_step: timeConfirmed ? 'time' : 'location',
        has_known_birth_hour: hasKnownBirthHour,
        has_known_location: hasKnownLocation,
      },
    });
  }, [timeConfirmed, locationConfirmed, formStartedTracked, hasKnownBirthHour, hasKnownLocation]);
  const progressSegments = useMemo(
    () =>
      buildProgressSegments({
        timeConfirmed,
        locationConfirmed,
        genderConfirmed: true,
      }),
    [timeConfirmed, locationConfirmed]
  );
  const submitLabel = canSubmit ? '生成我的世界易判断' : '先确认出生时间与地点';
  const hasTacitContext = hasTacitKnowledgeInput(tacitContext);
  const verifiedEmail = sessionState?.authenticated && sessionState?.user?.emailVerified
    ? maskEmail(sessionState.user.email)
    : '';
  const hasEmailDelivery = Boolean(verifiedEmail);
  const activeSource = returnSource?.trim() || '';
  const inferredToolSlug = returnHref?.startsWith('/tools/')
    ? returnHref.replace('/tools/', '').split(/[?#]/)[0] || null
    : null;

  useEffect(() => {
    if (hasTacitContext) {
      setShowTacitComposer(true);
    }
  }, [hasTacitContext]);

  const submitContext = useMemo(
    () => ({
      setTimeInfoValues: {
        useSolarTime: setTimeInfo[1].value === 1,
        useSeparateZiHour: setTimeInfo[2].value === 1,
      },
      selectedCaseType,
      readinessScore,
      hasKnownLocation,
      hasKnownBirthHour,
      activeSource,
      inferredToolSlug,
      tacitContext,
      computedSolarTime: computeSunTime,
      returnHref,
      hasEmailDelivery,
      verifiedEmail,
      relation: relationKey,
      relationLabel: relationLabel.trim() || null,
    }),
    [
      setTimeInfo,
      selectedCaseType,
      readinessScore,
      hasKnownLocation,
      hasKnownBirthHour,
      activeSource,
      inferredToolSlug,
      tacitContext,
      returnHref,
      hasEmailDelivery,
      verifiedEmail,
      relationKey,
      relationLabel,
    ],
  );

  const {
    loading,
    loadingComplete,
    loadingSummary,
    serverStage,
    completionMeta,
    error,
    setError,
    submit,
    cancel,
  } = useAnalyzeSubmit(submitContext);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;

    if (!canSubmit) {
      setError(
        !timeConfirmed
          ? '请先确认出生时间；如果暂时不知道具体时分，也请在弹窗里开启“时间不确定”。'
          : '请先确认出生地点；如果暂时无法确定，也请在地点弹窗里明确确认“未知地 / 北京时间”。'
      );
      return;
    }

    await submit(infoData, locationState);
  };

  const handleCancelLoading = cancel;

  const handleTimeConfirm = (tab: 0 | 1 | 2, data: string[] | string) => {
    setTimeConfirmed(true);
    setError('');
    const result = parseBirthTimeConfirm(tab, data);
    if (!result) return;
    setInfoData((current) => ({ ...current, ...result.patch }));
    setDatetimeIndexReal(result.datetimeIndexReal);
  };

  if (loading) {
    return (
      <FortuneProgress
        isComplete={loadingComplete}
        summary={loadingSummary}
        onCancel={handleCancelLoading}
        serverStage={serverStage}
        completionMeta={completionMeta}
        deliverySupport={{
          canEmailNotify: hasEmailDelivery,
          emailLabel: verifiedEmail || null,
        }}
      />
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[720px]">
        <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-3 md:px-5 md:py-5">
            <div className="space-y-3 md:space-y-4">
              <EntryProgressBar segments={progressSegments} />

              <div className="hidden space-y-1.5 md:block">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  填写出生信息
                </div>
                <h2 className="text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
                  先确认时间和地点
                </h2>
                <p className="text-sm leading-6 text-[color:var(--ink-3)]">
                  生成报告前只需要补齐这几项，其他内容后面再展开。
                </p>
              </div>

              <FormBanners
                hasEmailDelivery={hasEmailDelivery}
                verifiedEmail={verifiedEmail}
                returnHref={returnHref}
                returnLabel={returnLabel}
                returnSource={returnSource}
              />

              <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
                <BirthTimeCard
                  label={timeConfirmed ? birthLabel : ''}
                  confirmed={timeConfirmed}
                  unknownHour={infoData.unknowhour === 1}
                  onOpen={() => {
                    setDatetimeIndex(datetimeIndexReal);
                    setShowDatetime(true);
                  }}
                  onToggleUnknown={() => {
                    setInfoData((current) => {
                      const next = current.unknowhour === 1 ? 0 : 1;
                      const [datePart] = current.birthday.split(' ');
                      return {
                        ...current,
                        unknowhour: next as 0 | 1,
                        birthday: next === 1 ? `${datePart} 00:00` : current.birthday,
                      };
                    });
                    setTimeConfirmed(true);
                  }}
                />

                <BirthPlaceCard
                  label={locationConfirmed ? addressLabel : ''}
                  confirmed={locationConfirmed}
                  bjTime={infoData.bjtime === 1}
                  onOpen={() => setShowAddress(true)}
                />
              </div>

              {autoAdvancePending ? (
                <AutoAdvanceToast
                  durationMs={2000}
                  onCancel={handleAutoAdvanceCancel}
                  onComplete={handleAutoAdvanceComplete}
                />
              ) : null}

              <GenderPicker
                value={infoData.sex as 0 | 1}
                onChange={(next) => setInfoData((current) => ({ ...current, sex: next }))}
              />

              <RelationPicker
                value={relationKey}
                label={relationLabel}
                onChange={setRelationKey}
                onLabelChange={setRelationLabel}
              />

              <SubmitButton
                canSubmit={canSubmit}
                loading={loading}
                label={submitLabel}
                error={error}
                modalOpen={showDatetime || showAddress}
              />

              <AdvancedOptionsDisclosure
                infoData={infoData}
                onInfoDataChange={(patch) => setInfoData((current) => ({ ...current, ...patch }))}
                caseTypes={caseTypes}
                setTimeInfo={setTimeInfo}
                onSetTimeInfoChange={setSetTimeInfo}
                tacitContext={tacitContext}
                onTacitChange={setTacitContext}
                tacitExpanded={showTacitComposer}
                onTacitExpandedChange={setShowTacitComposer}
              />

            </div>
          </div>
      </form>

      <BirthTimeModal
        isOpen={showDatetime}
        tabIndex={datetimeIndex}
        birthday={infoData.birthday}
        unknowhour={infoData.unknowhour}
        onClose={() => setShowDatetime(false)}
        onTabChange={setDatetimeIndex}
        onConfirm={(tab, data) => {
          handleTimeConfirm(tab, data);
          setShowDatetime(false);
        }}
      />

      <BirthPlaceModal
        isOpen={showAddress}
        tabIndex={addressIndex}
        addressData={locationState.addressData}
        isBJTime={Boolean(infoData.bjtime)}
        onClose={() => setShowAddress(false)}
        onTabChange={setAddressIndex}
        onConfirm={({ tabIndex, addressData: nextAddressData, location, isBJTime }) => {
          setLocationConfirmed(true);
          setError('');
          setLocationState({
            option: location,
            addressData: nextAddressData,
            longitude: location.lng,
            latitude: tabIndex === 0 ? location.lat : undefined,
            timezone: location.tz,
          });
          setAddressIndex(tabIndex);
          setInfoData((current) => ({
            ...current,
            address: normalizeBirthPlaceLabel(nextAddressData),
            hw: tabIndex === 1 ? 1 : 0,
            bjtime: tabIndex === 1 && isBJTime ? 1 : 0,
          }));
          setShowAddress(false);
        }}
      />
    </>
  );
}
