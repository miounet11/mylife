'use client';

/**
 * 起名中心 · 表单页
 * 提交 → /api/naming/run → 结果页（带超时与明确错误）
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { NamingMode } from '@/lib/naming';
import {
  COMPANY_ENTITY_FORMS,
  COMPANY_JURISDICTIONS,
  type CompanyEntityForm,
  type CompanyJurisdiction,
} from '@/lib/naming/company-entity';

type Props = { locale?: string };

const MODES: Array<{ id: NamingMode; label: string; hint: string }> = [
  { id: 'person', label: '个人起名', hint: '姓 + 性别 + 用神（可选）→ AI 方案页' },
  { id: 'company', label: '公司起名', hint: '字号 + 行业 + 法域主体 → 可注册格式全称' },
  { id: 'product', label: '产品起名', hint: '品类 + 卖点 + 风格 → AI 产品名方案页' },
];

export function NamingLabApp({ locale: _locale }: Props) {
  const [mode, setMode] = useState<NamingMode>('company');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const [surname, setSurname] = useState('李');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [yongShen, setYongShen] = useState('');
  const [generationChar, setGenerationChar] = useState('');
  const [enableWuge, setEnableWuge] = useState(false);

  // company
  const [tradeName, setTradeName] = useState('伙计');
  const [industry, setIndustry] = useState('科技');
  const [keywords, setKeywords] = useState('智能,云');
  const [region, setRegion] = useState('');
  const [jurisdiction, setJurisdiction] = useState<CompanyJurisdiction>('CN');
  const [entityForm, setEntityForm] = useState<CompanyEntityForm>('co_ltd');
  const [preferredLength, setPreferredLength] = useState<2 | 3>(2);

  const [category, setCategory] = useState('应用');
  const [productKw, setProductKw] = useState('轻,快');
  const [style, setStyle] = useState<'steady' | 'tech' | 'guofeng' | 'global'>('tech');

  const modeMeta = useMemo(() => MODES.find((m) => m.id === mode)!, [mode]);

  const linkBazi = async () => {
    setLinking(true);
    setError(null);
    try {
      const res = await fetch('/api/fengshui/space/link-bazi');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '未找到命盘');
      const ys = (data.profileLink?.yongShen || []) as string[];
      setYongShen(ys.join('、'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '关联失败');
    } finally {
      setLinking(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus('1/3 生成结构候选…');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    try {
      const body: Record<string, unknown> = {
        mode,
        enableWuge,
        useLlm: true,
        count: 20,
      };
      if (mode === 'person') {
        if (!surname.trim()) throw new Error('请填写姓氏');
        body.surname = surname.trim();
        body.gender = gender;
        body.yongShen = splitWx(yongShen);
        body.generationChar = generationChar || undefined;
      } else if (mode === 'company') {
        if (!tradeName.trim() && !keywords.trim()) {
          throw new Error('请填写核心字号或关键词，例如「伙计」');
        }
        body.tradeName = tradeName.trim() || splitList(keywords)[0];
        body.industry = industry.trim() || '科技';
        body.keywords = splitList(keywords);
        body.region = region.trim() || undefined;
        body.jurisdiction = jurisdiction;
        body.entityForm = entityForm;
        body.preferredLength = preferredLength;
        body.yongShen = splitWx(yongShen);
      } else {
        body.category = category;
        body.keywords = splitList(productKw);
        body.style = style;
        body.bilingual = true;
      }

      setStatus('2/3 引擎打分 + AI 测算（约数秒）…');
      const res = await fetch('/api/naming/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data: { success?: boolean; resultUrl?: string; error?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`服务返回异常（HTTP ${res.status}）`);
      }
      if (!res.ok || !data.success || !data.resultUrl) {
        throw new Error(data.error || `生成失败（HTTP ${res.status}）`);
      }

      setStatus('3/3 进入结果页…');
      // hard navigation 更可靠，避免 client router 卡住
      window.location.assign(data.resultUrl);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.name === 'AbortError'
            ? '请求超时，请重试（已限制 55 秒）'
            : e.message
          : '生成失败';
      setError(msg);
      setStatus(null);
      setBusy(false);
    } finally {
      clearTimeout(timer);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-5 px-3 py-6 sm:px-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            Naming Lab · 起名中心
          </div>
          <h1 className="text-[26px] font-black tracking-tight text-[color:var(--ink-1)]">
            个人 · 公司 · 产品
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            公司名对标可注册格式：字号 + 行业 + 有限公司 / Ltd / LLC 等；提交后进入独立结果页。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href="/tools/fengshui-space"
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold"
          >
            空间场
          </Link>
          <Link
            href="/dimensions/naming"
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold"
          >
            深度测名
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
          <button
            type="button"
            className="ml-2 font-bold underline"
            onClick={() => {
              setError(null);
              void submit();
            }}
          >
            重试
          </button>
        </div>
      ) : null}
      {status && busy ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-[12px] font-semibold text-indigo-800">
          {status}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={busy}
            onClick={() => setMode(m.id)}
            className={`rounded-lg px-3 py-2 text-[12px] font-bold disabled:opacity-50 ${
              mode === m.id
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-2)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[color:var(--ink-5)]">{modeMeta.hint}</p>

      <div className="grid gap-3 rounded-2xl border border-[color:var(--hairline)] bg-white p-4 shadow-sm sm:grid-cols-2">
        {mode === 'person' ? (
          <>
            <Field label="姓氏">
              <input
                className="field"
                value={surname}
                onChange={(e) => setSurname(e.target.value.slice(0, 2))}
              />
            </Field>
            <Field label="性别倾向">
              <select
                className="field"
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
              >
                <option value="neutral">不限</option>
                <option value="male">偏男</option>
                <option value="female">偏女</option>
              </select>
            </Field>
            <Field label="用神 / 喜神">
              <div className="flex gap-1">
                <input
                  className="field flex-1"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                  placeholder="木、水"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
                  disabled={linking || busy}
                  onClick={() => void linkBazi()}
                >
                  用主盘
                </button>
              </div>
            </Field>
            <Field label="字辈（可选）">
              <input
                className="field"
                value={generationChar}
                onChange={(e) => setGenerationChar(e.target.value.slice(0, 1))}
              />
            </Field>
          </>
        ) : null}

        {mode === 'company' ? (
          <>
            <Field label="核心字号 *（如：伙计）">
              <input
                className="field"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value.slice(0, 8))}
                placeholder="伙计 / 云启 / 星驰"
              />
            </Field>
            <Field label="行业 *">
              <input
                className="field"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="科技 / 教育 / 餐饮"
              />
            </Field>
            <Field label="注册地 / 法域">
              <select
                className="field"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value as CompanyJurisdiction)}
              >
                {COMPANY_JURISDICTIONS.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="主体形式">
              <select
                className="field"
                value={entityForm}
                onChange={(e) => setEntityForm(e.target.value as CompanyEntityForm)}
              >
                {COMPANY_ENTITY_FORMS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="省/市（可选，生成「广东××科技有限公司」）">
              <input
                className="field"
                value={region}
                onChange={(e) => setRegion(e.target.value.slice(0, 12))}
                placeholder="广东 / 深圳 / 上海"
              />
            </Field>
            <Field label="补充关键词">
              <input
                className="field"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="智能,云"
              />
            </Field>
            <Field label="字号长度偏好（扩展候选）">
              <select
                className="field"
                value={preferredLength}
                onChange={(e) => setPreferredLength(Number(e.target.value) as 2 | 3)}
              >
                <option value={2}>2 字扩展</option>
                <option value={3}>3 字扩展</option>
              </select>
            </Field>
            <Field label="法人用神（可选）">
              <div className="flex gap-1">
                <input
                  className="field flex-1"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
                  disabled={linking || busy}
                  onClick={() => void linkBazi()}
                >
                  用主盘
                </button>
              </div>
            </Field>
            <p className="sm:col-span-2 text-[11px] leading-relaxed text-slate-500">
              示例输出：{tradeName || '××'}
              {industry || '科技'}有限公司
              {region ? ` · ${region.replace(/省|市/g, '')}${tradeName || '××'}${industry || '科技'}有限公司` : ''}
              {jurisdiction === 'US' ? ' · Brand Inc. / LLC' : ''}
              {jurisdiction === 'JP' ? ' · 株式会社××' : ''}
            </p>
          </>
        ) : null}

        {mode === 'product' ? (
          <>
            <Field label="品类">
              <input
                className="field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="卖点词">
              <input
                className="field"
                value={productKw}
                onChange={(e) => setProductKw(e.target.value)}
              />
            </Field>
            <Field label="风格">
              <select
                className="field"
                value={style}
                onChange={(e) => setStyle(e.target.value as typeof style)}
              >
                <option value="steady">稳重</option>
                <option value="tech">科技</option>
                <option value="guofeng">国风</option>
                <option value="global">洋气</option>
              </select>
            </Field>
          </>
        ) : null}

        <label className="flex items-center gap-2 text-[12px] text-slate-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={enableWuge}
            disabled={busy}
            onChange={(e) => setEnableWuge(e.target.checked)}
          />
          启用三才五格参考（默认关闭）
        </label>

        <div className="sm:col-span-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-[color:var(--ink-1)] px-4 py-3.5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
          >
            {busy ? status || '处理中…' : '生成方案并进入结果页'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            引擎立即出候选；AI 解读限时约 14 秒，超时仍进入结果页。
          </p>
        </div>
      </div>

      <style jsx>{`
        .field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          font-size: 13px;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-slate-500">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function splitWx(s: string): string[] {
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim())
    .filter((x) => ['木', '火', '土', '金', '水'].includes(x));
}

function splitList(s: string): string[] {
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
}
