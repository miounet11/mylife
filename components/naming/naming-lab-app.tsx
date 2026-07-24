'use client';

/**
 * 起名中心 · 表单
 * 个人/改名：生辰必填或勾选档案
 * 公司/产品：法人/主理人生辰可选，参与天时地利人和
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { NamingMode } from '@/lib/naming';
import {
  COMPANY_ENTITY_FORMS,
  COMPANY_JURISDICTIONS,
  type CompanyEntityForm,
  type CompanyJurisdiction,
} from '@/lib/naming/company-entity';
import { POETRY_CHIPS } from '@/lib/naming/methods';

type Props = { locale?: string };

type FortuneOpt = {
  id: string;
  name: string;
  isPrimary?: boolean;
  birthDate?: string;
  birthTime?: string;
  pillarSummary?: string | null;
};

const MODES: Array<{ id: NamingMode; label: string; hint: string }> = [
  { id: 'person', label: '个人起名', hint: '姓 + 生辰 + 性别 → 用神/五格/诗词多维' },
  { id: 'rename', label: '改名', hint: '原名 + 生辰 → 补用神微调方案' },
  { id: 'company', label: '公司起名', hint: '字号 + 行业 + 法域 + 可选法人生辰' },
  { id: 'product', label: '产品起名', hint: '品类 + 卖点 + 可选主理人生辰' },
];

export function NamingLabApp({ locale: _locale }: Props) {
  const [mode, setMode] = useState<NamingMode>('person');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fortunes, setFortunes] = useState<FortuneOpt[]>([]);
  const [useProfile, setUseProfile] = useState(false);
  const [fortuneId, setFortuneId] = useState('');

  // person / rename
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [birthMinute, setBirthMinute] = useState('0');
  const [birthPlace, setBirthPlace] = useState('');
  const [generationChar, setGenerationChar] = useState('');
  const [fixedCharPos, setFixedCharPos] = useState<'middle' | 'end'>('middle');
  const [nameLength, setNameLength] = useState<'any' | '2' | '3'>('any');
  const [wish, setWish] = useState('');
  const [poetryHint, setPoetryHint] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [genCount, setGenCount] = useState(5);

  // company
  const [tradeName, setTradeName] = useState('');
  const [industry, setIndustry] = useState('科技');
  const [keywords, setKeywords] = useState('');
  const [region, setRegion] = useState('');
  const [jurisdiction, setJurisdiction] = useState<CompanyJurisdiction>('CN');
  const [entityForm, setEntityForm] = useState<CompanyEntityForm>('co_ltd');

  // product
  const [category, setCategory] = useState('应用');
  const [productKw, setProductKw] = useState('');
  const [style, setStyle] = useState<'steady' | 'tech' | 'guofeng' | 'global'>('tech');

  const modeMeta = useMemo(() => MODES.find((m) => m.id === mode)!, [mode]);

  const loadFortunes = useCallback(async () => {
    try {
      const res = await fetch('/api/fengshui/space/link-bazi');
      const data = await res.json();
      if (data.success && Array.isArray(data.fortunes)) {
        setFortunes(data.fortunes);
      } else if (data.profileLink) {
        // single link path
        setFortunes([
          {
            id: data.profileLink.fortuneId,
            name: data.profileLink.displayName || '主盘',
            isPrimary: true,
          },
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadFortunes();
  }, [loadFortunes]);

  const applyFortune = async (id: string) => {
    setFortuneId(id);
    setUseProfile(true);
    try {
      const res = await fetch('/api/fengshui/space/link-bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fortuneId: id }),
      });
      const data = await res.json();
      if (data.success && data.profileLink) {
        const pl = data.profileLink;
        if (pl.displayName && mode === 'person') {
          // display name is full name sometimes — only use as hint
        }
        // yongShen 由服务端 run 时再算；此处尽量填性别
      }
      // try profile settings for birth
      const ps = await fetch(`/api/profile/settings?fortuneId=${encodeURIComponent(id)}`);
      const pd = await ps.json();
      const f =
        pd?.fortunes?.find((x: { id: string }) => x.id === id) ||
        pd?.fortunes?.[0];
      if (f) {
        if (f.birthDate) setBirthDate(String(f.birthDate).slice(0, 10));
        if (f.birthTime) {
          const [h, m] = String(f.birthTime).split(':');
          if (h) setBirthHour(String(Number(h)));
          if (m) setBirthMinute(String(Number(m)));
        }
        if (f.gender === 'female' || f.gender === '女') setGender('female');
        else if (f.gender === 'male' || f.gender === '男') setGender('male');
        if (f.name && !surname) {
          const n = String(f.name);
          if (n.length <= 2) setSurname(n[0] || '');
          else setSurname(n.slice(0, 1));
        }
        if (f.birthPlace) setBirthPlace(String(f.birthPlace));
      }
    } catch {
      // ignore
    }
  };

  const birthTimeStr = `${String(birthHour).padStart(2, '0')}:${String(birthMinute).padStart(2, '0')}`;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus('1/3 校验生辰与条件…');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    try {
      if (mode === 'person' || mode === 'rename') {
        if (!surname.trim()) throw new Error('请填写姓氏');
        if (!useProfile && !birthDate) {
          throw new Error('请填写出生年月日，或勾选已有生辰档案');
        }
        if (mode === 'rename' && !originalName.trim()) {
          throw new Error('改名请填写当前姓名');
        }
      }
      if (mode === 'company' && !tradeName.trim() && !keywords.trim()) {
        throw new Error('请填写核心字号');
      }

      const body: Record<string, unknown> = {
        mode,
        useLlm: true,
        count: genCount === 3 ? 12 : genCount === 8 ? 20 : 16,
        enableWuge: true,
        fortuneId: useProfile && fortuneId ? fortuneId : undefined,
        birthDate: birthDate || undefined,
        birthTime: birthDate ? birthTimeStr : undefined,
        birthPlace: birthPlace || undefined,
        gender,
        wish: wish || undefined,
      };

      if (mode === 'person' || mode === 'rename') {
        body.surname = surname.trim();
        body.generationChar = generationChar || undefined;
        body.fixedCharPos = fixedCharPos;
        body.nameLength = nameLength;
        body.poetryHint = poetryHint || undefined;
        if (mode === 'rename') body.originalName = originalName.trim();
      } else if (mode === 'company') {
        body.tradeName = tradeName.trim() || splitList(keywords)[0];
        body.industry = industry.trim() || '科技';
        body.keywords = splitList(keywords);
        body.region = region.trim() || undefined;
        body.jurisdiction = jurisdiction;
        body.entityForm = entityForm;
      } else {
        body.category = category;
        body.keywords = splitList(productKw);
        body.style = style;
        body.region = region || undefined;
        body.bilingual = true;
      }

      setStatus('2/3 康熙笔画引擎 + 用神/五格 + AI…');
      const res = await fetch('/api/naming/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      let data: { success?: boolean; resultUrl?: string; error?: string; code?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`服务异常 HTTP ${res.status}`);
      }
      if (!res.ok || !data.success || !data.resultUrl) {
        throw new Error(data.error || '生成失败');
      }
      setStatus('3/3 进入结果页…');
      window.location.assign(data.resultUrl);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.name === 'AbortError'
            ? '请求超时，请重试'
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
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          Naming Lab · 起名工坊
        </div>
        <h1 className="text-[26px] font-black tracking-tight">天时 · 地利 · 人和</h1>
        <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
          生辰用神 + 康熙笔画五行 + 三才五格 + 音韵诗词。个人/改名需生辰；公司/产品可叠加法人/主理人生辰。
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
          <button type="button" className="ml-2 font-bold underline" onClick={() => void submit()}>
            重试
          </button>
        </div>
      ) : null}
      {status && busy ? (
        <div className="rounded-lg bg-indigo-50 px-3 py-2 text-[12px] font-semibold text-indigo-800">
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
            className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
              mode === m.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">{modeMeta.hint}</p>

      {/* 生辰区块：全模式可见 */}
      <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
        <h2 className="text-[13px] font-bold text-amber-900">
          {mode === 'company' || mode === 'product' ? '法人/主理人生辰（天时，建议填写）' : '出生信息（天时，必填）'}
        </h2>

        {fortunes.length > 0 ? (
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={useProfile}
                onChange={(e) => {
                  setUseProfile(e.target.checked);
                  if (!e.target.checked) setFortuneId('');
                }}
              />
              使用已录入的生辰档案
            </label>
            {useProfile ? (
              <select
                className="field"
                value={fortuneId}
                onChange={(e) => void applyFortune(e.target.value)}
              >
                <option value="">选择档案</option>
                {fortunes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || f.id}
                    {f.isPrimary ? '（主盘）' : ''}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-amber-800/80">
            暂无档案 · 请直接填写生辰，或先去
            <Link href="/analyze?source=naming" className="mx-1 font-semibold underline">
              排盘
            </Link>
            保存后再勾选。
          </p>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="出生日期">
            <input
              type="date"
              className="field"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Field>
          <Field label="出生时辰">
            <div className="flex gap-2">
              <select className="field" value={birthHour} onChange={(e) => setBirthHour(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} 时
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={birthMinute}
                onChange={(e) => setBirthMinute(e.target.value)}
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {m} 分
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="出生地（地利，可选）">
            <input
              className="field"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="省/市"
            />
          </Field>
          <Field label="性别">
            <div className="flex gap-3 py-2 text-[13px]">
              {(
                [
                  ['male', '男'],
                  ['female', '女'],
                  ['neutral', '不限'],
                ] as const
              ).map(([v, lab]) => (
                <label key={v} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="g"
                    checked={gender === v}
                    onChange={() => setGender(v)}
                  />
                  {lab}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        {(mode === 'person' || mode === 'rename') && (
          <>
            <Field label="姓氏 *">
              <input
                className="field"
                value={surname}
                onChange={(e) => setSurname(e.target.value.slice(0, 2))}
                placeholder="请输入姓氏"
              />
            </Field>
            {mode === 'rename' ? (
              <Field label="当前姓名 *">
                <input
                  className="field"
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value.slice(0, 8))}
                  placeholder="用于对照改名"
                />
              </Field>
            ) : (
              <Field label="生成数量">
                <div className="flex gap-3 py-2 text-[13px]">
                  {[3, 5, 8].map((n) => (
                    <label key={n} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={genCount === n}
                        onChange={() => setGenCount(n)}
                      />
                      {n} 档
                    </label>
                  ))}
                </div>
              </Field>
            )}
            <Field label="固定字（可选）">
              <input
                className="field"
                value={generationChar}
                onChange={(e) => setGenerationChar(e.target.value.slice(0, 1))}
                placeholder="中间字或末尾字"
              />
            </Field>
            <Field label="固定字位置">
              <div className="flex gap-3 py-2 text-[13px]">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={fixedCharPos === 'middle'}
                    onChange={() => setFixedCharPos('middle')}
                  />
                  中间
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={fixedCharPos === 'end'}
                    onChange={() => setFixedCharPos('end')}
                  />
                  末尾
                </label>
              </div>
            </Field>
            <Field label="名字字数">
              <div className="flex flex-wrap gap-3 py-2 text-[13px]">
                {(
                  [
                    ['any', '不限'],
                    ['2', '两字名'],
                    ['3', '三字名'],
                  ] as const
                ).map(([v, lab]) => (
                  <label key={v} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={nameLength === v}
                      onChange={() => setNameLength(v)}
                    />
                    {lab}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="取名心语（人和）">
              <input
                className="field"
                value={wish}
                onChange={(e) => setWish(e.target.value.slice(0, 80))}
                placeholder="聪明有主见、古典诗词韵味…"
              />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-1 text-[11px] font-semibold text-slate-500">诗词撷英</div>
              <div className="flex flex-wrap gap-1.5">
                {POETRY_CHIPS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPoetryHint(p)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      poetryHint === p
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'company' && (
          <>
            <Field label="核心字号 *">
              <input
                className="field"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value.slice(0, 8))}
                placeholder="伙计"
              />
            </Field>
            <Field label="行业 *">
              <input
                className="field"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </Field>
            <Field label="法域">
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
            <Field label="主体">
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
            <Field label="省/市（地利）">
              <input
                className="field"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="广东"
              />
            </Field>
            <Field label="关键词">
              <input
                className="field"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </Field>
            <Field label="开业愿景（人和）">
              <input
                className="field"
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder="稳健、创新…"
              />
            </Field>
          </>
        )}

        {mode === 'product' && (
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
            <Field label="市场区域（地利）">
              <input
                className="field"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </Field>
            <Field label="产品心语">
              <input className="field" value={wish} onChange={(e) => setWish(e.target.value)} />
            </Field>
          </>
        )}

        <div className="sm:col-span-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-rose-600 px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
          >
            {busy ? status || '生成中…' : mode === 'rename' ? '生成改名方案' : '开始专业起名'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            引擎：康熙笔画 · 五行 · 用神 · 五格 · 音韵 · 天时地利人和；结果页可下钻单名详解。
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

function splitList(s: string): string[] {
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
}
