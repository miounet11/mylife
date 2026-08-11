import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCampaignAnalyzeHref,
  getCampaignLanding,
  listCampaignSlugs,
} from '@/lib/campaign-landings';

describe('campaign landings', () => {
  it('lists core campaign slugs', () => {
    const slugs = listCampaignSlugs();
    assert.ok(slugs.includes('share'));
    assert.ok(slugs.includes('xhs'));
    assert.ok(slugs.includes('wechat'));
  });

  it('builds analyze href with source', () => {
    const c = getCampaignLanding('xhs');
    assert.ok(c);
    const href = buildCampaignAnalyzeHref(c!);
    assert.ok(href.includes('source=campaign_xhs'));
    assert.ok(href.includes('from=go%3Axhs') || href.includes('from=go:xhs'));
  });

  it('returns null for unknown', () => {
    assert.equal(getCampaignLanding('nope'), null);
  });
});
