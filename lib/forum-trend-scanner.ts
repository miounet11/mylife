/**
 * Forum trend scanner for content radar.
 * Queries recent forum questions/answers, aggregates by category + tags,
 * extracts high-frequency keywords as trend signals, and writes them
 * into content_signals with heat scores.
 *
 * No external APIs or new dependencies required — purely internal DB queries.
 */
import { contentGenerationJobOperations, contentSignalOperations, contentRadarRunOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import type { ContentRadarRunRecord, ContentSignalRecord, ContentGenerationJobRecord } from '@/lib/user-types';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'lifekline.db');

const CATEGORY_LABELS: Record<string, string> = {
  bazi: '八字命盘', ziwei: '紫微斗数', liuyao: '六爻预测', qimen: '奇门遁甲',
  zeri: '择日选时', fengshui: '风水堪舆', xingming: '姓名学', xiangmian: '面相手相',
  meihua: '梅花易数', xingzuo: '西洋占星', taluo: '塔罗牌', fenghua: '综合改运',
  world_yi: '世界易学说', geo: '海外华人命理',
};

// Chinese stopwords and low-value words to skip
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '个',
  '怎么', '什么', '为什么', '还是', '可以', '这个', '那个', '不是', '已经',
  '觉得', '知道', '因为', '所以', '但是', '如果', '虽然', '而且', '或者',
  '应该', '可能', '一定', '比较', '非常', '特别', '真的', '问题', '现在',
  '今年', '去年', '明年', '最近', '之前', '之后', '以后', '时候', '时间',
  '帮忙', '谢谢', '请问', '各位', '大师', '老师', '朋友', '大家', '看到',
  '一样', '感觉', '出来', '过来', '起来', '回来', '下来', '上去', '下去',
  '到底', '一直', '一下', '一点', '一些', '很多', '这么', '那么', '这样',
  '还是', '只是', '就是', '还有', '不是', '也是', '真是', '才是', '只要',
  '不太', '不要', '不能', '不会', '不敢', '不好', '不行', '不到', '不在',
  '年', '月', '日', '岁', '做', '让', '把', '被', '给', '跟', '对', '从',
  '想', '问', '能', '会', '过', '吧', '吗', '呢', '啊', '哦', '嗯',
]);

const TREND_KEYWORDS: Record<string, string[]> = {
  bazi: ['日主', '用神', '忌神', '大运', '流年', '财官', '印星', '食伤', '七杀', '正官', '偏财', '正印'],
  ziwei: ['命宫', '迁移宫', '财帛宫', '夫妻宫', '事业宫', '化忌', '化禄', '化权', '化科', '紫微', '天府', '天相'],
  liuyao: ['世爻', '应爻', '动爻', '变爻', '用神', '官鬼', '妻财', '子孙', '父母', '兄弟', '伏神', '飞神'],
  qimen: ['值符', '值使', '八门', '九星', '三奇', '六仪', '天盘', '地盘', '休门', '生门', '开门', '死门'],
  zeri: ['结婚', '搬家', '签约', '动土', '出行', '开业', '装修', '入宅', '安床', '开工'],
  fengshui: ['朝向', '布局', '卧室', '客厅', '厨房', '卫生间', '阳台', '门口', '财位', '煞气'],
  xingming: ['取名', '改名', '笔画', '五行', '三才', '五格', '天格', '人格', '地格', '外格', '总格'],
  xiangmian: ['面相', '手相', '事业线', '婚姻线', '生命线', '智慧线', '感情线', '印堂', '颧骨', '鼻子', '耳朵', '嘴巴'],
  meihua: ['起卦', '体卦', '用卦', '互卦', '变卦', '本卦', '动爻', '上卦', '下卦', '八卦'],
  xingzuo: ['星座', '上升', '月亮', '金星', '火星', '木星', '土星', '行运', '合盘', '宫位'],
  taluo: ['塔罗', '大牌', '小牌', '正位', '逆位', '圣杯', '宝剑', '权杖', '星币', '愚者', '恋人', '死神'],
  fenghua: ['化太岁', '本命年', '颜色', '穿搭', '能量', '水晶', '生肖', '犯太岁', '吉方', '凶方'],
  world_yi: ['命理', '哲学', '决策', '现代', '科学', '方法论', '跨文化', '东西方', '系统', '框架'],
  geo: ['海外', '移民', '跨文化', '异国', '华人', '留学', '出国', '签证', '国际', '全球'],
};

function getDb() {
  return new Database(DB_PATH, { readonly: true });
}

