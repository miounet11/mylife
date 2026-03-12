import { buildChinaLocation, getChinaCities, getChinaDistricts } from '@/lib/location-engine';

describe('location-engine china selection', () => {
  it('builds county-level location for direct region selection', () => {
    const location = buildChinaLocation('河南省', '信阳市', '潢川县');

    expect(location).not.toBeNull();
    expect(location?.displayName).toBe('潢川县');
    expect(location?.fullName).toBe('河南省 信阳市 潢川县');
    expect(location?.lng).toBeCloseTo(115.0519, 4);
    expect(location?.lat).toBeCloseTo(32.1319, 4);
  });

  it('returns matching city and district lists for county selection flow', () => {
    const cities = getChinaCities('河南省');
    const districts = getChinaDistricts('河南省', '信阳市');

    expect(cities.some((city) => city.name === '信阳市')).toBe(true);
    expect(districts.some((district) => district.name === '潢川县')).toBe(true);
  });
});
