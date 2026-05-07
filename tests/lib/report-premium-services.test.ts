import {
  buildPremiumServiceOffers,
  isPremiumServiceKey,
  normalizePremiumServiceKey,
} from '@/lib/report-premium-services';
import type { MonthlyWindow, ReportCorrectionInsight, ScenarioView } from '@/lib/report-v2';

describe('buildPremiumServiceOffers', () => {
  it('returns four consumer-facing premium offers', () => {
    const scenarioViews: ScenarioView[] = [
      {
        key: 'overall',
        title: '综合版',
        score: 68,
        trend: 'stable',
        status: 'steady',
        summary: '整体节奏正在进入重新布局期。',
        focus: ['先稳结构再扩张'],
        risks: ['不要逆势硬推'],
        actionLabel: '先稳住',
      },
      {
        key: 'career',
        title: '事业版',
        score: 55,
        trend: 'down',
        status: 'caution',
        summary: '事业板块当前更适合先收缩再择机推进。',
        focus: ['先处理关键阻塞'],
        risks: ['避免仓促换赛道'],
        actionLabel: '先避坑',
      },
    ];
    const monthlyWindows: MonthlyWindow[] = [
      {
        key: '2026-04',
        year: 2026,
        month: 4,
        label: '2026年04月',
        element: '木',
        score: 78,
        status: 'push',
        theme: '适合谈判与推进',
        reason: '木气增强，适合外部连接。',
      },
    ];
    const correctionInsight: ReportCorrectionInsight = {
      level: 'watch',
      summary: '近期更适合先复盘再决定是否继续投入。',
      likelyCause: '执行节奏和现实窗口错位。',
      fixes: ['先缩小试错成本'],
      checkpoints: ['先看时机再动'],
    };

    const offers = buildPremiumServiceOffers({
      scenarioViews,
      monthlyWindows,
      correctionInsight,
    });

    expect(offers).toHaveLength(4);
    expect(offers.map((item) => item.key)).toEqual([
      'event-simulation',
      'event-verdict',
      'event-review',
      'meihua-enhancement',
    ]);
    expect(offers[0].featuredSignal).toContain('2026年04月');
    expect(offers[1].featuredSignal).toContain('事业板块当前更适合先收缩再择机推进');
    expect(offers[2].featuredSignal).toContain('近期更适合先复盘再决定是否继续投入');
  });

  it('does not treat non-premium chat intents as premium service keys', () => {
    expect(isPremiumServiceKey('event-verdict')).toBe(true);
    expect(normalizePremiumServiceKey(' event-review ')).toBe('event-review');
    expect(isPremiumServiceKey('home-layout-diagnosis')).toBe(false);
    expect(normalizePremiumServiceKey('home-layout-diagnosis')).toBeUndefined();
  });
});