function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/[，。！？、；：""''（）【】《》\s\n\r]+/g, ' ')
    .replace(/[^\u4e00-\u9fff\w ]/g, ' ')
    .toLowerCase();

  const tokens: string[] = [];
  const rawWords = cleaned.split(/\s+/).filter(Boolean);

  for (const word of rawWords) {
    if (STOP_WORDS.has(word)) continue;
    if (word.length < 2) continue;
    tokens.push(word);

    // Also extract bigrams for Chinese text
    if (/^[\u4e00-\u9fff]+$/.test(word) && word.length >= 4) {
      for (let i = 0; i < word.length - 1; i++) {
        const bigram = word.slice(i, i + 2);
        if (!STOP_WORDS.has(bigram)) {
          tokens.push(bigram);
        }
      }
    }
  }

  return tokens;
}

function extractMatchedKeywords(
  text: string,
  category: string,
  tags: string[],
): { matched: string[]; score: number } {
  const trendWords = TREND_KEYWORDS[category] || [];
  const matched = new Set<string>();

  // Match trend keywords
  for (const kw of trendWords) {
    if (text.includes(kw)) matched.add(kw);
  }

  // Match tags as keywords
  for (const tag of tags) {
    if (tag && tag.length >= 2) matched.add(tag);
  }

  // Score: base from keyword matches + activity bonus
  const baseScore = matched.size * 15;
  const tagBonus = Math.min(tags.length * 3, 15);
  const lengthBonus = Math.min(Math.floor(text.length / 50), 10);

  return {
    matched: [...matched].slice(0, 10),
    score: baseScore + tagBonus + lengthBonus,
  };
}

export interface ForumTrendResult {
  signals: ContentSignalRecord[];
  run: ContentRadarRunRecord;
  jobs: ContentGenerationJobRecord[];
  stats: {
    questionsScanned: number;
    answersScanned: number;
    categoriesFound: number;
    totalSignals: number;
    totalJobs: number;
  };
}

/**
 * Scan recent forum activity and extract trending topics as content signals.
 *
 * @param lookbackDays - How many days of forum data to scan (default 7)
 * @param topN - Max signals to generate per category (default 5)
 */
