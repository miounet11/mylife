// 用户档案组件
'use client';

interface UserProfileProps {
  user?: any;
  fortunes?: any[];
  eventCount?: number;
}

const calculateAge = (birthDate?: string): string => {
  if (!birthDate) return '--';
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return '--';

  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return `${age}`;
};

export default function UserProfile({ user, fortunes = [], eventCount = 0 }: UserProfileProps) {
  const latest = fortunes[0];
  const dayMaster = latest?.bazi?.dayMaster || '--';
  const pattern = latest?.pattern?.type || '--';
  const dayun = latest?.fortune?.currentDaYun || '--';

  const displayName = user?.name || latest?.name || '未命名测算者';
  const displayGender = user?.gender === 'female' ? '女' : '男';
  const displayAge = calculateAge(user?.birth_date || latest?.birth_date);
  const displayPlace = user?.birth_place || latest?.birth_place || '--';
  const displayBirthDate = user?.birth_date || latest?.birth_date || '--';
  const displayBirthTime = user?.birth_time || latest?.birth_time || '--';

  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const usageDays = createdAt && !Number.isNaN(createdAt.getTime())
    ? Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
              {displayName?.charAt(0) || '用'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-slate-600 text-sm">{displayGender} · {displayAge}岁 · {displayPlace}</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded border border-slate-300 text-slate-600 bg-white">
            匿名会话档案
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2 text-sm">日主</h3>
            <p className="text-xl font-bold text-slate-900">{dayMaster}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2 text-sm">格局</h3>
            <p className="text-base font-semibold text-slate-900">{pattern}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-2 text-sm">大运提示</h3>
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{dayun}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 mb-2">出生信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">出生日期</span>
                <span className="font-semibold text-slate-900">{displayBirthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">出生时间</span>
                <span className="font-semibold text-slate-900">{displayBirthTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">出生地</span>
                <span className="font-semibold text-slate-900">{displayPlace}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-2">统计信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">使用天数</span>
                <span className="font-semibold text-slate-900">{usageDays}天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">分析次数</span>
                <span className="font-semibold text-slate-900">{fortunes.length}次</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">保存事件</span>
                <span className="font-semibold text-slate-900">{eventCount}个</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

