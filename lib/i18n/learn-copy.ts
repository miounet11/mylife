/**
 * EN/zh chrome for learn hub (/learn) and track pages (/learn/[track]).
 * Step labels stay source Chinese unless separately localized later.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { LearningTrack, LearningTrackKey } from '@/lib/learning-tracks';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + nav for /learn */
export function learnPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '学习专题 | 人生K线',
      'zh-Hant': '學習專題 | 人生K線',
      en: 'Learning topics | Life K-Line',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '入门、事业、财富、关系、健康、迁移与应用等专题阅读。',
      'zh-Hant': '入門、事業、財富、關係、健康、遷移與應用等專題閱讀。',
      en: 'Guided tracks: intro, career, wealth, relationships, health, migration, and applications.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始判断',
      'zh-Hant': '開始判斷',
      en: 'Start analysis',
    }),
    title: pick(locale, {
      'zh-CN': '专题',
      'zh-Hant': '專題',
      en: 'Topics',
    }),
    description: pick(locale, {
      'zh-CN': '按主题阅读。可先看报告，再打开对应专题。',
      'zh-Hant': '按主題閱讀。可先看報告，再打開對應專題。',
      en: 'Read by theme. Start with a report, then open the matching track.',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '专题路径',
      'zh-Hant': '專題路徑',
      en: 'Learning tracks',
    }),
    linkKnowledge: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge',
    }),
    linkCases: pick(locale, {
      'zh-CN': '案例',
      en: 'Cases',
    }),
    linkWorldYi: pick(locale, {
      'zh-CN': '世界易',
      en: 'World Yi',
    }),
    linkTeachers: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),
    quickGenerate: pick(locale, {
      'zh-CN': '生成报告',
      'zh-Hant': '生成報告',
      en: 'Generate report',
    }),
    summaryAvailable: (learnable: number, total: number) =>
      pick(locale, {
        'zh-CN': `${learnable} 条可用专题 · 共 ${total} 条`,
        'zh-Hant': `${learnable} 條可用專題 · 共 ${total} 條`,
        en: `${learnable} tracks ready · ${total} total`,
      }),
    stepsMinutes: (published: number, total: number, minutes: number) =>
      pick(locale, {
        'zh-CN': `${published}/${total} · 约 ${minutes} 分`,
        'zh-Hant': `${published}/${total} · 約 ${minutes} 分`,
        en: `${published}/${total} · ~${minutes} min`,
      }),
    minutesShort: (minutes: number) =>
      pick(locale, {
        'zh-CN': `${minutes} 分`,
        en: `${minutes} min`,
      }),
  };
}

/** Track detail chrome for /learn/[track] */
export function learnTrackPageCopy(locale: SiteLocale) {
  return {
    headerCta: pick(locale, {
      'zh-CN': '开始判断',
      'zh-Hant': '開始判斷',
      en: 'Start analysis',
    }),
    backToTopics: pick(locale, {
      'zh-CN': '专题',
      'zh-Hant': '專題',
      en: 'Topics',
    }),
    notFoundTitle: pick(locale, {
      'zh-CN': '专题未找到 | 人生K线',
      'zh-Hant': '專題未找到 | 人生K線',
      en: 'Topic not found | Life K-Line',
    }),
    metaTitleSuffix: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life K-Line',
    }),
    progressSuffix: (published: number, total: number, minutes: number) =>
      pick(locale, {
        'zh-CN': ` · ${published}/${total} 步 · 约 ${minutes} 分钟`,
        'zh-Hant': ` · ${published}/${total} 步 · 約 ${minutes} 分鐘`,
        en: ` · ${published}/${total} steps · ~${minutes} min`,
      }),
    startFirstStep: pick(locale, {
      'zh-CN': '从第一步开始',
      'zh-Hant': '從第一步開始',
      en: 'Start with step 1',
    }),
    trackHub: pick(locale, {
      'zh-CN': '专题入口',
      'zh-Hant': '專題入口',
      en: 'Track hub',
    }),
    generateReport: pick(locale, {
      'zh-CN': '生成报告',
      'zh-Hant': '生成報告',
      en: 'Generate report',
    }),
    linkEvents: pick(locale, {
      'zh-CN': '事件本',
      'zh-Hant': '事件本',
      en: 'Events',
    }),
    linkTeachers: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),
    linkChat: pick(locale, {
      'zh-CN': '对话',
      'zh-Hant': '對話',
      en: 'Chat',
    }),
  };
}

type TrackPresentation = {
  title: string;
  subtitle: string;
  description: string;
};

