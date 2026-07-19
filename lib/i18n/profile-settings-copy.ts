/**
 * EN/zh chrome for /profile/settings (page hero + panel high-traffic chrome).
 * Keep API/user field values, option catalogs (accuracy/intent/domains), and
 * document category labels as-is when still Chinese in shared constants.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + header CTA for /profile/settings */
export function profileSettingsPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '测算资料设置｜人生K线',
      'zh-Hant': '測算資料設置｜人生K線',
      en: 'Chart profile settings | Life K-Line',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '修改出生基础信息、补充职业与目标资料，让报告和运势提醒更贴近你的真实处境。',
      'zh-Hant': '修改出生基礎信息、補充職業與目標資料，讓報告和運勢提醒更貼近你的真實處境。',
      en: 'Update birth basics and career/goal supplements so reports and timing alerts fit your real situation.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始分析',
      'zh-Hant': '開始分析',
      en: 'Start analysis',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '测算资料',
      'zh-Hant': '測算資料',
      en: 'Chart details',
    }),
    title: pick(locale, {
      'zh-CN': '出生信息与补充资料',
      'zh-Hant': '出生信息與補充資料',
      en: 'Birth info & supplements',
    }),
    descriptionAuthed: pick(locale, {
      'zh-CN': '修改出生信息会触发排盘重算；补充资料只影响建议表达，不改变四柱结构。',
      'zh-Hant': '修改出生信息會觸發排盤重算；補充資料只影響建議表達，不改變四柱結構。',
      en: 'Changing birth data triggers a chart recompute; supplements only affect how advice is phrased—not the four pillars.',
    }),
    descriptionGuest: pick(locale, {
      'zh-CN': '未登录也可管理本浏览器会话内的档案。登录后可跨设备同步。',
      'zh-Hant': '未登入也可管理本瀏覽器會話內的檔案。登入後可跨裝置同步。',
      en: 'Manage session profiles in this browser without signing in. Sign in to sync across devices.',
    }),
    backToProfile: pick(locale, {
      'zh-CN': '返回档案',
      'zh-Hant': '返回檔案',
      en: 'Back to profile',
    }),
    askTeachers: pick(locale, {
      'zh-CN': '请老师补充',
      'zh-Hant': '請老師補充',
      en: 'Ask a consultant',
    }),
  };
}

