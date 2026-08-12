/**
 * Classify what users actually type in chat (from production questions).
 * Real volume: career A/B, city+industry, timing ("何时转正"), intimacy,
 * 用神/十神 contradiction, and ultra-short truncated sends after stream fails.
 */

import type { ChatIntent } from '@/lib/chat-intent';

export type UserQuestionKind =
  | 'either_or'
  | 'timing_when'
  | 'yongshen_why'
  | 'intimacy_medical'
  | 'appearance_spec'
  | 'incomplete'
  | 'general';

export type UserQuestionSignal = {
  kind: UserQuestionKind;
  /** Extra system note for the model (never shown as-is if empty) */
  systemAddon: string;
  /** Force chat intent when URL did not set one */
  forceIntent?: ChatIntent;
  /** Skip LLM — return this answer (complete, not a failure) */
  localAnswer?: string;
};

const INCOMPLETE_RE = /^(我在|我是|那我|然后|还有|嗯|啊|哦|哈|a+|test|测试|在)?[\s\w]{0,4}$/i;

export function classifyUserQuestion(question: string): UserQuestionSignal {
  const q = `${question || ''}`.trim();
  const lower = q.toLowerCase();

  if (q.length > 0 && q.length < 8 && (INCOMPLETE_RE.test(q) || /^(我在se|我在s|我在sex)$/i.test(q))) {
    return {
      kind: 'incomplete',
      systemAddon: '',
      localAnswer: [
        '这句话好像还没写完。',
        '直接补全你想问的那一句就行，例如：',
        '· 我适合留在现在的城市，还是换一座？',
        '· 这个行业接下来 12 个月该守还是该换赛道？',
        '· 正官和忌神为什么对不上？',
        '亲密关系可以问节奏和边界；身体功能问题请看医生，这里不下诊断。',
      ].join('\n'),
    };
  }

  if (/早泄|阳痿|猛吗|高潮|射精|性功能|房事表现|床上表现|性能力/.test(q) || /sex.*(猛|早泄|表现)/i.test(lower)) {
    return {
      kind: 'intimacy_medical',
      systemAddon: [
        '【安全】用户在问性表现/生理功能。禁止诊断早泄、性能力、疾病或必然体质。',
        '只谈关系节奏、边界与沟通；明确「身体功能请咨询医生」。不要用五行论证生理。',
      ].join('\n'),
    };
  }

  if (/五官|发型|身材|胸大|腰细|偏胖|偏瘦|喜欢什么样|长什么样|穿搭/.test(q)) {
    return {
      kind: 'appearance_spec',
      systemAddon: [
        '【边界】外貌偏好是趣味推测，不是命定。最多给 1–2 种风格倾向，并写清「这是意象不是相亲标准」。',
        '不要写成注定喜欢某一体型/肤色；引导回关系节奏与相处方式。',
      ].join('\n'),
    };
  }

  if (/四柱|排盘|八字错|八字不对|晚子|换日|寒露|节气.*错|应该是甲|应为甲/.test(q)) {
    return {
      kind: 'general',
      systemAddon: [
        '【排盘核对】用户在质疑四柱。先问：填写的是公历还是农历、时辰是否确定。',
        '同一天可能跨节气（如寒露上午），早上和下午月柱不同。不要另起一套八字。',
        '引导看报告「排盘核对」表，或用同一公历+时辰重算。',
      ].join('\n'),
    };
  }

  if (/用神|忌神|喜神|从强|从弱|从旺|不得令|正官|正印|七杀|为什么还忌|也是从/.test(q)) {
    return {
      kind: 'yongshen_why',
      systemAddon: [
        '【读法】主用神是扶抑五行（身弱印比 / 身旺克泄）。调候单独说。',
        '十神（正官/正印…）是角色，不是另一套忌神列表。用户问「正官是水为什么忌神是火木」时：',
        '先承认两套标签容易混；用水木金土火讲扶抑，再用正官解释「克身/管我」的角色，不要两套忌神对着打。',
      ].join('\n'),
    };
  }

  const either =
    /还是|还是该|该不该|要不要|选哪个|哪个好|A还是B|还是去/.test(q) ||
    (q.includes('还是') && q.length < 80);
  if (either) {
    return {
      kind: 'either_or',
      forceIntent: 'event-verdict',
      systemAddon: [
        '【断事】这是二选一。不要套「今天/7天/30天」表。',
        '固定四段：1) 倾向（先选谁）2) 依据（日主/主用神/城市或行业怎么合）3) 另一选项在什么条件下更好 4) 本周一个可验证动作。',
        '文末仍给「还想问」两条。',
      ].join('\n'),
    };
  }

  if (/什么时候|何时|哪年|哪月|转正|买房|正缘|分手.*时候|2026|2027|后半年/.test(q)) {
    return {
      kind: 'timing_when',
      systemAddon: [
        '【时点】用户要的是可核对的时间窗，不是终身运势。',
        '给：最早窗口 / 更稳窗口 / 不宜硬推的信号。写清不确定（时辰、执行会改窗口）。',
        '不要精确到某日「必成」。',
      ].join('\n'),
    };
  }

  return { kind: 'general', systemAddon: '' };
}
