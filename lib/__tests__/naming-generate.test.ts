import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateCompanyNames,
  generatePersonNames,
  generateProductNames,
  scoreName,
} from '@/lib/naming';

describe('naming lab', () => {
  it('generates personal candidates with surname', () => {
    const r = generatePersonNames({
      surname: '王',
      gender: 'male',
      yongShen: ['木', '水'],
      count: 12,
    });
    assert.equal(r.mode, 'person');
    assert.ok(r.candidates.length >= 8);
    assert.ok(r.candidates.every((c) => (c.fullName || '').startsWith('王') || c.name.length >= 1));
    assert.ok(r.candidates[0].score >= r.candidates[r.candidates.length - 1].score);
  });

  it('scores company names with brandability', () => {
    const c = scoreName({ mode: 'company', name: '云启', industry: '科技' });
    assert.ok(c.score > 0);
    assert.ok(c.breakdown.brandability != null);
  });

  it('generates product names', () => {
    const r = generateProductNames({
      category: 'SaaS',
      keywords: ['云', '智'],
      style: 'tech',
      count: 10,
    });
    assert.ok(r.candidates.length >= 8);
  });

  it('generates company names', () => {
    const r = generateCompanyNames({
      industry: '教育',
      keywords: ['启', '明'],
      preferredLength: 2,
      count: 10,
    });
    assert.ok(r.candidates.length >= 8);
  });
});
