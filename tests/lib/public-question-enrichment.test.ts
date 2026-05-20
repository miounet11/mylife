import {
  injectKnowledgeLinks,
  shapeAnswerMarkdown,
  extractPublicQuestionStructure,
} from '@/lib/public-question-enrichment';

describe('injectKnowledgeLinks', () => {
  it('only links first occurrence of a term', () => {
    const out = injectKnowledgeLinks('真太阳时很重要，再说真太阳时一次。');
    // 第一次必须被链接
    expect(out).toMatch(/\[真太阳时\]\(\/knowledge\/true-solar-time-guide\)/);
    // 第二次保持纯文本（整段中只出现一次 knowledge 链接）
    const linkCount = (out.match(/\]\(\/knowledge\/true-solar-time-guide\)/g) || []).length;
    expect(linkCount).toBe(1);
    // 原文中第二个"真太阳时"仍然保留
    expect(out.lastIndexOf('真太阳时')).toBeGreaterThan(out.indexOf(']('));
  });

  it('returns empty string for empty input', () => {
    expect(injectKnowledgeLinks('')).toBe('');
  });

  it('does not break already-linked text', () => {
    const out = injectKnowledgeLinks('看 [真太阳时](/foo) 介绍');
    // 已被中括号包裹的前后不该再插一个 [..](..)
    const matches = out.match(/\[真太阳时\]/g) || [];
    expect(matches.length).toBe(1);
  });
});

describe('shapeAnswerMarkdown', () => {
  it('breaks key transitional words into new paragraphs with bold', () => {
    const input =
      '你的命局结构是正印格。判断依据是：用神为木火。当前阶段建议：稳中求进。风险提醒：2026年7月忌神显现。';
    const out = shapeAnswerMarkdown(input);
    expect(out).toContain('**判断依据是**：');
    expect(out).toContain('**当前阶段建议**：');
    expect(out).toContain('**风险提醒**：');
  });

  it('bolds time windows', () => {
    const out = shapeAnswerMarkdown('建议在2026年5月推进，7月底观望。');
    expect(out).toContain('**2026年5月**');
    expect(out).toContain('**7月底**');
  });

  it('bolds 围绕XX版', () => {
    const out = shapeAnswerMarkdown('围绕事业版做规划。');
    expect(out).toContain('**围绕事业版**');
  });
});

describe('extractPublicQuestionStructure', () => {
  it('extracts pattern from contextLabel', () => {
    const s = extractPublicQuestionStructure({
      contextLabel: '正印格 · 丁',
      answerText: '',
    });
    expect(s.patternName).toBe('正印格');
  });

  it('extracts daYun from text', () => {
    const s = extractPublicQuestionStructure({
      answerText: '行运处于丙子大运，火水相冲。',
    });
    expect(s.daYun).toBe('丙子大运');
  });

  it('extracts favorable elements via 用神/喜神/顺势重点', () => {
    const s = extractPublicQuestionStructure({
      answerText: '木火为用神喜神。顺势重点：木、火',
    });
    expect(s.favorable).toEqual(expect.arrayContaining(['木', '火']));
  });

  it('extracts unfavorable elements via 忌神/防', () => {
    const s = extractPublicQuestionStructure({
      answerText: '7月土旺，忌神显现，防水土克制。',
    });
    expect(s.unfavorable!.length).toBeGreaterThan(0);
  });

  it('extracts time windows up to 4', () => {
    const s = extractPublicQuestionStructure({
      answerText:
        '建议2026年5月推进，6月评估，7月观望，8月调整，9月复盘。',
    });
    expect(s.windows.length).toBeGreaterThan(0);
    expect(s.windows.length).toBeLessThanOrEqual(4);
    expect(s.windows[0].when).toMatch(/月/);
  });

  it('returns empty structure for empty input', () => {
    const s = extractPublicQuestionStructure({});
    expect(s.patternName).toBeUndefined();
    expect(s.windows).toEqual([]);
  });
});
