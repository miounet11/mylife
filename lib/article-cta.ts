export type ArticleContentType = 'knowledge' | 'case' | 'insight';

export interface ArticleCtaCopy {
  inline: {
    headline: string;
    subline: string;
    button: string;
  };
  sticky: {
    headline: string;
    button: string;
  };
}

export const ARTICLE_CTA_COPY: Record<ArticleContentType, ArticleCtaCopy> = {
  knowledge: {
    inline: {
      headline: '你是不是也这样？',
      subline: '30 秒拿到属于你的判断',
      button: '现在测一下',
    },
    sticky: { headline: '想知道你自己的版本？', button: '开始测算' },
  },
  case: {
    inline: {
      headline: '你的命局是这种结构吗？',
      subline: '30 秒看你的真实版本',
      button: '看我的判断',
    },
    sticky: { headline: '看你自己的命局判断', button: '现在开始' },
  },
  insight: {
    inline: {
      headline: '这个洞察对你成立吗？',
      subline: '30 秒检验一下你自己',
      button: '验证一下',
    },
    sticky: { headline: '检验是否对你成立', button: '开始测算' },
  },
};

export interface ArticleSection {
  content?: string;
  meta?: { inlineCtaSuppressed?: boolean };
}

export interface InjectionPoint {
  injectAfterIndex: number;
}

const MIN_SECTIONS = 4;
const MIN_TOTAL_CHARS = 800;

export function findInjectionPoint(
  sections: ArticleSection[] | undefined | null
): InjectionPoint {
  if (!sections || sections.length < MIN_SECTIONS) {
    return { injectAfterIndex: -1 };
  }

  if (sections.some((s) => s?.meta?.inlineCtaSuppressed === true)) {
    return { injectAfterIndex: -1 };
  }

  const totalChars = sections.reduce((acc, s) => acc + (s?.content?.length || 0), 0);
  if (totalChars < MIN_TOTAL_CHARS) {
    return { injectAfterIndex: -1 };
  }

  return { injectAfterIndex: 2 };
}

export function isArticleCtaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 === '1';
}
