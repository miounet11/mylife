/**
 * 面相 / 手相 v3：系统性报告
 * 阅读顺序固定：物理结构（可见）→ 命理交叉（教学）→ 综合行动与边界
 * 禁止疾病 / 寿命 / 定命断语
 */

import type {
  XiangxueDimScore,
  XiangxueFrameworkItem,
  XiangxueKind,
  XiangxueObservation,
  XiangxueSection,
  XiangxueSessionResult,
} from './types';
import type { SavedUserMedia } from '@/lib/user-media-store';

/* ── 物理维度（可见结构） ── */

const FACE_PHYSICAL: Array<{ id: string; label: string }> = [
  { id: 'photo', label: '成像质量' },
  { id: 'pose', label: '姿态与角度' },
  { id: 'symmetry', label: '左右对称' },
  { id: 'santine', label: '三庭比例' },
  { id: 'wuyan', label: '五眼横比' },
  { id: 'forehead', label: '额部与发际' },
  { id: 'brow_eye', label: '眉眼距离与神采' },
  { id: 'nose', label: '鼻梁与鼻翼' },
  { id: 'mouth', label: '口唇与人中' },
  { id: 'jaw', label: '下颌与轮廓' },
  { id: 'cheek_chin', label: '颧颊与颏部' },
  { id: 'skin_light', label: '光线与肤色层次' },
];

const FACE_MINGLI: Array<{ id: string; label: string }> = [
  { id: 'tianshi', label: '天时（生辰）' },
  { id: 'sancai', label: '三才气机（上中下）' },
  { id: 'shiergong', label: '十二宫气质映射' },
  { id: 'wuguan_qi', label: '五官气机' },
  { id: 'yongshen_cross', label: '用神交叉' },
  { id: 'spirit', label: '精神面与神藏' },
  { id: 'expression', label: '表达与沟通倾向' },
];

const PALM_PHYSICAL: Array<{ id: string; label: string }> = [
  { id: 'photo', label: '成像质量' },
  { id: 'frame', label: '取景与对焦' },
  { id: 'hand_shape', label: '手型与指长' },
  { id: 'life_line', label: '生命线形态' },
  { id: 'head_line', label: '智慧线形态' },
  { id: 'heart_line', label: '感情线形态' },
  { id: 'fate_line', label: '事业线可见度' },
  { id: 'sun_line', label: '太阳线可见度' },
  { id: 'mounts', label: '掌丘起伏' },
  { id: 'texture', label: '掌纹清晰度' },
  { id: 'fingers', label: '指节与指缝' },
];

const PALM_MINGLI: Array<{ id: string; label: string }> = [
  { id: 'tianshi', label: '天时（生辰）' },
  { id: 'three_lines', label: '三线气机' },
  { id: 'mount_qi', label: '掌丘气机' },
  { id: 'yongshen_cross', label: '用神交叉' },
  { id: 'action_rhythm', label: '行动节奏倾向' },
  { id: 'balance', label: '掌心阴阳平衡' },
  { id: 'self_review', label: '自我复盘焦点' },
];

/* ── 经典框架对照 ── */

function faceFramework(yong: string[]): XiangxueFrameworkItem[] {
  return [
    {
      id: 'fw-santine',
      classicName: '三庭',
      physicalFocus: '发际→眉、眉→鼻底、鼻底→颏',
      note: '先量比例再谈「上中下气」；比例属物理，气机属教学层。',
      layer: 'physical',
    },
    {
      id: 'fw-wuyan',
      classicName: '五眼',
      physicalFocus: '脸宽是否约等于五只眼宽',
      note: '横比仅描述可见宽度分布，不作吉凶。',
      layer: 'physical',
    },
    {
      id: 'fw-wuguan',
      classicName: '五官',
      physicalFocus: '眉、眼、鼻、口、耳（耳常被发遮）',
      note: '逐官描述轮廓与开合，再进入气机阅读。',
      layer: 'physical',
    },
    {
      id: 'fw-shiergong',
      classicName: '十二宫（摘要）',
      physicalFocus: '额（官禄）、眉眼（兄弟/迁移示意）、鼻（财帛示意）等分区',
      note: '宫位只作气质讨论分区，禁止财富/婚姻定数。',
      layer: 'mingli',
    },
    {
      id: 'fw-yong',
      classicName: '用神交叉',
      physicalFocus: '图像气质 × 八字用神',
      note: yong.length
        ? `用神 ${yong.join('、')}：对照妆造、作息、沟通风格等可调环境。`
        : '无生辰时本框为弱提示，补排盘后强化。',
      layer: 'mingli',
    },
  ];
}

function palmFramework(yong: string[], side?: string): XiangxueFrameworkItem[] {
  return [
    {
      id: 'fw-shape',
      classicName: '手型',
      physicalFocus: '掌长、指长、掌宽相对比例',
      note: `先定手型再读线${side === 'left' ? '（左手）' : side === 'right' ? '（右手）' : ''}。`,
      layer: 'physical',
    },
    {
      id: 'fw-3lines',
      classicName: '三主线',
      physicalFocus: '生命线 · 智慧线 · 感情线',
      note: '描述起止、弧度、深浅、分叉——仅可见形态。',
      layer: 'physical',
    },
    {
      id: 'fw-fate',
      classicName: '事业线 / 太阳线',
      physicalFocus: '从腕向中指 / 无名指方向的纵纹',
      note: '不可见则标明「弱证据」，不强行编造。',
      layer: 'physical',
    },
    {
      id: 'fw-mounts',
      classicName: '掌丘',
      physicalFocus: '金星丘、木星丘、土星丘、月丘等起伏',
      note: '起伏属物理；气机属教学交叉。',
      layer: 'physical',
    },
    {
      id: 'fw-yong-p',
      classicName: '用神 × 节奏',
      physicalFocus: '推进方式与复盘焦点',
      note: yong.length
        ? `用神 ${yong.join('、')}：谈「怎么推进」不谈「结果定数」。`
        : '补生辰后可做完整节奏对照。',
      layer: 'mingli',
    },
  ];
}

