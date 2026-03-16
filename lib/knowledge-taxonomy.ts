export type RightsStatus =
  | 'public_domain'
  | 'open_license'
  | 'licensed'
  | 'platform_restricted'
  | 'unknown';

export type KnowledgeObjectType =
  | 'topic'
  | 'concept'
  | 'book'
  | 'person'
  | 'school'
  | 'question'
  | 'case'
  | 'source_document';

export interface KnowledgeTopicSeed {
  key: string;
  title: string;
  description: string;
  keywords: string[];
  objectTypes: KnowledgeObjectType[];
}

export interface KnowledgeSourceSeed {
  id: string;
  label: string;
  platform: string;
  category: 'public_text' | 'bibliography' | 'community' | 'video' | 'news';
  access: 'rss' | 'web' | 'bb-site' | 'manual';
  url: string;
  priority: 0 | 1 | 2;
  rightsStatus: RightsStatus;
  notes: string;
}

export const KNOWLEDGE_OBJECT_TYPES: KnowledgeObjectType[] = [
  'topic',
  'concept',
  'book',
  'person',
  'school',
  'question',
  'case',
  'source_document',
];

export const RIGHTS_STATUS_LABELS: Record<RightsStatus, string> = {
  public_domain: '公版 / 公有领域',
  open_license: '开放许可',
  licensed: '已授权',
  platform_restricted: '平台受限',
  unknown: '待确认',
};

export const KNOWLEDGE_TOPIC_SEEDS: KnowledgeTopicSeed[] = [
  {
    key: 'fundamentals',
    title: '基础原理',
    description: '面向阴阳、五行、干支、十神、格局等基础概念的系统解释。',
    keywords: ['阴阳', '五行', '天干', '地支', '十神', '格局', '调候', '用神'],
    objectTypes: ['topic', 'concept', 'book', 'question'],
  },
  {
    key: 'bazi-system',
    title: '八字体系',
    description: '围绕排盘、真太阳时、大运流年、断事边界和流派差异展开。',
    keywords: ['八字', '排盘', '真太阳时', '大运', '流年', '子平', '命理'],
    objectTypes: ['topic', 'concept', 'book', 'school', 'question', 'case'],
  },
  {
    key: 'yijing-system',
    title: '易学体系',
    description: '围绕周易经文、十翼、卦象、爻位、占筮方法和现代解释展开。',
    keywords: ['周易', '易经', '卦象', '爻位', '十翼', '梅花易数', '六爻'],
    objectTypes: ['topic', 'concept', 'book', 'school', 'question'],
  },
  {
    key: 'related-arts',
    title: '相关术数',
    description: '整理紫微、奇门、风水、姓名学等相关系统的基本框架。',
    keywords: ['紫微', '奇门', '风水', '姓名学', '术数'],
    objectTypes: ['topic', 'concept', 'book', 'school', 'question'],
  },
  {
    key: 'applied-scenarios',
    title: '应用专题',
    description: '把知识映射到职业、婚恋、财富、迁移、升学、健康等真实决策问题。',
    keywords: ['职业', '婚恋', '财富', '迁移', '升学', '健康', '决策'],
    objectTypes: ['topic', 'question', 'case', 'book'],
  },
  {
    key: 'methodology',
    title: '方法论',
    description: '解释命理的适用边界、验证方法、常见误区和争议议题。',
    keywords: ['边界', '验证', '误区', '争议', '证据', '方法论'],
    objectTypes: ['topic', 'concept', 'question', 'case'],
  },
  {
    key: 'bibliography',
    title: '书籍体系',
    description: '沉淀原典、注本、导论、流派代表作、版本比较和入门路径。',
    keywords: ['书单', '原典', '注本', '导论', '版本', '译本'],
    objectTypes: ['topic', 'book', 'person', 'question'],
  },
  {
    key: 'question-map',
    title: '问题地图',
    description: '围绕用户高频问题建立问答索引和问题综述页。',
    keywords: ['准不准', '怎么看', '入门', '区别', '推荐书', '争议'],
    objectTypes: ['topic', 'question', 'concept', 'book'],
  },
];

