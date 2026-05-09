import {
  buildProgressSegments,
  formatAddressLabel,
  getAnalyzeEntryProgress,
  normalizeBirthPlaceLabel,
  parseBirthTimeConfirm,
} from '@/lib/paipan-form';

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

describe('buildProgressSegments', () => {
  it('returns three segments with done flags', () => {
    const segments = buildProgressSegments({
      timeConfirmed: true,
      locationConfirmed: false,
      genderConfirmed: true,
    });
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ key: 'time', label: '出生时间', done: true });
    expect(segments[1]).toEqual({ key: 'place', label: '出生地点', done: false });
    expect(segments[2]).toEqual({ key: 'gender', label: '性别', done: true });
  });
});

describe('parseBirthTimeConfirm', () => {
  it('parses solar tab data with full time', () => {
    const result = parseBirthTimeConfirm(0, ['1990', '06', '15', '08', '30']);
    expect(result).toEqual({
      patch: {
        type: 0,
        birthday: '1990-06-15 08:30',
        lunarArr: [],
        unknowhour: 0,
      },
      datetimeIndexReal: 0,
    });
  });

  it('marks unknown hour when minute is "未知"', () => {
    const result = parseBirthTimeConfirm(0, ['1990', '06', '15', '未知', '未知']);
    expect(result?.patch).toMatchObject({ unknowhour: 1, birthday: '1990-06-15 00:00' });
  });

  it('parses pillar tab string with 时辰未知', () => {
    const result = parseBirthTimeConfirm(2, '1990-06-15 时辰未知');
    expect(result).toEqual({
      patch: {
        type: 2,
        birthday: '1990-06-15 00:00',
        unknowhour: 1,
        lunarArr: [],
      },
      datetimeIndexReal: 2,
    });
  });

  it('parses lunar tab data into solar birthday', () => {
    const result = parseBirthTimeConfirm(1, ['1990', '五月', '初一', '08', '30']);
    expect(result?.patch.type).toBe(1);
    expect(result?.patch.unknowhour).toBe(0);
    expect(result?.datetimeIndexReal).toBe(1);
    expect(typeof result?.patch.birthday).toBe('string');
    expect(Array.isArray(result?.patch.lunarArr)).toBe(true);
  });

  it('returns null on invalid combination', () => {
    expect(parseBirthTimeConfirm(0, 'string-not-array')).toBeNull();
    expect(parseBirthTimeConfirm(2, ['array-not-string'])).toBeNull();
  });
});
