'use client';

import { DIZHI } from '@/lib/fengshui/space';
import type { SpaceSimResult, SpaceTimeState } from '@/lib/fengshui/space';

export function SpaceCompassPanel({
  time,
  meta,
  onChangeHour,
  onToggleFollow,
  onToggleNine,
  onTide,
}: {
  time: SpaceTimeState;
  meta: SpaceSimResult['meta'];
  onChangeHour: (h: number) => void;
  onToggleFollow: (v: boolean) => void;
  onToggleNine: (v: boolean) => void;
  onTide: (v: number) => void;
}) {
  const hour = time.hour + time.minute / 60;
  const needle = ((hour % 24) / 24) * 360;

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#12161f]/90 p-3 text-[12px] text-white/90 shadow-xl backdrop-blur">
      <div className="relative mx-auto h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-white/20 bg-[#0b0e14]">
          {DIZHI.map((z, i) => {
            const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const r = 40;
            const x = 56 + Math.cos(ang) * r;
            const y = 56 + Math.sin(ang) * r;
            return (
              <span
                key={z}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] text-white/70"
                style={{ left: x, top: y }}
              >
                {z}
              </span>
            );
          })}
          <div
            className="absolute left-1/2 top-1/2 h-8 w-0.5 origin-bottom bg-amber-400"
            style={{ transform: `translate(-50%, -100%) rotate(${needle}deg)` }}
          />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300" />
        </div>
      </div>

      <div className="space-y-1.5 border-t border-white/10 pt-2">
        <Row k="当前时辰" v={`${meta.dizhiHour}时 ${pad(time.hour)}:${pad(time.minute)}`} />
        <Row k="月相" v={meta.moonPhaseLabel} />
        <Row k="太阳方位" v={`${meta.sunAzimuthDeg.toFixed(0)}°`} />
        <Row k="值时星" v={meta.nineStarLabel} />
        <Row k="入口五行" v={meta.entranceElement} />
      </div>

      <label className="block space-y-1">
        <span className="text-white/50">时辰推演</span>
        <input
          type="range"
          min={0}
          max={23}
          value={time.hour}
          onChange={(e) => onChangeHour(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-white/50">潮汐能量加成 · {time.tideBoost.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.05}
          value={time.tideBoost}
          onChange={(e) => onTide(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
      </label>

      <label className="flex items-center gap-2 text-white/70">
        <input
          type="checkbox"
          checked={time.followClock}
          onChange={(e) => onToggleFollow(e.target.checked)}
        />
        跟随系统时间
      </label>
      <label className="flex items-center gap-2 text-white/70">
        <input
          type="checkbox"
          checked={time.nineStarEnabled}
          onChange={(e) => onToggleNine(e.target.checked)}
        />
        九星示意叠加
      </label>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/45">{k}</span>
      <span className="font-medium text-amber-100/90">{v}</span>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