export const KNOWLEDGE_SOURCE_SEEDS: KnowledgeSourceSeed[] = [
  {
    id: 'ctext',
    label: 'Chinese Text Project',
    platform: 'ctext',
    category: 'public_text',
    access: 'web',
    url: 'https://ctext.org/',
    priority: 0,
    rightsStatus: 'unknown',
    notes: '优先用于古籍索引、章节定位和出处映射，使用前单独审核站点使用条款。',
  },
  {
    id: 'wikisource-zh',
    label: '中文维基文库',
    platform: 'wikisource',
    category: 'public_text',
    access: 'web',
    url: 'https://zh.wikisource.org/',
    priority: 0,
    rightsStatus: 'open_license',
    notes: '适合公版文本和开放许可文本索引，发布时需遵循对应许可要求。',
  },
  {
    id: 'openlibrary',
    label: 'Open Library',
    platform: 'openlibrary',
    category: 'bibliography',
    access: 'web',
    url: 'https://openlibrary.org/',
    priority: 0,
    rightsStatus: 'open_license',
    notes: '主要用于书目、版本和基础元数据，不作为全文来源。',
  },
  {
    id: 'internet-archive',
    label: 'Internet Archive',
    platform: 'internet-archive',
    category: 'public_text',
    access: 'web',
    url: 'https://archive.org/',
    priority: 0,
    rightsStatus: 'unknown',
    notes: '适合查找早期公版影印和版本线索，逐条确认权利状态。',
  },
  {
    id: 'project-gutenberg',
    label: 'Project Gutenberg',
    platform: 'gutenberg',
    category: 'public_text',
    access: 'web',
    url: 'https://www.gutenberg.org/',
    priority: 0,
    rightsStatus: 'public_domain',
    notes: '适合英文公版文本与历史译本索引。',
  },
  {
    id: 'google-news-yijing',
    label: 'Google News · 易经',
    platform: 'google-news',
    category: 'news',
    access: 'rss',
    url: 'https://news.google.com/rss/search?q=%E6%98%93%E7%BB%8F+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    priority: 0,
    rightsStatus: 'platform_restricted',
    notes: '适合发现热点与公开讨论，不适合复刻原始文章内容。',
  },
  {
    id: 'zhihu-search',
    label: '知乎搜索',
    platform: 'zhihu',
    category: 'community',
    access: 'bb-site',
    url: 'https://www.zhihu.com/search',
    priority: 1,
    rightsStatus: 'platform_restricted',
    notes: '适合问题、回答、书单和争议点采集，仅做问题映射与摘要。',
  },
  {
    id: 'bilibili-search',
    label: 'B站搜索',
    platform: 'bilibili',
    category: 'video',
    access: 'bb-site',
    url: 'https://search.bilibili.com/',
    priority: 1,
    rightsStatus: 'platform_restricted',
    notes: '适合采集视频标题、作者、话题、评论方向与时间线。',
  },
  {
    id: 'youtube-search',
    label: 'YouTube Search',
    platform: 'youtube',
    category: 'video',
    access: 'bb-site',
    url: 'https://www.youtube.com/results',
    priority: 1,
    rightsStatus: 'platform_restricted',
    notes: '适合 transcript、标题、频道、评论关键词抽取，不直接镜像视频内容。',
  },
  {
    id: 'douban-books',
    label: '豆瓣读书',
    platform: 'douban',
    category: 'community',
    access: 'web',
    url: 'https://book.douban.com/',
    priority: 1,
    rightsStatus: 'platform_restricted',
    notes: '适合书单、书评趋势和版本比较信号，不发布原始书评。',
  },
  {
    id: 'xiaohongshu-search',
    label: '小红书搜索',
    platform: 'xiaohongshu',
    category: 'community',
    access: 'bb-site',
    url: 'https://www.xiaohongshu.com/search_result',
    priority: 2,
    rightsStatus: 'platform_restricted',
    notes: '适合抓入门帖、书单帖、经验帖热词，限制为摘要和问题提炼。',
  },
];

export function getKnowledgeTopics() {
  return KNOWLEDGE_TOPIC_SEEDS;
}

export function getKnowledgeSources() {
  return KNOWLEDGE_SOURCE_SEEDS;
}
