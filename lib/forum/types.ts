// v5-D61 论坛 Q&A 引擎类型

export interface ForumUserRecord {
  id: string;
  handle: string;          // 用户名（如 "刘**"）
  displayName: string;     // 完整虚拟姓名（隐藏中间字）
  email: string;           // @worldyi.community
  city: string;
  province: string;
  occupation: string;
  industry: string;
  interests: string[];     // 命理兴趣切面
  role: 'asker' | 'master' | 'enthusiast' | 'official';
  // master = 专业老师 / enthusiast = 兴趣爱好者 / official = 官方答主
  bio: string;
  avatarSeed: string;      // 用 seed 生成 dicebear/identicon URL，无需真实图
  joinedAt: string;        // ISO
  reputation: number;
}

export interface ForumQuestionRecord {
  id: string;
  slug: string;            // SEO 用 url-safe
  authorId: string;        // forum_users.id
  title: string;
  body: string;            // markdown 简文
  category: string;        // bazi / ziwei / liuyao / qimen / zeri / fengshui / xingming / xiangmian / xingzuo / taluo
  industry: string;        // 50 行业之一
  tags: string[];          // SEO keywords
  privacyMode: string;     // 'partial-bazi' / 'date-only' / 'no-time' / 'lunar-only' / 'pen-name'
  metadata: {
    // 隐藏部分的命理信息
    yearGanZhi?: string;       // 年柱（保留）
    monthGanZhi?: string;      // 月柱可见
    dayGanZhi?: string;        // 日柱常隐藏
    hourGanZhi?: string;       // 时柱常隐藏
    gender?: 'male' | 'female';
    ageRange?: string;         // "30-35"
    visibilityMask: string[];  // 哪些字段被隐藏
    pooledOfficialAnswer?: string;  // v5-D70：池产出的官方答正文，buildAnswer 时优先使用
  };
  status: 'pending' | 'visible' | 'archived';
  publishedAt: string | null;  // 发布时间（即对外可见时间）
  createdAt: string;
  viewCount: number;
  answerCount: number;
}

export interface ForumAnswerRecord {
  id: string;
  questionId: string;
  authorId: string;
  body: string;          // markdown
  isOfficial: boolean;
  upvoteCount: number;
  status: 'pending' | 'visible';
  publishedAt: string | null;
  createdAt: string;
  responseDelayMinutes: number; // 距离 question publishedAt 多久（45-180min）
}

export interface ForumGenerationContext {
  industry: string;
  category: string;     // 命理切面
  privacyMode: string;
  asker: ForumUserRecord;
  master: ForumUserRecord;       // 选 1 个专业老师
  enthusiasts: ForumUserRecord[]; // 选 0-2 个兴趣爱好者
  scheduledFor: Date;
}
