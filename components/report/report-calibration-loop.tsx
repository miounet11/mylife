import ProUserCalibration from '@/components/report-pro/pro-user-calibration';
import ReportCohortLenses from '@/components/report/report-cohort-lenses';
import type { CohortCalibrationState } from '@/lib/cohort-lenses';

/**
 * Calibration loop: past-event / accuracy checks + generation-layer claims.
 * Sits after the four-sentence reading flow.
 */
export default function ReportCalibrationLoop({
  reportId,
  canManage = false,
  pastEventTemplates = [],
  birthDate,
  birthYear,
  birthPlace,
  birthSignature,
  initialCohortCalibration = null,
  locale,
  showEventCalibration = true,
}: {
  reportId: string;
  canManage?: boolean;
  pastEventTemplates?: Array<{
    key: string;
    title: string;
    type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
    description: string;
    reason: string;
    confidenceLabel?: 'high' | 'medium';
    occurrenceWindow?: string;
  }>;
  birthDate?: string | null;
  birthYear?: number | null;
  birthPlace?: string | null;
  birthSignature?: string | null;
  initialCohortCalibration?: CohortCalibrationState | null;
  locale?: string | null;
  showEventCalibration?: boolean;
}) {
  return (
    <div className="space-y-1">
      {showEventCalibration ? (
        <ProUserCalibration
          reportId={reportId}
          canManage={canManage}
          pastEventTemplates={pastEventTemplates}
        />
      ) : null}
      <ReportCohortLenses
        reportId={reportId}
        canManage={canManage}
        birthDate={birthDate}
        birthYear={birthYear}
        birthPlace={birthPlace}
        birthSignature={birthSignature}
        initialCalibration={initialCohortCalibration}
        locale={locale}
      />
    </div>
  );
}
