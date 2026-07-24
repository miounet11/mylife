'use client';

/**
 * 面相 / 手相 · 录入页
 * 视觉对齐全站：浅色壳 · ink/hairline/brand · 与起名工坊一致
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { XiangxueKind } from '@/lib/xiangxue';

type Props = { kind: XiangxueKind };

const FACE_STEPS = [
  { n: '1', t: '成像', d: '清晰度 · 角度 · 光线' },
  { n: '2', t: '三庭五眼', d: '比例骨架（物理）' },
  { n: '3', t: '五官分区', d: '额眉鼻口颌细读' },
  { n: '4', t: '气机教学', d: '十二宫气质映射' },
  { n: '5', t: '用神交叉', d: '生辰 × 图像' },
  { n: '6', t: '行动', d: '可验证下一步' },
];

const PALM_STEPS = [
  { n: '1', t: '成像', d: '对焦 · 反光 · 占比' },
  { n: '2', t: '手型', d: '指长掌宽（物理）' },
  { n: '3', t: '三主线', d: '生命 · 智慧 · 感情' },
  { n: '4', t: '气机', d: '掌丘与节奏教学' },
  { n: '5', t: '用神', d: '生辰交叉' },
  { n: '6', t: '复看', d: '21 天对照' },
];

export function XiangxueLabApp({ kind }: Props) {
  const isFace = kind === 'face';
  const title = isFace ? '面相系统报告' : '手相系统报告';
  const steps = isFace ? FACE_STEPS : PALM_STEPS;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [side, setSide] = useState<'left' | 'right' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [allowSeo, setAllowSeo] = useState(false);
  const [useProfile, setUseProfile] = useState(false);
  const [fortuneId, setFortuneId] = useState('');
  const [fortunes, setFortunes] = useState<Array<{ id: string; name: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/fengshui/space/link-bazi');
        const data = await res.json();
        if (data.fortunes) setFortunes(data.fortunes);
        else if (data.profileLink)
          setFortunes([
            {
              id: data.profileLink.fortuneId,
              name: data.profileLink.displayName || '主盘',
            },
          ]);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!busy) {
      setProgressStep(0);
      return;
    }
    const timers = [
      setTimeout(() => setProgressStep(1), 400),
      setTimeout(() => setProgressStep(2), 1800),
      setTimeout(() => setProgressStep(3), 4000),
      setTimeout(() => setProgressStep(4), 8000),
      setTimeout(() => setProgressStep(5), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  const onFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('图片请小于 6MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
    setError(null);
  }, []);

  const submit = async () => {
    if (busy) return;
    if (!preview) {
      setError(isFace ? '请先上传面部照片' : '请先上传手掌照片');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus('① 保存照片…');
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 65_000);
    try {
      setStatus('② 物理结构识别…');
      const res = await fetch('/api/xiangxue/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          kind,
          imageDataUrl: preview,
          birthDate: birthDate || undefined,
          birthTime: birthDate ? `${String(birthHour).padStart(2, '0')}:00` : undefined,
          gender: gender === 'unknown' ? undefined : gender,
          side: side === 'unknown' ? undefined : side,
          note: note || undefined,
          allowSeoLineArt: allowSeo,
          fortuneId: useProfile && fortuneId ? fortuneId : undefined,
          useLlm: true,
        }),
      });
      setStatus('③ 命理交叉与成文…');
      const data = await res.json();
      if (!res.ok || !data.success || !data.resultUrl) {
        throw new Error(data.error || '分析失败');
      }
      setStatus('进入系统报告…');
      window.location.assign(data.resultUrl);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === 'AbortError'
            ? '超时，请重试（或换更小图片）'
            : e.message
          : '分析失败',
      );
      setBusy(false);
      setStatus(null);
    } finally {
      clearTimeout(t);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-5 px-3 py-6 sm:px-4 pb-16">
      {/* Header — 对齐 FocusHero / 起名工坊 */}
      <header className="border-b border-[color:var(--hairline)] pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          {isFace ? 'Physiognomy' : 'Palmistry'} · 系统报告 v3
        </div>
        <h1 className="mt-1 text-[26px] font-black tracking-tight text-[color:var(--ink-1)]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          {isFace
            ? '上传面部照片：先评估成像、三庭五眼与五官可见结构，再与生辰用神做气质/节奏教学交叉。非医学、非定命。'
            : '上传手掌照片：先读手型与三主线可见形态，再交叉生辰谈行动节奏。非医学、非定命。'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-4)]">
          <span className="font-semibold text-[color:var(--ink-2)]">先物理</span>
          <span aria-hidden>→</span>
          <span className="font-semibold text-[color:var(--ink-2)]">再命理</span>
          <span aria-hidden>→</span>
          <span className="font-semibold text-[color:var(--ink-2)]">综合行动</span>
        </div>
      </header>

      {/* 阅读路径 — 浅色步骤条 */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 shadow-[var(--shadow-card)]">
        <div className="mb-2 text-[11px] font-semibold text-[color:var(--ink-4)]">
          报告阅读路径
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg)] px-2 py-2 text-center"
            >
              <div className="text-[10px] font-bold text-[color:var(--brand)]">{s.n}</div>
              <div className="mt-0.5 text-[11px] font-bold text-[color:var(--ink-1)]">{s.t}</div>
              <div className="mt-0.5 text-[9px] leading-tight text-[color:var(--ink-4)]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
          <button type="button" className="ml-2 font-bold underline" onClick={() => void submit()}>
            重试
          </button>
        </div>
      ) : null}

      {status && busy ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5">
          <div className="text-[12px] font-semibold text-indigo-900">{status}</div>
          <div className="mt-2 flex gap-1">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`h-1 flex-1 rounded-full ${
                  i <= progressStep ? 'bg-[color:var(--brand)]' : 'bg-[color:var(--hairline-strong)]'
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 text-[10px] text-[color:var(--ink-4)]">
            物理层优先，随后命理交叉（约 10–40 秒）
          </div>
        </div>
      ) : null}

      {/* Upload */}
      <section
        className={`rounded-xl border border-dashed bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)] transition ${
          dragOver
            ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]'
            : 'border-[color:var(--hairline-strong)]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0] || null);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">
              1. {isFace ? '上传面部照片' : '上传手掌照片'}
            </h2>
            <p className="mt-1 text-[11px] text-[color:var(--ink-3)]">
              {isFace
                ? '正面 · 自然光 · 无浓妆滤镜 · 脸部占画面一半以上'
                : '手心向上 · 五指自然张开 · 掌心占 60%+ · 避免反光'}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-4)]">
            ≤6MB
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="mt-3 block w-full text-[13px] text-[color:var(--ink-2)]"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {preview ? (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="预览"
              className="max-h-72 w-auto rounded-lg border border-[color:var(--hairline)] object-contain shadow-sm"
            />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg)] py-10 text-center text-[12px] text-[color:var(--ink-4)]">
            拖拽图片到此处，或选择文件
            <div className="mt-1 text-[10px] text-[color:var(--ink-5)]">
              {isFace ? '建议：素颜/淡妆 · 双眼平视镜头' : '建议：标明左右手 · 掌纹清晰'}
            </div>
          </div>
        )}
      </section>

      {/* Birth — 与起名一致的 amber 弱强调 */}
      <section className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
        <h2 className="text-[13px] font-bold text-amber-900">2. 天时 · 生辰（强烈建议）</h2>
        <p className="mt-1 text-[11px] text-amber-900/70">
          有生辰才开启完整「命理层」；否则仅物理结构 + 弱提示。
        </p>
        {fortunes.length > 0 ? (
          <label className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[color:var(--ink-2)]">
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(e) => setUseProfile(e.target.checked)}
            />
            使用已有生辰档案
          </label>
        ) : (
          <p className="mt-2 text-[11px] text-amber-800/80">
            无档案可先
            <Link href="/analyze?source=xiangxue" className="mx-1 font-semibold underline">
              排盘
            </Link>
            或直接填写日期。
          </p>
        )}
        {useProfile && fortunes.length ? (
          <select
            className="field mt-2"
            value={fortuneId}
            onChange={(e) => setFortuneId(e.target.value)}
          >
            <option value="">选择档案</option>
            {fortunes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
            出生日期
            <input
              type="date"
              className="field mt-1"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
            时辰
            <select
              className="field mt-1"
              value={birthHour}
              onChange={(e) => setBirthHour(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i} 时
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
            性别
            <select
              className="field mt-1"
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            >
              <option value="unknown">不限</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>
        </div>
      </section>

      {!isFace ? (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">左右手</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ['left', '左手'],
                ['right', '右手'],
                ['unknown', '未指定'],
              ] as const
            ).map(([v, lab]) => (
              <button
                key={v}
                type="button"
                onClick={() => setSide(v)}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold ${
                  side === v
                    ? 'bg-slate-900 text-white'
                    : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-2)]'
                }`}
              >
                {lab}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)]">
        <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
          关注点（可选 · 会写入综合建议）
          <input
            className="field mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder={isFace ? '如：精神面、沟通表达、职场形象' : '如：事业线、行动节奏、掌丘'}
          />
        </label>
        <label className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-[color:var(--ink-3)]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={allowSeo}
            onChange={(e) => setAllowSeo(e.target.checked)}
          />
          <span>
            授权将本照片转为<strong className="text-[color:var(--ink-1)]">脱敏线图</strong>
            用于教学/SEO（不公开原图）。
          </span>
        </label>
      </section>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="text-[12px] font-bold text-indigo-900">报告将包含</div>
        <ul className="mt-2 grid gap-1 text-[11px] text-indigo-950/70 sm:grid-cols-2">
          <li>· 成像门槛与可信度</li>
          <li>· {isFace ? '三庭五眼 + 五官分区' : '手型 + 三主线细读'}</li>
          <li>· {isFace ? '十二宫气质教学映射' : '掌丘气机与节奏'}</li>
          <li>· 生辰用神交叉（有档案时）</li>
          <li>· 优势点 / 弱证据清单</li>
          <li>· 可验证动作与硬边界</li>
        </ul>
      </section>

      <button
        type="button"
        disabled={busy || !preview}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-[14px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? status || '生成系统报告…' : '生成系统报告（物理 → 命理 → 综合）'}
      </button>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
        <Link href="/tools/naming" className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
          起名工坊
        </Link>
        <Link
          href={isFace ? '/tools/palmistry' : '/tools/physiognomy'}
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          {isFace ? '手相' : '面相'}
        </Link>
        <Link href="/tools/fengshui-space" className="text-[color:var(--ink-3)] underline-offset-2 hover:underline">
          空间场
        </Link>
        <Link href="/analyze" className="text-[color:var(--ink-3)] underline-offset-2 hover:underline">
          八字排盘
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-[color:var(--ink-4)]">
        报告结构：成像与物理分区 → 命理气机/用神交叉 → 可验证动作与边界。照片默认仅本人会话可见。禁止疾病、寿命与定命断语。
      </p>
    </div>
  );
}
