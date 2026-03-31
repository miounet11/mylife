'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import FortuneProgress from './fortune-progress';
import BirthPlaceModal from './birth-place-modal';
import BirthTimeModal from './birth-time-modal';
import InstantPaipanCard from './instant-paipan-card';
import { clearAnalyzeDraft, readAnalyzeDraft } from '@/lib/analyze-draft';
import { LUNAR_DAY_NAMES, LUNAR_MONTH_NAMES } from '@/lib/birth-entry';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { type LocationOption } from '@/lib/location-engine';
import {
  DEFAULT_CASE_TYPES,
  DEFAULT_CASE_TYPE_ID,
  UNKNOWN_LOCATION,
  buildLunarArrFromBirthday,
  createDefaultInfoData,
  formatAddressLabel,
  formatBirthLabel,
  getBirthdayParts,
  normalizeBirthPlaceLabel,
  padPart,
  type CaseTypeOption,
  type FormLocationState,
  type PaipanInfoData,
} from '@/lib/paipan-form';

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

export default function FortuneForm() {
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
  const isSpecificCaseType = infoData.typeId !== DEFAULT_CASE_TYPE_ID;
  const hasKnownLocation = locationState.addressData[0] !== '未知地';
  const hasKnownBirthHour = infoData.unknowhour === 0;
  const usesSolarTime = setTimeInfo[1].value === 1;
  const entryReadiness = [
    {
      label: '判断主题',
      done: isSpecificCaseType,
      value: isSpecificCaseType ? selectedCaseType : '当前还是默认分类',
      helper: isSpecificCaseType ? '主问题已经更聚焦，后续结果会更容易收敛。' : '建议先把主题缩到更具体的事业、关系、财富等主线。',
    },
    {
      label: '出生时间精度',
      done: hasKnownBirthHour,
      value: hasKnownBirthHour ? birthLabel : '当前为未知时辰',
      helper: hasKnownBirthHour ? '阶段判断会更稳，结果更容易落到月份和窗口。' : '如果能补足时辰，结果页的阶段与动作建议会更扎实。',
    },
    {
      label: '环境坐标',
      done: hasKnownLocation,
      value: hasKnownLocation ? addressLabel : '当前仍是未知地',
      helper: hasKnownLocation ? '地点、时区与经纬度已经进入判断。' : '补上出生地点后，真太阳时和环境判断会更可靠。',
    },
    {
      label: '时间修正',
      done: usesSolarTime,
      value: usesSolarTime ? '真太阳时已开启' : '当前按钟表时间',
      helper: usesSolarTime ? '系统会优先按更稳的时间基准整理阶段。' : '建议开启真太阳时，让阶段判断更接近真实节律。',
    },
  ];
  const readinessScore = Math.round((entryReadiness.filter((item) => item.done).length / entryReadiness.length) * 100);
  const nextHint = !isSpecificCaseType
    ? '先把案例分类从“默认分类”切到更具体的问题主线，结果会更聚焦。'
    : !hasKnownLocation
      ? '建议补上出生地点，让时间修正和环境判断一起成立。'
      : !hasKnownBirthHour
        ? '如果你能确认时辰，阶段窗口和动作建议会更稳。'
        : !usesSolarTime
          ? '建议开启真太阳时，让结果更接近真实节律。'
          : '当前信息已经够进入判断，后续重点是看结果页里的结构、阶段和动作排序。';
  const caseTypeGuidance = getCaseTypeGuidance(selectedCaseType);
  const submitLabel = readinessScore >= 75 ? '生成我的世界易判断' : '用当前信息进入判断';
  const verifiedEmail = sessionState?.authenticated && sessionState?.user?.emailVerified
    ? maskEmail(sessionState.user.email)
    : '';
  const hasEmailDelivery = Boolean(verifiedEmail);

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
          unknowhour: payload.unknowhour,
          xls: payload.xls,
          bjtime: payload.bjtime,
          hw: payload.hw,
          typeId: payload.typeId,
          isSave: payload.isSave,
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
      router.push(`/result/${completedReportId}`);
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
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[681px]">
        <div className="rounded-[30px] bg-white px-5 py-7 shadow-[0_18px_50px_rgba(16,16,16,0.08)] md:px-[56px] md:py-[52px]">
          <div className="space-y-[22px]">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['结构底座', '出生信息会先决定命局底座，不先被单一事件带跑。'],
                ['阶段坐标', '真太阳时、时区与时间精度会影响阶段判断。'],
                ['动作导向', '最终结果要落到现在先做什么，而不是停在术语。'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[18px] border border-[#efe8d9] bg-[#fbf8f2] px-4 py-4">
                  <div className="text-[15px] font-semibold text-[#3f392f]">{title}</div>
                  <div className="mt-2 text-[13px] leading-6 text-[#6a6356]">{description}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[18px] border border-[#ece7da] bg-[#faf7f1] px-4 py-4 text-[14px] leading-7 text-[#6a6356]">
              <div className="font-semibold text-[#3f392f]">世界易录入提示</div>
              <div className="mt-2">
                这一步不是单纯提交一份资料，而是在为你的个人判断页建立底座。系统后面会按“结构 → 阶段 → 环境 → 动作”的顺序整理结果。
              </div>
            </div>

            <div className={`rounded-[18px] px-4 py-4 text-[14px] leading-7 ${hasEmailDelivery ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-[#ece7da] bg-white text-[#6a6356]'}`}>
              <div className={`font-semibold ${hasEmailDelivery ? 'text-emerald-800' : 'text-[#3f392f]'}`}>慢请求处理提醒</div>
              <div className="mt-2">
                {hasEmailDelivery
                  ? `如果网络波动或模型响应偏慢，你不用一直守着页面。只要报告成功生成并保存完成，系统会把结果提醒发到 ${verifiedEmail}，你也可以稍后回到判断记录里继续看。`
                  : '如果网络波动或模型响应偏慢，你可以稍后回来看判断记录。登录并绑定邮箱后，报告生成完成时也可以直接收邮件提醒。'}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="rounded-[20px] border border-[#ece7da] bg-[#faf7f1] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-[#3f392f]">录入完成度</div>
                    <div className="mt-1 text-[13px] leading-6 text-[#6a6356]">不是必须填到完美，但补齐关键缺口会明显提升判断质量。</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[#b2955d]">
                    {readinessScore}%
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {entryReadiness.map((item) => (
                    <div key={item.label} className="rounded-[14px] bg-white/90 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">{item.label}</div>
                        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.done ? 'bg-[#f5ecda] text-[#8b6a2f]' : 'bg-[#f3f3f3] text-[#8a8a8a]'}`}>
                          {item.done ? '已增强' : '待补强'}
                        </div>
                      </div>
                      <div className="mt-2 text-[15px] font-semibold text-[#3f392f]">{item.value}</div>
                      <div className="mt-2 text-[13px] leading-6 text-[#6a6356]">{item.helper}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-[#ece7da] bg-[#faf7f1] px-4 py-4">
                <div className="text-[15px] font-semibold text-[#3f392f]">本次更适合这样问</div>
                <div className="mt-3 rounded-[14px] bg-white/90 px-4 py-3 text-[14px] leading-7 text-[#4b4439]">
                  {caseTypeGuidance.headline}
                </div>
                <div className="mt-3 rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">建议追问方式</div>
                  <div className="mt-2 text-[14px] leading-7 text-[#4b4439]">{caseTypeGuidance.focus}</div>
                </div>
                <div className="mt-3 rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">当前下一步</div>
                  <div className="mt-2 text-[14px] leading-7 text-[#4b4439]">{nextHint}</div>
                </div>
                <div className="mt-3 rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">避免这样问</div>
                  <div className="mt-2 text-[14px] leading-7 text-[#4b4439]">{caseTypeGuidance.avoid}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-[14px]">
              <span className="shrink-0 whitespace-nowrap text-[16px] text-[#444444]">命主姓名</span>
              <input
                value={infoData.username}
                onChange={(event) => setInfoData((current) => ({ ...current, username: event.target.value }))}
                placeholder="请输入姓名"
                maxLength={30}
                className="h-[40px] w-full rounded-[6px] border border-[#ececec] px-3 text-[16px] outline-none placeholder:text-[#d5d5d5]"
              />
            </div>

            <div className="flex items-center justify-between gap-5 text-[16px] text-[#444444]">
              <div className="flex items-center">
                {[
                  { label: '男', value: 1 as 0 | 1 },
                  { label: '女', value: 0 as 0 | 1 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setInfoData((current) => ({ ...current, sex: item.value }))}
                    className="mr-[31px] flex items-center"
                  >
                    <span
                      className={`mr-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                        infoData.sex === item.value ? 'border-[#b2955d]' : 'border-[rgba(178,149,93,0.35)]'
                      }`}
                    >
                      <span className={`h-[10px] w-[10px] rounded-full ${infoData.sex === item.value ? 'bg-[#b2955d]' : 'bg-transparent'}`} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex overflow-hidden rounded-[20px] shadow-[0_1px_5px_rgba(0,0,0,0.07)]">
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
                    className={`rounded-[20px] px-[30px] py-[6px] ${
                      datetimeIndex === item.value ? 'bg-[#b2955d] text-white' : 'text-[#444444]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-[14px]" onClick={() => {
              setDatetimeIndex(datetimeIndexReal);
              setShowDatetime(true);
            }}>
              <span className="shrink-0 whitespace-nowrap text-[16px] text-[#444444]">出生时间</span>
              <button
                type="button"
                className="w-full rounded-[6px] border border-[#ececec] px-[13px] py-[9px] text-left text-[16px] text-[#444444]"
              >
                {birthLabel}
              </button>
            </div>

            <div className="flex items-center gap-[14px]" onClick={() => setShowAddress(true)}>
              <span className="shrink-0 whitespace-nowrap text-[16px] text-[#444444]">出生地址</span>
              <button
                type="button"
                className="w-full rounded-[6px] border border-[#ececec] px-[13px] py-[9px] text-left text-[16px] text-[#444444]"
              >
                {addressLabel}
              </button>
            </div>

            <div className="relative flex flex-wrap items-center gap-x-[31px] gap-y-3">
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
                  className="flex items-center whitespace-nowrap text-[16px] text-[#444444]"
                >
                  <span
                    className={`mr-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                      item.value === 1 ? 'border-[#b2955d]' : 'border-[rgba(178,149,93,0.35)]'
                    }`}
                  >
                    <span className={`h-[10px] w-[10px] rounded-full ${item.value === 1 ? 'bg-[#b2955d]' : 'bg-transparent'}`} />
                  </span>
                  <span>{item.name}</span>
                </button>
              ))}

              <div className="ml-auto flex items-center gap-3">
                <span className="text-[16px] text-[#444444]">保存</span>
                <button
                  type="button"
                  onClick={() => setInfoData((current) => ({ ...current, isSave: !current.isSave }))}
                  className={`relative h-[28px] w-[46px] rounded-full transition ${
                    infoData.isSave ? 'bg-[#b2955d]' : 'bg-[#d6d6d6]'
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

            <div className="flex flex-wrap items-start gap-x-7 gap-y-2 text-[16px] text-[#7b7b7b]">
              <span>真太阳时：{infoData.unknowhour === 1 ? '未知（需选时辰）' : infoData.sunTime}</span>
              <span>
                地址经纬： {latitudeLabel ? `${latitudeLabel} ` : ''}
                {longitudeLabel}
              </span>
            </div>

            <div className="flex items-start gap-[14px]">
              <span className="shrink-0 whitespace-nowrap pt-[2px] text-[16px] text-[#7b7b7b]">案例分类</span>
              <div className="flex flex-1 overflow-x-auto pb-1">
                {caseTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInfoData((current) => ({ ...current, typeId: item.id }))}
                    className="mr-[31px] flex items-center whitespace-nowrap text-[16px] text-[#444444]"
                  >
                    <span
                      className={`mr-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                        infoData.typeId === item.id ? 'border-[#b2955d]' : 'border-[rgba(178,149,93,0.35)]'
                      }`}
                    >
                      <span className={`h-[10px] w-[10px] rounded-full ${infoData.typeId === item.id ? 'bg-[#b2955d]' : 'bg-transparent'}`} />
                    </span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-[12px] border border-[#f1c5c5] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#c24545]">
                {error}
              </div>
            ) : null}

            <div className="rounded-[18px] border border-[#ece7da] bg-[#faf7f1] px-4 py-4 text-[14px] leading-7 text-[#6a6356]">
              <div className="font-semibold text-[#3f392f]">本次建盘协议</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">判断主题</div>
                  <div className="mt-2 text-[15px] font-semibold text-[#3f392f]">{selectedCaseType}</div>
                </div>
                <div className="rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">出生信息模式</div>
                  <div className="mt-2 text-[15px] font-semibold text-[#3f392f]">{birthLabel}</div>
                </div>
                <div className="rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">环境坐标</div>
                  <div className="mt-2 text-[15px] font-semibold text-[#3f392f]">{addressLabel}</div>
                </div>
                <div className="rounded-[14px] bg-white/90 px-4 py-3">
                  <div className="text-[12px] tracking-[0.18em] text-[#9a927f]">时间修正</div>
                  <div className="mt-2 text-[15px] font-semibold text-[#3f392f]">
                    {setTimeInfo[1].value ? '真太阳时开启' : '按钟表时间'}
                    {setTimeInfo[0].value ? ' · 夏令时已启用' : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#ececec] bg-[#fafafa] px-4 py-4 text-[14px] leading-7 text-[#6d6d6d]">
              提交后你先拿到的，不是一句抽象结论，而是主结构、当前阶段、环境提示和现在先做什么。
            </div>

            <button
              type="submit"
              className="flex h-[63px] w-full items-center justify-center rounded-full bg-black font-serif text-[18px] font-bold text-[#f7d3a1]"
            >
              {submitLabel}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <InstantPaipanCard
            sex={infoData.sex}
            onConfirm={(payload) => {
              void submitPayload(payload, UNKNOWN_LOCATION);
            }}
          />
        </div>

        <div className="mt-4 rounded-[20px] bg-white px-4 py-4 text-[13px] leading-7 text-[#8a8a8a] shadow-[0_8px_24px_rgba(16,16,16,0.05)]">
          如果你只是想先快速进入结果，也可以直接用上面的快速入口。后续结果页仍会优先整理成世界易的结构、阶段和动作顺序。
        </div>

        <div className="mt-4 flex h-[42px] items-center justify-center rounded-[20px] bg-white px-4 text-[12px] text-[#c2c2c2] shadow-[0_8px_24px_rgba(16,16,16,0.05)]">
          <AlertCircle className="mr-[5px] h-[16px] w-[16px]" />
          <span>平台所有产品拒绝向未成年人提供服务，仅供娱乐和参考</span>
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
        onSetUnknowhour={(value) => setInfoData((current) => ({ ...current, unknowhour: value }))}
      />

      <BirthPlaceModal
        isOpen={showAddress}
        tabIndex={addressIndex}
        addressData={locationState.addressData}
        isBJTime={Boolean(infoData.bjtime)}
        onClose={() => setShowAddress(false)}
        onTabChange={setAddressIndex}
        onConfirm={({ tabIndex, addressData: nextAddressData, location, isBJTime }) => {
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
