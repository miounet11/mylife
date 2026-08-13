/**
 * 空间场 search intents we intend to cover.
 * Coverage is measured against this finite, people-first list — not an infinite tail.
 */

export const SPACE_SEO_SEED_KEYWORDS = [
  // 工具 / 品类
  '空间场',
  '风水模拟',
  '户型风水',
  '风水热力图',
  '户型分析',
  '八方位',
  '人宅合参',
  '用神方位',
  '大门朝向',
  '风水选址',
  // 阳宅
  '阳宅风水',
  '选房子风水',
  '刚需户型',
  '改善户型',
  '一室户型风水',
  '一室一厅风水',
  '两室一厅风水',
  '两室两厅风水',
  '三室一厅风水',
  '三室两厅风水',
  '四室两厅风水',
  '复式风水',
  '南向户型',
  '东南向户型',
  '东向户型',
  '西向户型',
  '北向户型',
  '西南向户型',
  '西北向户型',
  '东北向户型',
  '大门朝南',
  '大门朝东',
  '西晒户型',
  '采光通风',
  '主卧方位',
  // 铺面
  '商铺风水',
  '选铺面',
  '餐饮店风水',
  '转角铺',
  '临街铺',
  '人流量估算',
  '美业店铺风水',
  '咖啡店选址',
  '底商风水',
  '前店后仓',
  // 其他业态
  '办公室风水',
  '别墅风水',
  '农村宅基地风水',
  '公寓风水',
  '阴宅风水',
  '穴位选址',
  // 城市
  '上海买房风水',
  '北京选房',
  '深圳选铺',
  '杭州买房',
  '广州商铺',
  '成都选房',
  '南京户型',
  '武汉选铺',
  '苏州买房',
  '重庆选房',
  '西安买房',
  '长沙选铺',
  '郑州买房',
  '青岛选房',
  '天津买房',
  '厦门选铺',
  '合肥买房',
  '福州选房',
  '东莞选房',
  '宁波选铺',
  // 决策 / GEO
  '怎么看商铺风水',
  '户型图门窗怎么分析',
  '人流和风水哪个先看',
  '不改朝向怎么补',
  '用神方位摆设',
  '八字和风水一起看',
  '风水模拟器免费',
  '选址顾问',
] as const;

export type SpaceSeoSeedKeyword = (typeof SPACE_SEO_SEED_KEYWORDS)[number];

function normalizeHay(s: string) {
  return `${s || ''}`.toLowerCase().replace(/\s+/g, '');
}

/** A seed is covered when title / intent / keywords / angle mention it or its stem. */
export function scenarioCoversKeyword(
  keyword: string,
  haystack: string,
): boolean {
  const h = normalizeHay(haystack);
  const k = normalizeHay(keyword);
  if (!k || !h) return false;
  if (h.includes(k)) return true;
  const stem = k.replace(/(风水|户型|选址)$/u, '');
  if (stem.length >= 2 && h.includes(stem)) return true;
  return false;
}

export function measureSpaceKeywordCoverage(entries: Array<{ haystack: string }>): {
  total: number;
  covered: number;
  ratio: number;
  missing: string[];
} {
  const missing: string[] = [];
  let covered = 0;
  for (const kw of SPACE_SEO_SEED_KEYWORDS) {
    const hit = entries.some((e) => scenarioCoversKeyword(kw, e.haystack));
    if (hit) covered += 1;
    else missing.push(kw);
  }
  const total = SPACE_SEO_SEED_KEYWORDS.length;
  return { total, covered, ratio: total ? covered / total : 0, missing };
}
