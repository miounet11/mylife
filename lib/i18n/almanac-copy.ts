/**
 * Almanac UI + SEO copy: zh-CN / zh-Hant / en
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Common 宜忌 activity labels → English */
export const YI_JI_EN: Record<string, string> = {
  祭祀: 'Worship',
  祈福: 'Pray for blessings',
  求嗣: 'Pray for heirs',
  开光: 'Consecration',
  塑绘: 'Sculpt / paint',
  齐醮: 'Taoist rite',
  斋醮: 'Taoist rite',
  酬神: 'Thank deities',
  订盟: 'Betrothal',
  订婚: 'Engagement',
  纳采: 'Betrothal gifts',
  嫁娶: 'Marriage',
  裁衣: 'Tailoring',
  合帐: 'Make bed curtains',
  冠笄: 'Coming-of-age rite',
  安机械: 'Install machines',
  作梁: 'Raise beams',
  开柱眼: 'Open pillar holes',
  修造: 'Construction',
  动土: 'Groundbreaking',
  破土: 'Break ground (burial)',
  安葬: 'Burial',
  入殓: 'Encoffining',
  移柩: 'Move coffin',
  成服: 'Mourning dress',
  除服: 'End mourning',
  开市: 'Open market / shop',
  立券: 'Sign contract',
  交易: 'Trade',
  纳财: 'Receive wealth',
  开仓: 'Open storehouse',
  出货: 'Ship goods',
  入宅: 'Move in',
  安香: 'Install incense',
  出火: 'Relocate hearth',
  盖屋: 'Roof building',
  起基: 'Lay foundation',
  定磉: 'Set foundation stones',
  竖柱: 'Erect pillars',
  上梁: 'Raise ridgepole',
  开渠: 'Dig canal',
  穿井: 'Dig well',
  安门: 'Install door',
  作灶: 'Build stove',
  平治道涂: 'Level roads',
  修饰垣墙: 'Repair walls',
  补垣: 'Mend walls',
  塞穴: 'Fill holes',
  扫舍: 'Sweep house',
  开厕: 'Build toilet',
  造仓: 'Build storehouse',
  伐木: 'Fell trees',
  捕捉: 'Hunt / catch',
  畋猎: 'Hunt',
  取渔: 'Fishing',
  结网: 'Make nets',
  牧养: 'Herding',
  安床: 'Install bed',
  解除: 'Exorcise / clear',
  沐浴: 'Bathing',
  剃头: 'Haircut',
  整手足甲: 'Nail care',
  整容: 'Grooming',
  会亲友: 'Meet relatives',
  进人口: 'Add family members',
  出行: 'Travel',
  移徙: 'Relocation',
  分居: 'Separate household',
  赴任: 'Take office',
  求医: 'Seek medical care',
  治病: 'Treat illness',
  词讼: 'Lawsuit',
  破屋: 'Demolish house',
  坏垣: 'Break walls',
  诸事不宜: 'Avoid major affairs',
  馀事勿取: 'Avoid other affairs',
  余事勿取: 'Avoid other affairs',
  开生坟: 'Open new grave',
  合寿木: 'Make coffin',
  入宅安香: 'Move-in rite',
  掘井: 'Dig well',
  酝酿: 'Brew',
  造车器: 'Make vehicles',
  经络: 'Meridian work',
  栽种: 'Planting',
  纳畜: 'Keep livestock',
  造畜稠: 'Build livestock pen',
  教牛马: 'Train cattle/horses',
};

export function translateYiJiList(items: string[], locale: SiteLocale): string[] {
  if (locale !== 'en') {
    if (locale === 'zh-Hant') {
      return items.map((x) => toSiteLocaleText(x, 'zh-Hant'));
    }
    return items;
  }
  return items.map((x) => YI_JI_EN[x] || x);
}

