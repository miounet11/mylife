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
    {
      slug: 'fengshui-industry-wuxing',
      type: 'knowledge',
      title: '商铺风水：行业五行匹配入门',
      summary: '商铺风水轨 · 从五行生克理解行业与商铺匹配的结构性观察。',
      trackKey: 'fengshui',
      readMinutes: 7,
      keywords: ['商铺风水', '行业五行', '五行匹配', '风水'],
      sections: [
        ['行业五行对应关系', '每个行业都有其主导五行属性。餐饮属火，因其以烹饪为核心；金融属金，因其主流通与交易；教育属木，因其主生发与培育；物流属水，因其主流动与转运；建筑属土，因其主承载与稳固。理解行业五行是商铺风水结构化分析的第一步，而非判断吉凶。'],
        ['五行生克与行业匹配', '五行之间存在生克关系：金生水、水生木、木生火、火生土、土生金；金克木、木克土、土克水、水克火、火克金。当商铺经营者的命局五行与行业五行形成相生关系时，经营过程的结构阻力较小；若形成相克关系，则需在色彩、方位、布局层面做结构性补偿。这并非说某行业"不能做"，而是描述匹配过程中的结构特征。'],
        ['行业五行与店门方位的叠加', '行业五行确定后，需与大门方位五行叠加观察。例如餐饮属火，大门朝北（属水）则形成水克火结构，此时可在入口区域引入木元素（绿色植物）做通关缓冲，因为水生木、木生火，形成连续相生路径。这种调整是结构性的环境补偿，不涉及吉凶判断。'],
        ['结构化判断原则', '商铺风水分析遵循"结构化判断，不说吉凶标签"原则。所有观察均围绕五行属性、生克关系、方位匹配展开，输出的是结构性建议而非运势预测。目标是帮助经营者理解环境与行业之间的五行逻辑，从而做出更有依据的布局决策。'],
      ],
    },
    {
      slug: 'fengshui-door-direction',
      type: 'knowledge',
      title: '大门朝向与财运方位的关系',
      summary: '商铺风水轨 · 大门方位五行与商铺经营结构的关系分析。',
      trackKey: 'fengshui',
      readMinutes: 6,
      keywords: ['商铺风水', '大门方位', '方位五行', '风水'],
      sections: [
        ['大门方位的五行属性', '大门是商铺气流进出的主要通道，其朝向对应不同五行。东属木、南属火、西属金、北属水、东南属木、西南属土、西北属金、东北属土。方位五行决定了进入商铺的气的基本属性，这与行业五行形成叠加关系。'],
        ['方位与行业的叠加观察', '当大门方位五行与行业五行相生时，进入的气与行业属性形成协同。例如教育属木，大门朝北（水），水生木，气流入商铺后对行业有生助作用。若大门朝西（金），金克木，则气的属性与行业形成克制，此时可通过门厅色彩或装饰元素做通关处理。这些都是结构性描述，不涉及吉凶。'],
        ['门内动线与气流分布', '大门方位确定后，门内动线决定了气在商铺内部的分布路径。直冲型动线（门直对后墙或后门）使气流过快穿过，不利于停留；回旋型动线使气流缓散分布，适合零售业态。动线设计应结合行业特性：餐饮需要气流集中在用餐区，零售需要气流均匀覆盖货架。这是空间结构与气流逻辑的配合。'],
        ['方位调整的结构化方法', '方位五行若与行业不匹配，可通过以下结构性方法调整：在入口区域放置通关五行元素（如水克火时放木元素缓冲）；调整门厅色彩倾向；设置屏风或绿植改变气流路径。这些方法都是基于五行生克逻辑的结构补偿，而非趋吉避凶的仪式性操作。'],
      ],
    },
    {
      slug: 'fengshui-name-analysis',
      type: 'knowledge',
      title: '店名五行如何影响经营节奏',
      summary: '商铺风水轨 · 店名用字五行与行业五行匹配的结构化分析方法。',
      trackKey: 'fengshui',
      readMinutes: 7,
      keywords: ['商铺风水', '店名五行', '命名', '风水'],
      sections: [
        ['店名用字的五行判定', '中文店名的五行属性来自用字的偏旁部首与字义。带水旁（氵、水）的字属水，带火旁（火、灬）的字属火，带木旁（木）的字属木，带金旁（金、钅）的字属金，带土旁（土）的字属土。此外，字义也可判定五行：与光明、热情相关的字倾向火，与生长、文教相关的字倾向木。店名整体五行是各字五行的综合。'],
        ['店名五行与行业五行的匹配', '店名五行与行业五行形成相生关系时，名称与行业属性一致，有助于品牌识别的结构一致性。例如餐饮属火，店名含木字（木生火）则名称对行业有生助；金融属金，店名含土字（土生金）则名称稳固行业基础。若店名五行克行业五行，并非不可用，但需理解其中的结构张力。'],
        ['店名与经营者命局的关联', '店名五行还可与经营者命局用神做叠加观察。若经营者用神为木，店名以木为主，则名称与个人命局形成协同；若用神为金而店名属火，火克金，则名称与个人结构存在张力。这种分析是结构化的五行匹配观察，不涉及"改名就能转运"的因果判断。'],
        ['结构化命名建议原则', '商铺命名建议遵循：第一，行业五行优先，店名五行尽量与行业相生或同类；第二，兼顾经营者用神方向；第三，避免店名五行直接克行业五行。这些建议基于五行生克的结构逻辑，旨在让名称与经营形成五行层面的一致性，而非追求吉利的字面含义。'],
      ],
    },
    {
      slug: 'fengshui-color-scheme',
      type: 'knowledge',
      title: '色彩搭配与五行生克',
      summary: '商铺风水轨 · 用五行理解门店主色、辅色与材质质感的结构搭配。',
      trackKey: 'fengshui',
      readMinutes: 6,
      keywords: ['商铺风水', '色彩五行', '装修配色', '风水'],
      sections: [
        ['色彩的五行归属', '色彩可按五行粗分：绿/青偏木，红/橙/紫偏火，黄/棕/米色偏土，白/灰/金属色偏金，黑/深蓝偏水。同色系深浅仍可归同一五行，关键看主色占比与第一眼门面。'],
        ['主色与行业的生克', '主色宜与行业五行相生或同类，减少入口第一眼的结构张力。例如餐饮属火，木色（绿植、木纹）可生火；金融属金，土色或金属质感可助金。若主色直接克行业五行，可用辅色做通关，而不是立刻全盘推翻。'],
        ['辅色、材质与层次', '辅色占 20–30% 时可做生克缓冲：水克火时加木色/木质；金克木时加水色/曲面玻璃。材质同样带五行：木饰面属木，石材陶土属土，金属五金属金，玻璃镜面偏水，灯光暖色偏火。'],
        ['结构化配色原则', '先定行业五行，再定门面主色，再补辅色与材质。输出应是“结构是否顺畅、哪里可缓冲”，而不是“这色大吉/大凶”。商铺风水模拟器的色彩维度即按此逻辑打分与给建议。'],
      ],
    },
    {
      slug: 'fengshui-timing-window',
      type: 'knowledge',
      title: '开业择时的命理逻辑',
      summary: '商铺风水轨 · 把开业日期读成节气与五行节奏窗口，而非吉日黄历标签。',
      trackKey: 'fengshui',
      readMinutes: 7,
      keywords: ['商铺风水', '开业择时', '节气', '流日'],
      sections: [
        ['择时服务动作，不服务迷信', '开业日期是经营节奏的启动点。结构化择时看的是：当月节气阶段是否利于“启动/扩张/收敛”，当日五行与行业是否相生，以及你是否预留了备选窗口——而不是单日“黄道吉日”口号。'],
        ['节气与行业节奏', '生发季（春木）更利于教育、文创、需要引流获客的业态；炎热季（夏火）利于餐饮、展示型零售；收敛季（秋金）利于金融、合同与清算类；冬藏（冬水）利于仓储物流与系统建设。这是季节与行业的结构对应，不是吉凶裁定。'],
        ['流日五行与行业叠加', '开业日可粗看日干五行与行业五行是否相生。相生或同类则启动摩擦较小；相克则建议把“重仪式开业”改到缓冲日，或先软开业再正式揭幕。模拟器在填写开业日期后会给出窗口说明与备选建议。'],
        ['可执行的择时步骤', '① 先定开业前 14–30 天的装修/备货完成线；② 在业务可接受范围内选 2–3 个候选日；③ 用行业五行与节气过滤；④ 选定主日 + 备用日。目标是降低启动混乱，而不是追求唯一神日。'],
      ],
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
