'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Clock3, FileText, Layers3, Plus, Sparkles, UserRound } from 'lucide-react';
import FortuneForm from '@/components/fortune-form';

type HistoryUser = {
  id: string;
  name?: string;
  email?: string | null;
};

type FortuneItem = {
  id: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  created_at?: string;
  pattern?: {
    type?: string;
    strength?: string;
  };
  analysis?: {
    opening?: string;
    explanation?: string;
  };
};

type HistoryResponse = {
  success: boolean;
  user?: HistoryUser;
  fortunes?: FortuneItem[];
  error?: string;
};

function truncate(text: string, max = 54) {
  if (!text) return '已完成综合判断，点击查看详情。';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatDateLabel(value?: string) {
  if (!value) return '未记录';
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matched) {
    return `${matched[1]}-${matched[2]}-${matched[3]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function mapStrengthLabel(strength?: string) {
  if (strength === 'strong') return '势能较强';
  if (strength === 'weak') return '需稳步推进';
  return '节奏平衡';
}

const worldYiWorkspaceLinks = [
  { label: '案例证据层', href: '/cases' },
  { label: '方法论入口', href: '/knowledge/world-yi-methodology' },
  { label: '世界易总入口', href: '/world-yi' },
];

export default function AnalyzeWorkspace({
  returnHref,
  returnLabel,
  returnSource,
}: {
  returnHref?: string;
  returnLabel?: string;
  returnSource?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<HistoryUser | null>(null);
  const [fortunes, setFortunes] = useState<FortuneItem[]>([]);
  const [selectedName, setSelectedName] = useState('全部');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/history', { cache: 'no-store' });
        const data: HistoryResponse = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || '加载判断列表失败');
          return;
        }

        setUser(data.user || null);
        setFortunes(data.fortunes || []);
      } catch {
        setError('网络异常，无法加载判断列表');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const nameGroups = useMemo(() => {
    const counts = new Map<string, number>();
    fortunes.forEach((item) => {
      const key = item.name || '未命名对象';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return ['全部', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name)];
  }, [fortunes]);

  const currentName = user?.name?.trim();

  const categorized = useMemo(() => {
    const mine = fortunes.filter((item) => currentName && item.name === currentName);
    const others = fortunes.filter((item) => !currentName || item.name !== currentName);
    return { mine, others };
  }, [currentName, fortunes]);

  const filteredFortunes = useMemo(() => {
    if (selectedName === '全部') {
      return fortunes;
    }
    return fortunes.filter((item) => (item.name || '未命名对象') === selectedName);
  }, [fortunes, selectedName]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <div className="space-y-5">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            判断与记录
          </div>
          <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
            先开始新的判断，
            <span className="font-serif text-[color:var(--accent-strong)]">历史记录放在右侧随时回看。</span>
          </h1>

          <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,239,228,0.9))] px-5 py-5 shadow-[0_16px_40px_rgba(34,33,30,0.06)]">
            <div className="text-sm font-semibold text-[color:var(--ink)]">快捷入口</div>
            <div className="intro-copy mt-2">先开始新的综合判断；如果你还在理解体系，也可以先回到世界易总入口、方法论和案例层。</div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              {worldYiWorkspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="action-secondary">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="soft-card rounded-[1.5rem] p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">累计判断</div>
            <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{fortunes.length}</div>
          </div>
          <div className="soft-card rounded-[1.5rem] p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">本人判断</div>
            <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{categorized.mine.length}</div>
          </div>
          <div className="soft-card rounded-[1.5rem] p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">其他对象</div>
            <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{categorized.others.length}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
        <div className="space-y-5" id="analyze-workspace">
          <div className="glass-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="text-lg font-bold text-[color:var(--ink)]">新建世界易判断</div>
                <div className="intro-copy text-sm leading-6 text-[color:var(--muted)]">左侧先完成新判断，右侧再回看既有记录，避免两个任务抢注意力。</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>

          <FortuneForm
            returnHref={returnHref}
            returnLabel={returnLabel}
            returnSource={returnSource}
          />
        </div>

        <div className="space-y-5">
          <div className="glass-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-[color:var(--ink)]">既有判断列表</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {nameGroups.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedName(name)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selectedName === name
                        ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                        : 'border border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-[1.5rem] bg-slate-200" />
              ))}
            </div>
          ) : filteredFortunes.length > 0 ? (
            <div className="space-y-4">
              {filteredFortunes.map((item) => (
                <Link
                  key={item.id}
                  href={`/result/${item.id}`}
                  className="block rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                          <UserRound className="h-3.5 w-3.5" />
                          {item.name || '未命名对象'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                          <Layers3 className="h-3.5 w-3.5" />
                          {item.pattern?.type || '综合判断'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[color:var(--muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {item.birth_date || '未记录出生日期'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {item.birth_time || '未记录出生时间'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {formatDateLabel(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                        {truncate(item.analysis?.opening || item.analysis?.explanation || '')}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        {mapStrengthLabel(item.pattern?.strength)}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[color:var(--muted)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-[2rem] px-6 py-12 text-center">
              <div className="text-xl font-bold text-[color:var(--ink)]">还没有判断记录</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
