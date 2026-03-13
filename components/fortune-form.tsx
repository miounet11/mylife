'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import FortuneProgress from './fortune-progress';
import BirthPlaceModal from './birth-place-modal';
import BirthTimeModal from './birth-time-modal';
import InstantPaipanCard from './instant-paipan-card';
import { clearAnalyzeDraft, readAnalyzeDraft } from '@/lib/analyze-draft';
import { LUNAR_DAY_NAMES, LUNAR_MONTH_NAMES } from '@/lib/birth-entry';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { type LocationOption } from '@/lib/location-engine';
import {
  DEFAULT_CASE_TYPES,
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

export default function FortuneForm() {
  const router = useRouter();
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
  const [error, setError] = useState('');

  useEffect(() => {
    const midnightValue = window.localStorage.getItem(SETTING_MIDNIGHT_KEY) === '1' ? 1 : 0;
    setSetTimeInfo(createSetTimeInfo(midnightValue));
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

  const submitPayload = async (payload: PaipanInfoData, payloadLocation: FormLocationState) => {
    setLoading(true);
    setError('');

    const displayName = payload.username.trim() || createCaseName();
    const [birthDate, birthTime] = payload.birthday.split(' ');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          gender: payload.sex === 1 ? 'male' : 'female',
          birthDate,
          birthTime,
          birthSecond: 0,
          birthPlace: normalizeBirthPlaceLabel(payloadLocation.addressData),
          timezone: payload.hw && payload.bjtime ? 8 : payloadLocation.timezone,
          longitude: payloadLocation.longitude,
          latitude: payloadLocation.latitude ?? (UNKNOWN_LOCATION.latitude as number),
          cityNameEn: payloadLocation.option?.nameEn || payloadLocation.option?.city || payloadLocation.addressData[1] || payloadLocation.addressData[0],
          useDaylightSaving: Boolean(payload.xls),
          useSolarTime: Boolean(setTimeInfo[1].value),
          useSeparateZiHour: Boolean(setTimeInfo[2].value),
          unknowhour: payload.unknowhour,
          xls: payload.xls,
          bjtime: payload.bjtime,
          hw: payload.hw,
          typeId: payload.typeId,
          isSave: payload.isSave,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || '分析请求失败，请稍后再试');
        setLoading(false);
        return;
      }

      router.push(`/result/${result.reportId}`);
    } catch {
      setError('网络连接异常，请稍后重试');
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitPayload(infoData, locationState);
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
    return <FortuneProgress isComplete={false} />;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[681px]">
        <div className="rounded-[30px] bg-white px-5 py-7 shadow-[0_18px_50px_rgba(16,16,16,0.08)] md:px-[56px] md:py-[52px]">
          <div className="space-y-[22px]">
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

            <button
              type="submit"
              className="flex h-[63px] w-full items-center justify-center rounded-full bg-black font-serif text-[18px] font-bold text-[#f7d3a1]"
            >
              开始排盘
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
