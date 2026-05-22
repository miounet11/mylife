// v5-D61 论坛 Q&A 内容生成器（纯模板拼接版，零 LLM）

import { ForumUserRecord, ForumQuestionRecord, ForumAnswerRecord, ForumGenerationContext } from './types';
import {
  INDUSTRIES,
  CATEGORIES,
  PRIVACY_MODES,
  QUESTION_TEMPLATES,
  SITUATIONS,
  PROBLEMS,
  OFFICIAL_ANSWER_INTROS,
  MASTER_ANSWER_INTROS,
  ENTHUSIAST_ANSWER_INTROS,
  ANSWER_FRAGMENTS,
  SEO_KEYWORDS,
} from './templates';

function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  const arr2 = [...arr];
  const out: T[] = [];
  while (out.length < n && arr2.length) {
    out.push(arr2.splice(Math.floor(rng() * arr2.length), 1)[0]);
  }
  return out;
}

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function randGanZhi(rng: () => number): string {
  return pick(rng, GAN) + pick(rng, ZHI);
}

function slugify(title: string, suffix: string): string {
  // 中文 url-safe：取英文+数字+扩展，中文用 pinyin 太重，这里直接 hash 后缀
  const base = title.replace(/[^a-zA-Z0-9一-龥]/g, '').slice(0, 20);
  return `${base}-${suffix}`;
}

const STAR_SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
const TAROT_CARDS = ['愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐者', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '塔', '星星', '月亮', '太阳', '审判', '世界'];

export interface BuildQuestionInput {
  context: ForumGenerationContext;
  seed: number;
}

export interface BuildAnswerInput {
  question: ForumQuestionRecord;
  responder: ForumUserRecord;
  isOfficial: boolean;
  context: ForumGenerationContext;
  seed: number;
  delayMinutes: number;  // 距 question 公开
}

