import type { ContentArticle } from '@/lib/content-seeds';
import { DIMENSIONS } from '@/lib/dimensions/config';
import { GEO_CITY_SEEDS } from '@/lib/seo';

/** Richer section templates for SEO/GEO readability + answer-engine snippets */
export function buildRichSections(input: {
  title: string;
  trackTitle: string;
  angle?: string;
  faqs?: Array<[string, string]>;
  actions?: string[];
  geoCity?: string;
  dimensionTitle?: string;
}): Array<[string, string]> {
  const angle = input.angle || input.title;
  const sections: Array<[string, string]> = [
    [
      '一句话结论',
      `${angle} 的核心不是「吉凶标签」，而是先判断结构是否匹配、阶段是否允许、动作是否可验证。人生K线把它拆成：结构 → 时位 → 环境 → 动作 → 风险。`,
    ],
    [
      '核心问题',
      `${input.title} 属于「${input.trackTitle}」学习轨。先问三个问题：1）当前最大结构张力是什么？2）未来 90 天更适合推进还是收敛？3）哪一个动作能在 30 天内被现实验证？`,
    ],
    [
      '结构层怎么看',
      '从日主强弱、用神喜忌、十神角色入手，判断你更适合「建设型 / 表达型 / 协调型 / 收敛型」哪一种发挥方式。不要先问「好不好」，先问「像不像你现在的位置」。',
    ],
    [
      '时位层：阶段比结果重要',
      '大运定十年底色，流年定一年窗口。同一结构在抬升期与收敛期的动作完全不同：抬升期做验证与布局，收敛期做清理与守成。把时间窗写清楚，判断才可复盘。',
    ],
    [
      '环境层与现实约束',
      input.geoCity
        ? `当你身处${input.geoCity}（或正计划迁移到此），要把城市成本、行业密度、家庭责任一并算进「环境层」。命理给的是结构倾向，不是地理保证。`
        : '居住城市、行业周期、家庭责任与现金流，是环境层的硬约束。结构判断必须落在可支付、可执行的现实里。',
    ],
    [
      '行动层：本周可执行',
      (input.actions || [
        '写下当前最关键的 1 个问题（事业/财富/关系/节奏）',
        '进入对应十维度场景，生成带时间窗的判断',
        '把 1 个动作记到事件日历，30/90 天后回访验证',
      ])
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n'),
    ],
    [
      '如何用人生K线验证',
      input.dimensionTitle
        ? `建议路径：阅读本文 → 进入「${input.dimensionTitle}」十维度研判 → 同步预测回访 → 需要全局结构时再生成完整报告。`
        : '建议路径：阅读本文 → 进入相关十维度研判 → 同步预测回访 → 需要全局结构时再生成完整报告。工具中心适合快测，十维度适合深判。',
    ],
  ];

  if (input.faqs?.length) {
    for (const [q, a] of input.faqs) {
      sections.push([`常见问题：${q}`, a]);
    }
  }

  sections.push([
    '边界说明',
    '本文用于结构教育与判断框架，不构成医疗诊断、投资建议、法律意见或命运定论。具体决策请结合现实约束与专业意见。',
  ]);

  return sections;
}

