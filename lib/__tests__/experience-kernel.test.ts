import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildExperienceQualityReceipt } from '@/lib/experience-kernel/quality-receipt';
import { buildTruthAnchor, formatTruthAnchorContract } from '@/lib/experience-kernel/truth-anchor';
import { listExperienceSkills, resolveExperienceSkill } from '@/lib/skills/registry';
import { USABLE_DEEP_SCORE } from '@/lib/experience-kernel/types';

describe('experience kernel', () => {
  it('builds usable-deep quality receipt at score ≥83', () => {
    const receipt = buildExperienceQualityReceipt({
      llmUsed: true,
      verifyVerdict: 'WARN',
      qualityAudit: {
        overallScore: USABLE_DEEP_SCORE,
        grade: 'A',
        deliveryTier: 'enhanced',
        targetAchieved: false,
        dimensions: [
          { key: 'engine', score: 95 },
          { key: 'llm', score: 88 },
        ],
      },
      upgradeJob: {
        status: 'completed',
        meta: { reason: 'DELIVERED_AT_85', nearTargetDelivered: true },
      },
      sevenDayActions: ['明确本周主线', '完成一次小交付', '记录回看'],
      canManage: true,
    });
    assert.equal(receipt.usableDeep, true);
    assert.equal(receipt.hasSevenDayActions, true);
    assert.ok(receipt.confidenceScore === 83);
    assert.ok(receipt.trustPoints.length >= 1);
  });

  it('truth anchor locks day master when present', () => {
    const anchor = buildTruthAnchor({
      id: 'r1',
      dayMaster: '甲',
      yongShen: ['木', '水'],
      currentDaYun: '乙丑',
    });
    assert.equal(anchor.hasEngineLock, true);
    const text = formatTruthAnchorContract(anchor);
    assert.match(text, /日主：甲/);
    assert.match(text, /禁止改写/);
  });

  it('truth anchor admits unbound session', () => {
    const text = formatTruthAnchorContract(buildTruthAnchor(null));
    assert.match(text, /未绑定/);
  });

  it('skill registry resolves career intent', () => {
    const skill = resolveExperienceSkill({ intent: 'career' });
    assert.equal(skill.teacherId, 'career');
    assert.ok(skill.id.startsWith('skill.teacher.'));
    const all = listExperienceSkills({ galleryOnly: true });
    assert.ok(all.length >= 3);
  });
});
