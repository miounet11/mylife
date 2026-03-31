export type ChatIntent =
  | 'event-simulation'
  | 'event-verdict'
  | 'event-review'
  | 'meihua-enhancement';

export type ChatIntentPreset = {
  key: ChatIntent;
  entryLabel: string;
  helper: string;
  placeholder: string;
  prefillQuestion: string;
  questions: string[];
  systemPrompt: string;
  summaryHint: string;
};

const CHAT_INTENT_PRESETS: Record<ChatIntent, ChatIntentPreset> = {
  'event-simulation': {
    key: 'event-simulation',
    entryLabel: '事件推演',
    helper: '把问题说成一件具体事件，系统会优先按“结构、阶段、环境、动作”四层来拆时间线、推进条件和风险点。',
    placeholder: '例如“我计划 2026 年 4 月启动换岗，按世界易看，这件事现在该怎么推进，最怕什么？”',
    prefillQuestion: '请按世界易的结构、阶段、环境、动作四层，帮我围绕这件具体事情做一次事件推演，拆清楚最佳推进时间、成功条件和风险点。',
    questions: [
      '请围绕这件事做世界易事件推演，拆出什么时候试探、什么时候加速、什么时候收手。',
      '如果我要推进这件事，最关键的结构条件、环境条件和失败征兆分别是什么？',
    ],
    systemPrompt: '当前会话是“事件推演”专项。回答必须围绕一件具体事件展开，优先输出推进节奏、关键窗口、成功条件、失败征兆与替代方案，不要停留在泛泛建议。',
    summaryHint: '当前用户进入的是事件推演专项，回答时要把问题压成一条可执行的事件时间线。',
  },
  'event-verdict': {
    key: 'event-verdict',
    entryLabel: '断事专项',
    helper: '适合二选一或明确决策问题，系统会更强调倾向判断、结构依据、环境变量和前置条件。',
    placeholder: '例如“这次合作该不该签？按世界易看，如果要签，最重要的前提是什么？”',
    prefillQuestion: '请把这件事当成世界易断事专项来判断，直接告诉我倾向、依据，以及推进前必须满足的条件。',
    questions: [
      '这件事整体更偏可行、偏保守，还是暂时不该推进？请直接给出倾向。',
      '如果我要推进，必须先满足哪三个前置条件，分别对应结构、环境和动作哪一层？',
    ],
    systemPrompt: '当前会话是“断事专项”。回答必须给出明确倾向判断，并拆清楚判断依据、反向信号、必须满足的前置条件与何时暂缓，不要模糊化表述。',
    summaryHint: '当前用户进入的是断事专项，回答时要明确倾向、依据和前置条件。',
  },
  'event-review': {
    key: 'event-review',
    entryLabel: '事件剖析',
    helper: '适合已经发生过的事情，重点看偏差是来自时机、执行、环境，还是信息判断本身。',
    placeholder: '例如“这次事情为什么没成？按世界易看，如果重做一次，节奏该怎么改？”',
    prefillQuestion: '请围绕这件已经发生的事情做世界易事件剖析，判断偏差更像时机问题、执行问题、环境问题，还是信息判断失真。',
    questions: [
      '这次偏差更像时机问题、执行问题、环境问题，还是信息判断失真？',
      '如果重做一次，这件事的节奏应该前移、后移，还是分段推进？请给出纠偏动作。',
    ],
    systemPrompt: '当前会话是“事件剖析”专项。回答必须优先做复盘，区分时机问题、执行问题与信息判断偏差，并给出下一次重做的修正动作。',
    summaryHint: '当前用户进入的是事件剖析专项，回答时要优先复盘偏差原因和纠偏动作。',
  },
  'meihua-enhancement': {
    key: 'meihua-enhancement',
    entryLabel: '摇卦 / 梅花易增强',
    helper: '适合时间敏感、临门一脚式的问题，系统会把判断收敛到更短周期的时位、变数和即时风险。',
    placeholder: '例如“这两天该不该去谈这件事？按世界易短周期判断，A 和 B 我应该先选哪个？”',
    prefillQuestion: '请把这个问题按世界易的摇卦 / 梅花易增强方式来辅助判断，重点看短周期时机和即时风险。',
    questions: [
      '这个问题如果只看接下来 7 天到 30 天，按世界易短周期判断应该怎么选？',
      '当前短周期里，最需要防的即时风险是什么？为什么？',
    ],
    systemPrompt: '当前会话是“摇卦 / 梅花易增强”专项。回答必须聚焦短周期与即时判断，强调近 24 小时到 30 天内的时机、变数和临门一脚决策，不要把回答拉成长周期泛论。',
    summaryHint: '当前用户进入的是摇卦 / 梅花易增强专项，回答时要聚焦短周期判断与即时风险。',
  },
};

const CHAT_INTENT_ORDER: ChatIntent[] = [
  'event-simulation',
  'event-verdict',
  'event-review',
  'meihua-enhancement',
];

export function normalizeChatIntent(value?: string | null): ChatIntent | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim() as ChatIntent;
  if (!normalized) {
    return undefined;
  }

  return normalized in CHAT_INTENT_PRESETS ? normalized : undefined;
}

export function getChatIntentPreset(intent?: string | null) {
  const normalized = normalizeChatIntent(intent);
  return normalized ? CHAT_INTENT_PRESETS[normalized] : null;
}

export function getChatIntentSystemPrompt(intent?: string | null) {
  return getChatIntentPreset(intent)?.systemPrompt || '';
}

export function getChatIntentSummaryHint(intent?: string | null) {
  return getChatIntentPreset(intent)?.summaryHint || '';
}

export function listChatIntentPresets() {
  return CHAT_INTENT_ORDER.map((key) => CHAT_INTENT_PRESETS[key]);
}
