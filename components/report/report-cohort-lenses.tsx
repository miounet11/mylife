'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import {
  applyJudgments,
  buildCohortClaims,
  buildCohortMirror,
  emptyCalibration,
  getCohortFacts,
  matchStats,
  mergeCalibrations,
  sanitizeCalibration,
  type CohortCalibrationState,
  type CohortLensId,
  type CohortVerdict,
} from '@/lib/cohort-lenses';
import { cohortStoreKey, writeCohortCalibration } from '@/lib/cohort-lenses/client-store';
import { recordCohortCalibration } from '@/lib/life-profile/store';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildReportContinueChatHref } from '@/lib/chat-entry';

const VERDICTS: Array<{ key: CohortVerdict; label: string }> = [
  { key: 'like', label: '像我' },
  { key: 'partial', label: '部分像' },
  { key: 'unlike', label: '不像' },
  { key: 'unsure', label: '不确定' },
];

type SaveResponse = {
  success?: boolean;
  error?: string;
  calibration?: CohortCalibrationState;
  summary?: string;
};

export default function ReportCohortLenses({
  reportId,
  birthDate,
  birthYear,
  birthPlace,
  birthSignature,
  initialCalibration = null,
  locale,
  canManage = false,
}: {
  reportId: string;
  birthDate?: string | null;
  birthYear?: number | null;
  birthPlace?: string | null;
  birthSignature?: string | null;
  initialCalibration?: CohortCalibrationState | null;
  locale?: string | null;
  canManage?: boolean;
}) {
  const seed = useMemo(
    () =>
      buildCohortMirror({
        birthDate,
        birthYear,
        birthPlace,
        calibration: initialCalibration,
        locale,
      }),
    [birthDate, birthYear, birthPlace, initialCalibration, locale],
  );
  const [calibration, setCalibration] = useState<CohortCalibrationState | null>(
    () => sanitizeCalibration(initialCalibration),
  );
  const [openLens, setOpenLens] = useState<CohortLensId | null>(
    () => seed?.lenses.find((lens) => !lens.judged)?.id || seed?.lenses[0]?.id || null,
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const view = useMemo(
    () =>
      buildCohortMirror({
        birthDate,
        birthYear,
        birthPlace,
        calibration,
        locale,
      }),
    [birthDate, birthYear, birthPlace, calibration, locale],
  );

  if (!view) return null;

  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const storeKey = cohortStoreKey({
    birthSignature,
    birthYear: view.birthYear,
    region: view.region,
  });
  const chatHref = buildReportContinueChatHref({
    reportId,
    source: 'cohort_lenses',
    teacher: 'overview',
    window: view.chatStarters[0] || null,
  });
  const currentStage = view.stages.find((item) => item.current);
  const stats = matchStats(calibration);

  const submit = async (input: {
    claimId: string;
    lensId: CohortLensId;
    verdict: CohortVerdict;
    forkId?: string;
    note?: string;
  }) => {
    if (busyKey) return;
    setBusyKey(input.claimId);
    setError('');
    const judgment = {
      claimId: input.claimId,
      lensId: input.lensId,
      verdict: input.verdict,
      forkId: input.forkId,
      note: input.note,
      judgedAt: new Date().toISOString(),
    };
    const claims = buildCohortClaims(getCohortFacts(view.birthYear), view.region);
    const next = applyJudgments(
      mergeCalibrations(
        calibration,
        emptyCalibration({
          birthYear: view.birthYear,
          cohortKey: view.cohortKey,
          region: view.region,
        }),
      )!,
      judgment,
      claims,
    );
    setCalibration(next);
    try {
      writeCohortCalibration(storeKey, next);
      if (birthSignature) {
        recordCohortCalibration(birthSignature, next);
      }
    } catch {
      // local persist is best-effort
    }
    try {
      const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/cohort-calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          birthSignature,
          birthYear: view.birthYear,
          birthDate,
          birthPlace,
          previous: next,
          judgment,
        }),
        timeoutMs: 12_000,
        timeoutReason: 'cohort-calibration',
      });
      if (response.ok && data.success && data.calibration) {
        setCalibration(data.calibration);
      } else if (!response.ok) {
        setError(data.error || (en ? 'Could not save' : '保存失败，已先记在本机'));
      }
      void trackClientEvent({
        eventName: 'cohort_claim_judged',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          lensId: input.lensId,
          verdict: input.verdict,
          claimId: input.claimId,
          forkId: input.forkId || '',
        },
      });
      const currentLens = view.lenses.find((lens) => lens.id === input.lensId);
      const lensDone = currentLens?.claims.every(
        (claim) => claim.id === input.claimId || claim.verdict,
      );
      if (lensDone) {
        void trackClientEvent({
          eventName: 'cohort_lens_completed',
          page: `/result/${reportId}`,
          meta: { reportId, lensId: input.lensId },
        });
        const nextLens = view.lenses.find(
          (lens) => lens.id !== input.lensId && !lens.judged,
        );
        if (nextLens) setOpenLens(nextLens.id);
      }
      setMessage(en ? 'Saved. Next report and chat will use this.' : '已写入个人上下文。下次报告和问顾问会按这条改口径。');
    } catch (e) {
      setError(isAbortLikeError(e) ? (en ? 'Timed out, retry' : '请求超时，请重试') : (en ? 'Saved locally' : '网络异常，已先记在本机'));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section id="pro-cohort" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div className="text-[12px] font-medium text-[color:var(--ink-5)]">
        {en ? 'Generation layer' : '世代校准'}
      </div>
      <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--ink-1)]">{view.headline}</h2>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{view.eraLine}</p>
      <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{view.compareLine}</p>
      <p className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-5)]">{view.disclaimer}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[12px] text-[color:var(--ink-3)]">
          <span>
            {en ? 'Checked' : '已核对'} {view.progress.judgedClaims}/{view.progress.totalClaims}
          </span>
          <span>
            {stats.overlapPct == null
              ? en
                ? 'Mark a few claims to score overlap'
                : '标几条就能看到与同代假设的重合度'
              : en
                ? `Overlap ${stats.overlapPct}%`
                : `与同代假设重合 ${stats.overlapPct}%`}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
          <div
            className="h-full rounded-full bg-[color:var(--ink-1)]"
            style={{
              width: `${Math.max(
                4,
                Math.round((view.progress.judgedClaims / Math.max(1, view.progress.totalClaims)) * 100),
              )}%`,
            }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--ink-3)]">
          <span>{en ? 'Like' : '像我'} {stats.like}</span>
          <span>{en ? 'Partial' : '部分像'} {stats.partial}</span>
          <span>{en ? 'Unlike' : '不像'} {stats.unlike}</span>
          {currentStage ? (
            <span>
              {en ? 'Stage' : '当前阶段'} · {currentStage.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2.5">
        <div className="text-[11px] font-bold text-[color:var(--ink-4)]">
          {en ? 'Personal context' : '个人上下文'}
        </div>
        <p className="mt-1 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">{view.memory.summary}</p>
        {view.memory.confirmed[0] ? (
          <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
            {en ? 'Locked in' : '已锁定'}：{view.memory.confirmed.slice(0, 3).join('；')}
          </p>
        ) : null}
        {view.memory.denied[0] ? (
          <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">
            {en ? 'Do not reuse' : '不再套用'}：{view.memory.denied.slice(0, 3).join('；')}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
        {view.lenses.map((lens) => (
          <button
            key={lens.id}
            type="button"
            onClick={() => setOpenLens(lens.id)}
            className={`underline-offset-2 ${
              openLens === lens.id
                ? 'font-medium text-[color:var(--ink-1)]'
                : 'text-[color:var(--ink-3)] hover:underline'
            }`}
          >
            {lens.judged ? <CheckCircle2 className="mr-0.5 inline h-3 w-3" /> : null}
            {lens.title}
          </button>
        ))}
      </div>

      {view.lenses
        .filter((lens) => lens.id === openLens)
        .map((lens) => (
          <div key={lens.id} className="mt-3 border-t border-[color:var(--hairline)] pt-3">
            <h3 className="text-[13px] font-medium text-[color:var(--ink-1)]">{lens.title}</h3>
            <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">{lens.subtitle}</p>
            <p className="mt-2 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{lens.overview}</p>
            <ul className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
              {lens.claims.map((claim) => {
                const done = Boolean(claim.verdict);
                const showForks = claim.verdict === 'unlike' && !claim.forkId && claim.forks.length > 0;
                return (
                  <li key={claim.id} className="py-2.5">
                    <div className="text-[13px] leading-[1.6] text-[color:var(--ink-1)]">{claim.text}</div>
                    <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">{claim.checkPrompt}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                      {VERDICTS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={!!busyKey}
                          onClick={() =>
                            void submit({
                              claimId: claim.id,
                              lensId: lens.id,
                              verdict: opt.key,
                              note: notes[claim.id],
                            })
                          }
                          className={`underline-offset-2 ${
                            claim.verdict === opt.key
                              ? 'font-medium text-[color:var(--ink-1)]'
                              : 'text-[color:var(--ink-3)] hover:underline'
                          }`}
                        >
                          {claim.verdict === opt.key ? (
                            <CheckCircle2 className="mr-0.5 inline h-3.5 w-3.5" />
                          ) : null}
                          {busyKey === claim.id && claim.verdict !== opt.key ? '…' : opt.label}
                        </button>
                      ))}
                    </div>
                    {showForks ? (
                      <div className="mt-2">
                        <div className="text-[11px] text-[color:var(--ink-5)]">
                          {en ? 'Closer to you?' : '更接近你的是？'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                          {claim.forks.map((fork) => (
                            <button
                              key={fork.id}
                              type="button"
                              disabled={!!busyKey}
                              onClick={() =>
                                void submit({
                                  claimId: claim.id,
                                  lensId: lens.id,
                                  verdict: 'unlike',
                                  forkId: fork.id,
                                })
                              }
                              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                            >
                              {fork.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {claim.forkId ? (
                      <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
                        {en ? 'Adjusted to' : '已改成'}：
                        {claim.forks.find((item) => item.id === claim.forkId)?.label}
                      </p>
                    ) : null}
                    {done ? (
                      <label className="mt-2 block">
                        <span className="text-[11px] text-[color:var(--ink-5)]">
                          {en ? 'Optional correction' : '可选补充一句（会写入下次报告）'}
                        </span>
                        <input
                          type="text"
                          value={notes[claim.id] ?? claim.note ?? ''}
                          onChange={(event) =>
                            setNotes((current) => ({ ...current, [claim.id]: event.target.value }))
                          }
                          onBlur={() => {
                            const note = (notes[claim.id] ?? '').trim();
                            if (!note || note === claim.note || !claim.verdict) return;
                            void submit({
                              claimId: claim.id,
                              lensId: lens.id,
                              verdict: claim.verdict,
                              forkId: claim.forkId,
                              note,
                            });
                          }}
                          className="mt-1 w-full border-0 border-b border-[color:var(--hairline)] bg-transparent py-1 text-[13px] text-[color:var(--ink-1)] outline-none"
                          placeholder={en ? 'One sentence' : '例如：我其实是留守儿童'}
                        />
                      </label>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      {openLens === 'roadmap' ? (
        <ol className="mt-3 space-y-2 border-t border-[color:var(--hairline)] pt-3">
          {view.stages.map((stage) => (
            <li
              key={stage.id}
              className={`text-[13px] leading-[1.55] ${
                stage.current ? 'text-[color:var(--ink-1)]' : 'text-[color:var(--ink-4)]'
              }`}
            >
              <span className="font-medium">
                {stage.current ? (en ? 'Now · ' : '当前 · ') : ''}
                {stage.label}
              </span>
              {' — '}
              {en ? 'Priority' : '优先'}：{stage.priority}；{en ? 'Watch' : '当心'}：{stage.watch}；
              {en ? 'Decide' : '决策'}：{stage.decision}
            </li>
          ))}
        </ol>
      ) : null}

      {view.progress.judgedClaims > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <Link href={chatHref} className="text-[color:var(--ink-1)] underline-offset-2 hover:underline">
            {en ? 'Ask with this context' : '带着这些判断去问顾问'}
          </Link>
          {view.chatStarters[0] ? (
            <span className="text-[12px] text-[color:var(--ink-5)]">{view.chatStarters[0]}</span>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-[12px] font-semibold text-[#047857]">{message}</p> : null}
      {error ? <p className="mt-2 text-[12px] text-[color:var(--alert)]">{error}</p> : null}
      {!canManage ? (
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          {en
            ? 'Judgments stay on this device unless you are signed in.'
            : '未登录时判断先记在本机；登录后会写入长期档案和这份报告。'}
        </p>
      ) : null}
    </section>
  );
}
