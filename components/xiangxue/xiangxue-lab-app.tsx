'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { XiangxueKind } from '@/lib/xiangxue';

type Props = { kind: XiangxueKind };

export function XiangxueLabApp({ kind }: Props) {
  const title = kind === 'face' ? '面相结构观察' : '手相结构观察';
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [side, setSide] = useState<'left' | 'right' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [allowSeo, setAllowSeo] = useState(false);
  const [useProfile, setUseProfile] = useState(false);
  const [fortuneId, setFortuneId] = useState('');
  const [fortunes, setFortunes] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/fengshui/space/link-bazi');
        const data = await res.json();
        if (data.fortunes) setFortunes(data.fortunes);
        else if (data.profileLink)
          setFortunes([{ id: data.profileLink.fortuneId, name: data.profileLink.displayName || '主盘' }]);
      } catch {
        // ignore
      }
    })();
  }, []);

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
      setError(kind === 'face' ? '请先上传面部照片' : '请先上传手掌照片');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus('上传并分析中…');
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 55_000);
    try {
      const res = await fetch('/api/xiangxue/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          kind,
          imageDataUrl: preview,
          birthDate: birthDate || undefined,
          gender: gender === 'unknown' ? undefined : gender,
          side: side === 'unknown' ? undefined : side,
          note: note || undefined,
          allowSeoLineArt: allowSeo,
          fortuneId: useProfile && fortuneId ? fortuneId : undefined,
          useLlm: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.resultUrl) {
        throw new Error(data.error || '分析失败');
      }
      setStatus('进入结果页…');
      window.location.assign(data.resultUrl);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === 'AbortError'
            ? '超时，请重试'
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
    <div className="mx-auto max-w-2xl space-y-5 px-3 py-6 sm:px-4">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
          相学文化观察 · 非定命
        </div>
        <h1 className="text-[26px] font-black tracking-tight">{title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
          {kind === 'face'
            ? '上传面部照片，结合可选生辰做结构观察。照片存于账号媒体库（R2/本机），默认私有。'
            : '上传手掌照片，观察掌纹/掌丘结构。照片关联用户并持久化，可授权脱敏线图用于内容。'}
        </p>
      </header>

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      ) : null}
      {status && busy ? (
        <div className="rounded-lg bg-indigo-50 px-3 py-2 text-[12px] font-semibold text-indigo-800">
          {status}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-[12px] font-bold text-slate-800">
          {kind === 'face' ? '1. 上传面部照片' : '1. 上传手掌照片'}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="mt-2 block w-full text-[13px]"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="预览"
            className="mt-3 max-h-64 w-auto rounded-lg border border-slate-100 object-contain"
          />
        ) : (
          <p className="mt-2 text-[11px] text-slate-400">
            {kind === 'face'
              ? '建议：正面、自然光、无浓妆滤镜、脸部占画面一半以上'
              : '建议：手心向上、五指自然张开、掌心占画面 60%+，避免反光'}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
        <div className="text-[12px] font-bold text-amber-900">2. 天时（生辰，建议）</div>
        <p className="mt-1 text-[11px] text-amber-800/80">
          与起名相同：有生辰可做人像/掌纹与用神交叉阅读；没有则仅图像结构观察。
        </p>
        {fortunes.length > 0 ? (
          <label className="mt-2 flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(e) => setUseProfile(e.target.checked)}
            />
            使用已有生辰档案
          </label>
        ) : null}
        {useProfile && fortunes.length ? (
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
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
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-semibold text-slate-500">
            出生日期
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-slate-500">
            性别
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
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

      {kind === 'palm' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[12px] font-bold">左右手</div>
          <div className="mt-2 flex gap-4 text-[13px]">
            {(
              [
                ['left', '左手'],
                ['right', '右手'],
                ['unknown', '未指定'],
              ] as const
            ).map(([v, lab]) => (
              <label key={v} className="flex items-center gap-1">
                <input type="radio" checked={side === v} onChange={() => setSide(v)} />
                {lab}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-[11px] font-semibold text-slate-500">
          关注点（可选）
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder={kind === 'face' ? '如：精神面、沟通表达' : '如：事业线、掌丘'}
          />
        </label>
        <label className="mt-3 flex items-start gap-2 text-[12px] text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={allowSeo}
            onChange={(e) => setAllowSeo(e.target.checked)}
          />
          <span>
            授权将本照片转为<strong>脱敏线图</strong>用于教学/SEO 文章（不公开原图、不做人脸识别档案）。
          </span>
        </label>
      </section>

      <button
        type="button"
        disabled={busy || !preview}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
      >
        {busy ? status || '分析中…' : '开始结构观察'}
      </button>

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link href="/tools/naming" className="font-semibold text-indigo-700 underline">
          起名中心
        </Link>
        <Link href="/tools/fengshui-space" className="underline">
          空间场
        </Link>
        <Link href={kind === 'face' ? '/tools/palmistry' : '/tools/physiognomy'} className="underline">
          {kind === 'face' ? '手相' : '面相'}
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        文化观察 · 非医学诊断 · 非命运定数。照片默认仅本人会话可见。
      </p>
    </div>
  );
}
