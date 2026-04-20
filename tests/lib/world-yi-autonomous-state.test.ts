import {
  applyWorldYiAutonomyPolicySignals,
  deriveWorldYiAutonomyPolicyFromBacklogFocus,
  extractOpenAgentAutonomyReviewItems,
  resolveWorldYiAutonomyRuntimePolicy,
  summarizeWorldYiContentDecisionLedger,
  summarizeWorldYiContentDecisionSamples,
  summarizeOpenAgentAutonomyBacklogFocus,
} from '@/lib/world-yi-autonomous-state';

describe('world yi autonomous state', () => {
  it('extracts structured review items from english target blocks', () => {
    const answer = [
      'Target: persist per-cycle decisions into a durable ledger.',
      'Affected stages: `lib/world-yi-autonomous-engine.ts`, `lib/content-ops.ts`.',
      'Why now: the runtime already computes signals but does not preserve enough history.',
      'Target: wire publication gap signals into generation priorities.',
      'Affected stages: `lib/world-yi-publication-mechanism.ts`, `lib/content-ops.ts`.',
      'Why now: weak-lane repair is already a documented rule.',
      'Target: upgrade release gating before scale increases.',
      'Affected stages: `lib/content-ops.ts`, `lib/world-yi-autonomous-engine.ts`.',
      'Why now: current checks are still mostly structural.',
    ].join(' ');

    const items = extractOpenAgentAutonomyReviewItems(answer, '2026-04-08T00:00:00.000Z');

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      priority: 'P0',
      target: 'persist per-cycle decisions into a durable ledger.',
      whyNow: 'the runtime already computes signals but does not preserve enough history.',
    });
    expect(items[1]!.affectedStages).toEqual([
      'lib/world-yi-publication-mechanism.ts',
      'lib/content-ops.ts',
    ]);
  });

  it('extracts structured review items from goal and affected flow blocks', () => {
    const answer = [
      '1. Goal: persist per-cycle decision logs.',
      'Affected flow: autonomous control plane, scheduler decisions, OpenAgent review handoff.',
      'Why now: the repository already has raw signals but not reusable decision memory.',
      '2. Goal: make weak-lane repair self-prioritizing.',
      'Affected flow: publication planning, generation queue ordering, draft replenishment.',
      'Why now: weak-lane repair is already defined as a runtime rule.',
    ].join(' ');

    const items = extractOpenAgentAutonomyReviewItems(answer, '2026-04-08T00:00:00.000Z');

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      target: 'persist per-cycle decision logs.',
      whyNow: 'the repository already has raw signals but not reusable decision memory.',
    });
    expect(items[1]!.affectedStagesText).toBe(
      'publication planning, generation queue ordering, draft replenishment.'
    );
  });

  it('extracts structured review items from chinese labels', () => {
    const answer = [
      '目标：把自治周期决策写入长期 ledger。',
      '受影响环节：`lib/world-yi-autonomous-engine.ts`、`lib/content-ops.ts`。',
      '为什么现在做：当前已有丰富信号，但没有沉淀长期学习记录。',
      '目标：把弱 lane 信号直接接进生成优先级。',
      '受影响环节：`lib/world-yi-publication-mechanism.ts`、`lib/content-ops.ts`。',
      '为什么现在做：发布机制已经能识别缺口，但还没有真正驱动补位。',
    ].join('\n');

    const items = extractOpenAgentAutonomyReviewItems(answer, '2026-04-08T00:00:00.000Z');

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      priority: 'P0',
      target: '把自治周期决策写入长期 ledger。',
    });
    expect(items[1]!.whyNow).toBe('发布机制已经能识别缺口，但还没有真正驱动补位。');
  });

  it('extracts structured review items from markdown-heavy numbered review output', () => {
    const answer = [
      '1. **Build a decision ledger.** **目标：** 把候选级别的失败原因写入长期账本。 **受影响环节：** `lib/content-ops.ts`, `lib/world-yi-autonomous-engine.ts`. **为什么现在做：** 当前已经有 reasons 与 hardBlockReasons，但还没沉淀长期样本。',
      '2. **Repair weak lanes.** **目标：** 把弱 lane 修复变成自动闭环。 **受影响环节：** `lib/world-yi-publication-mechanism.ts`, `lib/content-ops.ts`. **为什么现在做：** 系统已经能识别 weakLaneKeys，但还没有保证补位动作。',
      '3. **Calibrate policy.** **目标：** 让 review 结果进入策略覆盖层。 **受影响环节：** `lib/open-agent-runtime.ts`, `lib/world-yi-autonomous-state.ts`. **为什么现在做：** 已有 backlog 和 policy state，可以继续自动调参。',
    ].join(' ');

    const items = extractOpenAgentAutonomyReviewItems(answer, '2026-04-08T00:00:00.000Z');

    expect(items).toHaveLength(3);
    expect(items[0]!.target).toBe('把候选级别的失败原因写入长期账本。');
    expect(items[0]!.whyNow).toBe('当前已经有 reasons 与 hardBlockReasons，但还没沉淀长期样本。');
    expect(items[1]!.affectedStages).toEqual([
      'lib/world-yi-publication-mechanism.ts',
      'lib/content-ops.ts',
    ]);
    expect(items[2]!.whyNow).toBe('已有 backlog 和 policy state，可以继续自动调参。');
  });

  it('summarizes backlog focus keys for scheduler and ledger upgrades', () => {
    const focus = summarizeOpenAgentAutonomyBacklogFocus([
      {
        id: 'a',
        title: '把发布质量闸门升级为结构 + 历史转化 + 来源可信度',
        target: '把发布质量闸门升级为结构 + 历史转化 + 来源可信度',
        affectedStages: [],
        affectedStagesText: '',
        whyNow: '避免自动发布只看结构。',
        priority: 'P0',
        status: 'pending',
        source: 'open_agent_review',
        createdAt: '2026-04-08T00:00:00.000Z',
        lastSeenAt: '2026-04-08T00:00:00.000Z',
      },
      {
        id: 'b',
        title: '把扩稿-补稿-发布升级为 lane reserve 保底机制',
        target: '把扩稿-补稿-发布升级为 lane reserve 保底机制',
        affectedStages: [],
        affectedStagesText: '',
        whyNow: '避免关键 lane 被长期饿死。',
        priority: 'P1',
        status: 'pending',
        source: 'open_agent_review',
        createdAt: '2026-04-08T00:00:00.000Z',
        lastSeenAt: '2026-04-08T00:00:00.000Z',
      },
      {
        id: 'c',
        title: '把自治周期账本升级为可回放的决策 ledger',
        target: '把自治周期账本升级为可回放的决策 ledger',
        affectedStages: [],
        affectedStagesText: '',
        whyNow: '让失败原因和决策链可回看。',
        priority: 'P2',
        status: 'pending',
        source: 'open_agent_review',
        createdAt: '2026-04-08T00:00:00.000Z',
        lastSeenAt: '2026-04-08T00:00:00.000Z',
      },
    ]);

    expect(focus.focusKeys).toEqual([
      'publish_quality_gate',
      'lane_reserve',
      'decision_ledger',
    ]);
    expect(focus.qualityGate).toBe(true);
    expect(focus.laneReserve).toBe(true);
    expect(focus.decisionLedger).toBe(true);
  });

  it('derives autonomy policy overrides from backlog focus', () => {
    const policy = deriveWorldYiAutonomyPolicyFromBacklogFocus({
      focusKeys: ['publish_quality_gate', 'lane_reserve', 'decision_ledger'],
      qualityGate: true,
      laneReserve: true,
      decisionLedger: true,
      topTargets: ['升级质量闸门'],
    });

    expect(policy.source).toBe('open_agent_backlog');
    expect(policy.publishGate.minScore).toBe(220);
    expect(policy.publishGate.blockLowPerformanceTypes).toBe(true);
    expect(policy.queueWeights.weakLaneBoost).toBeGreaterThanOrEqual(36);
    expect(policy.validationMode.skipReportUpgrade).toBe(true);
  });

  it('applies bounded policy signals onto the runtime policy', () => {
    const basePolicy = {
      ...deriveWorldYiAutonomyPolicyFromBacklogFocus({
        focusKeys: ['publish_quality_gate', 'lane_reserve', 'decision_ledger'],
        qualityGate: true,
        laneReserve: true,
        decisionLedger: true,
        topTargets: ['升级质量闸门'],
      }),
      updatedAt: '2026-04-08T00:00:00.000Z',
    };

    const resolved = applyWorldYiAutonomyPolicySignals(basePolicy, [
      'publishGate.minScore=210 queueWeights.perLaneQuota=3',
      'publishGate.blockLowPerformanceTypes=false',
      'narrative-only signal without assignments',
    ]);

    expect(resolved.basePolicy.publishGate.minScore).toBe(220);
    expect(resolved.effectivePolicy.publishGate.minScore).toBe(210);
    expect(resolved.effectivePolicy.queueWeights.perLaneQuota).toBe(3);
    expect(resolved.effectivePolicy.publishGate.blockLowPerformanceTypes).toBe(false);
    expect(resolved.appliedSignals.map((item) => item.path)).toEqual([
      'publishGate.minScore',
      'queueWeights.perLaneQuota',
      'publishGate.blockLowPerformanceTypes',
    ]);
    expect(resolved.ignoredSignals).toEqual(['narrative-only signal without assignments']);
  });

  it('resolves runtime policy from analysis plan signals', () => {
    const resolved = resolveWorldYiAutonomyRuntimePolicy({
      fallbackFocus: {
        focusKeys: ['publish_quality_gate', 'lane_reserve'],
        qualityGate: true,
        laneReserve: true,
        decisionLedger: false,
        topTargets: ['提高 lane 补稿效率'],
      },
      analysisPlan: {
        summary: 'test',
        laneContracts: [],
        queueOverrides: [],
        blockedPatterns: [],
        policySignals: ['queueWeights.clusterQuota=1 publishGate.requireLlmSource=false'],
      },
    });

    expect(resolved.effectivePolicy.queueWeights.clusterQuota).toBe(1);
    expect(resolved.effectivePolicy.publishGate.requireLlmSource).toBe(false);
    expect(resolved.appliedSignals).toHaveLength(2);
  });

  it('summarizes candidate decision samples into held, revise, blocked and publish signals', () => {
    const summary = summarizeWorldYiContentDecisionSamples([
      {
        id: 'knowledge:publish-a',
        entryId: 'publish_a',
        slug: 'publish-a',
        title: '已发布候选',
        contentType: 'knowledge',
        source: 'agent-llm:auto-ops',
        sourceType: 'public-growth',
        growthPlanKey: 'growth-a',
        laneKey: 'main',
        laneLabel: 'Public Growth Main',
        laneTargetKey: 'growth-a',
        laneNeedsCoverage: true,
        weakLane: false,
        decision: 'publish',
        score: 286,
        reasons: ['结构质量通过', '补齐 Public Growth Main 缺口 +48'],
        hardBlockReasons: [],
        policySource: 'open_agent_backlog',
        policyFocusKeys: ['publish_quality_gate', 'decision_ledger'],
        minimumScore: 220,
        evaluatedAt: '2026-04-08T00:00:00.000Z',
      },
      {
        id: 'knowledge:hold-a',
        entryId: 'hold_a',
        slug: 'hold-a',
        title: '保留待发候选',
        contentType: 'knowledge',
        source: 'agent-llm:auto-ops',
        sourceType: 'public-growth-wave2',
        laneNeedsCoverage: false,
        weakLane: false,
        decision: 'hold',
        score: 252,
        reasons: ['结构质量通过'],
        hardBlockReasons: [],
        policySource: 'open_agent_backlog',
        policyFocusKeys: ['lane_reserve'],
        minimumScore: 220,
        evaluatedAt: '2026-04-08T00:00:00.000Z',
      },
      {
        id: 'knowledge:revise-a',
        entryId: 'revise_a',
        slug: 'revise-a',
        title: '需要修订候选',
        contentType: 'knowledge',
        source: 'agent-llm:auto-ops',
        sourceType: 'cluster',
        laneNeedsCoverage: false,
        weakLane: false,
        decision: 'revise',
        score: 188,
        reasons: ['基础质量分 188'],
        hardBlockReasons: ['综合评分不足 220'],
        policySource: 'open_agent_backlog',
        policyFocusKeys: ['publish_quality_gate'],
        minimumScore: 220,
        evaluatedAt: '2026-04-08T00:00:00.000Z',
      },
      {
        id: 'knowledge:blocked-a',
        entryId: 'blocked_a',
        slug: 'blocked-a',
        title: '被策略阻断候选',
        contentType: 'knowledge',
        source: 'manual',
        sourceType: 'cluster',
        laneNeedsCoverage: false,
        weakLane: false,
        decision: 'blocked',
        score: 230,
        reasons: ['基础质量分 230'],
        hardBlockReasons: ['仅允许 LLM 草稿进入自动发布候选'],
        policySource: 'open_agent_backlog',
        policyFocusKeys: ['publish_quality_gate'],
        minimumScore: 220,
        evaluatedAt: '2026-04-08T00:00:00.000Z',
      },
    ]);

    expect(summary.decisionMix).toEqual({
      publishCount: 1,
      holdCount: 1,
      reviseCount: 1,
      blockedCount: 1,
      totalCandidates: 4,
      readyCount: 2,
    });
    expect(summary.lastPublishRationale).toContain('结构质量通过');
    expect(summary.topHeldCandidates[0]?.slug).toBe('hold-a');
    expect(summary.topReviseCandidates[0]?.slug).toBe('revise-a');
    expect(summary.topBlockedReasons).toEqual([
      { reason: '仅允许 LLM 草稿进入自动发布候选', count: 1 },
      { reason: '综合评分不足 220', count: 1 },
    ]);
  });

  it('builds latest runtime-facing summary from decision ledger entries', () => {
    const summary = summarizeWorldYiContentDecisionLedger([
      {
        id: 'ledger_1',
        trigger: 'cron',
        mode: 'validate',
        reason: 'validation_mode_detected_publish_candidate',
        publishWindowOpen: true,
        canPublishNow: true,
        generatedCount: 0,
        publishedCount: 0,
        publishedTitle: null,
        publishedSlug: null,
        radarRefreshed: false,
        policySource: 'open_agent_backlog',
        policyFocusKeys: ['decision_ledger'],
        preview: {
          wouldRefreshRadar: false,
          wouldGenerateCount: 0,
          wouldPublishTitle: '候选 A',
          wouldPublishSlug: 'candidate-a',
        },
        summary: {
          decisionMix: {
            publishCount: 0,
            holdCount: 1,
            reviseCount: 1,
            blockedCount: 0,
            totalCandidates: 2,
            readyCount: 1,
          },
          topBlockedReasons: [{ reason: '综合评分不足 220', count: 1 }],
          topHeldCandidates: [{ title: '候选 A', slug: 'candidate-a', score: 260 }],
          topReviseCandidates: [{ title: '候选 B', slug: 'candidate-b', score: 190 }],
          lastPublishRationale: [],
        },
        decisions: [],
        createdAt: '2026-04-08T00:00:00.000Z',
        updatedAt: '2026-04-08T00:00:01.000Z',
      },
    ]);

    expect(summary.latestRunId).toBe('ledger_1');
    expect(summary.latestMode).toBe('validate');
    expect(summary.latestReason).toBe('validation_mode_detected_publish_candidate');
    expect(summary.latestDecisionMix.holdCount).toBe(1);
    expect(summary.topHeldCandidates[0]?.slug).toBe('candidate-a');
    expect(summary.topBlockedReasons[0]?.reason).toBe('综合评分不足 220');
  });
});
