'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ContentAutomationPanel from '@/components/content-automation-panel';
import ContentGenerationPanel from '@/components/content-generation-panel';
import ContentRadarPanel from '@/components/content-radar-panel';
import { listToolCategories, listToolsByCategory, type ToolCategoryKey } from '@/lib/tools';

type ContentType = 'knowledge' | 'case' | 'insight';
type ContentStatus = 'draft' | 'published';

interface ContentEntry {
  id: string;
  contentType: ContentType;
  subtype: string | null;
  slug: string;
  title: string;
  name: string | null;
  excerpt: string;
  category: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  status: ContentStatus;
  source: string;
  meta?: Record<string, unknown>;
  updatedAt: string;
}

interface FormState {
  id: string;
  contentType: ContentType;
  subtype: string;
  slug: string;
  title: string;
  name: string;
  excerpt: string;
  category: string;
  readTime: string;
  tags: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sectionsText: string;
  status: ContentStatus;
  relatedToolSlugs: string;
  relatedReportThemes: string;
  relatedKnowledgeSlugs: string;
  relatedCaseSlugs: string;
  preservedMeta: Record<string, unknown>;
}

interface WorkboardContentFix {
  slug: string;
  title: string;
  contentType: 'knowledge' | 'case';
  pagePath: string;
  views: number;
  bounceRate: number;
  priorityScore: number;
  action: string;
  reason: string;
}

interface WorkboardToolFix {
  slug: string;
  title: string;
  pagePath: string;
  detailViews: number;
  startCtaClicks: number;
  runStarts: number;
  runFailures: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  runRate: number;
  premiumRate: number;
  priorityScore: number;
  action: string;
  reason: string;
}

interface WorkboardToolJourneyGap {
  slug: string;
  title: string;
  pagePath: string;
  detailViews: number;
  startCtaRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  premiumRate: number;
  gapType: 'start_cta' | 'cta_to_run' | 'run_failure' | 'result_to_premium';
  priorityScore: number;
  action: string;
  reason: string;
}

interface WorkboardBouncePage {
  page: string;
  views: number;
  bounceRate: number;
  action: string;
}

interface WorkboardState {
  prioritizedContentFixes: WorkboardContentFix[];
  prioritizedToolFixes: WorkboardToolFix[];
  prioritizedToolJourneyGaps: WorkboardToolJourneyGap[];
  prioritizedBouncePages: WorkboardBouncePage[];
}

interface ToolRepairWorkflowItem {
  slug: string;
  title: string;
  pagePath: string;
  status: 'todo' | 'in_progress' | 'verified';
  owner: string;
  notes: string;
  priorityScore: number;
  gapType: string | null;
  updatedAt: string;
  baseline: {
    detailViews: number;
    ctaStartRate: number;
    ctaToRunRate: number;
    runFailureRate: number;
    premiumRate: number;
  };
  latest: {
    detailViews: number;
    ctaStartRate: number;
    ctaToRunRate: number;
    runFailureRate: number;
    premiumRate: number;
  };
  delta: {
    detailViews: number;
    ctaStartRate: number;
    ctaToRunRate: number;
    runFailureRate: number;
    premiumRate: number;
  };
}

const emptyForm: FormState = {
  id: '',
  contentType: 'knowledge',
  subtype: '',
  slug: '',
  title: '',
  name: '',
  excerpt: '',
  category: '',
  readTime: '',
  tags: '',
  featured: false,
  seoTitle: '',
  seoDescription: '',
  sectionsText: '',
  status: 'draft',
  relatedToolSlugs: '',
  relatedReportThemes: '',
  relatedKnowledgeSlugs: '',
  relatedCaseSlugs: '',
  preservedMeta: {},
};

function formatMetaList(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  if (!Array.isArray(value)) {
    return '';
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .join(', ');
}

function formatSections(sections: ContentEntry['sections']) {
  return sections
    .map((section) => [section.title, ...section.paragraphs].join('\n'))
    .join('\n---\n');
}

function parseSections(text: string) {
  return text
    .split('\n---\n')
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 1)
    .map(([title, ...paragraphs]) => ({ title, paragraphs }));
}

