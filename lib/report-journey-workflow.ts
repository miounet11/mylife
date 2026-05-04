import { loadWorkflowContract, type LifeKlineWorkflowContract } from '@/lib/workflow-contract';

export const REPORT_JOURNEY_WORKFLOW_PATH = 'data/workflows/report-journey-v1.json';

export type ReportJourneyWorkflowSnapshot = {
  workflowId: string;
  stages: string[];
  runtime: LifeKlineWorkflowContract['runtime'];
  qualityPolicy: LifeKlineWorkflowContract['qualityPolicy'];
  memoryPolicy: LifeKlineWorkflowContract['memoryPolicy'];
  observability: LifeKlineWorkflowContract['observability'];
};

export function loadReportJourneyWorkflow() {
  return loadWorkflowContract(REPORT_JOURNEY_WORKFLOW_PATH, 'report-journey-v1');
}

export function buildReportJourneyWorkflowSnapshot(
  workflow = loadReportJourneyWorkflow()
): ReportJourneyWorkflowSnapshot {
  return {
    workflowId: workflow.id,
    stages: workflow.stages,
    runtime: workflow.runtime,
    qualityPolicy: workflow.qualityPolicy,
    memoryPolicy: workflow.memoryPolicy,
    observability: workflow.observability,
  };
}
