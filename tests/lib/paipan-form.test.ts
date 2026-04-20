import { formatAddressLabel, getAnalyzeEntryProgress, normalizeBirthPlaceLabel } from '@/lib/paipan-form';

describe('paipan form helpers', () => {
  it('normalizes unknown placeholder location to Beijing', () => {
    expect(normalizeBirthPlaceLabel(['未知地', '北京时间', '--'])).toBe('北京');
  });

  it('keeps meaningful place segments only once', () => {
    expect(normalizeBirthPlaceLabel(['中国', '北京', '朝阳区'])).toBe('中国 北京 朝阳区');
  });

  it('deduplicates repeated municipality segments', () => {
    expect(normalizeBirthPlaceLabel(['北京市', '北京市', '朝阳区'])).toBe('北京市 朝阳区');
    expect(formatAddressLabel(['北京市', '北京市', '朝阳区'])).toBe('北京市 朝阳区');
  });

  it('hides placeholder district labels in display text', () => {
    expect(formatAddressLabel(['未知地', '北京时间', '--'])).toBe('未知地 北京时间');
  });

  it('blocks submit until time and location are explicitly confirmed', () => {
    const state = getAnalyzeEntryProgress({
      timeConfirmed: false,
      locationConfirmed: true,
      hasKnownBirthHour: true,
      hasKnownLocation: true,
      usesSolarTime: true,
    });

    expect(state.canSubmit).toBe(false);
    expect(state.nextHint).toContain('先确认出生时间');
    expect(state.entryReadiness[0]).toEqual({
      label: '出生时间确认',
      done: false,
      value: '尚未确认出生时间',
    });
  });

  it('allows submit after explicit confirmation even when hour and location stay unknown', () => {
    const state = getAnalyzeEntryProgress({
      timeConfirmed: true,
      locationConfirmed: true,
      hasKnownBirthHour: false,
      hasKnownLocation: false,
      usesSolarTime: false,
    });

    expect(state.canSubmit).toBe(true);
    expect(state.readinessScore).toBe(40);
    expect(state.entryReadiness[0].value).toBe('已确认：时辰未知');
    expect(state.entryReadiness[1].value).toBe('已确认：未知地（按北京时间）');
    expect(state.nextHint).toContain('当前可以进入判断');
  });
});
