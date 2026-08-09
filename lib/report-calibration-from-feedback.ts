/**
 * v6-Q2: Apply site_feedback content_wrong / calibration onto
 * fortune.analysis.pastEventTemplates (lower confidence, mark denied).
 * Safe no-op when report missing or local DB stub.
 */

import { fortuneOperations } from '@/lib/database';

export function applyPastEventCalibrationFromFeedback(input: {
  category?: string | null;
  message: string;
  pageUrl?: string | null;
  userId?: string | null;
}): { applied: boolean; reportId?: string; reason?: string } {
  const message = `${input.message || ''}`.trim();
  const category = `${input.category || ''}`.trim();
  if (!message) return { applied: false, reason: 'empty' };

  const isCalibrationCategory =
    category === 'content_wrong' ||
    category === 'suggestion' ||
    /校准|未发生|时辰不确定|时辰大概|部分准|不准/.test(message);
  if (!isCalibrationCategory) return { applied: false, reason: 'not_calibration' };

  const idMatch =
    message.match(/reportId\s*[=:]\s*(report_[a-zA-Z0-9_]+)/i) ||
    message.match(/\b(report_[a-zA-Z0-9_]+)\b/) ||
    `${input.pageUrl || ''}`.match(/\/(?:result|r)\/(report_[a-zA-Z0-9_]+)/i);

  const reportId = idMatch?.[1];
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

  const keyHints: Array<{ re: RegExp; key: string }> = [
    { re: /事业|岗位|方向重排|换工作/, key: 'career_shift' },
    { re: /关系|沟通|冷战|婚姻/, key: 'relationship_tension' },
    { re: /健康|透支|睡眠|疲惫/, key: 'health_overdraw' },
    { re: /钱财|现金流|财务|财富/, key: 'money_rebalance' },
  ];
  const hitKeys = keyHints.filter((h) => h.re.test(message)).map((h) => h.key);
  const denied = /未发生|没有发生|标记为未发生/.test(message);

  let changed = 0;
  for (const t of templates) {
    const key = `${t.key || ''}`;
    const should =
      hitKeys.length === 0 ||
      hitKeys.includes(key) ||
      (t.title && message.includes(String(t.title).slice(0, 6)));
    if (!should && hitKeys.length > 0) continue;
    t.confidenceLabel = 'low';
    t.userCalibration = {
      status: denied ? 'denied' : 'partial',
      note: message.slice(0, 240),
      at: new Date().toISOString(),
      source: 'site_feedback',
    };
    if (t.description && !String(t.description).includes('用户已校准')) {
      t.description = `${t.description}（用户已校准：请勿再当作已发生事实）`;
    }
    changed += 1;
  }

  if (/时辰不确定|时辰大概/.test(message)) {
    analysis.birthAccuracy =
      analysis.birthAccuracy === 'exact' ? 'range' : analysis.birthAccuracy || 'range';
    analysis.calibrationNotes = [
      ...((analysis.calibrationNotes as string[]) || []),
      '用户反馈时辰不确定：时柱相关结论应降权。',
    ].slice(-8);
    changed += 1;
  }

  if (!changed) return { applied: false, reason: 'no_template_match', reportId };

  analysis.pastEventTemplates = templates;
  analysis.calibrationUpdatedAt = new Date().toISOString();

  // Closed-loop calibration signal for chat / upgrade / quality receipt
  const deniedKeys = templates
    .filter(
      (t: any) =>
        t?.userCalibration?.status === 'denied' || t?.confidenceLabel === 'denied',
    )
    .map((t: any) => `${t.key || ''}`)
    .filter(Boolean);
  const partialKeys = templates
    .filter((t: any) => t?.userCalibration?.status === 'partial')
    .map((t: any) => `${t.key || ''}`)
    .filter(Boolean);
  const total = Math.max(templates.length, 1);
  // 100 = no denials; each denied cuts 18, each partial cuts 8 (floor 40)
  const calibrationScore = Math.max(
    40,
    Math.min(100, 100 - deniedKeys.length * 18 - partialKeys.length * 8),
  );
  analysis.calibrationScore = calibrationScore;
  analysis.calibrationSummary = {
    score: calibrationScore,
    deniedKeys,
    partialKeys,
    templateCount: total,
    updatedAt: analysis.calibrationUpdatedAt,
  };
  const signals = {
    ...((analysis.contextSignals as Record<string, unknown>) || {}),
    calibration: {
      score: calibrationScore,
      deniedKeys,
      partialKeys,
      note: message.slice(0, 200),
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
