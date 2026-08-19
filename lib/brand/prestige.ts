/**
 * Overseas-Chinese prestige pack: gold-on-black award plates and seals.
 * Decorative art only — overlay real product type in PrestigeBanner.
 */

export const PRESTIGE_BASE = '/images/brand-prestige';

export const PRESTIGE_ASSETS = {
  plateVertical: `${PRESTIGE_BASE}/plate-vertical.jpg`,
  plateWide: `${PRESTIGE_BASE}/plate-wide.jpg`,
  plateWideSeal: `${PRESTIGE_BASE}/plate-wide-seal.jpg`,
  iconTrophy: `${PRESTIGE_BASE}/icon-trophy.jpg`,
  iconTrophySm: `${PRESTIGE_BASE}/icon-trophy-sm.jpg`,
  iconSeal: `${PRESTIGE_BASE}/icon-seal.jpg`,
  iconSealSm: `${PRESTIGE_BASE}/icon-seal-sm.jpg`,
  iconApp: `${PRESTIGE_BASE}/icon-app.jpg`,
  iconAppSm: `${PRESTIGE_BASE}/icon-app-sm.jpg`,
  iconElements: `${PRESTIGE_BASE}/icon-elements.jpg`,
  iconElementsSm: `${PRESTIGE_BASE}/icon-elements-sm.jpg`,
  iconTiming: `${PRESTIGE_BASE}/icon-timing.jpg`,
  iconTimingSm: `${PRESTIGE_BASE}/icon-timing-sm.jpg`,
  iconMembership: `${PRESTIGE_BASE}/icon-membership.jpg`,
  iconMembershipSm: `${PRESTIGE_BASE}/icon-membership-sm.jpg`,
} as const;

export type PrestigeIconKey = 'trophy' | 'seal' | 'app' | 'elements' | 'timing' | 'membership';

export const PRESTIGE_ICONS: Record<
  PrestigeIconKey,
  { src: string; srcHi: string; alt: string; label: string; labelEn: string }
> = {
  trophy: {
    src: PRESTIGE_ASSETS.iconTrophySm,
    srcHi: PRESTIGE_ASSETS.iconTrophy,
    alt: '金奖杯',
    label: '专业判断',
    labelEn: 'Judgment',
  },
  app: {
    src: PRESTIGE_ASSETS.iconAppSm,
    srcHi: PRESTIGE_ASSETS.iconApp,
    alt: '四柱金标',
    label: '结构',
    labelEn: 'Structure',
  },
  timing: {
    src: PRESTIGE_ASSETS.iconTimingSm,
    srcHi: PRESTIGE_ASSETS.iconTiming,
    alt: '时位金章',
    label: '时位',
    labelEn: 'Timing',
  },
  elements: {
    src: PRESTIGE_ASSETS.iconElementsSm,
    srcHi: PRESTIGE_ASSETS.iconElements,
    alt: '五行金章',
    label: '五行',
    labelEn: 'Elements',
  },
  membership: {
    src: PRESTIGE_ASSETS.iconMembershipSm,
    srcHi: PRESTIGE_ASSETS.iconMembership,
    alt: '会员金章',
    label: '会员',
    labelEn: 'Member',
  },
  seal: {
    src: PRESTIGE_ASSETS.iconSealSm,
    srcHi: PRESTIGE_ASSETS.iconSeal,
    alt: '金印章',
    label: '核验',
    labelEn: 'Verify',
  },
};

/** Ceremonial hubs that should render gold-on-black instead of paper immersion. */
export const PRESTIGE_SURFACE_KEYS = [
  'home',
  'analyze',
  'membership',
  'teachers',
  'knowledge',
  'cases',
  'docs',
  'dimensions',
  'reports',
] as const;
