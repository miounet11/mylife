import { formatAddressLabel, normalizeBirthPlaceLabel } from '@/lib/paipan-form';

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
});
