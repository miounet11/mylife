'use client';

import { useEffect, useState } from 'react';
import { Solar } from 'lunar-javascript';
import { DEFAULT_CASE_TYPE_ID, buildLunarArrFromBirthday, padPart, type PaipanInfoData } from '@/lib/paipan-form';

interface InstantPaipanCardProps {
  sex: 0 | 1;
  onConfirm: (payload: PaipanInfoData) => void;
  disabled?: boolean;
  submitting?: boolean;
}

interface ClockState {
  datetime: string;
  lunarText: string;
  bazi: string[];
  hourDeg: number;
  minuteDeg: number;
}

const CLOCK_PLACEHOLDER: ClockState = {
  datetime: '---- --:--',
  lunarText: '加载中',
  bazi: ['—', '—', '—', '—', '—', '—', '—', '—'],
  hourDeg: 0,
  minuteDeg: 0,
};

function buildClockState() {
  const now = new Date();
  const solar = Solar.fromYmdHms(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const datetime = `${now.getFullYear()}-${padPart(now.getMonth() + 1)}-${padPart(now.getDate())} ${padPart(now.getHours())}:${padPart(now.getMinutes())}`;

  return {
    datetime,
    lunarText: `${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi() || '子'}时`,
    bazi: [
      eightChar.getYear()[0],
      eightChar.getMonth()[0],
      eightChar.getDay()[0],
      eightChar.getTime()[0],
      eightChar.getYear()[1],
      eightChar.getMonth()[1],
      eightChar.getDay()[1],
      eightChar.getTime()[1],
    ],
    hourDeg: ((now.getHours() % 12) + now.getMinutes() / 60) * 30,
    minuteDeg: now.getMinutes() * 6,
  };
}

export default function InstantPaipanCard({ sex, onConfirm, disabled = false, submitting = false }: InstantPaipanCardProps) {
  const [clockState, setClockState] = useState<ClockState>(CLOCK_PLACEHOLDER);
  const [isReady, setIsReady] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const isProcessing = submitting || pendingConfirm;
  const canSubmit = isReady && !disabled && !isProcessing;

  useEffect(() => {
    setClockState(buildClockState());
    setIsReady(true);

    const timer = window.setInterval(() => {
      setClockState(buildClockState());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!submitting) {
      setPendingConfirm(false);
    }
  }, [submitting]);

  return (
    <button
      type="button"
      disabled={!canSubmit}
      aria-busy={isProcessing}
      onClick={() => {
        if (!canSubmit) {
          return;
        }

        setPendingConfirm(true);
        onConfirm({
          guid: '',
          type: 0,
          username: '即时局',
          sex,
          birthday: clockState.datetime,
          lunarArr: buildLunarArrFromBirthday(clockState.datetime),
          sunTime: clockState.datetime,
          address: '未知地 北京时间 --',
          unknowhour: 0,
          typeId: DEFAULT_CASE_TYPE_ID,
          bjtime: 0,
          hw: 0,
          isSave: false,
          xls: 0,
        });
      }}
      className="flex w-full items-center justify-between rounded-[30px] bg-white px-6 py-4 text-left shadow-[0_8px_24px_rgba(16,16,16,0.06)] transition disabled:cursor-not-allowed disabled:opacity-80"
    >
      <div className="relative h-[90px] w-[90px] shrink-0 rounded-full border border-[rgba(178,149,93,0.35)] bg-[radial-gradient(circle_at_center,#fffdf7_0%,#f8f2e4_70%,#f1e7d3_100%)]">
        <div className="absolute inset-[8px] rounded-full border border-[rgba(178,149,93,0.25)]" />
        <div
          className="absolute left-1/2 top-1/2 h-[24px] w-[2px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-[#b2955d]"
          style={{ transform: `translateX(-50%) translateY(-100%) rotate(${clockState.hourDeg}deg)` }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[32px] w-[2px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-[#444444]"
          style={{ transform: `translateX(-50%) translateY(-100%) rotate(${clockState.minuteDeg}deg)` }}
        />
        <div className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b2955d]" />
      </div>

      <div className="ml-5 flex min-w-[96px] flex-col justify-center gap-2 text-[20px] font-bold text-[#444444]">
        <div className="flex justify-between">
          {clockState.bazi.slice(0, 4).map((item, index) => (
            <span key={`tg-${index}`}>{item}</span>
          ))}
        </div>
        <div className="flex justify-between">
          {clockState.bazi.slice(4).map((item, index) => (
            <span key={`dz-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <div className="ml-6 min-w-0 flex-1 text-right">
        <div className="inline-flex rounded-full border border-[rgba(178,149,93,1)] px-4 py-1 text-[14px] text-[#b2955d]">
          {isProcessing ? '正在起局' : isReady ? '即时起局（独立入口）' : '正在校准当前时刻'}
        </div>
        <div className="mt-3 text-[12px] leading-6 text-[#7b7b7b]">
          {isProcessing ? '正在生成当前时刻判断，请不要重复点击。' : '按当前时刻直接起局，不代替出生信息录入流程。'}
        </div>
        <div className="mt-2 text-[12px] text-[#7b7b7b]">农历：{clockState.lunarText}</div>
        <div className="mt-1 text-[12px] text-[#7b7b7b]">公历：{clockState.datetime}</div>
        <div className="mt-2 text-[11px] text-[#a7a7a7]">
          {isProcessing ? '已锁定本次提交，等待结果返回。' : canSubmit ? '点击后将跳过上方出生信息，直接用此刻时间生成判断。' : '当前入口暂不可用，请稍候。'}
        </div>
      </div>
    </button>
  );
}
