'use client';

import { useEffect, useMemo, useState } from 'react';

type ProviderPurpose = 'image' | 'article';

type ProviderItem = {
  id: string;
  purpose: ProviderPurpose;
  name: string;
  baseUrl: string;
  model: string;
  priority: number;
  enabled: boolean;
  timeoutMs: number | null;
  maxRetries: number;
  hasApiKey?: boolean;
  apiKeyMasked?: string;
  source?: string;
  updatedAt?: string;
};

type FormState = {
  id: string;
  purpose: ProviderPurpose;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  priority: string;
  enabled: boolean;
  timeoutMs: string;
  maxRetries: string;
};

const emptyForm: FormState = {
  id: '',
  purpose: 'image',
  name: 'ttqq image primary (z-image-turbo)',
  baseUrl: 'https://ttqq.inping.com/v1',
  model: 'z-image-turbo',
  apiKey: '',
  priority: '10',
  enabled: true,
  timeoutMs: '180000',
  maxRetries: '0',
};

function toForm(provider: ProviderItem): FormState {
  return {
    id: provider.id,
    purpose: provider.purpose,
    name: provider.name,
    baseUrl: provider.baseUrl,
    model: provider.model,
    apiKey: '',
    priority: String(provider.priority),
    enabled: provider.enabled,
    timeoutMs: provider.timeoutMs ? String(provider.timeoutMs) : '',
    maxRetries: String(provider.maxRetries || 0),
  };
}

export default function LlmProviderConsole() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const grouped = useMemo(() => ({
    image: providers.filter((provider) => provider.purpose === 'image'),
    article: providers.filter((provider) => provider.purpose === 'article'),
  }), [providers]);

  const loadProviders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/llm-providers', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '加载 LLM 配置失败');
        return;
      }
      setProviders(data.providers || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载 LLM 配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const saveProvider = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/llm-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          purpose: form.purpose,
          name: form.name,
          baseUrl: form.baseUrl,
          model: form.model,
          apiKey: form.apiKey || undefined,
          priority: Number(form.priority || 100),
          enabled: form.enabled,
          timeoutMs: form.timeoutMs ? Number(form.timeoutMs) : null,
          maxRetries: Number(form.maxRetries || 0),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存失败');
        return;
      }
      setMessage('已保存 LLM Provider 配置');
      setForm({ ...emptyForm, purpose: form.purpose });
      await loadProviders();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (id: string) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/llm-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '删除失败');
        return;
      }
      setMessage('已删除 LLM Provider 配置');
      await loadProviders();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-panel rounded-[var(--radius-md)] p-5">
        <div className="section-label">LLM Provider</div>
        <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)]">生成模型配置</h2>
        <p className="intro-copy mt-3">
          配置图片生成和文章生成的 OpenAI-compatible Provider。优先级数字越小越先请求；失败后自动尝试下一项。
        </p>

        <div className="mt-5 grid gap-3">
          <label className="text-sm font-semibold text-[color:var(--ink)]">
            用途
            <select
              value={form.purpose}
              onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value as ProviderPurpose }))}
              className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2"
            >
              <option value="image">图片生成</option>
              <option value="article">文章生成</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[color:var(--ink)]">
            名称
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold text-[color:var(--ink)]">
            Base URL
            <input value={form.baseUrl} onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold text-[color:var(--ink)]">
            模型
            <input value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold text-[color:var(--ink)]">
            API Key
            <input type="password" value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} placeholder="留空则保留原 key" className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-[color:var(--ink)]">
              优先级
              <input value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink)]">
              超时 ms
              <input value={form.timeoutMs} onChange={(event) => setForm((current) => ({ ...current, timeoutMs: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink)]">
              重试
              <input value={form.maxRetries} onChange={(event) => setForm((current) => ({ ...current, maxRetries: event.target.value }))} className="mt-2 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-2" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
            启用
          </label>
          <button type="button" onClick={saveProvider} disabled={saving} className="action-primary justify-center">
            {saving ? '保存中...' : '保存配置'}
          </button>
          {message ? <div className="rounded-[var(--radius)] bg-[color:rgba(47,125,82,0.10)] p-3 text-sm font-semibold text-[color:var(--data-up)]">{message}</div> : null}
          {error ? <div className="rounded-[var(--radius)] bg-[color:var(--alert-soft)] p-3 text-sm font-semibold text-[color:var(--data-down)]">{error}</div> : null}
        </div>
      </div>

      <div className="space-y-5">
        {loading ? <div className="soft-card rounded-[var(--radius-md)] p-5">加载中...</div> : null}
        {(['image', 'article'] as ProviderPurpose[]).map((purpose) => (
          <div key={purpose} className="soft-card rounded-[var(--radius-md)] p-5">
            <div className="text-sm font-semibold text-[color:var(--muted)]">{purpose === 'image' ? '图片生成 Provider' : '文章生成 Provider'}</div>
            <div className="mt-4 grid gap-3">
              {grouped[purpose].map((provider) => (
                <div key={provider.id} className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-base font-bold text-[color:var(--ink)]">{provider.name}</div>
                      <div className="mt-1 text-sm text-[color:var(--muted)]">{provider.model} · priority {provider.priority} · {provider.enabled ? 'enabled' : 'disabled'}</div>
                      <div className="mt-1 break-all text-xs text-[color:var(--muted)]">{provider.baseUrl}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">Key: {provider.apiKeyMasked || (provider.hasApiKey ? '已配置' : '未配置')}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setForm(toForm(provider))} className="action-secondary">编辑</button>
                      <button type="button" onClick={() => deleteProvider(provider.id)} disabled={saving} className="action-secondary">删除</button>
                    </div>
                  </div>
                </div>
              ))}
              {grouped[purpose].length === 0 ? <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] p-4 text-sm text-[color:var(--muted)]">暂无配置</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