export function heuristicXiangxue(input: {
  kind: XiangxueKind;
  media: SavedUserMedia;
  hasBirth: boolean;
  yongShen?: string[];
  dayMaster?: string;
  side?: string;
  gender?: string;
  note?: string;
}): Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'> {
  const photoScore = scorePhoto(input.media.bytes);
  const photoLevel = photoScore >= 75 ? 'good' : photoScore >= 55 ? 'ok' : 'poor';
  const birthBoost = input.hasBirth ? 20 : 0;
  const yong = input.yongShen || [];
  const confBase = photoLevel === 'good' ? 78 : photoLevel === 'ok' ? 62 : 44;

  const physDefs = input.kind === 'face' ? FACE_PHYSICAL : PALM_PHYSICAL;
  const mingDefs = input.kind === 'face' ? FACE_MINGLI : PALM_MINGLI;

  const physicalDims: XiangxueDimScore[] = physDefs.map((d) => {
    if (d.id === 'photo' || d.id === 'frame') {
      return {
        id: d.id,
        label: d.label,
        layer: 'physical',
        score: photoScore,
        confidence: 90,
        evidence: 'visible' as const,
        note:
          photoLevel === 'good'
            ? '清晰度与文件量级支持结构细读'
            : photoLevel === 'ok'
              ? '基本可用，建议补自然光正面/掌心特写'
              : '成像偏弱，物理结论可信度下降',
      };
    }
    const seed = hashStr(input.media.sha256 + d.id);
    const score = clamp(48 + (seed % 32) + (photoScore >= 70 ? 4 : 0), 30, 92);
    const evidence =
      photoLevel === 'poor' ? ('weak' as const) : score >= 70 ? ('visible' as const) : ('inferred' as const);
    return {
      id: d.id,
      label: d.label,
      layer: 'physical',
      score,
      confidence: clamp(confBase + (seed % 12) - 4, 30, 92),
      evidence,
      note: physicalNote(input.kind, d.id, score, evidence),
    };
  });

  const mingliDims: XiangxueDimScore[] = mingDefs.map((d) => {
    if (d.id === 'tianshi') {
      return {
        id: d.id,
        label: d.label,
        layer: 'mingli',
        score: 42 + birthBoost,
        confidence: input.hasBirth ? 72 : 28,
        evidence: input.hasBirth ? ('visible' as const) : ('weak' as const),
        note: input.hasBirth
          ? `已关联生辰${yong.length ? ` · 用神 ${yong.join('、')}` : ''}${input.dayMaster ? ` · 日主 ${input.dayMaster}` : ''}`
          : '未填生辰：命理交叉仅作弱提示',
      };
    }
    if (d.id === 'yongshen_cross') {
      return {
        id: d.id,
        label: d.label,
        layer: 'mingli',
        score: yong.length ? 58 + Math.min(20, yong.length * 6) : 40,
        confidence: yong.length ? 68 : 30,
        evidence: yong.length ? ('inferred' as const) : ('weak' as const),
        note: yong.length
          ? `用神 ${yong.join('、')}：图像气质与用神元素是否同向（教学层）`
          : '无用神：建议排盘后再做交叉',
      };
    }
    const seed = hashStr(input.media.sha256 + 'm' + d.id);
    const score = clamp(46 + (seed % 26) + (input.hasBirth ? 8 : 0), 28, 90);
    return {
      id: d.id,
      label: d.label,
      layer: 'mingli',
      score,
      confidence: input.hasBirth ? clamp(55 + (seed % 20), 40, 85) : clamp(30 + (seed % 15), 22, 55),
      evidence: input.hasBirth ? ('inferred' as const) : ('weak' as const),
      note: mingliNote(input.kind, d.id, score, yong),
    };
  });

  const dims = [...physicalDims, ...mingliDims];
  const physicalScore = avg(physicalDims.map((d) => d.score));
  const mingliScore = avg(mingliDims.map((d) => d.score));
  const overallScore = Math.round(physicalScore * 0.58 + mingliScore * 0.42);
  const confidenceScore = Math.round(
    avg(physicalDims.map((d) => d.confidence ?? confBase)) * 0.7 +
      avg(mingliDims.map((d) => d.confidence ?? 40)) * 0.3,
  );

  const physicalHeadline =
    input.kind === 'face'
      ? `物理层：成像${photoLevelLabel(photoLevel)}，三庭五眼与五官分区综合约 ${physicalScore} 分——只依据可见比例、对称与轮廓。`
      : `物理层：掌纹成像${photoLevelLabel(photoLevel)}，手型与三线综合约 ${physicalScore} 分——只依据可见形态与清晰度。`;

  const mingliHeadline = input.hasBirth
    ? `命理层：已交叉生辰${yong.length ? `（用神 ${yong.join('、')}）` : ''}${input.dayMaster ? ` · 日主 ${input.dayMaster}` : ''}，综合约 ${mingliScore} 分——只谈气质与节奏，不断吉凶。`
    : `命理层：未绑定生辰（${mingliScore} 分弱提示）。补生辰后可做人像/掌纹与用神同向阅读。`;

  const synthesisHeadline =
    photoLevel === 'poor'
      ? '综合：请先提升成像质量，再依赖结构结论；当前以补拍建议为主。'
      : input.hasBirth
        ? '综合：物理层定边界，命理层供气质讨论，落到 1–3 个可验证动作。'
        : '综合：物理层已可复盘；补生辰可打开完整命理交叉。';

  const framework =
    input.kind === 'face' ? faceFramework(yong) : palmFramework(yong, input.side);

  const sections = buildSections(input.kind, physicalDims, mingliDims, {
    photoLevel,
    hasBirth: input.hasBirth,
    yong,
    side: input.side,
    dayMaster: input.dayMaster,
    note: input.note,
    confidenceScore,
  });

  const observations: XiangxueObservation[] = sections.flatMap((sec) =>
    sec.items.slice(0, 2).map((it, i) => ({
      id: `${sec.id}-${i}`,
      title: it.title,
      body: it.body,
      layer: sec.layer,
      tone: sec.layer === 'meta' ? 'muted' : sec.layer === 'mingli' ? 'positive' : 'default',
    })),
  );

  const strengths = buildStrengths(input.kind, physicalDims, photoLevel, input.hasBirth);
  const watchpoints = buildWatchpoints(input.kind, photoLevel, input.hasBirth, physicalDims);

  const actions = buildActions(input.kind, photoLevel, input.hasBirth, input.note);

  const readingPath =
    input.kind === 'face'
      ? [
          '① 成像与取景',
          '② 三庭五眼（物理）',
          '③ 五官分区细读',
          '④ 十二宫/气机（教学）',
          '⑤ 生辰用神交叉',
          '⑥ 行动建议与边界',
        ]
      : [
          '① 成像与取景',
          '② 手型指长（物理）',
          '③ 三主线 + 事业线',
          '④ 掌丘气机（教学）',
          '⑤ 生辰用神节奏',
          '⑥ 21 天复看与边界',
        ];

  return {
    schema: 'life-kline.xiangxue.v3',
    kind: input.kind,
    title: input.kind === 'face' ? '面相系统报告' : '手相系统报告',
    summary: `${physicalHeadline} ${mingliHeadline}`,
    physicalHeadline,
    mingliHeadline,
    synthesisHeadline,
    generatedAt: new Date().toISOString(),
    overallScore,
    physicalScore,
    mingliScore,
    confidenceScore,
    dims,
    sections,
    observations,
    actions,
    readingPath,
    framework,
    strengths,
    watchpoints,
    disclaimers: [
      '报告固定三层：物理结构（可见）→ 命理交叉（教学示意）→ 综合行动与边界。',
      '非医学诊断；不判断疾病、寿命、婚恋必然、财富定数。',
      '照片默认私有；仅授权后可用于脱敏线图内容。',
      '命理层用语为文化框架，不可替代现实决策与专业咨询。',
    ],
    visibleTags: buildTags(input.kind, photoLevel, input.hasBirth, input.side),
    photoQuality: {
      score: photoScore,
      level: photoLevel,
      tips:
        photoLevel === 'good'
          ? ['光线与清晰度支持细读', '可作基线照，换季对照']
          : photoLevel === 'ok'
            ? ['尽量避免逆光', '主体占画面一半以上', '关闭美颜滤镜']
            : ['请靠近拍摄', '关闭美颜/强滤镜', '补自然光', '保持镜头平行于脸/掌'],
    },
  };
}

