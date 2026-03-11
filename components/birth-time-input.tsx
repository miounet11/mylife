'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Sparkles } from 'lucide-react';
import { getShichenOption, SHICHEN_OPTIONS } from '@/lib/shichen';

interface BirthTimeValue {
  hour: number;
  minute: number;
  second: number;
}

interface BirthTimeInputProps {
  value: BirthTimeValue;
  onChange: (value: BirthTimeValue) => void;
  onValidityChange?: (isValid: boolean) => void;
}

function formatPart(value: number) {
  return String(value).padStart(2, '0');
}

function formatClockValue(value: BirthTimeValue) {
  return `${formatPart(value.hour)}:${formatPart(value.minute)}`;
}

function parseSmartTime(input: string): { hour: number; minute: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
  }

  match = trimmed.match(/^(\d{1,2})点(\d{1,2})?分?$/);
  if (match) {
    const hour = Number(match[1]);
    const minute = match[2] ? Number(match[2]) : 0;
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
  }

  match = trimmed.match(/^(\d{3,4})$/);
  if (match) {
    const padded = match[1].padStart(4, '0');
    const hour = Number(padded.slice(0, 2));
    const minute = Number(padded.slice(2));
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
  }

  match = trimmed.match(/^(\d{1,2})$/);
  if (match) {
    const hour = Number(match[1]);
    return hour <= 23 ? { hour, minute: 0 } : null;
  }

  return null;
}

function isValidTime(hour: number, minute: number, second: number) {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59;
}

function getPeriodStyle(period: string) {
  switch (period) {
    case 'night':
      return 'bg-[linear-gradient(135deg,#1e293b,#312e81)] text-white';
    case 'dawn':
      return 'bg-[linear-gradient(135deg,#fdba74,#f9a8d4)] text-[#6b3410]';
    case 'morning':
      return 'bg-[linear-gradient(135deg,#fde68a,#fcd34d)] text-[#78350f]';
    case 'noon':
      return 'bg-[linear-gradient(135deg,#fcd34d,#f59e0b)] text-[#78350f]';
    case 'afternoon':
      return 'bg-[linear-gradient(135deg,#fed7aa,#fb923c)] text-[#7c2d12]';
    case 'evening':
      return 'bg-[linear-gradient(135deg,#c4b5fd,#818cf8)] text-[#312e81]';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function BirthTimeInput({
  value,
  onChange,
  onValidityChange,
}: BirthTimeInputProps) {
  const [smartInput, setSmartInput] = useState(formatClockValue(value));
  const [secondText, setSecondText] = useState(formatPart(value.second));
  const [error, setError] = useState('');
  const secondRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSmartInput(formatClockValue(value));
    setSecondText(formatPart(value.second));
  }, [value, value.hour, value.minute, value.second]);

  const currentShichen = useMemo(() => getShichenOption(value.hour), [value.hour]);

  const commitTime = (hour: number, minute: number, second: number, nextError: string = '') => {
    if (!isValidTime(hour, minute, second)) {
      setError(nextError || '时间无效，请确认时分秒');
      onValidityChange?.(false);
      return false;
    }

    setError('');
    onValidityChange?.(true);
    onChange({ hour, minute, second });
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
          <Clock3 className="h-4 w-4 text-[color:var(--warm)]" />
          钟表时间
        </div>
        <p className="mt-1 text-xs leading-6 text-[color:var(--muted)]">
          支持输入 14:30、1430、14点30分；如果只记得大概时段，可直接点下方时辰。
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_0.6fr]">
          <input
            type="text"
            inputMode="text"
            value={smartInput}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSmartInput(nextValue);

              const parsed = parseSmartTime(nextValue);
              if (parsed) {
                commitTime(parsed.hour, parsed.minute, value.second);
              }
            }}
            onBlur={() => {
              const parsed = parseSmartTime(smartInput);
              if (!parsed) {
                setError('建议格式：14:30');
                onValidityChange?.(false);
                return;
              }

              commitTime(parsed.hour, parsed.minute, value.second);
            }}
            placeholder="例如 14:30"
            className="w-full rounded-2xl border border-[color:var(--line)] bg-[rgba(246,241,232,0.55)] px-4 py-3 text-base font-semibold text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
          />

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[color:var(--muted)]">秒</span>
            <input
              ref={secondRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={secondText}
              onChange={(event) => {
                const numericValue = event.target.value.replace(/\D/g, '').slice(0, 2);
                setSecondText(numericValue);

                if (numericValue.length === 0) {
                  onValidityChange?.(false);
                  return;
                }

                commitTime(value.hour, value.minute, Number(numericValue));
              }}
              onBlur={() => {
                if (secondText.length === 0) {
                  setError('请补充秒数');
                  onValidityChange?.(false);
                  return;
                }

                commitTime(value.hour, value.minute, Number(secondText));
              }}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-center text-base font-semibold text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
          {SHICHEN_OPTIONS.map((option) => {
            const isSelected = option.name === currentShichen.name;
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => {
                  setSmartInput(`${formatPart(option.midHour)}:00`);
                  commitTime(option.midHour, 0, value.second);
                }}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? `${getPeriodStyle(option.period)} border-transparent shadow-[0_16px_30px_rgba(23,32,51,0.12)]`
                    : 'border-[color:var(--line)] bg-white hover:-translate-y-0.5'
                }`}
              >
                <div className="text-base font-bold">{option.name}</div>
                <div className={`mt-1 text-[11px] ${isSelected ? 'text-current/80' : 'text-[color:var(--muted)]'}`}>
                  {option.range}
                </div>
                <div className={`text-[11px] ${isSelected ? 'text-current/80' : 'text-[color:var(--muted)]'}`}>
                  {option.alias}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[0, 15, 30, 45].map((minuteValue) => (
            <button
              key={minuteValue}
              type="button"
              onClick={() => {
                setSmartInput(`${formatPart(value.hour)}:${formatPart(minuteValue)}`);
                commitTime(value.hour, minuteValue, value.second);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                value.minute === minuteValue
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'bg-[rgba(15,118,110,0.08)] text-[color:var(--accent-strong)] hover:bg-[rgba(15,118,110,0.14)]'
              }`}
            >
              {formatPart(minuteValue)} 分
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-[rgba(201,125,58,0.1)] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
          <Sparkles className="h-4 w-4 text-[color:var(--warm)]" />
          当前识别
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[color:var(--ink)]">
          <span className="rounded-full bg-white/80 px-3 py-1 font-semibold">
            {formatPart(value.hour)}:{formatPart(value.minute)}:{formatPart(value.second)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPeriodStyle(currentShichen.period)}`}>
            {currentShichen.label} · {currentShichen.alias}
          </span>
        </div>
        {error ? (
          <div className="mt-2 text-xs text-red-600">{error}</div>
        ) : (
          <div className="mt-2 text-xs text-[color:var(--muted)]">
            如果只知道大概区间，先选时辰也可以；系统会再结合出生地做真太阳时修正。
          </div>
        )}
      </div>
    </div>
  );
}
