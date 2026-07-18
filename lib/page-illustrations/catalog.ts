/**
 * Page / report illustration catalog.
 * src is public path under /images/page-illustrations/ after publish.
 */

export type PageIllustRole =
  | 'cover'
  | 'structure'
  | 'timing'
  | 'action'
  | 'risk'
  | 'summary';

export type PageIllustrationEntry = {
  id: string;
  surfaces: string[];
  role: PageIllustRole;
  title: string;
  caption: string;
  alt: string;
  filename: string;
  aspectRatio: '16:9' | '3:2' | '1:1';
  /** Prompt body without style suffix */
  prompt: string;
  reportCiteKeys?: string[];
  tags: string[];
  /** Set true after asset exists in public/ */
  ready: boolean;
  width?: number;
  height?: number;
};

export const PAGE_ILLUST_STYLE_SUFFIX = [
  'Editorial product diagram for Life K-Line (人生K线), Chinese decision-support app.',
  'Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric diagrams,',
  'minimal icons, high readability, no crystal ball, no horror, no superstition marketing slogans,',
  'no watermark, no low-quality stock photo. Clear Chinese labels where text appears.',
].join(' ');

export const PAGE_ILLUSTRATION_CATALOG: PageIllustrationEntry[] = [
  {
    id: 'PI-HOME-01',
    surfaces: ['home/workspace', 'analyze/workspace'],
    role: 'cover',
    title: '从生辰到可执行判断',
    caption: '排盘 → 报告结构 → 顾问开场 → 验证回访',
    alt: '人生K线从排盘到报告顾问验证的路径示意图',
    filename: 'home-path-from-birth-to-action.jpg',
    aspectRatio: '16:9',
    prompt:
      'Horizontal product journey diagram: four calm cards connected by arrows — 填生辰, 读报告, 顾问开场, 事件验证. Soft paper background, blue ink accents, minimal icons of calendar birth form, document report, chat bubble, checklist. Chinese labels only.',
    reportCiteKeys: ['cover'],
    tags: ['首页', '排盘', '路径'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-REPORT-READ-01',
    surfaces: ['docs/read-first-report', 'report/cover'],
    role: 'structure',
    title: '第一份报告怎么读',
    caption: '先结论与窗口，再看结构与风险',
    alt: '第一份命理报告阅读顺序图：结论窗口结构风险',
    filename: 'report-first-reading-path.jpg',
    aspectRatio: '16:9',
    prompt:
      'Infographic map of reading a fortune report: numbered steps 1 结论 2 时间窗口 3 结构依据 4 风险 5 验证点. Clean layered document illustration, blue accent numbers, paper texture, Chinese UI style.',
    reportCiteKeys: ['cover', 'reading-path'],
    tags: ['报告', '阅读'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-REPORT-TIMING-01',
    surfaces: ['report/timing', 'dimensions/fortune-rhythm'],
    role: 'timing',
    title: '大运与流年窗口',
    caption: '阶段节奏：有利窗 / 谨慎窗，而不是绝对吉凶',
    alt: '大运流年时间轴示意：有利窗口与谨慎窗口',
    filename: 'report-dayun-liunian-windows.jpg',
    aspectRatio: '16:9',
    prompt:
      'Timeline diagram of life phases (大运) with smaller yearly marks (流年). Soft green zones labeled 有利窗 and amber zones 谨慎窗. Minimal K-line rhythm below. Educational, not fatalistic. Chinese labels.',
    reportCiteKeys: ['dayun', 'timing'],
    tags: ['大运', '流年', '窗口'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-REPORT-DECISION-01',
    surfaces: ['report/decision', 'chat/structure'],
    role: 'action',
    title: '决策闭环：依据→结论→动作→验证',
    caption: '今天 / 7 天 / 30 天 三步可执行',
    alt: '命理决策闭环图：判断依据当前结论阶段动作风险验证点',
    filename: 'decision-loop-basis-action-verify.jpg',
    aspectRatio: '16:9',
    prompt:
      'Five connected modules in a clean flow: 判断依据, 当前结论, 阶段动作 (今天 7天 30天), 风险提醒, 验证点. Messenger/product UI inspired cards, blue accent, Chinese labels, decision product diagram.',
    reportCiteKeys: ['decision-loop'],
    tags: ['决策', '验证', '动作'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-YONGSHEN-01',
    surfaces: ['report/structure', 'teachers/overview'],
    role: 'structure',
    title: '日主与用神喜忌（示意）',
    caption: '结构锚点：日主、用神、忌神 — 以报告锁定为准',
    alt: '日主用神忌神结构示意教学图',
    filename: 'structure-daymaster-yongshen.jpg',
    aspectRatio: '16:9',
    prompt:
      'Abstract educational diagram of Chinese metaphysics structure: center node 日主, supporting nodes 用神, caution nodes 忌神, surrounding five-element cycle lightly drawn. Soft colors, schematic not portrait, Chinese labels, textbook clarity.',
    reportCiteKeys: ['yongshen', 'structure'],
    tags: ['日主', '用神', '结构'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-CHAT-OPENING-01',
    surfaces: ['chat/opening', 'teachers/hub'],
    role: 'summary',
    title: '顾问开场：老师先说，一点即发',
    caption: '不预填长问题；议题芯片 + 一键开口',
    alt: '顾问开场对话界面示意图：开场气泡与一键开口',
    filename: 'chat-consultant-opening.jpg',
    aspectRatio: '16:9',
    prompt:
      'Clean mobile chat UI mock: left gray bubble 顾问开场, topic chips, one large blue primary button 一键开口. Linear minimal interface, Chinese UI text, no clutter, product screenshot illustration style.',
    reportCiteKeys: [],
    tags: ['对话', '开场', '老师'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-EVENTS-01',
    surfaces: ['events/validation', 'predictions/revisit'],
    role: 'action',
    title: '事件验证闭环',
    caption: '记录 → 应验/偏差 → 带报告回聊',
    alt: '事件验证闭环：记录应验偏差回聊示意图',
    filename: 'events-validation-loop.jpg',
    aspectRatio: '16:9',
    prompt:
      'Circular loop diagram with four stations: 记录事件, 到期回访, 应验或偏差, 顾问回聊纠偏. Calm checklist aesthetic, blue and soft green, Chinese labels, product education.',
    reportCiteKeys: ['validation'],
    tags: ['事件', '验证', '回访'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-BOUNDARY-01',
    surfaces: ['boundary/not-fatalism', 'docs/read-first-report'],
    role: 'risk',
    title: '判断边界：参考不是定论',
    caption: '不恐吓、不绝对化；医疗法律投资需专业意见',
    alt: '命理判断边界说明：参考框架非宿命定论',
    filename: 'boundary-not-fatalism.jpg',
    aspectRatio: '16:9',
    prompt:
      'Two-column comparison diagram: left 可做 (结构参考 窗口节奏 可验证动作), right 不做 (恐吓 绝对命运 替代医疗法律投资). Soft warning amber on right, calm blue on left, Chinese labels, ethical product illustration.',
    reportCiteKeys: ['boundary'],
    tags: ['边界', '风险', '克制'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-TOOLS-01',
    surfaces: ['tools/hub', 'home/workspace'],
    role: 'action',
    title: '工具：把大问题拆成可测小问题',
    caption: '单项工具 → 报告深问 → 回访',
    alt: '工具中心问题拆解与报告衔接示意图',
    filename: 'tools-problem-breakdown.jpg',
    aspectRatio: '16:9',
    prompt:
      'Matrix of small tool cards around a central report document. Arrows from fuzzy question cloud into clear tool cards then into report. Minimal product diagram, Chinese labels 工具 报告 回访.',
    reportCiteKeys: [],
    tags: ['工具', '拆解'],
    ready: true,
    width: 1600,
    height: 900,
  },
  {
    id: 'PI-TEACHERS-01',
    surfaces: ['teachers/hub', 'chat/opening'],
    role: 'cover',
    title: '一位老师专一事',
    caption: '总览 / 事业 / 财务 / 关系 / 时机… 按意图开场',
    alt: '多位顾问老师按议题分工示意图',
    filename: 'teachers-roles-map.jpg',
    aspectRatio: '16:9',
    prompt:
      'Horizontal set of six minimal advisor cards with Chinese titles 总览老师 事业老师 财务老师 关系老师 时机老师 实践老师, each with one-line duty. Clean Linear list aesthetic, no realistic faces, abstract avatars as simple geometric shapes.',
    reportCiteKeys: [],
    tags: ['老师', '顾问'],
    ready: true,
    width: 1600,
    height: 900,
  },
];

export function buildFullPrompt(entry: PageIllustrationEntry): string {
  return `${entry.prompt}\n\n${PAGE_ILLUST_STYLE_SUFFIX}\nAspect ${entry.aspectRatio}.`;
}

export function publicSrc(entry: PageIllustrationEntry): string {
  return `/images/page-illustrations/${entry.filename}`;
}

export function listBySurface(surface: string): PageIllustrationEntry[] {
  return PAGE_ILLUSTRATION_CATALOG.filter((e) => e.surfaces.includes(surface));
}

export function listByReportKeys(keys: string[]): PageIllustrationEntry[] {
  const set = new Set(keys);
  return PAGE_ILLUSTRATION_CATALOG.filter((e) =>
    (e.reportCiteKeys || []).some((k) => set.has(k)),
  );
}