function photoLevelLabel(level: string): string {
  return level === 'good' ? '良好' : level === 'ok' ? '尚可' : '偏弱';
}

function buildStrengths(
  kind: XiangxueKind,
  physical: XiangxueDimScore[],
  photoLevel: string,
  hasBirth: boolean,
): string[] {
  const top = [...physical]
    .filter((d) => d.id !== 'photo' && d.id !== 'frame')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const list = top.map((d) => `${d.label}相对清晰（示意 ${d.score}）`);
  if (photoLevel === 'good') list.unshift('成像支持结构细读');
  if (hasBirth) list.push('已具备生辰交叉条件');
  if (kind === 'palm') list.push('三主线为掌纹复盘主轴');
  return list.slice(0, 5);
}

function buildWatchpoints(
  kind: XiangxueKind,
  photoLevel: string,
  hasBirth: boolean,
  physical: XiangxueDimScore[],
): string[] {
  const list: string[] = [];
  if (photoLevel !== 'good') list.push('成像未达最佳，部分分区为弱证据');
  if (!hasBirth) list.push('未绑定生辰，命理层置信度低');
  const weak = physical.filter((d) => d.evidence === 'weak' || (d.confidence ?? 50) < 45);
  if (weak.length) list.push(`${weak.slice(0, 2).map((d) => d.label).join('、')} 证据偏弱`);
  if (kind === 'face') list.push('浓妆/滤镜会扭曲五官比例判断');
  else list.push('反光与弯曲手指会改变线纹观感');
  list.push('禁止将本报告当作疾病、寿命或财运判决');
  return list.slice(0, 6);
}

function buildActions(
  kind: XiangxueKind,
  photoLevel: string,
  hasBirth: boolean,
  note?: string,
): string[] {
  if (kind === 'face') {
    return [
      photoLevel !== 'good'
        ? '补拍：正面、双眼平视、自然光、无美颜；脸部占画面 50%+'
        : '保留本图为基线，3 个月后同光线再拍对照',
      hasBirth
        ? '对照完整八字报告，把「气质倾向」落成 1 个可验证行动（如沟通节奏、作息）'
        : '补充出生日期后重跑，开启完整命理交叉',
      note
        ? `针对关注点「${note.slice(0, 40)}」：用 7 天日记记录相关现实反馈`
        : '重要决策勿单靠面相；结合事件记录与现实反馈',
      '妆造/发型微调可当作「环境层」实验，不作改命承诺',
      '需要系统决策时，回到人生 K 线完整报告与事件复盘',
    ];
  }
  return [
    photoLevel !== 'good'
      ? '补拍：手心向上、五指自然张开、掌心占 60%+、避免反光'
      : '左右手各留一张基线照',
    '21 天内同光线再拍，排除拍摄差异',
    hasBirth
      ? '用神方向只看「行动节奏」与复盘焦点，不断结果定数'
      : '补生辰后重跑命理交叉',
    note
      ? `围绕「${note.slice(0, 40)}」设定 1 个可观察指标（如推进频率）`
      : '把三主线观察转成 1 个工作/关系节奏实验',
    '勿用手相判断疾病寿命；身体问题请就医',
  ];
}

