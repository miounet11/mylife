import { CURRENT_REPORT_VERSION } from '@/lib/report-pipeline';
import { loadWorkflowContract, type LifeKlineWorkflowContract } from '@/lib/workflow-contract';

export const MINGLI_ANALYSIS_WORKFLOW_PATH = 'data/workflows/mingli-analysis-v1.json';

export type AnalysisWorkflowSnapshot = {
  workflowId: string;
  reportVersion: string;
  stages: string[];
  qualityPolicy: Record<string, unknown>;
  runtime: Record<string, unknown>;
  generatedAt: string;
};

export function loadMingliAnalysisWorkflow(): LifeKlineWorkflowContract {
  return loadWorkflowContract(MINGLI_ANALYSIS_WORKFLOW_PATH, 'mingli-analysis-v1');
}

export function buildAnalysisWorkflowSnapshot(workflow = loadMingliAnalysisWorkflow()): AnalysisWorkflowSnapshot {
  return {
    workflowId: workflow.id,
    reportVersion: CURRENT_REPORT_VERSION,
    stages: workflow.stages,
    qualityPolicy: workflow.qualityPolicy,
    runtime: workflow.runtime,
    generatedAt: new Date().toISOString(),
  };
}
