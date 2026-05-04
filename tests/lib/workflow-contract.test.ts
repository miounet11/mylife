import { buildAnalysisWorkflowSnapshot, loadMingliAnalysisWorkflow } from '@/lib/analysis-workflow';
import { buildReportJourneyWorkflowSnapshot, loadReportJourneyWorkflow } from '@/lib/report-journey-workflow';
import { loadToolRunWorkflow } from '@/lib/tool-run-orchestrator';

describe('workflow contracts', () => {
  it('loads mingli analysis workflow as a report generation contract', () => {
    const workflow = loadMingliAnalysisWorkflow();
    const snapshot = buildAnalysisWorkflowSnapshot(workflow);

    expect(workflow.id).toBe('mingli-analysis-v1');
    expect(workflow.stages).toEqual(expect.arrayContaining(['engine', 'llm', 'agentic', 'merge', 'persist']));
    expect(workflow.qualityPolicy.mustUseDeterministicEngine).toBe(true);
    expect(snapshot.workflowId).toBe('mingli-analysis-v1');
    expect(snapshot.reportVersion).toBe('v3');
  });

  it('loads tool run workflow with memory and persistence policy', () => {
    const workflow = loadToolRunWorkflow();

    expect(workflow.id).toBe('tool-run-v1');
    expect(workflow.stages).toEqual(expect.arrayContaining(['load-memory', 'deterministic-summary', 'llm-enhancement', 'auto-qa', 'conversion-scoring', 'persist-session']));
    expect(workflow.qualityPolicy.mustKeep120ToolsConfigDriven).toBe(true);
    expect(workflow.qualityPolicy.mustAutoQaEnhancedResult).toBe(true);
    expect(workflow.memoryPolicy?.recentSessionLimit).toBe(6);
  });

  it('loads layered report journey workflow for intake to custom reports', () => {
    const workflow = loadReportJourneyWorkflow();
    const snapshot = buildReportJourneyWorkflowSnapshot(workflow);

    expect(workflow.id).toBe('report-journey-v1');
    expect(workflow.stages).toEqual(expect.arrayContaining(['birth-intake', 'first-report', 'deep-report', 'category-routing', 'event-validation']));
    expect(workflow.qualityPolicy.mustUseProgressiveDisclosure).toBe(true);
    expect(workflow.qualityPolicy.mustRouteToOnePrimaryNextLayer).toBe(true);
    expect(workflow.memoryPolicy?.persistCategoryRoute).toBe(true);
    expect(snapshot.workflowId).toBe('report-journey-v1');
  });
});
