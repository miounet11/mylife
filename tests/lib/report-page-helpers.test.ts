import { describe, expect, test } from '@jest/globals';
import { sanitizePublicFortuneRecord } from '@/lib/report-page-helpers';
import type { FortuneRecord } from '@/lib/user-types';

function createRecord(): FortuneRecord {
  return {
    id: 'report_1',
    userId: 'user_secret',
    name: '张三',
    birthDate: '1990-01-02',
    birthTime: '03:04',
    birthPlace: '北京市朝阳区',
    timezone: 8,
    gender: 'male',
    bazi: {
      name: '张三',
      userId: 'user_secret',
      birthDate: '1990-01-02',
      birthTime: '03:04',
      birthPlace: '北京市朝阳区',
      dayMaster: '甲木',
      pillars: [],
    } as any,
    fiveElements: {} as any,
    tenGods: {} as any,
    pattern: { type: '身旺格', description: '结构偏强' } as any,
    fortune: {} as any,
    advice: {} as any,
    evidence: {} as any,
    analysis: { summary: '公开摘要' } as any,
    isPublic: true,
  };
}

describe('report page helpers', () => {
  test('sanitizes identity fields for public fortune records', () => {
    const sanitized = sanitizePublicFortuneRecord(createRecord());

    expect(sanitized.userId).toBe('public-anonymous');
    expect(sanitized.name).toBe('张**');
    expect(sanitized.birthDate).toBe('');
    expect(sanitized.birthTime).toBe('');
    expect(sanitized.birthPlace).toBeUndefined();
    expect((sanitized.bazi as any).userId).toBeUndefined();
    expect((sanitized.bazi as any).birthDate).toBeUndefined();
    expect((sanitized.bazi as any).birthTime).toBeUndefined();
    expect((sanitized.bazi as any).birthPlace).toBeUndefined();
    expect((sanitized.bazi as any).name).toBe('张**');
    expect(sanitized.pattern.type).toBe('身旺格');
  });
});