export function almanacHubCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '万年历黄历｜每日宜忌·十二时辰·个人日运｜人生K线',
      'zh-Hant': '萬年曆黃曆｜每日宜忌·十二時辰·個人日運｜人生K線',
      en: 'Chinese Almanac Calendar · Daily Yi/Ji, Hours & Personal Day Fortune | Life K-Line',
    }),
    metaDescription: pick(locale, {
      'zh-CN':
        '查公历农历与通书宜忌、冲煞、十二时辰黄道黑道、六曜与星座摘要；绑定生辰后叠加日主结构。支持撕页/个人日运/全球对照等多种展示，多地区文化侧重。',
      'zh-Hant':
        '查公曆農曆與通書宜忌、衝煞、十二時辰黃道黑道、六曜與星座摘要；綁定生辰後疊加日主結構。支援撕頁/個人日運/全球對照等多種展示。',
      en: 'Lunisolar almanac with yi/ji, clash, 12 double-hours, Rokuyō and sun-sign notes. Bind birth data for day-master personal rhythm. Multiple display skins and regional focuses.',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '全球黄历落地页',
      'zh-Hant': '全球黃曆落地頁',
      en: 'Global almanac landing',
    }),
    title: pick(locale, {
      'zh-CN': '今天，对你意味着什么？',
      'zh-Hant': '今天，對你意味著什麼？',
      en: 'What does today mean for you?',
    }),
    description: pick(locale, {
      'zh-CN':
        '通书撕页 · 现代卡片 · 个人日运 · 时辰宫格 · 全球对照——多种展示一键切换。支持中国、台湾、香港、新加坡、日本六曜、韩国、越南、北美等侧重；绑定生辰后看专属匹配。',
      'zh-Hant':
        '通書撕頁 · 現代卡片 · 個人日運 · 時辰宮格 · 全球對照——多種展示一鍵切換。支援多地區側重；綁定生辰後看專屬匹配。',
      en: 'Tear-off tong-shu, modern cards, personal daily, hour grid, global compare — switch freely. Regional focuses from China to Japan Rokuyō to North America. Bind birth data for personal match.',
    }),
    linkTear: pick(locale, { 'zh-CN': '撕页通书', 'zh-Hant': '撕頁通書', en: 'Tear-off sheet' }),
    linkPersonal: pick(locale, { 'zh-CN': '个人日运', 'zh-Hant': '個人日運', en: 'Personal day' }),
    linkGlobal: pick(locale, { 'zh-CN': '全球对照', 'zh-Hant': '全球對照', en: 'Global compare' }),
    linkReport: pick(locale, { 'zh-CN': '完整报告', 'zh-Hant': '完整報告', en: 'Full report' }),
    todayUrl: (d: string) =>
      pick(locale, {
        'zh-CN': `今日 URL：/almanac/${d}`,
        'zh-Hant': `今日 URL：/almanac/${d}`,
        en: `Today’s URL: /almanac/${d}`,
      }),
    ctaReport: pick(locale, { 'zh-CN': '接到报告', 'zh-Hant': '接到報告', en: 'Get report' }),
  };
}

