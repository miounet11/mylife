'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

type ContentType = 'knowledge' | 'case' | 'insight';
type ContentStatus = 'draft' | 'published';
type GenerateMode = 'single' | 'cluster';
type InsightSubtype = 'industry' | 'city' | 'company';

type ContentEntry = {
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
};

interface GeneratorState {
  mode: GenerateMode;
  contentType: ContentType;
  subtype: InsightSubtype;
  topic: string;
  angle: string;
  platform: string;
  keywords: string;
  audience: string;
  entityName: string;
  sourceSignals: string;
  status: ContentStatus;
  featured: boolean;
}

const initialState: GeneratorState = {
  mode: 'single',
  contentType: 'knowledge',
  subtype: 'industry',
  topic: '',
  angle: '',
  platform: 'seo',
  keywords: '',
  audience: '',
  entityName: '',
  sourceSignals: '',
  status: 'draft',
  featured: false,
};

export default function ContentGenerationPanel({
  onGenerated,
}: {
  onGenerated: (entries: ContentEntry[], summary: string) => void;
}) {
  const [form, setForm] = useState<GeneratorState>(initialState);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lastGenerated, setLastGenerated] = useState<ContentEntry[]>([]);

  const generate = async () => {
    const topic = form.topic.trim();
    if (!topic) {
      setError('请先填写主题');
      return;
    }

    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: form.mode,
          contentType: form.mode === 'single' ? form.contentType : undefined,
          subtype: form.subtype,
          topic,
          angle: form.angle.trim(),
          platform: form.platform.trim(),
          keywords: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
          audience: form.audience.trim(),
          entityName: form.entityName.trim(),
          sourceSignals: form.sourceSignals.trim(),
          status: form.status,
          featured: form.featured,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'AI 生成失败');
        return;
      }

      const entries = (data.entries || []) as ContentEntry[];
      const meta = data.meta || {};
      const summary = `已生成 ${entries.length} 条草稿，LLM 成功 ${meta.llmSucceededCount || 0} 条${meta.fallbackCount ? `，回退 ${meta.fallbackCount} 条` : ''}`;
      setMessage(summary);
      setLastGenerated(entries);
      onGenerated(entries, summary);
    } catch {
      setError('网络异常，AI 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[color:var(--muted)]">AI 内容生成</div>
          <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">用现有 LLM 直接起草内容库</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="生成模式">
          <select
            value={form.mode}
            onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value as GenerateMode }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
          >
            <option value="single">单篇生成</option>
            <option value="cluster">一键生成知识 + 案例 + 洞察</option>
          </select>
        </Field>

        {form.mode === 'single' ? (
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
        ) : (
          <Field label="洞察类型">
            <select
              value={form.subtype}
              onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value as InsightSubtype }))}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            >
              <option value="industry">行业洞察</option>
              <option value="city">城市洞察</option>
              <option value="company">组织洞察</option>
            </select>
          </Field>
        )}

        {form.mode === 'single' && form.contentType === 'insight' && (
          <Field label="洞察类型">
            <select
              value={form.subtype}
              onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value as InsightSubtype }))}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            >
              <option value="industry">行业洞察</option>
              <option value="city">城市洞察</option>
              <option value="company">组织洞察</option>
            </select>
          </Field>
        )}

        <Field label="平台来源">
          <input
            value={form.platform}
            onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="seo / 抖音 / 快手 / TikTok / X"
          />
        </Field>

        <Field label="主题">
          <input
            value={form.topic}
            onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="例如：2026 年换工作该怎么看时机"
          />
        </Field>

        <Field label="切入角度">
          <input
            value={form.angle}
            onChange={(event) => setForm((prev) => ({ ...prev, angle: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="例如：普通用户最容易踩的误区"
          />
        </Field>

        <Field label="关键词">
          <input
            value={form.keywords}
            onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="逗号分隔"
          />
        </Field>

        <Field label="目标人群">
          <input
            value={form.audience}
            onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="例如：25-35 岁职场用户"
          />
        </Field>

        <Field label="实体名">
          <input
            value={form.entityName}
            onChange={(event) => setForm((prev) => ({ ...prev, entityName: event.target.value }))}
            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm"
            placeholder="洞察类可填写城市 / 行业 / 公司名"
          />
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

        <Field label="精选推荐">
          <label className="flex h-[52px] items-center rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
              className="mr-3"
            />
            进入推荐位
          </label>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="补充信号">
          <textarea
            value={form.sourceSignals}
            onChange={(event) => setForm((prev) => ({ ...prev, sourceSignals: event.target.value }))}
            className="min-h-[110px] w-full rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-7"
            placeholder="把你收集到的平台热词、评论区问题、选题备注直接贴进来"
          />
        </Field>
      </div>

      {message && <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}

      <button
        type="button"
        onClick={generate}
        disabled={generating}
        className="mt-6 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {generating ? '生成中...' : form.mode === 'cluster' ? '生成整组选题草稿' : '生成内容草稿'}
      </button>

      {lastGenerated.length > 0 && (
        <div className="mt-6 space-y-3">
          {lastGenerated.map((entry) => (
            <div key={entry.id} className="soft-card rounded-[1.5rem] p-4">
              <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">
                {entry.contentType} · {entry.status} · {entry.source}
              </div>
              <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{entry.title}</div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">{entry.slug}</div>
            </div>
          ))}
        </div>
      )}
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
