'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import FortuneProgress from './fortune-progress';
import BirthPlaceModal from './birth-place-modal';
import BirthTimeModal from './birth-time-modal';
import InstantPaipanCard from './instant-paipan-card';
import PriorityDisclosure from './priority-disclosure';
import TacitKnowledgeComposer from './tacit-knowledge-composer';
import { clearAnalyzeDraft, readAnalyzeDraft } from '@/lib/analyze-draft';
import { LUNAR_DAY_NAMES, LUNAR_MONTH_NAMES } from '@/lib/birth-entry';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { type LocationOption } from '@/lib/location-engine';
import {
  DEFAULT_CASE_TYPES,
  UNKNOWN_LOCATION,
  buildLunarArrFromBirthday,
  createDefaultInfoData,
  formatAddressLabel,
  formatBirthLabel,
  getAnalyzeEntryProgress,
  getBirthdayParts,
  normalizeBirthPlaceLabel,
  padPart,
  type CaseTypeOption,
  type FormLocationState,
  type PaipanInfoData,
} from '@/lib/paipan-form';
import {
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import { appendSearchParamsToHref } from '@/lib/source-url';

const SETTING_MIDNIGHT_KEY = 'setting_midnight';
const DEMO_COUNT_KEY = 'demoCount';

function getLunarMonthNumber(label: string) {
  const normalized = label.replace('闰', '').replace('月', '');
  const monthIndex = LUNAR_MONTH_NAMES.findIndex((item) => item === normalized);
  return monthIndex + 1;
}

function getLunarDayNumber(label: string) {
  return LUNAR_DAY_NAMES.findIndex((item) => item === label) + 1;
}

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

function createCaseName() {
  const current = Number(window.localStorage.getItem(DEMO_COUNT_KEY) || '0') + 1;
  window.localStorage.setItem(DEMO_COUNT_KEY, String(current));
  return `案例${current}`;
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

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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

function getCaseTypeGuidance(caseTypeName: string) {
  const normalized = caseTypeName.trim();

  if (/事业|工作|职业|升职|岗位/.test(normalized)) {
    return {
      headline: '事业类问题要先问角色适配、阶段窗口和组织压力。',
      focus: '更适合追问“这次换岗该推进、观察还是收手”“现在的岗位和我是否匹配”。',
      avoid: '不要只问会不会升职，先问为什么卡、卡在结构还是环境。',
    };
  }

  if (/财富|财务|收入|投资|赚钱/.test(normalized)) {
    return {
      headline: '财富类问题要先拆赚钱方式、保留能力和扩张时机。',
      focus: '更适合追问“现在该保守守财还是放大投入”“现金流最脆弱的点在哪里”。',
      avoid: '不要只问有没有财运，先问钱怎么进、怎么漏、什么时候别扩。',
    };
  }

  if (/关系|感情|婚姻|伴侣|桃花/.test(normalized)) {
    return {
      headline: '关系类问题要先看边界、节奏和环境挤压。',
      focus: '更适合追问“这段关系更像结构不合还是阶段不对”“现在该推进还是拉开距离”。',
      avoid: '不要只问合不合，先问关系为什么卡、谁在消耗、环境是否在放大问题。',
    };
  }

  if (/健康|身体|恢复|睡眠/.test(normalized)) {
    return {
      headline: '健康类问题先看恢复秩序、长期透支和现实负荷。',
      focus: '更适合追问“当前最该先减什么负”“恢复窗口什么时候更适合调整”。',
      avoid: '不要只问会不会出问题，先问透支在哪、恢复位够不够。',
    };
  }

  if (/家庭|父母|孩子|家宅|照护/.test(normalized)) {
    return {
      headline: '家庭类问题先处理责任排序，再谈情绪压力。',
      focus: '更适合追问“当前最该先排哪条责任线”“谁在代替整个系统承压”。',
      avoid: '不要上来追求圆满，先把责任顺序和恢复位排清楚。',
    };
  }

  if (/迁移|移民|出国|回国|城市|海外/.test(normalized)) {
    return {
      headline: '迁移类问题先看阶段、身份成本和环境匹配。',
      focus: '更适合追问“现在适合动还是先稳住”“这次移动最大的现实成本是什么”。',
      avoid: '不要把地图当答案，先问你当前阶段撑不撑得住这次移动。',
    };
  }

  return {
    headline: '综合问题也要先压成一个主问题，再进入判断。',
    focus: '更适合追问“现在最该先看事业、关系、财富、健康、家庭还是迁移哪条主线”。',
    avoid: '不要一次把所有问题混在一起，先锁定一条最想判断的主线。',
  };
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
  const router = useRouter();
  const analyzeRequestRef = useRef<AbortController | null>(null);
  const [infoData, setInfoData] = useState<PaipanInfoData>(createDefaultInfoData);
  const [locationState, setLocationState] = useState<FormLocationState>(UNKNOWN_LOCATION);
  const [caseTypes] = useState<CaseTypeOption[]>(DEFAULT_CASE_TYPES);
  const [setTimeInfo, setSetTimeInfo] = useState(() => createSetTimeInfo(0));
  const [datetimeIndex, setDatetimeIndex] = useState<0 | 1 | 2>(0);
  const [datetimeIndexReal, setDatetimeIndexReal] = useState<0 | 1 | 2>(0);
  const [addressIndex, setAddressIndex] = useState<0 | 1>(0);
  const [showDatetime, setShowDatetime] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [serverStage, setServerStage] = useState<{
    stage: string;
    progress: number;
    label: string;
    detail: string;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<{
    name: string;
    birthText: string;
    birthPlace: string;
    solarTimeText: string;
    useSolarTime: boolean;
    useDaylightSaving: boolean;
    useSeparateZiHour: boolean;
  } | null>(null);
  const [completionMeta, setCompletionMeta] = useState<{
    llmUsed: boolean;
    deliveryTier?: 'basic' | 'enhanced' | 'expert';
    grade?: 'S' | 'A' | 'B' | 'C';
    score?: number;
    targetAchieved?: boolean;
    upgradeQueued?: boolean;
    upgradeStatus?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
    upgradeAttempts?: number;
    upgradeMaxAttempts?: number;
  } | null>(null);
  const [sessionState, setSessionState] = useState<{
    authenticated: boolean;
    user: {
      email: string | null;
      emailVerified?: boolean;
    } | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [tacitContext, setTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [showTacitComposer, setShowTacitComposer] = useState(false);
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    const midnightValue = window.localStorage.getItem(SETTING_MIDNIGHT_KEY) === '1' ? 1 : 0;
    setSetTimeInfo(createSetTimeInfo(midnightValue));
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
    clearAnalyzeDraft();
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
  const latitudeLabel = locationState.latitude !== undefined ? `北纬${locationState.latitude.toFixed(4)}` : '';
  const longitudeLabel = `东经${locationState.longitude.toFixed(3)}`;
  const selectedCaseType = useMemo(
    () => caseTypes.find((item) => item.id === infoData.typeId)?.name || '综合判断',
    [caseTypes, infoData.typeId]
  );
  const hasKnownLocation = locationState.addressData[0] !== '未知地';
  const hasKnownBirthHour = infoData.unknowhour === 0;
  const usesSolarTime = setTimeInfo[1].value === 1;
  const { entryReadiness, readinessScore, nextHint, canSubmit } = useMemo(
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
  const caseTypeGuidance = getCaseTypeGuidance(selectedCaseType);
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

  const submitPayload = async (payload: PaipanInfoData, payloadLocation: FormLocationState) => {
    setLoading(true);
    setLoadingComplete(false);
    setServerStage(null);
    setCompletionMeta(null);
    setError('');

    const displayName = payload.username.trim() || createCaseName();
    const [birthDate, birthTime] = payload.birthday.split(' ');
    const birthPlace = normalizeBirthPlaceLabel(payloadLocation.addressData);
    const useSolarTime = Boolean(setTimeInfo[1].value);
    const useDaylightSaving = Boolean(payload.xls);
    const useSeparateZiHour = Boolean(setTimeInfo[2].value);

    setLoadingSummary({
      name: displayName,
      birthText: formatBirthLabel(payload, payload.type),
      birthPlace,
      solarTimeText: computeSunTime(payload, payloadLocation),
      useSolarTime,
      useDaylightSaving,
      useSeparateZiHour,
    });

    try {
      trackGoogleAnalyticsEvent('analyze_submitted', {
        case_type: selectedCaseType,
        readiness_score: readinessScore,
        has_known_location: hasKnownLocation,
        has_known_birth_hour: hasKnownBirthHour,
        use_solar_time: useSolarTime,
        source: activeSource || 'direct',
        tool_slug: inferredToolSlug,
      });

      const controller = new AbortController();
      analyzeRequestRef.current = controller;
      const response = await fetch('/api/analyze', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-analyze-stream': '1',
        },
        body: JSON.stringify({
          name: displayName,
          gender: payload.sex === 1 ? 'male' : 'female',
          birthDate,
          birthTime,
          birthSecond: 0,
          birthPlace,
          timezone: payload.hw && payload.bjtime ? 8 : payloadLocation.timezone,
          longitude: payloadLocation.longitude,
          latitude: payloadLocation.latitude ?? (UNKNOWN_LOCATION.latitude as number),
          cityNameEn: payloadLocation.option?.nameEn || payloadLocation.option?.city || payloadLocation.addressData[1] || payloadLocation.addressData[0],
          useDaylightSaving,
          useSolarTime,
          useSeparateZiHour,
          tacitContext,
          unknowhour: payload.unknowhour,
          xls: payload.xls,
          bjtime: payload.bjtime,
          hw: payload.hw,
          typeId: payload.typeId,
          isSave: payload.isSave,
          source: activeSource || null,
          toolSlug: inferredToolSlug,
        }),
      });

      if (!response.ok || !response.body) {
        const failed = await response.json().catch(() => null);
        setError(failed?.error || '分析请求失败，请稍后再试');
        setLoadingSummary(null);
        setLoading(false);
        analyzeRequestRef.current = null;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completedReportId = '';
      let completedMeta: {
        llmUsed: boolean;
        deliveryTier?: 'basic' | 'enhanced' | 'expert';
        grade?: 'S' | 'A' | 'B' | 'C';
        score?: number;
        targetAchieved?: boolean;
        upgradeQueued?: boolean;
        upgradeStatus?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
        upgradeAttempts?: number;
        upgradeMaxAttempts?: number;
      } | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          const event = JSON.parse(trimmed) as
            | { type: 'stage'; stage: string; progress: number; label: string; detail: string }
            | {
                type: 'complete';
                reportId: string;
                llm?: { used?: boolean; fallbackToEngine?: boolean };
                quality?: {
                  score?: number;
                  grade?: 'S' | 'A' | 'B' | 'C';
                  deliveryTier?: 'basic' | 'enhanced' | 'expert';
                  targetAchieved?: boolean;
                };
                upgrade?: {
                  queued?: boolean;
                  reason?: string;
                  status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
                  attempts?: number;
                  maxAttempts?: number;
                };
              }
            | { type: 'error'; error: string };

          if (event.type === 'stage') {
            setServerStage({
              stage: event.stage,
              progress: event.progress,
              label: event.label,
              detail: event.detail,
            });
            continue;
          }

          if (event.type === 'error') {
            setError(event.error || '分析失败，请稍后再试');
            setLoadingSummary(null);
            setServerStage(null);
            setCompletionMeta(null);
            setLoading(false);
            analyzeRequestRef.current = null;
            return;
          }

          if (event.type === 'complete') {
            completedReportId = event.reportId;
            completedMeta = {
              llmUsed: !!event.llm?.used,
              deliveryTier: event.quality?.deliveryTier,
              grade: event.quality?.grade,
              score: event.quality?.score,
              targetAchieved: !!event.quality?.targetAchieved,
              upgradeQueued: !!event.upgrade?.queued,
              upgradeStatus: event.upgrade?.status,
              upgradeAttempts: event.upgrade?.attempts,
              upgradeMaxAttempts: event.upgrade?.maxAttempts,
            };
            setCompletionMeta(completedMeta);
            trackGoogleAnalyticsEvent('analyze_completed', {
              report_id: event.reportId,
              llm_used: !!event.llm?.used,
              delivery_tier: event.quality?.deliveryTier || 'basic',
              quality_grade: event.quality?.grade || 'B',
              quality_score: event.quality?.score || 0,
              target_achieved: !!event.quality?.targetAchieved,
              upgrade_queued: !!event.upgrade?.queued,
              upgrade_status: event.upgrade?.status || 'none',
              source: activeSource || 'direct',
              tool_slug: inferredToolSlug,
            });
          }
        }
      }

      if (!completedReportId) {
        setError('分析结果未完整返回，请稍后重试');
        setLoadingSummary(null);
        setServerStage(null);
        setCompletionMeta(null);
        setLoading(false);
        analyzeRequestRef.current = null;
        return;
      }

      setLoadingComplete(true);
      const targetAchieved = completedMeta?.targetAchieved;
      const deliveryTier = completedMeta?.deliveryTier;
      const upgradeQueued = completedMeta?.upgradeQueued;
      setServerStage({
        stage: 'complete',
        progress: 100,
        label: targetAchieved || deliveryTier === 'expert' ? '专家版报告已准备就绪' : '主报告已准备就绪',
        detail: targetAchieved || deliveryTier === 'expert'
          ? '本次结果已经达到专家版标准，正在为你打开完整报告。'
          : upgradeQueued
            ? '当前先打开核心结果页，深度区块会继续分批显示，后台也会继续增强并尝试提升到 S 级专家版。'
            : '结果页已经生成并保存完成，核心内容会先打开，扩展区块随后继续加载。',
      });
      await wait(220);
      analyzeRequestRef.current = null;
      router.push(
        returnHref
          ? appendSearchParamsToHref(`${returnHref}#tool-runner`, {
              source: activeSource || undefined,
              reportId: completedReportId,
              ready: '1',
            })
          : appendSearchParamsToHref(`/result/${completedReportId}`, { source: activeSource || undefined })
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setError('已取消本次判断，你可以继续修改信息后重新提交');
      } else {
        setError(
          hasEmailDelivery
            ? `网络连接异常，请稍后重试。若报告已经成功生成并保存完成，系统也会把结果提醒发到 ${verifiedEmail}。`
            : '网络连接异常，请稍后重试。你也可以稍后回到判断记录里查看是否已生成结果。'
        );
      }
      setLoadingSummary(null);
      setServerStage(null);
      setCompletionMeta(null);
      setLoadingComplete(false);
      setLoading(false);
      analyzeRequestRef.current = null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      setError(
        !timeConfirmed
          ? '请先确认出生时间；如果暂时不知道具体时分，也请在弹窗里开启“时间不确定”。'
          : '请先确认出生地点；如果暂时无法确定，也请在地点弹窗里明确确认“未知地 / 北京时间”。'
      );
      return;
    }

    await submitPayload(infoData, locationState);
  };

  const handleCancelLoading = () => {
    analyzeRequestRef.current?.abort();
    analyzeRequestRef.current = null;
    setLoadingSummary(null);
    setServerStage(null);
    setCompletionMeta(null);
    setLoadingComplete(false);
    setLoading(false);
  };

  const handleTimeConfirm = (tab: 0 | 1 | 2, data: string[] | string) => {
    setTimeConfirmed(true);
    setError('');
    if (tab === 0 && Array.isArray(data)) {
      const unknowhour = data[3] === '未知' || data[4] === '未知' ? 1 : 0;
      const birthday = `${data[0]}-${data[1]}-${data[2]} ${unknowhour ? '00:00' : `${data[3]}:${data[4]}`}`;

      setInfoData((current) => ({
        ...current,
        type: 0,
        birthday,
        lunarArr: [],
        unknowhour,
      }));
      setDatetimeIndexReal(0);
      return;
    }

    if (tab === 1 && Array.isArray(data)) {
      const year = Number(data[0]);
      const monthLabel = data[1];
      const dayLabel = data[2];
      const isLeap = monthLabel.startsWith('闰');
      const lunarMonth = getLunarMonthNumber(monthLabel);
      const lunarDay = getLunarDayNumber(dayLabel);
      const unknowhour = data[3] === '未知' || data[4] === '未知' ? 1 : 0;
      const solar = Lunar.fromYmdHms(year, isLeap ? -lunarMonth : lunarMonth, lunarDay, unknowhour ? 0 : Number(data[3]), unknowhour ? 0 : Number(data[4]), 0).getSolar();
      const birthday = `${solar.getYear()}-${padPart(solar.getMonth())}-${padPart(solar.getDay())} ${unknowhour ? '00:00' : `${padPart(Number(data[3]))}:${padPart(Number(data[4]))}`}`;

      setInfoData((current) => ({
        ...current,
        type: 1,
        birthday,
        unknowhour,
        lunarArr: [year, padPart(lunarMonth), padPart(lunarDay), isLeap, { cnm: monthLabel, cnd: dayLabel }],
      }));
      setDatetimeIndexReal(1);
      return;
    }

    if (tab === 2 && typeof data === 'string') {
      const unknowhour = data.includes('时辰未知') ? 1 : 0;
      const birthday = unknowhour ? `${data.split(' ')[0]} 00:00` : data;

      setInfoData((current) => ({
        ...current,
        type: 2,
        birthday,
        unknowhour,
        lunarArr: [],
      }));
      setDatetimeIndexReal(2);
    }
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
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[1040px]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-3 md:px-5 md:py-5">
            <div className="space-y-2.5 md:space-y-3.5">
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

              {hasEmailDelivery ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.06)] px-3 py-2 text-xs leading-5">
                  <div className="font-mono font-bold uppercase tracking-wider text-[color:var(--data-up)]">
                    结果通知
                  </div>
                  <div className="mt-0.5 text-[color:var(--ink-2)]">
                    报告完成后邮件发送到{' '}
                    <span className="font-mono text-[color:var(--data-up)]">{verifiedEmail}</span>
                  </div>
                </div>
              ) : null}

              {returnHref && returnLabel ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5">
                  <div className="font-mono font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
                    当前目标
                  </div>
                  <div className="mt-0.5 text-[color:var(--ink-2)]">
                    你是从「{returnLabel}」回来补综合判断的，完成后会带你回到原来的工具继续。
                    {returnSource ? <span className="ml-1 font-mono text-[color:var(--ink-5)]">· {returnSource}</span> : ''}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDatetimeIndex(datetimeIndexReal);
                    setShowDatetime(true);
                  }}
                  className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 text-left transition hover:border-[color:var(--accent)] md:rounded-[var(--radius)] md:py-3"
                >
                  <div className="text-xs font-semibold text-[color:var(--muted)]">出生时间</div>
                  <div className="mt-1.5 text-[17px] font-bold text-[color:var(--ink)] md:mt-2 md:text-lg">{birthLabel}</div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-sm text-[color:var(--muted)] md:mt-2">
                    <span>点击选择</span>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${timeConfirmed ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-white text-[color:var(--muted)]'}`}>
                      {timeConfirmed ? '已确认' : '待确认'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddress(true)}
                  className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 text-left transition hover:border-[color:var(--accent)] md:rounded-[var(--radius)] md:py-3"
                >
                  <div className="text-xs font-semibold text-[color:var(--muted)]">出生地点</div>
                  <div className="mt-1.5 text-[17px] font-bold text-[color:var(--ink)] md:mt-2 md:text-lg">{addressLabel}</div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-sm text-[color:var(--muted)] md:mt-2">
                    <span>点击选择</span>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${locationConfirmed ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-white text-[color:var(--muted)]'}`}>
                      {locationConfirmed ? '已确认' : '待确认'}
                    </span>
                  </div>
                </button>
              </div>

              <div className="grid gap-2.5 md:grid-cols-[0.88fr_1.12fr] md:gap-3">
                <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 text-[color:var(--ink)] md:rounded-[var(--radius)] md:py-3">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">性别</div>
                  <div className="mt-1.5 inline-flex rounded-full border border-[#ece7da] bg-white p-1 md:mt-2">
                    {[
                      { label: '男', value: 1 as 0 | 1 },
                      { label: '女', value: 0 as 0 | 1 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setInfoData((current) => ({ ...current, sex: item.value }))}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                          infoData.sex === item.value ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--muted)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 text-[color:var(--ink)] md:rounded-[var(--radius)] md:py-3">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">出生信息模式</div>
                  <div className="mt-1.5 flex overflow-hidden rounded-full border border-[color:var(--line)] bg-white p-1 md:mt-2">
                    {[
                      { label: '公历', value: 0 as 0 | 1 | 2 },
                      { label: '农历', value: 1 as 0 | 1 | 2 },
                      { label: '四柱', value: 2 as 0 | 1 | 2 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setDatetimeIndex(item.value);
                          setShowDatetime(true);
                        }}
                        className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
                          datetimeIndex === item.value ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--muted)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="block rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-2.5 md:rounded-[var(--radius)] md:py-3">
                <div className="text-xs font-semibold text-[color:var(--muted)]">命主姓名</div>
                <input
                  value={infoData.username}
                  onChange={(event) => setInfoData((current) => ({ ...current, username: event.target.value }))}
                  placeholder="可填写本人、家人或案例对象姓名"
                  maxLength={30}
                  className="mt-1.5 h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-base text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)] md:mt-2 md:h-11"
                />
              </label>

              {error ? (
                <div className="rounded-[12px] border border-[#f1c5c5] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#c24545]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex h-12 w-full items-center justify-center rounded-full text-base font-bold transition md:h-14 ${canSubmit ? 'bg-[color:var(--ink)] text-white' : 'bg-[#d8d2c6] text-[#7c7467]'}`}
              >
                {submitLabel}
              </button>

              <PriorityDisclosure
                label="可选"
                title="补充问题、时间修正和当前状态"
                description="不影响提交；需要更细判断时再打开。"
                className="shadow-none md:block"
              >
                <div className="grid gap-3">
                  <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-3">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">判断主题</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {caseTypes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setInfoData((current) => ({ ...current, typeId: item.id }))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            infoData.typeId === item.id
                              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                              : 'border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--bg-elevated)]/70 px-3 py-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[color:var(--muted)]">时间修正与保存</div>
                        <div className="mt-1 text-sm leading-6 text-[color:var(--muted)]">默认使用真太阳时。</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[color:var(--ink)]">保存</span>
                        <button
                          type="button"
                          onClick={() => setInfoData((current) => ({ ...current, isSave: !current.isSave }))}
                          className={`relative h-[28px] w-[46px] rounded-full transition ${
                            infoData.isSave ? 'bg-[color:var(--accent)]' : 'bg-[#d6d6d6]'
                          }`}
                        >
                          <span
                            className={`absolute top-[2px] h-[24px] w-[24px] rounded-full bg-white transition ${
                              infoData.isSave ? 'left-[20px]' : 'left-[2px]'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {setTimeInfo.map((item, index) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSetTimeInfo((current) => {
                              const next = current.map((entry, itemIndex) =>
                                itemIndex === index ? { ...entry, value: (entry.value === 1 ? 0 : 1) as 0 | 1 } : entry
                              );

                              if (index === 0) {
                                setInfoData((prev) => ({ ...prev, xls: next[0].value as 0 | 1 }));
                              }

                              if (index === 2) {
                                window.localStorage.setItem(SETTING_MIDNIGHT_KEY, String(next[2].value));
                              }

                              return next;
                            });
                          }}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            item.value === 1
                              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                              : 'border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <TacitKnowledgeComposer
                    value={tacitContext}
                    onChange={setTacitContext}
                    title="一些无法直接说出来的东西，也可以先交给系统"
                    description="先选状态、身体信号、关系气氛，再补一句最怕发生什么。"
                    collapsedLabel="补充当前状态"
                    emptyHint="这一步不是必填。"
                    summaryLabel="本次默会输入："
                    expanded={showTacitComposer}
                    onExpandedChange={setShowTacitComposer}
                    onReset={() => setTacitContext(createEmptyTacitKnowledgeInput())}
                    variant="analyze"
                  />
                </div>
              </PriorityDisclosure>

            </div>
          </div>

          <div className="hidden space-y-3 xl:sticky xl:top-24 xl:block">
            <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-white/74 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--ink)]">录入完成度</div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{nextHint}</div>
                </div>
                <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--accent-strong)]">
                  {readinessScore}%
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {entryReadiness.map((item) => (
                  <div key={item.label} className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-[color:var(--muted)]">{item.label}</div>
                      <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.done ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-[#f3f3f3] text-[#8a8a8a]'}`}>
                        {item.done ? '已确认' : '待确认'}
                      </div>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden rounded-[var(--radius)] border border-[color:var(--line)] bg-white/70 px-3 py-3 text-sm leading-6 text-[color:var(--muted)] xl:block">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold text-[color:var(--ink)]">当前摘要</div>
                {hasTacitContext ? (
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">已补充默会信息</span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
                  <div className="text-xs text-[color:var(--muted)]">出生时间</div>
                  <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{birthLabel}</div>
                </div>
                <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
                  <div className="text-xs text-[color:var(--muted)]">出生地点</div>
                  <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{addressLabel}</div>
                </div>
                <div className="rounded-lg bg-[color:var(--bg-elevated)]/82 px-3 py-2">
                  <div className="text-xs text-[color:var(--muted)]">真太阳时</div>
                  <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
                    {infoData.unknowhour === 1 ? '未知（需选时辰）' : infoData.sunTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 hidden xl:block">
          <PriorityDisclosure
            label="独立入口"
            title="当前时刻直接起局"
            description="这里走的是“当前时刻直接起局”，和上方出生信息录入是两条不同流程。"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <InstantPaipanCard
                sex={infoData.sex}
                submitting={loading}
                disabled={loading}
                onConfirm={(payload) => {
                  void submitPayload(payload, UNKNOWN_LOCATION);
                }}
              />

              <div className="flex min-h-[42px] items-center justify-center rounded-[1.2rem] border border-[color:var(--line)] bg-white/58 px-4 py-4 text-xs text-[#9a927f]">
                <AlertCircle className="mr-[5px] h-[16px] w-[16px]" />
                <span>平台所有产品拒绝向未成年人提供服务，仅供娱乐和参考</span>
              </div>
            </div>
          </PriorityDisclosure>
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
