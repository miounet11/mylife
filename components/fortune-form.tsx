'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import FortuneProgress from './fortune-progress';
import BirthDateInput from './birth-date-input';
import BirthTimeInput from './birth-time-input';
import CitySelector from './city-selector';
import { type LocationOption } from '@/lib/location-engine';
import { getShichenOption } from '@/lib/shichen';
import { calculateTrueSolarTime, formatSolarTime } from '@/lib/solar-time';

function formatPart(value: number) {
  return String(value).padStart(2, '0');
}

function formatSignedMinutes(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} 分钟`;
}

function formatDateString(year: number, month: number, day: number) {
  return `${year}-${formatPart(month)}-${formatPart(day)}`;
}

export default function FortuneForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [city, setCity] = useState<LocationOption | null>(null);
  const [year, setYear] = useState<number>(1998);
  const [month, setMonth] = useState<number>(8);
  const [day, setDay] = useState<number>(8);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [second, setSecond] = useState<number>(0);
  const [isDateValid, setIsDateValid] = useState(true);
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const basicRef = useRef<HTMLDivElement>(null);
  const birthRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const solarTime = useMemo(() => {
    if (!city || !isDateValid || !isTimeValid) return null;
    return calculateTrueSolarTime(year, month, day, hour, minute, second, city.lng, city.tz);
  }, [city, day, hour, isDateValid, isTimeValid, minute, month, second, year]);

  const completion = useMemo(() => {
    const steps = [!!name.trim(), !!gender, !!city, isDateValid, isTimeValid];
    return steps.filter(Boolean).length;
  }, [city, gender, isDateValid, isTimeValid, name]);

  const completionPercent = Math.round((completion / 5) * 100);
  const inputDate = formatDateString(year, month, day);
  const inputTime = `${formatPart(hour)}:${formatPart(minute)}:${formatPart(second)}`;
  const correctedDate = solarTime
    ? formatDateString(solarTime.year, solarTime.month, solarTime.day)
    : inputDate;
  const correctedTime = solarTime ? formatSolarTime(solarTime) : inputTime;

  const clockShichen = getShichenOption(hour);
  const correctedShichen = getShichenOption(solarTime ? solarTime.hour : hour);
  const shichenChanged = clockShichen.name !== correctedShichen.name;
  const dateChanged = correctedDate !== inputDate;
  const canSubmit = !!name.trim() && !!city && isDateValid && isTimeValid;
  const basicReady = !!name.trim();
  const birthReady = !!city && isDateValid && isTimeValid;
  const currentStep = !basicReady ? 1 : !birthReady ? 2 : 3;
  const [focusedStep, setFocusedStep] = useState<number>(1);
  const nextAction = !name.trim()
    ? '先填写姓名或昵称'
    : !city
      ? '先选择出生地点'
      : !isDateValid
        ? '先确认出生日期'
        : !isTimeValid
          ? '先确认出生时间'
          : '信息已完整，可以开始测算';
  const basicSummary = name.trim() ? `${name.trim()} · ${gender === 'male' ? '乾造' : '坤造'}` : '待填写姓名';
  const birthSummary = city
    ? `${city.displayName} · ${inputDate} · ${inputTime}`
    : '待填写出生地点与时间';
  const reviewSummary = solarTime
    ? `${correctedDate} ${correctedTime} · ${correctedShichen.label}`
    : '待生成真太阳时预览';

  useEffect(() => {
    setFocusedStep((prev) => (prev < currentStep ? currentStep : prev));
  }, [currentStep]);

  const stepButtons = [
    { step: 1, label: '基本信息', status: basicReady ? '已完成' : currentStep === 1 ? '进行中' : '待填写', ref: basicRef },
    { step: 2, label: '出生信息', status: birthReady ? '已完成' : currentStep === 2 ? '进行中' : '待填写', ref: birthRef },
    { step: 3, label: '核对测算', status: canSubmit ? '可提交' : currentStep === 3 ? '进行中' : '待填写', ref: reviewRef },
  ] as const;

  const scrollToStep = (step: number) => {
    setFocusedStep(step);
    const target = step === 1 ? basicRef.current : step === 2 ? birthRef.current : reviewRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('请先填写姓名或昵称');
      return;
    }

    if (!city) {
      setError('请先选择出生地点');
      return;
    }

    if (!isDateValid) {
      setError('请先确认出生日期');
      return;
    }

    if (!isTimeValid) {
      setError('请先确认出生时间');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          birthDate: inputDate,
          birthTime: `${formatPart(hour)}:${formatPart(minute)}`,
          birthSecond: second,
          birthPlace: city.fullName,
          timezone: city.tz,
          longitude: city.lng,
          latitude: city.lat,
          cityNameEn: city.nameEn || city.city || city.displayName,
          useSolarTime: true,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setError(result.error || '分析请求失败，请重试');
        setLoading(false);
        return;
      }

      router.push(`/result/${result.reportId}`);
    } catch {
      setError('网络连接异常，请稍后重试');
      setLoading(false);
    }
  };

  if (loading) {
    return <FortuneProgress isComplete={false} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="hidden md:block">
        <div className="glass-panel rounded-[1.5rem] p-3">
          <div className="grid gap-2 md:grid-cols-3">
            {stepButtons.map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => scrollToStep(item.step)}
                className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
                  focusedStep === item.step
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                    : 'border-[color:var(--line)] bg-white/75'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Step {item.step}
                </div>
                <div className="mt-1 font-semibold text-[color:var(--ink)]">{item.label}</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">{item.status}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="soft-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">填写完成度</div>
            <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">{completionPercent}%</div>
          </div>
          <div className="flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--warm))] transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              已完成 {completion}/5 个关键项。地点、日期、时间越准确，时柱判断越稳定。
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.35rem] bg-[rgba(15,118,110,0.08)] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">下一步</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{nextAction}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatusBadge label="姓名" ready={!!name.trim()} />
            <StatusBadge label="地点" ready={!!city} />
            <StatusBadge label="时间" ready={isDateValid && isTimeValid} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <SummaryChip label="昵称" value={name.trim() || '未填'} />
          <SummaryChip label="地点" value={city?.displayName || '未选'} />
          <SummaryChip label="日期" value={inputDate} />
          <SummaryChip label="时间" value={inputTime} />
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.12fr)_22rem] 2xl:items-start">
        <div className="space-y-5">
          <section ref={basicRef} className="soft-card rounded-[1.75rem] p-5 md:p-6">
            <button
              type="button"
              onClick={() => setFocusedStep(1)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Step 1</div>
                  <h2 className="text-lg font-bold text-[color:var(--ink)]">基本信息</h2>
                  <p className="text-sm text-[color:var(--muted)]">先确定身份和排盘路径，减少后续反复修改。</p>
                </div>
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
                <div className="truncate text-sm text-[color:var(--muted)]">{basicSummary}</div>
                <ChevronRight className={`h-4 w-4 text-[color:var(--muted)] transition ${focusedStep === 1 ? 'rotate-90' : ''}`} />
              </div>
            </button>

            <div className="mt-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-[color:var(--muted)] md:hidden">
              {basicSummary}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[color:var(--ink)]">姓名或昵称</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例如：李明、Mia"
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
                />
              </label>

              <div className="md:col-span-2">
                <div className="mb-2 text-sm font-semibold text-[color:var(--ink)]">性别</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      gender === 'male'
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : 'border-[color:var(--line)] bg-white'
                    }`}
                  >
                    <div className="font-semibold text-[color:var(--ink)]">乾造</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">男性排盘路径</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      gender === 'female'
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : 'border-[color:var(--line)] bg-white'
                    }`}
                  >
                    <div className="font-semibold text-[color:var(--ink)]">坤造</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">女性排盘路径</div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section ref={birthRef} className="soft-card rounded-[1.75rem] p-5 md:p-6">
            <button
              type="button"
              onClick={() => setFocusedStep(2)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(201,125,58,0.14)] text-[color:var(--warm)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Step 2</div>
                  <h2 className="text-lg font-bold text-[color:var(--ink)]">出生地点与时间</h2>
                  <p className="text-sm text-[color:var(--muted)]">地点用于真太阳时修正，时间用于定位时柱，这是最关键的一步。</p>
                </div>
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
                <div className="truncate text-sm text-[color:var(--muted)]">{birthSummary}</div>
                <ChevronRight className={`h-4 w-4 text-[color:var(--muted)] transition ${focusedStep === 2 ? 'rotate-90' : ''}`} />
              </div>
            </button>

            <div className="mt-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-[color:var(--muted)] md:hidden">
              {birthSummary}
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[color:var(--ink)]">出生地点</span>
                <CitySelector value={city} onSelect={setCity} />
              </label>

              <div className="grid gap-5 2xl:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[color:var(--ink)]">出生日期</span>
                  <BirthDateInput
                    value={{ year, month, day }}
                    onChange={(nextValue) => {
                      setYear(nextValue.year);
                      setMonth(nextValue.month);
                      setDay(nextValue.day);
                    }}
                    onValidityChange={setIsDateValid}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[color:var(--ink)]">钟表时间</span>
                  <BirthTimeInput
                    value={{ hour, minute, second }}
                    onChange={(nextValue) => {
                      setHour(nextValue.hour);
                      setMinute(nextValue.minute);
                      setSecond(nextValue.second);
                    }}
                    onValidityChange={setIsTimeValid}
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section ref={reviewRef} className="glass-panel rounded-[1.75rem] p-5 md:p-6">
            <button
              type="button"
              onClick={() => setFocusedStep(3)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Step 3</div>
                  <h2 className="text-lg font-bold text-[color:var(--ink)]">真太阳时预览</h2>
                  <p className="text-sm text-[color:var(--muted)]">提交前先确认系统最终采用的排盘时间，避免“我以为”和“系统实际”不一致。</p>
                </div>
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
                <div className="truncate text-sm text-[color:var(--muted)]">{reviewSummary}</div>
                <ChevronRight className={`h-4 w-4 text-[color:var(--muted)] transition ${focusedStep === 3 ? 'rotate-90' : ''}`} />
              </div>
            </button>

            <div className="mt-3 rounded-[1.2rem] bg-white/70 px-4 py-3 text-sm text-[color:var(--muted)] md:hidden">
              {reviewSummary}
            </div>

            {city && solarTime ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] bg-white/85 p-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{city.displayName}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    {city.fullName}
                  </div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    {city.nameEn || city.displayName} · {city.country}
                    {city.province ? ` · ${city.province}` : ''} · 经度 {city.lng.toFixed(2)}° · UTC
                    {city.tz >= 0 ? '+' : ''}
                    {city.tz}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                    <MetricBadge label="总修正" value={formatSignedMinutes(solarTime.correctionMinutes)} />
                    <MetricBadge label="经度修正" value={formatSignedMinutes(solarTime.longitudeOffset)} />
                    <MetricBadge label="均时差" value={formatSignedMinutes(solarTime.equationOfTime)} />
                    <MetricBadge label="时柱判断" value={shichenChanged ? '发生变化' : '保持不变'} highlight={shichenChanged} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <DataRow icon={CalendarDays} label="你输入的日期" value={inputDate} />
                  <DataRow icon={Clock3} label="你输入的时间" value={inputTime} />
                  <DataRow icon={Sparkles} label="系统校正后日期" value={correctedDate} strong />
                  <DataRow icon={CheckCircle2} label="系统校正后时间" value={correctedTime} strong />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InsightCard
                    title="校正前时辰"
                    value={`${clockShichen.label} · ${clockShichen.alias}`}
                    description={clockShichen.range}
                  />
                  <InsightCard
                    title="校正后时辰"
                    value={`${correctedShichen.label} · ${correctedShichen.alias}`}
                    description={correctedShichen.range}
                    emphasize={shichenChanged}
                  />
                </div>

                <div className="rounded-[1.5rem] bg-[color:var(--accent-soft)] px-4 py-4 text-sm leading-7 text-[color:var(--accent-strong)]">
                  {solarTime.description}。系统最终将按 <strong>{correctedShichen.label}</strong> 排时柱。
                  {shichenChanged ? ' 这次修正已跨时辰，结果会和单纯按钟表时间排盘不同。' : ' 这次修正未跨时辰，但仍会作为最终排盘依据。'}
                  {dateChanged ? ' 同时修正后日期发生变化，跨日信息也已自动处理。' : ''}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  信息已核对，开始真正测算
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-white/70 px-5 py-6 text-sm leading-7 text-[color:var(--muted)]">
                先选出生城市并确认日期、时间。系统会立刻告诉用户修正了多少分钟、是否跨时辰、最终采用哪一个时柱。
              </div>
            )}
          </section>

          <section className="soft-card rounded-[1.75rem] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(14,165,233,0.14)] text-sky-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[color:var(--ink)]">提交前说明</h2>
                <p className="text-sm text-[color:var(--muted)]">让用户知道接下来会发生什么。</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                '生成四柱、五行、十神与格局判断。',
                '用当前大运与流年解释近期关键趋势。',
                '自动跳转到报告页，并可继续进入 AI 咨询。',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--accent)]" />
                  <span className="text-sm leading-6 text-[color:var(--ink)]">{item}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              开始生成命理报告
            </button>

            <div className="mt-3 text-center text-xs leading-6 text-[color:var(--muted)]">
              结果页默认可公开查看，可在生成后切换隐藏。提交数据仅用于本次分析与历史记录保存。
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 md:hidden">
        <div className="glass-panel rounded-[1.5rem] border border-white/60 px-4 py-3 shadow-[0_20px_50px_rgba(23,32,51,0.16)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">当前状态</div>
              <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{nextAction}</div>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              开始测算
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function StatusBadge({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <div className={`rounded-[1.1rem] px-3 py-3 text-center ${ready ? 'bg-[rgba(15,118,110,0.1)]' : 'bg-slate-100'}`}>
      <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${ready ? 'text-[color:var(--accent-strong)]' : 'text-[color:var(--ink)]'}`}>
        {ready ? '已就绪' : '待填写'}
      </div>
    </div>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
      <span className="font-semibold text-[color:var(--muted)]">{label}</span>
      <span className="max-w-[12rem] truncate text-[color:var(--ink)]">{value}</span>
    </div>
  );
}

function DataRow({
  icon: Icon,
  label,
  value,
  strong = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-[1.25rem] bg-white/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-[color:var(--muted)]">{label}</span>
      </div>
      <span className={`text-sm ${strong ? 'font-bold text-[color:var(--ink)]' : 'font-medium text-[color:var(--ink)]'}`}>
        {value}
      </span>
    </div>
  );
}

function MetricBadge({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 ${
        highlight ? 'bg-[rgba(201,125,58,0.16)] text-[color:var(--warm)]' : 'bg-[rgba(255,255,255,0.82)] text-[color:var(--ink)]'
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
  emphasize = false,
}: {
  title: string;
  value: string;
  description: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-4 ${
        emphasize
          ? 'border-[rgba(201,125,58,0.28)] bg-[rgba(201,125,58,0.12)]'
          : 'border-[color:var(--line)] bg-white/80'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{title}</div>
      <div className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{value}</div>
      <div className="mt-1 text-xs text-[color:var(--muted)]">{description}</div>
    </div>
  );
}