/** 基础名词与读盘说明（学科内容；勿写入产品运营/SEO 元叙事） */
export function buildFoundationKnowledgeArticles(): ContentArticle[] {
  const items: Array<{
    slug: string;
    title: string;
    summary: string;
    angle: string;
    faqs: Array<[string, string]>;
    actions: string[];
    minutes: number;
  }> = [
    {
      slug: 'kb-day-master-plain',
      title: '日主是什么',
      summary: '日主是八字中代表自身的字，是读盘的起点。',
      angle: '日主',
      minutes: 6,
      faqs: [
        ['日主强弱怎么理解？', '强弱描述资源与发挥方式的差异，需结合用神与阶段一起看。'],
        ['日主会改变吗？', '出生结构固定；可调整的是行动与时间窗口选择。'],
      ],
      actions: ['在报告中找到日主', '对照用神写一条近期可执行的事'],
    },
    {
      slug: 'kb-yong-shen-guide',
      title: '用神与喜神',
      summary: '用神指更有利的方向，喜神为辅助因素，用于取舍而非求签。',
      angle: '用神',
      minutes: 8,
      faqs: [
        ['用神会随流年变吗？', '结构用神相对稳定，流年会改变侧重与窗口。'],
        ['多个用神如何取舍？', '优先 1–2 个主方向，做成可核对的结果再扩展。'],
      ],
      actions: ['记下本盘用神/喜神', '本周做一件与用神同向的小事'],
    },
    {
      slug: 'kb-ji-shen-boundary',
      title: '忌神是什么',
      summary: '忌神表示更容易消耗的方向，宜在高压决策时降低暴露。',
      angle: '忌神',
      minutes: 6,
      faqs: [
        ['忌神是否绝对不能碰？', '不是禁令，而是大决策与高压窗口时更需谨慎。'],
        ['与忌神相关时怎么办？', '缩小规模、拉长验证周期，避免一次重仓。'],
      ],
      actions: ['标出本盘忌神', '检查近期大决策是否落在忌神方向'],
    },
    {
      slug: 'kb-dayun-liunian',
      title: '大运与流年',
      summary: '大运约十年一段主题，流年是当年气候，二者叠加看节奏。',
      angle: '大运流年',
      minutes: 7,
      faqs: [
        ['大运偏紧意味着什么？', '推进成本可能更高，宜保全与准备，不等于十年无望。'],
        ['流年顺利能否放大投入？', '仍建议小步验证，并守住风险边界。'],
      ],
      actions: ['对照当前大运与流年', '写下今年宜推进/宜收敛各一句'],
    },
    {
      slug: 'kb-pattern-plain',
      title: '格局是什么',
      summary: '格局是命盘结构类型的概括标签，用于理解特征而非判决命运。',
      angle: '格局',
      minutes: 6,
      faqs: [
        ['格局名称重要吗？', '重要的是它提示的发挥方式与适合动作，而非头衔本身。'],
      ],
      actions: ['在总评中找到格局名称', '用「适合什么动作」复述一遍'],
    },
    {
      slug: 'kb-life-kline-read',
      title: '人生K线怎么看',
      summary: '人生K线把大运流年加权为一生曲线，便于看高低点与当前位置。',
      angle: '人生K线',
      minutes: 8,
      faqs: [
        ['低分年份如何安排？', '侧重保全、学习与关系维护，控制并行事项。'],
        ['高分年份如何安排？', '适合布局与收获验证，仍避免一次重仓。'],
      ],
      actions: ['在 K 线上标出当前年', '把近期需留意的月份记入事件本'],
    },
    {
      slug: 'kb-four-pillars-map',
      title: '四柱分别看什么',
      summary: '年柱、月柱、日柱、时柱从不同侧面描述背景、阶段、自身与发挥。',
      angle: '四柱',
      minutes: 7,
      faqs: [
        ['时辰不准影响什么？', '结构与大运仍可参考；短时窗口判断会更保守。'],
      ],
      actions: ['对照本盘四柱', '各用一句话概括年/月/日/时印象'],
    },
  ];

  return items.map((item) => ({
    slug: item.slug,
    type: 'knowledge' as const,
    title: item.title,
    summary: item.summary,
    trackKey: 'intro',
    readMinutes: item.minutes,
    keywords: ['八字', '人生K线', item.angle, '入门'],
    sections: buildRichSections({
      title: item.title,
      trackTitle: '入门',
      angle: item.angle,
      dimensionTitle: '运势节奏',
      faqs: item.faqs,
      actions: item.actions,
    }),
  }));
}

export function buildDimensionKnowledgeArticles(): ContentArticle[] {
  return DIMENSIONS.map((dim) => {
    const trackKey =
      dim.relatedIntent === 'career'
        ? 'career'
        : dim.relatedIntent === 'wealth'
          ? 'wealth'
          : dim.relatedIntent === 'relationship'
            ? 'relationship'
            : dim.slug === 'health'
              ? 'health'
              : dim.slug === 'living-environment'
                ? 'migration'
                : dim.slug.includes('timing') || dim.slug === 'naming'
                  ? 'application'
                  : 'intro';

    return {
      slug: `dimension-guide-${dim.slug}`,
      type: 'knowledge' as const,
      title: `${dim.title}怎么看：从问题到可验证判断`,
      summary: `${dim.question} 本文说明「${dim.title}」维度如何结合八字结构、大运流年与人生K线给出可执行结论。`,
      trackKey,
      readMinutes: 8,
      sections: buildRichSections({
        title: `${dim.title}怎么看`,
        trackTitle: trackKey,
        angle: dim.title,
        dimensionTitle: dim.title,
        actions: [
          `打开十维度「${dim.title}」生成结构化研判`,
          '把 3 条预测同步到预测回访',
          '选 1 个动作本周执行，并记录事件节点',
        ],
        faqs: [
          [
            `${dim.title}适合什么人？`,
            `当你明确在问「${dim.question}」时，优先用该维度，而不是先生成一份泛化大报告。`,
          ],
          [
            '结论准不准怎么验证？',
            '看预测是否带时间窗、是否可回访打分。准的标准是可验证，而不是文案好听。',
          ],
        ],
      }),
    };
  });
}

