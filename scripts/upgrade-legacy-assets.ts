import { saveManagedContentEntry, listManagedContentEntries, normalizeManagedContentMeta } from '@/lib/content-store';
import { fortuneOperations } from '@/lib/database';
import { CURRENT_REPORT_VERSION, regenerateReportFromRecord } from '@/lib/report-pipeline';
import { withReportVersionLineage } from '@/lib/report-version-lineage';

async function upgradeLegacyReports() {
  const reports = fortuneOperations
    .listRecent(5000)
    .filter((item) => (item.reportVersion || 'v1') !== CURRENT_REPORT_VERSION);
  let upgraded = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const report of reports) {
    try {
      const regenerated = await regenerateReportFromRecord(report);
      regenerated.result.analysis = withReportVersionLineage({
        previousAnalysis: report.analysis,
        previousReportVersion: report.reportVersion || 'v1',
        nextAnalysis: regenerated.result.analysis,
        nextReportVersion: CURRENT_REPORT_VERSION,
      });

      fortuneOperations.update(report.id, {
        name: report.name,
        bazi: regenerated.result.basic,
        fiveElements: regenerated.result.fiveElements,
        tenGods: regenerated.result.tenGods || {},
        pattern: regenerated.result.pattern,
        fortune: regenerated.result.fortune,
        advice: regenerated.result.advice,
        evidence: regenerated.result.evidence,
        analysis: regenerated.result.analysis,
        klineData: regenerated.result.klineData,
        dayun: regenerated.result.dayun,
        shenSha: regenerated.result.shenSha,
        reportVersion: CURRENT_REPORT_VERSION,
      });
      upgraded += 1;
    } catch (error) {
      failures.push({
        id: report.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    scanned: reports.length,
    upgraded,
    failures,
  };
}

async function upgradeLegacyContent() {
  const entries = listManagedContentEntries();
  let upgraded = 0;

  for (const entry of entries) {
    const normalizedMeta = normalizeManagedContentMeta(entry);
    const before = JSON.stringify(entry.meta || {});
    const after = JSON.stringify(normalizedMeta);
    if (before === after) {
      continue;
    }

    saveManagedContentEntry({
      ...entry,
      source: entry.source,
      meta: normalizedMeta,
    }, 'system:legacy-content-upgrade');
    upgraded += 1;
  }

  return {
    scanned: entries.length,
    upgraded,
  };
}

async function main() {
  const [reportResult, contentResult] = await Promise.all([
    upgradeLegacyReports(),
    upgradeLegacyContent(),
  ]);

  console.log(JSON.stringify({
    success: reportResult.failures.length === 0,
    reportResult,
    contentResult,
    timestamp: new Date().toISOString(),
  }, null, 2));

  if (reportResult.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
