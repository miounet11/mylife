'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { trackFunnel } from '@/components/funnel-tracker';

/* ── Report Page V6 — Guided Report Viewer ── */

const intentOptions = [
  { key: 'career', label: '事业发展', text: '适合看职业方向、升迁窗口、转型节奏。' },
  { key: 'wealth', label: '财运规划', text: '适合看收入结构、合作风险、积累周期。' },
  { key: 'relationship', label: '婚恋关系', text: '适合看关系模式、相处节奏、关键年份。' },
  { key: 'yearly', label: '年度流年', text: '适合看今年重点、月份节奏、近期取舍。' },
] as const;

const accuracyOptions = [
  { key: 'exact', label: '准确到分钟', text: '可信度最高，可细看时柱与具体窗口。' },
  { key: 'range', label: '大致时段', text: '可看整体趋势，时柱细节会降低权重。' },
  { key: 'unknown', label: '不确定时间', text: '先看年/月/日结构，避免过度解读时柱。' },
] as const;

type IntentKey = (typeof intentOptions)[number]['key'];
type AccuracyKey = (typeof accuracyOptions)[number]['key'];

const intentCopy: Record<IntentKey, { title: string; focus: string; next: string }> = {
  career: {
    title: '先看事业主线，再决定今年怎么发力',
    focus: '重点解读职业优势、转型窗口、团队合作与升迁节奏。',
    next: '下一步建议：把当前工作状态、想换/想升/想稳的目标补充进会员报告。',
  },
  wealth: {
    title: '先看财富结构，再判断适合稳守还是扩张',
    focus: '重点解读收入来源、合作风险、长期积累与关键财运窗口。',
    next: '下一步建议：把收入类型、投资偏好和近期重大支出补充进会员报告。',
  },
  relationship: {
    title: '先看关系模式，再看关键年份与相处策略',
    focus: '重点解读亲密关系节奏、沟通模式、伴侣画像与容易卡住的位置。',
    next: '下一步建议：把单身/恋爱/已婚状态补充进会员报告，让建议更贴近现实。',
  },
  yearly: {
    title: '先看年度节奏，再安排近期取舍',
    focus: '重点解读今年机会、压力来源、月份节奏与适合推进的事项。',
    next: '下一步建议：把今年最关心的一个问题写进会员报告，获得更具体的行动顺序。',
  },
};

