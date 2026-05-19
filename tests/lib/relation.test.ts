// v5-D39 多档案：relation 工具测试

import {
  normalizeRelation,
  describeRelation,
  sanitizeRelationInput,
  getRelationBadge,
  RELATION_OPTIONS,
} from '@/lib/relation';

describe('normalizeRelation', () => {
  it('returns "self" for null / empty / undefined', () => {
    expect(normalizeRelation(null)).toBe('self');
    expect(normalizeRelation(undefined)).toBe('self');
    expect(normalizeRelation('')).toBe('self');
    expect(normalizeRelation('   ')).toBe('self');
  });

  it('returns whitelisted key for known values', () => {
    for (const opt of RELATION_OPTIONS) {
      expect(normalizeRelation(opt.key)).toBe(opt.key);
    }
  });

  it('returns "other" for unknown strings', () => {
    expect(normalizeRelation('foo')).toBe('other');
    expect(normalizeRelation('boss')).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(normalizeRelation('SELF')).toBe('self');
    expect(normalizeRelation('Spouse')).toBe('spouse');
  });
});

describe('describeRelation', () => {
  it('prefers relationLabel when present', () => {
    expect(
      describeRelation({ relation: 'spouse', relationLabel: '老婆', name: '张三' })
    ).toBe('老婆');
  });

  it('falls back to name when relation is self', () => {
    expect(
      describeRelation({ relation: undefined, relationLabel: undefined, name: '张三' })
    ).toBe('张三');
  });

  it('uses relation key label when no relationLabel', () => {
    expect(
      describeRelation({ relation: 'child', relationLabel: undefined, name: '张三' })
    ).toBe('孩子');
  });

  it('falls back to 自己 when self and no name', () => {
    expect(
      describeRelation({ relation: 'self', relationLabel: undefined, name: '' })
    ).toBe('自己');
  });
});

describe('sanitizeRelationInput', () => {
  it('returns null for empty input', () => {
    expect(sanitizeRelationInput({})).toEqual({ relation: null, relationLabel: null });
  });

  it('whitelists relation keys', () => {
    expect(sanitizeRelationInput({ relation: 'spouse' })).toEqual({
      relation: 'spouse',
      relationLabel: null,
    });
    expect(sanitizeRelationInput({ relation: 'boss' })).toEqual({
      relation: null,
      relationLabel: null,
    });
  });

  it('lowercases relation', () => {
    expect(sanitizeRelationInput({ relation: 'SPOUSE' }).relation).toBe('spouse');
  });

  it('trims relationLabel and enforces 20-char max', () => {
    expect(sanitizeRelationInput({ relationLabel: '  老婆  ' }).relationLabel).toBe('老婆');
    const tooLong = 'a'.repeat(21);
    expect(sanitizeRelationInput({ relationLabel: tooLong }).relationLabel).toBeNull();
    expect(sanitizeRelationInput({ relationLabel: '' }).relationLabel).toBeNull();
  });
});

describe('getRelationBadge', () => {
  it('uses first char of relationLabel as initial', () => {
    const badge = getRelationBadge({ relation: 'other', relationLabel: '大宝', name: 'x' });
    expect(badge.initial).toBe('大');
  });

  it('uses name first char for self', () => {
    const badge = getRelationBadge({ relation: undefined, relationLabel: undefined, name: '张三' });
    expect(badge.initial).toBe('张');
  });
});
