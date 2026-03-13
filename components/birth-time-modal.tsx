'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Lunar, LunarYear, Solar } from 'lunar-javascript';
import PickerWheelColumn, { type PickerWheelOption } from './picker-wheel-column';
import { DI_ZHI, TIAN_GAN } from '@/lib/bazi-constants';
import { formatLunarDay, formatLunarMonth } from '@/lib/birth-entry';
import { getBirthdayParts, padPart } from '@/lib/paipan-form';

interface BirthTimeModalProps {
  isOpen: boolean;
  tabIndex: 0 | 1 | 2;
  birthday: string;
  unknowhour: 0 | 1;
  onClose: () => void;
  onTabChange: (nextTab: 0 | 1 | 2) => void;
  onConfirm: (tabIndex: 0 | 1 | 2, data: string[] | string) => void;
  onSetUnknowhour: (value: 0 | 1) => void;
}

interface SolarState {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

interface LunarState {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

interface PillarState {
  tgList: string[];
  dzList: string[];
}

type PopoverMode = 'tg' | 'dz' | 'date' | null;

const MIN_YEAR = 1801;
const MAX_YEAR = 2099;
const MIN_SOLAR_KEY = 18010213;
const TABS: Array<{ id: 0 | 1 | 2; label: string }> = [
  { id: 0, label: '公历' },
  { id: 1, label: '农历' },
  { id: 2, label: '四柱' },
];
const UNKNOWN = '未知';
const ODD_BRANCHES = DI_ZHI.filter((_, index) => index % 2 === 0);
const EVEN_BRANCHES = DI_ZHI.filter((_, index) => index % 2 === 1);
const UNKNOWN_HOUR_STEM: Record<string, string> = {
  甲: '甲',
  己: '甲',
  乙: '丙',
  庚: '丙',
  丙: '戊',
  辛: '戊',
  丁: '庚',
  壬: '庚',
  戊: '壬',
  癸: '壬',
};

function buildSolarState(birthday: string, unknowhour: 0 | 1): SolarState {
  const { year, month, day, hour, minute } = getBirthdayParts(birthday);

  return {
    year: String(year),
    month: padPart(month),
    day: padPart(day),
    hour: unknowhour ? UNKNOWN : padPart(hour),
    minute: unknowhour ? UNKNOWN : padPart(minute),
  };
}

function buildLunarState(birthday: string, unknowhour: 0 | 1): LunarState {
  const { year, month, day, hour, minute } = getBirthdayParts(birthday);
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();

  return {
    year: String(lunar.getYear()),
    month: String(lunar.getMonth()),
    day: String(lunar.getDay()),
    hour: unknowhour ? UNKNOWN : padPart(hour),
    minute: unknowhour ? UNKNOWN : padPart(minute),
  };
}

function buildPillarState(birthday: string, unknowhour: 0 | 1): PillarState {
  const { year, month, day, hour, minute } = getBirthdayParts(birthday);
  const eightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  const yearPillar = eightChar.getYear();
  const monthPillar = eightChar.getMonth();
  const dayPillar = eightChar.getDay();
  const timePillar = eightChar.getTime();

  return {
    tgList: [yearPillar[0], monthPillar[0], dayPillar[0], unknowhour ? UNKNOWN : timePillar[0]],
    dzList: [yearPillar[1], monthPillar[1], dayPillar[1], unknowhour ? UNKNOWN : timePillar[1]],
  };
}

function buildSolarFromLunar(lunarState: LunarState) {
  const hour = lunarState.hour === UNKNOWN ? 0 : Number(lunarState.hour);
  const minute = lunarState.minute === UNKNOWN ? 0 : Number(lunarState.minute);
  const solar = Lunar.fromYmdHms(
    Number(lunarState.year),
    Number(lunarState.month),
    Number(lunarState.day),
    hour,
    minute,
    0
  ).getSolar();

  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: solar.getHour(),
    minute: solar.getMinute(),
  };
}

function buildLunarMonthOptions(year: number): Array<PickerWheelOption & { dayCount: number }> {
  return LunarYear.fromYear(year)
    .getMonths()
    .filter((month: any) => month.getYear() === year)
    .map((month: any) => ({
      value: String(month.getMonth()),
      label: formatLunarMonth(month.getMonth()),
      dayCount: month.getDayCount(),
    }));
}

function buildBranchOptions(tg: string, allowUnknown: boolean) {
  if (tg === UNKNOWN) {
    return allowUnknown ? [...ODD_BRANCHES, ...EVEN_BRANCHES, UNKNOWN] : [...ODD_BRANCHES, ...EVEN_BRANCHES];
  }

  const stemIndex = TIAN_GAN.findIndex((item) => item === tg);
  const options = stemIndex % 2 === 0 ? [...ODD_BRANCHES] : [...EVEN_BRANCHES];
  if (allowUnknown) {
    options.push(UNKNOWN);
  }
  return options;
}

function formatCandidateDate(solar: any, unknowhour: boolean) {
  const dateLabel = `${solar.getYear()}-${padPart(solar.getMonth())}-${padPart(solar.getDay())}`;

  if (unknowhour) {
    return `${dateLabel} 时辰未知`;
  }

  return `${dateLabel} ${padPart(solar.getHour())}:${padPart(solar.getMinute())}`;
}

function getTodayLunarState() {
  const now = new Date();
  const lunar = Solar.fromYmdHms(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0
  ).getLunar();

  return {
    year: String(lunar.getYear()),
    month: String(lunar.getMonth()),
    day: String(lunar.getDay()),
    hour: padPart(now.getHours()),
    minute: padPart(now.getMinutes()),
  };
}

export default function BirthTimeModal({
  isOpen,
  tabIndex,
  birthday,
  unknowhour,
  onClose,
  onTabChange,
  onConfirm,
  onSetUnknowhour,
}: BirthTimeModalProps) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(tabIndex);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');
  const [solarState, setSolarState] = useState<SolarState>(buildSolarState(birthday, unknowhour));
  const [lunarState, setLunarState] = useState<LunarState>(buildLunarState(birthday, unknowhour));
  const [pillarState, setPillarState] = useState<PillarState>(buildPillarState(birthday, unknowhour));
  const [popoverMode, setPopoverMode] = useState<PopoverMode>(null);
  const [pillarIndex, setPillarIndex] = useState(0);
  const [dateList, setDateList] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveTab(tabIndex);
    setSearchValue('');
    setError('');
    setSolarState(buildSolarState(birthday, unknowhour));
    setLunarState(buildLunarState(birthday, unknowhour));
    setPillarState(buildPillarState(birthday, unknowhour));
    setPopoverMode(null);
    setDateList([]);
  }, [birthday, isOpen, tabIndex, unknowhour]);

  const solarDayCount = useMemo(() => {
    return new Date(Number(solarState.year), Number(solarState.month), 0).getDate();
  }, [solarState.month, solarState.year]);

  const lunarMonthOptions = useMemo(() => buildLunarMonthOptions(Number(lunarState.year)), [lunarState.year]);
  const lunarDayCount = useMemo(() => {
    return lunarMonthOptions.find((option) => option.value === lunarState.month)?.dayCount ?? 29;
  }, [lunarMonthOptions, lunarState.month]);

  useEffect(() => {
    if (Number(solarState.day) > solarDayCount) {
      setSolarState((current) => ({ ...current, day: padPart(solarDayCount) }));
    }
  }, [solarDayCount, solarState.day]);

  useEffect(() => {
    if (Number(lunarState.day) > lunarDayCount) {
      setLunarState((current) => ({ ...current, day: String(lunarDayCount) }));
    }
  }, [lunarDayCount, lunarState.day]);

  const todaySolar = useMemo(() => {
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: padPart(now.getMonth() + 1),
      day: padPart(now.getDate()),
      hour: padPart(now.getHours()),
      minute: padPart(now.getMinutes()),
    };
  }, []);

  const todayLunar = useMemo(() => getTodayLunarState(), []);

  const showToday = useMemo(() => {
    if (activeTab === 2) {
      return false;
    }

    if (activeTab === 0) {
      return JSON.stringify(solarState) !== JSON.stringify(todaySolar);
    }

    return JSON.stringify(lunarState) !== JSON.stringify(todayLunar);
  }, [activeTab, lunarState, solarState, todayLunar, todaySolar]);

  const solarYearOptions = useMemo<PickerWheelOption[]>(
    () =>
      Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => {
        const value = String(MIN_YEAR + index);
        return { value, label: value };
      }),
    []
  );

  const solarMonthOptions = useMemo<PickerWheelOption[]>(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const value = padPart(index + 1);
        return { value, label: value };
      }),
    []
  );

  const solarDayOptions = useMemo<PickerWheelOption[]>(
    () =>
      Array.from({ length: solarDayCount }, (_, index) => {
        const value = padPart(index + 1);
        return { value, label: value };
      }),
    [solarDayCount]
  );

  const hourOptions = useMemo<PickerWheelOption[]>(
    () => [{ value: UNKNOWN, label: UNKNOWN }, ...Array.from({ length: 24 }, (_, index) => {
      const value = padPart(index);
      return { value, label: value };
    })],
    []
  );

  const minuteOptions = useMemo<PickerWheelOption[]>(
    () => [{ value: UNKNOWN, label: UNKNOWN }, ...Array.from({ length: 60 }, (_, index) => {
      const value = padPart(index);
      return { value, label: value };
    })],
    []
  );

  const lunarYearOptions = solarYearOptions;
  const lunarMonthWheelOptions = useMemo<PickerWheelOption[]>(
    () => lunarMonthOptions.map((option) => ({ value: option.value, label: option.label })),
    [lunarMonthOptions]
  );
  const lunarDayOptions = useMemo<PickerWheelOption[]>(
    () =>
      Array.from({ length: lunarDayCount }, (_, index) => {
        const value = String(index + 1);
        return { value, label: formatLunarDay(index + 1) };
      }),
    [lunarDayCount]
  );

  const branchOptions = useMemo(
    () => buildBranchOptions(pillarState.tgList[pillarIndex], pillarIndex === 3),
    [pillarIndex, pillarState.tgList]
  );

  if (!isOpen) {
    return null;
  }

  const syncUnknownFromClock = (hour: string, minute: string) => {
    const nextUnknown = hour === UNKNOWN || minute === UNKNOWN ? 1 : 0;
    onSetUnknowhour(nextUnknown);
  };

  const handleTabChange = (nextTab: 0 | 1 | 2) => {
    setError('');
    setPopoverMode(null);
    setDateList([]);

    if (activeTab === 0 && nextTab === 1) {
      const solar = Solar.fromYmdHms(
        Number(solarState.year),
        Number(solarState.month),
        Number(solarState.day),
        solarState.hour === UNKNOWN ? 0 : Number(solarState.hour),
        solarState.minute === UNKNOWN ? 0 : Number(solarState.minute),
        0
      );
      const lunar = solar.getLunar();
      setLunarState({
        year: String(lunar.getYear()),
        month: String(lunar.getMonth()),
        day: String(lunar.getDay()),
        hour: solarState.hour,
        minute: solarState.minute,
      });
    }

    if (activeTab === 1 && nextTab === 0) {
      try {
        const solar = buildSolarFromLunar(lunarState);
        setSolarState({
          year: String(solar.year),
          month: padPart(solar.month),
          day: padPart(solar.day),
          hour: lunarState.hour,
          minute: lunarState.minute,
        });
      } catch {
        setError('当前农历组合无法转换');
        return;
      }
    }

    setActiveTab(nextTab);
    onTabChange(nextTab);
  };

  const handleToday = () => {
    const now = new Date();

    if (activeTab === 0) {
      const nextState = {
        year: String(now.getFullYear()),
        month: padPart(now.getMonth() + 1),
        day: padPart(now.getDate()),
        hour: padPart(now.getHours()),
        minute: padPart(now.getMinutes()),
      };
      setSolarState(nextState);
      syncUnknownFromClock(nextState.hour, nextState.minute);
      return;
    }

    const lunar = Solar.fromYmdHms(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0
    ).getLunar();
    const nextState = {
      year: String(lunar.getYear()),
      month: String(lunar.getMonth()),
      day: String(lunar.getDay()),
      hour: padPart(now.getHours()),
      minute: padPart(now.getMinutes()),
    };
    setLunarState(nextState);
    syncUnknownFromClock(nextState.hour, nextState.minute);
  };

  const handleSearch = () => {
    if (!/^\d{12}$/.test(searchValue)) {
      setError('请输入正确的日期时间格式');
      return;
    }

    const year = Number(searchValue.slice(0, 4));
    const month = Number(searchValue.slice(4, 6));
    const day = Number(searchValue.slice(6, 8));
    const hour = Number(searchValue.slice(8, 10));
    const minute = Number(searchValue.slice(10, 12));
    const dateKey = Number(`${year}${padPart(month)}${padPart(day)}`);

    if (dateKey < MIN_SOLAR_KEY) {
      setError('日期时间不能小于1801年2月13日');
      return;
    }

    if (year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
      setError('日期时间不能大于2099年12月31日');
      return;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      setError('请输入正确的日期时间格式');
      return;
    }

    setError('');
    setSolarState({
      year: String(year),
      month: padPart(month),
      day: padPart(day),
      hour: padPart(hour),
      minute: padPart(minute),
    });
    onSetUnknowhour(0);
  };

  const handleConfirm = async () => {
    setError('');

    if (activeTab === 0) {
      const dateKey = Number(`${solarState.year}${solarState.month}${solarState.day}`);
      if (dateKey < MIN_SOLAR_KEY) {
        setError('日期时间不能小于1801年2月13日');
        return;
      }

      syncUnknownFromClock(solarState.hour, solarState.minute);
      onConfirm(activeTab, [solarState.year, solarState.month, solarState.day, solarState.hour, solarState.minute]);
      onClose();
      return;
    }

    if (activeTab === 1) {
      try {
        const solar = buildSolarFromLunar(lunarState);
        if (solar.year > MAX_YEAR) {
          setError('日期时间不能大于2099年12月31日');
          return;
        }

        syncUnknownFromClock(lunarState.hour, lunarState.minute);
        const monthLabel = lunarMonthOptions.find((option) => option.value === lunarState.month)?.label ?? formatLunarMonth(Number(lunarState.month));
        const dayLabel = formatLunarDay(Number(lunarState.day));
        onConfirm(activeTab, [lunarState.year, monthLabel, dayLabel, lunarState.hour, lunarState.minute]);
        onClose();
      } catch {
        setError('当前农历组合无法转换');
      }
      return;
    }

    try {
      const sect = window.localStorage.getItem('setting_midnight') === '1' ? 1 : 2;
      const unknowhourSelected = pillarState.tgList[3] === UNKNOWN || pillarState.dzList[3] === UNKNOWN;
      const yearPillar = `${pillarState.tgList[0]}${pillarState.dzList[0]}`;
      const monthPillar = `${pillarState.tgList[1]}${pillarState.dzList[1]}`;
      const dayPillar = `${pillarState.tgList[2]}${pillarState.dzList[2]}`;
      const hourStem = unknowhourSelected ? UNKNOWN_HOUR_STEM[pillarState.tgList[2]] : pillarState.tgList[3];
      const hourBranch = unknowhourSelected ? '子' : pillarState.dzList[3];
      const result = Solar.fromBaZi(yearPillar, monthPillar, dayPillar, `${hourStem}${hourBranch}`, sect, MIN_YEAR);
      const candidates = (Array.isArray(result) ? result : [result])
        .filter(Boolean)
        .filter((item) => item.getYear() >= MIN_YEAR && item.getYear() <= MAX_YEAR)
        .map((item) => formatCandidateDate(item, unknowhourSelected));

      if (!candidates.length) {
        setError('在查找范围内无该八字数据');
        return;
      }

      setDateList(candidates);
      setPopoverMode('date');
    } catch {
      setError('获取四柱数据失败');
    }
  };

  const handlePillarValue = (mode: 'tg' | 'dz', value: string) => {
    if (mode === 'tg') {
      setPillarState((current) => {
        const nextTgList = current.tgList.slice();
        const nextDzList = current.dzList.slice();
        nextTgList[pillarIndex] = value;

        const options = buildBranchOptions(value, pillarIndex === 3);
        if (!options.includes(nextDzList[pillarIndex])) {
          nextDzList[pillarIndex] = options[0];
        }

        const unknownValue = value === UNKNOWN || nextDzList[3] === UNKNOWN ? 1 : 0;
        onSetUnknowhour(unknownValue);
        return { tgList: nextTgList, dzList: nextDzList };
      });
      setPopoverMode('dz');
      return;
    }

    setPillarState((current) => {
      const nextDzList = current.dzList.slice();
      nextDzList[pillarIndex] = value;
      const unknownValue = value === UNKNOWN || current.tgList[3] === UNKNOWN ? 1 : 0;
      onSetUnknowhour(unknownValue);
      return { ...current, dzList: nextDzList };
    });
    setPopoverMode(null);
  };

  const currentPreview = (() => {
    if (activeTab === 0) {
      return `${solarState.year}年${solarState.month}月${solarState.day}日 ${solarState.hour === UNKNOWN ? '未知时辰' : `${solarState.hour}:${solarState.minute}`}`;
    }

    if (activeTab === 1) {
      const monthLabel = lunarMonthOptions.find((option) => option.value === lunarState.month)?.label ?? formatLunarMonth(Number(lunarState.month));
      return `${lunarState.year}年${monthLabel}${formatLunarDay(Number(lunarState.day))} ${lunarState.hour === UNKNOWN ? '未知时辰' : `${lunarState.hour}:${lunarState.minute}`}`;
    }

    return `${pillarState.tgList[0]}${pillarState.dzList[0]} ${pillarState.tgList[1]}${pillarState.dzList[1]} ${pillarState.tgList[2]}${pillarState.dzList[2]} ${pillarState.tgList[3]}${pillarState.dzList[3]}`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="relative flex h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-[390px] rounded-[20px] bg-white p-[17px] text-[#101010]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative mb-[15px] flex items-center justify-center">
            <button type="button" onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#7b7b7b]">
              <X className="h-4 w-4" />
            </button>

            <div className="flex overflow-hidden rounded-full border border-[rgba(221,221,221,1)] text-[15px]">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`h-[34px] w-[75px] ${
                    activeTab === item.id ? 'bg-[#b2955d] text-white' : 'text-[#444444]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {showToday ? (
              <button
                type="button"
                onClick={handleToday}
                className="absolute left-0 top-1/2 flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(187,187,187,0.5)] text-[14px] text-[#666666]"
              >
                今
              </button>
            ) : null}
          </div>

          {activeTab === 0 ? (
            <div className="relative flex items-center gap-2">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="输入出生年月日时分(格式199303270255)"
                className="h-[36px] flex-1 rounded-full border border-[rgba(187,187,187,0.5)] px-4 text-[14px] outline-none placeholder:text-[#9e9e9e]"
              />
              <button
                type="button"
                onClick={handleSearch}
                className={`h-[36px] rounded-full px-4 text-[14px] ${
                  searchValue ? 'bg-[#b2955d] text-white' : 'bg-[#ededed] text-[#9e9e9e]'
                }`}
              >
                确定
              </button>
            </div>
          ) : null}

          <div className="mt-[13px] w-full">
            <div className="flex h-[40px] items-center justify-around border-t border-[rgba(233,233,233,0.6)] text-[14px] text-[#666666]">
              {(activeTab === 2 ? ['年柱', '月柱', '日柱', '时柱'] : ['年', '月', '日', '时', '分']).map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>

            {activeTab === 2 ? (
              <div className="relative pt-4">
                <div className="grid grid-cols-4 gap-3">
                  {pillarState.tgList.map((item, index) => (
                    <button
                      key={`tg-${index}`}
                      type="button"
                      onClick={() => {
                        setPillarIndex(index);
                        setPopoverMode('tg');
                      }}
                      className={`flex h-[64px] items-center justify-center rounded-full text-[28px] ${
                        item === UNKNOWN ? 'bg-[#f1f1f1] text-[#8d8d8d]' : 'bg-[#b2955d] text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {pillarState.dzList.map((item, index) => (
                    <button
                      key={`dz-${index}`}
                      type="button"
                      onClick={() => {
                        setPillarIndex(index);
                        setPopoverMode('dz');
                      }}
                      className={`flex h-[64px] items-center justify-center rounded-full text-[28px] ${
                        item === UNKNOWN ? 'bg-[#f1f1f1] text-[#8d8d8d]' : 'bg-[#d1b786] text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-[12px] text-[#8d8d8d]">查找范围：1801-2099年</div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1">
                <PickerWheelColumn label="年" options={activeTab === 0 ? solarYearOptions : lunarYearOptions} value={activeTab === 0 ? solarState.year : lunarState.year} onChange={(value) => {
                  if (activeTab === 0) {
                    setSolarState((current) => ({ ...current, year: value }));
                    return;
                  }
                  setLunarState((current) => ({ ...current, year: value }));
                }} />
                <PickerWheelColumn label="月" options={activeTab === 0 ? solarMonthOptions : lunarMonthWheelOptions} value={activeTab === 0 ? solarState.month : lunarState.month} onChange={(value) => {
                  if (activeTab === 0) {
                    setSolarState((current) => ({ ...current, month: value }));
                    return;
                  }
                  setLunarState((current) => ({ ...current, month: value }));
                }} />
                <PickerWheelColumn label="日" options={activeTab === 0 ? solarDayOptions : lunarDayOptions} value={activeTab === 0 ? solarState.day : lunarState.day} onChange={(value) => {
                  if (activeTab === 0) {
                    setSolarState((current) => ({ ...current, day: value }));
                    return;
                  }
                  setLunarState((current) => ({ ...current, day: value }));
                }} />
                <PickerWheelColumn label="时" options={hourOptions} value={activeTab === 0 ? solarState.hour : lunarState.hour} onChange={(value) => {
                  if (activeTab === 0) {
                    setSolarState((current) => {
                      const nextMinute = value === UNKNOWN ? UNKNOWN : current.minute === UNKNOWN ? '00' : current.minute;
                      syncUnknownFromClock(value, nextMinute);
                      return { ...current, hour: value, minute: nextMinute };
                    });
                    return;
                  }
                  setLunarState((current) => {
                    const nextMinute = value === UNKNOWN ? UNKNOWN : current.minute === UNKNOWN ? '00' : current.minute;
                    syncUnknownFromClock(value, nextMinute);
                    return { ...current, hour: value, minute: nextMinute };
                  });
                }} />
                <PickerWheelColumn label="分" options={minuteOptions} value={activeTab === 0 ? solarState.minute : lunarState.minute} onChange={(value) => {
                  if (activeTab === 0) {
                    setSolarState((current) => {
                      const nextHour = value === UNKNOWN ? UNKNOWN : current.hour === UNKNOWN ? '00' : current.hour;
                      syncUnknownFromClock(nextHour, value);
                      return { ...current, hour: nextHour, minute: value };
                    });
                    return;
                  }
                  setLunarState((current) => {
                    const nextHour = value === UNKNOWN ? UNKNOWN : current.hour === UNKNOWN ? '00' : current.hour;
                    syncUnknownFromClock(nextHour, value);
                    return { ...current, hour: nextHour, minute: value };
                  });
                }} />
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[10px] bg-[rgba(245,245,245,0.72)] px-4 py-3 text-[13px] text-[#666666]">
            当前预览：<span className="font-medium text-[#101010]">{currentPreview}</span>
          </div>

          {error ? (
            <div className="mt-3 rounded-[10px] border border-[#f1c5c5] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#c24545]">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleConfirm}
            className="mt-[18px] flex h-[54px] w-full items-center justify-center rounded-full bg-[#101010] font-serif text-[18px] font-bold text-[#f7d3a1]"
          >
            确定
          </button>

          {popoverMode ? (
            <div className="absolute inset-x-4 bottom-[82px] z-20 rounded-[16px] border border-[rgba(178,149,93,0.18)] bg-white p-4 shadow-[0_18px_40px_rgba(16,16,16,0.12)]">
              {popoverMode === 'date' ? (
                <div className="max-h-[220px] space-y-2 overflow-y-auto">
                  {dateList.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onConfirm(2, item);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-[10px] bg-[#faf7f0] px-4 py-3 text-left text-[14px] text-[#444444]"
                    >
                      <span>公历：{item}</span>
                      <span>{'>'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {(popoverMode === 'tg' ? [...TIAN_GAN, ...(pillarIndex === 3 ? [UNKNOWN] : [])] : branchOptions).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePillarValue(popoverMode, item)}
                      className="flex h-[40px] items-center justify-center rounded-[10px] bg-[#faf7f0] text-[16px] text-[#444444]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
