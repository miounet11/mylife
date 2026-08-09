/**
 * Multi-dimension content quality scoring for Content OS.
 * Goes beyond basic length checks — LDPlayer-level public pages need
 * decision utility, locale purity, FAQ depth, and product bridges.
 */

import type { ContentOsGeneratedArticle } from '@/lib/content-os/generator';
import type { DestinyMatrixSlot } from '@/lib/content-os/matrix';

export type QualityDimensionKey =
  | 'depth'
  | 'structure'
  | 'localePurity'
  | 'decisionUtility'
  | 'geoAnswer'
  | 'productBridge'
  | 'antiSpam'
  | 'faqCoverage'
  | 'entityFocus'
  | 'scannability';

export type DimensionScore = {
  key: QualityDimensionKey;
  label: string;
  score: number; // 0-100
  weight: number;
  reasons: string[];
  fixHints: string[];
};

export type MultiDimensionQuality = {
  overall: number;
  ready: boolean;
  publishReady: boolean;
  dimensions: DimensionScore[];
  repairPriority: QualityDimensionKey[];
  summary: string;
};

const BLOCKED_OPS =
  /内容自动化|转化价值|流量承接|站点内容库|SEO\b|GEO\b|crawl budget|soft-?404|程序化页面|内容工厂/i;

const FEAR_SPAM = /必破财|必死|不改名就|百分百|包准|绝对准|不看后悔|立刻转运必/i;

function isEnglish(locale: string) {
  return locale.startsWith('en');
}

function isTraditional(locale: string) {
  return locale === 'zh-TW' || locale === 'zh-HK';
}

function fullText(article: ContentOsGeneratedArticle) {
  return [
    article.title,
    article.excerpt,
    article.seoTitle,
    article.seoDescription,
    article.answerSummary,
    ...(article.tags || []),
    ...article.sections.flatMap((s) => [s.title, ...(s.paragraphs || [])]),
  ].join('\n');
}

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function hasLatinWord(text: string) {
  return /[A-Za-z]{3,}/.test(text);
}

/** Simplified-heavy markers that should not dominate TW/HK pages */
const SIMPLIFIED_MARKERS = /什么|怎么|这是|问题|结构|环境|适合|判断|窗口|节奏|报告/;
const TRADITIONAL_MARKERS = /什麼|怎麼|這是|問題|結構|環境|適合|判斷|視窗|節奏|報告/;