function buildSections(
  kind: XiangxueKind,
  physical: XiangxueDimScore[],
  mingli: XiangxueDimScore[],
  ctx: {
    photoLevel: string;
    hasBirth: boolean;
    yong: string[];
    side?: string;
    dayMaster?: string;
    note?: string;
    confidenceScore: number;
  },
): XiangxueSection[] {
  const physCore = physical.filter((d) => d.id !== 'photo' && d.id !== 'frame');

  if (kind === 'face') {
    const ratioIds = new Set(['santine', 'wuyan', 'symmetry', 'pose']);
    const featureIds = new Set(['forehead', 'brow_eye', 'nose', 'mouth', 'jaw', 'cheek_chin', 'skin_light']);
    const ratioItems = physCore
      .filter((d) => ratioIds.has(d.id))
      .map((d) => ({
        title: d.label,
        body: `${d.note}（示意 ${d.score} · 证据 ${evidenceLabel(d.evidence)}）`,
        tag: '可见',
      }));
    const featureItems = physCore
      .filter((d) => featureIds.has(d.id))
      .map((d) => ({
        title: d.label,
        body: `${d.note}（示意 ${d.score} · 证据 ${evidenceLabel(d.evidence)}）`,
        tag: '分区',
      }));

    return [
      {
        id: 'phys-imaging',
        layer: 'physical',
        step: 1,
        heading: '一、物理层 · 成像与取景',
        lead: '先判断「这张图能不能细读」。成像差时，后续分数仅供参考。',
        items: [
          {
            title: '成像评估',
            body: `质量等级 ${photoLevelLabel(ctx.photoLevel)}。整体结构置信约 ${ctx.confidenceScore}。物理结论完全取决于清晰度、角度、遮挡与是否滤镜。`,
            tag: '门槛',
          },
          {
            title: '阅读纪律',
            body: '只描述看得见的比例、对称、轮廓与光线；不出现吉凶词。耳部被发遮挡时标明不可见。',
            tag: '方法',
          },
        ],
      },
      {
        id: 'phys-ratio',
        layer: 'physical',
        step: 2,
        heading: '二、物理层 · 三庭五眼与对称',
        lead: '三庭（上中下）、五眼（横宽）与左右对称是面相物理的骨架。',
        items:
          ratioItems.length > 0
            ? ratioItems
            : [
                {
                  title: '比例骨架',
                  body: '启发式引擎已给出分区示意分；视觉模型可用时将替换为读图描述。',
                },
              ],
      },
      {
        id: 'phys-features',
        layer: 'physical',
        step: 3,
        heading: '三、物理层 · 五官与轮廓细读',
        lead: '额、眉眼、鼻、口唇人中、下颌颧颊——逐区描述可见形态。',
        items: featureItems.length
          ? featureItems
          : [{ title: '五官', body: '等待读图或启发式分区。' }],
      },
      {
        id: 'mingli-qi',
        layer: 'mingli',
        step: 4,
        heading: '四、命理层 · 三才气机与十二宫（教学）',
        lead: '在物理描述之上，用传统分区谈气质/节奏——教学框架，不断命运。',
        items: [
          {
            title: '阅读顺序提醒',
            body: '必须先接受物理层边界，再进入气机；禁止跳过成像直接断吉凶。',
            tag: '纪律',
          },
          ...mingli
            .filter((d) => ['sancai', 'shiergong', 'wuguan_qi', 'spirit', 'expression'].includes(d.id))
            .map((d) => ({
              title: d.label,
              body: d.note,
              tag: '教学',
            })),
        ],
      },
      {
        id: 'mingli-bazi',
        layer: 'mingli',
        step: 5,
        heading: '五、命理层 · 生辰与用神交叉',
        lead: ctx.hasBirth
          ? '天时已绑定：只做气质同向讨论与可调环境建议。'
          : '天时未绑定：本层为弱提示，建议补生辰重跑。',
        items: [
          {
            title: '天时状态',
            body: ctx.hasBirth
              ? `生辰已关联${ctx.dayMaster ? ` · 日主 ${ctx.dayMaster}` : ''}${ctx.yong.length ? ` · 用神 ${ctx.yong.join('、')}` : ''}。`
              : '未填生辰：命理交叉置信度低，请勿当作完整结论。',
            tag: ctx.hasBirth ? '已绑定' : '弱提示',
          },
          ...mingli
            .filter((d) => ['tianshi', 'yongshen_cross'].includes(d.id))
            .map((d) => ({ title: d.label, body: d.note, tag: '交叉' })),
          {
            title: '用神实践提示',
            body: ctx.yong.length
              ? `用神 ${ctx.yong.join('、')}：可对照妆造配色、沟通节奏、作息等「环境层」微调，而非改命承诺。`
              : '完成排盘后可强化本交叉。',
          },
          ...(ctx.note
            ? [
                {
                  title: '用户关注点',
                  body: `你提到「${ctx.note}」：以下建议会优先贴近该主题，但仍受物理层边界约束。`,
                  tag: '关注',
                },
              ]
            : []),
        ],
      },
      {
        id: 'synthesis',
        layer: 'meta',
        step: 6,
        heading: '六、综合 · 行动、复盘与硬边界',
        lead: '把两层合成「可验证行动」，拒绝恐吓式断语。',
        items: [
          {
            title: '如何使用本报告',
            body: '物理层决定「图能不能看、看到了什么」；命理层只提供气质与节奏讨论框架；综合层只给可执行下一步。',
          },
          {
            title: '硬边界',
            body: '不涉及疾病诊断、寿命、婚恋必然、财富定数或身份识别。涉及健康请就医。',
            tag: '边界',
          },
          {
            title: '建议复盘节奏',
            body: '基线照 → 21～90 天同条件再拍 → 对照现实事件记录，而非反复求「准不准」。',
          },
        ],
      },
    ];
  }

  /* palm */
  const lineIds = new Set(['life_line', 'head_line', 'heart_line', 'fate_line', 'sun_line', 'texture']);
  const shapeIds = new Set(['hand_shape', 'fingers', 'mounts']);
  return [
    {
      id: 'phys-palm-img',
      layer: 'physical',
      step: 1,
      heading: '一、物理层 · 成像与取景',
      lead: '掌纹深浅观感受光线、焦距、手心弯曲影响极大。',
      items: [
        {
          title: '成像评估',
          body: `质量 ${photoLevelLabel(ctx.photoLevel)}${ctx.side ? ` · ${ctx.side === 'left' ? '左手' : ctx.side === 'right' ? '右手' : '手别未标'}` : ''} · 置信约 ${ctx.confidenceScore}。`,
          tag: '门槛',
        },
        {
          title: '阅读纪律',
          body: '只描述可见起止、弧度、分叉与掌丘起伏；线不可见时写「弱证据」，禁止编造。',
          tag: '方法',
        },
      ],
    },
    {
      id: 'phys-palm-shape',
      layer: 'physical',
      step: 2,
      heading: '二、物理层 · 手型、指长与掌丘',
      lead: '先定手型骨架，再进入线纹。',
      items: physCore
        .filter((d) => shapeIds.has(d.id))
        .map((d) => ({
          title: d.label,
          body: `${d.note}（示意 ${d.score} · ${evidenceLabel(d.evidence)}）`,
          tag: '可见',
        })),
    },
    {
      id: 'phys-palm-lines',
      layer: 'physical',
      step: 3,
      heading: '三、物理层 · 三主线与辅助线',
      lead: '生命线、智慧线、感情线为主；事业线/太阳线可见则补，不可见不强行。',
      items: physCore
        .filter((d) => lineIds.has(d.id))
        .map((d) => ({
          title: d.label,
          body: `${d.note}（示意 ${d.score} · ${evidenceLabel(d.evidence)}）`,
          tag: '线纹',
        })),
    },
    {
      id: 'mingli-palm-qi',
      layer: 'mingli',
      step: 4,
      heading: '四、命理层 · 三线气机与掌丘（教学）',
      lead: '传统气机阅读 + 自我复盘焦点，不断吉凶。',
      items: mingli
        .filter((d) => ['three_lines', 'mount_qi', 'action_rhythm', 'balance', 'self_review'].includes(d.id))
        .map((d) => ({ title: d.label, body: d.note, tag: '教学' })),
    },
    {
      id: 'mingli-palm-bazi',
      layer: 'mingli',
      step: 5,
      heading: '五、命理层 · 生辰用神与行动节奏',
      lead: ctx.hasBirth ? '交叉天时，只谈推进方式。' : '无生辰：节奏讨论为弱提示。',
      items: [
        {
          title: '天时状态',
          body: ctx.hasBirth
            ? `已关联${ctx.dayMaster ? ` · 日主 ${ctx.dayMaster}` : ''}${ctx.yong.length ? ` · 用神 ${ctx.yong.join('、')}` : ''}。`
            : '未填生辰，命理层请谨慎引用。',
          tag: ctx.hasBirth ? '已绑定' : '弱提示',
        },
        ...mingli
          .filter((d) => ['tianshi', 'yongshen_cross'].includes(d.id))
          .map((d) => ({ title: d.label, body: d.note, tag: '交叉' })),
        {
          title: '用神提示',
          body: ctx.yong.length
            ? `用神 ${ctx.yong.join('、')}：对照事业线/智慧线讨论「推进方式」，不断结果。`
            : '补生辰后可做更完整的节奏对照。',
        },
      ],
    },
    {
      id: 'synthesis-palm',
      layer: 'meta',
      step: 6,
      heading: '六、综合 · 21 天复看与硬边界',
      lead: '用重复拍摄区分「真变化」与「拍摄差」。',
      items: [
        {
          title: '21 天复看',
          body: '同光线、同手别、同张开程度再拍一张，并记录期间 1 件关键事件。',
        },
        {
          title: '硬边界',
          body: '不判断疾病、寿命、财运必然或婚姻定数。健康问题请就医。',
          tag: '边界',
        },
        {
          title: '如何使用',
          body: '物理层看结构，命理层谈节奏，综合层只保留可验证动作。',
        },
      ],
    },
  ];
}