export function almanacUiCopy(locale: SiteLocale) {
  return {
    regionTitle: pick(locale, {
      'zh-CN': '地区 / 传统侧重',
      'zh-Hant': '地區 / 傳統側重',
      en: 'Region / tradition focus',
    }),
    regionSubtitle: pick(locale, {
      'zh-CN': '同一天，不同文化怎么读',
      'zh-Hant': '同一天，不同文化怎麼讀',
      en: 'Same day, different cultural lenses',
    }),
    skinTitle: pick(locale, {
      'zh-CN': '日历展示形态（参考传统撕页 + 现代站）',
      'zh-Hant': '日曆展示形態（參考傳統撕頁 + 現代站）',
      en: 'Display skins (paper tear-off + modern web)',
    }),
    current: pick(locale, { 'zh-CN': '当前', 'zh-Hant': '目前', en: 'Current' }),
    prevMonth: pick(locale, { 'zh-CN': '上月', 'zh-Hant': '上月', en: 'Prev' }),
    nextMonth: pick(locale, { 'zh-CN': '下月', 'zh-Hant': '下月', en: 'Next' }),
    loading: pick(locale, { 'zh-CN': '加载日历…', 'zh-Hant': '載入日曆…', en: 'Loading calendar…' }),
    loadFail: pick(locale, {
      'zh-CN': '加载万年历失败，请稍后重试',
      'zh-Hant': '載入萬年曆失敗，請稍後重試',
      en: 'Failed to load almanac. Try again.',
    }),
    networkFail: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Try again.',
    }),
    dayUrlHint: pick(locale, {
      'zh-CN': '每日独立地址 /almanac/YYYY-MM-DD · 可分享收录',
      'zh-Hant': '每日獨立地址 /almanac/YYYY-MM-DD · 可分享收錄',
      en: 'Canonical day URL /almanac/YYYY-MM-DD · shareable & indexable',
    }),
    bindTitle: pick(locale, {
      'zh-CN': '绑定生辰，解锁「我的每日黄历」',
      'zh-Hant': '綁定生辰，解鎖「我的每日黃曆」',
      en: 'Bind birth data for your personal daily almanac',
    }),
    bindDesc: pick(locale, {
      'zh-CN': '引擎取日主与用神，叠通书流日；撕页/个人日运/全球对照等视图均可显示你的匹配分。',
      'zh-Hant': '引擎取日主與用神，疊通書流日；撕頁/個人日運/全球對照等視圖均可顯示你的匹配分。',
      en: 'Engine resolves day-master & useful gods against the flow day. All skins can show your match score.',
    }),
    chartLinked: (src: string, dm: string, yong: string) =>
      pick(locale, {
        'zh-CN': `已接入命盘（${src}）· 日主 ${dm}${yong ? ` · 用神 ${yong}` : ''}。`,
        'zh-Hant': `已接入命盤（${src}）· 日主 ${dm}${yong ? ` · 用神 ${yong}` : ''}。`,
        en: `Chart linked (${src}) · Day master ${dm}${yong ? ` · Useful gods ${yong}` : ''}.`,
      }),
    foundation: pick(locale, {
      'zh-CN': '完善底座',
      'zh-Hant': '完善底座',
      en: 'Complete foundation',
    }),
    footerTitle: pick(locale, {
      'zh-CN': '落地页说明',
      'zh-Hant': '落地頁說明',
      en: 'Landing notes',
    }),
    footerBody: pick(locale, {
      'zh-CN':
        '撕页样式致敬传统挂历信息密度（宜忌、十二时辰格、冲煞、胎神、吉神方位等）；日本侧重六曜、北美侧重星座叙述、华人区保留完整通书。潮汐/地方彩票等未收录。',
      'zh-Hant':
        '撕頁樣式致敬傳統掛曆資訊密度；日本側重六曜、北美側重星座敘述、華人區保留完整通書。潮汐等未收錄。',
      en: 'Tear-off skin mirrors classic paper density. Japan leans Rokuyō; North America sun-sign narrative; Chinese regions full tong-shu. Tides not included.',
    }),
    backToday: pick(locale, { 'zh-CN': '回到今日', 'zh-Hant': '回到今日', en: 'Back to today' }),
    eraTiming: pick(locale, { 'zh-CN': '时代天时', 'zh-Hant': '時代天時', en: 'Era timing' }),
    fullReport: pick(locale, { 'zh-CN': '完整报告', 'zh-Hant': '完整報告', en: 'Full report' }),
    weekdays: pick(locale, {
      'zh-CN': '日一二三四五六',
      'zh-Hant': '日一二三四五六',
      en: 'SMTWTFS',
    }),
    monthLabel: (y: number, m: number) =>
      locale === 'en' ? `${y}-${String(m).padStart(2, '0')}` : `${y}年${m}月`,
    jie: pick(locale, { 'zh-CN': '节', 'zh-Hant': '節', en: 'T' }),
  };
}