export function scanForumTrends(params?: {
  lookbackDays?: number;
  topN?: number;
}): ForumTrendResult {
  const lookbackDays = params?.lookbackDays || 7;
  const topN = params?.topN || 5;
  const db = getDb();

  const sinceDate = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Aggregate questions by category
  const categoryStats = db.prepare(`
    SELECT
      category,
      COUNT(*) as question_count,
      GROUP_CONCAT(tags) as all_tags,
      GROUP_CONCAT(title || ' ' || COALESCE(body, '')) as all_text
    FROM forum_questions
    WHERE created_at > ?
      AND status = 'visible'
    GROUP BY category
    ORDER BY question_count DESC
  `).all(sinceDate) as Array<{
    category: string;
    question_count: number;
    all_tags: string;
    all_text: string;
  }>;

  // Aggregate answer text per category (via question join)
  const answerStats = db.prepare(`
    SELECT
      q.category,
      COUNT(*) as answer_count,
      GROUP_CONCAT(a.body) as all_text
    FROM forum_answers a
    JOIN forum_questions q ON a.question_id = q.id
    WHERE a.created_at > ?
      AND q.category IS NOT NULL
    GROUP BY q.category
    ORDER BY answer_count DESC
  `).all(sinceDate) as Array<{
    category: string;
    answer_count: number;
    all_text: string;
  }>;

  db.close();

  // Build answer count map
  const answerMap: Record<string, number> = {};
  const answerTextMap: Record<string, string> = {};
  for (const row of answerStats) {
    answerMap[row.category] = row.answer_count;
    answerTextMap[row.category] = row.all_text || '';
  }

  const allSignals: ContentSignalRecord[] = [];

  for (const stat of categoryStats) {
    const category = stat.category;
    const label = CATEGORY_LABELS[category] || category;

    // Parse tags from JSON array
    let tags: string[] = [];
    try {
      const raw = stat.all_tags || '';
      const parsed = JSON.parse(raw.startsWith('[') ? raw : `[${raw}]`);
      if (Array.isArray(parsed)) {
        tags = [...new Set(parsed.map((t: unknown) => String(t || '').trim()).filter(Boolean))];
      }
    } catch {
      // tags parsing failed, continue without tags
    }

    // Combine question titles + bodies + answer text for keyword extraction
    const combinedText = `${stat.all_text || ''} ${answerTextMap[category] || ''}`;
    const { matched, score } = extractMatchedKeywords(combinedText, category, tags);

    // Build signal
    const heatScore = Math.min(score + stat.question_count * 2 + (answerMap[category] || 0), 100);
    const topTags = tags.slice(0, 5);

    const signal: ContentSignalRecord = {
      id: `forum_trend_${generateId()}`,
      sourceId: `forum_${category}`,
      sourceLabel: `论坛热点 · ${label}`,
      platform: 'internal',
      title: `${label}近期热点讨论`,
      url: `/community/category/${category}`,
      author: null,
      summary: `近${lookbackDays}天内${label}类目共${stat.question_count}个问题、${answerMap[category] || 0}条回答。热门标签：${topTags.join('、') || '无'}`,
      publishedAt: new Date().toISOString(),
      matchedKeywords: [...new Set([...matched, ...topTags])].slice(0, 10),
      score: heatScore,
      meta: {
        category,
        categoryLabel: label,
        questionCount: stat.question_count,
        answerCount: answerMap[category] || 0,
        lookbackDays,
        topTags,
        source: 'forum_trend_scanner',
      },
    };

    contentSignalOperations.upsert(signal);
    allSignals.push(signal);
  }

  // Sort by score and limit per category (keep top N overall)
  const sorted = allSignals.sort((a, b) => (b.score || 0) - (a.score || 0));
  const selected = sorted.slice(0, topN * Object.keys(CATEGORY_LABELS).length);

  // Record the run
  const run: ContentRadarRunRecord = {
    id: `forum_radar_${generateId()}`,
    sourceId: 'forum_trend_scanner',
    sourceLabel: '论坛热点扫描',
    platform: 'internal',
    status: 'success',
    fetchedCount: categoryStats.reduce((sum, s) => sum + s.question_count, 0),
    savedCount: selected.length,
    meta: {
      lookbackDays,
      categoriesScanned: categoryStats.length,
      totalQuestions: categoryStats.reduce((sum, s) => sum + s.question_count, 0),
      totalAnswers: Object.values(answerMap).reduce((sum, c) => sum + c, 0),
    },
  };
  contentRadarRunOperations.create(run);

  // Phase 3: auto-enqueue content generation jobs for high-score signals.
  // Guardrails prevent backlog when content-generation worker is not running:
  // - opt-in via FORUM_TREND_AUTO_ENQUEUE=1 or CONTENT_GENERATION_ENABLED=1
  // - hard cap on runnable pending/retry jobs
  const jobs: ContentGenerationJobRecord[] = [];
  const now = new Date().toISOString();
  const autoEnqueue =
    process.env.FORUM_TREND_AUTO_ENQUEUE === '1' ||
    process.env.CONTENT_GENERATION_ENABLED === '1';
  const maxPending = Math.max(0, Number(process.env.FORUM_TREND_MAX_PENDING_JOBS || 30) || 30);

  let pendingRunnable = 0;
  try {
    const countDb = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    try {
      const row = countDb
        .prepare(
          `SELECT COUNT(*) AS c FROM content_generation_jobs
           WHERE status IN ('pending', 'retry')
             AND attempts < max_attempts`,
        )
        .get() as { c?: number } | undefined;
      pendingRunnable = Number(row?.c || 0);
    } finally {
      countDb.close();
    }
  } catch {
    pendingRunnable = 0;
  }

  if (autoEnqueue && pendingRunnable < maxPending) {
    for (const signal of selected) {
      if ((signal.score || 0) < 50) continue;
      if (jobs.length + pendingRunnable >= maxPending) break;
      const job: ContentGenerationJobRecord = {
        id: `gen_${generateId()}`,
        userId: 'system_radar',
        status: 'pending',
        request: {
          signalId: signal.id,
          sourceLabel: signal.sourceLabel,
          title: signal.title,
          category: (signal.meta as Record<string, unknown>)?.category || '',
          keywords: signal.matchedKeywords || [],
          url: signal.url,
        },
        generatedCount: 0,
        llmSucceededCount: 0,
        fallbackCount: 0,
        attempts: 0,
        maxAttempts: 3,
        nextRunAt: now,
        meta: {
          source: 'forum_trend_scanner',
          signalScore: signal.score,
          platform: signal.platform,
        },
      };
      contentGenerationJobOperations.create(job);
      jobs.push(job);
    }
  }

  return {
    signals: selected,
    run,
    jobs,
    stats: {
      questionsScanned: categoryStats.reduce((sum, s) => sum + s.question_count, 0),
      answersScanned: Object.values(answerMap).reduce((sum, c) => sum + c, 0),
      categoriesFound: categoryStats.length,
      totalSignals: selected.length,
      totalJobs: jobs.length,
    },
  };
}