export function buildGeoInsightArticles(): ContentArticle[] {
  return GEO_CITY_SEEDS.map((city) => ({
    slug: city.slug,
    type: 'insight' as const,
    title: city.title,
    summary: `${city.region} · ${city.summary}`,
    trackKey: 'migration',
    readMinutes: 7,
    insightType: 'city',
    sections: buildRichSections({
      title: city.title,
      trackTitle: '迁移轨',
      angle: `${city.city}城市结构观察`,
      geoCity: city.city,
      dimensionTitle: '居家环境 / 运势节奏',
      actions: [
        `评估你在${city.city}的居住与职业成本是否可承受`,
        '进入「居家环境」「运势节奏」维度做结构对照',
        '若计划迁移，记录决策节点到事件日历以便回测',
      ],
      faqs: [
        [
          `命理能决定该不该去${city.city}吗？`,
          '不能单独决定。命理提供结构与节奏倾向，最终要与签证、家庭、行业、现金流共同判断。',
        ],
        [
          '迁移判断优先看什么？',
          '先看阶段是否允许重排，再看城市环境是否匹配用神发挥方式，最后做可逆的小步验证。',
        ],
      ],
    }),
  }));
}

export function buildSeoPillarArticles(): ContentArticle[] {
  return [
    {
      slug: 'ten-dimensions-guide',
      type: 'knowledge',
      title: '人生K线十维度是什么？如何从问题进入判断',
      summary: '十维度把用户最关心的问题拆成可执行场景：运势节奏、工作行业、投资理财、婚恋、健康等，并与预测回访联动。',
      trackKey: 'intro',
      readMinutes: 9,
      sections: buildRichSections({
        title: '人生K线十维度是什么',
        trackTitle: '入门轨',
        angle: '十维度场景化命理',
        dimensionTitle: '运势节奏',
        actions: [
          '先选一个最痛的问题进入对应维度',
          '生成结论与 3 条可验证预测',
          '到期在预测回访打分，形成个人校准',
        ],
        faqs: [
          [
            '十维度和完整报告有什么区别？',
            '完整报告看全局结构；十维度先回答一个具体问题。可先维度后报告，也可先报告后维度深挖。',
          ],
          [
            '适合 SEO / AI 摘要的一句话定义？',
            '人生K线十维度是问题导向的命理场景研判系统，输出结构判断、行动建议与可回访预测。',
          ],
        ],
      }),
    },
    {
      slug: 'prediction-feedback-loop-guide',
      type: 'knowledge',
      title: '预测回访机制：让命理判断变得可验证',
      summary: '解释 dueDate、命中反馈与校准如何让下一轮报告更贴近个人轨迹。',
      trackKey: 'intro',
      readMinutes: 7,
      sections: buildRichSections({
        title: '预测回访机制',
        trackTitle: '入门轨',
        angle: '可验证命理',
        dimensionTitle: '运势节奏',
        faqs: [
          [
            '为什么要做预测回访？',
            '没有反馈的判断无法校准。回访把“说得通”变成“可检验”。',
          ],
        ],
      }),
    },
    {
      slug: 'bazi-for-overseas-chinese-geo',
      type: 'knowledge',
      title: '海外华人如何用八字做阶段决策（GEO 指南）',
      summary: '面向北美、澳洲、欧洲、东亚华人的迁移、职业与家庭排序框架，强调环境层与时位层。',
      trackKey: 'migration',
      readMinutes: 10,
      sections: buildRichSections({
        title: '海外华人八字阶段决策',
        trackTitle: '迁移轨',
        angle: '海外华人 GEO 决策',
        geoCity: '海外主要华人城市',
        dimensionTitle: '居家环境',
        faqs: [
          [
            '时差和真太阳时怎么处理？',
            '以出生地经度做真太阳时校正；迁移后的环境层改变的是发挥场景，不是重排四柱本身。',
          ],
          [
            'GEO 内容如何帮助决策？',
            '城市观察帮助你把“结构倾向”映射到当地成本、行业与家庭约束，而不是给出迁城吉凶。',
          ],
        ],
      }),
    },
  ];
}
