import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('result page stage ladder surface', () => {
  const source = readFileSync(join(process.cwd(), 'app/result/[id]/page.tsx'), 'utf8');
  const stageProgressSource = readFileSync(
    join(process.cwd(), 'components/report/report-stage-progress.tsx'),
    'utf8',
  );
  const timingSource = readFileSync(join(process.cwd(), 'app/r/[id]/page.tsx'), 'utf8');

  it('renders the user-facing stage ladder from the shared helper', () => {
    expect(source).toContain('buildReportStageLadder');
    expect(source).toContain('reportStageLadder');
    expect(source).toContain('ReportStageProgress');
    expect(stageProgressSource).toContain('报告阅读进度');
    expect(stageProgressSource).toContain('下一阶段');
    expect(stageProgressSource).toContain('当前阶段');
    expect(stageProgressSource).toContain('data-stage-key={item.key}');
  });

  it('marks each rendered ladder card with its stage key for regression safety', () => {
    expect(stageProgressSource).toContain('data-stage-key={item.key}');
    expect(stageProgressSource).toContain("item.status === 'current'");
    expect(stageProgressSource).toContain("item.status === 'completed'");
  });

  it('uses the compact timing report as the default historical report view', () => {
    expect(source).toContain('redirect(`/r/${encodeURIComponent(id)}${query}`)');
    expect(source).toContain("resolvedSearchParams.view === 'full'");
    expect(timingSource).toContain('展开完整细节');
    // v5-D33-B1: /r/[id] 不再走 sanitizePublicFortuneRecord（sanitize 把 birthDate 清空导致 timing 算 NaN → notFound）
    // 改为直接用原始 fortune 算 timing profile；canManage 仍守 isPublic=false 闸门。
    expect(timingSource).toContain('resolveTimingProfileForFortune');
    expect(timingSource).toContain('canManage');
  });

  it('keeps compact report chat entry instrumented', () => {
    expect(timingSource).toContain('AnalyticsPageView');
    expect(timingSource).toContain('eventName="report_viewed"');
    expect(timingSource).toContain('ResultCtaLink');
    expect(timingSource).toContain('target="result_timing_followup_chat"');
    expect(timingSource).toContain('buildReportChatSource(entrySource)');
  });
});
