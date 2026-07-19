import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  reportActionBoardCopy,
  reportChapterDockCopy,
  reportCockpitCopy,
  reportCockpitShellCopy,
  reportDeliveryTierLabel,
  reportNextActionsCopy,
  reportReadingPathCopy,
  reportResultPageCopy,
  reportRhythmCopy,
  reportTimingCopy,
  reportUpgradeStatusLabel,
  reportValidationCopy,
  resolveReportChromeLocale,
  shareImageCopy,
} from '@/lib/i18n/report-chrome-copy';

function assertNonEmptyEn(value: string, key: string) {
  assert.ok(typeof value === 'string' && value.trim().length > 0, `EN empty: ${key}`);
  assert.ok(!/[\u4e00-\u9fff]/.test(value), `EN still has CJK: ${key} = ${value}`);
}

describe('report-chrome-copy', () => {
  it('resolveReportChromeLocale defaults and normalizes', () => {
    assert.equal(resolveReportChromeLocale(undefined), 'zh-CN');
    assert.equal(resolveReportChromeLocale('en-US'), 'en');
    assert.equal(resolveReportChromeLocale('zh-TW'), 'zh-Hant');
  });

  it('EN cockpit / shell chrome is non-empty without CJK', () => {
    const shell = reportCockpitShellCopy('en');
    assertNonEmptyEn(shell.judgmentEyebrow, 'judgmentEyebrow');
    assertNonEmptyEn(shell.chatFallback, 'chatFallback');
    assertNonEmptyEn(shell.eventsFallback, 'eventsFallback');
    assertNonEmptyEn(shell.doFirst, 'doFirst');
    assertNonEmptyEn(shell.avoidFirst, 'avoidFirst');

    const agent = reportCockpitCopy('en');
    assertNonEmptyEn(agent.eyebrow, 'agent.eyebrow');
    assertNonEmptyEn(agent.title, 'agent.title');
    assertNonEmptyEn(agent.currentScore, 'agent.currentScore');
  });

  it('EN validation / rhythm / timing / action board chrome', () => {
    const v = reportValidationCopy('en');
    assertNonEmptyEn(v.eyebrow, 'validation.eyebrow');
    assertNonEmptyEn(v.title, 'validation.title');
    assertNonEmptyEn(v.highLabel, 'validation.highLabel');
    assertNonEmptyEn(v.agentRulesSummary(3, 5), 'validation.agentRulesSummary');

    const r = reportRhythmCopy('en');
    assertNonEmptyEn(r.eyebrow, 'rhythm.eyebrow');
    assertNonEmptyEn(r.headlineFallback, 'rhythm.headlineFallback');
    assertNonEmptyEn(r.empty, 'rhythm.empty');
    assertNonEmptyEn(r.trendUp, 'rhythm.trendUp');
    assertNonEmptyEn(r.windowPeak, 'rhythm.windowPeak');

    const t = reportTimingCopy('en');
    assertNonEmptyEn(t.title, 'timing.title');
    assertNonEmptyEn(t.tab30d, 'timing.tab30d');
    assertNonEmptyEn(t.domainCareer, 'timing.domainCareer');
    assertNonEmptyEn(t.agentEmpty, 'timing.agentEmpty');

    const a = reportActionBoardCopy('en');
    assertNonEmptyEn(a.title, 'action.title');
    assertNonEmptyEn(a.laneNow, 'action.laneNow');
    assertNonEmptyEn(a.laneAvoid, 'action.laneAvoid');
    assertNonEmptyEn(a.emptyDefault, 'action.emptyDefault');
    assertNonEmptyEn(a.domainStrategy, 'action.domainStrategy');
  });

  it('EN chapter dock / reading path / next actions / share', () => {
    const d = reportChapterDockCopy('en');
    assertNonEmptyEn(d.titleDefault, 'dock.titleDefault');
    assertNonEmptyEn(d.collapse, 'dock.collapse');
    assertNonEmptyEn(d.chapterWith('Overview'), 'dock.chapterWith');

    const path = reportReadingPathCopy('en');
    assertNonEmptyEn(path.title, 'readingPath.title');
    assert.equal(path.steps.length, 5);
    for (const step of path.steps) {
      assertNonEmptyEn(step.label, `readingPath.step.${step.anchor}`);
      assertNonEmptyEn(step.detail, `readingPath.detail.${step.anchor}`);
    }

    const next = reportNextActionsCopy('en');
    assertNonEmptyEn(next.title, 'nextActions.title');
    assertNonEmptyEn(next.consultantOpening, 'nextActions.consultantOpening');
    assert.equal(next.fallbacks.length, 3);
    next.fallbacks.forEach((f, i) => assertNonEmptyEn(f, `nextActions.fallback.${i}`));

    const share = shareImageCopy('en');
    assertNonEmptyEn(share.label, 'share.label');
    assertNonEmptyEn(share.disclaimer, 'share.disclaimer');
  });

  it('zh-CN cockpit shell keeps expected Chinese fallbacks', () => {
    const shell = reportCockpitShellCopy('zh-CN');
    assert.equal(shell.chatFallback, '进入结构追问');
    assert.equal(shell.eventsFallback, '记录关键事件');
  });

  it('EN classic result page chrome has no CJK', () => {
    const p = reportResultPageCopy('en');
    assertNonEmptyEn(p.jumpAskConsultant, 'result.jumpAskConsultant');
    assertNonEmptyEn(p.jumpTimingMap, 'result.jumpTimingMap');
    assertNonEmptyEn(p.jumpStructure, 'result.jumpStructure');
    assertNonEmptyEn(p.jumpAiDeepAsk, 'result.jumpAiDeepAsk');
    assertNonEmptyEn(p.timingTitle, 'result.timingTitle');
    assertNonEmptyEn(p.structureTitle, 'result.structureTitle');
    assertNonEmptyEn(p.actionTitle, 'result.actionTitle');
    assertNonEmptyEn(p.timingSubtitle, 'result.timingSubtitle');
    assertNonEmptyEn(p.structureSubtitle, 'result.structureSubtitle');
    assertNonEmptyEn(p.actionSubtitle, 'result.actionSubtitle');
    assertNonEmptyEn(p.dockAskConsultant, 'result.dockAskConsultant');
    assertNonEmptyEn(p.chapterDockTitle, 'result.chapterDockTitle');
    assertNonEmptyEn(p.sampleTitle, 'result.sampleTitle');
    assertNonEmptyEn(p.sampleSubtitle, 'result.sampleSubtitle');
    assertNonEmptyEn(p.evidenceTitle, 'result.evidenceTitle');
    assertNonEmptyEn(p.evidenceDescription, 'result.evidenceDescription');
    assertNonEmptyEn(p.servicesTitle, 'result.servicesTitle');
    assertNonEmptyEn(p.servicesSubtitle, 'result.servicesSubtitle');
    assertNonEmptyEn(p.membershipTitle, 'result.membershipTitle');
    assertNonEmptyEn(p.premiumServicesTitle, 'result.premiumServicesTitle');
    assertNonEmptyEn(p.subscriptionTitle, 'result.subscriptionTitle');
    assertNonEmptyEn(p.nextStepTitle, 'result.nextStepTitle');
    assertNonEmptyEn(p.nextStepSubtitle, 'result.nextStepSubtitle');
    assertNonEmptyEn(p.sidebarSampleBackfill, 'result.sidebarSampleBackfill');
    assertNonEmptyEn(p.sidebarCalibration, 'result.sidebarCalibration');
    assertNonEmptyEn(p.againAnalyze, 'result.againAnalyze');
    assertNonEmptyEn(p.upgradeRunning, 'result.upgradeRunning');
    assertNonEmptyEn(p.upgradeWaiting, 'result.upgradeWaiting');
    assertNonEmptyEn(p.upgradeDone, 'result.upgradeDone');
    assertNonEmptyEn(p.upgradePaused, 'result.upgradePaused');
    assertNonEmptyEn(p.badgeEnhancing, 'result.badgeEnhancing');
    assertNonEmptyEn(p.contentEnhanced, 'result.contentEnhanced');
    assertNonEmptyEn(p.contentReadable, 'result.contentReadable');
    assertNonEmptyEn(p.coreVerdictTitle, 'result.coreVerdictTitle');
    assertNonEmptyEn(p.deliveryTierBasic, 'result.deliveryTierBasic');
    assertNonEmptyEn(p.deliveryTierDeep, 'result.deliveryTierDeep');
    assertNonEmptyEn(p.deliveryTierFull, 'result.deliveryTierFull');
    assertNonEmptyEn(p.enhancePendingBanner, 'result.enhancePendingBanner');
    assertNonEmptyEn(p.enhanceLiteBanner, 'result.enhanceLiteBanner');
    assertNonEmptyEn(p.enhanceReadyBanner, 'result.enhanceReadyBanner');
    assert.equal(p.timingTitle, '② Timing map');
    assert.equal(p.jumpTimingMap, 'Next → Timing map');
    assert.equal(p.sampleTitle, '⑤ Sample backfill');
    assert.equal(p.evidenceTitle, '⑥ Evidence appendix');
    assert.equal(p.subscriptionTitle, 'Subscribe & updates');
    assert.equal(p.coreVerdictTitle, 'Pro ① Core verdict (chart analysis)');
    assert.equal(p.badgeEnhancing, 'Enhancing…');
  });

  it('reportUpgradeStatusLabel / reportDeliveryTierLabel EN has no CJK', () => {
    assertNonEmptyEn(reportUpgradeStatusLabel('en', 'running'), 'upgrade.running');
    assertNonEmptyEn(reportUpgradeStatusLabel('en', 'pending'), 'upgrade.pending');
    assertNonEmptyEn(reportUpgradeStatusLabel('en', 'retry'), 'upgrade.retry');
    assertNonEmptyEn(reportUpgradeStatusLabel('en', 'completed'), 'upgrade.completed');
    assertNonEmptyEn(reportUpgradeStatusLabel('en', 'failed'), 'upgrade.failed');
    assert.equal(reportUpgradeStatusLabel('en', null), '');
    assert.equal(reportUpgradeStatusLabel('en', 'unknown'), '');

    assert.equal(reportUpgradeStatusLabel('zh-CN', 'running'), '内容补全进行中');
    assert.equal(reportUpgradeStatusLabel('zh-CN', 'pending'), '等待内容补全');
    assert.equal(reportUpgradeStatusLabel('zh-CN', 'completed'), '内容已补全');
    assert.equal(reportUpgradeStatusLabel('zh-CN', 'failed'), '内容补全已暂停');

    assertNonEmptyEn(reportDeliveryTierLabel('en', 'basic'), 'tier.basic');
    assertNonEmptyEn(reportDeliveryTierLabel('en', 'enhanced'), 'tier.enhanced');
    assertNonEmptyEn(reportDeliveryTierLabel('en', 'expert'), 'tier.expert');
    assertNonEmptyEn(reportDeliveryTierLabel('en', null), 'tier.default');
    assert.equal(reportDeliveryTierLabel('zh-CN', 'basic'), '标准版');
    assert.equal(reportDeliveryTierLabel('zh-CN', 'enhanced'), '深度版');
    assert.equal(reportDeliveryTierLabel('zh-CN', 'expert'), '完整版');
  });
});
