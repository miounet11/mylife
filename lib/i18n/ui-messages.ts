import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

/**
 * Chrome / shell copy. Keys are stable English-ish ids.
 * zh-Hant can omit entries (auto-converted from zh-CN).
 */
const MESSAGES: Record<string, { 'zh-CN': string; 'zh-Hant'?: string; en: string }> = {
  brandName: { 'zh-CN': '人生K线', 'zh-Hant': '人生K線', en: 'Life K-Line' },
  brandAria: { 'zh-CN': '回到人生K线首页', 'zh-Hant': '回到人生K線首頁', en: 'Back to Life K-Line home' },
  navWorkbench: { 'zh-CN': '工作台', en: 'Workbench' },
  navDimensions: { 'zh-CN': '十维度', 'zh-Hant': '十維度', en: '10 Dimensions' },
  navTools: { 'zh-CN': '工具中心', en: 'Tools' },
  navKnowledge: { 'zh-CN': '知识库', 'zh-Hant': '知識庫', en: 'Knowledge' },
  navPredictions: { 'zh-CN': '预测回访', 'zh-Hant': '預測回訪', en: 'Predictions' },
  navChat: { 'zh-CN': '结构追问', 'zh-Hant': '結構追問', en: 'Ask AI' },
  navCommunity: { 'zh-CN': '社区', 'zh-Hant': '社區', en: 'Community' },
  navProfile: { 'zh-CN': '我的档案', 'zh-Hant': '我的檔案', en: 'Profile' },
  navCases: { 'zh-CN': '案例', en: 'Cases' },
  navEvents: { 'zh-CN': '事件', en: 'Events' },
  navAnnual: { 'zh-CN': '年度复盘', 'zh-Hant': '年度複盤', en: 'Annual review' },
  navDocs: { 'zh-CN': '文档', 'zh-Hant': '文檔', en: 'Docs' },
  navWorldYi: { 'zh-CN': '世界易学说', 'zh-Hant': '世界易學說', en: 'World Yi' },
  navLearn: { 'zh-CN': '学习地图', 'zh-Hant': '學習地圖', en: 'Learn' },
  navMembership: { 'zh-CN': '会员', 'zh-Hant': '會員', en: 'Membership' },
  navSearch: { 'zh-CN': '站内搜索', 'zh-Hant': '站內搜尋', en: 'Search' },
  searchPlaceholder: {
    'zh-CN': '搜索：八字 / 紫微 / 六爻 / 风水 / 塔罗 …',
    'zh-Hant': '搜尋：八字 / 紫微 / 六爻 / 風水 / 塔羅 …',
    en: 'Search: Bazi / Ziwei / tools …',
  },
  ctaStart: { 'zh-CN': '立即开始', 'zh-Hant': '立即開始', en: 'Get started' },
  ctaGenerateReport: { 'zh-CN': '生成我的报告', 'zh-Hant': '生成我的報告', en: 'Generate my report' },
  ctaAnalyze: { 'zh-CN': '生成我的命盘', 'zh-Hant': '生成我的命盤', en: 'Create my chart' },
  login: { 'zh-CN': '邮箱登录', 'zh-Hant': '郵箱登入', en: 'Email login' },
  logout: { 'zh-CN': '退出', en: 'Log out' },
  language: { 'zh-CN': '语言', 'zh-Hant': '語言', en: 'Language' },
  footerTelegram: {
    'zh-CN': '官方 Telegram',
    'zh-Hant': '官方 Telegram',
    en: 'Official Telegram',
  },
  footerTelegramCta: {
    'zh-CN': '加入官方频道 @mylifekxian',
    'zh-Hant': '加入官方頻道 @mylifekxian',
    en: 'Join @mylifekxian',
  },
  footerTagline: {
    'zh-CN': '用结构、阶段与证据链帮助你看清人生节奏。先免费生成判断报告，再按需深入学习与验证。',
    'zh-Hant': '用結構、階段與證據鏈幫助你看清人生節奏。先免費生成判斷報告，再按需深入學習與驗證。',
    en: 'See life rhythm through structure, stages, and evidence. Start free, then go deeper as needed.',
  },
  footerLegal: {
    'zh-CN': '命理结构分析工具，不构成投资、医疗或法律建议。',
    'zh-Hant': '命理結構分析工具，不構成投資、醫療或法律建議。',
    en: 'Structural destiny analysis for reference only — not investment, medical, or legal advice.',
  },
  contentLangNote: {
    'zh-CN': '',
    en: 'Interface is English. Some long-form content may still appear in Chinese.',
  },
};

export type UiMessageKey = keyof typeof MESSAGES;

export function uiMessage(key: string, locale: SiteLocale): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  if (locale === 'en') return entry.en;
  if (locale === 'zh-Hant') {
    return entry['zh-Hant'] || toSiteLocaleText(entry['zh-CN'], 'zh-Hant');
  }
  return entry['zh-CN'];
}

/** Phrase map used by AutoLocalize for English chrome leftovers on the page. */
export function buildEnglishPhraseMap(): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const entry of Object.values(MESSAGES)) {
    if (entry['zh-CN'] && entry.en && entry['zh-CN'] !== entry.en) {
      pairs.push([entry['zh-CN'], entry.en]);
      const tc = entry['zh-Hant'] || toSiteLocaleText(entry['zh-CN'], 'zh-Hant');
      if (tc && tc !== entry.en) pairs.push([tc, entry.en]);
    }
  }
  // Extra high-frequency CTAs / labels seen across pages
  const extras: Array<[string, string]> = [
    ['生成我的报告', 'Generate my report'],
    ['生成我的命盘', 'Create my chart'],
    ['打开报告', 'Open report'],
    ['查看完整报告', 'View full report'],
    ['免费开始', 'Start free'],
    ['立即生成', 'Generate now'],
    ['登录', 'Log in'],
    ['注册', 'Sign up'],
    ['订阅', 'Subscribe'],
    ['管理订阅', 'Manage subscription'],
    ['首页', 'Home'],
    ['返回', 'Back'],
    ['加载中…', 'Loading…'],
    ['加载中', 'Loading'],
    ['暂无数据', 'No data yet'],
    ['保存', 'Save'],
    ['提交', 'Submit'],
    ['取消', 'Cancel'],
    ['确认', 'Confirm'],
    ['下一步', 'Next'],
    ['上一步', 'Back'],
    ['了解更多', 'Learn more'],
    ['专业老师', 'Expert teacher'],
    ['官方答主', 'Official'],
    ['解读', 'Reading'],
    ['距提问', 'since asked'],
    ['分钟前', 'm ago'],
    ['小时前', 'h ago'],
    ['天前', 'd ago'],
    ['刚刚', 'just now'],
  ];
  pairs.push(...extras);
  // Longer first for replace safety
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}
