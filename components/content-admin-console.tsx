'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ContentAutomationPanel from '@/components/content-automation-panel';
import ContentGenerationPanel from '@/components/content-generation-panel';
import ContentRadarPanel from '@/components/content-radar-panel';

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
};

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
  };
}

export default function ContentAdminConsole() {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | ContentType>('all');

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

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((entry) => entry.contentType === filter);
  }, [entries, filter]);

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
  };

  return (
    <div className="space-y-6">
      <ContentRadarPanel onAutomationCompleted={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
      }} onContentGenerated={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
      }} />

      <ContentAutomationPanel onCompleted={async (summary) => {
        setMessage(summary);
        setError('');
        await loadEntries();
      }} />

      <ContentGenerationPanel onGenerated={handleGenerated} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">内容列表</div>
                <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">{entries.length} 条</div>
              </div>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as 'all' | ContentType)}
                className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm text-[color:var(--ink)]"
              >
                <option value="all">全部类型</option>
                <option value="knowledge">知识库</option>
                <option value="case">案例库</option>
                <option value="insight">洞察中心</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="soft-card rounded-[1.75rem] p-6 text-sm text-[color:var(--muted)]">内容加载中...</div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="soft-card rounded-[1.75rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                        {entry.contentType} · {entry.status} · {entry.source}
                      </div>
                      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{entry.title}</div>
                      <div className="mt-1 text-sm leading-7 text-[color:var(--muted)]">{entry.slug}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(toForm(entry))}
                        className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--ink)]"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(entry.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
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

        <div className="glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">编辑器</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">{form.id ? '编辑内容' : '新建内容'}</div>
            </div>
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
            >
              新建
            </button>
          </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="内容类型">
            <select
              value={form.contentType}
              onChange={(event) => setForm((prev) => ({ ...prev, contentType: event.target.value as ContentType }))}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
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
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
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
                className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
              >
                <option value="industry">行业</option>
                <option value="city">城市</option>
                <option value="company">组织</option>
              </select>
            </Field>
          )}
          <Field label="精选推荐">
            <label className="flex h-[52px] items-center rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]">
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
            <input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          <Field label="标题">
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          {form.contentType === 'insight' && (
            <Field label="实体名称">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
            </Field>
          )}
          <Field label={form.contentType === 'knowledge' ? '分类' : '场景 / 标签'}>
            <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          {form.contentType === 'knowledge' && (
            <Field label="阅读时长">
              <input value={form.readTime} onChange={(event) => setForm((prev) => ({ ...prev, readTime: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
            </Field>
          )}
          <Field label="标签（逗号分隔）">
            <input value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="摘要">
            <textarea value={form.excerpt} onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))} className="min-h-[110px] w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          <Field label="SEO 标题">
            <input value={form.seoTitle} onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))} className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          <Field label="SEO 描述">
            <textarea value={form.seoDescription} onChange={(event) => setForm((prev) => ({ ...prev, seoDescription: event.target.value }))} className="min-h-[90px] w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm" />
          </Field>
          <Field label="正文 Sections">
            <textarea
              value={form.sectionsText}
              onChange={(event) => setForm((prev) => ({ ...prev, sectionsText: event.target.value }))}
              placeholder={'每段 section 用如下格式：\n标题\n段落一\n段落二\n---\n下一个标题\n段落一'}
              className="min-h-[260px] w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-7"
            />
          </Field>
        </div>

        {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

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
