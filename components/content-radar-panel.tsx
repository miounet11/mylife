'use client';

import { useEffect, useState } from 'react';

type ContentRadarSource = {
  id: string;
  label: string;
  platform: string;
  url: string;
  type: 'rss';
  enabled?: boolean;
  keywords?: string[];
};

type ContentSignal = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  platform: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  matchedKeywords?: string[];
  score?: number;
};

type ContentRadarRun = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  platform: string;
  status: 'success' | 'error';
  fetchedCount?: number;
  savedCount?: number;
  error?: string;
  createdAt?: string;
};

type ContentSuggestion = {
  signalId: string;
  sourceId: string;
  title: string;
  platform: string;
  score: number;
  keywords: string[];
  suggestedTopic: string;
  suggestedAngle: string;
  url: string;
};

export default function ContentRadarPanel({
  onAutomationCompleted,
  onContentGenerated,
}: {
  onAutomationCompleted?: (summary: string) => void | Promise<void>;
  onContentGenerated?: (summary: string) => void | Promise<void>;
}) {
  const [sources, setSources] = useState<ContentRadarSource[]>([]);
  const [signals, setSignals] = useState<ContentSignal[]>([]);
  const [runs, setRuns] = useState<ContentRadarRun[]>([]);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [promoting, setPromoting] = useState<string>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/content/radar', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '内容雷达加载失败');
        return;
      }
      setSources(data.sources || []);
      setSignals(data.signals || []);
      setRuns(data.runs || []);
      setSuggestions(data.suggestions || []);
    } catch {
      setError('网络异常，无法加载内容雷达');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runNow = async () => {
    setRunning(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/content/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '执行失败');
        return;
      }
      setSignals(data.recentSignals || []);
      setRuns(data.recentRuns || []);
      setSuggestions(data.suggestions || []);
      setMessage(`内容雷达已执行，抓取 ${data.signals?.length || 0} 条新信号`);
    } catch {
      setError('网络异常，执行失败');
    } finally {
      setRunning(false);
    }
  };

  const runRadarAndAutomation = async () => {
    setBridging(true);
    setError('');
    setMessage('');
    try {
      const radarResponse = await fetch('/api/admin/content/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const radarData = await radarResponse.json();
      if (!radarResponse.ok || !radarData.success) {
        setError(radarData.error || '雷达执行失败');
        return;
      }

      const automationResponse = await fetch('/api/admin/content/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 3,
          autoPublish: false,
        }),
      });
      const automationData = await automationResponse.json();
      if (!automationResponse.ok || !automationData.success) {
        setError(automationData.error || '自动化执行失败');
        return;
      }

      setSignals(radarData.recentSignals || []);
      setRuns(radarData.recentRuns || []);
      setSuggestions(radarData.suggestions || []);
      const summary = `雷达已抓取并推进自动化，新增 ${automationData.generatedCount || 0} 条内容草稿`;
      setMessage(summary);
      await onAutomationCompleted?.(summary);
    } catch {
      setError('网络异常，执行失败');
    } finally {
      setBridging(false);
    }
  };

  const promoteSignal = async (signalId: string, mode: 'single' | 'cluster') => {
    setPromoting(`${signalId}:${mode}`);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/content/radar/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId, mode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '热点转内容失败');
        return;
      }

      const summary = mode === 'cluster'
        ? `已从热点生成 ${data.meta?.generatedCount || 0} 条专题草稿`
        : `已从热点生成 ${data.meta?.generatedCount || 0} 条内容草稿`;
      setMessage(summary);
      await onContentGenerated?.(summary);
    } catch {
      setError('网络异常，热点转内容失败');
    } finally {
      setPromoting('');
    }
  };

  return (
    <div className="glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-[color:var(--muted)]">内容雷达</div>
          <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">公开热点信号</div>
        </div>
        <div className="space-y-2">
          <div className="action-guide">主动作</div>
          <div className="action-strip flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void runNow()}
              disabled={running || bridging || loading}
              className="action-secondary disabled:opacity-60"
            >
              {running ? '抓取中...' : '立即抓取热点'}
            </button>
            <button
              type="button"
              onClick={() => void runRadarAndAutomation()}
              disabled={running || bridging || loading}
              className="action-primary disabled:opacity-60"
            >
              {bridging ? '推进中...' : '抓取并推进内容自动化'}
            </button>
          </div>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="mt-6 rounded-[var(--radius-md)] bg-white/70 p-5 text-sm text-[color:var(--muted)]">加载中...</div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: '信号总数', value: signals.length },
              { label: '建议选题', value: suggestions.length },
              { label: '数据源', value: sources.length },
              { label: '最近执行', value: runs[0]?.status === 'success' ? '成功' : runs[0]?.status === 'error' ? '失败' : '暂无' },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[var(--radius-md)] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {sources.map((source) => (
              <div key={source.id} className="soft-card rounded-[var(--radius-md)] p-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{source.label}</div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">{source.platform} · {source.type}</div>
                <div className="mt-2 break-all text-xs text-[color:var(--muted)]">{source.url}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">最新热点信号</div>
              <div className="grid gap-3">
                {signals.length > 0 ? signals.slice(0, 10).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-[1.4rem] bg-white/80 px-4 py-4 transition hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a
                          href={signal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[color:var(--ink)] transition hover:text-[color:var(--accent-strong)]"
                        >
                          {signal.title}
                        </a>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {signal.sourceLabel} · {signal.platform} · {signal.publishedAt || '无发布时间'}
                        </div>
                      </div>
                      <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {signal.score || 0}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {(signal.matchedKeywords || []).join('、') || '未命中站点关键词'}
                    </div>
                    {signal.summary && (
                      <div className="mt-2 line-clamp-2 text-xs text-[color:var(--muted)]">{signal.summary}</div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void promoteSignal(signal.id, 'single')}
                        disabled={!!promoting || running || bridging}
                        className="action-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-60"
                      >
                        {promoting === `${signal.id}:single` ? '生成中...' : '生成草稿'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void promoteSignal(signal.id, 'cluster')}
                        disabled={!!promoting || running || bridging}
                        className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] disabled:opacity-60"
                      >
                        {promoting === `${signal.id}:cluster` ? '组稿中...' : '专题组稿'}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无热点信号</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">建议选题</div>
              <div className="grid gap-3">
                {suggestions.length > 0 ? suggestions.slice(0, 8).map((item) => (
                  <div key={`${item.sourceId}-${item.url}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.suggestedTopic}</div>
                      <div className="text-xs font-semibold text-[color:var(--accent-strong)]">{item.score}</div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{item.suggestedAngle}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{item.keywords.join('、') || '无关键词'}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void promoteSignal(item.signalId, 'single')}
                        disabled={!!promoting || running || bridging}
                        className="action-secondary min-h-0 px-3 py-2 text-xs disabled:opacity-60"
                      >
                        {promoting === `${item.signalId}:single` ? '生成中...' : '生成单篇'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void promoteSignal(item.signalId, 'cluster')}
                        disabled={!!promoting || running || bridging}
                        className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] disabled:opacity-60"
                      >
                        {promoting === `${item.signalId}:cluster` ? '组稿中...' : '生成组稿'}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">暂无建议选题</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-semibold text-[color:var(--muted)]">最近执行记录</div>
            <div className="grid gap-3">
              {runs.length > 0 ? runs.slice(0, 8).map((run) => (
                <div key={run.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{run.sourceLabel}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${run.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {run.status === 'success' ? '成功' : '失败'}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    抓取 {run.fetchedCount || 0} / 入库 {run.savedCount || 0} · {run.createdAt || ''}
                  </div>
                  {run.error && <div className="mt-2 text-xs leading-6 text-rose-700">{run.error}</div>}
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">暂无执行记录</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