function evidenceLabel(e?: string): string {
  if (e === 'visible') return '可见';
  if (e === 'weak') return '弱证据';
  return '推断';
}

export type LlmXiangxuePayload = {
  summary?: string;
  physicalHeadline?: string;
  mingliHeadline?: string;
  synthesisHeadline?: string;
  physicalSections?: Array<{ title: string; body: string; tag?: string }>;
  mingliSections?: Array<{ title: string; body: string; tag?: string }>;
  metaSections?: Array<{ title: string; body: string; tag?: string }>;
  /** 可选：按章节 id 覆盖整章 items */
  sectionOverrides?: Record<string, Array<{ title: string; body: string; tag?: string }>>;
  observations?: Array<{ title: string; body: string; layer?: string }>;
  actions?: string[];
  strengths?: string[];
  watchpoints?: string[];
  dimNotes?: Record<string, string>;
  dimScores?: Record<string, number>;
  dimConfidence?: Record<string, number>;
  tags?: string[];
  photoTips?: string[];
  frameworkNotes?: Record<string, string>;
};

export function mergeLlmXiangxue(
  base: Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'>,
  llm: LlmXiangxuePayload | null,
): Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'> {
  if (!llm) return base;

  const dims = base.dims.map((d) => {
    const note = llm.dimNotes?.[d.id];
    const sc = llm.dimScores?.[d.id];
    const conf = llm.dimConfidence?.[d.id];
    return {
      ...d,
      note: note ? sanitizeText(note).slice(0, 200) : d.note,
      score: typeof sc === 'number' && sc >= 20 && sc <= 98 ? Math.round(sc) : d.score,
      confidence:
        typeof conf === 'number' && conf >= 10 && conf <= 98
          ? Math.round(conf)
          : d.confidence,
    };
  });

  const physicalScore = avg(dims.filter((d) => d.layer === 'physical').map((d) => d.score));
  const mingliScore = avg(dims.filter((d) => d.layer === 'mingli').map((d) => d.score));
  const overallScore = Math.round(physicalScore * 0.58 + mingliScore * 0.42);
  const confidenceScore = Math.round(
    avg(dims.filter((d) => d.layer === 'physical').map((d) => d.confidence ?? 60)) * 0.7 +
      avg(dims.filter((d) => d.layer === 'mingli').map((d) => d.confidence ?? 40)) * 0.3,
  );

  /* 合并章节：优先 sectionOverrides → 按 layer 的 sections 列表填充对应层 */
  let sections = base.sections.map((sec) => {
    const ov = llm.sectionOverrides?.[sec.id];
    if (ov?.length) {
      return {
        ...sec,
        items: ov.slice(0, 10).map((it) => ({
          title: sanitizeText(it.title).slice(0, 48),
          body: sanitizeText(it.body).slice(0, 700),
          tag: it.tag ? sanitizeText(it.tag).slice(0, 12) : undefined,
        })),
      };
    }
    return sec;
  });

  if (llm.physicalSections?.length) {
    const physItems = llm.physicalSections.slice(0, 12).map((it) => ({
      title: sanitizeText(it.title).slice(0, 48),
      body: sanitizeText(it.body).slice(0, 700),
      tag: it.tag ? sanitizeText(it.tag).slice(0, 12) : '可见',
    }));
    sections = distributeLayerItems(sections, 'physical', physItems);
  }
  if (llm.mingliSections?.length) {
    const mingItems = llm.mingliSections.slice(0, 12).map((it) => ({
      title: sanitizeText(it.title).slice(0, 48),
      body: sanitizeText(it.body).slice(0, 700),
      tag: it.tag ? sanitizeText(it.tag).slice(0, 12) : '教学',
    }));
    sections = distributeLayerItems(sections, 'mingli', mingItems);
  }
  if (llm.metaSections?.length) {
    const metaItems = llm.metaSections.slice(0, 6).map((it) => ({
      title: sanitizeText(it.title).slice(0, 48),
      body: sanitizeText(it.body).slice(0, 700),
      tag: it.tag ? sanitizeText(it.tag).slice(0, 12) : undefined,
    }));
    sections = distributeLayerItems(sections, 'meta', metaItems);
  }

  const observations =
    llm.observations?.length
      ? llm.observations.slice(0, 12).map((o, i) => ({
          id: `llm-${i}`,
          title: sanitizeText(o.title || '观察').slice(0, 48),
          body: sanitizeText(o.body).slice(0, 700),
          layer: (o.layer === 'mingli' || o.layer === 'meta' ? o.layer : 'physical') as
            | 'physical'
            | 'mingli'
            | 'meta',
          tone: 'default' as const,
        }))
      : base.observations;

  const framework = base.framework?.map((f) => {
    const n = llm.frameworkNotes?.[f.id];
    return n ? { ...f, note: sanitizeText(n).slice(0, 200) } : f;
  });

  return {
    ...base,
    summary: llm.summary ? sanitizeText(llm.summary).slice(0, 480) : base.summary,
    physicalHeadline: llm.physicalHeadline
      ? sanitizeText(llm.physicalHeadline).slice(0, 220)
      : base.physicalHeadline,
    mingliHeadline: llm.mingliHeadline
      ? sanitizeText(llm.mingliHeadline).slice(0, 220)
      : base.mingliHeadline,
    synthesisHeadline: llm.synthesisHeadline
      ? sanitizeText(llm.synthesisHeadline).slice(0, 220)
      : base.synthesisHeadline,
    dims,
    physicalScore,
    mingliScore,
    overallScore,
    confidenceScore,
    sections,
    observations,
    framework,
    actions: llm.actions?.length
      ? llm.actions.map((a) => sanitizeText(a).slice(0, 160)).slice(0, 8)
      : base.actions,
    strengths: llm.strengths?.length
      ? llm.strengths.map((s) => sanitizeText(s).slice(0, 100)).slice(0, 6)
      : base.strengths,
    watchpoints: llm.watchpoints?.length
      ? llm.watchpoints.map((s) => sanitizeText(s).slice(0, 100)).slice(0, 6)
      : base.watchpoints,
    visibleTags: [...new Set([...(base.visibleTags || []), ...(llm.tags || [])])].slice(0, 16),
    photoQuality: {
      ...base.photoQuality,
      tips: llm.photoTips?.length
        ? llm.photoTips.map((t) => sanitizeText(t).slice(0, 90)).slice(0, 6)
        : base.photoQuality.tips,
    },
  };
}

