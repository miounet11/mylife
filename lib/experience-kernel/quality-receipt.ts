import { buildUserFacingReportStatus } from '@/lib/report-status-presentation';
import {
  USABLE_DEEP_SCORE,
  type ExperienceQualityReceipt,
  type KernelReadiness,
} from '@/lib/experience-kernel/types';

type AuditLike = {
  overallScore?: number;
  grade?: string;
  status?: 'ready' | 'watch' | 'retry';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetAchieved?: boolean;
  summary?: string;
  dimensions?: Array<{ key?: string; label?: string; score?: number }>;
  strengths?: string[];
  concerns?: string[];
};

type UpgradeJobLike = {
  status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  lastError?: string;
  meta?: Record<string, unknown>;
};

/**
 * Build a single user-facing Quality Receipt from audit + upgrade + optional 7d actions.
 * Canonical presentation for result page, chat footer, and admin.
 */
export function buildExperienceQualityReceipt(input: {
  llmUsed?: boolean;
  agenticUsed?: boolean;
  consistencyScore?: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  qualityAudit?: AuditLike | null;
  upgradeJob?: UpgradeJobLike | null;
  sevenDayActions?: string[] | null;
  /** Closed-loop calibration score 40–100 */
  calibrationScore?: number | null;
  canManage?: boolean;
  locale?: string | null;
  streaming?: boolean;
}): ExperienceQualityReceipt {
  const status = buildUserFacingReportStatus({
    llmUsed: input.llmUsed,
    agenticUsed: input.agenticUsed,
    consistencyScore: input.consistencyScore,
    verifyVerdict: input.verifyVerdict,
    qualityAudit: input.qualityAudit,
    upgradeJob: input.upgradeJob,
    canManage: input.canManage,
    locale: input.locale,
  });

  const score =
    typeof input.qualityAudit?.overallScore === 'number'
      ? input.qualityAudit.overallScore
      : status.confidenceScore;
  const usableDeep =
    !!input.qualityAudit?.targetAchieved ||
    (typeof score === 'number' && score >= USABLE_DEEP_SCORE) ||
    input.upgradeJob?.meta?.nearTargetDelivered === true ||
    /DELIVERED_AT_85|QUALITY_PLATEAU_AT_83/.test(
      `${input.upgradeJob?.lastError || input.upgradeJob?.meta?.reason || input.upgradeJob?.meta?.plateauReason || ''}`,
    );

  const actions = Array.isArray(input.sevenDayActions)
    ? input.sevenDayActions.filter((x) => `${x || ''}`.trim().length >= 4)
    : [];

  let readiness: KernelReadiness = status.readiness;
  if (input.streaming) readiness = 'streaming';

  const calibrationScore =
    typeof input.calibrationScore === 'number' ? input.calibrationScore : null;

  return {
    readiness,
    badge: usableDeep && status.readiness === 'usable' ? (status.badge || '可用深度版') : status.badge,
    title: status.title,
    summary: status.summary,
    editionLabel: usableDeep && status.editionLabel === '标准版' ? '可用深度版' : status.editionLabel,
    confidenceScore: score,
    grade: input.qualityAudit?.grade || null,
    deliveryTier: input.qualityAudit?.deliveryTier || null,
    targetAchieved: !!input.qualityAudit?.targetAchieved,
    usableDeep,
    hasSevenDayActions: actions.length > 0,
    trustPoints: status.trustPoints,
    cautionPoints: status.cautionPoints,
    progressLabel: status.progress.label || undefined,
    primaryActionLabel: status.primaryAction.label || undefined,
    details: [
      ...status.details,
      {
        label: '近7天行动',
        value: actions.length > 0 ? `${actions.length} 条已就绪` : '待生成',
      },
      {
        label: '交付档',
        value: usableDeep ? `可用深度 (≥${USABLE_DEEP_SCORE})` : status.editionLabel,
      },
      ...(calibrationScore != null
        ? [{ label: '用户校准分', value: `${calibrationScore}` }]
        : []),
    ],
  };
}
