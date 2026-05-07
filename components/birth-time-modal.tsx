'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

interface TodaySnapshot {
  solar: SolarState;
  lunar: LunarState;
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

function buildTodaySnapshot(): TodaySnapshot {
  const now = new Date();
  const lunar = Solar.fromYmdHms(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0
  ).getLunar();
  const clock = {
    hour: padPart(now.getHours()),
    minute: padPart(now.getMinutes()),
  };

  return {
    solar: {
      year: String(now.getFullYear()),
      month: padPart(now.getMonth() + 1),
      day: padPart(now.getDate()),
      ...clock,
    },
    lunar: {
      year: String(lunar.getYear()),
      month: String(lunar.getMonth()),
      day: String(lunar.getDay()),
      ...clock,
    },
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
  const [todaySnapshot, setTodaySnapshot] = useState<TodaySnapshot | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const syncSnapshotRef = useRef({
    birthday,
    tabIndex,
  });

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const openedNow = !wasOpenRef.current;
    const sourceChanged =
      syncSnapshotRef.current.birthday !== birthday ||
      syncSnapshotRef.current.tabIndex !== tabIndex;

    if (!openedNow && !sourceChanged) {
      return;
    }

    wasOpenRef.current = true;
    syncSnapshotRef.current = {
      birthday,
      tabIndex,
    };

    setActiveTab(tabIndex);
    setSearchValue('');
    setError('');
    setSolarState(buildSolarState(birthday, unknowhour));
    setLunarState(buildLunarState(birthday, unknowhour));
    setPillarState(buildPillarState(birthday, unknowhour));
    setPopoverMode(null);
    setDateList([]);
    setTodaySnapshot(buildTodaySnapshot());
    setManualOpen(false);
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

  const showToday = useMemo(() => {
    if (!todaySnapshot || activeTab === 2) {
      return false;
    }

    if (activeTab === 0) {
      return JSON.stringify(solarState) !== JSON.stringify(todaySnapshot.solar);
    }

    return JSON.stringify(lunarState) !== JSON.stringify(todaySnapshot.lunar);
  }, [activeTab, lunarState, solarState, todaySnapshot]);

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
    () => Array.from({ length: 24 }, (_, index) => {
      const value = padPart(index);
      return { value, label: value };
    }),
    []
  );

  const minuteOptions = useMemo<PickerWheelOption[]>(
    () => Array.from({ length: 60 }, (_, index) => {
      const value = padPart(index);
      return { value, label: value };
    }),
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
    () => buildBranchOptions(pillarState.tgList[pillarIndex], false),
    [pillarIndex, pillarState.tgList]
  );

  if (!isOpen) {
    return null;
  }

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
    const snapshot = buildTodaySnapshot();
    setTodaySnapshot(snapshot);

    if (activeTab === 0) {
      setSolarState(snapshot.solar);
      return;
    }

    setLunarState(snapshot.lunar);
  };

  const unknownTimeSelected = (() => {
    if (activeTab === 0) {
      return solarState.hour === UNKNOWN || solarState.minute === UNKNOWN;
    }

    if (activeTab === 1) {
      return lunarState.hour === UNKNOWN || lunarState.minute === UNKNOWN;
    }

    return pillarState.tgList[3] === UNKNOWN || pillarState.dzList[3] === UNKNOWN;
  })();

  const handleUnknownTimeChange = (nextValue: boolean) => {
    if (activeTab === 0) {
      setSolarState((current) => ({
        ...current,
        hour: nextValue ? UNKNOWN : current.hour === UNKNOWN ? '00' : current.hour,
        minute: nextValue ? UNKNOWN : current.minute === UNKNOWN ? '00' : current.minute,
      }));
      return;
    }

    if (activeTab === 1) {
      setLunarState((current) => ({
        ...current,
        hour: nextValue ? UNKNOWN : current.hour === UNKNOWN ? '00' : current.hour,
        minute: nextValue ? UNKNOWN : current.minute === UNKNOWN ? '00' : current.minute,
      }));
      return;
    }

    setPillarState((current) => {
      const nextTgList = current.tgList.slice();
      const nextDzList = current.dzList.slice();
      nextTgList[3] = nextValue ? UNKNOWN : UNKNOWN_HOUR_STEM[nextTgList[2]] || '甲';
      nextDzList[3] = nextValue ? UNKNOWN : '子';
      return { tgList: nextTgList, dzList: nextDzList };
    });
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
  };

