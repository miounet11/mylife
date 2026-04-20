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
    <div className="soft-card overflow-hidden rounded-[2rem]">
      <div className="border-b border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(178,149,93,0.12),rgba(208,160,106,0.12))] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-2xl font-bold text-white shadow-[0_16px_30px_rgba(178,149,93,0.26)]">
              {displayName?.charAt(0) || '用'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[color:var(--ink)]">{displayName}</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {displayGender} · {displayAge}岁 · {displayPlace}
              </p>
            </div>
          </div>
          <span className="inline-flex rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]">
            {accountLabel}
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="日主" value={dayMaster} />
          <MetricCard label="格局" value={pattern} />
          <MetricCard label="当前大运" value={dayun} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
              ['使用天数', `${usageDays}天`],
              ['分析次数', `${fortunes.length}次`],
              ['保存事件', `${eventCount}个`],
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-5">
      <div className="text-sm font-semibold text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-5">
      <div className="font-semibold text-[color:var(--ink)]">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[color:var(--muted)]">{label}</span>
            <span className="font-semibold text-[color:var(--ink)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
