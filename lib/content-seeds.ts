import {
  buildDimensionKnowledgeArticles,
  buildFoundationKnowledgeArticles,
  buildGeoInsightArticles,
  buildRichSections,
  buildSeoPillarArticles,
} from '@/lib/content-enrichment';
import { LEARNING_TRACKS } from '@/lib/learning-tracks';
import type { ManagedContentEntry, ManagedContentType } from '@/lib/content-store';

export type ContentArticle = {
  slug: string;
  type: ManagedContentType;
  title: string;
  summary: string;
  trackKey: string;
  readMinutes?: number;
  insightType?: string;
  sections: Array<[string, string]>;
  keywords?: string[];
};

function collectFromTracks(): ContentArticle[] {
  const articles: ContentArticle[] = [];
  const seen = new Set<string>();

  for (const track of LEARNING_TRACKS) {
    for (const step of track.steps) {
      if (!step.slug) continue;
      if (step.kind !== 'knowledge' && step.kind !== 'case' && step.kind !== 'insight') continue;
      if (seen.has(step.slug)) continue;
      seen.add(step.slug);

      const type: ManagedContentType =
        step.kind === 'case' ? 'case' : step.kind === 'insight' ? 'insight' : 'knowledge';

      const insightType =
        step.kind === 'insight' && step.href.startsWith('/insights/city/')
          ? 'city'
          : step.kind === 'insight' && step.href.startsWith('/insights/')
            ? 'topic'
            : undefined;

      articles.push({
        slug: step.slug,
        type,
        title: step.label,
        summary: `${track.subtitle} · ${track.description}`,
        trackKey: track.key,
        readMinutes: step.readMinutes || 7,
        insightType,
        keywords: [track.title, step.label, '世界易', '人生K线'],
        sections: buildRichSections({
          title: step.label,
          trackTitle: track.title,
          angle: step.label,
          dimensionTitle:
            track.key === 'career'
              ? '工作行业'
              : track.key === 'wealth'
                ? '投资理财'
                : track.key === 'relationship'
                  ? '谈婚论嫁'
                  : track.key === 'health'
                    ? '身体健康'
                    : track.key === 'migration'
                      ? '居家环境'
                      : '运势节奏',
        }),
      });
    }
  }

  const extras: ContentArticle[] = [
    {
      slug: 'world-yi-toronto',
      type: 'insight',
      title: '城市观察：多伦多',
      summary: '迁移轨 · 北美东岸华人社区的成本结构与节奏差异。',
      trackKey: 'migration',
      readMinutes: 6,
      insightType: 'city',
      keywords: ['多伦多', '海外华人', '迁移', 'GEO'],
      sections: buildRichSections({
        title: '多伦多城市观察',
        trackTitle: '迁移轨',
        geoCity: '多伦多',
        dimensionTitle: '居家环境',
      }),
    },
    {
      slug: 'world-yi-singapore',
      type: 'insight',
      title: '城市观察：新加坡',
      summary: '迁移轨 · 高密度城市环境下的角色压缩与节奏。',
      trackKey: 'migration',
      readMinutes: 6,
      insightType: 'city',
      keywords: ['新加坡', '海外华人', '迁移', 'GEO'],
      sections: buildRichSections({
        title: '新加坡城市观察',
        trackTitle: '迁移轨',
        geoCity: '新加坡',
        dimensionTitle: '居家环境',
      }),
    },
    {
      slug: 'world-yi-vancouver',
      type: 'insight',
      title: '城市观察：温哥华',
      summary: '迁移轨 · 西岸华人社区的生活节奏与家庭排序。',
      trackKey: 'migration',
      readMinutes: 6,
      insightType: 'city',
      keywords: ['温哥华', '海外华人', '迁移', 'GEO'],
      sections: buildRichSections({
        title: '温哥华城市观察',
        trackTitle: '迁移轨',
        geoCity: '温哥华',
        dimensionTitle: '居家环境',
      }),
    },
    ...buildFoundationKnowledgeArticles(),
    ...buildDimensionKnowledgeArticles(),
    ...buildGeoInsightArticles(),
    ...buildSeoPillarArticles(),
  ];

  for (const item of extras) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      articles.push(item);
    }
  }

  return articles;
}

export const CONTENT_ARTICLES: ContentArticle[] = collectFromTracks();

export const CONTENT_BY_SLUG = new Map(CONTENT_ARTICLES.map((item) => [item.slug, item]));

export function toManagedEntry(article: ContentArticle): ManagedContentEntry {
  return {
    id: article.slug,
    type: article.type,
    title: article.title,
    slug: article.slug,
    status: 'published',
    source: 'world-yi',
  };
}
