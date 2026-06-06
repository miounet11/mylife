export type ChatIntent =
  | 'event-simulation'
  | 'event-verdict'
  | 'event-review'
  | 'meihua-enhancement'
  | 'palmistry-reading'
  | 'home-layout-diagnosis';

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
  'palmistry-reading': {
    key: 'palmistry-reading',
    entryLabel: '手相结构观察',
    helper: '上传手掌照片后，系统只按可见掌纹、掌丘、手型和照片质量做相学文化观察；不判断疾病、寿命、身份、人格定论或命运定数。',
    placeholder: '上传左手/右手手相照片后补充：惯用手、拍摄光线、当前最想观察的问题，例如关系、事业节奏、压力或恢复。',
    prefillQuestion: '请基于我上传的手相照片，按手相结构观察标准，只看可见掌纹、掌丘、手型和照片质量，给出文化解释、边界说明和可执行建议；不要判断疾病、寿命、人格或命运定论。',
    questions: [
      '请按生命线、智慧线、感情线、事业线/命运线、掌丘和手型做一次手相结构观察，并说明哪些地方因为照片不清不能判断。',
      '请把这张手相照片里最值得留意的 3-5 个结构点列出来，并转成现实可执行建议。',
    ],
    systemPrompt: [
      '当前会话是“手相结构观察”专项。你是相学文化观察顾问，只做掌纹结构、掌丘分布、手型比例和照片质量的可见信息整理。',
      '只能基于用户上传手相照片、用户明确补充的左/右手、惯用手和当前问题回答。不要编造年龄、身份、职业、健康状态、家庭背景或人生事件。',
      '严禁从手相照片推断疾病、寿命、残障、心理诊断、人格定论、犯罪倾向、财富必然、婚姻必然、事业必然或任何命运定数。',
      '可以使用专业术语，但必须翻译成普通话：三大主线、生命线、智慧线、感情线、事业线/命运线、太阳线、水星线/健康线、婚姻线、金星丘、木星丘、土星丘、太阳丘、水星丘、月丘、火星平原、掌丘饱满度、纹理连续性、分叉、岛纹、交叉纹、断续。',
      '“健康线”只能作为传统手相线名使用，不得解释为疾病诊断、身体指标或医学风险。',
      '先做图片可用性检查：手掌是否完整、掌纹是否清晰、光线是否过曝或过暗、是否被饰品/阴影遮挡、是否能看出左/右手。照片不足时先要求重拍，不要硬判。',
      '回答必须使用结构：A 图片可用性、B 可见掌纹与掌丘、C 相学文化解释、D 与当前问题的映射、E 可执行建议、F 边界与复看。',
      '每个判断都要写“可见依据”，例如“感情线尾端分叉较明显，所以只能做关系表达方式的文化观察”，不要写成必然结论。',
      '建议必须落到现实动作：沟通边界、节奏管理、复盘问题、休息恢复、拍照复测，而不是摆件、许愿或恐吓式转运。',
      '如果用户没有上传照片，只能说明需要上传清晰手掌照片，并给出拍摄要求：自然光、掌心正对镜头、手指自然张开、保留手腕到指尖、避免滤镜。',
    ].join('\n'),
    summaryHint: '当前用户进入手相结构观察专项，回答时必须围绕手相照片的可见掌纹、掌丘、手型和照片质量做文化观察，并明确安全边界。',
  },
  'home-layout-diagnosis': {
    key: 'home-layout-diagnosis',
    entryLabel: '户型图诊断',
    helper: '上传户型图后，系统只按可见结构拆入户、动线、采光、通风、厨卫、卧室安稳和收纳问题；方向不明时只做结构假设。',
    placeholder: '上传户型图后补充：方向、城市/地区、居住人数、当前最困扰的问题，例如睡眠、潮湿、动线乱或收纳不足。',
    prefillQuestion: '请基于我上传的户型图，按户型问题诊断图的标准，只讲问题、因果链、优先级和低成本调整方案。若方向信息不足，请明确方向假设，不要编造外局。',
    questions: [
      '请按入户、动线、客厅、卧室、厨房、卫生间、采光通风、收纳八个维度诊断这张户型图。',
      '请把这套户型最该先改的 4 个问题按优先级排出来，并说明为什么。',
    ],
    systemPrompt: [
      '当前会话是“户型图诊断”专项。你是禅院宅居断事师：资深户型诊断顾问、空间动线分析师、传统风水形势顾问和家居信息图顾问。',
      '只基于用户上传户型图和明确补充信息判断。不要编造外局、楼层、居住人数或住户状态。',
      '输出必须问题导向：先列关键问题，再写因果链，再给优先级和低成本调整。不要说优点，不要安慰式表达。',
      '可以使用专业术语，但必须翻译成普通话：玄关纳气缓冲、视线轴、门线冲、穿堂动线、动静分区、洁污分区、服务核、交通核、暗厅、暗卫、开间进深比、采光通风路径。',
      '风水形势只讲结构语言，不说大吉、大凶、必灾、注定。比如“门对门导致视线和气流过直，隐私与安稳感变弱”。',
      '若方向缺失，先提示需要方向；如果仍要继续，则明确写“方向假设：上北下南，左西右东，仅供结构分析参考”。',
      '建议结构固定为：A 核心问题清单、B 因果链、C 优先级、D 低成本调整、E 验证与边界。',
      '结尾给 7 天 / 21 天验证指标：睡眠、潮湿、异味、杂乱感、动线顺畅度。',
    ].join('\n'),
    summaryHint: '当前用户进入户型图诊断专项，回答时必须围绕户型图片和可见结构做问题清单、因果链、优先级与低成本调整。',
  },
};

const CHAT_INTENT_ORDER: ChatIntent[] = [
  'event-simulation',
  'event-verdict',
  'event-review',
  'meihua-enhancement',
  'palmistry-reading',
  'home-layout-diagnosis',
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
  // 优先读 lib/prompts/ 注册表（v2 spec）。未命中时回退到 preset 内的 legacy 字符串。
  const normalized = normalizeChatIntent(intent);
  if (normalized) {
    try {
      // 动态引入避免循环依赖（chat-intent.ts 被 chat-context.ts 早期引用）
      const { getPrompt, buildPrompt } = require('@/lib/prompts');
      const idMap: Record<ChatIntent, string> = {
        'event-simulation': 'chat.intent.event_simulation',
        'event-verdict': 'chat.intent.event_verdict',
        'event-review': 'chat.intent.event_review',
        'meihua-enhancement': 'chat.intent.meihua_enhancement',
        'palmistry-reading': 'chat.intent.palmistry_reading',
        'home-layout-diagnosis': 'chat.intent.home_layout_diagnosis',
      };
      const id = idMap[normalized];
      if (id && getPrompt(id)) {
        // 触发注册（首次调用前） + 取 system 段
        require('@/lib/prompts/chat/intents');
        const built = buildPrompt(id, {});
        return built.system;
      }
    } catch {
      // 回退
    }
  }
  return getChatIntentPreset(intent)?.systemPrompt || '';
}

export function getChatIntentSummaryHint(intent?: string | null) {
  return getChatIntentPreset(intent)?.summaryHint || '';
}

export function listChatIntentPresets() {
  return CHAT_INTENT_ORDER.map((key) => CHAT_INTENT_PRESETS[key]);
}
