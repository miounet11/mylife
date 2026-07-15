/**
 * Replace product-meta placeholder case with a real gaokao path case.
 * Run on production: node scripts/fix-gaokao-case-content.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data/lifekline.db');
const db = new Database(dbPath);

const title = '案例：高考志愿前，先判断该冲刺、保守还是调整方向';
const excerpt =
  '升学场景里，用户真正需要确认的不是“结果好不好”，而是当前阶段更适合冲刺、保守还是调整方向。本案用结构—时位—环境拆清节奏，并给出可执行动作。';

const sections = [
  {
    title: '用户处境',
    paragraphs: [
      '家长与学生在志愿填报前最焦虑的，通常不是某一科分数，而是：现在该加码冲刺、稳妥保守，还是及时调整专业/城市方向。',
      '若只给“吉凶标签”，无法回答“未来 30–90 天该怎么排动作”。本案把问题收束为节奏判断与行动建议。',
    ],
  },
  {
    title: '结构层：先看承载与张力',
    paragraphs: [
      '结构层关注：日主强弱与用神是否匹配当前学习强度；印星（吸收、系统学习）与食伤（输出、应试发挥）是否通畅。',
      '若印星受制、食伤过旺，容易“学得杂、落得散”；若印星过重、食伤无力，则常见“懂了但考不出”。先定性，再谈冲刺幅度。',
    ],
  },
  {
    title: '时位层：窗口决定策略',
    paragraphs: [
      '时位层把大运与流年叠到备考/填报窗口：窗口开时，适合冲刺与试探上限；窗口紧或冲克集中时，更宜收缩战线、保核心科目与保底志愿。',
      '关键判断不是“今年好不好”，而是“现在是加杠杆窗口还是控风险窗口”。',
    ],
  },
  {
    title: '环境层：家庭与学校约束',
    paragraphs: [
      '环境包括家庭期待、学校资源、城市与专业现实约束。结构再匹配，若环境不允许无限试错，也要把策略改成“有边界的推进”。',
      '案例里常见冲突：家庭要求冲顶尖专业，但当前结构更适合“稳中求进 + 专业赛道与用神同频”。',
    ],
  },
  {
    title: '行动建议（可执行）',
    paragraphs: [
      '冲刺型：窗口与结构同向时，集中 1–2 门提分杠杆科目，志愿梯度拉开，保留冲高但不赌单一。',
      '保守型：窗口紧张或恢复不足时，先稳住主干科目与身体节奏，志愿以“可就读 + 可转进”为主，避免情绪化冲顶。',
      '调整方向型：当专业赛道与用神/大运长期相悖时，优先换方向而不是硬扛；用 30 天小步验证（课程/竞赛/体验）再定调。',
    ],
  },
  {
    title: '风险边界',
    paragraphs: [
      '不承诺分数与录取结果；不替代招办与心理辅导。命理观察只辅助“节奏与匹配”判断。',
      '若出现严重睡眠崩坏、焦虑失控，应先医疗与心理支持，再谈冲刺策略。',
    ],
  },
  {
    title: '产品如何承接这类问题',
    paragraphs: [
      '分析页：让用户安心提交出生信息，并先点明“升学/年度”焦点。',
      '结果页：压缩为少量关键判断——当前适合冲刺、保守还是调方向，以及未来 30–90 天动作。',
      '案例页：帮助新用户理解产品解决的是趋势与行动，而不是单纯吉凶。可继续进入学业事业维度或完整报告验证。',
    ],
  },
];

const seoTitle = '高考志愿冲刺还是保守？升学节奏结构案例｜人生K线';
const seoDescription =
  '真实升学场景：用结构、时位、环境判断该冲刺、保守还是调整专业方向，并给出 30–90 天可执行动作。非吉凶标签，可接学业事业维度与完整报告。';

const tags = JSON.stringify(['高考', '升学', '志愿', '教育', '案例', '节奏判断']);
const now = new Date().toISOString();

const row = db.prepare('SELECT id, meta FROM content_entries WHERE slug = ?').get('gaokao-path-case');
if (!row) {
  console.error('gaokao-path-case not found');
  process.exit(1);
}

let meta = {};
try {
  meta = row.meta ? JSON.parse(row.meta) : {};
} catch {
  meta = {};
}

meta = {
  ...meta,
  locale: 'zh-Hans',
  publicationReady: true,
  contentVersion: 'case-v-gaokao-real-1',
  relatedReportThemes: ['升学与高考', 'study', '高考', '志愿', '节奏'],
  relatedToolSlugs: ['timing-yearly-window', 'career-role-fit'],
  relatedKnowledgeSlugs: ['dimension-guide-study-career', 'true-solar-time-guide'],
  caseScenario: 'gaokao_path_decision',
  primaryJudgment: 'sprint_or_conserve_or_redirect',
  illustrationReady: true,
};

const info = db
  .prepare(
    `UPDATE content_entries
     SET title = ?, excerpt = ?, seo_title = ?, seo_description = ?,
         sections = ?, tags = ?, category = ?, status = 'published',
         meta = ?, updated_at = ?, updated_by = ?
     WHERE slug = ?`,
  )
  .run(
    title,
    excerpt,
    seoTitle,
    seoDescription,
    JSON.stringify(sections),
    tags,
    '升学高考',
    JSON.stringify(meta),
    now,
    'system_case_repair',
    'gaokao-path-case',
  );

console.log('updated', info.changes, 'at', now);
const check = db
  .prepare('SELECT title, substr(excerpt,1,80), substr(sections,1,120) FROM content_entries WHERE slug=?')
  .get('gaokao-path-case');
console.log(check);
db.close();
