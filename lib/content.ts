import {
  worldYiCaseStudies,
  worldYiEntityInsights,
  worldYiKnowledgeArticles,
} from '@/lib/world-yi';

export interface ContentSection {
  title: string;
  paragraphs: string[];
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  excerpt: string;
  scenario: string;
  tags: string[];
  featured?: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
}

export interface EntityInsight {
  type: 'industry' | 'city' | 'company';
  slug: string;
  name: string;
  title: string;
  excerpt: string;
  featured?: boolean;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
}

export type EntityInsightType = EntityInsight['type'];

export const entityTypeLabels: Record<EntityInsightType, string> = {
  industry: '行业洞察',
  city: '城市洞察',
  company: '组织洞察',
};

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    slug: 'true-solar-time-guide',
    title: '真太阳时为什么会直接影响命盘结果',
    excerpt: '很多站点只按钟表时间排盘，但真正影响时柱判断的是当地真太阳时。这篇文章解释为什么它不能被省略。',
    category: '基础认知',
    readTime: '6 分钟',
    tags: ['真太阳时', '排盘', '时柱'],
    featured: true,
    seoTitle: '真太阳时排盘指南：为什么真太阳时会影响八字结果',
    seoDescription: '系统讲清真太阳时、经纬度修正、时柱边界与命盘误差，帮助用户理解为什么精准排盘离不开真太阳时。',
    sections: [
      {
        title: '为什么普通时间不够',
        paragraphs: [
          '钟表时间是行政时区下的统一时间，但命理排盘本质上要尽可能接近出生地当时的天文时间。两个经度差异很大的城市即便处在同一时区，太阳过中天的实际时刻也会不同。',
          '如果直接拿钟表时间排盘，最容易出错的就是时柱和节气边界附近的判断。对于本就接近换时辰、换节气的人，这种误差足以让结果出现方向性变化。'
        ]
      },
      {
        title: '真太阳时修正解决什么问题',
        paragraphs: [
          '真太阳时会结合经度与均时差，把出生记录尽量还原到当地的太阳时间。这不是为了复杂化，而是为了把排盘输入从“行政记录”修正到“天文近似真实”。',
          '对用户来说，这意味着系统不仅给出结果，还会解释为什么这个时间才是实际用于排盘的依据，从而建立信任。'
        ]
      },
      {
        title: '站点应该如何表达这个能力',
        paragraphs: [
          '首页只需要让用户知道系统会进行真太阳时修正，不必在首页展开所有细节。真正的说明应该集中在分析页和结果页中，让用户在关键时刻看到这项能力的价值。',
          '最好的方式不是用术语堆砌，而是直接展示“你输入的时间”和“系统实际采用的时间”之间的对应关系。'
        ]
      }
    ]
  },
  {
    slug: 'how-to-read-bazi-report',
    title: '普通用户如何读懂一份八字分析报告',
    excerpt: '不是每个人都需要会背术语，但都需要知道一份报告里哪些部分最值得看、最该相信、最适合转化为行动。',
    category: '结果解读',
    readTime: '8 分钟',
    tags: ['报告', '命盘', '建议'],
    featured: true,
    seoTitle: '如何读懂八字报告：从命盘结构到行动建议',
    seoDescription: '这篇文章帮助普通用户快速读懂八字分析报告，明确总览、命盘、五行、建议、趋势各部分的阅读优先级。',
    sections: [
      {
        title: '先看总览，不要先钻术语',
        paragraphs: [
          '一份好的结果页应该先给出最重要的结构结论，例如日主、格局、当前大运、流年提示。普通用户先建立全局认识，再往下看命盘和五行，效率更高。',
          '如果一个系统一上来就把大量术语堆在用户面前，用户不是学不会，而是没有路径感。'
        ]
      },
      {
        title: '五行和建议的关系最重要',
        paragraphs: [
          '五行强弱本身不是终点，真正有价值的是它如何影响决策节奏、职业适配、关系互动和风险控制。',
          '因此结果页里最值得反复看的部分，往往是“结构结论 + 分维建议 + 趋势图”的组合，而不是单个术语本身。'
        ]
      },
      {
        title: '把结果转成后续动作',
        paragraphs: [
          '如果用户看完报告后没有下一步动作，价值就停在阅读层。好的产品应该引导用户去咨询、记录关键事件、回看历史趋势，而不是让报告变成一次性消费品。',
          '所以公开结果页本身就应该承接分享、咨询和长期复访。'
        ]
      }
    ]
  },
  {
    slug: 'career-decision-with-bazi',
    title: '用命理报告辅助职业决策时，最常见的三个误区',
    excerpt: '命理不是替代决策，而是帮助用户在高风险节点减少误判。职业分析尤其需要避免“绝对化结论”。',
    category: '决策应用',
    readTime: '7 分钟',
    tags: ['事业', '决策', '风险'],
    seoTitle: '命理如何辅助职业决策：避免三大常见误区',
    seoDescription: '从职业选择、换岗时机和风险判断出发，解释命理结果如何成为辅助决策工具而不是替代思考。',
    sections: [
      {
        title: '误区一：把命理当成唯一答案',
        paragraphs: [
          '职业选择永远要同时看现实能力、市场环境和个人资源。命理的价值在于帮助你理解哪些节奏更适合主动推进，哪些阶段更需要稳住，而不是替你做所有决定。',
          '如果系统把命理说成百分之百的确定答案，往往不可信。'
        ]
      },
      {
        title: '误区二：只看结果，不看时间窗口',
        paragraphs: [
          '很多决策不是“能不能做”，而是“什么时候做更合适”。因此报告里的趋势图、流年提示和当前大运解释，往往比一个静态标签更重要。',
          '把时间窗口落到事件日历里，才是把报告真正用起来。'
        ]
      },
      {
        title: '误区三：忽略复盘',
        paragraphs: [
          '一份职业相关的命理结论，只有在现实事件中反复验证，才会逐渐形成个人有效模型。也正因为如此，长期档案、事件记录和 AI 追问必须打通。',
          '站点要做长期价值，就不能只做一次排盘。'
        ]
      }
    ]
  },
  {
    slug: 'public-report-seo-strategy',
    title: '为什么命理站点需要公开结果页，而不只是工具页',
    excerpt: '工具页负责转化，公开结果页负责传播。两者分工清楚，站点才有长期增长的可能。',
    category: '产品策略',
    readTime: '5 分钟',
    tags: ['SEO', '公开结果页', '传播'],
    seoTitle: '公开结果页的价值：命理站点如何兼顾 SEO 与转化',
    seoDescription: '解释命理产品为什么需要把结果页做成可传播、可索引、可承接的公共页面，而不是只做分析工具。',
    sections: [
      {
        title: '工具页的天花板',
        paragraphs: [
          '只有工具页的网站，流量大多来自“当下想测一次”的用户。用户做完分析就离开，站点很难形成内容资产，也难以获得持续的搜索流量。',
          '这类结构最常见的问题就是转化和传播分离，用户没有可分享内容。'
        ]
      },
      {
        title: '公开结果页的作用',
        paragraphs: [
          '公开结果页可以成为内容资产。它既能沉淀真实分析页面，又能通过匿名化、可分享和结构化内容，让用户愿意传播。',
          '对搜索引擎来说，这类页面比纯工具入口更容易形成可索引的内容层。'
        ]
      },
      {
        title: '首页应该克制，结果页应该完整',
        paragraphs: [
          '首页如果提前说太多细节，用户既看不懂，也不容易形成期待。首页应该只负责建立信任和引导进入。',
          '真正的结构、图表、建议和可执行内容，应该集中在结果页和知识内容页中释放。'
        ]
      }
    ]
  }
  ,
  ...worldYiKnowledgeArticles
];

