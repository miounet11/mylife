/**
 * v6-Q2 / v6-Q4: Apply site_feedback calibration onto fortune.analysis
 * without over-painting all past-event templates.
 *
 * Rules:
 * - past_event deny → only matching templateKey / keyword hits
 * - accuracy rating → accuracyScore only (do not deny templates)
 * - birth certainty → birthAccuracy / notes only
 * Safe no-op when report missing or local DB stub.
 */

import { fortuneOperations } from '@/lib/database';
import { parseCalibrationMeta } from '@/lib/feedback-signal';

export function applyPastEventCalibrationFromFeedback(input: {
  category?: string | null;
  message: string;
  pageUrl?: string | null;
  userId?: string | null;
}): { applied: boolean; reportId?: string; reason?: string } {
  const message = `${input.message || ''}`.trim();
  const category = `${input.category || ''}`.trim();
  if (!message) return { applied: false, reason: 'empty' };

  const meta = parseCalibrationMeta(message);
  const isCalibrationCategory =
    category === 'content_wrong' ||
    category === 'suggestion' ||
    meta.kind !== 'freeform' ||
    /校准|未发生|时辰不确定|时辰大概|部分准|不准|准确度/.test(message);
  if (!isCalibrationCategory) return { applied: false, reason: 'not_calibration' };

  const idMatch =
    meta.reportId ||
    message.match(/reportId\s*[=:]\s*(report_[a-zA-Z0-9_]+)/i)?.[1] ||
    message.match(/\b(report_[a-zA-Z0-9_]+)\b/)?.[1] ||
    `${input.pageUrl || ''}`.match(/\/(?:result|r)\/(report_[a-zA-Z0-9_]+)/i)?.[1] ||
    null;

  const reportId = idMatch || undefined;
  if (!reportId) return { applied: false, reason: 'no_report_id' };

  const getById = (fortuneOperations as { getById?: (id: string) => any }).getById;
  const update = (fortuneOperations as { update?: (id: string, patch: any) => any }).update;
  if (typeof getById !== 'function' || typeof update !== 'function') {
    return { applied: false, reason: 'fortune_ops_unavailable', reportId };
  }

  const report = getById(reportId);
  if (!report?.analysis) return { applied: false, reason: 'report_not_found', reportId };

  const analysis = { ...(report.analysis || {}) };
  const templates = Array.isArray(analysis.pastEventTemplates)
    ? analysis.pastEventTemplates.map((t: any) => ({ ...t }))
    : [];

  let changed = 0;
  const kind = meta.kind;

  // --- Accuracy rating: score only ---
  if (kind === 'accuracy' || /报告准确度反馈/.test(message)) {
    const level = meta.level || 'partial';
    const score =
      level === 'good' || /整体较准/.test(message)
        ? 88
        : level === 'bad' || /偏差较大/.test(message)
          ? 42
          : 62;
    analysis.userAccuracyRating = {
      level:
        score >= 80 ? 'good' : score <= 50 ? 'bad' : 'partial',
      score,
      note: message.slice(0, 200),
      at: new Date().toISOString(),
      source: 'site_feedback',
    };
    analysis.calibrationNotes = [
      ...((analysis.calibrationNotes as string[]) || []),
      `用户准确度：${analysis.userAccuracyRating.level}（${score}）`,
    ].slice(-10);
    changed += 1;
  }

  // --- Birth hour certainty: birthAccuracy only ---
  if (kind === 'birth_hour' || /出生时辰把握/.test(message)) {
    if (/时辰不确定|level\s*[=:]\s*unknown/i.test(message)) {
      analysis.birthAccuracy = 'unknown';
      analysis.calibrationNotes = [
        ...((analysis.calibrationNotes as string[]) || []),
        '用户反馈时辰不确定：时柱相关结论应降权。',
      ].slice(-10);
    } else if (/大概知道|level\s*[=:]\s*approx/i.test(message)) {
      analysis.birthAccuracy = 'range';
      analysis.calibrationNotes = [
        ...((analysis.calibrationNotes as string[]) || []),
        '用户反馈时辰大概：时柱相关结论中等置信。',
      ].slice(-10);
    } else if (/时辰确定|level\s*[=:]\s*exact/i.test(message)) {
      analysis.birthAccuracy = 'exact';
      analysis.calibrationNotes = [
        ...((analysis.calibrationNotes as string[]) || []),
        '用户确认时辰确定：可正常使用时柱。',
      ].slice(-10);
    }
    changed += 1;
  }

  // --- Past-event deny / confirm: only targeted templates ---
  const isPast =
    kind === 'past_event' ||
    /用户标记为未发生|校准：报告节点|templateKey=/.test(message);
  if (isPast && !/报告准确度反馈|出生时辰把握/.test(message)) {
    const keyHints: Array<{ re: RegExp; key: string }> = [
      { re: /事业|岗位|方向重排|换工作|career_shift/, key: 'career_shift' },
      { re: /关系|沟通|冷战|婚姻|relationship_tension/, key: 'relationship_tension' },
      { re: /健康|透支|睡眠|疲惫|health_overdraw/, key: 'health_overdraw' },
      { re: /钱财|现金流|财务|财富|money_rebalance/, key: 'money_rebalance' },
    ];
    const explicitKey = meta.templateKey;
    const hitKeys = explicitKey
      ? [explicitKey]
      : keyHints.filter((h) => h.re.test(message)).map((h) => h.key);
    const denied = meta.denied;

    // If we cannot target a template, do not paint all templates.
    if (hitKeys.length === 0 && !explicitKey) {
      analysis.calibrationNotes = [
        ...((analysis.calibrationNotes as string[]) || []),
        `未定位模板的校准：${message.slice(0, 120)}`,
      ].slice(-10);
      changed += 1;
    } else {
      for (const t of templates) {
        const key = `${t.key || ''}`;
        const should =
          hitKeys.includes(key) ||
          (t.title && hitKeys.some((k) => message.includes(k))) ||
          (t.title && message.includes(String(t.title).slice(0, 8)));
        if (!should) continue;
        t.confidenceLabel = denied ? 'low' : t.confidenceLabel || 'medium';
        t.userCalibration = {
          status: denied ? 'denied' : 'confirmed',
          note: message.slice(0, 240),
          at: new Date().toISOString(),
          source: 'site_feedback',
        };
        if (denied && t.description && !String(t.description).includes('用户已校准')) {
          t.description = `${t.description}（用户已校准：请勿再当作已发生事实）`;
        }
        changed += 1;
      }
    }
  }

  if (!changed) return { applied: false, reason: 'no_template_match', reportId };

  analysis.pastEventTemplates = templates;
  analysis.calibrationUpdatedAt = new Date().toISOString();

  const deniedKeys = templates
    .filter(
      (t: any) =>
        t?.userCalibration?.status === 'denied' || t?.confidenceLabel === 'denied',
    )
    .map((t: any) => `${t.key || ''}`)
    .filter(Boolean);
  const partialKeys = templates
    .filter(
      (t: any) =>
        t?.userCalibration?.status === 'partial' ||
        t?.userCalibration?.status === 'confirmed',
    )
    .map((t: any) => `${t.key || ''}`)
    .filter(Boolean);
  const total = Math.max(templates.length, 1);
  const accuracyPenalty =
    analysis.userAccuracyRating?.level === 'bad'
      ? 20
      : analysis.userAccuracyRating?.level === 'partial'
        ? 8
        : 0;
  const calibrationScore = Math.max(
    40,
    Math.min(
      100,
      100 - deniedKeys.length * 18 - partialKeys.filter((k) =>
        templates.find((t: any) => t.key === k)?.userCalibration?.status === 'partial',
      ).length *
        8 -
        accuracyPenalty,
    ),
  );
  analysis.calibrationScore = calibrationScore;
  analysis.calibrationSummary = {
    score: calibrationScore,
    deniedKeys,
    partialKeys: deniedKeys.length
      ? templates
          .filter((t: any) => t?.userCalibration?.status === 'partial')
          .map((t: any) => `${t.key || ''}`)
          .filter(Boolean)
      : [],
    templateCount: total,
    accuracy: analysis.userAccuracyRating || null,
    birthAccuracy: analysis.birthAccuracy || null,
    updatedAt: analysis.calibrationUpdatedAt,
  };
  const signals = {
    ...((analysis.contextSignals as Record<string, unknown>) || {}),
    calibration: {
      score: calibrationScore,
      deniedKeys,
      note: message.slice(0, 200),
      kind,
    },
  };
  analysis.contextSignals = signals;

  try {
    update(reportId, { analysis });
  } catch (e) {
    return {
      applied: false,
      reason: e instanceof Error ? e.message : 'update_failed',
      reportId,
    };
  }

  return { applied: true, reportId };
}