export function almanacDayPanelCopy(locale: SiteLocale) {
  return {
    publicTongshu: pick(locale, {
      'zh-CN': '通书黄历',
      'zh-Hant': '通書黃曆',
      en: 'Public tong-shu',
    }),
    personalTitle: pick(locale, {
      'zh-CN': '我的个人黄历',
      'zh-Hant': '我的個人黃曆',
      en: 'My personal almanac',
    }),
    bindHint: pick(locale, {
      'zh-CN': '流日摘要。绑定生辰后可看专属星级与时辰。',
      'zh-Hant': '流日摘要。綁定生辰後可看專屬星級與時辰。',
      en: 'Flow-day summary. Bind birth data for stars and personal hours.',
    }),
    match: pick(locale, { 'zh-CN': '今日匹配', 'zh-Hant': '今日匹配', en: 'Today match' }),
    dayMaster: pick(locale, { 'zh-CN': '日主', 'zh-Hant': '日主', en: 'Day master' }),
    dayPillar: pick(locale, { 'zh-CN': '日柱', 'zh-Hant': '日柱', en: 'Day pillar' }),
    zhiXingXiu: pick(locale, {
      'zh-CN': '建除 · 宿',
      'zh-Hant': '建除 · 宿',
      en: 'Zhi-xing · Mansion',
    }),
    chongSha: pick(locale, { 'zh-CN': '冲煞', 'zh-Hant': '衝煞', en: 'Clash / sha' }),
    pageUrl: pick(locale, {
      'zh-CN': '本页地址：',
      'zh-Hant': '本頁地址：',
      en: 'Page URL: ',
    }),
    shareSeo: pick(locale, {
      'zh-CN': '（可分享、可收录）',
      'zh-Hant': '（可分享、可收錄）',
      en: '(shareable & indexable)',
    }),
    favors: pick(locale, { 'zh-CN': '今日可借力', 'zh-Hant': '今日可借力', en: 'Lean into' }),
    watchouts: pick(locale, { 'zh-CN': '今日宜注意', 'zh-Hant': '今日宜注意', en: 'Go easy on' }),
    yi: pick(locale, { 'zh-CN': '通书 · 宜', 'zh-Hant': '通書 · 宜', en: 'Tong-shu · Auspicious' }),
    ji: pick(locale, { 'zh-CN': '通书 · 忌', 'zh-Hant': '通書 · 忌', en: 'Tong-shu · Inauspicious' }),
    deities: pick(locale, {
      'zh-CN': '吉神 · 凶煞 · 方位',
      'zh-Hant': '吉神 · 凶煞 · 方位',
      en: 'Deities · Sha · Directions',
    }),
    jiShen: pick(locale, { 'zh-CN': '吉神', 'zh-Hant': '吉神', en: 'Benefic deities' }),
    xiongSha: pick(locale, { 'zh-CN': '凶煞', 'zh-Hant': '凶煞', en: 'Malefic sha' }),
    directions: pick(locale, {
      'zh-CN': '喜 / 福 / 财',
      'zh-Hant': '喜 / 福 / 財',
      en: 'Joy / Fortune / Wealth',
    }),
    pengZu: pick(locale, { 'zh-CN': '彭祖百忌', 'zh-Hant': '彭祖百忌', en: 'Peng Zu taboos' }),
    hours: pick(locale, { 'zh-CN': '十二时辰', 'zh-Hant': '十二時辰', en: 'Twelve double-hours' }),
    hoursHint: pick(locale, {
      'zh-CN': '黄道 / 黑道为通书；右侧为你的结构排序（有命盘时）',
      'zh-Hant': '黃道 / 黑道為通書；右側為你的結構排序（有命盤時）',
      en: 'Huangdao/black from tong-shu; personal ranks when chart linked',
    }),
    huangdao: pick(locale, { 'zh-CN': '黄道', 'zh-Hant': '黃道', en: 'Huangdao' }),
    heidao: pick(locale, { 'zh-CN': '黑道', 'zh-Hant': '黑道', en: 'Black path' }),
    mid: pick(locale, { 'zh-CN': '平', 'zh-Hant': '平', en: 'Mid' }),
    personal: pick(locale, { 'zh-CN': '个人', 'zh-Hant': '個人', en: 'You' }),
    stancePush: pick(locale, { 'zh-CN': '可推进', 'zh-Hant': '可推進', en: 'Push' }),
    stanceConserve: pick(locale, { 'zh-CN': '宜守成', 'zh-Hant': '宜守成', en: 'Conserve' }),
    stanceSteady: pick(locale, { 'zh-CN': '稳节奏', 'zh-Hant': '穩節奏', en: 'Steady' }),
    lunar: pick(locale, { 'zh-CN': '农历', 'zh-Hant': '農曆', en: 'Lunar' }),
    moreFields: pick(locale, {
      'zh-CN': '胎神 · 六曜 · 九星 · 星座',
      'zh-Hant': '胎神 · 六曜 · 九星 · 星座',
      en: 'Fetal god · Rokuyō · Nine star · Sun sign',
    }),
    tai: pick(locale, { 'zh-CN': '胎神', 'zh-Hant': '胎神', en: 'Fetal god' }),
    liuYao: pick(locale, { 'zh-CN': '六曜', 'zh-Hant': '六曜', en: 'Rokuyō' }),
    nineStar: pick(locale, { 'zh-CN': '九星', 'zh-Hant': '九星', en: 'Nine star' }),
    western: pick(locale, { 'zh-CN': '星座', 'zh-Hant': '星座', en: 'Sun sign' }),
    season: pick(locale, { 'zh-CN': '物候/季节', 'zh-Hant': '物候/季節', en: 'Season / phenology' }),
  };
}

