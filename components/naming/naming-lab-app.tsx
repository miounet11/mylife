'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { NameCandidate, NamingMode } from '@/lib/naming';

type Props = { locale?: string };

const MODES: Array<{ id: NamingMode; label: string; hint: string }> = [
  { id: 'person', label: '个人起名', hint: '姓 + 性别 + 可选用神 → 候选名' },
  { id: 'company', label: '公司起名', hint: '行业 + 关键词 → 品牌短名' },
  { id: 'product', label: '产品起名', hint: '品类 + 卖点 + 风格' },
];

export function NamingLabApp({ locale: _locale }: Props) {
  const [mode, setMode] = useState<NamingMode>('person');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<NameCandidate[]>([]);
  const [selected, setSelected] = useState<NameCandidate | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [linking, setLinking] = useState(false);

  // person
  const [surname, setSurname] = useState('李');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [yongShen, setYongShen] = useState('');
  const [generationChar, setGenerationChar] = useState('');
  const [enableWuge, setEnableWuge] = useState(false);

  // company
  const [industry, setIndustry] = useState('科技');
  const [keywords, setKeywords] = useState('智能,云');
  const [preferredLength, setPreferredLength] = useState<2 | 3>(2);

  // product
  const [category, setCategory] = useState('应用');
  const [productKw, setProductKw] = useState('轻,快');
  const [style, setStyle] = useState<'steady' | 'tech' | 'guofeng' | 'global'>('tech');

  // score existing
  const [scoreName, setScoreName] = useState('');
  const [scoreResult, setScoreResult] = useState<NameCandidate | null>(null);

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
      setBanner(data.message || '已载入主盘用神');
    } catch (e) {
      setError(e instanceof Error ? e.message : '关联失败');
    } finally {
      setLinking(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setBanner(null);
    setSelected(null);
    try {
      const body: Record<string, unknown> = {
        mode,
        enableWuge,
        count: 18,
      };
      if (mode === 'person') {
        body.surname = surname;
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

      const res = await fetch('/api/naming/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '生成失败');
      setCandidates(data.candidates || []);
      setBanner(`已生成 ${(data.candidates || []).length} 个候选`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setBusy(false);
    }
  };

  const runScore = async () => {
    if (!scoreName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/naming/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          name: scoreName.trim(),
          surname: mode === 'person' ? surname : undefined,
          yongShen: splitWx(yongShen),
          industry: mode === 'company' ? industry : category,
          enableWuge,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '评分失败');
      setScoreResult(data.candidate);
    } catch (e) {
      setError(e instanceof Error ? e.message : '评分失败');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!candidates.length) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/publish/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'naming',
          namingMode: mode,
          useLlm: false,
          surnameOrBrand: mode === 'person' ? surname : industry || category,
          candidates: candidates.slice(0, 12).map((c) => ({
            name: c.fullName || c.name,
            score: c.score,
            reason: c.reason,
          })),
          summary: `${modeMeta.label}候选 ${candidates.length} 个`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '发布失败');
      setPublicUrl(data.url);
      setBanner(data.message || '已发布公开短名单');
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            Naming Lab · 起名中心
          </div>
          <h1 className="text-[22px] font-black tracking-tight text-[color:var(--ink-1)]">
            个人 · 公司 · 产品
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            对标成熟起名产品：用神契合 · 音韵 · 字义 · 传播感 · 可选五格参考。操作保持极简。
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

      {(banner || error) && (
        <div
          className={`rounded-lg px-3 py-2 text-[12px] ${
            error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {error || banner}
          {publicUrl ? (
            <a href={publicUrl} className="ml-2 font-semibold underline" target="_blank" rel="noreferrer">
              打开公开页
            </a>
          ) : null}
        </div>
      )}

      {/* mode tabs */}
      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setCandidates([]);
              setSelected(null);
            }}
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

      {/* form */}
      <div className="grid gap-3 rounded-xl border border-[color:var(--hairline)] bg-white p-3 sm:grid-cols-2">
        {mode === 'person' ? (
          <>
            <Field label="姓氏">
              <input
                className="input"
                value={surname}
                onChange={(e) => setSurname(e.target.value.slice(0, 2))}
                maxLength={2}
              />
            </Field>
            <Field label="性别倾向">
              <select
                className="input"
                value={gender}
                onChange={(e) => setGender(e.target.value as typeof gender)}
              >
                <option value="neutral">不限</option>
                <option value="male">偏男</option>
                <option value="female">偏女</option>
              </select>
            </Field>
            <Field label="用神/喜神（可空）">
              <div className="flex gap-1">
                <input
                  className="input flex-1"
                  placeholder="木、水"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
                  disabled={linking}
                  onClick={() => void linkBazi()}
                >
                  {linking ? '…' : '用主盘'}
                </button>
              </div>
            </Field>
            <Field label="字辈（可选）">
              <input
                className="input"
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
                className="input"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="科技 / 餐饮 / 教育"
              />
            </Field>
            <Field label="关键词（逗号分隔）">
              <input
                className="input"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </Field>
            <Field label="字数">
              <select
                className="input"
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
                  className="input flex-1"
                  value={yongShen}
                  onChange={(e) => setYongShen(e.target.value)}
                  placeholder="木、火"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800"
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
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="卖点词">
              <input
                className="input"
                value={productKw}
                onChange={(e) => setProductKw(e.target.value)}
              />
            </Field>
            <Field label="风格">
              <select
                className="input"
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

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void generate()}
            className="rounded-lg bg-[color:var(--ink-1)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            {busy ? '生成中…' : '一键生成候选'}
          </button>
          <button
            type="button"
            disabled={!candidates.length || publishing}
            onClick={() => void publish()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold disabled:opacity-40"
          >
            公开发布短名单
          </button>
        </div>
      </div>

      {/* score existing */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-slate-200 p-3">
        <Field label="已有名字打分">
          <input
            className="input w-40"
            value={scoreName}
            onChange={(e) => setScoreName(e.target.value)}
            placeholder={mode === 'person' ? '名或全名' : '名称'}
          />
        </Field>
        <button
          type="button"
          className="rounded-md bg-slate-100 px-3 py-2 text-[12px] font-semibold"
          disabled={busy}
          onClick={() => void runScore()}
        >
          测名
        </button>
        {scoreResult ? (
          <span className="text-[12px] text-slate-700">
            <b>{scoreResult.fullName || scoreResult.name}</b> {scoreResult.score} 分 ·{' '}
            {scoreResult.reason}
          </span>
        ) : null}
      </div>

      {/* results */}
      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-2 sm:grid-cols-2">
          {candidates.map((c) => {
            const active = selected?.name === c.name && selected?.fullName === c.fullName;
            return (
              <button
                key={`${c.fullName || c.name}-${c.score}`}
                type="button"
                onClick={() => setSelected(c)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-[color:var(--hairline)] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[16px] font-black text-slate-900">
                    {c.fullName || c.name}
                  </span>
                  <span className="text-[18px] font-black text-indigo-600">{c.score}</span>
                </div>
                {c.english ? (
                  <div className="text-[11px] text-slate-400">{c.english}</div>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.elements.map((e) => (
                    <span
                      key={e.char + e.element}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                    >
                      {e.char}·{e.element}
                    </span>
                  ))}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{c.reason}</p>
              </button>
            );
          })}
          {!candidates.length ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-8 text-center text-[13px] text-slate-400">
              填写左侧条件，点「一键生成候选」
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border border-[color:var(--hairline)] bg-slate-50 p-3 text-[12px]">
          <div className="font-bold text-slate-800">得分拆解</div>
          {selected ? (
            <div className="mt-2 space-y-2">
              <div className="text-[18px] font-black">{selected.fullName || selected.name}</div>
              <Bar label="五行/用神" v={selected.breakdown.wuxing} />
              <Bar label="音韵" v={selected.breakdown.phonology} />
              <Bar label="字义" v={selected.breakdown.semantics} />
              {selected.breakdown.brandability != null ? (
                <Bar label="传播感" v={selected.breakdown.brandability} />
              ) : null}
              {selected.breakdown.wuge != null ? (
                <Bar label="五格参考" v={selected.breakdown.wuge} />
              ) : null}
              <p className="text-slate-600">{selected.reason}</p>
              {selected.styleTags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {selected.styleTags.map((t) => (
                    <span key={t} className="rounded-full bg-white px-2 py-0.5 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-slate-500">点选候选查看拆解（对标竞品透明度）</p>
          )}
          <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
            文化与结构参考，非命运承诺。公司/产品名请核验工商与商标。
          </p>
        </aside>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0.4rem 0.6rem;
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

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${v}%` }} />
      </div>
    </div>
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
