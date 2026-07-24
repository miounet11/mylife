'use client';

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
      setStatus('② 物理结构识别（三庭/三线）…');
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
      setStatus('③ 命理交叉与系统成文…');
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
    <div className="min-h-[80vh] bg-[#0b0d12]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(99,102,241,0.4),_transparent_50%),radial-gradient(ellipse_at_90%_20%,_rgba(244,63,94,0.2),_transparent_45%)]" />
        <div className="relative mx-auto max-w-2xl px-4 pb-10 pt-9 text-white">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/50">
            <span className="rounded-full bg-gradient-to-r from-rose-500/25 to-amber-500/20 px-2.5 py-0.5 text-rose-100 ring-1 ring-rose-400/25">
              系统报告 v3
            </span>
            <span className="text-sky-300/80">先物理结构</span>
            <span className="text-white/20">→</span>
            <span className="text-amber-300/80">再命理交叉</span>
            <span className="text-white/20">→</span>
            <span className="text-violet-300/80">综合行动</span>
          </div>
          <h1 className="mt-3 text-[30px] font-black tracking-tight sm:text-[34px]">{title}</h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/60">
            {isFace
              ? '上传面部照片：先评估成像、三庭五眼与五官可见结构，再与生辰用神做气质/节奏教学交叉。非医学、非定命。'
              : '上传手掌照片：先读手型与三主线可见形态，再交叉生辰谈行动节奏。非医学、非定命。'}
          </p>

          {/* Method chips */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center"
              >
                <div className="text-[10px] font-bold text-indigo-300/90">{s.n}</div>
                <div className="mt-0.5 text-[11px] font-bold text-white/90">{s.t}</div>
                <div className="mt-0.5 text-[9px] leading-tight text-white/40">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-16">
        {error ? (
          <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {error}
            <button
              type="button"
              className="ml-2 font-bold underline"
              onClick={() => void submit()}
            >
              重试
            </button>
          </div>
        ) : null}

        {status && busy ? (
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3">
            <div className="text-[12px] font-semibold text-indigo-100">{status}</div>
            <div className="mt-2 flex gap-1">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  className={`h-1 flex-1 rounded-full transition ${
                    i <= progressStep ? 'bg-indigo-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div className="mt-1.5 text-[10px] text-white/40">
              分析中 · 物理层优先，随后命理交叉（约 10–40 秒）
            </div>
          </div>
        ) : null}

        {/* Upload */}
        <section
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-5 transition ${
            dragOver
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-white/15 bg-white/[0.03]'
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
              <div className="text-[13px] font-black text-white">
                1. {isFace ? '上传面部照片' : '上传手掌照片'}
              </div>
              <p className="mt-1 text-[11px] text-white/45">
                {isFace
                  ? '正面 · 自然光 · 无浓妆滤镜 · 脸部占画面一半以上'
                  : '手心向上 · 五指自然张开 · 掌心占 60%+ · 避免反光'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
              ≤6MB
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-3 block w-full text-[13px] text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {preview ? (
            <div className="mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="预览"
                className="max-h-72 w-auto rounded-xl border border-white/15 object-contain shadow-2xl shadow-indigo-900/40"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/5 bg-black/20 py-12 text-center text-[12px] text-white/35">
              拖拽图片到此处，或点击选择文件
              <div className="mt-2 text-[10px] text-white/25">
                {isFace ? '建议：素颜/淡妆 · 双眼平视镜头' : '建议：左手或右手标明 · 掌纹清晰'}
              </div>
            </div>
          )}
        </section>

        {/* Birth */}
        <section className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
          <div className="text-[13px] font-black text-amber-100">2. 天时 · 生辰（强烈建议）</div>
          <p className="mt-1 text-[11px] text-amber-100/55">
            有生辰才开启完整「命理层」；否则仅物理结构 + 弱提示。
          </p>
          {fortunes.length > 0 ? (
            <label className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-amber-50/90">
              <input
                type="checkbox"
                checked={useProfile}
                onChange={(e) => setUseProfile(e.target.checked)}
              />
              使用已有生辰档案
            </label>
          ) : (
            <p className="mt-2 text-[11px] text-amber-100/50">
              无档案可先
              <Link href="/analyze?source=xiangxue" className="mx-1 font-semibold text-amber-200 underline">
                排盘
              </Link>
              或直接填写日期。
            </p>
          )}
          {useProfile && fortunes.length ? (
            <select
              className="mt-2 w-full rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2.5 text-[13px] text-white"
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
            <label className="text-[11px] font-semibold text-amber-100/60 sm:col-span-1">
              出生日期
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2 text-[13px] text-white"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label className="text-[11px] font-semibold text-amber-100/60">
              时辰
              <select
                className="mt-1 w-full rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2 text-[13px] text-white"
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
            <label className="text-[11px] font-semibold text-amber-100/60">
              性别
              <select
                className="mt-1 w-full rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2 text-[13px] text-white"
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
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[13px] font-black text-white">左右手</div>
            <div className="mt-3 flex flex-wrap gap-3">
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
                  className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${
                    side === v
                      ? 'bg-white text-slate-900'
                      : 'border border-white/15 bg-white/5 text-white/70'
                  }`}
                >
                  {lab}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label className="text-[11px] font-semibold text-white/45">
            关注点（可选 · 会写入综合建议）
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[13px] text-white placeholder:text-white/25"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder={isFace ? '如：精神面、沟通表达、职场形象' : '如：事业线、行动节奏、掌丘'}
            />
          </label>
          <label className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-white/55">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={allowSeo}
              onChange={(e) => setAllowSeo(e.target.checked)}
            />
            <span>
              授权将本照片转为<strong className="text-white/80">脱敏线图</strong>
              用于教学/SEO（不公开原图）。
            </span>
          </label>
        </section>

        {/* What you get */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
          <div className="text-[12px] font-black text-white/90">报告将包含</div>
          <ul className="mt-2 grid gap-1.5 text-[11px] text-white/55 sm:grid-cols-2">
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
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-4 text-[15px] font-black text-white shadow-xl shadow-indigo-500/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? status || '生成系统报告…' : '生成系统报告（物理 → 命理 → 综合）'}
        </button>

        <div className="flex flex-wrap gap-3 text-[12px]">
          <Link href="/tools/naming" className="font-semibold text-indigo-300 underline">
            起名工坊
          </Link>
          <Link
            href={isFace ? '/tools/palmistry' : '/tools/physiognomy'}
            className="text-white/50 underline"
          >
            {isFace ? '手相' : '面相'}
          </Link>
          <Link href="/tools/fengshui-space" className="text-white/50 underline">
            空间场
          </Link>
          <Link href="/analyze" className="text-white/50 underline">
            八字排盘
          </Link>
        </div>

        <p className="text-[11px] leading-relaxed text-white/30">
          报告结构固定为：成像与物理分区 → 命理气机/用神交叉 → 可验证动作与边界。照片默认仅本人会话可见。禁止疾病、寿命与定命断语。
        </p>
      </div>
    </div>
  );
}