export function almanacLensCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': 'AI 个人黄历镜头',
      'zh-Hant': 'AI 個人黃曆鏡頭',
      en: 'AI personal almanac lenses',
    }),
    title: pick(locale, {
      'zh-CN': '点选固定视角，读懂今天与你的匹配',
      'zh-Hant': '點選固定視角，讀懂今天與你的匹配',
      en: 'Pick a fixed lens to read today’s match',
    }),
    hasChart: pick(locale, {
      'zh-CN': '已接入你的命盘结构；镜头只解读，不改写四柱。',
      'zh-Hant': '已接入你的命盤結構；鏡頭只解讀，不改寫四柱。',
      en: 'Chart linked; lenses interpret only — never rewrite pillars.',
    }),
    noChart: pick(locale, {
      'zh-CN': '未绑定命盘时仍可看公共节奏；绑定后叙述会贴合日主与用神。',
      'zh-Hant': '未綁定命盤時仍可看公共節奏；綁定後敘述會貼合日主與用神。',
      en: 'Public rhythm without a chart; bind birth data for day-master tone.',
    }),
    loading: pick(locale, {
      'zh-CN': '正在写你的个人黄历…',
      'zh-Hant': '正在寫你的個人黃曆…',
      en: 'Writing your personal day note…',
    }),
    template: pick(locale, {
      'zh-CN': ' · 结构模板',
      'zh-Hant': ' · 結構模板',
      en: ' · template',
    }),
  };
}

export function almanacDaySeoCopy(
  locale: SiteLocale,
  input: {
    date: string;
    dayGanZhi: string;
    lunarText: string;
    yi: string[];
    ji: string[];
    liuYao?: string;
    western?: string;
  },
) {
  const yi = translateYiJiList(input.yi, locale).slice(0, 4).join(locale === 'en' ? ', ' : '、');
  const ji = translateYiJiList(input.ji, locale).slice(0, 3).join(locale === 'en' ? ', ' : '、');

  if (locale === 'en') {
    return {
      title: `${input.date} Chinese Almanac | ${input.dayGanZhi} · Yi/Ji & Hours | Life K-Line`,
      description: `${input.date} (lunar ${input.lunarText}), day pillar ${input.dayGanZhi}. Auspicious: ${yi || '—'}. Avoid: ${ji || '—'}. Twelve double-hours, Rokuyō${input.liuYao ? ` ${input.liuYao}` : ''}, sun sign${input.western ? ` ${input.western}` : ''}. Bind birth data for personal day fortune.`,
      keywords: [
        'Chinese almanac',
        'tong shu',
        input.date,
        input.dayGanZhi,
        'auspicious hours',
        'yi ji',
        'personal bazi day',
        'Life K-Line',
      ],
    };
  }

  const t = locale === 'zh-Hant';
  const titleBase = t
    ? `${input.date}黃曆｜${input.dayGanZhi}日 · 宜忌時辰·個人日運｜人生K線萬年曆`
    : `${input.date}黄历｜${input.dayGanZhi}日 · 宜忌时辰·个人日运｜人生K线万年历`;
  const desc = t
    ? `${input.date}（農曆${input.lunarText}）日柱${input.dayGanZhi}。宜${yi || '—'}；忌${ji || '—'}。查十二時辰、六曜${input.liuYao || ''}、星座摘要；綁定生辰看個人結構日運。`
    : `${input.date}（农历${input.lunarText}）日柱${input.dayGanZhi}。宜${yi || '—'}；忌${ji || '—'}。查十二时辰、六曜${input.liuYao || ''}、星座摘要；绑定生辰看个人结构日运。`;

  return {
    title: titleBase,
    description: desc,
    keywords: [
      t ? '萬年曆' : '万年历',
      t ? '黃曆' : '黄历',
      input.date,
      input.dayGanZhi,
      t ? '宜忌' : '宜忌',
      t ? '吉時' : '吉时',
      t ? '個人日運' : '个人日运',
      '六曜',
      ...input.yi.slice(0, 3),
    ],
  };
}

