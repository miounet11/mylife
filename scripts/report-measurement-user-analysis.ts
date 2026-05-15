import Database from 'better-sqlite3';
import path from 'path';
import { analyzeFortune } from '@/lib/fortune-engine';
import { buildReportMeasurementUserAnalysis, renderReportMeasurementUserAnalysis } from '@/lib/report-measurement-user-analysis';
import { isLikelyRealUserReportName } from '@/lib/report-sample-classifier';
import type { FortuneRecord } from '@/lib/user-types';

function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const reportId = args.find((arg) => !arg.startsWith('--'));
  const db = new Database(path.resolve(process.cwd(), 'data/lifekline.db'), { readonly: true });
  const report = reportId ? loadReportById(db, reportId) : loadRecentRealReport(db);

  if (!report) {
    console.error(reportId ? `Report not found: ${reportId}` : 'No report found.');
    process.exit(1);
  }

  const reportWithMeasurement = ensureMeasurementResults(report);
  const analysis = buildReportMeasurementUserAnalysis(reportWithMeasurement);
  if (jsonOnly) {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  console.log(renderReportMeasurementUserAnalysis(analysis));
}

function loadReportById(db: InstanceType<typeof Database>, reportId: string) {
  const row = db.prepare('SELECT * FROM fortunes WHERE id = ?').get(reportId) as RawFortuneRow | undefined;
  return row ? mapReportRow(row) : null;
}

function loadRecentRealReport(db: InstanceType<typeof Database>) {
  const rows = db.prepare(`
    SELECT *
    FROM fortunes
    ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
    LIMIT 50
  `).all() as RawFortuneRow[];

  const selected = rows.find((row) => isLikelyRealUserReportName(row.name)) || rows[0];
  return selected ? mapReportRow(selected) : null;
}

type RawFortuneRow = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place?: string | null;
  timezone?: number | null;
  gender: string;
  bazi?: string | null;
  five_elements?: string | null;
  ten_gods?: string | null;
  pattern?: string | null;
  fortune?: string | null;
  advice?: string | null;
  evidence?: string | null;
  analysis?: string | null;
  kline_data?: string | null;
  dayun?: string | null;
  shen_sha?: string | null;
  report_version?: string | null;
  is_public?: number | null;
};

function mapReportRow(row: RawFortuneRow): FortuneRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    birthPlace: row.birth_place || undefined,
    timezone: typeof row.timezone === 'number' ? row.timezone : 8,
    gender: row.gender,
    bazi: safeJson(row.bazi),
    fiveElements: safeJson(row.five_elements),
    tenGods: safeJson(row.ten_gods),
    pattern: safeJson(row.pattern),
    fortune: safeJson(row.fortune),
    advice: safeJson(row.advice),
    evidence: safeJson(row.evidence),
    analysis: safeJson(row.analysis),
    klineData: safeJson(row.kline_data),
    dayun: safeJson(row.dayun),
    shenSha: safeJson(row.shen_sha),
    reportVersion: row.report_version || 'v1',
    isPublic: row.is_public !== 0,
  } as FortuneRecord;
}

function safeJson(value?: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function ensureMeasurementResults(report: FortuneRecord): FortuneRecord {
  const engineEvidence = report.analysis?.contextSignals?.engineEvidence as { measurementResults?: Array<{ id?: string; label?: string; order?: number; score?: number; level?: string; conclusion?: string }> } | undefined;
  if (Array.isArray(engineEvidence?.measurementResults) && engineEvidence.measurementResults.length > 0) {
    return report;
  }

  const fallback = buildFallbackMeasurementResults(report);
  return {
    ...report,
    analysis: {
      opening: report.analysis?.opening || '',
      explanation: report.analysis?.explanation || '',
      ...report.analysis,
      contextSignals: {
        ...(report.analysis?.contextSignals || {}),
        engineEvidence: {
          ...(engineEvidence || {}),
          version: 'engine-evidence-v2',
          measurementResults: fallback,
          stageResults: fallback,
        },
      },
    },
  };
}

function buildFallbackMeasurementResults(report: FortuneRecord) {
  const result = analyzeFortune(
    report.name,
    new Date(report.birthDate),
    report.birthTime,
    report.birthPlace || '',
    report.timezone,
    report.gender
  );
  const engineEvidence = result.analysis?.contextSignals?.engineEvidence as { measurementResults?: Array<{ id?: string; label?: string; order?: number; score?: number; level?: string; conclusion?: string }> } | undefined;
  return Array.isArray(engineEvidence?.measurementResults) ? engineEvidence.measurementResults : [];
}

main();
