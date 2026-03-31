'use client';

import { useEffect, useState } from 'react';

type Snapshot = {
  metrics: {
    publishedEntries: number;
    draftEntries: number;
    pageViews30d: number;
    clicks30d: number;
    quickStarts30d: number;
    quickStartRate: number;
  };
  topSurfaces: Array<{
    key: string;
    label: string;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
  }>;
  clusterCoverage: Array<{
    key: string;
    title: string;
    priorityScore: number;
    demandScore: number;
    publishedCount: number;
    draftCount: number;
    missingTypes: string[];
    sampleTitles: string[];
    keywords: string[];
  }>;
  generationQueue: Array<{
    key: string;
    title: string;
    topic: string;
    angle: string;
    contentType: string;
    reason: string;
    priorityScore: number;
    sourceType?: 'cluster' | 'radar';
  }>;
  autoPublishCandidates: Array<{
    id: string;
    title: string;
    slug: string;
    source: string;
    score: number;
  }>;
  contentPerformance: Array<{
    id: string;
    title: string;
    slug: string;
    contentType: string;
    status: string;
    source: string;
    origin: string;
    radarSourceLabel?: string;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
  }>;
  radarSourcePerformance: Array<{
    sourceId: string;
    sourceLabel: string;
    platform: string;
    entryCount: number;
    publishedCount: number;
    views: number;
    clicks: number;
    quickStarts: number;
    conversionRate: number;
    bestTitle?: string;
  }>;
};

type SchedulerState = {
  localNow: string;
  publishHours: number[];
  dailyPublishLimit: number;
  publishedToday: number;
  draftReserveTarget: number;
  draftReserveCount: number;
  needsDraftReplenishment: boolean;
  publishWindowOpen: boolean;
  canPublishNow: boolean;
  nextPublishSlotLabel: string;
  recentRuns: Array<{
    id: string;
    trigger: 'cron' | 'manual';
    status: 'success' | 'skipped' | 'error';
    reason?: string;
    generatedCount?: number;
    publishedCount?: number;
    createdAt?: string;
  }>;
};

