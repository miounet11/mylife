/**
 * Life K-Line growth narrative — “build in public / first principles” marketing kit.
 * Inspired by high-signal founder marketing (demo > ads, mission > features, memes > jargon).
 */

import {
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';

export const SITE_CANONICAL = 'https://www.life-kline.com';

/** One-line mission people can repeat. */
export const MOVEMENT_TAGLINE = '别再买恐惧。用结构，看清人生节奏。';

export const MOVEMENT_MISSION = {
  eyebrow: '运动 · 不是迷信',
  title: '我们在做一件反常识的事',
  lead:
    '把命理从“恐吓与宿命”拉回“结构、窗口与可验证动作”。免费先用，开源可查，社区可吵——用产品证明，而不是用广告喊。',
  principles: [
    {
      key: 'first-principles',
      title: '第一性原理',
      body: '不从“灵不灵”开始，从问题拆解：结构是否匹配、阶段是否允许、动作是否可验证。',
    },
    {
      key: 'show-dont-tell',
      title: '先演示，再说话',
      body: '一分钟生成报告。能打开、能复盘、能回访——比任何软文更有说服力。',
    },
    {
      key: 'open',
      title: '公开建造',
      body: 'GitHub 开源、Telegram 直连、站内数据可见。信任来自透明，不是神秘感。',
    },
    {
      key: 'anti-fear',
      title: '反恐吓',
      body: '不做“不转账就破财”的剧本。说清边界：不构成投资、医疗、法律或录取承诺。',
    },
  ],
  enemies: [
    { label: '恐吓式算命', why: '制造焦虑只为成交' },
    { label: '空洞吉凶签', why: '一句好/坏，无法行动' },
    { label: '黑箱玄学 App', why: '结论不可复盘、不可验证' },
    { label: '过度承诺', why: '把概率说成必然' },
  ],
  promises: [
    '免费可完整生成与查看基础报告',
    '结论可拆成结构 / 时位 / 动作 / 风险',
    '关键节点可回访，而不是看完即弃',
    '开源仓库与官方频道公开可加入',
  ],
};

/** Short shareable lines (Musk-style: punchy, memeable, mission-forward). */
export const SHARE_LINES: Array<{ id: string; text: string; channel: string }> = [
  {
    id: 's1',
    text: '别再买恐惧。用结构，看清人生节奏。→ life-kline.com',
    channel: '通用',
  },
  {
    id: 's2',
    text: '人生K线：不是算你“好不好”，是告诉你现在该冲刺、观望还是收敛。免费测。',
    channel: '朋友圈 / 即刻',
  },
  {
    id: 's3',
    text: '如果一份命理报告不能落到 30 天动作，它只是娱乐。我们做的是可验证的判断。',
    channel: '小红书 / 知乎',
  },
  {
    id: 's4',
    text: '开源命理引擎 + 人生K线报告。GitHub 可看，Telegram 可加，网站可直接算。',
    channel: '开发者 / 极客',
  },
  {
    id: 's5',
    text: '反对恐吓式算命。支持结构、窗口、边界。#人生K线 #世界易',
    channel: '话题标签',
  },
  {
    id: 's6',
    text: `官方频道 ${OFFICIAL_TELEGRAM_HANDLE} · 仓库 ${OFFICIAL_GITHUB_URL} · 产品 ${SITE_CANONICAL}`,
    channel: '一键名片',
  },
];

export const SHIP_LOG: Array<{ date: string; title: string; impact: string }> = [
  { date: '2026-07', title: '人气与口碑层上线', impact: '活跃 / 今日测算 / 评价 / 媒体热度同屏' },
  { date: '2026-07', title: '案例与图解升级', impact: '高考等真实场景 + 每篇多图解' },
  { date: '2026-07', title: '免费会员活动', impact: '登录即可领季/年权益，降低试用门槛' },
  { date: '2026-06', title: '世界易内容与十维度', impact: '从知识到窄场景研判闭环' },
  { date: '持续', title: '开源与公开频道', impact: 'GitHub + Telegram 透明连接' },
];

export const GROWTH_PLAYS: Array<{
  step: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}> = [
  {
    step: '01',
    title: '先让人体验到 wow',
    body: '60 秒内生成报告：核心结论 + 阶段 + 下一步。截图比广告更有用。',
    cta: '立即测算',
    href: '/#analyze-workspace',
  },
  {
    step: '02',
    title: '给一句可转发的话',
    body: '金句要短、要立场鲜明、要指向行动。复制即发，降低创作成本。',
    cta: '复制金句',
    href: '/movement#share-lines',
  },
  {
    step: '03',
    title: '建立对立面',
    body: '我们反对恐吓与宿命，支持结构与验证。立场越清楚，传播越快。',
    cta: '看我们的立场',
    href: '/movement#enemies',
  },
  {
    step: '04',
    title: '公开建造',
    body: '开源仓库、更新日志、人气数据放在明面。信任复利来自透明。',
    cta: '打开 GitHub',
    href: OFFICIAL_GITHUB_URL,
  },
  {
    step: '05',
    title: '社区承接热度',
    body: '讨论去 Telegram，深度去案例与知识库，转化回报告与会员。',
    cta: `加入 ${OFFICIAL_TELEGRAM_HANDLE}`,
    href: OFFICIAL_TELEGRAM_URL,
  },
  {
    step: '06',
    title: '内容即获客',
    body: '案例、图解、媒体热度都是获客页。每一篇都接到测算 CTA。',
    cta: '看案例库',
    href: '/cases',
  },
];

export function buildDefaultShareText() {
  return SHARE_LINES[0].text;
}

/** 分享落地页：默认官网；也可传入报告结果页等。 */
export function buildSharePayload(options?: {
  text?: string;
  url?: string;
  title?: string;
  hashtags?: string[];
}) {
  const text = (options?.text || buildDefaultShareText()).trim();
  const url = (options?.url || SITE_CANONICAL).trim();
  const title = (options?.title || '人生K线 · Life K-Line').trim();
  const hashtags = options?.hashtags?.length
    ? options.hashtags
    : ['人生K线', '世界易', 'LifeKLine'];
  return { text, url, title, hashtags };
}

export function buildTwitterIntent(text = buildDefaultShareText(), pageUrl = SITE_CANONICAL) {
  // x.com 与 twitter.com 共用 intent；x.com 更贴近当前品牌
  const intent = new URL('https://x.com/intent/tweet');
  intent.searchParams.set('text', text);
  intent.searchParams.set('url', pageUrl);
  intent.searchParams.set('hashtags', '人生K线,世界易,LifeKLine');
  return intent.toString();
}

/** @deprecated 使用 buildTwitterIntent；保留别名避免旧引用断裂 */
export const buildXIntent = buildTwitterIntent;

export type SharePlatformId =
  | 'x'
  | 'facebook'
  | 'tiktok'
  | 'telegram'
  | 'whatsapp'
  | 'linkedin'
  | 'reddit'
  | 'threads'
  | 'line'
  | 'weibo'
  | 'copy'
  | 'system';

export type SharePlatform = {
  id: SharePlatformId;
  label: string;
  /** 直接可打开的分享 URL；null 表示走剪贴板 / 系统分享 */
  href: string | null;
  /** 打开前是否需要先复制文案（TikTok 等无标准 intent 时） */
  copyFirst?: boolean;
  /** 简短说明，用于 UI 提示 */
  hint?: string;
};

/**
 * 各平台真实一键分享入口。
 * - X / Facebook / Telegram / WhatsApp / LinkedIn / Reddit / Threads / LINE / 微博：标准 intent
 * - TikTok：无公开 web share intent → 复制文案后打开创作页，用户粘贴即可
 */
export function buildSharePlatforms(options?: {
  text?: string;
  url?: string;
  title?: string;
  hashtags?: string[];
}): SharePlatform[] {
  const { text, url, title, hashtags } = buildSharePayload(options);
  const textWithUrl = text.includes(url) ? text : `${text}\n${url}`;
  const hashtagCsv = hashtags.join(',');
  const hashtagSpaced = hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ');

  const x = new URL('https://x.com/intent/tweet');
  x.searchParams.set('text', text);
  x.searchParams.set('url', url);
  x.searchParams.set('hashtags', hashtagCsv);

  const facebook = new URL('https://www.facebook.com/sharer/sharer.php');
  facebook.searchParams.set('u', url);
  facebook.searchParams.set('quote', text);

  const telegram = new URL('https://t.me/share/url');
  telegram.searchParams.set('url', url);
  telegram.searchParams.set('text', text);

  const whatsapp = new URL('https://api.whatsapp.com/send');
  whatsapp.searchParams.set('text', textWithUrl);

  const linkedin = new URL('https://www.linkedin.com/sharing/share-offsite/');
  linkedin.searchParams.set('url', url);

  const reddit = new URL('https://www.reddit.com/submit');
  reddit.searchParams.set('url', url);
  reddit.searchParams.set('title', title);

  const threads = new URL('https://www.threads.net/intent/post');
  threads.searchParams.set('text', textWithUrl);

  const line = new URL('https://social-plugins.line.me/lineit/share');
  line.searchParams.set('url', url);

  const weibo = new URL('https://service.weibo.com/share/share.php');
  weibo.searchParams.set('url', url);
  weibo.searchParams.set('title', `${text} ${hashtagSpaced}`);

  // TikTok 无官方外链分享 intent：复制文案后引导打开上传/创作页
  const tiktok = 'https://www.tiktok.com/upload?lang=zh-Hans';

  return [
    { id: 'x', label: 'X', href: x.toString(), hint: '打开发帖框' },
    { id: 'facebook', label: 'Facebook', href: facebook.toString(), hint: '打开分享框' },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: tiktok,
      copyFirst: true,
      hint: '已复制文案，粘贴到作品说明',
    },
    { id: 'telegram', label: 'Telegram', href: telegram.toString(), hint: '打开转发' },
    { id: 'whatsapp', label: 'WhatsApp', href: whatsapp.toString(), hint: '打开聊天分享' },
    { id: 'threads', label: 'Threads', href: threads.toString(), hint: '打开发帖' },
    { id: 'linkedin', label: 'LinkedIn', href: linkedin.toString(), hint: '打开分享' },
    { id: 'reddit', label: 'Reddit', href: reddit.toString(), hint: '打开发帖' },
    { id: 'line', label: 'LINE', href: line.toString(), hint: '打开分享' },
    { id: 'weibo', label: '微博', href: weibo.toString(), hint: '打开分享' },
    { id: 'copy', label: '复制链接', href: null, hint: '已复制文案与链接' },
    { id: 'system', label: '系统分享', href: null, hint: '唤起本机分享面板' },
  ];
}