/** Client panel chrome: tabs, CTAs, dialogs, errors, section labels */
export function profileSettingsPanelCopy(locale: SiteLocale) {
  return {
    // —— Loading / empty ——
    loading: pick(locale, {
      'zh-CN': '正在读取测算资料…',
      'zh-Hant': '正在讀取測算資料…',
      en: 'Loading chart profile…',
    }),
    emptyTitle: pick(locale, {
      'zh-CN': '还没有测算档案',
      'zh-Hant': '還沒有測算檔案',
      en: 'No chart profile yet',
    }),
    emptyDescription: pick(locale, {
      'zh-CN': '先完成一次测算，之后可在此修改与补充资料。',
      'zh-Hant': '先完成一次測算，之後可在此修改與補充資料。',
      en: 'Run an analysis first, then edit and supplement your details here.',
    }),
    emptyCta: pick(locale, {
      'zh-CN': '去测算',
      'zh-Hant': '去測算',
      en: 'Start analysis',
    }),

    // —— Panel header ——
    panelEyebrow: pick(locale, {
      'zh-CN': '测算资料',
      'zh-Hant': '測算資料',
      en: 'Chart details',
    }),
    panelTitle: pick(locale, {
      'zh-CN': '基础信息、补充与文档',
      'zh-Hant': '基礎信息、補充與文檔',
      en: 'Basics, supplements & documents',
    }),
    panelHint: pick(locale, {
      'zh-CN': '也可在和老师对话时逐步补充。',
      'zh-Hant': '也可在和老師對話時逐步補充。',
      en: 'You can also fill these in gradually while chatting with a consultant.',
    }),
    completeness: (pct: number) =>
      pick(locale, {
        'zh-CN': `完整度 ${pct}%`,
        'zh-Hant': `完整度 ${pct}%`,
        en: `Completeness ${pct}%`,
      }),
    recalcPending: (status: string) =>
      pick(locale, {
        'zh-CN': `命盘重算中（${status}）`,
        'zh-Hant': `命盤重算中（${status}）`,
        en: `Recomputing chart (${status})`,
      }),
    selfLabel: pick(locale, {
      'zh-CN': '本人',
      'zh-Hant': '本人',
      en: 'Self',
    }),

    // —— Tabs ——
    tabBasic: pick(locale, {
      'zh-CN': '基础信息',
      'zh-Hant': '基礎信息',
      en: 'Basics',
    }),
    tabSupplements: pick(locale, {
      'zh-CN': '补充资料',
      'zh-Hant': '補充資料',
      en: 'Supplements',
    }),
    tabDocuments: pick(locale, {
      'zh-CN': '附加文档',
      'zh-Hant': '附加文檔',
      en: 'Documents',
    }),
    tabArchives: pick(locale, {
      'zh-CN': '档案管理',
      'zh-Hant': '檔案管理',
      en: 'Profiles',
    }),
    tabHistory: pick(locale, {
      'zh-CN': '变更记录',
      'zh-Hant': '變更記錄',
      en: 'Change log',
    }),

    // —— Birth / basic form labels ——
    engineChangedWarning: pick(locale, {
      'zh-CN': '你修改了影响排盘的信息。保存后将触发命盘重算。',
      'zh-Hant': '你修改了影響排盤的信息。保存後將觸發命盤重算。',
      en: 'You changed chart-critical fields. Saving will trigger a recompute.',
    }),
    pillarSummary: (summary: string) =>
      pick(locale, {
        'zh-CN': `当前四柱摘要：${summary}`,
        'zh-Hant': `當前四柱摘要：${summary}`,
        en: `Current pillars: ${summary}`,
      }),
    labelName: pick(locale, {
      'zh-CN': '姓名',
      'zh-Hant': '姓名',
      en: 'Name',
    }),
    labelRelationNote: pick(locale, {
      'zh-CN': '关系备注',
      'zh-Hant': '關係備註',
      en: 'Relation note',
    }),
    labelGender: pick(locale, {
      'zh-CN': '性别',
      'zh-Hant': '性別',
      en: 'Gender',
    }),
    genderMale: pick(locale, {
      'zh-CN': '男',
      en: 'Male',
    }),
    genderFemale: pick(locale, {
      'zh-CN': '女',
      en: 'Female',
    }),
    labelBirthDate: pick(locale, {
      'zh-CN': '出生日期',
      'zh-Hant': '出生日期',
      en: 'Birth date',
    }),
    labelBirthTime: pick(locale, {
      'zh-CN': '出生时间',
      'zh-Hant': '出生時間',
      en: 'Birth time',
    }),
    labelBirthPlace: pick(locale, {
      'zh-CN': '出生地点',
      'zh-Hant': '出生地點',
      en: 'Birth place',
    }),
    labelBirthAccuracy: pick(locale, {
      'zh-CN': '出生时间可信度',
      'zh-Hant': '出生時間可信度',
      en: 'Birth-time accuracy',
    }),
    labelIntent: pick(locale, {
      'zh-CN': '当前测算关注',
      'zh-Hant': '當前測算關注',
      en: 'Current focus',
    }),

    // —— Supplements ——
    supplementsIntro: pick(locale, {
      'zh-CN': '六类补充资料不会改动排盘，但会让报告、运势邮件和追问回复更贴近你的真实处境。',
      'zh-Hant': '六類補充資料不會改動排盤，但會讓報告、運勢郵件和追問回覆更貼近你的真實處境。',
      en: 'Six supplement areas don’t change the chart, but make reports, timing emails, and follow-ups closer to your real situation.',
    }),
    recommendPriority: pick(locale, {
      'zh-CN': '根据你的测算关注，建议优先补充',
      'zh-Hant': '根據你的測算關注，建議優先補充',
      en: 'Based on your focus, prioritize these supplements',
    }),

    // —— Documents ——
    documentsIntro: pick(locale, {
      'zh-CN': '附加文档像你的个人说明书。纳入测算的文档会进入报告与邮件上下文（最多 20 篇，置顶 3 篇）。',
      'zh-Hant': '附加文檔像你的個人說明書。納入測算的文檔會進入報告與郵件上下文（最多 20 篇，置頂 3 篇）。',
      en: 'Attached docs are your personal brief. Engine-visible ones enter report/email context (max 20, 3 pinned).',
    }),
    extractFromReport: pick(locale, {
      'zh-CN': '从当前报告提取',
      'zh-Hant': '從當前報告提取',
      en: 'Extract from current report',
    }),
    visibilityEngine: pick(locale, {
      'zh-CN': '参与测算',
      'zh-Hant': '參與測算',
      en: 'Used in charts',
    }),
    visibilityPrivate: pick(locale, {
      'zh-CN': '仅自己可见',
      'zh-Hant': '僅自己可見',
      en: 'Private only',
    }),
    wordCount: (n: number) =>
      pick(locale, {
        'zh-CN': `${n} 字`,
        'zh-Hant': `${n} 字`,
        en: `${n} chars`,
      }),
    edit: pick(locale, {
      'zh-CN': '编辑',
      'zh-Hant': '編輯',
      en: 'Edit',
    }),
    editDocument: pick(locale, {
      'zh-CN': '编辑文档',
      'zh-Hant': '編輯文檔',
      en: 'Edit document',
    }),
    newDocument: pick(locale, {
      'zh-CN': '新建文档',
      'zh-Hant': '新建文檔',
      en: 'New document',
    }),
    labelTitle: pick(locale, {
      'zh-CN': '标题',
      'zh-Hant': '標題',
      en: 'Title',
    }),
    labelCategory: pick(locale, {
      'zh-CN': '分类',
      'zh-Hant': '分類',
      en: 'Category',
    }),
    labelVisibility: pick(locale, {
      'zh-CN': '可见性',
      'zh-Hant': '可見性',
      en: 'Visibility',
    }),
    visibilityEngineOption: pick(locale, {
      'zh-CN': '纳入后续测算与邮件',
      'zh-Hant': '納入後續測算與郵件',
      en: 'Include in future charts & emails',
    }),
    visibilityPrivateOption: pick(locale, {
      'zh-CN': '仅自己可见',
      'zh-Hant': '僅自己可見',
      en: 'Private only',
    }),
    labelBody: (len: number, max: number) =>
      pick(locale, {
        'zh-CN': `正文（${len}/${max}）`,
        'zh-Hant': `正文（${len}/${max}）`,
        en: `Body (${len}/${max})`,
      }),
    pinHint: pick(locale, {
      'zh-CN': '置顶（优先注入测算上下文）',
      'zh-Hant': '置頂（優先注入測算上下文）',
      en: 'Pin (prefer for chart context)',
    }),
    saveDocument: pick(locale, {
      'zh-CN': '保存文档',
      'zh-Hant': '保存文檔',
      en: 'Save document',
    }),
    cancelEdit: pick(locale, {
      'zh-CN': '取消编辑',
      'zh-Hant': '取消編輯',
      en: 'Cancel edit',
    }),

    // —— Archives ——
    archivesIntro: pick(locale, {
      'zh-CN': '可为家人建立独立档案。默认档案用于日常邮件与默认报告，删除前需先切换默认档案。',
      'zh-Hant': '可為家人建立獨立檔案。默認檔案用於日常郵件與默認報告，刪除前需先切換默認檔案。',
      en: 'Create separate profiles for family. The default is used for daily email and default reports—switch default before deleting.',
    }),
    primaryBadge: pick(locale, {
      'zh-CN': '默认',
      'zh-Hant': '默認',
      en: 'Default',
    }),
    archiveMeta: (relation: string, birthDate: string, completeness: number) =>
      pick(locale, {
        'zh-CN': `${relation} · ${birthDate} · 完整度 ${completeness}%`,
        'zh-Hant': `${relation} · ${birthDate} · 完整度 ${completeness}%`,
        en: `${relation} · ${birthDate} · Completeness ${completeness}%`,
      }),
    linkEmailReminders: pick(locale, {
      'zh-CN': '关联邮件提醒',
      'zh-Hant': '關聯郵件提醒',
      en: 'Link email alerts',
    }),
    emailRemindersActive: pick(locale, {
      'zh-CN': '邮件提醒中',
      'zh-Hant': '郵件提醒中',
      en: 'Email alerts on',
    }),
    setAsDefault: pick(locale, {
      'zh-CN': '设为默认',
      'zh-Hant': '設為默認',
      en: 'Set as default',
    }),
    delete: pick(locale, {
      'zh-CN': '删除',
      'zh-Hant': '刪除',
      en: 'Delete',
    }),
    newFamilyArchive: pick(locale, {
      'zh-CN': '新建家人档案',
      'zh-Hant': '新建家人檔案',
      en: 'New family profile',
    }),
    placeholderName: pick(locale, {
      'zh-CN': '姓名',
      en: 'Name',
    }),
    placeholderRelationNote: pick(locale, {
      'zh-CN': '关系备注（如：大宝）',
      'zh-Hant': '關係備註（如：大寶）',
      en: 'Relation note (e.g. eldest)',
    }),
    placeholderBirthPlace: pick(locale, {
      'zh-CN': '出生地点',
      'zh-Hant': '出生地點',
      en: 'Birth place',
    }),
    createArchive: pick(locale, {
      'zh-CN': '创建档案',
      'zh-Hant': '創建檔案',
      en: 'Create profile',
    }),

    // —— Change log ——
    historyIntro: pick(locale, {
      'zh-CN': '这里记录你最近对资料的修改，包括是否触发了命盘重算。',
      'zh-Hant': '這裡記錄你最近對資料的修改，包括是否觸發了命盤重算。',
      en: 'Recent profile edits, including whether a chart recompute was triggered.',
    }),
    historyEmpty: pick(locale, {
      'zh-CN': '暂无变更记录。',
      'zh-Hant': '暫無變更記錄。',
      en: 'No change history yet.',
    }),
    justNow: pick(locale, {
      'zh-CN': '刚刚',
      'zh-Hant': '剛剛',
      en: 'Just now',
    }),

    // —— Footer CTAs ——
    footerNote: pick(locale, {
      'zh-CN': '修改出生信息会重算；补充资料只影响建议表达。',
      'zh-Hant': '修改出生信息會重算；補充資料只影響建議表達。',
      en: 'Birth edits recompute the chart; supplements only affect how advice is phrased.',
    }),
    backToProfile: pick(locale, {
      'zh-CN': '返回档案',
      'zh-Hant': '返回檔案',
      en: 'Back to profile',
    }),
    saveProfile: pick(locale, {
      'zh-CN': '保存资料',
      'zh-Hant': '保存資料',
      en: 'Save profile',
    }),

    // —— Confirms ——
    confirmRecalc: pick(locale, {
      'zh-CN':
        '你修改了出生日期、时间、地点、准确度或性别。这会触发命盘重算，旧报告仍保留，新结果将在后台更新。确定保存吗？',
      'zh-Hant':
        '你修改了出生日期、時間、地點、準確度或性別。這會觸發命盤重算，舊報告仍保留，新結果將在後台更新。確定保存嗎？',
      en: 'You changed birth date, time, place, accuracy, or gender. This triggers a chart recompute; old reports stay, new results update in the background. Save anyway?',
    }),
    confirmDeleteDocument: pick(locale, {
      'zh-CN': '确定删除这篇附加文档吗？',
      'zh-Hant': '確定刪除這篇附加文檔嗎？',
      en: 'Delete this attached document?',
    }),
    confirmDeleteArchive: pick(locale, {
      'zh-CN': '确定删除这份档案吗？关联报告仍保留只读。',
      'zh-Hant': '確定刪除這份檔案嗎？關聯報告仍保留只讀。',
      en: 'Delete this profile? Linked reports stay read-only.',
    }),

    // —— Errors / success fallbacks ——
    loadFailed: pick(locale, {
      'zh-CN': '读取资料失败，请稍后重试',
      'zh-Hant': '讀取資料失敗，請稍後重試',
      en: 'Failed to load profile. Try again later.',
    }),
    loadTimeout: pick(locale, {
      'zh-CN': '读取资料等待时间过长，请稍后重试',
      'zh-Hant': '讀取資料等待時間過長，請稍後重試',
      en: 'Loading timed out. Try again later.',
    }),
    networkError: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Try again later.',
    }),
    confirmRecalcRequired: pick(locale, {
      'zh-CN': '修改排盘信息后需要确认重算，请再次点击保存并确认。',
      'zh-Hant': '修改排盤信息後需要確認重算，請再次點擊保存並確認。',
      en: 'Confirm recompute after chart changes—save again and accept the prompt.',
    }),
    saveBasicFailed: pick(locale, {
      'zh-CN': '保存基础资料失败',
      'zh-Hant': '保存基礎資料失敗',
      en: 'Failed to save basic details',
    }),
    saveSuccess: pick(locale, {
      'zh-CN': '测算资料已保存。',
      'zh-Hant': '測算資料已保存。',
      en: 'Chart profile saved.',
    }),
    saveTimeout: pick(locale, {
      'zh-CN': '保存等待时间过长，请稍后重试',
      'zh-Hant': '保存等待時間過長，請稍後重試',
      en: 'Save timed out. Try again later.',
    }),
    documentTitleRequired: pick(locale, {
      'zh-CN': '请填写文档标题和正文',
      'zh-Hant': '請填寫文檔標題和正文',
      en: 'Enter a document title and body',
    }),
    saveDocumentFailed: pick(locale, {
      'zh-CN': '保存文档失败',
      'zh-Hant': '保存文檔失敗',
      en: 'Failed to save document',
    }),
    documentSaved: pick(locale, {
      'zh-CN': '附加文档已保存。',
      'zh-Hant': '附加文檔已保存。',
      en: 'Document saved.',
    }),
    deleteDocumentFailed: pick(locale, {
      'zh-CN': '删除文档失败',
      'zh-Hant': '刪除文檔失敗',
      en: 'Failed to delete document',
    }),
    documentDeleted: pick(locale, {
      'zh-CN': '附加文档已删除。',
      'zh-Hant': '附加文檔已刪除。',
      en: 'Document deleted.',
    }),
    archiveNameRequired: pick(locale, {
      'zh-CN': '请填写档案姓名和出生日期',
      'zh-Hant': '請填寫檔案姓名和出生日期',
      en: 'Enter a name and birth date',
    }),
    createArchiveFailed: pick(locale, {
      'zh-CN': '创建档案失败',
      'zh-Hant': '創建檔案失敗',
      en: 'Failed to create profile',
    }),
    archiveCreated: pick(locale, {
      'zh-CN': '新档案已创建。',
      'zh-Hant': '新檔案已創建。',
      en: 'New profile created.',
    }),
    setPrimaryFailed: pick(locale, {
      'zh-CN': '设置默认档案失败',
      'zh-Hant': '設置默認檔案失敗',
      en: 'Failed to set default profile',
    }),
    primarySet: pick(locale, {
      'zh-CN': '已设为默认档案。',
      'zh-Hant': '已設為默認檔案。',
      en: 'Set as default profile.',
    }),
    extractFailed: pick(locale, {
      'zh-CN': '提取报告要点失败',
      'zh-Hant': '提取報告要點失敗',
      en: 'Failed to extract report points',
    }),
    extractSuccess: pick(locale, {
      'zh-CN': '已从当前报告提取要点，请确认后保存。',
      'zh-Hant': '已從當前報告提取要點，請確認後保存。',
      en: 'Extracted points from the current report—review and save.',
    }),
    linkSubscriptionFailed: pick(locale, {
      'zh-CN': '关联邮件提醒失败',
      'zh-Hant': '關聯郵件提醒失敗',
      en: 'Failed to link email alerts',
    }),
    linkSubscriptionSuccess: pick(locale, {
      'zh-CN': '已关联邮件提醒档案。',
      'zh-Hant': '已關聯郵件提醒檔案。',
      en: 'Email alerts linked to this profile.',
    }),
    deleteArchiveFailed: pick(locale, {
      'zh-CN': '删除档案失败',
      'zh-Hant': '刪除檔案失敗',
      en: 'Failed to delete profile',
    }),
    archiveDeleted: pick(locale, {
      'zh-CN': '档案已删除。',
      'zh-Hant': '檔案已刪除。',
      en: 'Profile deleted.',
    }),
  };
}
