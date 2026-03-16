import { buildProfileChartData, hasMeaningfulProfileIdentity, hasProfileContent } from '@/lib/profile-page';

describe('profile page helpers', () => {
  it('does not treat guest placeholder user as meaningful profile data', () => {
    expect(hasMeaningfulProfileIdentity({
      id: 'guest_1',
      name: '未命名测算者',
      gender: 'male',
    })).toBe(false);

    expect(hasProfileContent({
      user: {
        id: 'guest_1',
        name: '未命名测算者',
        gender: 'male',
      },
      fortunes: [],
      eventCount: 0,
    })).toBe(false);
  });

  it('treats bound email or birth info as meaningful profile identity', () => {
    expect(hasMeaningfulProfileIdentity({
      id: 'user_1',
      email: 'user@example.com',
    })).toBe(true);

    expect(hasMeaningfulProfileIdentity({
      id: 'user_2',
      birth_date: '1990-01-01',
    })).toBe(true);
  });

  it('builds chart data only from actual fortunes and deduplicates by year', () => {
    expect(buildProfileChartData([])).toEqual([]);

    const data = buildProfileChartData([
      {
        id: 'fortune_1',
        created_at: '2025-01-01T00:00:00.000Z',
        pattern: {
          strength: 'weak',
        },
      },
      {
        id: 'fortune_2',
        created_at: '2026-01-01T00:00:00.000Z',
        pattern: {
          strength: 'strong',
        },
      },
      {
        id: 'fortune_3',
        created_at: '2026-06-01T00:00:00.000Z',
        pattern: {
          strength: 'weak',
        },
      },
    ]);

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ year: 2025, career: 55 });
    expect(data[1]).toMatchObject({ year: 2026, career: 55 });
  });
});
