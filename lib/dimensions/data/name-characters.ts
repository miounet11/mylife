export type CharElement = '木' | '火' | '土' | '金' | '水';

/** 常用字五行简表（康熙笔画体系简化版，供起名节奏参考） */
export const CHAR_WUXING: Record<string, CharElement> = {
  伟: '土', 芳: '木', 娜: '火', 敏: '水', 静: '金', 丽: '火', 强: '木', 磊: '土',
  军: '木', 洋: '水', 勇: '土', 艳: '土', 杰: '木', 娟: '木', 涛: '水', 明: '水',
  超: '金', 秀: '金', 英: '木', 华: '水', 慧: '水', 巧: '木', 美: '水',
  俊: '火', 峰: '水', 建国: '木', 志强: '火', 子: '水', 涵: '水', 宇: '土', 轩: '土',
  文: '水', 博: '水', 思: '金', 睿: '金', 晨: '金', 曦: '火', 昊: '火', 然: '金',
  梓: '木', 萱: '木', 怡: '土', 彤: '火', 妍: '水', 琳: '木', 雪: '水', 梅: '木',
  龙: '火', 凤: '水', 鹏: '水', 飞: '水', 翔: '土', 浩: '水', 泽: '水', 霖: '水',
};

export function analyzeNameWuxing(name: string): Array<{ char: string; element: CharElement | '未知' }> {
  const chars = [...name.replace(/\s/g, '')].filter((char) => /[\u4e00-\u9fff]/.test(char));
  return chars.map((char) => ({
    char,
    element: CHAR_WUXING[char] || '未知',
  }));
}

export function scoreNameAgainstYongShen(
  name: string,
  favorable: string[],
  unfavorable: string[],
): { score: number; summary: string; suggestions: string[] } {
  const analyzed = analyzeNameWuxing(name);
  if (!analyzed.length) {
    return {
      score: 0,
      summary: '未检测到中文姓名，可在档案中补充后重新研判。',
      suggestions: ['优先补全姓名（2-3 个汉字为宜）', `改名宜补用神：${favorable.join('、') || '待引擎判定'}`],
    };
  }

  let score = 50;
  const favorSet = new Set(favorable);
  const avoidSet = new Set(unfavorable);
  let favorHits = 0;
  let avoidHits = 0;
  let unknown = 0;

  for (const item of analyzed) {
    if (item.element === '未知') {
      unknown += 1;
      continue;
    }
    if (favorSet.has(item.element)) {
      score += 12;
      favorHits += 1;
    } else if (avoidSet.has(item.element)) {
      score -= 10;
      avoidHits += 1;
    }
  }

  score = Math.min(95, Math.max(20, score));
  const summary =
    favorHits > avoidHits
      ? `姓名五行与用神契合度偏高（约 ${score} 分），${favorHits} 字补用神。`
      : avoidHits > 0
        ? `姓名中有 ${avoidHits} 字偏忌神，建议微调末字或中间字五行。`
        : `姓名五行中性（约 ${score} 分），可针对偏弱用神做定向补强。`;

  const suggestions = [
    `宜补五行：${favorable.join('、') || '木火土金水（按用神）'}`,
    avoidHits ? `减少忌神字：${unfavorable.join('、')}` : '保持音韵顺口，避免全篇同一五行',
    unknown ? `${unknown} 字未入库，建议人工复核笔画五行` : '可优先调整末字以强化后天补益',
  ];

  return { score, summary, suggestions };
}