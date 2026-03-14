import { createLineageEntry, withReportVersionLineage } from '@/lib/report-version-lineage';

describe('report version lineage', () => {
  it('creates a lineage entry from analysis metadata', () => {
    const entry = createLineageEntry({
      opening: '起始摘要',
      explanation: '详细说明',
      generatedAt: '2026-03-14T03:00:00.000Z',
      generatedFrom: 'analyze',
      reasoningMode: 'parallel-agents',
      llmUsed: true,
      agenticUsed: true,
      qualityAudit: {
        overallScore: 96,
        grade: 'S',
        deliveryTier: 'expert',
        targetAchieved: true,
        summary: '达到专家版门槛',
      },
    } as any, 'v3');

    expect(entry).toEqual({
      version: 'v3',
      generatedAt: '2026-03-14T03:00:00.000Z',
      generatedFrom: 'analyze',
      upgradedFromVersion: undefined,
      reasoningMode: 'parallel-agents',
      llmUsed: true,
      agenticUsed: true,
      qualityScore: 96,
      qualityGrade: 'S',
      deliveryTier: 'expert',
      targetAchieved: true,
      summary: '达到专家版门槛',
    });
  });

  it('preserves prior entries and prepends the latest upgraded version', () => {
    const lineage = withReportVersionLineage({
      previousReportVersion: 'v2',
      previousAnalysis: {
        opening: '旧版摘要',
        explanation: '旧版说明',
        generatedAt: '2026-03-13T03:00:00.000Z',
        generatedFrom: 'analyze',
        qualityAudit: {
          overallScore: 82,
          grade: 'A',
          deliveryTier: 'enhanced',
          targetAchieved: false,
          summary: '旧版增强结果',
        },
        versionLineage: [
          {
            version: 'v1',
            generatedAt: '2026-03-12T03:00:00.000Z',
            generatedFrom: 'analyze',
            qualityScore: 68,
            qualityGrade: 'B',
            deliveryTier: 'basic',
          },
        ],
      } as any,
      nextAnalysis: {
        opening: '新版摘要',
        explanation: '新版说明',
        generatedAt: '2026-03-14T03:00:00.000Z',
        generatedFrom: 'upgrade',
        upgradedFromVersion: 'v2',
        qualityAudit: {
          overallScore: 95,
          grade: 'S',
          deliveryTier: 'expert',
          targetAchieved: true,
          summary: '新版已升级到专家版',
        },
      } as any,
      nextReportVersion: 'v3',
    });

    expect(lineage.versionLineage).toHaveLength(3);
    expect(lineage.versionLineage?.[0]).toMatchObject({
      version: 'v3',
      generatedFrom: 'upgrade',
      upgradedFromVersion: 'v2',
      qualityScore: 95,
    });
    expect(lineage.versionLineage?.[1]).toMatchObject({
      version: 'v2',
      generatedFrom: 'analyze',
      qualityScore: 82,
    });
    expect(lineage.versionLineage?.[2]).toMatchObject({
      version: 'v1',
      qualityScore: 68,
    });
  });
});