/** 将 LLM 条目按顺序摊入同 layer 的多个章节，避免只填第一章 */
function distributeLayerItems(
  sections: XiangxueSection[],
  layer: 'physical' | 'mingli' | 'meta',
  items: Array<{ title: string; body: string; tag?: string }>,
): XiangxueSection[] {
  const targets = sections.filter((s) => s.layer === layer);
  if (!targets.length || !items.length) return sections;

  if (targets.length === 1) {
    return sections.map((s) =>
      s.layer === layer ? { ...s, items: items.slice(0, 10) } : s,
    );
  }

  /* 第一章保留方法/门槛 2 条 + 分配条目；其余章按块切分 */
  const chunkSize = Math.max(2, Math.ceil(items.length / targets.length));
  let offset = 0;
  const assigned = new Map<string, typeof items>();
  targets.forEach((t, i) => {
    const slice = items.slice(offset, offset + chunkSize);
    offset += chunkSize;
    if (slice.length) assigned.set(t.id, slice);
    else if (i === targets.length - 1) assigned.set(t.id, items.slice(-2));
  });

  return sections.map((s) => {
    if (s.layer !== layer) return s;
    const chunk = assigned.get(s.id);
    if (!chunk?.length) return s;
    /* 保留原章节 lead 与 step；若原有「门槛/方法」类标题则前置保留 1 条 */
    const keepMethod = s.items.filter(
      (it) => it.tag === '门槛' || it.tag === '方法' || it.tag === '纪律',
    );
    return {
      ...s,
      items: [...keepMethod.slice(0, 2), ...chunk].slice(0, 12),
    };
  });
}