// ========== 拼接问题 ==========
export function buildQuestion(input: BuildQuestionInput): ForumQuestionRecord {
  const { context, seed } = input;
  const rng = makeRng(seed);
  const { asker, category: categoryKey, industry: industryKey, privacyMode } = context;

  const category = CATEGORIES.find((c) => c.key === categoryKey)!;
  const industry = INDUSTRIES.find((i) => i.key === industryKey)!;
  const privacy = PRIVACY_MODES.find((p) => p.key === privacyMode)!;

  const topic = pick(rng, category.topics);
  const occupation = asker.occupation;
  const years = Math.floor(rng() * 12) + 1;
  const age = 22 + Math.floor(rng() * 30);
  const ageRange = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 5}`;
  const gender = rng() < 0.55 ? '女' : '男';
  const yearGZ = randGanZhi(rng);
  const monthGZ = randGanZhi(rng);
  const dayGZ = randGanZhi(rng);
  const hourGZ = randGanZhi(rng);

  const lunarYear = ['庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未', '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳'][Math.floor(rng() * 24)];
  const lunarMonth = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'][Math.floor(rng() * 12)];
  const lunarSeason = ['春', '夏', '秋', '冬'][Math.floor(rng() * 4)];
  const birthYear = 1970 + Math.floor(rng() * 35);
  const birthMonth = Math.floor(rng() * 12) + 1;
  const birthDay = Math.floor(rng() * 28) + 1;

  const intro = privacy.intro
    .replace('{lunarYear}', lunarYear)
    .replace('{lunarMonth}', lunarMonth)
    .replace('{lunarSeason}', lunarSeason)
    .replace('{birthYear}', String(birthYear))
    .replace('{birthMonth}', String(birthMonth))
    .replace('{birthDay}', String(birthDay))
    .replace('{ageRange}', ageRange)
    .replace('{gender}', gender)
    .replace('{province}', asker.province);

  const tplArr = QUESTION_TEMPLATES[categoryKey] || QUESTION_TEMPLATES.bazi;
  const tpl = pick(rng, tplArr);
  const situation = pick(rng, SITUATIONS);
  const problem = pick(rng, PROBLEMS);

  const body = tpl
    .replace('{intro}', intro)
    .replace('{occupation}', occupation)
    .replace('{years}', String(years))
    .replace('{age}', String(age))
    .replace('{topic}', topic)
    .replace('{industry}', industry.label)
    .replace('{situation}', situation)
    .replace('{problem}', problem)
    .replace('{conflict}', `${situation}，${problem}`)
    .replace('{plan}', pick(rng, ['跳槽', '辞职', '考公', '生二胎', '搬家', '签新合同', '出差', '结婚', '买房']))
    .replace('{rumor}', pick(rng, ['今年不利', '运势在背', '冲太岁', '犯小人', '财位不开']))
    .replace('{guess}', pick(rng, ['偏弱', '偏旺', '中和', '不平衡']))
    .replace('{state}', pick(rng, ['没结婚', '没存款', '没起色', '没明确目标']))
    .replace('{event}', pick(rng, ['搬到新城市', '换了部门', '父亲住院', '孩子刚上学', '相亲见到一个人']))
    .replace('{observation}', pick(rng, ['命宫主星太弱', '化忌冲', '空宫无主星', '禄存独坐']))
    .replace('{question}', pick(rng, ['今年是不是要稳一稳？', '能动还是不能动？', '是不是要等到明年？']))
    .replace('{detail}', pick(rng, ['化忌的影响很重', '主星组合冲突', '禄权科忌都没出现']))
    .replace('{signal}', pick(rng, ['偏不利', '偏中性', '不太明朗']))
    .replace('{time}', `${Math.floor(rng() * 24)}时${Math.floor(rng() * 60)}分`)
    .replace('{life_event}', pick(rng, ['面试', '签合同', '婚事', '新项目', '远行']))
    .replace('{relation}', pick(rng, ['世应同位', '世动应静', '世生应']))
    .replace('{卦象}', pick(rng, ['天风姤', '风地观', '地火明夷', '雷天大壮', '泽水困', '水火既济']))
    .replace('{格局}', pick(rng, ['乙加丁', '伤门得使', '值符落 9 宫', '九星受克']))
    .replace('{date_range}', pick(rng, ['本月底', '下个月', '春节前', '中秋前']))
    .replace('{guess_date}', `${birthMonth}月${birthDay}号`)
    .replace('{date_options}', `${birthMonth}月${birthDay}号 / ${birthMonth}月${birthDay + 3}号 / ${birthMonth + 1}月5号`)
    .replace('{tentative_date}', `${birthMonth + 1}月12号`)
    .replace('{location}', `${asker.province}${asker.city}`)
    .replace('{direction}', pick(rng, ['正东', '正南', '东南', '西北', '正北', '西南']))
    .replace('{layout}', pick(rng, ['客厅穿堂', '主卧门对厨房', '阳台正对大门', '卫生间在中宫']))
    .replace('{aspect}', pick(rng, ['事业', '财运', '健康', '感情']))
    .replace('{current_setup}', pick(rng, ['客厅放了鱼缸', '玄关有镜子', '床头朝西']))
    .replace('{surname}', asker.displayName[0])
    .replace('{date}', `${birthYear}年${birthMonth}月`)
    .replace('{gender_baby}', pick(rng, ['男孩', '女孩', '未知']))
    .replace('{current_name}', asker.displayName.replace('*', '某'))
    .replace('{business}', pick(rng, ['SaaS 工具', '社区团购', '咖啡店', '设计工作室']))
    .replace('{face_feature}', pick(rng, ['印堂偏窄', '颧骨偏低', '法令深', '鼻梁有断']))
    .replace('{hand_feature}', pick(rng, ['事业线断在中途', '婚姻线两条', '生命线偏短']))
    .replace('{trigger_event}', pick(rng, ['听到一只乌鸦叫', '车出小擦碰', '收到一个奇怪的电话']))
    .replace('{星座}', pick(rng, STAR_SIGNS))
    .replace('{rising}', pick(rng, STAR_SIGNS))
    .replace('{moon}', pick(rng, STAR_SIGNS))
    .replace('{partner_sign}', pick(rng, STAR_SIGNS))
    .replace('{card1}', pick(rng, TAROT_CARDS))
    .replace('{card2}', pick(rng, TAROT_CARDS))
    .replace('{card3}', pick(rng, TAROT_CARDS))
    .replace('{card}', pick(rng, TAROT_CARDS));

  const titleStem = `${category.label} · ${topic}：${occupation}的${years}年困惑`;
  // 截断到 28 字符
  const title = titleStem.length > 28 ? titleStem.slice(0, 28) : titleStem;

  const tagsBase = SEO_KEYWORDS[categoryKey] || [];
  const tags = pickN(rng, tagsBase, Math.min(4, tagsBase.length));
  // 加 1 个行业 tag + 1 个 topic
  tags.push(industry.label);
  tags.push(topic);

  const id = `fq_${seed.toString(36)}`;
  const slug = slugify(title, id.slice(-6));

  return {
    id,
    slug,
    authorId: asker.id,
    title,
    body,
    category: categoryKey,
    industry: industryKey,
    tags: Array.from(new Set(tags)).slice(0, 6),
    privacyMode,
    metadata: {
      yearGanZhi: privacy.visibilityMask.includes('yearGanZhi') ? undefined : yearGZ,
      monthGanZhi: privacy.visibilityMask.includes('monthGanZhi') ? undefined : monthGZ,
      dayGanZhi: privacy.visibilityMask.includes('dayGanZhi') ? undefined : dayGZ,
      hourGanZhi: privacy.visibilityMask.includes('hourGanZhi') ? undefined : hourGZ,
      gender: gender === '男' ? 'male' : 'female',
      ageRange,
      visibilityMask: privacy.visibilityMask,
    },
    status: 'visible',
    publishedAt: context.scheduledFor.toISOString(),
    createdAt: context.scheduledFor.toISOString(),
    viewCount: Math.floor(rng() * 280) + 30,
    answerCount: 0,
  };
}

// ========== 拼接答 ==========
export function buildAnswer(input: BuildAnswerInput): ForumAnswerRecord {
  const { question, responder, isOfficial, context, seed, delayMinutes } = input;
  const rng = makeRng(seed);
  const category = CATEGORIES.find((c) => c.key === question.category)!;

  let intro = '';
  if (isOfficial) intro = pick(rng, OFFICIAL_ANSWER_INTROS);
  else if (responder.role === 'master') intro = pick(rng, MASTER_ANSWER_INTROS)
    .replace('{category}', category.label)
    .replace('{topic}', category.topics[Math.floor(rng() * category.topics.length)])
    .replace('{distractor}', pick(rng, ['表面的运势', '别人怎么看', '一时的情绪', '过去的经验']))
    .replace('{key}', pick(rng, ['你最近 3 个月的节奏', '你和家庭/合伙人的关系', '你自己的体能和睡眠']))
    .replace('{verdict}', pick(rng, ['可以稳一稳，不要急动', '可以推进，但要避开下个月初', '维持现状最好', '该断的要断了']))
    .replace('{root_cause}', pick(rng, ['你过度依赖一种节奏', '你和环境的对位错了', '你并不在最适合自己的圈子里', '你这一年走的运不在正向']));
  else intro = pick(rng, ENTHUSIAST_ANSWER_INTROS)
    .replace('{age}', String(28 + Math.floor(rng() * 15)))
    .replace('{category}', category.label)
    .replace('{topic}', category.topics[Math.floor(rng() * category.topics.length)]);

  // 主体片段：identify + action + risk + closing
  const sections: string[] = [];
  sections.push('');
  sections.push(intro);

  const ident = pick(rng, ANSWER_FRAGMENTS.identify)
    .replace('{visible_info}', '你给到的命盘片段')
    .replace('{observation}', pick(rng, ['今年走的不是顺水大运', '近月有一处明显的转折', '所谓"卡住"主要是中宫力量不够']))
    .replace('{certain}', pick(rng, ['你目前位置不会更差', '近 90 天内有一次窗口', '你身边人的助力是真实的']))
    .replace('{uncertain}', pick(rng, ['你具体能拿到的资源量', '对方那边的真实意图', '父母这边的态度变化']))
    .replace('{trait_a}', pick(rng, ['不利远行', '利财不利官', '动则有变']))
    .replace('{trait_b}', pick(rng, ['宜守不宜攻', '近贵远小人', '审慎签约']))
    .replace('{time_window}', pick(rng, ['立春后一个月', '夏至前后', '中秋节那一周', '冬至前 10 天']));
  sections.push('**初步判断**');
  sections.push(ident);

  const act = pick(rng, ANSWER_FRAGMENTS.action)
    .replace('{primary_action}', pick(rng, ['先把现有项目跑完，不要分心', '把家里的关系理顺一遍', '约一次身体检查']))
    .replace('{wrong_action}', pick(rng, ['立刻辞职', '和对方摊牌', '搬家或者换城市']))
    .replace('{right_action}', pick(rng, ['手头的活', '日常作息', '一份明确的预算']))
    .replace('{conservative}', pick(rng, ['原岗位再扛 6 个月', '本城找机会', '维持现状到明年']))
    .replace('{aggressive}', pick(rng, ['立刻跳槽', '出去自己干', '跨城市发展']))
    .replace('{window}', pick(rng, ['本月 18 号到 25 号', '下月初的 7 天', '春节前 14 天']))
    .replace('{next_year}', pick(rng, ['明年同期', '明年清明前', '后年才有下一次']));
  sections.push('**建议**');
  sections.push(act);

  if (rng() < 0.7) {
    const risk = pick(rng, ANSWER_FRAGMENTS.risk)
      .replace('{avoid_a}', pick(rng, ['情绪化决策', '靠人情借钱', '突然换城市']))
      .replace('{avoid_b}', pick(rng, ['深夜签合同', '和长辈正面冲突', '接陌生项目']))
      .replace('{risk}', pick(rng, ['月初有口舌官非', '近期有破财', '健康亮黄灯']))
      .replace('{prep}', pick(rng, ['一次法律咨询', '把存款转到稳定理财', '体检 + 减少熬夜']))
      .replace('{trigger}', pick(rng, ['对方拖延签字', '父母突然介入', '体检报告异常']))
      .replace('{counteract}', pick(rng, ['暂停继续推进', '冷处理 3 天', '复诊确认']));
    sections.push('**风险提示**');
    sections.push(risk);
  }

  if (rng() < 0.7) {
    const closing = pick(rng, ANSWER_FRAGMENTS.closing)
      .replace('{ask_back}', pick(rng, ['出生时辰', '家里其他人的近况', '最近一次的健康指标']))
      .replace('{deeper}', pick(rng, ['完整大运流年', '命宫迁移宫细节', '配偶宫信息']));
    sections.push('---');
    sections.push(closing);
  }

  if (isOfficial) {
    sections.push('');
    sections.push('> 想看自己的完整命盘？[点这里免费生成](/analyze)。');
  }

  const body = sections.join('\n').trim();

  return {
    id: `fa_${seed.toString(36)}_${Math.floor(rng() * 999999).toString(36)}`,
    questionId: question.id,
    authorId: responder.id,
    body,
    isOfficial,
    upvoteCount: isOfficial ? Math.floor(rng() * 30) + 5 : Math.floor(rng() * 12),
    status: 'pending',
    publishedAt: null,
    createdAt: context.scheduledFor.toISOString(),
    responseDelayMinutes: delayMinutes,
  };
}

// ========== 按计划构造一批 ==========
export interface BatchPlanInput {
  pool: ForumUserRecord[];
  startAt: Date;
  count: number;
  baseSeed?: number;
}

export interface BatchEntry {
  question: ForumQuestionRecord;
  answers: ForumAnswerRecord[]; // 第一个是官方答（必有），后面是 0-3 条社区追答
}

export function planBatch(input: BatchPlanInput): BatchEntry[] {
  const { pool, startAt, count } = input;
  const baseSeed = input.baseSeed ?? Math.floor(startAt.getTime() / 1000);
  const rng = makeRng(baseSeed);

  const askers = pool.filter((u) => u.role === 'asker' || u.role === 'enthusiast');
  const masters = pool.filter((u) => u.role === 'master');
  const officials = pool.filter((u) => u.role === 'official');
  const enthusiasts = pool.filter((u) => u.role === 'enthusiast');

  if (!askers.length || !masters.length || !officials.length) {
    throw new Error('forum pool: 缺 asker / master / official 角色，请重新种子');
  }

  const entries: BatchEntry[] = [];
  // 把 count 均匀摊到 24 小时
  const dayMs = 24 * 60 * 60 * 1000;
  const stepMs = dayMs / count;

  for (let i = 0; i < count; i++) {
    const seed = baseSeed * 13 + i * 7919 + 1;
    const subRng = makeRng(seed);
    const cat = pick(subRng, CATEGORIES);
    const priv = pick(subRng, PRIVACY_MODES);
    const asker = pick(subRng, askers);
    const master = pick(subRng, masters);
    const official = pick(subRng, officials);
    const ents = pickN(subRng, enthusiasts, Math.floor(subRng() * 3));

    const jitterMs = (subRng() - 0.5) * stepMs * 0.6;
    const scheduledFor = new Date(startAt.getTime() + i * stepMs + jitterMs);

    // industry 优先取 asker 自身行业，避免出现"康复护理人却 tag 手工匠人"的错位
    const ctx: ForumGenerationContext = {
      industry: asker.industry,
      category: cat.key,
      privacyMode: priv.key,
      asker,
      master,
      enthusiasts: ents,
      scheduledFor,
    };

    const question = buildQuestion({ context: ctx, seed });

    const answers: ForumAnswerRecord[] = [];
    // 官方答：1-3h 后发布
    const officialDelay = 60 + Math.floor(subRng() * 120);
    answers.push(buildAnswer({
      question,
      responder: official,
      isOfficial: true,
      context: ctx,
      seed: seed * 17 + 1,
      delayMinutes: officialDelay,
    }));
    // master 答：60-200min 后
    answers.push(buildAnswer({
      question,
      responder: master,
      isOfficial: false,
      context: ctx,
      seed: seed * 17 + 2,
      delayMinutes: 60 + Math.floor(subRng() * 140),
    }));
    // 0-2 个 enthusiast
    ents.forEach((e, k) => {
      answers.push(buildAnswer({
        question,
        responder: e,
        isOfficial: false,
        context: ctx,
        seed: seed * 17 + 3 + k,
        delayMinutes: 90 + Math.floor(subRng() * 200),
      }));
    });

    question.answerCount = answers.length;
    entries.push({ question, answers });
  }

  return entries;
}