export const caseStudies: CaseStudy[] = [
  {
    slug: 'gaokao-path-case',
    title: '案例：把升学焦虑转成可执行的时间与方向判断',
    excerpt: '一个典型的升学场景里，用户真正需要的不是玄乎的结论，而是对节奏、方向和风险的更清晰判断。',
    scenario: '升学与高考',
    tags: ['高考', '升学', '案例'],
    featured: true,
    seoTitle: '高考升学命理案例：如何把焦虑转成方向判断',
    seoDescription: '真实场景化地解释命理报告如何辅助升学选择、节奏把握和风险控制。',
    sections: [
      {
        title: '用户问题',
        paragraphs: [
          '用户并不是单纯想知道“结果好不好”，而是想确认自己当前适合冲刺、保守还是调整方向。',
          '在这种场景下，报告里最有价值的是趋势判断和行动建议，而不是单纯吉凶。'
        ]
      },
      {
        title: '产品应该怎么承接',
        paragraphs: [
          '分析页要让用户更安心提交信息；结果页要把复杂结论压缩成少量关键判断；案例页则要帮助新用户理解这个产品到底解决什么问题。',
          '案例本身也是非常强的 SEO 和转化素材。'
        ]
      }
    ]
  },
  {
    slug: 'career-switch-case',
    title: '案例：换岗前，用户真正关心的是时机，而不是标签',
    excerpt: '职业场景里，用户最需要的是判断“现在推进还是先稳住”，这正是报告页和事件管理页协同的地方。',
    scenario: '职业转岗',
    tags: ['事业', '案例', '时间窗口'],
    featured: true,
    seoTitle: '职业转岗命理案例：为什么时间窗口比标签更重要',
    seoDescription: '用实际产品视角解释换岗、跳槽与职业决策场景下，命理报告怎样发挥辅助决策作用。',
    sections: [
      {
        title: '不是问命，是问节奏',
        paragraphs: [
          '用户在职业节点上最常见的问题不是“我适不适合这个岗位”，而是“这个时间推进会不会代价过高”。',
          '因此报告里的流年解释、趋势图和事件记录会比静态标签更有价值。'
        ]
      },
      {
        title: '为什么案例页值得做',
        paragraphs: [
          '案例页能把抽象价值翻译成现实情境，让未转化用户迅速明白产品解决什么问题。',
          '这类内容比营销文案更容易建立信任，也更适合积累长期搜索流量。'
        ]
      }
    ]
  },
  {
    slug: 'relationship-window-case',
    title: '案例：关系判断不是算“会不会”，而是看“何时更稳”',
    excerpt: '婚恋和关系场景里，用户真正想知道的是互动节奏和风险窗口，而不是神化的确定答案。',
    scenario: '婚恋关系',
    tags: ['婚恋', '关系', '案例'],
    seoTitle: '婚恋关系命理案例：如何用时间窗口理解关系节奏',
    seoDescription: '从关系推进和互动风险出发，解释命理结果如何被转成更现实、更稳妥的行动建议。',
    sections: [
      {
        title: '用户需求并不神秘',
        paragraphs: [
          '大多数用户在关系场景里并不是想听一个绝对答案，而是想判断当下的推进风险、沟通方式和时间窗口。',
          '命理产品如果能把这一点说清楚，就会比纯情绪安慰更有价值。'
        ]
      },
      {
        title: '公开结果页和结构追问的配合',
        paragraphs: [
          '关系话题往往需要在看完报告后继续追问，因此公开结果页和结构追问必须是一条连续路径。',
          '这也是为什么结果页不能只是终点，而要是后续互动的入口。'
        ]
      }
    ]
  }
  ,
  ...worldYiCaseStudies
];

