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
  try {
    return new Date(value).toLocaleDateString('zh-CN');
  } catch {
    return value;
  }
}

function mapStrengthLabel(strength?: string) {
  if (strength === 'strong') return '势能较强';
  if (strength === 'weak') return '需稳步推进';
  return '节奏平衡';
}

const worldYiWorkspaceProtocols = [
  '录入不是求一句结论，而是建立个人判断底座',
  '结果页会先解释结构，再解释阶段和环境',
  '历史记录会逐步变成可复盘的长期判断档案',
  '本人、家人、伴侣和代测对象会共用同一套秩序',
];

const worldYiWorkspaceLinks = [
  { label: '世界易总入口', href: '/world-yi' },
  { label: '方法论入口', href: '/knowledge/world-yi-methodology' },
  { label: '案例证据层', href: '/cases' },
  { label: '全球华人路径', href: '/world-yi/global' },
];

export default function AnalyzeWorkspace() {
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
      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-5">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            判断与记录
          </div>
          <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
            新的判断可以继续做，
            <span className="font-serif text-[color:var(--accent-strong)]">以前的结果也能随时回看。</span>
          </h1>
          <p className="intro-copy">继续填写新对象，或直接回看历史判断记录。</p>
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 px-5 py-5">
            <div className="text-sm font-semibold text-[color:var(--ink)]">世界易提醒</div>
            <p className="intro-copy mt-3">录入是入口，价值在后续结果页的结构化判断顺序。</p>
            <div className="action-guide mt-4">操作按钮</div>
            <div className="action-strip mt-2 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/world-yi" className="action-secondary">世界易总入口</Link>
              <Link href="/world-yi/global" className="action-secondary">全球传播入口</Link>
              <Link href="/world-yi/en" className="action-secondary">English Gateway</Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,239,228,0.9))] px-5 py-5 shadow-[0_16px_40px_rgba(34,33,30,0.06)]">
            <div className="text-sm font-semibold text-[color:var(--ink)]">世界易工作台协议</div>
            <div className="mt-4 grid gap-3">
              {worldYiWorkspaceProtocols.map((item) => (
                <div key={item} className="rounded-[1.1rem] bg-white/80 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="action-guide mt-4">更多入口</div>
            <div className="action-strip mt-2 flex flex-wrap gap-3 text-sm font-semibold">
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
            <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">包含你自己和代看对象的所有记录。</p>
          </div>
          <div className="soft-card rounded-[1.5rem] p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">本人判断</div>
            <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{categorized.mine.length}</div>
            <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">按当前档案匹配到的个人记录。</p>
          </div>
          <div className="soft-card rounded-[1.5rem] p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">其他对象</div>
            <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{categorized.others.length}</div>
            <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">家人、伴侣或其他对象的历史记录。</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="space-y-5">
          <div className="glass-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-[color:var(--ink)]">新建世界易判断</div>
                <div className="intro-copy mt-1">录入后直接进入结构、阶段、环境、动作的判断页。</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>

          <FortuneForm />
        </div>

        <div className="space-y-5">
          <div className="glass-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-[color:var(--ink)]">既有判断列表</div>
                <div className="intro-copy mt-1">可按名字筛选，直接回看历史结果。</div>
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
              <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                先完成一次录入，后续所有本人和代测对象的报告都会在这里集中展示。
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
