'use client';

import { useEffect, useState } from 'react';
import { parseLocalDate } from '@/lib/utils';

interface UserProfileProps {
  user?: any;
  fortunes?: any[];
  eventCount?: number;
}

const calculateAge = (birthDate?: string, now?: Date): string => {
  if (!birthDate || !now) return '--';
  const parsed = parseLocalDate(birthDate);
  if (!parsed) return '--';

  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return `${age}`;
};

export default function UserProfile({ user, fortunes = [], eventCount = 0 }: UserProfileProps) {
  const [mountedAt, setMountedAt] = useState<Date | null>(null);

  useEffect(() => {
    setMountedAt(new Date());
  }, []);

  const latest = fortunes[0];
  const dayMaster = latest?.bazi?.dayMaster || '--';
  const pattern = latest?.pattern?.type || '--';
  const dayun = latest?.fortune?.currentDaYun || '--';

  const displayName = user?.name || latest?.name || '未命名用户';
  const displayGender = user?.gender === 'female' ? '女' : '男';
  const displayAge = mountedAt ? calculateAge(user?.birth_date || latest?.birth_date, mountedAt) : '--';
  const displayPlace = user?.birth_place || latest?.birth_place || '--';
  const displayBirthDate = user?.birth_date || latest?.birth_date || '--';
  const displayBirthTime = user?.birth_time || latest?.birth_time || '--';
  const accountLabel = user?.email && user?.email_verified === 1 ? '邮箱账户' : '匿名会话档案';
  const accountValue = user?.email || '未绑定';

  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const usageDays =
    mountedAt && createdAt && !Number.isNaN(createdAt.getTime())
      ? Math.max(1, Math.floor((mountedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      : '--';

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)]">
      <div className="border-b border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--brand-strong)] text-lg font-black text-white">
              {displayName?.charAt(0) || '用'}
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight text-[color:var(--ink-1)]">
                {displayName}
              </h2>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-[color:var(--ink-4)]">
                {displayGender} · {displayAge}岁 · {displayPlace}
              </p>
            </div>
          </div>
          <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-4)]">
            {accountLabel}
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="日主" value={dayMaster} />
          <MetricCard label="格局" value={pattern} />
          <MetricCard label="当前大运" value={dayun} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <InfoCard
            title="出生信息"
            rows={[
              ['出生日期', displayBirthDate],
              ['出生时间', displayBirthTime],
              ['出生地点', displayPlace],
            ]}
          />
          <InfoCard
            title="使用数据"
            rows={[
              ['账号状态', accountValue],
              ['使用天数', `${usageDays}`],
              ['分析次数', `${fortunes.length}`],
              ['保存事件', `${eventCount}`],
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-lg font-black tabular-nums text-[color:var(--ink-1)]">
        {value}
      </div>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        {title}
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-b border-[color:var(--hairline)] py-1 text-xs last:border-b-0"
          >
            <span className="text-[color:var(--ink-4)]">{label}</span>
            <span className="font-mono font-bold tabular-nums text-[color:var(--ink-1)]">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