export const entityInsights: EntityInsight[] = [
  {
    type: 'industry',
    slug: 'ai-product-manager',
    name: 'AI 产品经理',
    title: 'AI 产品经理这类岗位，命理报告最适合回答什么问题',
    excerpt: '不是简单判断“适不适合”，而是看个体更适合承担整合、推进、表达还是结构化决策类角色。',
    featured: true,
    tags: ['行业', 'AI', '职业匹配'],
    seoTitle: 'AI 产品经理命理分析：如何判断职业匹配与发展节奏',
    seoDescription: '从职业分工、能力节奏和风险判断角度，解释 AI 产品经理这类岗位为何适合用命理报告辅助决策。',
    sections: [
      {
        title: '为什么行业页值得做',
        paragraphs: [
          '行业页不是为了给所有人一个统一答案，而是为了帮助用户理解某类职业最常对应哪些能力结构、节奏偏好和风险类型。',
          '对搜索引擎来说，这类页面也比单纯工具页更像长期内容资产。'
        ]
      },
      {
        title: 'AI 产品岗位最关心的不是吉凶',
        paragraphs: [
          '用户真正关心的是自己更适合做跨团队整合、需求表达、复杂协调，还是更适合深钻模型、技术或运营。',
          '因此命理产品应该把结果翻译成“工作方式与节奏适配”，而不是抽象标签。'
        ]
      }
    ]
  },
  {
    type: 'industry',
    slug: 'finance-investment',
    name: '金融投资',
    title: '金融投资行业为什么更需要看风险节奏，而不是单点判断',
    excerpt: '高波动行业里，命理产品最有价值的地方不是说“能不能做”，而是辅助看“什么时候该放大、什么时候该收缩”。',
    tags: ['行业', '金融', '风险'],
    seoTitle: '金融投资行业命理分析：如何理解风险节奏与决策窗口',
    seoDescription: '围绕高波动行业的节奏控制、风险暴露和行动窗口，解释命理分析在金融投资场景中的真实价值。',
    sections: [
      {
        title: '行业的核心变量是波动',
        paragraphs: [
          '金融投资场景里，用户面对的不是单一事件，而是持续波动。因此比起静态判断，更重要的是阶段趋势、风险窗口与节奏控制。',
          '这也是为什么结果页里的趋势图和事件记录，对这类人群更关键。'
        ]
      },
      {
        title: '产品如何表达价值',
        paragraphs: [
          '最好的方式不是“神化命中率”，而是明确告诉用户：报告能辅助识别什么时候更适合主动进攻，什么时候应该控制暴露。',
          '这种表达更稳，也更容易获得高质量用户的信任。'
        ]
      }
    ]
  },
  {
    type: 'city',
    slug: 'shanghai',
    name: '上海',
    title: '为什么像上海这样的城市，会让真太阳时修正更值得被强调',
    excerpt: '城市页不是旅游介绍，而是把地理位置、节奏环境和用户常见决策场景结合起来，增强内容的现实感。',
    featured: true,
    tags: ['城市', '真太阳时', '节奏'],
    seoTitle: '上海真太阳时排盘说明：地理位置如何影响命理分析表达',
    seoDescription: '以上海为例，解释城市地理位置、时间修正和用户决策场景如何结合成更可信的命理内容页。',
    sections: [
      {
        title: '城市页的作用',
        paragraphs: [
          '城市页能把“出生地影响排盘”这件事说得更具体。用户会更容易理解为什么地点不是随便填的输入项。',
          '这类内容既能补充认知，也能服务搜索流量。'
        ]
      },
      {
        title: '为什么城市与节奏感有关',
        paragraphs: [
          '很多用户并不是为了研究天文时间，而是希望知道自己的生活节奏、工作环境和决策风格是否匹配当前所处城市。',
          '因此城市页可以连接出生地、发展环境与职业场景，而不仅是地理名词。'
        ]
      }
    ]
  },
  {
    type: 'city',
    slug: 'shenzhen',
    name: '深圳',
    title: '深圳这类高节奏城市，为什么更适合做决策型命理内容',
    excerpt: '高节奏城市里的用户，通常更关注时机、机会成本和推进节奏，这恰好是结果页最擅长承接的部分。',
    tags: ['城市', '决策', '职业'],
    seoTitle: '深圳命理内容页：高节奏城市为什么更需要决策型命理解读',
    seoDescription: '从高节奏职业环境与个人决策成本出发，解释深圳用户为何更适合使用结果页和趋势页做辅助判断。',
    sections: [
      {
        title: '高节奏环境会放大决策成本',
        paragraphs: [
          '当环境变化快时，用户更容易焦虑，也更容易做出过快或过慢的决策。命理内容在这里的价值，是提供更稳定的节奏视角。',
          '城市页可以帮助用户把“个体命理”与“环境节奏”联系起来。'
        ]
      },
      {
        title: '为什么这类页适合长期做',
        paragraphs: [
          '因为它天然连接搜索、内容和真实场景。相比纯营销文案，这类页更容易形成持续流量和高相关用户。',
          '这类内容也非常适合后续扩充为城市专题库。'
        ]
      }
    ]
  },
  {
    type: 'company',
    slug: 'bytedance-career-fit',
    name: '字节类岗位适配',
    title: '像字节这样的高压快节奏组织，适合什么样的命理节奏结构',
    excerpt: '公司页不是对公司做命理，而是把“组织节奏”和“个体节奏”放在同一张分析框架里。',
    featured: true,
    tags: ['公司', '职业', '组织节奏'],
    seoTitle: '高压快节奏公司岗位适配：如何用命理理解组织节奏与个体匹配',
    seoDescription: '围绕高强度组织环境，分析什么样的个体节奏更容易适配、什么样的人更需要稳住推进节奏。',
    sections: [
      {
        title: '公司页为什么有价值',
        paragraphs: [
          '很多用户并不只是问行业，而是在问某类典型组织环境是否适合自己。这种问题非常适合通过公司型内容页承接。',
          '它不是评价公司本身，而是帮助用户理解组织节奏与自身结构是否匹配。'
        ]
      },
      {
        title: '高压组织看的是承压节奏',
        paragraphs: [
          '这类组织更强调迭代、反馈和高频切换。对用户来说，最关键的不是“能不能进”，而是进入之后会不会长期消耗过大。',
          '好的内容页会把这种问题翻译成节奏、推进方式和风险承受力。'
        ]
      }
    ]
  },
  {
    type: 'company',
    slug: 'state-owned-enterprise-fit',
    name: '国企节奏适配',
    title: '稳定型组织环境下，命理分析更适合回答哪些问题',
    excerpt: '相较高压快节奏公司，稳定型组织里用户更常问的是长期发展、关系结构和节奏匹配。',
    tags: ['公司', '稳定节奏', '职业路径'],
    seoTitle: '稳定型组织命理分析：如何理解长期发展与节奏适配',
    seoDescription: '从组织稳定性、长期路径与关系结构出发，解释命理分析在稳定型职业环境中的应用方式。',
    sections: [
      {
        title: '稳定环境里的问题不同',
        paragraphs: [
          '在更稳定的组织环境里，用户未必最担心短期波动，而是更关心长期上升空间、节奏是否舒展、关系协作是否合适。',
          '所以结果页和案例页里的建议表达也应该跟着变。'
        ]
      },
      {
        title: '内容站为什么要做这种页',
        paragraphs: [
          '因为这类页能承接非常具体的搜索意图，同时不会把站点做成低质量关键词堆砌。',
          '只要内容足够真实、克制、结构清楚，就会长期有价值。'
        ]
      }
    ]
  }
  ,
  ...worldYiEntityInsights
];

export function getKnowledgeArticleBySlug(slug: string) {
  return knowledgeArticles.find((item) => item.slug === slug) || null;
}

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((item) => item.slug === slug) || null;
}

export function getFeaturedKnowledgeArticles(limit = 3) {
  return knowledgeArticles.filter((item) => item.featured).slice(0, limit);
}

export function getFeaturedCaseStudies(limit = 2) {
  return caseStudies.filter((item) => item.featured).slice(0, limit);
}

export function getEntityInsightByTypeAndSlug(type: string, slug: string) {
  return entityInsights.find((item) => item.type === type && item.slug === slug) || null;
}

export function getFeaturedEntityInsights(limit = 3) {
  return entityInsights.filter((item) => item.featured).slice(0, limit);
}

export function getEntityInsightsByType(type: EntityInsightType) {
  return entityInsights.filter((item) => item.type === type);
}

export function getEntityInsightTypes() {
  return Object.keys(entityTypeLabels) as EntityInsightType[];
}

export function getEntityTypeLabel(type: EntityInsightType) {
  return entityTypeLabels[type];
}
