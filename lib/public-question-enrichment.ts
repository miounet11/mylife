// v5-D40 公开追问页 markdown 化 + 关键词内链 + 结构卡
//
// 设计目标：
// 1. answerText 从 whitespace-pre-line 升级为 markdown 渲染（小段 / 分点 / 强调 / 链接）
// 2. 关键术语（真太阳时 / 用神 / 大运 / 流年 / 格局 / 十神 / 五行）自动加内链到 /knowledge
// 3. 抽取「主轴 / 用神 / 时间窗口」三类结构标记，喂给结构卡 SVG
//
// 张一鸣式约束：
//   - 不为了视觉而做视觉。markdown 是因为信息密度需要分层，不是因为好看。
//   - 内链只链高置信关键词，宁可少链不可错链（错链伤 SEO + 体验）。
//   - 结构卡的字段必须从已有 LLM 文本中"读"出来，不引入新 LLM 调用。

export interface KnowledgeLinkRule {
  pattern: RegExp;
  slug: string;
  label: string;
}

// 仅链到已存在的 knowledge 页（见 lib/content.ts knowledgeArticles），错链宁缺勿滥。
// 同一关键词只在文本中链接首次出现的位置。
const KNOWLEDGE_LINK_RULES: KnowledgeLinkRule[] = [
  { pattern: /真太阳时/g, slug: 'true-solar-time-guide', label: '真太阳时' },
  { pattern: /八字(?:报告|分析)/g, slug: 'how-to-read-bazi-report', label: '八字报告' },
  { pattern: /职业决策/g, slug: 'career-decision-with-bazi', label: '职业决策' },
];

/**
 * 把高置信术语首次出现处替换为 markdown 链接。
 * - 避免双链：一旦插入 [..](...)，同一术语后续保持纯文本
 * - 避免破坏 markdown：跳过已经在 [..](..)/```..```/`..` 内的位置
 */
export function injectKnowledgeLinks(input: string): string {
  if (!input) return '';
  let result = input;
  for (const rule of KNOWLEDGE_LINK_RULES) {
    rule.pattern.lastIndex = 0;
    const match = rule.pattern.exec(result);
    if (!match) continue;
    const idx = match.index;
    // 简易越界保护：若该位置已被 [..](..) 包裹，跳过
    const before = result.slice(0, idx);
    const openSquare = before.lastIndexOf('[');
    const closeSquare = before.lastIndexOf(']');
    if (openSquare > closeSquare) continue;
    const link = `[${rule.label}](/knowledge/${rule.slug})`;
    result = result.slice(0, idx) + link + result.slice(idx + rule.label.length);
  }
  return result;
}

/**
 * 把 LLM 写出来的「公开解析」文本切成 markdown 段落 + 列表，
 * 让 react-markdown 能渲染出层级感。
 *
 * 规则：
 *  - **1) 判断依据** / **2) 当前阶段建议** 等章节 → ## 标题
 *  - 行首 * / - / 1. 规范为 GFM 列表
 *  - 句号后关键引导词 → 新段
 *  - 时间窗口 / 「围绕XX版」→ 加粗
 *  - 知识术语内链
 */
