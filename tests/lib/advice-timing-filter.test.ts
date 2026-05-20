import { sanitizeAdviceTiming } from '@/lib/advice-timing-filter';

describe('sanitizeAdviceTiming', () => {
  it('keeps anchored items (公历年月)', () => {
    const out = sanitizeAdviceTiming([
      '2026年5月推进核心项目谈判',
      '2026年7月底暂停重大决策',
    ]);
    expect(out).toEqual([
      '2026年5月推进核心项目谈判',
      '2026年7月底暂停重大决策',
    ]);
  });

  it('keeps 节气 anchored items', () => {
    const out = sanitizeAdviceTiming([
      '立春后30天内确认核心关系',
      '惊蛰前7天复盘资产配置',
    ]);
    expect(out.length).toBe(2);
  });

  it('keeps 流年/大运 anchored items', () => {
    const out = sanitizeAdviceTiming([
      '丙午流年复盘资产配置',
      '庚午大运推进事业核心',
    ]);
    expect(out.length).toBe(2);
  });

  it('drops items containing fuzzy time tokens', () => {
    const out = sanitizeAdviceTiming([
      '近期推进核心项目',
      '2026年5月推进核心项目谈判',
      '将来再看时机',
      '合适时机切换赛道',
      '一段时间内观望',
      '短期内收缩',
      '中期看好艺术',
      '长期持有',
      '不久后启动',
    ]);
    expect(out).toEqual(['2026年5月推进核心项目谈判']);
  });

  it('drops items longer than 40 chars', () => {
    const longOne = '2026年5月' + '推进核心项目谈判'.repeat(10);
    const out = sanitizeAdviceTiming([longOne, '2026年6月签约']);
    expect(out).toEqual(['2026年6月签约']);
  });

  it('caps result length at 5', () => {
    const out = sanitizeAdviceTiming([
      '2026年1月推进',
      '2026年2月复盘',
      '2026年3月谈判',
      '2026年4月签约',
      '2026年5月暂停',
      '2026年6月切换',
      '2026年7月观望',
    ]);
    expect(out.length).toBe(5);
    expect(out[0]).toBe('2026年1月推进');
    expect(out[4]).toBe('2026年5月暂停');
  });

  it('deduplicates exact-match items', () => {
    const out = sanitizeAdviceTiming([
      '2026年5月推进谈判',
      '2026年5月推进谈判',
      '2026年6月签约',
    ]);
    expect(out).toEqual(['2026年5月推进谈判', '2026年6月签约']);
  });

  it('returns [] for non-array input', () => {
    expect(sanitizeAdviceTiming(undefined)).toEqual([]);
    expect(sanitizeAdviceTiming(null)).toEqual([]);
    expect(sanitizeAdviceTiming('2026年5月推进')).toEqual([]);
    expect(sanitizeAdviceTiming({ when: '2026年5月' })).toEqual([]);
  });

  it('skips non-string entries and empty strings', () => {
    const out = sanitizeAdviceTiming([
      '',
      '   ',
      null,
      123,
      { when: '2026年5月' },
      '2026年5月推进谈判',
    ]);
    expect(out).toEqual(['2026年5月推进谈判']);
  });

  it('trims whitespace before evaluating', () => {
    const out = sanitizeAdviceTiming(['  2026年5月推进谈判  ']);
    expect(out).toEqual(['2026年5月推进谈判']);
  });

  it('returns empty when all items are fuzzy (no fallback to keep noise)', () => {
    const out = sanitizeAdviceTiming([
      '近期推进',
      '将来再看',
      '合适时机切换',
    ]);
    expect(out).toEqual([]);
  });
});