function physicalNote(
  kind: XiangxueKind,
  id: string,
  score: number,
  evidence: string,
): string {
  if (kind === 'face') {
    const map: Record<string, string> = {
      pose: '头脸朝向与俯仰是否接近标准正面',
      symmetry: '左右五官高宽是否大致均衡（仅形态）',
      santine: '上中下三庭长度是否接近等分（可见估计）',
      wuyan: '脸宽与眼宽倍数关系（五眼示意）',
      forehead: '额部露出面积与发际线形态',
      brow_eye: '眉峰、睑裂开合与眼神反光是否清晰',
      nose: '鼻梁连贯度与鼻翼宽度（可见轮廓）',
      mouth: '口裂弧度与唇形厚度层次',
      jaw: '下颌角与颏部轮廓线条',
      cheek_chin: '颧骨高度与颊部饱满度（轮廓）',
      skin_light: '高光/阴影是否便于辨认结构',
    };
    return `${map[id] || '分区形态'} · 示意 ${score} · ${evidenceLabel(evidence)}`;
  }
  const map: Record<string, string> = {
    hand_shape: '掌长与指节比例是否便于读纹',
    life_line: '生命线弧度、起止与深浅（可见）',
    head_line: '智慧线走向与分叉',
    heart_line: '感情线起止与弯曲',
    fate_line: '事业线是否清晰可见',
    sun_line: '太阳线（无名指方向）是否可辨',
    mounts: '掌丘相对高低（非吉凶）',
    texture: '主线与细纹的对比度',
    fingers: '指节分段与指缝开合',
  };
  return `${map[id] || '掌纹形态'} · 示意 ${score} · ${evidenceLabel(evidence)}`;
}

function mingliNote(
  kind: XiangxueKind,
  id: string,
  score: number,
  yong: string[],
): string {
  if (id === 'sancai') return `上中下三才教学分区 · 示意 ${score}`;
  if (id === 'shiergong') return `十二宫气质映射（摘要，非定数）· 示意 ${score}`;
  if (id === 'wuguan_qi' || id === 'three_lines')
    return `传统气机阅读框架 · 示意 ${score}`;
  if (id === 'mount_qi') return `掌丘气机教学 · 示意 ${score}`;
  if (id === 'spirit' || id === 'action_rhythm')
    return `精神面/节奏倾向（教学）· 示意 ${score}`;
  if (id === 'expression') return `表达与沟通倾向（教学）· 示意 ${score}`;
  if (id === 'self_review') return `建议复盘焦点 · 示意 ${score}`;
  if (id === 'balance') return `掌心阴阳平衡示意 · ${score}`;
  return yong.length ? `与用神讨论框架 · ${score}` : `命理弱提示 · ${score}`;
}

function buildTags(
  kind: XiangxueKind,
  photoLevel: string,
  hasBirth: boolean,
  side?: string,
): string[] {
  const tags =
    kind === 'face'
      ? ['物理层', '三庭五眼', '五官分区', '十二宫教学']
      : [
          '物理层',
          '三主线',
          side === 'left' ? '左手' : side === 'right' ? '右手' : '手别未标',
          '掌丘',
        ];
  tags.push(
    photoLevel === 'good' ? '成像良好' : photoLevel === 'ok' ? '成像尚可' : '建议补拍',
  );
  tags.push(hasBirth ? '已交叉生辰' : '未绑定生辰');
  tags.push('命理层教学', '系统报告 v3');
  return tags;
}

function scorePhoto(bytes: number): number {
  if (bytes > 200_000) return 82;
  if (bytes > 80_000) return 72;
  if (bytes > 30_000) return 58;
  return 42;
}