export function scoreContentOsDimensions(
  article: ContentOsGeneratedArticle,
  slot?: DestinyMatrixSlot,
): MultiDimensionQuality {
  const text = fullText(article);
  const paragraphs = article.sections.flatMap((s) => s.paragraphs || []).filter(Boolean);
  const paraChars = paragraphs.reduce((n, p) => n + p.length, 0);
  const avgPara = paragraphs.length ? Math.round(paraChars / paragraphs.length) : 0;
  const english = isEnglish(article.locale);
  const traditional = isTraditional(article.locale);
  const dims: DimensionScore[] = [];

  // 1. Depth
  {
    const reasons: string[] = [];
    const fixHints: string[] = [];
    let score = 0;
    if (article.sections.length >= 7) score += 30;
    else if (article.sections.length >= 5) score += 20;
    else {
      reasons.push(`小节仅 ${article.sections.length}`);
      fixHints.push('扩展到至少 7 个实质小节');
    }
    if (paragraphs.length >= 12) score += 30;
    else if (paragraphs.length >= 8) score += 20;
    else {
      reasons.push(`段落仅 ${paragraphs.length}`);
      fixHints.push('每节至少 2 段，总段落 ≥ 12');
    }
    if (avgPara >= 90) score += 40;
    else if (avgPara >= 70) score += 28;
    else {
      reasons.push(`平均段长 ${avgPara}`);
      fixHints.push('每段写满 90+ 字/词，含原因与动作');
    }
    dims.push({
      key: 'depth',
      label: '信息深度',
      score: Math.min(100, score),
      weight: 1.4,
      reasons,
      fixHints,
    });
  }

  // 2. Structure
  {
    const titles = article.sections.map((s) => s.title).join(' ');
    const hasConclusion = /结论|答案|Direct|结论|一句话/i.test(titles);
    const hasAction = /行动|动作|清单|Actions|下一步/i.test(titles);
    const hasBound = /边界|免责|Boundaries|不适用/i.test(titles);
    const hasStructure = /结构|Structure|时位|Timing|环境|Environment/i.test(titles);
    let score = 20;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    if (hasConclusion) score += 20;
    else {
      reasons.push('缺直接结论节');
      fixHints.push('增加「一句话结论/Direct answer」');
    }
    if (hasStructure) score += 20;
    else fixHints.push('补结构/时位/环境层');
    if (hasAction) score += 20;
    else {
      reasons.push('缺可执行动作节');
      fixHints.push('增加本周可执行清单');
    }
    if (hasBound) score += 20;
    else fixHints.push('增加边界说明');
    dims.push({
      key: 'structure',
      label: '结构完整度',
      score: Math.min(100, score),
      weight: 1.2,
      reasons,
      fixHints,
    });
  }

  // 3. Locale purity
  {
    let score = 100;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    if (english) {
      const body = [article.title, article.excerpt, ...paragraphs].join(' ');
      if (hasChinese(body)) {
        score -= 55;
        reasons.push('英文页混入中文');
        fixHints.push('全文改为 native English，禁止中文标题/段落');
      }
      if (!hasLatinWord(article.title)) {
        score -= 30;
        reasons.push('英文 title 无效');
        fixHints.push('用英文决策句重写 title');
      }
    } else if (traditional) {
      const simp = (text.match(new RegExp(SIMPLIFIED_MARKERS, 'g')) || []).length;
      const trad = (text.match(new RegExp(TRADITIONAL_MARKERS, 'g')) || []).length;
      if (simp > trad + 3) {
        score -= 35;
        reasons.push('繁体页简体痕迹重');
        fixHints.push('改写为繁体用词：什麼/結構/適合/判斷');
      }
    } else {
      // zh-CN etc: light check for pure english walls
      const latinRatio = (text.match(/[A-Za-z]/g) || []).length / Math.max(text.length, 1);
      if (latinRatio > 0.45) {
        score -= 25;
        reasons.push('中文页英文占比过高');
        fixHints.push('主体用中文表达，术语可双语括号');
      }
    }
    dims.push({
      key: 'localePurity',
      label: '语言纯度',
      score: Math.max(0, Math.min(100, score)),
      weight: 1.5,
      reasons,
      fixHints,
    });
  }

  // 4. Decision utility
  {
    let score = 30;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    if (/30|90|窗口|window|本周|this week|清单|checklist/i.test(text)) score += 25;
    else {
      reasons.push('缺少时间窗/清单');
      fixHints.push('写明 30/90 天可验证动作');
    }
    if (/结构|时位|环境|structure|timing|environment/i.test(text)) score += 20;
    if (/不要|而非|不是|instead of|not fate/i.test(text)) score += 15;
    if (slot && text.includes(slot.entityName)) score += 10;
    else if (slot) {
      reasons.push('未紧扣实体名');
      fixHints.push(`反复回扣实体「${slot.entityName}」`);
    }
    dims.push({
      key: 'decisionUtility',
      label: '决策可用性',
      score: Math.min(100, score),
      weight: 1.3,
      reasons,
      fixHints,
    });
  }

  // 5. GEO / answer engine
  {
    let score = 0;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    const ans = (article.answerSummary || '').trim();
    if (ans.length >= (english ? 80 : 50)) score += 35;
    else {
      reasons.push('answerSummary 过短');
      fixHints.push('写可独立引用的直接答案 ≥50/80 字');
    }
    if ((article.searchIntents || []).length >= 3) score += 25;
    else fixHints.push('searchIntents ≥ 3 条真实问法');
    if ((article.entityKeywords || []).length >= 5) score += 20;
    else fixHints.push('entityKeywords ≥ 5');
    if ((article.seoDescription || '').length >= 100) score += 20;
    else fixHints.push('seoDescription ≥ 100 字');
    dims.push({
      key: 'geoAnswer',
      label: '可引用答案层',
      score: Math.min(100, score),
      weight: 1.1,
      reasons,
      fixHints,
    });
  }

  // 6. Product bridge
  {
    let score = 20;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    const href = article.relatedCta?.href || '';
    if (href && (text.includes(href) || text.includes('排盘') || text.includes('十维度') || /analyze|dimension|chart|Life K-Line|人生K线/i.test(text))) {
      score += 40;
    } else {
      reasons.push('缺产品路径桥接');
      fixHints.push(`自然写入路径 ${href || '/analyze'} 与回访`);
    }
    if (/回访|revisit|邮箱|email|会员|membership/i.test(text)) score += 25;
    else fixHints.push('提到预测回访/邮箱保存闭环');
    if (/免费|free/i.test(text)) score += 15;
    dims.push({
      key: 'productBridge',
      label: '产品转化桥',
      score: Math.min(100, score),
      weight: 1.0,
      reasons,
      fixHints,
    });
  }

  // 7. Anti-spam
  {
    let score = 100;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    if (BLOCKED_OPS.test(text)) {
      score -= 50;
      reasons.push('含内部运营/SEO 黑话');
      fixHints.push('删除 SEO/转化/内容库等词，改写为读者语言');
    }
    if (FEAR_SPAM.test(text)) {
      score -= 40;
      reasons.push('恐吓/绝对化营销');
      fixHints.push('改为结构判断与风险边界表达');
    }
    if (!article.llmUsed) {
      score -= 15;
      reasons.push('未使用 LLM 正文（模板回退）');
      fixHints.push('强制 LLM 重写全文章节');
    }
    dims.push({
      key: 'antiSpam',
      label: '合规与反spam',
      score: Math.max(0, score),
      weight: 1.6,
      reasons,
      fixHints,
    });
  }

  // 8. FAQ
  {
    let score = 40;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    const faqSections = article.sections.filter((s) => /常见问题|FAQ|Q&A|问题：/i.test(s.title));
    if (faqSections.length >= 1) score += 30;
    else {
      reasons.push('无 FAQ 节');
      fixHints.push('增加 2–3 个常见问题小节');
    }
    if ((article.searchIntents || []).length >= 4) score += 30;
    dims.push({
      key: 'faqCoverage',
      label: 'FAQ 覆盖',
      score: Math.min(100, score),
      weight: 0.9,
      reasons,
      fixHints,
    });
  }

  // 9. Entity focus
  {
    let score = 50;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    const name = slot?.entityName || article.name || '';
    if (name && text.split(name).length - 1 >= 3) score += 30;
    else if (name) {
      reasons.push('实体名出现次数不足');
      fixHints.push(`全文至少 3 次点名「${name}」`);
    }
    if ((article.tags || []).length >= 4) score += 20;
    dims.push({
      key: 'entityFocus',
      label: '实体聚焦',
      score: Math.min(100, score),
      weight: 1.0,
      reasons,
      fixHints,
    });
  }

  // 10. Scannability
  {
    let score = 50;
    const reasons: string[] = [];
    const fixHints: string[] = [];
    if (article.sections.every((s) => (s.title || '').length >= 2 && (s.title || '').length <= 40)) {
      score += 25;
    }
    if (paragraphs.every((p) => p.length <= 400)) score += 25;
    else {
      reasons.push('存在超长墙段');
      fixHints.push('拆段，单段 ≤ 400 字');
    }
    dims.push({
      key: 'scannability',
      label: '可扫读性',
      score: Math.min(100, score),
      weight: 0.8,
      reasons,
      fixHints,
    });
  }

  const weightSum = dims.reduce((n, d) => n + d.weight, 0);
  const overall = Math.round(dims.reduce((n, d) => n + d.score * d.weight, 0) / weightSum);

  const weak = dims
    .filter((d) => d.score < 75)
    .sort((a, b) => a.score / a.weight - b.score / b.weight)
    .map((d) => d.key);

  const anti = dims.find((d) => d.key === 'antiSpam')!;
  const locale = dims.find((d) => d.key === 'localePurity')!;
  // People-first publish bar (Google + LDPlayer): higher than "looks long enough"
  const depth = dims.find((d) => d.key === 'depth')!;
  const decision = dims.find((d) => d.key === 'decisionUtility')!;
  const faq = dims.find((d) => d.key === 'faqCoverage')!;
  const publishReady =
    overall >= 86 &&
    anti.score >= 75 &&
    locale.score >= 80 &&
    depth.score >= 72 &&
    decision.score >= 70 &&
    faq.score >= 55 &&
    Boolean(article.llmUsed) &&
    // Title must look like a user job, not "Best {tag} 2026"
    !/best\s+.+\s+202\d|top\s+\d+|终极指南|最全合集/i.test(article.title || '');

  return {
    overall,
    ready: overall >= 76 && anti.score >= 60,
    publishReady,
    dimensions: dims,
    repairPriority: weak.slice(0, 5),
    summary: `overall=${overall} publishReady=${publishReady} weak=${weak.slice(0, 3).join(',') || 'none'}`,
  };
}

export function buildRepairBrief(quality: MultiDimensionQuality): string {
  const lines: string[] = [
    `Current overall score: ${quality.overall}. Target: publishReady with overall ≥ 82.`,
    'Fix the weakest dimensions first:',
  ];
  for (const key of quality.repairPriority) {
    const dim = quality.dimensions.find((d) => d.key === key);
    if (!dim) continue;
    lines.push(`- [${dim.label}] score=${dim.score}`);
    for (const h of dim.fixHints) lines.push(`  · ${h}`);
    for (const r of dim.reasons) lines.push(`  · reason: ${r}`);
  }
  return lines.join('\n');
}
