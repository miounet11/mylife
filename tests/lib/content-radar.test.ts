import {
  buildGenerationInputFromSignal,
  buildSignalSuggestions,
  inferContentTypeFromSignal,
  parseFeedXml,
} from '@/lib/content-radar';

describe('content radar', () => {
  it('parses rss xml items', () => {
    const items = parseFeedXml(`
      <rss>
        <channel>
          <item>
            <title>2026 年换工作怎么看</title>
            <link>https://example.com/a</link>
            <pubDate>Fri, 13 Mar 2026 10:00:00 +0000</pubDate>
            <description><![CDATA[围绕跳槽、事业窗口和时机判断。]]></description>
          </item>
        </channel>
      </rss>
    `);

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toContain('换工作');
    expect(items[0]?.url).toBe('https://example.com/a');
  });

  it('builds ranked suggestions from signals', () => {
    const suggestions = buildSignalSuggestions([
      {
        id: 'signal_1',
        sourceId: 'src_1',
        sourceLabel: 'X Feed',
        platform: 'x',
        title: '关系推进什么时候更稳',
        url: 'https://example.com/1',
        matchedKeywords: ['婚恋', '关系'],
        score: 88,
      },
      {
        id: 'signal_2',
        sourceId: 'src_2',
        sourceLabel: 'TikTok Feed',
        platform: 'tiktok',
        title: '真太阳时为什么影响排盘',
        url: 'https://example.com/2',
        matchedKeywords: ['真太阳时'],
        score: 92,
      },
    ]);

    expect(suggestions[0]?.suggestedTopic).toContain('真太阳时');
    expect(suggestions[0]?.score).toBe(92);
    expect(suggestions[0]?.signalId).toBe('signal_2');
    expect(suggestions).toHaveLength(2);
  });

  it('infers content type and generation input from signal', () => {
    const signal = {
      id: 'signal_city',
      sourceId: 'src_city',
      sourceLabel: 'Google News',
      platform: 'google-news',
      title: 'Feng Shui city movement changes career decisions',
      url: 'https://example.com/city',
      summary: 'Discusses moving city, home space and work rhythm.',
      matchedKeywords: ['feng shui', '城市', '职业选择'],
      score: 75,
    };

    const inferred = inferContentTypeFromSignal(signal);
    const input = buildGenerationInputFromSignal(signal, { mode: 'cluster' });

    expect(inferred.contentType).toBe('insight');
    expect(inferred.subtype).toBe('city');
    expect(input.mode).toBe('cluster');
    expect(input.contentType).toBe('insight');
    expect(input.subtype).toBe('city');
    expect(input.sourceSignals).toContain('signal:signal_city');
  });
});
