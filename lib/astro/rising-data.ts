import type { RisingProfile, SignKey } from '@/lib/astro/types';
import { SIGN_BY_KEY } from '@/lib/astro/signs-data';

/** Rising / Ascendant — first-impression layer (needs birth time for accuracy) */
export const RISING_PROFILES: RisingProfile[] = (
  [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
  ] as SignKey[]
).map((key) => {
  const s = SIGN_BY_KEY[key];
  const map: Record<
    SignKey,
    Pick<RisingProfile, 'firstImpression' | 'bodyStyle' | 'socialMode' | 'strengths' | 'watchouts' | 'worldYiBridge'>
  > = {
    aries: {
      firstImpression: '先到先声：步伐快、眼神直接，像随时准备开跑。',
      bodyStyle: '肩背偏前倾，动作利落；穿搭偏功能性与鲜明色块。',
      socialMode: '见面就推进话题，讨厌绕弯；冲突时更硬而非更软。',
      strengths: ['破冰能力', '敢于担责的第一印象', '感染力强'],
      watchouts: ['显得急躁或争胜', '打断别人', '忽略场合礼仪'],
      worldYiBridge: '上升白羊：对外角色是「开启者」。组织里适合冲锋，但需有人接盘落地。',
    },
    taurus: {
      firstImpression: '稳、慢、有质感：不急着表态，却让人觉得可靠。',
      bodyStyle: '偏松弛有肉感或线条沉稳；材质与触感敏感。',
      socialMode: '先观察再进入；用行动与招待建立关系。',
      strengths: ['安全感外溢', '耐心倾听', '审美门槛'],
      watchouts: ['显得固执或懒得社交', '对变化反应过慢'],
      worldYiBridge: '上升金牛：对外角色是「持有者」。事业呈现要看得见的成果，而非概念。',
    },
    gemini: {
      firstImpression: '话多脑快：像随身带着热点与梗。',
      bodyStyle: '手部动作多，眼神游移捕捉信息；穿搭多变。',
      socialMode: '社交多线程；容易同时跟几桌聊天。',
      strengths: ['亲和与机智', '快速建立连接', '信息桥'],
      watchouts: ['显得不专注', '承诺跳票印象', '八卦感'],
      worldYiBridge: '上升双子：对外角色是「连接器」。世界易里属于信息与协作界面。',
    },
    cancer: {
      firstImpression: '柔、护、有家感：靠近后才完全打开。',
      bodyStyle: '胸部/上臂保护姿态；表情随情绪潮汐。',
      socialMode: '小圈深度；对外礼貌，对内全情。',
      strengths: ['共情第一眼', '让人想倾诉', '护短忠诚'],
      watchouts: ['显得防御或情绪化', '把工作关系家庭化'],
      worldYiBridge: '上升巨蟹：对外角色是「照护节点」。家庭/团队归属议题会写在脸上。',
    },
    leo: {
      firstImpression: '有光：走进房间像自带追光灯。',
      bodyStyle: '抬头挺胸，发型/配饰有记忆点。',
      socialMode: '大方、爱请客与夸奖；也需要被回馈掌声。',
      strengths: ['舞台感', '鼓舞他人', '公开表达'],
      watchouts: ['显得自我中心', '面子过重'],
      worldYiBridge: '上升狮子：对外角色是「可见主角」。适合前台，忌空洞表演。',
    },
    virgo: {
      firstImpression: '干净、利落、细节控：像随时能帮你改一版方案。',
      bodyStyle: '整洁优先；小动作多（整理袖口、桌面）。',
      socialMode: '用帮忙与建议建立关系，少空聊。',
      strengths: ['专业可信', '服务意识', '观察入微'],
      watchouts: ['显得挑剔', '紧张不安', '过度道歉或纠正'],
      worldYiBridge: '上升处女：对外角色是「优化官」。呈现靠交付质量说话。',
    },
    libra: {
      firstImpression: '好看且会做人：笑容得体，气氛不冷场。',
      bodyStyle: '对称、协调；重视第一眼搭配。',
      socialMode: '外交型；两边不得罪，直到必须站队。',
      strengths: ['社交润滑', '审美加分', '谈判第一印象'],
      watchouts: ['优柔寡断', '讨好后反噬', '虚伪感'],
      worldYiBridge: '上升天秤：对外角色是「协调官」。关系结构会直接塑造公众形象。',
    },
    scorpio: {
      firstImpression: '深、静、有压迫感：不多话但信息密度高。',
      bodyStyle: '眼神锐利；黑/深色与遮挡元素偏多。',
      socialMode: '筛选型社交；一旦信任则极深。',
      strengths: ['气场与边界', '洞察力外显', '危机时可靠'],
      watchouts: ['显得冷或审讯感', '过度神秘引发猜忌'],
      worldYiBridge: '上升天蝎：对外角色是「深潜者」。权力与秘密议题慎公开表演。',
    },
    sagittarius: {
      firstImpression: '大开大合：笑声大、话题远，像刚从别处回来。',
      bodyStyle: '步伐开、肩背舒展；运动户外感。',
      socialMode: '直球幽默；讨厌小心机。',
      strengths: ['乐观感染', '跨文化友好', '诚实'],
      watchouts: ['口无遮拦', '显得不靠谱或过度承诺'],
      worldYiBridge: '上升射手：对外角色是「远方信使」。迁移与视野是你的名片。',
    },
    capricorn: {
      firstImpression: '成熟、克制、像已经扛过事。',
      bodyStyle: '骨架感/职业装感；表情管理强。',
      socialMode: '少废话多结果；尊重层级与时间。',
      strengths: ['专业权威感', '可靠', '长期主义第一眼'],
      watchouts: ['显得冷淡势利', '年纪感过重', '难亲近'],
      worldYiBridge: '上升摩羯：对外角色是「责任人」。组织与台阶是你的舞台设计。',
    },
    aquarius: {
      firstImpression: '有点怪、有点酷：不跟风，像系统外观察者。',
      bodyStyle: '非常规穿搭或科技感；眼神疏离。',
      socialMode: '社群型但非黏人；谈理念多于谈八卦。',
      strengths: ['独立辨识度', '未来感', '公平姿态'],
      watchouts: ['显得冷漠不合群', '为反对而反对'],
      worldYiBridge: '上升水瓶：对外角色是「网络节点」。全球与系统叙事适合你。',
    },
    pisces: {
      firstImpression: '柔、梦、边界模糊：像刚从一个故事里走出来。',
      bodyStyle: '流动线条；艺术感或略显疲惫的浪漫。',
      socialMode: '共情接收器；容易被他人情绪染色。',
      strengths: ['艺术气场', '温柔可近', '想象力'],
      watchouts: ['显得不落地', '边界不清被消耗', '逃避现实印象'],
      worldYiBridge: '上升双鱼：对外角色是「情绪场」。需土象护栏才不至于被叙事淹没。',
    },
  };

  const m = map[key];
  return {
    key,
    zh: s.zh,
    en: s.en,
    ...m,
  };
});

export function getRisingByKey(key: string | null | undefined): RisingProfile | null {
  if (!key) return null;
  return RISING_PROFILES.find((r) => r.key === key) || null;
}

/**
 * Rough rising by local birth hour (2h steps).
 * Not a real ephemeris — educational approx for mid-latitude, needs place + true time.
 * Mapping: 05–07 ≈ Aries rising at equinox sunrise heuristic, then +1 sign / 2h.
 */
export function approximateRisingByHour(hour: number): SignKey {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const order: SignKey[] = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
  ];
  // 5–6 → index 0
  const idx = Math.floor(((h - 5 + 24) % 24) / 2) % 12;
  return order[idx];
}

export const RISING_HOUR_TABLE: Array<{ from: number; to: number; key: SignKey }> = Array.from(
  { length: 12 },
  (_, i) => {
    const from = (5 + i * 2) % 24;
    const to = (from + 2) % 24;
    return { from, to, key: approximateRisingByHour(from + 0.5) };
  },
);
