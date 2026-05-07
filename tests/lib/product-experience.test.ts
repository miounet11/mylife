import {
  analyzeOutcomeCards,
  getSurfaceRole,
  productActivationPath,
  productExperiencePrinciples,
  productPurposePaths,
  toolEntryModes,
  toolProblemLineGuides,
} from '@/lib/product-experience';

describe('product experience map', () => {
  test('keeps the activation path in progressive order', () => {
    expect(productActivationPath.map((item) => item.key)).toEqual([
      'birth-input',
      'first-report',
      'deep-question',
      'single-tool',
      'event-loop',
    ]);
  });

  test('keeps core purpose routing broad enough for homepage users', () => {
    expect(productPurposePaths.map((item) => item.key)).toEqual([
      'start-analysis',
      'learn-system',
      'solve-problem',
      'understand-world-yi',
      'visual-explainers',
    ]);
  });

  test('documents the key product surfaces', () => {
    expect(getSurfaceRole('home')?.primaryAction).toBe('开始测算');
    expect(getSurfaceRole('result')?.layoutRule).toContain('深入折叠');
    expect(getSurfaceRole('tools')?.job).toContain('工具');
    expect(getSurfaceRole('profile')?.interactionRule).toContain('续接');
    expect(getSurfaceRole('history')?.readingOrder).toContain('待纠偏');
  });

  test('keeps each surface tied to a next action and metric', () => {
    const surfaces = [
      'home',
      'analyze',
      'result',
      'tools',
      'toolDetail',
      'toolResult',
      'knowledge',
      'knowledgeArticle',
      'cases',
      'caseArticle',
      'chat',
      'events',
      'profile',
      'history',
    ] as const;

    surfaces.forEach((surface) => {
      const role = getSurfaceRole(surface);

      expect(role?.nextSteps.length).toBeGreaterThanOrEqual(2);
      expect(role?.readingOrder.length).toBeGreaterThanOrEqual(5);
      expect(role?.successMetric).toContain('率');
    });
  });

  test('keeps tool entry modes and problem-line guidance usable', () => {
    expect(toolEntryModes).toHaveLength(3);
    expect(toolProblemLineGuides.career.firstStep).toContain('角色');
    expect(toolProblemLineGuides.application.nextStep).toContain('起名');
  });

  test('keeps first report outcomes focused', () => {
    expect(productExperiencePrinciples).toHaveLength(4);
    expect(analyzeOutcomeCards.map((item) => item.label)).toEqual([
      '分析顺序',
      '时间基准',
      '首份结果',
      '后续路径',
    ]);
  });
});