export function almanacFaqCopy(
  locale: SiteLocale,
  date: string,
  pack: { yi: string[]; ji: string[]; hours: Array<{ luck: string; timeLabel: string; ganZhi: string }> },
) {
  const yi = translateYiJiList(pack.yi, locale).slice(0, 6).join(locale === 'en' ? ', ' : '、');
  const hours = pack.hours
    .filter((h) => h.luck === 'auspicious')
    .map((h) => `${h.timeLabel}${h.ganZhi}`)
    .join(locale === 'en' ? '; ' : '、');

  if (locale === 'en') {
    return [
      {
        question: `What is suitable on ${date}?`,
        answer: `Tong-shu auspicious items: ${yi || 'keep affairs light'}. Whether you push still depends on your day-master structure and real-world constraints.`,
      },
      {
        question: `Which hours look better on ${date}?`,
        answer: `Huangdao-leaning hours: ${hours || 'see the hour table'}. With a linked chart we re-rank hours by useful-god fit.`,
      },
      {
        question: 'Personal vs public almanac?',
        answer:
          'Public layer is tong-shu yi/ji and twelve hours. Personal layer overlays your day master / useful gods on the flow day for push / steady / conserve rhythm.',
      },
      {
        question: 'Is this medical or investment advice?',
        answer: 'No. Almanac + structure are rhythm tools only — not medical, legal, or investment advice.',
      },
    ];
  }

  const t = locale === 'zh-Hant';
  return [
    {
      question: t ? `${date}適合做什麼？` : `${date}适合做什么？`,
      answer: t
        ? `通書宜：${yi || '從簡行事'}。是否推進仍須結合你的日主結構與現實約束。`
        : `通书宜：${yi || '从简行事'}。是否推进仍须结合你的日主结构与现实约束。`,
    },
    {
      question: t ? `${date}有哪些吉時？` : `${date}有哪些吉时？`,
      answer: t
        ? `黃道時辰：${hours || '見當日時辰表'}。綁定命盤後會按用神重排個人較順時段。`
        : `黄道时辰：${hours || '见当日时辰表'}。绑定命盘后会按用神重排个人较顺时段。`,
    },
    {
      question: t ? '個人黃曆和公共黃曆有什麼區別？' : '个人黄历和公共黄历有什么区别？',
      answer: t
        ? '公共層是通書宜忌與十二時辰；個人層用你的日主/用神疊流日，給出推進/守成傾向與時辰排序。'
        : '公共层是通书宜忌与十二时辰；个人层用你的日主/用神叠流日，给出推进/守成倾向与时辰排序。',
    },
    {
      question: t ? '這是醫療或投資建議嗎？' : '这是医疗或投资建议吗？',
      answer: t
        ? '不是。黃曆與結構只服務節奏管理，不構成醫療、法律或投資建議。'
        : '不是。黄历与结构只服务节奏管理，不构成医疗、法律或投资建议。',
    },
  ];
}