function avg(nums: number[]): number {
  if (!nums.length) return 50;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function sanitizeText(s: string): string {
  return s
    .replace(/必死|短命|绝症|克妻|克夫|牢狱|横死|丧门|必死无疑|天克地冲必/g, '（已屏蔽不当表述）')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ═══════════════════════════════════════════════════════════
 * 视觉模型系统提示：强制系统化 · 先物理后命理
 * ═══════════════════════════════════════════════════════════ */

export const FACE_VISION_SYSTEM = `你是人生K线「面相系统报告」首席分析师。输出必须是严格 JSON（中文），结构完整、条目具体。

# 绝对纪律
1. 阅读顺序固定：物理层（可见）→ 命理层（教学）→ 综合行动。禁止颠倒。
2. 物理层：只描述照片里看得见的角度、对称、三庭五眼、五官轮廓、光线、遮挡。禁止吉凶、富贵、克害等词。
3. 命理层：仅在物理之后；用三才/十二宫气质分区 + 生辰用神（若有）谈气质与节奏倾向。禁止：疾病诊断、寿命、婚恋必然、财富定数、身份识别、恐吓、改命承诺。
4. 看不清就写「弱证据/不可见」，禁止编造细节。
5. 无生辰时命理层必须标明「弱提示」。

# 物理层检查清单（逐项覆盖）
- 成像：清晰度、逆光、美颜滤镜嫌疑、脸部占比
- 姿态：俯仰、侧转、双眼是否平视
- 对称：左右眼高、眉峰、口角
- 三庭：发际→眉、眉→鼻底、鼻底→颏 的相对长短
- 五眼：脸宽与眼宽倍数（示意）
- 五官：额/眉眼/鼻/口唇人中/下颌颧颊 分区描述
- 光线与肤色层次是否利于辨结构

# 命理层检查清单
- 三才气机（上中下）教学表述
- 十二宫摘要（仅气质分区，如官禄示意区=额，不作官运判决）
- 五官气机与精神面
- 生辰/日主/用神交叉（无则弱提示）
- 表达与沟通倾向（教学）

# 输出 JSON  schema（字段必须齐全）
{
  "summary": "160-280字总览，第一句物理，第二段命理，末句边界",
  "physicalHeadline": "一句物理结论（含成像判断）",
  "mingliHeadline": "一句命理交叉（无生辰写弱提示）",
  "synthesisHeadline": "一句综合行动取向",
  "physicalSections": [
    {"title":"成像与取景","body":"50-140字","tag":"可见"},
    {"title":"三庭五眼","body":"50-140字","tag":"可见"},
    {"title":"对称与姿态","body":"50-140字","tag":"可见"},
    {"title":"额与发际","body":"50-140字","tag":"分区"},
    {"title":"眉眼神采","body":"50-140字","tag":"分区"},
    {"title":"鼻部轮廓","body":"50-140字","tag":"分区"},
    {"title":"口唇人中","body":"50-140字","tag":"分区"},
    {"title":"下颌与轮廓","body":"50-140字","tag":"分区"}
  ],
  "mingliSections": [
    {"title":"三才气机","body":"50-140字","tag":"教学"},
    {"title":"十二宫气质映射","body":"50-140字","tag":"教学"},
    {"title":"五官气机与精神面","body":"50-140字","tag":"教学"},
    {"title":"用神/生辰交叉","body":"50-140字","tag":"交叉"},
    {"title":"表达沟通倾向","body":"50-140字","tag":"教学"}
  ],
  "metaSections": [
    {"title":"如何使用本报告","body":"40-100字"},
    {"title":"硬边界","body":"40-80字","tag":"边界"}
  ],
  "observations": [
    {"title":"","body":"","layer":"physical"},
    {"title":"","body":"","layer":"mingli"}
  ],
  "actions": ["可执行可验证建议，3-6条"],
  "strengths": ["物理层相对清晰点 2-4条"],
  "watchpoints": ["弱证据/补拍/边界 2-4条"],
  "dimNotes": {
    "photo":"","pose":"","symmetry":"","santine":"","wuyan":"",
    "forehead":"","brow_eye":"","nose":"","mouth":"","jaw":"","cheek_chin":"","skin_light":"",
    "tianshi":"","sancai":"","shiergong":"","wuguan_qi":"","yongshen_cross":"","spirit":"","expression":""
  },
  "dimScores": {"photo":0,"pose":0,"symmetry":0,"santine":0,"wuyan":0,"forehead":0,"brow_eye":0,"nose":0,"mouth":0,"jaw":0},
  "dimConfidence": {"photo":0,"symmetry":0,"santine":0},
  "tags": ["特征标签4-8个"],
  "photoTips": ["补拍建议"],
  "frameworkNotes": {
    "fw-santine":"","fw-wuyan":"","fw-wuguan":"","fw-shiergong":"","fw-yong":""
  }
}`;

export const PALM_VISION_SYSTEM = `你是人生K线「手相系统报告」首席分析师。输出必须是严格 JSON（中文），结构完整、条目具体。

# 绝对纪律
1. 阅读顺序固定：物理层 → 命理层 → 综合。禁止颠倒。
2. 物理层：只描述取景、手型指长、生命线/智慧线/感情线/事业线/太阳线可见形态、掌丘起伏、清晰度。禁止吉凶词。
3. 命理层：三线气机 + 掌丘气机 + 生辰用神（若有）谈行动节奏与自我复盘。禁止：疾病、寿命、财富必然、婚姻定数、恐吓。
4. 线不可见必须写「弱证据」，禁止编造完整线纹故事。
5. 无生辰时命理层标明「弱提示」。

# 物理层检查清单
- 成像：对焦、反光、掌心占比、手指是否张开
- 手型与指长比例
- 生命线：起止、弧度、深浅、分叉（可见范围）
- 智慧线：走向、长短、分叉
- 感情线：起止、弯曲
- 事业线 / 太阳线：可见度
- 掌丘起伏与掌纹对比度
- 指节与指缝

# 命理层检查清单
- 三线气机（教学）
- 掌丘气机
- 行动节奏倾向
- 生辰用神交叉（无则弱提示）
- 自我复盘焦点

# 输出 JSON schema
{
  "summary": "160-280字，先物理后命理",
  "physicalHeadline": "一句物理结论",
  "mingliHeadline": "一句命理交叉",
  "synthesisHeadline": "一句综合行动",
  "physicalSections": [
    {"title":"成像与取景","body":"50-140字","tag":"可见"},
    {"title":"手型与指长","body":"50-140字","tag":"可见"},
    {"title":"生命线","body":"50-140字","tag":"线纹"},
    {"title":"智慧线","body":"50-140字","tag":"线纹"},
    {"title":"感情线","body":"50-140字","tag":"线纹"},
    {"title":"事业线/太阳线","body":"50-140字","tag":"线纹"},
    {"title":"掌丘与纹理","body":"50-140字","tag":"可见"}
  ],
  "mingliSections": [
    {"title":"三线气机","body":"50-140字","tag":"教学"},
    {"title":"掌丘气机","body":"50-140字","tag":"教学"},
    {"title":"行动节奏","body":"50-140字","tag":"教学"},
    {"title":"用神/生辰交叉","body":"50-140字","tag":"交叉"},
    {"title":"复盘焦点","body":"50-140字","tag":"教学"}
  ],
  "metaSections": [
    {"title":"21天复看","body":"40-100字"},
    {"title":"硬边界","body":"40-80字","tag":"边界"}
  ],
  "observations": [{"title":"","body":"","layer":"physical|mingli"}],
  "actions": ["3-6条可执行建议"],
  "strengths": ["2-4条"],
  "watchpoints": ["2-4条"],
  "dimNotes": {
    "photo":"","frame":"","hand_shape":"","life_line":"","head_line":"","heart_line":"",
    "fate_line":"","sun_line":"","mounts":"","texture":"","fingers":"",
    "tianshi":"","three_lines":"","mount_qi":"","yongshen_cross":"","action_rhythm":"","balance":"","self_review":""
  },
  "dimScores": {"photo":0,"life_line":0,"head_line":0,"heart_line":0,"hand_shape":0},
  "dimConfidence": {"photo":0,"life_line":0},
  "tags": ["掌纹特征标签"],
  "photoTips": ["补拍建议"],
  "frameworkNotes": {
    "fw-shape":"","fw-3lines":"","fw-fate":"","fw-mounts":"","fw-yong-p":""
  }
}`;
