import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateCompanyNames } from '@/lib/naming/generate';
import { buildCompanyNamePatterns } from '@/lib/naming/company-entity';

describe('company legal-style naming', () => {
  it('builds 字号+科技+有限公司 patterns', () => {
    const patterns = buildCompanyNamePatterns({
      tradeNames: ['伙计'],
      industry: '科技',
      region: '广东',
      jurisdiction: 'CN',
      entityForm: 'co_ltd',
      count: 20,
    });
    const names = patterns.map((p) => p.fullName);
    assert.ok(names.some((n) => n.includes('伙计') && n.includes('科技') && n.includes('有限公司')));
    assert.ok(names.some((n) => n.includes('广东') || n.includes('广')));
  });

  it('generateCompanyNames returns full legal names', () => {
    const r = generateCompanyNames({
      tradeName: '伙计',
      industry: '科技',
      region: '深圳',
      jurisdiction: 'CN',
      entityForm: 'co_ltd',
      keywords: ['智能'],
      count: 12,
    });
    assert.ok(r.candidates.length >= 8);
    assert.ok(
      r.candidates.some(
        (c) => (c.fullName || '').includes('有限公司') && (c.fullName || '').includes('伙计'),
      ),
    );
  });

  it('supports US LLC pattern', () => {
    const patterns = buildCompanyNamePatterns({
      tradeNames: ['伙计'],
      industry: '科技',
      jurisdiction: 'US',
      count: 10,
    });
    assert.ok(patterns.some((p) => /LLC|Inc\./.test(p.fullName)));
  });
});
