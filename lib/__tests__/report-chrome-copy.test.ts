import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  reportActionBoardCopy,
  reportChapterDockCopy,
  reportCockpitCopy,
  reportCockpitShellCopy,
  reportNextActionsCopy,
  reportReadingPathCopy,
  reportRhythmCopy,
  reportTimingCopy,
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
});