function mergeCsv(source: string, ...items: string[]) {
  return Array.from(new Set([
    ...source.split(',').map((item) => item.trim()).filter(Boolean),
    ...items.map((item) => item.trim()).filter(Boolean),
  ])).join(', ');
}

function toForm(entry: ContentEntry): FormState {
  return {
    id: entry.id,
    contentType: entry.contentType,
    subtype: entry.subtype || '',
    slug: entry.slug,
    title: entry.title,
    name: entry.name || '',
    excerpt: entry.excerpt,
    category: entry.category || '',
    readTime: entry.readTime || '',
    tags: entry.tags.join(', '),
    featured: entry.featured,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
    sectionsText: formatSections(entry.sections),
    status: entry.status,
    relatedToolSlugs: formatMetaList(entry.meta, 'relatedToolSlugs'),
    relatedReportThemes: formatMetaList(entry.meta, 'relatedReportThemes'),
    relatedKnowledgeSlugs: formatMetaList(entry.meta, 'relatedKnowledgeSlugs'),
    relatedCaseSlugs: formatMetaList(entry.meta, 'relatedCaseSlugs'),
    preservedMeta: entry.meta || {},
  };
}

export default function ContentAdminConsole() {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [workboard, setWorkboard] = useState<WorkboardState | null>(null);
  const [toolRepairWorkflow, setToolRepairWorkflow] = useState<ToolRepairWorkflowItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [workboardLoading, setWorkboardLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | ContentType>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<ToolCategoryKey>('career');
  const [bulkThemes, setBulkThemes] = useState('');
  const [bulkToolSlugs, setBulkToolSlugs] = useState('');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [repairStatusFilter, setRepairStatusFilter] = useState<'all' | ToolRepairWorkflowItem['status']>('all');
  const [repairSortMode, setRepairSortMode] = useState<'priority' | 'updated_at' | 'status'>('priority');
  const [repairOwnerFilter, setRepairOwnerFilter] = useState('');
  const [repairMineOnly, setRepairMineOnly] = useState(false);
  const [repairOwnerDrafts, setRepairOwnerDrafts] = useState<Record<string, string>>({});
  const [repairNotesDrafts, setRepairNotesDrafts] = useState<Record<string, string>>({});
  const [repairSavingSlug, setRepairSavingSlug] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '加载内容失败');
        return;
      }
      setEntries(data.entries || []);
    } catch {
      setError('网络异常，无法加载内容');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkboard = async () => {
    setWorkboardLoading(true);
    try {
      const response = await fetch('/api/admin/content/quality', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return;
      }
      setWorkboard(data.workboard || null);
      setToolRepairWorkflow(data.toolRepairWorkflow || []);
    } catch {
      // Non-blocking admin diagnostics.
    } finally {
      setWorkboardLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    loadWorkboard();
  }, []);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((entry) => entry.contentType === filter);
  }, [entries, filter]);
  const filteredToolRepairWorkflow = useMemo(() => {
    const ownerKeyword = repairOwnerFilter.trim().toLowerCase();
    const ownerMine = repairMineOnly ? ownerKeyword : '';
    const filtered = toolRepairWorkflow.filter((item) => {
      if (repairStatusFilter !== 'all' && item.status !== repairStatusFilter) {
        return false;
      }
      if (ownerMine) {
        return (item.owner || '').trim().toLowerCase() === ownerMine;
      }
      if (ownerKeyword) {
        return (item.owner || '').toLowerCase().includes(ownerKeyword);
      }
      return true;
    });

    const statusRank: Record<ToolRepairWorkflowItem['status'], number> = {
      todo: 3,
      in_progress: 2,
      verified: 1,
    };

    return filtered.sort((left, right) => {
      if (repairSortMode === 'updated_at') {
        const leftTime = Date.parse(left.updatedAt || '') || 0;
        const rightTime = Date.parse(right.updatedAt || '') || 0;
        return rightTime - leftTime || right.priorityScore - left.priorityScore;
      }
      if (repairSortMode === 'status') {
        return statusRank[right.status] - statusRank[left.status]
          || right.priorityScore - left.priorityScore;
      }
      return right.priorityScore - left.priorityScore
        || (Date.parse(right.updatedAt || '') || 0) - (Date.parse(left.updatedAt || '') || 0);
    });
  }, [repairMineOnly, repairOwnerFilter, repairSortMode, repairStatusFilter, toolRepairWorkflow]);

  const toolCategories = useMemo(() => listToolCategories(), []);
  const bulkPresetTools = useMemo(
    () => listToolsByCategory(bulkCategory).slice(0, 4),
    [bulkCategory]
  );

  useEffect(() => {
    setRepairOwnerDrafts((current) => {
      const next = { ...current };
      for (const item of toolRepairWorkflow) {
        if (!(item.slug in next)) {
          next[item.slug] = item.owner || '';
        }
      }
      return next;
    });
    setRepairNotesDrafts((current) => {
      const next = { ...current };
      for (const item of toolRepairWorkflow) {
        if (!(item.slug in next)) {
          next[item.slug] = item.notes || '';
        }
      }
      return next;
    });
  }, [toolRepairWorkflow]);

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        id: form.id,
        contentType: form.contentType,
        subtype: form.contentType === 'insight' ? form.subtype || 'industry' : null,
        slug: form.slug.trim(),
        title: form.title.trim(),
        name: form.contentType === 'insight' ? form.name.trim() : null,
        excerpt: form.excerpt.trim(),
        category: form.category.trim() || null,
        readTime: form.contentType === 'knowledge' ? form.readTime.trim() || null : null,
        tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
        featured: form.featured,
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        sections: parseSections(form.sectionsText),
        status: form.status,
        meta: {
          ...form.preservedMeta,
          relatedToolSlugs: form.relatedToolSlugs.split(',').map((item) => item.trim()).filter(Boolean),
          relatedReportThemes: form.relatedReportThemes.split(',').map((item) => item.trim()).filter(Boolean),
          relatedKnowledgeSlugs: form.relatedKnowledgeSlugs.split(',').map((item) => item.trim()).filter(Boolean),
          relatedCaseSlugs: form.relatedCaseSlugs.split(',').map((item) => item.trim()).filter(Boolean),
        },
      };

      if (!payload.slug || !payload.title || !payload.excerpt || !payload.seoTitle || !payload.seoDescription || payload.sections.length === 0) {
        setError('标题、slug、摘要、SEO 字段和正文 sections 都不能为空');
        return;
      }

      const response = await fetch('/api/admin/content', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存失败');
        return;
      }

      setMessage(form.id ? '内容已更新' : '内容已创建');
      setForm(emptyForm);
      await loadEntries();
      await loadWorkboard();
    } catch {
      setError('网络异常，保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除这条内容吗？')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '删除失败');
        return;
      }
      setMessage('内容已删除');
      if (form.id === id) {
        setForm(emptyForm);
      }
      await loadEntries();
      await loadWorkboard();
    } catch {
      setError('网络异常，删除失败');
    }
  };

  const handleGenerated = async (generatedEntries: ContentEntry[], summary: string) => {
    setError('');
    setMessage(summary);
    if (generatedEntries[0]) {
      setForm(toForm(generatedEntries[0]));
    }
    await loadEntries();
    await loadWorkboard();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredEntries.map((entry) => entry.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => {
      if (allSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }
      return Array.from(new Set([...current, ...filteredIds]));
    });
  };

  const applyBulkJourney = async () => {
    const targetEntries = entries.filter((entry) => selectedIds.includes(entry.id));
    if (targetEntries.length === 0) {
      setError('请先选择至少一条内容，再批量编排。');
      return;
    }

    const themeList = bulkThemes.split(',').map((item) => item.trim()).filter(Boolean);
    const toolList = bulkToolSlugs.split(',').map((item) => item.trim()).filter(Boolean);
    if (themeList.length === 0 && toolList.length === 0) {
      setError('请至少填写一个报告主轴或工具 slug。');
      return;
    }

    setBulkApplying(true);
    setError('');
    setMessage('');

    try {
      await Promise.all(targetEntries.map(async (entry) => {
        const existingMeta = entry.meta || {};
        const existingThemes = Array.isArray(existingMeta.relatedReportThemes) ? existingMeta.relatedReportThemes : [];
        const existingTools = Array.isArray(existingMeta.relatedToolSlugs) ? existingMeta.relatedToolSlugs : [];
        const response = await fetch('/api/admin/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...entry,
            meta: {
              ...existingMeta,
              relatedReportThemes: Array.from(new Set([
                ...existingThemes.filter((item): item is string => typeof item === 'string'),
                ...themeList,
              ])),
              relatedToolSlugs: Array.from(new Set([
                ...existingTools.filter((item): item is string => typeof item === 'string'),
                ...toolList,
              ])),
            },
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || `批量保存失败: ${entry.title}`);
        }
      }));

      setMessage(`已为 ${targetEntries.length} 条内容批量挂上协同关系。`);
      await loadEntries();
      await loadWorkboard();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : '批量编排失败');
    } finally {
      setBulkApplying(false);
    }
  };

  const updateRepairWorkflow = async (
    slug: string,
    patch: { status?: ToolRepairWorkflowItem['status']; owner?: string; notes?: string }
  ) => {
    if (repairSavingSlug) {
      return;
    }
    setRepairSavingSlug(slug);
    try {
      const response = await fetch('/api/admin/content/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          ...patch,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '更新工单失败');
        return;
      }
      setWorkboard(data.workboard || null);
      setToolRepairWorkflow(data.toolRepairWorkflow || []);
      setMessage('工具修复工单已更新');
    } catch {
      setError('网络异常，更新工单失败');
    } finally {
      setRepairSavingSlug(null);
    }
  };

  const applyPresetCategory = () => {
    const categoryInfo = toolCategories.find((item) => item.key === bulkCategory);
    setBulkThemes((current) => mergeCsv(current, categoryInfo?.title || bulkCategory));
    setBulkToolSlugs((current) => mergeCsv(current, ...bulkPresetTools.map((item) => item.slug)));
  };

  const saveRepairMeta = async (slug: string) => {
    const item = toolRepairWorkflow.find((entry) => entry.slug === slug);
    if (!item) {
      return;
    }
    const owner = (repairOwnerDrafts[slug] || '').trim();
    const notes = (repairNotesDrafts[slug] || '').trim();
    if (owner === (item.owner || '').trim() && notes === (item.notes || '').trim()) {
      setMessage('负责人和备注没有变化');
      return;
    }
    await updateRepairWorkflow(slug, {
      owner: repairOwnerDrafts[slug] || '',
      notes: repairNotesDrafts[slug] || '',
    });
  };

  return (
    <div id="content-operations-console" className="space-y-6">
      <ContentRadarPanel onAutomationCompleted={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
        await loadWorkboard();
      }} onContentGenerated={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
        await loadWorkboard();
      }} />

      <ContentAutomationPanel onCompleted={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
        await loadWorkboard();
      }} />

      <ContentGenerationPanel onGenerated={handleGenerated} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="glass-panel rounded-[var(--radius-md)] p-6 xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">今日修复工作台</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">修复工作台</div>
            </div>
            <div className="space-y-2">
              <div className="action-guide">主动作</div>
              <button
                type="button"
                onClick={loadWorkboard}
                className="action-primary"
              >
                刷新修复清单
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { label: '内容待修', value: workboard?.prioritizedContentFixes?.length || 0 },
              { label: '跳出页', value: workboard?.prioritizedBouncePages?.length || 0 },
              { label: '工具待修', value: workboard?.prioritizedToolFixes?.length || 0 },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-[var(--radius-md)] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3">
            {workboardLoading ? (
              <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">加载中...</div>
            ) : workboard?.prioritizedContentFixes?.length ? workboard.prioritizedContentFixes.slice(0, 6).map((item, index) => (
              <div key={`${item.contentType}-${item.slug}`} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · ${item.contentType}`}</div>
                    <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <a href={item.pagePath} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                      {item.pagePath}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 font-semibold text-[color:var(--accent-strong)]">优先级 {item.priorityScore}</span>
                    <span className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">PV {item.views}</span>
                    <span className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">跳出 {item.bounceRate}%</span>
                  </div>
                </div>
                <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.action}</div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">{item.reason}</div>
              </div>
            )) : (
              <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
                <div className="text-sm font-semibold text-[color:var(--ink)]">暂无内容修复样本</div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[var(--radius-md)] p-6">
          <div className="text-sm font-semibold text-[color:var(--muted)]">高跳出页</div>
          <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{workboard?.prioritizedBouncePages?.length || 0}</div>
          <div className="mt-4 grid gap-3">
            {workboardLoading ? (
              <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">加载中...</div>
            ) : workboard?.prioritizedBouncePages?.length ? workboard.prioritizedBouncePages.slice(0, 6).map((item) => (
              <div key={item.page} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.page}</div>
                  <div className="text-xs font-semibold text-[color:var(--data-down)]">{`跳出 ${item.bounceRate}%`}</div>
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">{`PV ${item.views}`}</div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">{item.action}</div>
              </div>
            )) : (
              <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
                <div className="text-sm font-semibold text-[color:var(--ink)]">暂无高跳出页样本</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[var(--radius-md)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具修复联动作战板</div>
            <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">工具修复板</div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs font-semibold text-[color:var(--accent-strong)]">
            当前待修 {workboard?.prioritizedToolFixes?.length || 0} 个工具
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {workboardLoading ? (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">加载中...</div>
          ) : workboard?.prioritizedToolFixes?.length ? workboard.prioritizedToolFixes.slice(0, 6).map((item, index) => (
            <div key={item.slug} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · tool`}</div>
                  <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                </div>
                <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {`优先级 ${item.priorityScore}`}
                </div>
              </div>
              <a href={item.pagePath} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                {item.pagePath}
              </a>
              <div className="mt-3 grid gap-2 text-xs text-[color:var(--muted)] sm:grid-cols-3">
                <div>{`PV ${item.detailViews}`}</div>
                <div>{`首屏点击 ${item.ctaStartRate}%`}</div>
                <div>{`点击到开跑 ${item.ctaToRunRate}%`}</div>
                <div>{`开跑 ${item.runRate}%`}</div>
                <div>{`失败 ${item.runFailureRate}%`}</div>
                <div>{`专项 ${item.premiumRate}%`}</div>
              </div>
              <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.action}</div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">{item.reason}</div>
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              <div className="text-sm font-semibold text-[color:var(--ink)]">暂无工具修复样本</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-[var(--radius-md)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具修复执行队列</div>
            <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">修复执行队列</div>
          </div>
          <div className="space-y-2">
            <div className="action-guide">主动作</div>
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRepairStatusFilter('all')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${repairStatusFilter === 'all' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]'}`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setRepairStatusFilter('todo')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${repairStatusFilter === 'todo' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]'}`}
            >
              待修
            </button>
            <button
              type="button"
              onClick={() => setRepairStatusFilter('in_progress')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${repairStatusFilter === 'in_progress' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]'}`}
            >
              进行中
            </button>
            <button
              type="button"
              onClick={() => setRepairStatusFilter('verified')}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${repairStatusFilter === 'verified' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]'}`}
            >
              已验证
            </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            { label: '全部工单', value: toolRepairWorkflow.length },
            { label: '待修', value: toolRepairWorkflow.filter((item) => item.status === 'todo').length },
            { label: '进行中', value: toolRepairWorkflow.filter((item) => item.status === 'in_progress').length },
            { label: '已验证', value: toolRepairWorkflow.filter((item) => item.status === 'verified').length },
          ].map((item) => (
            <div key={item.label} className="soft-card rounded-[var(--radius-md)] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={repairOwnerFilter}
            onChange={(event) => setRepairOwnerFilter(event.target.value)}
            placeholder="负责人筛选（输入名字后可点只看我负责）"
            className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-xs"
          />
          <select
            value={repairSortMode}
            onChange={(event) => setRepairSortMode(event.target.value as 'priority' | 'updated_at' | 'status')}
            className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-xs"
          >
            <option value="priority">按优先级排序</option>
            <option value="updated_at">按最近更新时间排序</option>
            <option value="status">按状态排序（待修优先）</option>
          </select>
          <button
            type="button"
            onClick={() => setRepairMineOnly((current) => !current)}
            className={`rounded-[var(--radius)] border px-4 py-2 text-xs font-semibold ${repairMineOnly ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--ink)]'}`}
          >
            {repairMineOnly ? '已开启只看我负责' : '只看我负责'}
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {workboardLoading ? (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">执行队列加载中...</div>
          ) : filteredToolRepairWorkflow.length ? filteredToolRepairWorkflow.slice(0, 12).map((item) => (
            <div key={`repair-flow-${item.slug}`} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              {(() => {
                const isSaving = repairSavingSlug === item.slug;
                const ownerDraft = (repairOwnerDrafts[item.slug] || '').trim();
                const notesDraft = (repairNotesDrafts[item.slug] || '').trim();
                const ownerCurrent = (item.owner || '').trim();
                const notesCurrent = (item.notes || '').trim();
                const canSaveMeta = !isSaving && (ownerDraft !== ownerCurrent || notesDraft !== notesCurrent);
                return (
                  <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{mapRepairStatusLabel(item.status)}</div>
                  <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  <a href={item.pagePath} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                    {item.pagePath}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateRepairWorkflow(item.slug, { status: 'todo' })}
                    disabled={isSaving}
                    className="action-secondary min-h-0 px-3 py-1 text-xs"
                  >
                    待修
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRepairWorkflow(item.slug, { status: 'in_progress' })}
                    disabled={isSaving}
                    className="action-secondary min-h-0 px-3 py-1 text-xs"
                  >
                    进行中
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRepairWorkflow(item.slug, { status: 'verified' })}
                    disabled={isSaving}
                    className="rounded-full border border-[color:var(--line)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]"
                  >
                    已验证
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  value={repairOwnerDrafts[item.slug] || ''}
                  onChange={(event) => setRepairOwnerDrafts((current) => ({ ...current, [item.slug]: event.target.value }))}
                  placeholder="负责人（例如：内容组-A）"
                  className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => saveRepairMeta(item.slug)}
                  disabled={!canSaveMeta}
                  className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存负责人与备注'}
                </button>
                <textarea
                  value={repairNotesDrafts[item.slug] || ''}
                  onChange={(event) => setRepairNotesDrafts((current) => ({ ...current, [item.slug]: event.target.value }))}
                  placeholder="修复备注：本次改了什么、预期修复哪个断点"
                  rows={3}
                  className="md:col-span-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-2 text-xs"
                />
              </div>

              <div className="mt-3 grid gap-2 text-xs text-[color:var(--muted)] sm:grid-cols-5">
                <div>{`基线点击 ${item.baseline.ctaStartRate}%`}</div>
                <div>{`当前点击 ${item.latest.ctaStartRate}%`}</div>
                <div>{`基线开跑 ${item.baseline.ctaToRunRate}%`}</div>
                <div>{`当前开跑 ${item.latest.ctaToRunRate}%`}</div>
                <div>{`失败变化 ${item.delta.runFailureRate > 0 ? '+' : ''}${item.delta.runFailureRate}%`}</div>
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                {`点击变化 ${item.delta.ctaStartRate > 0 ? '+' : ''}${item.delta.ctaStartRate}% · 开跑变化 ${item.delta.ctaToRunRate > 0 ? '+' : ''}${item.delta.ctaToRunRate}% · 专项变化 ${item.delta.premiumRate > 0 ? '+' : ''}${item.delta.premiumRate}%`}
              </div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                {`负责人：${item.owner || '未指定'} · 最近更新：${item.updatedAt || '-'}`}
              </div>
                  </>
                );
              })()}
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              <div className="text-sm font-semibold text-[color:var(--ink)]">暂无匹配工单</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-[var(--radius-md)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具漏斗断点清单</div>
            <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">漏斗断点清单</div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs font-semibold text-[color:var(--muted)]">
            当前断点 {workboard?.prioritizedToolJourneyGaps?.length || 0} 个
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {workboardLoading ? (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">漏斗断点加载中...</div>
          ) : workboard?.prioritizedToolJourneyGaps?.length ? workboard.prioritizedToolJourneyGaps.slice(0, 8).map((item, index) => (
            <div key={`tool-gap-${item.slug}`} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · ${mapGapTypeLabel(item.gapType)}`}</div>
                  <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                </div>
                <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {`优先级 ${item.priorityScore}`}
                </div>
              </div>
              <a href={item.pagePath} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                {item.pagePath}
              </a>
              <div className="mt-3 grid gap-2 text-xs text-[color:var(--muted)] sm:grid-cols-3">
                <div>{`PV ${item.detailViews}`}</div>
                <div>{`首屏点击 ${item.startCtaRate}%`}</div>
                <div>{`点击到开跑 ${item.ctaToRunRate}%`}</div>
                <div>{`失败 ${item.runFailureRate}%`}</div>
                <div>{`专项 ${item.premiumRate}%`}</div>
              </div>
              <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.action}</div>
              <div className="mt-2 text-xs text-[color:var(--muted)]">{item.reason}</div>
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--paper)] px-4 py-4">
              <div className="text-sm font-semibold text-[color:var(--ink)]">暂无工具漏斗样本</div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">批量协同编排</div>
            <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">批量协同编排</div>
          </div>
          <div className="space-y-2">
            <div className="action-guide">主动作</div>
            <button
              type="button"
              onClick={applyBulkJourney}
              disabled={bulkApplying}
              className="action-primary disabled:opacity-60"
            >
              {bulkApplying ? '批量保存中...' : `批量挂到协同路径${selectedIds.length > 0 ? `（${selectedIds.length} 条）` : ''}`}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="批量主分类">
            <select
              value={bulkCategory}
              onChange={(event) => setBulkCategory(event.target.value as ToolCategoryKey)}
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
            >
              {toolCategories.map((item) => (
                <option key={item.key} value={item.key}>{item.title}</option>
              ))}
            </select>
          </Field>
          <Field label="报告主轴">
            <input
              value={bulkThemes}
              onChange={(event) => setBulkThemes(event.target.value)}
              placeholder="事业, 岗位, 恢复"
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
            />
          </Field>
          <Field label="工具 Slugs">
            <input
              value={bulkToolSlugs}
              onChange={(event) => setBulkToolSlugs(event.target.value)}
              placeholder="career-role-fit, health-recovery-window"
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
            />
          </Field>
          <Field label="快捷动作">
            <button
              type="button"
              onClick={applyPresetCategory}
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
            >
              载入该分类推荐工具
            </button>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {bulkPresetTools.map((item) => (
            <span key={item.slug} className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
              {item.shortTitle}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
          当前已选择 {selectedIds.length} 条内容
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">内容列表</div>
                <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">{entries.length} 条</div>
              </div>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as 'all' | ContentType)}
                className="action-secondary min-h-0 px-4 py-2 text-sm"
              >
                <option value="all">全部类型</option>
                <option value="knowledge">知识库</option>
                <option value="case">案例库</option>
                <option value="insight">洞察中心</option>
              </select>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="action-secondary min-h-0 px-4 py-2"
              >
                当前筛选全选 / 取消
              </button>
              <div className="rounded-full bg-[color:var(--bg-elevated)] px-4 py-2 text-sm text-[color:var(--muted)]">
                已勾选 {selectedIds.length} 条
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="soft-card rounded-[var(--radius-md)] p-6 text-sm text-[color:var(--muted)]">内容加载中...</div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="soft-card rounded-[var(--radius-md)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => toggleSelected(entry.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                        {entry.contentType} · {entry.status} · {entry.source}
                      </div>
                      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{entry.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{entry.slug}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(toForm(entry))}
                        className="action-secondary min-h-0 px-3 py-2"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(entry.id)}
                        className="rounded-full border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--data-down)]"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div id="content-editor-panel" className="glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">编辑器</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">{form.id ? '编辑内容' : '新建内容'}</div>
            </div>
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="action-secondary min-h-0 px-4 py-2"
            >
              新建
            </button>
          </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="内容类型">
            <select
              value={form.contentType}
              onChange={(event) => setForm((prev) => ({ ...prev, contentType: event.target.value as ContentType }))}
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
            >
              <option value="knowledge">知识库</option>
              <option value="case">案例库</option>
              <option value="insight">洞察中心</option>
            </select>
          </Field>
          <Field label="发布状态">
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ContentStatus }))}
              className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </Field>
          {form.contentType === 'insight' && (
            <Field label="洞察子类型">
              <select
                value={form.subtype}
                onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              >
                <option value="industry">行业</option>
                <option value="city">城市</option>
                <option value="company">组织</option>
              </select>
            </Field>
          )}
          <Field label="精选推荐">
            <label className="flex h-[52px] items-center rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm text-[color:var(--ink)]">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
                className="mr-3"
              />
              首页 / 结果页推荐位
            </label>
          </Field>
          <Field label="Slug">
            <input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          <Field label="标题">
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          {form.contentType === 'insight' && (
            <Field label="实体名称">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
            </Field>
          )}
          <Field label={form.contentType === 'knowledge' ? '分类' : '场景 / 标签'}>
            <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          {form.contentType === 'knowledge' && (
            <Field label="阅读时长">
              <input value={form.readTime} onChange={(event) => setForm((prev) => ({ ...prev, readTime: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
            </Field>
          )}
          <Field label="标签（逗号分隔）">
            <input value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
        </div>

        <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[color:var(--line)] bg-[color:var(--bg-elevated)] p-5">
          <div className="text-sm font-semibold text-[color:var(--ink)]">协同编排字段</div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="关联工具 Slugs">
              <input
                value={form.relatedToolSlugs}
                onChange={(event) => setForm((prev) => ({ ...prev, relatedToolSlugs: event.target.value }))}
                placeholder="career-role-fit, relationship-pace-fit"
                className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              />
            </Field>
            <Field label="关联报告主轴">
              <input
                value={form.relatedReportThemes}
                onChange={(event) => setForm((prev) => ({ ...prev, relatedReportThemes: event.target.value }))}
                placeholder="事业, 岗位, 恢复, 迁移"
                className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              />
            </Field>
            <Field label="关联知识文章 Slugs">
              <input
                value={form.relatedKnowledgeSlugs}
                onChange={(event) => setForm((prev) => ({ ...prev, relatedKnowledgeSlugs: event.target.value }))}
                placeholder="world-yi-methodology, world-yi-relationship-order"
                className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              />
            </Field>
            <Field label="关联案例 Slugs">
              <input
                value={form.relatedCaseSlugs}
                onChange={(event) => setForm((prev) => ({ ...prev, relatedCaseSlugs: event.target.value }))}
                placeholder="world-yi-case-return-or-stay"
                className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="摘要">
            <textarea value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} className="min-h-[110px] w-full rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          <Field label="SEO 标题">
            <input value={form.seoTitle} onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))} className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          <Field label="SEO 描述">
            <textarea value={form.seoDescription} onChange={(event) => setForm((prev) => ({ ...prev, seoDescription: event.target.value }))} className="min-h-[90px] w-full rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-sm" />
          </Field>
          <Field label="正文 Sections">
            <textarea
              value={form.sectionsText}
              onChange={(event) => setForm((prev) => ({ ...prev, sectionsText: event.target.value }))}
              placeholder={'每段 section 用如下格式：\n标题\n段落一\n段落二\n---\n下一个标题\n段落一'}
              className="min-h-[260px] w-full rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3 text-xs leading-6"
            />
          </Field>
        </div>

        {message && <p className="mt-4 text-sm text-[color:var(--data-up)]">{message}</p>}
        {error && <p className="mt-4 text-sm text-[color:var(--data-down)]">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? '保存中...' : form.id ? '更新内容' : '创建内容'}
        </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[color:var(--ink)]">{label}</div>
      {children}
    </label>
  );
}

function mapGapTypeLabel(gapType: WorkboardToolJourneyGap['gapType']) {
  if (gapType === 'start_cta') return '首屏点击断层';
  if (gapType === 'cta_to_run') return '点击到开跑断层';
  if (gapType === 'run_failure') return '运行失败断层';
  return '结果到专项断层';
}

function mapRepairStatusLabel(status: ToolRepairWorkflowItem['status']) {
  if (status === 'in_progress') return '进行中';
  if (status === 'verified') return '已验证';
  return '待修';
}