export function shapeAnswerMarkdown(input: string): string {
  if (!input) return '';
  let text = input.replace(/\r\n/g, '\n').trim();

  // 0. If the whole answer was flattened to one line (legacy path), re-break
  //    common section / bullet markers so lists can render.
  if (!text.includes('\n') || text.split('\n').length < 3) {
    text = text
      .replace(/\s*(\*\*\d+\)\s*[^*]+?\*\*)\s*/g, '\n\n$1\n\n')
      .replace(/\s+([*•·▪])\s+(\*\*[^*]+?\*\*)/g, '\n- $2')
      .replace(/\s+(\d+)[.、．)]\s+(\*\*[^*]+?\*\*)/g, '\n$1. $2')
      .trim();
  }

  // 1. Section headings: **1) 判断依据** → ## 1) 判断依据
  text = text.replace(
    /^\s*\*\*\s*(\d+\)\s*[^*\n]+?)\s*\*\*\s*$/gm,
    '\n\n## $1\n',
  );
  // Also plain 1) 判断依据 lines
  text = text.replace(
    /^\s*(\d+\))\s*(判断依据|当前阶段建议|风险提醒|节点落成|阶段建议|行动建议|核心结论)([^\n]*)$/gm,
    '\n\n## $1 $2$3\n',
  );

  // 2. Bullet lines: "* **label**：" / "• xxx" → GFM list (preserve indent for nesting)
  text = text.replace(/^(\s*)[*•·▪]\s+/gm, (_m, spaces: string) => {
    const depth = Math.min(2, Math.floor(String(spaces || '').length / 2));
    return `${'  '.repeat(depth)}- `;
  });

  // 3. Numbered sub-points "1. **专业壁垒**" stay as ordered lists; fix Chinese dots
  text = text.replace(/^(\s*)(\d+)[、．](\s*)/gm, '$1$2.$3');

  // 4. Blank line before list / heading so GFM parses correctly
  text = text
    .replace(/([^\n])\n(#{1,3} )/g, '$1\n\n$2')
    .replace(/([^\n])\n([-*] |\d+\. )/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n');

  // 5. Legacy inline section cues after punctuation
  text = text
    .replace(
      /([。；])\s*(判断依据是|当前阶段建议|风险提醒|顺势重点|当前主轴|当前阶段|接下来最容易起变化的是|这一段，?动作要提前收口)[：:]?/g,
      '$1\n\n**$2**：',
    )
    .replace(/([。；])\s*(建议你在)/g, '$1\n\n**$2**');

  // 6. Emphasize windows / product variants (avoid double-bold)
  text = text
    .replace(/(?<!\*)(20\d{2}年\d{1,2}月(?:初|底)?|\d{1,2}月(?:初|底)?)(?!\*)/g, '**$1**')
    .replace(/(?<!\*)(围绕[\u4e00-\u9fa5]{1,3}版)(?!\*)/g, '**$1**');

  // 7. Knowledge links
  return injectKnowledgeLinks(text.trim());
}

// ---- 结构卡数据抽取 ----

export interface PublicQuestionStructure {
  patternName?: string; // 主轴 / 格局
  daYun?: string; // 大运
  liuNian?: string; // 流年
  dayMaster?: string; // 日主
  favorable?: string[]; // 用神 / 喜神
  unfavorable?: string[]; // 忌神
  windows: Array<{ when: string; action: string }>; // 时间窗口
  directions?: string[]; // 方向 / 方位 / 关键动作
  trend?: string; // 整体走势一句话
}

/** v5-D41: 来自数据库 JSON 字段的权威结构化输入（优先于正则抽取） */
export interface AuthoritativeStructuredInput {
  patternType?: string;
  patternDescription?: string;
  dayMaster?: string;
  currentDaYun?: string;
  currentLiuNian?: string;
  yongShen?: string[];
  xiShen?: string[];
  trend?: string;
  timing?: string[];
  directions?: string[];
}

const PATTERN_RE = /(正印格|偏印格|食神格|伤官格|正官格|七杀格|正财格|偏财格|比肩格|劫财格|羊刃格|建禄格|身弱格|身强格)/;
const DA_YUN_RE = /([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])大运/;
// 用神识别走双向：A. "用神/喜神/顺势重点" 后跟元素；B. 元素后跟 "为用神/为喜神"。
const FAVOR_AFTER_RE = /(?:用神|喜神|顺势重点)[^。；\n]{0,4}?([金木水火土][金木水火土、和与]{0,8})/;
const FAVOR_BEFORE_RE = /([金木水火土][金木水火土、和与]{0,8}?)\s*为?(?:用神|喜神)/;
const UNFAVOR_RE = /(?:忌神|防|不宜)[^。；\n]{0,12}?([金木水火土]{1,3})/g;
const WINDOW_RE = /(20\d{2}年\d{1,2}月(?:初|底)?|\d{1,2}月(?:初|底)?)[^。；\n]{0,32}/g;

function pickElements(raw: string | undefined): string[] {
  if (!raw) return [];
  // 既要支持「木、火」分隔写法，也要支持「水土/木火」连写
  const tokens: string[] = [];
  for (const seg of raw.split(/[、和与]/)) {
    for (const ch of seg.trim()) {
      if (/[金木水火土]/.test(ch) && !tokens.includes(ch)) tokens.push(ch);
    }
  }
  return tokens;
}

export function extractPublicQuestionStructure(
  parts: {
    answerText?: string;
    analysisPoints?: string[];
    contextLabel?: string;
    /** v5-D41: 优先使用权威字段，未提供时再走文本正则 */
    authoritative?: AuthoritativeStructuredInput;
  }
): PublicQuestionStructure {
  const auth = parts.authoritative;
  const blob = [
    parts.contextLabel || '',
    parts.answerText || '',
    ...(parts.analysisPoints || []),
  ].join('\n');

  const patternMatch = blob.match(PATTERN_RE) || (parts.contextLabel || '').match(PATTERN_RE);
  const daYunMatch = blob.match(DA_YUN_RE);
  const favorMatch = blob.match(FAVOR_AFTER_RE) || blob.match(FAVOR_BEFORE_RE);
  const unfavor: string[] = [];
  let m: RegExpExecArray | null;
  UNFAVOR_RE.lastIndex = 0;
  while ((m = UNFAVOR_RE.exec(blob))) {
    pickElements(m[1]).forEach((el) => {
      if (!unfavor.includes(el)) unfavor.push(el);
    });
  }

  // ---- 时间窗口：优先用权威 timing[]，否则正则抽 ----
  const windows: Array<{ when: string; action: string }> = [];
  const WHEN_TIMING_RE = /(20\d{2}年\d{1,2}月(?:初|底)?|\d{1,2}月(?:初|底)?)/;
  if (auth?.timing && auth.timing.length > 0) {
    for (const t of auth.timing.slice(0, 4)) {
      const w = t.match(WHEN_TIMING_RE);
      if (w) {
        const when = w[1];
        const action = t.replace(when, '').replace(/^[，。：:、\s]+/, '').slice(0, 28) || '关注节奏';
        windows.push({ when, action });
      } else {
        // 没有具体月份的就当作整段建议放最前
        windows.push({ when: '近期', action: t.slice(0, 28) });
      }
    }
  } else {
    WINDOW_RE.lastIndex = 0;
    let w: RegExpExecArray | null;
    const seenWhen = new Set<string>();
    while ((w = WINDOW_RE.exec(blob)) && windows.length < 4) {
      const when = w[1];
      if (seenWhen.has(when)) continue;
      seenWhen.add(when);
      const after = blob.slice(w.index + w[0].length).split(/[。；\n]/)[0] || '';
      const action = (w[0].slice(when.length) + after).trim().slice(0, 28).replace(/[，,]\s*$/, '');
      windows.push({ when, action: action || '关注节奏' });
    }
  }

  // ---- 用神 / 忌神：权威优先 ----
  const favorable =
    auth?.yongShen && auth.yongShen.length > 0
      ? Array.from(new Set([...auth.yongShen, ...(auth.xiShen || [])]))
      : pickElements(favorMatch?.[1]);

  return {
    patternName: auth?.patternType || (patternMatch ? patternMatch[1] : undefined),
    daYun: auth?.currentDaYun || (daYunMatch ? `${daYunMatch[1]}大运` : undefined),
    liuNian: auth?.currentLiuNian,
    dayMaster: auth?.dayMaster,
    favorable,
    unfavorable: unfavor,
    windows,
    directions: auth?.directions,
    trend: auth?.trend,
  };
}
