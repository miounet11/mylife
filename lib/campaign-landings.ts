/**
 * Short campaign landings → /analyze with fixed source attribution.
 * Use /go/{slug} in ads, WeChat, 小红书 bios, QR codes.
 */

export type CampaignLanding = {
  slug: string;
  /** analytics / funnel source */
  source: string;
  intent?: 'career' | 'wealth' | 'relationship' | 'yearly';
  title: string;
  description: string;
  cta: string;
  badge?: string;
};

export const CAMPAIGN_LANDINGS: Record<string, CampaignLanding> = {
  share: {
    slug: 'share',
    source: 'share_viral',
    intent: 'career',
    title: '朋友分享的人生K线',
    description: '同一套结构方法 · 免费填生辰出报告 · 不必先注册',
    cta: '免费测我的结构',
    badge: '分享邀请',
  },
  invite: {
    slug: 'invite',
    source: 'invite_link',
    intent: 'career',
    title: '邀请你测一份结构报告',
    description: '日主用神 · 人生K线 · 阶段窗口 · 可执行下一步',
    cta: '开始免费测算',
    badge: '邀请',
  },
  xhs: {
    slug: 'xhs',
    source: 'campaign_xhs',
    intent: 'career',
    title: '小红书同款 · 免费八字结构报告',
    description: '先看清结构与节奏，再决定跳槽、创业或稳住',
    cta: '一键免费测算',
    badge: '小红书',
  },
  wechat: {
    slug: 'wechat',
    source: 'campaign_wechat',
    intent: 'career',
    title: '微信好友推荐 · 人生K线',
    description: '结构判断 · 不迷信口号 · 结论可回访验证',
    cta: '免费生成报告',
    badge: '微信',
  },
  dy: {
    slug: 'dy',
    source: 'campaign_douyin',
    intent: 'yearly',
    title: '抖音同款 · 流年节奏一键看',
    description: '填生辰出人生K线与今年窗口',
    cta: '免费测流年节奏',
    badge: '抖音',
  },
  career: {
    slug: 'career',
    source: 'campaign_career',
    intent: 'career',
    title: '事业节奏研判 · 免费结构报告',
    description: '升职 / 跳槽 / 创业窗口 · 用神与大运对照',
    cta: '看我的事业节奏',
    badge: '事业',
  },
  hehun: {
    slug: 'hehun',
    source: 'campaign_hehun',
    intent: 'relationship',
    title: '关系节奏 · 先排盘再合婚',
    description: '先生成你的结构报告，再做双盘对照更准',
    cta: '先免费排盘',
    badge: '关系',
  },
  wealth: {
    slug: 'wealth',
    source: 'campaign_wealth',
    intent: 'wealth',
    title: '财富窗口 · 结构与节奏',
    description: '财星用忌 · 阶段宜推/宜守 · 可验证动作',
    cta: '免费测财富节奏',
    badge: '财富',
  },
};

export function getCampaignLanding(slug: string): CampaignLanding | null {
  const key = `${slug || ''}`.trim().toLowerCase();
  return CAMPAIGN_LANDINGS[key] || null;
}

export function listCampaignSlugs(): string[] {
  return Object.keys(CAMPAIGN_LANDINGS);
}

export function buildCampaignAnalyzeHref(campaign: CampaignLanding): string {
  const q = new URLSearchParams({
    source: campaign.source,
    from: `go:${campaign.slug}`,
  });
  if (campaign.intent) q.set('intent', campaign.intent);
  return `/analyze?${q.toString()}`;
}
