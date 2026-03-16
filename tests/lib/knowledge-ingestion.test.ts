import { describe, expect, test } from '@jest/globals';
import Database from 'better-sqlite3';
import {
  buildSourceDocumentInputFromSignal,
  inferRightsStatusFromPlatform,
  inferSourceTypeFromSignal,
  promoteSignalsToSourceDocuments,
} from '@/lib/knowledge-ingestion';

describe('knowledge ingestion', () => {
  test('infers restricted platform rights conservatively', () => {
    expect(inferRightsStatusFromPlatform('zhihu')).toBe('platform_restricted');
    expect(inferRightsStatusFromPlatform('google-news')).toBe('platform_restricted');
    expect(inferRightsStatusFromPlatform('ctext')).toBe('unknown');
  });

  test('maps signals into source document inputs', () => {
    const input = buildSourceDocumentInputFromSignal({
      id: 'signal_1',
      sourceId: 'zhihu-search',
      sourceLabel: '知乎搜索',
      platform: 'zhihu',
      title: '易经入门先看什么',
      url: 'https://www.zhihu.com/question/1',
      author: '匿名用户',
      summary: '围绕易经入门书和学习路径的讨论。',
      matchedKeywords: ['易经', '入门', '书单'],
      score: 88,
      meta: { rank: 1 },
    });

    expect(inferSourceTypeFromSignal({
      id: 'signal_2',
      sourceId: 'src',
      sourceLabel: 'Feed',
      platform: 'google-news',
      title: 'title',
      url: 'https://example.com',
    })).toBe('rss');
    expect(input.rightsStatus).toBe('platform_restricted');
    expect(input.rawMeta?.signalId).toBe('signal_1');
    expect(input.tags).toEqual(['易经', '入门', '书单']);
  });

  test('promotes signals into source documents', () => {
    const testDb = new Database(':memory:');

    const documents = promoteSignalsToSourceDocuments([
      {
        id: 'signal_1',
        sourceId: 'zhihu-search',
        sourceLabel: '知乎搜索',
        platform: 'zhihu',
        title: '八字入门看什么',
        url: 'https://www.zhihu.com/question/1',
        matchedKeywords: ['八字', '入门'],
      },
      {
        id: 'signal_2',
        sourceId: 'google-news-yijing',
        sourceLabel: 'Google News',
        platform: 'google-news',
        title: '易经研究新文章',
        url: 'https://news.example.com/1',
        matchedKeywords: ['易经'],
      },
    ], testDb);

    expect(documents).toHaveLength(2);
    expect(documents[0]?.platform).toBe('zhihu');
    expect(documents[1]?.sourceType).toBe('rss');

    testDb.close();
  });
});
