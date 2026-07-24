'use client';

/**
 * 起名中心 · 表单页（只负责填写）
 * 提交 → /api/naming/run（引擎+LLM）→ 跳转结果页
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { NamingMode } from '@/lib/naming';

type Props = { locale?: string };

const MODES: Array<{ id: NamingMode; label: string; hint: string }> = [
  { id: 'person', label: '个人起名', hint: '姓 + 性别 + 用神（可选）→ AI 方案页' },
  { id: 'company', label: '公司起名', hint: '行业 + 关键词 → AI 品牌方案页' },
  { id: 'product', label: '产品起名', hint: '品类 + 卖点 + 风格 → AI 产品名方案页' },
];

export function NamingLabApp({ locale: _locale }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<NamingMode>('person');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const [surname, setSurname] = useState('李');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [yongShen, setYongShen] = useState('');
  const [generationChar, setGenerationChar] = useState('');
  const [enableWuge, setEnableWuge] = useState(false);

  const [industry, setIndustry] = useState('科技');
  const [keywords, setKeywords] = useState('智能,云');
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
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        mode,
        enableWuge,
        useLlm: true,
        count: 24,
      };
      if (mode === 'person') {
        if (!surname.trim()) throw new Error('请填写姓氏');
        body.surname = surname.trim();
        body.gender = gender;
        body.yongShen = splitWx(yongShen);
        body.generationChar = generationChar || undefined;
      } else if (mode === 'company') {
        body.industry = industry;
        body.keywords = splitList(keywords);
        body.preferredLength = preferredLength;
        body.yongShen = splitWx(yongShen);
      } else {
        body.category = category;
        body.keywords = splitList(productKw);
        body.style = style;
        body.bilingual = true;
      }

      const res = await fetch('/api/naming/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.resultUrl) {
        throw new Error(data.error || '生成失败');
      }
      router.push(data.resultUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
      setBusy(false);
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
            填写条件后进入<strong>独立结果页</strong>：引擎打分 + AI 测算解读，再点进
            <strong>下一级单名详解</strong>。
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
          <Link
            href="/analyze?source=naming_lab"
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold"
          >
            排盘
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={surname}
                onChange={(e) => setSurname(e.target.value.slice(0, 2))}
                maxLength={2}
              />
            </Field>
            <Field label="性别倾向">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
              >
                <option value="neutral">不限</option>
                <option value="male">偏男</option>
                <option value="female">偏女</option>
              </select>
            </Field>
            <Field label="用神 / 喜神（可空）">
              <div className="flex gap-1">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                  placeholder="木、水"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
                  disabled={linking}
                  onClick={() => void linkBazi()}
                >
                  {linking ? '…' : '用主盘'}
                </button>
              </div>
            </Field>
            <Field label="字辈（可选）">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={generationChar}
                onChange={(e) => setGenerationChar(e.target.value.slice(0, 1))}
                maxLength={1}
                placeholder="中间字"
              />
            </Field>
          </>
        ) : null}

        {mode === 'company' ? (
          <>
            <Field label="行业">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="科技 / 餐饮 / 教育"
              />
            </Field>
            <Field label="关键词（逗号分隔）">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </Field>
            <Field label="字数">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={preferredLength}
                onChange={(e) => setPreferredLength(Number(e.target.value) as 2 | 3)}
              >
                <option value={2}>2 字</option>
                <option value={3}>3 字</option>
              </select>
            </Field>
            <Field label="法人用神（可选）">
              <div className="flex gap-1">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                  placeholder="木、火"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
                  disabled={linking}
                  onClick={() => void linkBazi()}
                >
                  用主盘
                </button>
              </div>
            </Field>
          </>
        ) : null}

        {mode === 'product' ? (
          <>
            <Field label="品类">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="卖点词">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                value={productKw}
                onChange={(e) => setProductKw(e.target.value)}
              />
            </Field>
            <Field label="风格">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
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
            onChange={(e) => setEnableWuge(e.target.checked)}
          />
          启用三才五格参考（传统数理，默认关闭）
        </label>

        <div className="sm:col-span-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-[color:var(--ink-1)] px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
          >
            {busy ? 'AI 测算中，即将进入结果页…' : '生成方案并进入结果页'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            将调用结构引擎 + LLM 解读，并跳转到新页面展示完整方案与下一级详解入口。
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-[12px] leading-relaxed text-slate-600">
        <div className="font-bold text-slate-800">流程</div>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>本页填写条件</li>
          <li>
            <strong>结果页</strong>：AI 总评 + 候选排行 + 方案建议
          </li>
          <li>
            <strong>下一级</strong>：点某个名字进入单名详解（字义 / 音韵 / 变体 / AI 说明）
          </li>
        </ol>
      </div>
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
