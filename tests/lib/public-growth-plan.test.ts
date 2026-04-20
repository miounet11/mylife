import { describe, expect, test } from '@jest/globals';
import {
  assessGrowthPublication,
  assessPublicGrowthPublication,
  buildPublicGrowthAudit,
  listPublicGrowthTargets,
} from '@/lib/public-growth-plan';
import type { ManagedContentEntry } from '@/lib/content-store';

function buildEntry(overrides: Partial<ManagedContentEntry>): ManagedContentEntry {
  const now = new Date().toISOString();

  return {
    id: 'content_test_growth',
    contentType: 'knowledge',
    subtype: null,
    slug: 'test-growth-entry',
    title: '测试增长内容',
    name: null,
    excerpt: '测试增长内容摘要，确保公开计划可以正确识别已有覆盖。',
    category: '增长测试',
    readTime: '6 分钟',
    tags: ['测试', '增长'],
    featured: false,
    seoTitle: '测试增长内容',
    seoDescription: '测试增长内容描述。',
    sections: [
      { title: 'A', paragraphs: ['完整段落内容。', '第二段也完整。'] },
      { title: 'B', paragraphs: ['完整段落内容。', '第二段也完整。'] },
      { title: 'C', paragraphs: ['完整段落内容。', '第二段也完整。'] },
      { title: 'D', paragraphs: ['完整段落内容。', '第二段也完整。'] },
    ],
    status: 'published',
    source: 'cms',
    meta: {},
    createdBy: 'test_user',
    updatedBy: 'test_user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('public growth plan', () => {
  test('exports unique public growth keys', () => {
    const targets = listPublicGrowthTargets();
    const keys = targets.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('prioritizes missing regional targets and recognizes covered ones', () => {
    const entries: ManagedContentEntry[] = [
      buildEntry({
        slug: 'diaspora-time-guide',
        title: '海外华人真太阳时与时区换算指南',
        excerpt: '解释海外华人出生在不同时区和夏令时环境下为什么更容易出现排盘误差。',
        tags: ['海外华人', '夏令时', '真太阳时', '排盘'],
        meta: {
          growthPlanKey: 'diaspora-time-precision',
          market: '北美华人 / 海外华人',
          locale: 'zh-US',
        },
      }),
    ];

    const audit = buildPublicGrowthAudit(entries);
    const covered = audit.coverage.find((item) => item.target.key === 'diaspora-time-precision');
    const missing = audit.queue.find((item) => item.target.key === 'hong-kong-career-window');

    expect(covered?.publishedCount).toBe(1);
    expect(covered?.missing).toBe(false);
    expect(missing?.target.market).toContain('香港');
  });

  test('does not keep covered targets in queue only because draft reserve is empty', () => {
    const entries: ManagedContentEntry[] = [
      buildEntry({
        slug: 'diaspora-time-guide-covered',
        title: '海外华人真太阳时与时区换算指南',
        excerpt: '解释海外华人出生在不同时区和夏令时环境下为什么更容易出现排盘误差，并说明为什么不能直接拿钟表时间代替命盘校正。',
        tags: ['海外华人', '夏令时', '真太阳时', '排盘'],
        meta: {
          growthPlanKey: 'diaspora-time-precision',
          market: '北美华人 / 海外华人',
          locale: 'zh-US',
          sourceType: 'public-growth',
          publicationReady: true,
        },
      }),
    ];

    const audit = buildPublicGrowthAudit(entries);

    expect(audit.queue.some((item) => item.target.key === 'diaspora-time-precision')).toBe(false);
  });

  test('does not cross-match entries from a different locale market', () => {
    const entries: ManagedContentEntry[] = [
      buildEntry({
        slug: 'hong-kong-career-draft',
        title: '香港用戶轉工與事業時機的案例拆解',
        contentType: 'case',
        status: 'draft',
        tags: ['香港', '轉工', '事業'],
        meta: {
          growthPlanKey: 'hong-kong-career-window',
          market: '香港用戶',
          locale: 'zh-HK',
          sourceType: 'public-growth',
        },
      }),
    ];

    const audit = buildPublicGrowthAudit(entries);
    const singapore = audit.coverage.find((item) => item.target.key === 'singapore-malaysia-career');
    const hongKong = audit.coverage.find((item) => item.target.key === 'hong-kong-career-window');

    expect(hongKong?.draftCount).toBe(1);
    expect(singapore?.draftCount).toBe(0);
  });

  test('ignores unrelated heuristic drafts once public-growth metadata is missing', () => {
    const entries: ManagedContentEntry[] = [
      buildEntry({
        slug: 'tw-heuristic-draft',
        title: '台湾用户第一次看八字命盘最容易误解什么',
        status: 'draft',
        source: 'agent-fallback:async-test',
        tags: ['台灣', '八字', '命盤'],
        meta: {},
      }),
      buildEntry({
        slug: 'tw-public-entry',
        title: '第一次看八字命盤？台灣新手最常搞不懂的幾件事',
        source: 'agent-llm:public-growth:public-growth',
        tags: ['台灣', '八字', '命盤', '排盤', '流年'],
        meta: {
          growthPlanKey: 'taiwan-report-reading',
          market: '台灣用戶',
          locale: 'zh-TW',
          sourceType: 'public-growth',
          publicationReady: true,
        },
      }),
    ];

    const audit = buildPublicGrowthAudit(entries);
    const taiwan = audit.coverage.find((item) => item.target.key === 'taiwan-report-reading');

    expect(taiwan?.publishedCount).toBe(1);
    expect(taiwan?.draftCount).toBe(0);
    expect(taiwan?.sampleTitles).toContain('第一次看八字命盤？台灣新手最常搞不懂的幾件事');
  });

  test('requires llm-generated regional drafts before public promotion', () => {
    const fallbackDraft = buildEntry({
      contentType: 'knowledge',
      status: 'draft',
      source: 'agent-fallback:public-growth:public-growth',
      title: '台灣用戶第一次看八字命盤的深度解讀',
      meta: {
        growthPlanKey: 'taiwan-report-reading',
        market: '台灣用戶',
        locale: 'zh-TW',
        sourceType: 'public-growth',
      },
    });

    const llmDraft = buildEntry({
      contentType: 'knowledge',
      status: 'draft',
      source: 'agent-llm:public-growth:public-growth',
      title: '台灣用戶第一次看八字命盤的深度解讀',
      excerpt: '這是一篇面向台灣用戶的完整公開知識稿，能夠清楚解釋命盤、流年、排盤閱讀順序與常見誤區，也能自然承接到個人測算。',
      seoTitle: '台灣用戶第一次看八字命盤與流年的完整解讀指南',
      seoDescription: '這篇內容面向台灣用戶，完整解釋八字命盤、流年與排盤結果的閱讀方法、常見誤區與下一步如何進入個人測算流程。',
      tags: ['台灣', '命盤', '流年', '排盤', '八字'],
      sections: [
        { title: '核心误区', paragraphs: ['完整公開內容段落一，足夠長且可讀，能說清楚台灣用戶在命盤閱讀上最常出現的理解偏差。', '完整公開內容段落二，足夠長且可讀，能進一步補足排盤與流年閱讀時的實際判斷邊界。'] },
        { title: '阅读顺序', paragraphs: ['完整公開內容段落三，足夠長且可讀，能解釋應先看哪些結構，再看哪些變量，避免閱讀順序錯亂。', '完整公開內容段落四，足夠長且可讀，能幫助使用者把抽象命理語言轉回現實決策語言。'] },
        { title: '常见误读', paragraphs: ['完整公開內容段落五，足夠長且可讀，能指出最常見的錯誤套用方式與可能造成的實際代價。', '完整公開內容段落六，足夠長且可讀，能補充為什麼同一結論不能脫離時間條件單獨理解。'] },
        { title: '下一步行动', paragraphs: ['完整公開內容段落七，足夠長且可讀，能自然承接到個人測算，而不是只停留在公共知識理解。', '完整公開內容段落八，足夠長且可讀，能幫助使用者把閱讀結果轉成自己的下一步判斷。'] },
      ],
      meta: {
        growthPlanKey: 'taiwan-report-reading',
        market: '台灣用戶',
        locale: 'zh-TW',
        sourceType: 'public-growth',
      },
    });

    const fallbackAssessment = assessPublicGrowthPublication(fallbackDraft);
    const llmAssessment = assessPublicGrowthPublication(llmDraft);

    expect(fallbackAssessment.ready).toBe(false);
    expect(fallbackAssessment.reasons).toContain('fallback-source');
    expect(llmAssessment.ready).toBe(true);
    expect(llmAssessment.reasons).toContain('llm-generated');
  });

  test('allows wave2 drafts to use the same publication gate with stricter section depth checks', () => {
    const wave2Draft = buildEntry({
      contentType: 'case',
      status: 'draft',
      source: 'agent-llm:public-growth-wave2:public-growth-wave2',
      title: 'AI时代职场替代焦虑持续放大的原因及普通人优先判断的核心变量',
      excerpt: '这是一篇面向城市职场用户的完整案例稿，能把AI替代焦虑、节奏错配和职业决策窗口讲清楚，并自然衔接到个人分析。',
      seoTitle: 'AI时代职场替代焦虑与职业判断核心变量完整指南',
      seoDescription: '围绕AI时代职场替代焦虑，拆解普通职场人最该优先判断的变量、常见误区与下一步行动路径。',
      tags: ['AI焦虑', '职业决策', '职场替代', '时间窗口'],
      sections: [
        { title: '焦虑来源', paragraphs: ['这是完整的第一段案例内容，长度足够且可公开发布，能够解释AI替代焦虑为何会在现实工作中持续放大。', '这是完整的第二段案例内容，长度足够且可公开发布，能够把焦虑背后的结构性压力讲清楚。'] },
        { title: '关键变量', paragraphs: ['这是完整的第三段案例内容，长度足够且可公开发布，能够说明普通职场人最该优先判断的核心变量是什么。', '这是完整的第四段案例内容，长度足够且可公开发布，能够把方向、时机和代价放在同一框架里解释。'] },
        { title: '常见误区', paragraphs: ['这是完整的第五段案例内容，长度足够且可公开发布，能够指出最容易导致误判的思维方式和行动路径。', '这是完整的第六段案例内容，长度足够且可公开发布，能够补足用户最容易忽略的现实条件差异。'] },
        { title: '行动路径', paragraphs: ['这是完整的第七段案例内容，长度足够且可公开发布，能够把案例理解自然转成下一步行动。', '这是完整的第八段案例内容，长度足够且可公开发布，能够帮助用户从公共案例进入个人判断。'] },
      ],
      meta: {
        growthPlanKey: 'ai-workplace-anxiety',
        market: '城市职场用户',
        locale: 'zh-CN',
        sourceType: 'public-growth-wave2',
      },
    });

    const assessment = assessGrowthPublication(wave2Draft, 'public-growth-wave2');

    expect(assessment.ready).toBe(true);
    expect(assessment.reasons).toContain('section-depth');
  });

  test('counts promoted fallback knowledge entries as published growth coverage', () => {
    const audit = buildPublicGrowthAudit([
      buildEntry({
        slug: 'diaspora-relocation-published',
        title: '海外华人换城市与迁移风险窗口的深度解读',
        source: 'agent-fallback:public-growth:public-growth',
        status: 'published',
        meta: {
          growthPlanKey: 'diaspora-relocation-risk-window',
          market: '海外华人迁移与换城市用户',
          locale: 'zh-US',
          sourceType: 'public-growth',
          publicationReady: true,
        },
      }),
    ]);

    const target = audit.coverage.find((item) => item.target.key === 'diaspora-relocation-risk-window');

    expect(target?.publishedCount).toBe(1);
    expect(target?.missing).toBe(false);
  });
});