  const handleConfirm = async () => {
    setError('');

    if (activeTab === 0) {
      const dateKey = Number(`${solarState.year}${solarState.month}${solarState.day}`);
      if (dateKey < MIN_SOLAR_KEY) {
        setError('日期时间不能小于1801年2月13日');
        return;
      }

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

        return { tgList: nextTgList, dzList: nextDzList };
      });
      setPopoverMode('dz');
      return;
    }

    setPillarState((current) => {
      const nextDzList = current.dzList.slice();
      nextDzList[pillarIndex] = value;
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

    const timePillar = pillarState.tgList[3] === UNKNOWN || pillarState.dzList[3] === UNKNOWN
      ? '时辰未知'
      : `${pillarState.tgList[3]}${pillarState.dzList[3]}`;
    return `${pillarState.tgList[0]}${pillarState.dzList[0]} ${pillarState.tgList[1]}${pillarState.dzList[1]} ${pillarState.tgList[2]}${pillarState.dzList[2]} ${timePillar}`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose}>
      <div className="relative flex min-h-full items-end justify-center sm:items-center sm:p-4">
        <div
          className="relative flex max-h-[78vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--ink)] shadow-[0_24px_60px_rgba(34,26,18,0.16)] sm:max-w-[480px] sm:rounded-[24px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-[color:var(--line)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-bold text-[color:var(--ink)]">出生时间</div>
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-full border border-[color:var(--line)] bg-white/84 p-1 text-[14px] font-semibold">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`h-9 rounded-full transition ${
                    activeTab === item.id ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--muted)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-3 py-2.5">
              <div className="text-xs font-semibold text-[color:var(--accent-strong)]">
                默认滚轮选择，确认后回填主表单
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 0 ? (
                  <button
                    type="button"
                    onClick={() => setManualOpen((current) => !current)}
                    className="rounded-full bg-white/82 px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)]"
                  >
                    手动输入
                  </button>
                ) : null}
                <details className="group relative">
                  <summary className="cursor-pointer list-none rounded-full bg-white/82 px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)]">
                    录入说明
                  </summary>
                  <div className="absolute right-0 top-9 z-30 w-[260px] rounded-[var(--radius)] border border-[color:var(--line)] bg-white p-3 text-xs leading-5 text-[color:var(--muted)] shadow-[0_14px_34px_rgba(24,41,35,0.12)]">
                    支持公历、农历和四柱。暂不知道具体时间时，开启“时间不确定”即可。
                  </div>
                </details>
              </div>
            </div>

            {activeTab === 0 && manualOpen ? (
              <div className="mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-[color:var(--line)] bg-white/86 p-2">
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  inputMode="numeric"
                  placeholder="199303270255"
                  className="h-10 flex-1 rounded-lg bg-transparent px-2 text-[15px] outline-none placeholder:text-[color:var(--muted)] placeholder:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className={`h-10 rounded-lg px-4 text-sm font-semibold ${
                    searchValue ? 'bg-[color:var(--accent)] text-white' : 'bg-[color:var(--accent-soft)] text-[color:var(--muted)]'
                  }`}
                >
                  应用
                </button>
              </div>
            ) : null}

            {showToday ? (
              <button
                type="button"
                onClick={handleToday}
                className="mt-3 rounded-full border border-[color:var(--line)] bg-white/86 px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)]"
              >
                使用当前时间
              </button>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[color:var(--line)] bg-white/78 px-3 py-2.5">
              <div>
                <div className="text-sm font-semibold text-[color:var(--ink)]">时间不确定</div>
                <div className="mt-0.5 text-xs text-[color:var(--muted)]">
                  不知道具体时分时开启
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnknownTimeChange(!unknownTimeSelected)}
                className={`relative h-7 w-12 rounded-full transition ${
                  unknownTimeSelected ? 'bg-[color:var(--accent)]' : 'bg-[#d8ded8]'
                }`}
                aria-pressed={unknownTimeSelected}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    unknownTimeSelected ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {activeTab === 2 ? (
              <div className="relative mt-4">
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-[color:var(--muted)]">
                  {['年柱', '月柱', '日柱', '时柱'].map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {pillarState.tgList.map((item, index) => (
                    <button
                      key={`tg-${index}`}
                      type="button"
                      onClick={() => {
                        setPillarIndex(index);
                        setPopoverMode('tg');
                      }}
                      className={`flex h-[54px] items-center justify-center rounded-[var(--radius)] text-[24px] font-bold ${
                        item === UNKNOWN ? 'bg-[color:var(--accent-soft)] text-[color:var(--muted)]' : 'bg-[color:var(--accent)] text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {pillarState.dzList.map((item, index) => (
                    <button
                      key={`dz-${index}`}
                      type="button"
                      onClick={() => {
                        setPillarIndex(index);
                        setPopoverMode('dz');
                      }}
                      className={`flex h-[54px] items-center justify-center rounded-[var(--radius)] text-[24px] font-bold ${
                        item === UNKNOWN ? 'bg-[color:var(--accent-soft)] text-[color:var(--muted)]' : 'bg-[color:var(--warm)] text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-[12px] text-[color:var(--muted)]">查找范围：1801-2099年</div>
              </div>
            ) : (
              <div className="mt-4">
                <div className={`grid gap-0 text-center text-xs font-semibold text-[color:var(--muted)] ${unknownTimeSelected ? 'grid-cols-3' : 'grid-cols-5'}`}>
                  {(unknownTimeSelected ? ['年', '月', '日'] : ['年', '月', '日', '时', '分']).map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
                <div className="relative mt-1 rounded-[var(--radius)] border border-[color:var(--line)] bg-white/82 px-1">
                  <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-[46px] -translate-y-1/2 rounded-lg bg-[color:var(--accent-soft)]" />
                  <div className={`relative z-20 grid gap-0 ${unknownTimeSelected ? 'grid-cols-3' : 'grid-cols-5'}`}>
                    <PickerWheelColumn compact hideLabel showHighlight={false} label="年" options={activeTab === 0 ? solarYearOptions : lunarYearOptions} value={activeTab === 0 ? solarState.year : lunarState.year} onChange={(value) => {
                      if (activeTab === 0) {
                        setSolarState((current) => ({ ...current, year: value }));
                        return;
                      }
                      setLunarState((current) => ({ ...current, year: value }));
                    }} />
                    <PickerWheelColumn compact hideLabel showHighlight={false} label="月" options={activeTab === 0 ? solarMonthOptions : lunarMonthWheelOptions} value={activeTab === 0 ? solarState.month : lunarState.month} onChange={(value) => {
                      if (activeTab === 0) {
                        setSolarState((current) => ({ ...current, month: value }));
                        return;
                      }
                      setLunarState((current) => ({ ...current, month: value }));
                    }} />
                    <PickerWheelColumn compact hideLabel showHighlight={false} label="日" options={activeTab === 0 ? solarDayOptions : lunarDayOptions} value={activeTab === 0 ? solarState.day : lunarState.day} onChange={(value) => {
                      if (activeTab === 0) {
                        setSolarState((current) => ({ ...current, day: value }));
                        return;
                      }
                      setLunarState((current) => ({ ...current, day: value }));
                    }} />
                    {unknownTimeSelected ? null : (
                      <>
                        <PickerWheelColumn compact hideLabel showHighlight={false} label="时" options={hourOptions} value={activeTab === 0 ? solarState.hour : lunarState.hour} onChange={(value) => {
                          if (activeTab === 0) {
                            setSolarState((current) => ({ ...current, hour: value, minute: current.minute === UNKNOWN ? '00' : current.minute }));
                            return;
                          }
                          setLunarState((current) => ({ ...current, hour: value, minute: current.minute === UNKNOWN ? '00' : current.minute }));
                        }} />
                        <PickerWheelColumn compact hideLabel showHighlight={false} label="分" options={minuteOptions} value={activeTab === 0 ? solarState.minute : lunarState.minute} onChange={(value) => {
                          if (activeTab === 0) {
                            setSolarState((current) => ({ ...current, hour: current.hour === UNKNOWN ? '00' : current.hour, minute: value }));
                            return;
                          }
                          setLunarState((current) => ({ ...current, hour: current.hour === UNKNOWN ? '00' : current.hour, minute: value }));
                        }} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-[color:var(--line)] bg-white/92 px-4 py-3">
            {error ? (
              <div className="mb-2 rounded-lg border border-[#f1c5c5] bg-[#fff4f4] px-3 py-2 text-[13px] text-[#c24545]">
                {error}
              </div>
            ) : null}
            <div className="mb-3 rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-3 py-2 text-[13px] text-[color:var(--muted)]">
              当前预览：<span className="font-semibold text-[color:var(--ink)]">{currentPreview}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--ink)] text-[16px] font-bold text-white shadow-[0_12px_26px_rgba(34,26,18,0.14)]"
            >
              确认出生时间
            </button>
          </div>

          {popoverMode ? (
            <div className="absolute inset-x-4 bottom-[104px] z-20 rounded-[16px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 shadow-[0_18px_40px_rgba(34,26,18,0.14)]">
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
                  {(popoverMode === 'tg' ? TIAN_GAN : branchOptions).map((item) => (
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
