import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export function homeExploreCopy(locale: SiteLocale) {
  return {
    aria: pick(locale, { 'zh-CN': '继续探索', 'zh-Hant': '繼續探索', en: 'Keep exploring' }),
    kicker: pick(locale, {
      'zh-CN': 'PATHWAYS · 专项决策路径',
      'zh-Hant': 'PATHWAYS · 專項決策路徑',
      en: 'PATHWAYS · Decision tracks',
    }),
    title: pick(locale, {
      'zh-CN': '先定全局盘，再选一条具体方向',
      'zh-Hant': '先定全局盤，再選一條具體方向',
      en: 'Lock the natal chart, then pick one concrete path',
    }),
    desc: pick(locale, {
      'zh-CN': '围绕事业、财富、婚恋、年度与空间，提供针对性推演与行动建议',
      'zh-Hant': '圍繞事業、財富、婚戀、年度與空間，提供針對性推演與行動建議',
      en: 'Career, wealth, relationship, yearly timing, and space — with actions, not slogans',
    }),
    generate: pick(locale, {
      'zh-CN': '直接生成我的报告',
      'zh-Hant': '直接生成我的報告',
      en: 'Generate my report',
    }),
    enter: pick(locale, { 'zh-CN': '进入分析', 'zh-Hant': '進入分析', en: 'Open analysis' }),
    toolsTitle: pick(locale, {
      'zh-CN': '常用工具与知识矩阵',
      'zh-Hant': '常用工具與知識矩陣',
      en: 'Tools and knowledge',
    }),
    allTools: pick(locale, { 'zh-CN': '查看全部工具 →', 'zh-Hant': '查看全部工具 →', en: 'All tools →' }),
    paths: [
      {
        href: '/analyze?intent=career&source=home_explore_path',
        title: pick(locale, { 'zh-CN': '事业节奏研判', 'zh-Hant': '事業節奏研判', en: 'Career rhythm' }),
        desc: pick(locale, {
          'zh-CN': '升职、跳槽、创业窗口期与用神匹配',
          'zh-Hant': '升職、跳槽、創業窗口期與用神匹配',
          en: 'Promotion, job change, and founding windows vs. useful-god fit',
        }),
        tag: pick(locale, { 'zh-CN': '职场与定位', 'zh-Hant': '職場與定位', en: 'Work & positioning' }),
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      },
      {
        href: '/analyze?intent=wealth&source=home_explore_path',
        title: pick(locale, { 'zh-CN': '财富走势窗口', 'zh-Hant': '財富走勢窗口', en: 'Wealth windows' }),
        desc: pick(locale, {
          'zh-CN': '宜推或宜守阶段，规避盲目杠杆风险',
          'zh-Hant': '宜推或宜守階段，規避盲目槓桿風險',
          en: 'When to push or hold — avoid blind leverage',
        }),
        tag: pick(locale, { 'zh-CN': '资金与投资', 'zh-Hant': '資金與投資', en: 'Capital' }),
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
      },
      {
        href: '/hehun?source=home_explore_path',
        title: pick(locale, { 'zh-CN': '合婚双盘对比', 'zh-Hant': '合婚雙盤對比', en: 'Match two charts' }),
        desc: pick(locale, {
          'zh-CN': '双方生辰对参：日主、夫妻宫与用忌互补',
          'zh-Hant': '雙方生辰對參：日主、夫妻宮與用忌互補',
          en: 'Day masters, spouse palaces, and useful/avoiding gods together',
        }),
        tag: pick(locale, { 'zh-CN': '关系与婚恋', 'zh-Hant': '關係與婚戀', en: 'Relationships' }),
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/60',
      },
      {
        href: '/analyze?intent=yearly&source=home_explore_path',
        title: pick(locale, { 'zh-CN': '年度流年节奏', 'zh-Hant': '年度流年節奏', en: 'Yearly timing' }),
        desc: pick(locale, {
          'zh-CN': '今年能量高低、关键时机与行动次序',
          'zh-Hant': '今年能量高低、關鍵時機與行動次序',
          en: 'This year’s highs, lows, and the order of moves',
        }),
        tag: pick(locale, { 'zh-CN': '流年与岁运', 'zh-Hant': '流年與歲運', en: 'Annual luck' }),
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/60',
      },
      {
        href: '/tools/fengshui-space?source=home_explore_path',
        title: pick(locale, { 'zh-CN': '空间场与选址', 'zh-Hant': '空間場與選址', en: 'Space & site' }),
        desc: pick(locale, {
          'zh-CN': '户型气场、城市选址与人宅五行合参',
          'zh-Hant': '戶型氣場、城市選址與人宅五行合參',
          en: 'Layout, city choice, and person–house five-element fit',
        }),
        tag: pick(locale, { 'zh-CN': '环境与场域', 'zh-Hant': '環境與場域', en: 'Environment' }),
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/60',
      },
    ],
    tools: [
      {
        href: '/tools/naming?source=home_explore',
        title: pick(locale, { 'zh-CN': '起名工坊', 'zh-Hant': '起名工坊', en: 'Naming' }),
        subtitle: pick(locale, { 'zh-CN': '喜用起名', 'zh-Hant': '喜用起名', en: 'Useful-god names' }),
      },
      {
        href: '/almanac?source=home_explore',
        title: pick(locale, { 'zh-CN': '今日黄历', 'zh-Hant': '今日黃曆', en: 'Almanac' }),
        subtitle: pick(locale, { 'zh-CN': '择日宜忌', 'zh-Hant': '擇日宜忌', en: 'Day selection' }),
      },
      {
        href: '/tools/daily-sign?source=home_explore',
        title: pick(locale, { 'zh-CN': '今日一签', 'zh-Hant': '今日一籤', en: 'Daily lot' }),
        subtitle: pick(locale, { 'zh-CN': '每日启示', 'zh-Hant': '每日啟示', en: 'Daily note' }),
      },
      {
        href: '/knowledge?source=home_explore',
        title: pick(locale, { 'zh-CN': '知识库', 'zh-Hant': '知識庫', en: 'Knowledge' }),
        subtitle: pick(locale, { 'zh-CN': '命理研究', 'zh-Hant': '命理研究', en: 'Method notes' }),
      },
      {
        href: '/dimensions?source=home_explore',
        title: pick(locale, { 'zh-CN': '十维度', 'zh-Hant': '十維度', en: '10 dimensions' }),
        subtitle: pick(locale, { 'zh-CN': '场景深挖', 'zh-Hant': '場景深挖', en: 'Scene drills' }),
      },
      {
        href: '/teachers?source=home_explore',
        title: pick(locale, { 'zh-CN': '名师顾问', 'zh-Hant': '名師顧問', en: 'Consultants' }),
        subtitle: pick(locale, { 'zh-CN': '深度对谈', 'zh-Hant': '深度對談', en: 'Deep talk' }),
      },
      {
        href: '/tools?source=home_explore',
        title: pick(locale, { 'zh-CN': '全部工具', 'zh-Hant': '全部工具', en: 'All tools' }),
        subtitle: pick(locale, { 'zh-CN': '工具矩阵', 'zh-Hant': '工具矩陣', en: 'Tool grid' }),
      },
    ],
  };
}