export default function ReportClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailStarted, setEmailStarted] = useState(false);
  const [source, setSource] = useState('direct');
  const [intent, setIntent] = useState<IntentKey>('career');
  const [accuracy, setAccuracy] = useState<AccuracyKey>('range');
  const [birthDate, setBirthDate] = useState('1994-02-14');
  const [birthTime, setBirthTime] = useState('09:30');
  const [birthPlace, setBirthPlace] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceFromUrl = params.get('source') || 'direct';
    const intentFromUrl = params.get('intent') as IntentKey | null;
    const emailFromUrl = params.get('email')?.trim().toLowerCase();
    const emailFromStorage = localStorage.getItem('life-kline:lead-email')?.trim().toLowerCase();
    const initialEmail = emailFromUrl || emailFromStorage || '';

    setSource(sourceFromUrl);
    if (intentFromUrl && intentOptions.some((option) => option.key === intentFromUrl)) setIntent(intentFromUrl);
    if (initialEmail) setEmail(initialEmail);
    trackFunnel('report_page_view', {
      source: sourceFromUrl,
      intent: intentFromUrl || 'free_report',
      has_email: initialEmail ? 'true' : 'false',
    });
  }, []);

  const normalizedEmail = email.trim().toLowerCase();
  const activeIntent = intentCopy[intent];
  const activeAccuracy = accuracyOptions.find((option) => option.key === accuracy) || accuracyOptions[1];
  const membershipHref = useMemo(() => {
    const params = new URLSearchParams({ source: emailSaved ? 'report_email_bound' : 'report_email_save', intent });
    if (normalizedEmail) params.set('email', normalizedEmail);
    return `/membership?${params.toString()}`;
  }, [normalizedEmail, emailSaved, intent]);

  async function handleGenerate() {
    const normalizedEmail = persistLeadEmail('report_generate');
    trackFunnel('report_generate_click', {
      has_email: normalizedEmail ? 'true' : 'false',
      intent,
      accuracy,
    });
    if (normalizedEmail) {
      setEmailSaved(true);
      trackFunnel('report_email_saved', { has_email: 'true', source: 'report_generate' });
    } else {
      setEmailSaved(false);
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          birthPlace: birthPlace.trim() || undefined,
          email: normalizedEmail || undefined,
          source,
          intent,
          gender,
          birthAccuracy: accuracy,
          birthTime: accuracy === 'unknown' ? undefined : birthTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
      setReportId(data?.meta?.reportId || null);
      if (data?.meta?.emailSaved) setEmailSaved(true);
      trackFunnel('report_generated', { status: 'ok', intent, accuracy });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      trackFunnel('report_generate_failed', { reason: err?.message ? String(err.message).slice(0, 120) : 'unknown' });
    } finally {
      setLoading(false);
    }
  }

  function persistLeadEmail(source: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return '';

    try {
      localStorage.setItem('life-kline:lead-email', normalizedEmail);
      localStorage.setItem('life-kline:lead-source', source);
    } catch {
      // Funnel tracking must not block the user journey.
    }

    setEmail(normalizedEmail);
    return normalizedEmail;
  }

  function handleEmailStart() {
    if (emailStarted) return;
    setEmailStarted(true);
    trackFunnel('report_email_started', { has_prefill: email ? 'true' : 'false' });
  }

  async function handleSaveEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = persistLeadEmail('report_email_save');
    if (!normalizedEmail) return;

    try {
      const res = await fetch('/api/membership/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          source: 'report_email_save',
          intent,
          birthDate,
          birthTime: accuracy === 'unknown' ? undefined : birthTime,
          birthPlace: birthPlace.trim() || undefined,
          birthAccuracy: accuracy,
          reportId: reportId || undefined,
          reportSnapshot: result || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (data.reportId) setReportId(data.reportId);
    } catch (err: any) {
      setError(err.message || '邮箱保存失败，请稍后重试。');
      return;
    }

    setEmailSaved(true);
    trackFunnel('report_email_saved', { has_email: 'true' });
  }

  function handleMembershipClick() {
    const normalizedEmail = persistLeadEmail('report_membership_click');
    trackFunnel('report_membership_click', {
      has_email: normalizedEmail ? 'true' : 'false',
      email_saved: emailSaved ? 'true' : 'false',
      intent,
    });
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <header className="premium-card space-y-5">
        <div className="space-y-3">
          <p className="text-xs text-gold uppercase tracking-[0.2em]">免费八字命理测算</p>
          <h1 className="h1-premium">先选你最关心的问题，再生成八字人生K线报告</h1>
          <p className="text-sm text-muted max-w-2xl">
            不需要先看一堆术语。先告诉系统你想看事业、财运、婚恋还是今年流年，再补出生信息；出生时间不确定也可以生成，报告会标明可信度边界。
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm" aria-label="测算流程">
          {[
            ['1', '选择问题', '先确定本次报告最该回答什么'],
            ['2', '补充出生信息', '日期必填，时间不确定也可继续'],
            ['3', '生成报告', '先看结论与建议，再决定是否保存完整版'],
          ].map(([step, title, text]) => (
            <li key={step} className="rounded-lg border border-white/10 p-3 bg-white/[0.02]">
              <div className="text-xs text-gold">Step {step}</div>
              <div className="font-semibold text-white mt-1">{title}</div>
              <div className="text-xs text-muted mt-1">{text}</div>
            </li>
          ))}
        </ol>
      </header>

      <section className="premium-card space-y-4" aria-labelledby="intent-title">
        <div>
          <p className="text-xs text-gold uppercase tracking-[0.2em]">Step 1</p>
          <h2 id="intent-title" className="text-xl font-semibold text-white mt-2">你这次最想解决什么问题？</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {intentOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setIntent(option.key)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                intent === option.key
                  ? 'border-[var(--color-ming-gold)]/60 bg-[var(--color-ming-gold)]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-[var(--color-ming-gold)]/30'
              }`}
            >
              <div className="font-semibold text-gold">{option.label}</div>
              <p className="text-sm text-muted mt-2">{option.text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="premium-card space-y-4" aria-labelledby="birth-title">
        <div>
          <p className="text-xs text-gold uppercase tracking-[0.2em]">Step 2</p>
          <h2 id="birth-title" className="text-xl font-semibold text-white mt-2">出生信息越准确，报告越能解释具体窗口</h2>
          <p className="text-sm text-muted mt-2">如果不确定出生时间，系统仍会生成报告，但会降低时柱相关判断的权重。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="space-y-2 text-sm">
            <span className="text-muted">性别</span>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as 'male' | 'female')}
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-ming-gold)]/50"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted">出生日期</span>
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-ming-gold)]/50"
              required
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted">出生时间</span>
            <input
              type="time"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              disabled={accuracy === 'unknown'}
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-40 focus:outline-none focus:border-[var(--color-ming-gold)]/50"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted">出生地（可选）</span>
            <input
              value={birthPlace}
              onChange={(event) => setBirthPlace(event.target.value)}
              placeholder="例如：上海"
              className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-[var(--color-ming-gold)]/50"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {accuracyOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setAccuracy(option.key)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                accuracy === option.key
                  ? 'border-[var(--color-ming-gold)]/60 bg-[var(--color-ming-gold)]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-[var(--color-ming-gold)]/30'
              }`}
            >
              <div className="font-semibold text-white">{option.label}</div>
              <p className="text-xs text-muted mt-2">{option.text}</p>
            </button>
          ))}
        </div>

        <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-muted">
          当前可信度提示：{activeAccuracy.text} 报告会优先给出可验证的结构判断，不把不确定的时柱细节说成定论。
        </p>
      </section>

      <section className="premium-card space-y-4" aria-labelledby="generate-title">
        <div>
          <p className="text-xs text-gold uppercase tracking-[0.2em]">Step 3</p>
          <h2 id="generate-title" className="text-xl font-semibold text-white mt-2">生成报告并保存入口</h2>
          <p className="text-sm text-muted mt-2">邮箱可选；填写后会带到会员页，后续保存完整报告时不用重复输入。</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleGenerate();
          }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3"
        >
          <input
            type="email"
            value={email}
            onFocus={handleEmailStart}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailSaved(false);
            }}
            placeholder="邮箱（可选，用于保存完整版报告）"
            autoComplete="email"
            className="w-full rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-[var(--color-ming-gold)]/50"
          />
          <button
            type="submit"
            disabled={loading || !birthDate}
            className="px-5 py-3 rounded-lg bg-[var(--color-ming-gold)]/20 text-gold border border-[var(--color-ming-gold)]/30 hover:bg-[var(--color-ming-gold)]/30 transition-colors disabled:opacity-50 font-semibold"
          >
            {loading ? '正在生成...' : '生成免费报告'}
          </button>
        </form>
      </section>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {!result && !error && (
        <section className="premium-card space-y-3">
          <h2 className="text-lg font-semibold text-gold">报告会先回答什么？</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted">
            <p>{activeIntent.focus}</p>
            <p>免费版先给结构结论、可信度边界和下一步建议；会员版再展开事业、财运、婚恋、健康与年度窗口。</p>
          </div>
        </section>
      )}

      {result && (
        <div className="space-y-4">
          <section className="premium-card space-y-3">
            <p className="text-xs text-gold uppercase tracking-[0.2em]">你的报告摘要</p>
            <h2 className="text-xl font-semibold text-white">{activeIntent.title}</h2>
            <p className="text-sm text-muted">{activeIntent.focus}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <SummaryCard label="出生信息可信度" value={activeAccuracy.label} detail={activeAccuracy.text} />
              <SummaryCard label="当前报告重点" value={intentOptions.find((option) => option.key === intent)?.label || '年度流年'} detail="系统已按你选择的问题组织解读顺序。" />
              <SummaryCard label="结果一致性" value={result.review?.verdict || '已生成'} detail="已隐藏内部任务日志，只保留用户可读结论。" />
            </div>
          </section>

          <section className="premium-card space-y-3">
            <h3 className="text-lg font-semibold text-gold">免费版先看这 3 件事</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {[
                ['命盘结构', '先判断五行强弱、日主状态和当前阶段的主要驱动力。'],
                ['年度节奏', '把大运与流年转成可执行的高点、低点和调整窗口。'],
                ['行动建议', activeIntent.next],
              ].map(([title, text]) => (
                <article key={title} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <h4 className="font-semibold text-white">{title}</h4>
                  <p className="text-muted mt-2">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="premium-card space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-gold">绑定邮箱，方便后续召回</h2>
              <p className="text-sm text-muted mt-1">
                绑定邮箱是为了后续方便召回你、跨设备找回报告，并保持持续关系。开通会员时会自动带上邮箱，无需重复填写。
              </p>
            </div>
            <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onFocus={handleEmailStart}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="常用邮箱"
                className="flex-1 rounded-lg bg-black/20 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-[var(--color-ming-gold)]/50"
                required
              />
              <button className="rounded-lg bg-[var(--color-ming-gold)]/20 px-4 py-3 text-sm font-semibold text-gold border border-[var(--color-ming-gold)]/30 hover:bg-[var(--color-ming-gold)]/30 transition-colors">
                绑定邮箱
              </button>
              <a
                href={membershipHref}
                onClick={handleMembershipClick}
                className="inline-flex justify-center rounded-lg px-4 py-3 text-sm font-semibold text-muted border border-white/10 hover:text-gold hover:border-[var(--color-ming-gold)]/30 transition-colors"
              >
                两步 0 元领会员
              </a>
            </form>
            {emailSaved && (
              <p className="text-sm text-green-400">
                已绑定到 {email}。之后可用同一邮箱回看；也可继续领取会员保持持续关系。
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-gold mt-2">{value}</div>
      <p className="text-xs text-muted mt-2">{detail}</p>
    </div>
  );
}
