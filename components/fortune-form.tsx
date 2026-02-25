// 命理表单组件 - 快捷输入 + 全球城市 + 精确到秒 + 真太阳时
'use client';

import { useState, useMemo } from 'react';
import FortuneProgress from './fortune-progress';
import CitySelector from './city-selector';
import { type CityData } from '@/lib/cities';
import { calculateTrueSolarTime, formatSolarTime } from '@/lib/solar-time';

// 生成年份选项 1920-2025
const YEARS = Array.from({ length: 106 }, (_, i) => 2025 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

// 时辰对照
const SHICHEN_MAP: Record<number, string> = {
  0: '子时(23-01)', 1: '丑时(01-03)', 2: '丑时(01-03)', 3: '寅时(03-05)', 4: '寅时(03-05)',
  5: '卯时(05-07)', 6: '卯时(05-07)', 7: '辰时(07-09)', 8: '辰时(07-09)', 9: '巳时(09-11)',
  10: '巳时(09-11)', 11: '午时(11-13)', 12: '午时(11-13)', 13: '未时(13-15)', 14: '未时(13-15)',
  15: '申时(15-17)', 16: '申时(15-17)', 17: '酉时(17-19)', 18: '酉时(17-19)', 19: '戌时(19-21)',
  20: '戌时(19-21)', 21: '亥时(21-23)', 22: '亥时(21-23)', 23: '子时(23-01)',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function FortuneForm() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [city, setCity] = useState<CityData | null>(null);
  const [year, setYear] = useState<number>(1990);
  const [month, setMonth] = useState<number>(1);
  const [day, setDay] = useState<number>(1);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [second, setSecond] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 动态天数
  const days = useMemo(() => {
    const max = getDaysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [year, month]);

  // 自动修正日期
  useMemo(() => {
    const max = getDaysInMonth(year, month);
    if (day > max) setDay(max);
  }, [year, month, day]);

  // 真太阳时计算
  const solarTime = useMemo(() => {
    if (!city) return null;
    return calculateTrueSolarTime(year, month, day, hour, minute, second, city.lng, city.tz);
  }, [city, year, month, day, hour, minute, second]);

  // 时辰显示
  const shichen = useMemo(() => {
    const h = solarTime ? solarTime.hour : hour;
    return SHICHEN_MAP[h] || '';
  }, [solarTime, hour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('请输入姓名'); return; }
    if (!city) { setError('请选择出生地点'); return; }

    setLoading(true);
    setError('');

    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const birthTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          birthDate,
          birthTime,
          birthSecond: second,
          birthPlace: city.name,
          timezone: city.tz,
          longitude: city.lng,
          latitude: city.lat,
          cityNameEn: city.nameEn,
          useSolarTime: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        window.location.href = `/result/${result.reportId}`;
      } else {
        setError(result.error || '分析请求失败，请重试');
        setLoading(false);
      }
    } catch (err) {
      setError('网络连接错误，请检查网络后重试');
      setLoading(false);
    }
  };

  if (loading) {
    return <FortuneProgress onComplete={() => {}} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 基本信息区 */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2"></span>
            基本信息
          </h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">姓名/昵称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的称呼"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">性别 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 rounded border font-medium transition-all ${
                  gender === 'male'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                乾造 (男)
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 rounded border font-medium transition-all ${
                  gender === 'female'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                坤造 (女)
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">注：大运排法男女有别，请务必准确选择</p>
          </div>
        </div>

        {/* 出生信息区 */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2"></span>
            出生时间与地点
          </h3>

          <div className="space-y-2 relative">
            <label className="block text-sm font-semibold text-slate-700">出生地点 <span className="text-red-500">*</span></label>
            <CitySelector onSelect={setCity} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">公历出生日期 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {MONTHS.map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {days.map((d) => <option key={d} value={d}>{d}日</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">钟表时间 (时:分:秒) <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}时</option>)}
              </select>
              <select
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}分</option>)}
              </select>
              <select
                value={second}
                onChange={(e) => setSecond(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {SECONDS.map((s) => <option key={s} value={s}>{String(s).padStart(2, '0')}秒</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 真太阳时提示卡片 */}
      <div className={`mt-6 p-5 rounded-lg border ${city ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'} transition-all`}>
        <div className="flex items-start">
          <svg className={`w-6 h-6 mt-0.5 mr-3 ${city ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className={`font-bold mb-1 ${city ? 'text-indigo-900' : 'text-slate-700'}`}>真太阳时自动修正</h4>
            {city ? (
              <div className="space-y-1">
                <p className="text-sm text-indigo-800">
                  您出生于 <strong>{city.name}</strong> (经度 {city.lng.toFixed(2)}°)。
                </p>
                <div className="flex items-center space-x-4 mt-2 bg-white/60 p-3 rounded border border-indigo-100/50">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">您输入的钟表时间</div>
                    <div className="font-mono text-sm font-semibold text-slate-700">
                      {year}-{String(month).padStart(2, '0')}-{String(day).padStart(2, '0')} {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}:{String(second).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-indigo-300">→</div>
                  <div className="flex-1">
                    <div className="text-xs text-indigo-600 font-bold mb-1">系统排盘实际使用时间</div>
                    <div className="font-mono text-sm font-bold text-indigo-700">
                      {solarTime?.year}-{String(solarTime?.month).padStart(2, '0')}-{String(solarTime?.day).padStart(2, '0')} {formatSolarTime(solarTime || { hour, minute, second })}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                  经纬度及均时差修正：{solarTime?.description}，当前属于 <strong>{shichen}</strong>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                命理排盘需要使用当地的"真太阳时"。请先选择您的出生城市，系统将自动根据经纬度及均时差为您计算精确的排盘时间。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || !name.trim() || !city}
          className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          开始命理分析
        </button>
      </div>
    </form>
  );
}
