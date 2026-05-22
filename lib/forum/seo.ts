// v5-D61 论坛 SEO/视图辅助

import { CATEGORIES, INDUSTRIES, PRIVACY_MODES, SEO_KEYWORDS } from './templates';
import type { ForumQuestionRecord, ForumAnswerRecord } from './types';

export const FORUM_BASE = '/community';
export const FORUM_LABEL = '世界易学说社区';

export function getCategoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

export function getIndustryLabel(key: string): string {
  return INDUSTRIES.find((i) => i.key === key)?.label || key;
}

export function getPrivacyLabel(key: string): string {
  return PRIVACY_MODES.find((p) => p.key === key)?.label || key;
}

export function getCategorySeo(key: string): string[] {
  return SEO_KEYWORDS[key] || [];
}

// 从问题构造 QAPage schema.org
export function buildQAPageJsonLd(question: ForumQuestionRecord, answers: ForumAnswerRecord[], baseUrl = 'https://www.life-kline.com') {
  const acceptedAnswer = answers.find((a) => a.isOfficial) || answers[0];
  const suggestedAnswers = answers.filter((a) => a !== acceptedAnswer);
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question.title,
      text: question.body,
      datePublished: question.publishedAt,
      author: { '@type': 'Person', name: 'Anonymous' },
      answerCount: answers.length,
      acceptedAnswer: acceptedAnswer
        ? {
            '@type': 'Answer',
            text: acceptedAnswer.body,
            datePublished: acceptedAnswer.publishedAt,
            upvoteCount: acceptedAnswer.upvoteCount,
            url: `${baseUrl}${FORUM_BASE}/${question.slug}#a-${acceptedAnswer.id}`,
            author: { '@type': 'Organization', name: '世界易学说官方' },
          }
        : undefined,
      suggestedAnswer: suggestedAnswers.map((a) => ({
        '@type': 'Answer',
        text: a.body,
        datePublished: a.publishedAt,
        upvoteCount: a.upvoteCount,
        url: `${baseUrl}${FORUM_BASE}/${question.slug}#a-${a.id}`,
      })),
    },
  };
}

export function buildBreadcrumbJsonLd(question: ForumQuestionRecord, baseUrl = 'https://www.life-kline.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: FORUM_LABEL, item: `${baseUrl}${FORUM_BASE}` },
      {
        '@type': 'ListItem', position: 3, name: getCategoryLabel(question.category),
        item: `${baseUrl}${FORUM_BASE}/category/${question.category}`,
      },
      { '@type': 'ListItem', position: 4, name: question.title, item: `${baseUrl}${FORUM_BASE}/${question.slug}` },
    ],
  };
}

export function describeQuestion(q: ForumQuestionRecord): string {
  const cat = getCategoryLabel(q.category);
  const ind = getIndustryLabel(q.industry);
  const tag = q.tags.slice(0, 3).join('、');
  return `${cat} 主题，行业：${ind}，关键词：${tag}。`;
}