export default function ContentAutomationPanel({
  onCompleted,
}: {
  onCompleted?: (summary: string) => void | Promise<void>;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<'draft' | 'publish' | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recentTitles, setRecentTitles] = useState<string[]>([]);

  const loadSnapshot = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/content/automation', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '加载内容自动化概览失败');
        return;
      }
      setSnapshot(data.snapshot || null);
      setScheduler(data.scheduler || null);
    } catch {
      setError('网络异常，无法加载内容自动化概览');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const runCycle = async (autoPublish: boolean) => {
    setRunning(autoPublish ? 'publish' : 'draft');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/content/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 3,
          autoPublish,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '执行失败');
        return;
      }

      setSnapshot(data.snapshot || null);
      setScheduler(data.scheduler || null);
      setRecentTitles((data.savedEntries || []).map((item: { title: string }) => item.title).slice(0, 6));
      const summary = autoPublish
        ? `自动化已执行，生成 ${data.generatedCount || 0} 条内容，其中发布 ${data.publishedCount || 0} 条`
        : `自动化已执行，生成 ${data.generatedCount || 0} 条草稿`;
      setMessage(summary);
      await onCompleted?.(summary);
    } catch {
      setError('网络异常，执行失败');
    } finally {
      setRunning(null);
    }
  };

  const runScheduler = async () => {
    setScheduling(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/content/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useScheduler: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '计划任务执行失败');
        return;
      }

      setSnapshot(data.snapshot || null);
      setScheduler(data.scheduler || null);
      const summary = `计划任务已执行，补稿 ${data.generatedCount || 0} 条，发布 ${data.publishedCount || 0} 条`;
      setMessage(summary);
      await onCompleted?.(summary);
    } catch {
      setError('网络异常，计划任务执行失败');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-[color:var(--muted)]">内容自动化</div>
          <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">按用户偏好和内容缺口，自动扩张内容架构</div>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-[color:var(--muted)]">
            这一层会综合最近 30 天的内容访问、卡片点击、快速分析转化，以及当前内容覆盖度，给出下一轮最该生成的主题队列。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void runCycle(false)}
            disabled={running !== null || scheduling}
            className="action-secondary disabled:opacity-60"
          >
            {running === 'draft' ? '生成中...' : '自动生成草稿'}
          </button>
          <button
            type="button"
            onClick={() => void runCycle(true)}
            disabled={running !== null || scheduling}
            className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {running === 'publish' ? '发布中...' : '自动生成并发布'}
          </button>
          <button
            type="button"
            onClick={() => void runScheduler()}
            disabled={running !== null || scheduling}
            className="rounded-full border border-[color:var(--line)] bg-[color:var(--accent-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--accent-strong)] disabled:opacity-60"
          >
            {scheduling ? '执行中...' : '执行计划任务'}
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      {loading || !snapshot ? (
        <div className="mt-6 rounded-[1.5rem] bg-white/70 p-5 text-sm text-[color:var(--muted)]">内容自动化数据加载中...</div>
      ) : (
        <div className="mt-6 space-y-6">
          {scheduler && (
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: '本地时间', value: scheduler.localNow },
                { label: '今日已发布', value: `${scheduler.publishedToday}/${scheduler.dailyPublishLimit}` },
                { label: '草稿库存', value: `${scheduler.draftReserveCount}/${scheduler.draftReserveTarget}` },
                { label: '下个发布点', value: scheduler.nextPublishSlotLabel },
              ].map((item) => (
                <div key={item.label} className="soft-card rounded-[1.5rem] p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                  <div className="mt-2 text-xl font-black text-[color:var(--ink)]">{item.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: '已发布内容', value: snapshot.metrics.publishedEntries },
              { label: '草稿库存', value: snapshot.metrics.draftEntries },
              { label: '近 30 日访问', value: snapshot.metrics.pageViews30d },
              { label: '快速分析率', value: `${snapshot.metrics.quickStartRate}%` },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">高转化内容入口</div>
              <div className="grid gap-3">
                {snapshot.topSurfaces.length > 0 ? snapshot.topSurfaces.map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          浏览 {item.views} / 点击 {item.clicks} / 快速分析 {item.quickStarts}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.conversionRate}%</div>
                        <div className="text-xs text-[color:var(--muted)]">转化率</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    目前还没有足够的内容行为数据，等访问累积后这里会给出更稳定的判断。
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">下一轮优先扩张主题</div>
              <div className="grid gap-3">
                {snapshot.generationQueue.map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[color:var(--accent-strong)]">{item.contentType}</div>
                        <div className="text-xs text-[color:var(--muted)]">{item.sourceType === 'radar' ? '热点驱动' : '结构补位'}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">选题：{item.topic}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">内容覆盖缺口</div>
              <div className="grid gap-3">
                {snapshot.clusterCoverage.slice(0, 6).map((item) => (
                  <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="text-xs text-[color:var(--muted)]">优先级 {item.priorityScore}</div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      已发布 {item.publishedCount} / 草稿 {item.draftCount} / 待补 {item.missingTypes.join('、') || '无'}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">关键词：{item.keywords.join('、')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">自动发布候选</div>
              <div className="grid gap-3">
                {snapshot.autoPublishCandidates.length > 0 ? snapshot.autoPublishCandidates.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {item.slug} · {item.source} · 质量分 {item.score}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    当前还没有达到自动发布阈值的草稿，先继续生成和补齐内容层。
                  </div>
                )}
              </div>
            </div>
          </div>

          {scheduler && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">计划任务状态</div>
                <div className="grid gap-3">
                  {[
                    scheduler.publishWindowOpen ? '当前处于发布窗口' : '当前不在发布窗口',
                    scheduler.canPublishNow ? '满足自动发布条件' : '当前不会自动发布',
                    scheduler.needsDraftReplenishment ? '草稿库存低于阈值，需要补稿' : '草稿库存充足',
                    '发布排序会优先参考历史高转化内容类型与热点来源反馈',
                    `固定发布时间：${scheduler.publishHours.map((hour) => `${String(hour).padStart(2, '0')}:00`).join(' / ')}`,
                  ].map((item) => (
                    <div key={item} className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近计划任务记录</div>
                <div className="grid gap-3">
                  {scheduler.recentRuns.length > 0 ? scheduler.recentRuns.map((item) => (
                    <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.reason || '计划任务记录'}</div>
                        <div className="text-xs text-[color:var(--muted)]">{item.createdAt || ''}</div>
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        {item.trigger} · {item.status} · 生成 {item.generatedCount || 0} / 发布 {item.publishedCount || 0}
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                      计划任务还没有执行记录。
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">高转化内容归因</div>
              <div className="grid gap-3">
                {snapshot.contentPerformance.length > 0 ? snapshot.contentPerformance.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.contentType} · {item.origin} · {item.status === 'published' ? '已发布' : '草稿'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.quickStarts}</div>
                        <div className="text-xs text-[color:var(--muted)]">分析发起</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      浏览 {item.views} / 点击 {item.clicks} / 转化率 {item.conversionRate}%
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    当前还没有足够的内容归因数据。
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-[color:var(--muted)]">热点源真实表现</div>
              <div className="grid gap-3">
                {snapshot.radarSourcePerformance.length > 0 ? snapshot.radarSourcePerformance.map((item) => (
                  <div key={item.sourceId} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.sourceLabel}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.platform} · 内容 {item.entryCount} / 已发布 {item.publishedCount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.quickStarts}</div>
                        <div className="text-xs text-[color:var(--muted)]">分析发起</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      浏览 {item.views} / 点击 {item.clicks} / 转化率 {item.conversionRate}%
                    </div>
                    {item.bestTitle && (
                      <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">最佳承接内容：{item.bestTitle}</div>
                    )}
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    目前还没有热点转内容的真实表现数据。
                  </div>
                )}
              </div>
            </div>
          </div>

          {recentTitles.length > 0 && (
            <div className="rounded-[1.5rem] bg-white/70 p-5">
              <div className="text-sm font-semibold text-[color:var(--muted)]">本轮已执行内容</div>
              <div className="mt-3 grid gap-2">
                {recentTitles.map((title) => (
                  <div key={title} className="text-sm text-[color:var(--ink)]">{title}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
