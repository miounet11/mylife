'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import AnnualReviewCard from '@/components/annual-review/annual-review-card';
import { buildAnnualReview } from '@/lib/annual-review/build-review';
import { shouldShowAnnualReviewEmailGate } from '@/lib/life-profile/calibration-status';
import { getOrCreateProfile, hydrateLifeProfilesFromServer } from '@/lib/life-profile/store';
import { getAllPredictions, hydratePredictionsFromServer } from '@/lib/predictions/store';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { fetchJsonWithTimeout } from '@/lib/utils';
import type { Prediction } from '@/lib/predictions/types';

const YEAR_OPTIONS = Array.from({ length: 4 }, (_, index) => new Date().getFullYear() - index);

export default function AnnualReviewPageBody() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(YEAR_OPTIONS[1] ?? new Date().getFullYear() - 1);
  const [birthSignature, setBirthSignature] = useState('');
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'annual-review-settings' },
        );
        if (!response.ok || !data.success) {
          setError('无法读取测算资料，请先完善出生信息。');
          return;
        }

        const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
        if (!primary?.birthDate) {
          setError('还没有可用的出生资料，请先创建档案。');
          return;
        }

        setAccountEmail(data.account?.email || null);
        await Promise.all([hydrateLifeProfilesFromServer(), hydratePredictionsFromServer()]);
        setPredictions(getAllPredictions());
        setProfileVersion((value) => value + 1);
        setBirthSignature(
          buildBirthSignature({
            birthDate: primary.birthDate,
            birthTime: primary.birthTime,
            birthPlace: primary.birthPlace,
            birthAccuracy: primary.birthAccuracy,
            gender: primary.gender,
          }),
        );
      } catch {
        setError('加载档案失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const review = useMemo(() => {
    if (!birthSignature) return null;
    const profile = getOrCreateProfile(birthSignature);
    return buildAnnualReview(profile, year, { predictions });
  }, [birthSignature, year, profileVersion, predictions]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在汇总年度复盘…
      </div>
    );
  }

  if (error) {
    return (
      <section className="fb-card p-5">
        <p className="text-sm text-[color:var(--ink-3)]">{error}</p>
        <Link href="/analyze" className="fb-btn fb-btn-primary mt-4 h-9 px-4 text-sm hover:no-underline">
          去创建档案
        </Link>
      </section>
    );
  }

  if (!review) return null;

  const hasData =
    review.totalPredictions > 0 ||
    review.feedbackCount > 0 ||
    review.highlights.length > 0 ||
    review.misses.length > 0;

  const showEmailGate = shouldShowAnnualReviewEmailGate({
    hitRate: review.hitRate,
    hasEmail: Boolean(accountEmail),
  });

  return (
    <div className="space-y-4">
      {showEmailGate ? (
        <section className="fb-card border-[color:var(--warning-border,#f5d9a8)] bg-[color:var(--warning-soft,#fff8eb)] p-4 md:p-5">
          <div className="lk-section-eyebrow text-[color:var(--warning-strong,#9a6700)]">命中率门禁</div>
          <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
            当前命中率 {Math.round(review.hitRate * 100)}%，建议先绑定邮箱
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">
            低于 60% 时，跨年校准需要保留历史预测与反馈。绑定邮箱后，预测会同步到账号，年度复盘才能持续收敛。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/membership?intent=annual_review_gate" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              绑定邮箱并保存预测
            </Link>
            <Link href="/predictions" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              先完成预测回访
            </Link>
          </div>
        </section>
      ) : null}

      <section className="fb-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-5)]">
            复盘年份
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            汇总该年的预测反馈与人生事件，生成命中率与校准建议。
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-2)]">
          选择年份
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-9 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-white px-3 text-sm"
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} 年
              </option>
            ))}
          </select>
        </label>
      </section>

      {hasData ? (
        <AnnualReviewCard review={review} />
      ) : (
        <section className="fb-card p-5">
          <h2 className="text-sm font-bold text-[color:var(--ink-1)]">{year} 年暂无足够复盘数据</h2>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-3)]">
            先完成报告预测回访，或记录当年真实人生事件，系统才能汇总命中率与校准建议。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/predictions" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
              去预测回访
            </Link>
            <Link href="/profile/events" className="fb-btn h-9 px-4 text-sm hover:no-underline">
              记录人生事件
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}