const TRACK_PRESENTATION: Record<LearningTrackKey, { 'zh-CN': TrackPresentation; en: TrackPresentation; 'zh-Hant'?: Partial<TrackPresentation> }> = {
  intro: {
    'zh-CN': {
      title: '入门轨',
      subtitle: '基础概念与读盘顺序',
      description: '日主、用神、大运流年、报告读法与世界易基础，适合第一次阅读完整报告的用户。',
    },
    en: {
      title: 'Intro track',
      subtitle: 'Foundations & reading order',
      description:
        'Day master, useful god, luck cycles, report reading, and World Yi basics—for a first full report.',
    },
  },
  career: {
    'zh-CN': {
      title: '事业轨',
      subtitle: '角色匹配 · 阶段重排',
      description: '从事业观到阶段判断，再用案例和工具验证职业推进节奏。',
    },
    en: {
      title: 'Career track',
      subtitle: 'Role fit · stage reset',
      description: 'From career framing to stage judgment, then cases and tools to validate pace.',
    },
  },
  wealth: {
    'zh-CN': {
      title: '财富轨',
      subtitle: '节奏 · 守财 · 扩张',
      description: '理解财富进入方式、保留能力与扩张节奏，避免把短期波动当长期结构。',
    },
    en: {
      title: 'Wealth track',
      subtitle: 'Rhythm · retention · expansion',
      description:
        'How wealth enters, stays, and expands—without treating short swings as long structure.',
    },
  },
  relationship: {
    'zh-CN': {
      title: '关系轨',
      subtitle: '节奏 · 边界 · 修复',
      description: '关系问题先看排序与节奏，再看合不合；用案例理解冲突与修复路径。',
    },
    en: {
      title: 'Relationships track',
      subtitle: 'Pace · boundaries · repair',
      description: 'Order and pacing first, fit second—cases for conflict and repair paths.',
    },
  },
  family: {
    'zh-CN': {
      title: '家庭轨',
      subtitle: '代际 · 分工 · 家宅',
      description: '现代家庭难点在代际责任、亲密边界与排序能力，家宅是长期环境层。',
    },
    en: {
      title: 'Family track',
      subtitle: 'Generations · roles · home',
      description:
        'Generational duty, intimacy boundaries, and role order; home as a long environment layer.',
    },
  },
  health: {
    'zh-CN': {
      title: '健康轨',
      subtitle: '恢复 · 节奏 · 边界',
      description: '谈节奏、恢复与风险信号，强调系统层面观察，不替代医疗诊断。',
    },
    en: {
      title: 'Health track',
      subtitle: 'Recovery · rhythm · boundaries',
      description:
        'Rhythm, recovery, and risk signals at the system level—not a medical diagnosis.',
    },
  },
  migration: {
    'zh-CN': {
      title: '迁移轨',
      subtitle: '留回 · 身份 · 环境',
      description: '迁移不是换地图，而是重新匹配你与环境的成本结构；海外华人专题在此展开。',
    },
    en: {
      title: 'Migration track',
      subtitle: 'Stay/return · identity · place',
      description:
        'Not just changing maps—rematching your cost structure to place; overseas Chinese topics here.',
    },
  },
  application: {
    'zh-CN': {
      title: '应用轨',
      subtitle: '择时 · 起名 · 家宅',
      description: '把择时、起名、寻物、家宅写成可复用的生活判断，而非神秘感。',
    },
    en: {
      title: 'Applications track',
      subtitle: 'Timing · naming · home order',
      description:
        'Timing, naming, lost-and-found, and home order as reusable life judgments—not mystique.',
    },
  },
  classics: {
    'zh-CN': {
      title: '典籍轨',
      subtitle: '64卦 · 节气 · 紫微',
      description: '传统命理百科按世界易结构读法接入，从词典走向判断框架。',
    },
    en: {
      title: 'Classics track',
      subtitle: '64 hexagrams · solar terms · Ziwei',
      description:
        'Traditional encyclopedia topics via World Yi structure—from glossary toward judgment frame.',
    },
  },
};

/**
 * Localized title/subtitle/description for a learning track key.
 * Falls back to source track fields when the key is unknown.
 */
export function presentTrack(
  track: Pick<LearningTrack, 'key' | 'title' | 'subtitle' | 'description'>,
  locale: SiteLocale,
): TrackPresentation {
  const map = TRACK_PRESENTATION[track.key as LearningTrackKey];
  if (!map) {
    if (locale === 'zh-Hant') {
      return {
        title: toSiteLocaleText(track.title, 'zh-Hant'),
        subtitle: toSiteLocaleText(track.subtitle, 'zh-Hant'),
        description: toSiteLocaleText(track.description, 'zh-Hant'),
      };
    }
    return {
      title: track.title,
      subtitle: track.subtitle,
      description: track.description,
    };
  }

  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') {
    const base = map['zh-CN'];
    const hant = map['zh-Hant'];
    return {
      title: hant?.title || toSiteLocaleText(base.title, 'zh-Hant'),
      subtitle: hant?.subtitle || toSiteLocaleText(base.subtitle, 'zh-Hant'),
      description: hant?.description || toSiteLocaleText(base.description, 'zh-Hant'),
    };
  }
  return map['zh-CN'];
}
