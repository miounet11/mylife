import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserFacingReportStatus } from '@/lib/report-status-presentation';

describe('buildUserFacingReportStatus', () => {
  it('maps agent-fallback + verify FAIL to usable structure (not birth-time scare)', () => {
    const status = buildUserFacingReportStatus({
      llmUsed: true,
      agenticUsed: true,
      consistencyScore: 50,
      verifyVerdict: 'FAIL',
      generatedFrom: 'upgrade',
      canManage: true,
      orchestration: {
        mode: 'deterministic-expert',
        totalLlmCalls: 0,
        successRate: 1,
        agentSources: {
          core_constitution: 'fallback',
          kline_narrative: 'fallback',
          career_wealth: 'fallback',
          strategy_advisor: 'fallback',
        },
      },
      qualityAudit: {
        overallScore: 83,
        status: 'retry',
        deliveryTier: 'basic',
        targetAchieved: false,
        dimensions: [
          { key: 'engine', score: 100, label: '命理底座' },
          { key: 'llm', score: 94, label: '正文质量' },
          { key: 'agentic', score: 72, label: '专家协同' },
          { key: 'consistency', score: 50, label: '一致性校验' },
          { key: 'completeness', score: 100, label: '内容完整度' },
        ],
        concerns: [
          '测算环节证据链不完整，部分结果组合还需要补齐依据或行动项。',
          '本次未形成有效的多维补充判断。',
          '一致性校验未通过，这份报告更适合作为参考草稿而不是最终版本。',
        ],
        blockingIssues: ['一致性校验未通过', '专家协同仍需补强', '一致性校验仍需补强'],
        recommendedActions: ['建议核对出生时间与出生地后重新测算，并稍后升级重算。'],
      },
      upgradeJob: {
        status: 'failed',
        lastError: 'TARGET_NOT_REACHED',
        meta: { strategy: 'immediate' },
      },
    });

    assert.equal(status.readiness, 'usable');
    assert.equal(status.badge, '结构可用');
    assert.equal(status.editionLabel, '标准版');
    assert.equal(status.progress.state, 'paused');
    assert.match(status.progress.label, /暂停/);
    assert.doesNotMatch(status.progress.label, /正在刷新|进行中/);
    assert.equal(status.primaryAction.kind, 'upgrade_now');
    assert.equal(status.primaryAction.label, '继续完善这份报告');
    assert.ok(status.trustPoints.some((p) => /命盘底座/.test(p)));
    assert.ok(status.cautionPoints.some((p) => /多维|短期|对齐/.test(p)));
    assert.ok(!status.cautionPoints.some((p) => /出生/.test(p)));
    assert.ok(status.summary.includes('主结构') || status.summary.includes('四柱'));
  });

  it('PASS + high score → ready', () => {
    const status = buildUserFacingReportStatus({
      llmUsed: true,
      verifyVerdict: 'PASS',
      consistencyScore: 96,
      qualityAudit: {
        overallScore: 96,
        status: 'ready',
        deliveryTier: 'expert',
        targetAchieved: true,
        dimensions: [
          { key: 'engine', score: 98 },
          { key: 'llm', score: 95 },
          { key: 'agentic', score: 92 },
          { key: 'consistency', score: 96 },
          { key: 'completeness', score: 97 },
        ],
      },
      canManage: true,
    });
    assert.equal(status.readiness, 'ready');
    assert.equal(status.badge, '可直接用');
    assert.equal(status.primaryAction.kind, 'none');
  });

  it('failed upgrade never claims refreshing', () => {
    const status = buildUserFacingReportStatus({
      llmUsed: true,
      upgradeJob: { status: 'failed', lastError: 'LLM_UNAVAILABLE' },
      qualityAudit: { overallScore: 70, deliveryTier: 'basic', dimensions: [{ key: 'engine', score: 90 }] },
    });
    assert.equal(status.progress.state, 'paused');
    assert.match(status.progress.detail || '', /保留|可读/);
  });

  it('locale en → badge/title/summary/trust without CJK', () => {
    const cjk = /[\u4e00-\u9fff]/
    const status = buildUserFacingReportStatus({
      locale: 'en',
      llmUsed: true,
      agenticUsed: true,
      consistencyScore: 50,
      verifyVerdict: 'FAIL',
      canManage: true,
      orchestration: {
        mode: 'deterministic-expert',
        totalLlmCalls: 0,
        agentSources: {
          core_constitution: 'fallback',
          kline_narrative: 'fallback',
          career_wealth: 'fallback',
          strategy_advisor: 'fallback',
        },
      },
      qualityAudit: {
        overallScore: 83,
        status: 'retry',
        deliveryTier: 'basic',
        targetAchieved: false,
        dimensions: [
          { key: 'engine', score: 100 },
          { key: 'llm', score: 94 },
          { key: 'agentic', score: 72 },
          { key: 'consistency', score: 50 },
          { key: 'completeness', score: 100 },
        ],
      },
      upgradeJob: { status: 'failed', lastError: 'TARGET_NOT_REACHED' },
    });

    assert.equal(status.readiness, 'usable');
    assert.equal(status.badge, 'Structure ready');
    assert.equal(status.editionLabel, 'Standard');
    assert.equal(status.primaryAction.label, 'Continue improving this report');
    assert.equal(status.progress.state, 'paused');
    assert.equal(status.progress.label, 'Automatic improvement paused');

    assert.doesNotMatch(status.badge, cjk);
    assert.doesNotMatch(status.title, cjk);
    assert.doesNotMatch(status.summary, cjk);
    assert.doesNotMatch(status.editionLabel, cjk);
    assert.doesNotMatch(status.primaryAction.label, cjk);
    assert.doesNotMatch(status.progress.label, cjk);
    for (const p of status.trustPoints) assert.doesNotMatch(p, cjk);
    for (const p of status.cautionPoints) assert.doesNotMatch(p, cjk);
    for (const d of status.details) {
      assert.doesNotMatch(d.label, cjk);
      // values may include scores/verdict short labels (Pass/Watch/Fail) — still no CJK
      assert.doesNotMatch(d.value, cjk);
    }
  });
});
