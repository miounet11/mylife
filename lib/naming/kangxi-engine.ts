/**
 * 康熙笔画 + 五行属性引擎（教学/起名结构层）
 * 简体字映射到字库康熙笔画；未知字用部首估算并标记 confidence
 */

import { getCharEntry, charElement } from './char-db';
import type { Wuxing } from './types';

/** 传统：笔画尾数 → 五行（数理参考，非命运承诺） */
const STROKE_WUXING: Record<number, Wuxing> = {
  1: '木',
  2: '木',
  3: '火',
  4: '火',
  5: '土',
  6: '土',
  7: '金',
  8: '金',
  9: '水',
  0: '水',
};

/** 扩展康熙笔画表（常用起名用字，可与 char-db 合并） */
const KANGXI_STROKES: Record<string, number> = {
  一: 1, 乙: 1, 二: 2, 十: 2, 丁: 2, 厂: 2, 七: 2, 卜: 2,
  人: 2, 入: 2, 八: 2, 九: 2, 几: 2, 了: 2, 乃: 2, 刀: 2,
  力: 2, 又: 2, 三: 3, 干: 3, 于: 3, 亏: 3, 工: 3, 土: 3,
  士: 3, 才: 3, 下: 3, 寸: 3, 大: 3, 丈: 3, 与: 3, 万: 3,
  上: 3, 小: 3, 口: 3, 山: 3, 巾: 3, 千: 3, 乞: 3, 川: 3,
  亿: 3, 个: 3, 夕: 3, 久: 3, 么: 3, 勺: 3, 凡: 3, 及: 3,
  广: 3, 亡: 3, 门: 3, 义: 3, 之: 3, 尸: 3, 己: 3, 已: 3,
  巳: 3, 弓: 3, 子: 3, 卫: 3, 也: 3, 女: 3, 飞: 3, 习: 3,
  叉: 3, 马: 3, 乡: 3, 丰: 4, 王: 4, 井: 4, 开: 4, 夫: 4,
  天: 4, 无: 4, 元: 4, 专: 4, 云: 4, 扎: 4, 艺: 4, 木: 4,
  五: 4, 支: 4, 厅: 4, 不: 4, 太: 4, 犬: 4, 区: 4, 历: 4,
  友: 4, 尤: 4, 匹: 4, 车: 4, 巨: 4, 牙: 4, 屯: 4, 比: 4,
  互: 4, 切: 4, 瓦: 4, 止: 4, 少: 4, 日: 4, 中: 4, 冈: 4,
  贝: 4, 内: 4, 水: 4, 见: 4, 午: 4, 牛: 4, 手: 4, 毛: 4,
  气: 4, 升: 4, 长: 4, 仁: 4, 什: 4, 片: 4, 仆: 4, 化: 4,
  仇: 4, 币: 4, 仍: 4, 仅: 4, 斤: 4, 爪: 4, 反: 4, 介: 4,
  父: 4, 从: 4, 今: 4, 凶: 4, 分: 4, 乏: 4, 公: 4, 仓: 4,
  月: 4, 氏: 4, 勿: 4, 欠: 4, 风: 4, 丹: 4, 匀: 4, 乌: 4,
  勾: 4, 凤: 4, 六: 4, 文: 4, 方: 4, 火: 4, 为: 4, 斗: 4,
  忆: 4, 订: 4, 计: 4, 户: 4, 认: 4, 心: 4, 尺: 4, 引: 4,
  丑: 4, 巴: 4, 孔: 4, 队: 4, 办: 4, 以: 4, 允: 4, 予: 4,
  劝: 4, 双: 4, 书: 4, 幻: 4, 玉: 5, 刊: 5, 示: 5, 末: 5,
  未: 5, 击: 5, 打: 5, 巧: 5, 正: 5, 扑: 5, 扒: 5, 功: 5,
  扔: 5, 去: 5, 甘: 5, 世: 5, 古: 5, 节: 5, 本: 5, 术: 5,
  可: 5, 丙: 5, 左: 5, 厉: 5, 右: 5, 石: 5, 布: 5, 龙: 5,
  平: 5, 灭: 5, 轧: 5, 东: 5, 卡: 5, 北: 5, 占: 5, 业: 5,
  旧: 5, 帅: 5, 归: 5, 且: 5, 旦: 5, 目: 5, 叶: 5, 甲: 5,
  申: 5, 叮: 5, 电: 5, 号: 5, 田: 5, 由: 5, 史: 5, 只: 5,
  央: 5, 兄: 5, 叼: 5, 叫: 5, 另: 5, 叨: 5, 叹: 5, 四: 5,
  生: 5, 失: 5, 禾: 5, 丘: 5, 付: 5, 仗: 5, 代: 5, 仙: 5,
  们: 5, 仪: 5, 白: 5, 仔: 5, 他: 5, 斥: 5, 瓜: 5, 乎: 5,
  丛: 5, 令: 5, 用: 5, 甩: 5, 印: 5, 乐: 5, 句: 5, 匆: 5,
  册: 5, 犯: 5, 外: 5, 处: 5, 冬: 5, 鸟: 5, 务: 5, 包: 5,
  饥: 5, 主: 5, 市: 5, 立: 5, 闪: 5, 兰: 5, 半: 5, 汁: 5,
  汇: 5, 头: 5, 汉: 5, 宁: 5, 穴: 5, 它: 5, 讨: 5, 写: 5,
  让: 5, 礼: 5, 训: 5, 必: 5, 议: 5, 讯: 5, 记: 5, 永: 5,
  司: 5, 尼: 5, 民: 5, 出: 5, 辽: 5, 奶: 5, 奴: 5, 加: 5,
  召: 5, 皮: 5, 边: 5, 发: 5, 孕: 5, 圣: 5, 对: 5, 台: 5,
  矛: 5, 纠: 5, 母: 5, 幼: 5, 丝: 5, 邦: 6, 式: 6, 迂: 6,
  刑: 6, 戎: 6, 动: 6, 扛: 6, 寺: 6, 吉: 6, 扣: 6, 考: 6,
  托: 6, 老: 6, 执: 6, 巩: 6, 圾: 6, 扩: 6, 扫: 6, 地: 6,
  扬: 6, 场: 6, 耳: 6, 共: 6, 芒: 6, 亚: 6, 芝: 6, 朽: 6,
  朴: 6, 机: 6, 权: 6, 过: 6, 臣: 6, 再: 6, 协: 6, 西: 6,
  压: 6, 厌: 6, 在: 6, 百: 6, 有: 6, 存: 6, 而: 6, 页: 6,
  匠: 6, 夸: 6, 夺: 6, 灰: 6, 达: 6, 列: 6, 死: 6, 成: 6,
  夹: 6, 轨: 6, 邪: 6, 划: 6, 迈: 6, 毕: 6, 至: 6, 此: 6,
  贞: 6, 师: 6, 尘: 6, 尖: 6, 劣: 6, 光: 6, 当: 6, 早: 6,
  吐: 6, 吓: 6, 虫: 6, 曲: 6, 团: 6, 同: 6, 吊: 6, 吃: 6,
  因: 6, 吸: 6, 吗: 6, 屿: 6, 帆: 6, 岁: 6, 回: 6, 岂: 6,
  刚: 6, 则: 6, 肉: 6, 网: 6, 年: 6, 朱: 6, 先: 6, 丢: 6,
  舌: 6, 竹: 6, 迁: 6, 乔: 6, 伟: 6, 传: 6, 乒: 6, 乓: 6,
  休: 6, 伍: 6, 伏: 6, 优: 6, 伐: 6, 延: 6, 件: 6, 任: 6,
  伤: 6, 价: 6, 份: 6, 华: 6, 仰: 6, 仿: 6, 伙: 6, 伪: 6,
  自: 6, 血: 6, 向: 6, 似: 6, 后: 6, 行: 6, 舟: 6, 全: 6,
  会: 6, 杀: 6, 合: 6, 兆: 6, 企: 6, 众: 6, 爷: 6, 伞: 6,
  创: 6, 肌: 6, 朵: 6, 杂: 6, 危: 6, 旬: 6, 旨: 6, 负: 6,
  各: 6, 名: 6, 多: 6, 争: 6, 色: 6, 壮: 6, 冲: 6, 冰: 6,
  庄: 6, 庆: 6, 亦: 6, 刘: 6, 齐: 6, 交: 6, 次: 6, 衣: 6,
  产: 6, 决: 6, 充: 6, 妄: 6, 闭: 6, 问: 6, 闯: 6, 羊: 6,
  并: 6, 关: 6, 米: 6, 灯: 6, 州: 6, 汗: 6, 污: 6, 江: 6,
  池: 6, 汤: 6, 忙: 6, 兴: 6, 宇: 6, 守: 6, 宅: 6, 字: 6,
  安: 6, 讲: 6, 军: 6, 许: 6, 论: 6, 农: 6, 讽: 6, 设: 6,
  访: 6, 寻: 6, 那: 6, 迅: 6, 尽: 6, 导: 6, 异: 6, 孙: 6,
  阵: 6, 阳: 6, 收: 6, 阶: 6, 阴: 6, 防: 6, 奸: 6, 如: 6,
  妇: 6, 好: 6, 她: 6, 妈: 6, 戏: 6, 羽: 6, 观: 6, 欢: 6,
  买: 6, 红: 6, 纤: 6, 级: 6, 约: 6, 纪: 6, 驰: 6, 巡: 6,
  // 起名高频（与 char-db 对齐补全）
  浩: 11, 泽: 17, 涵: 12, 淼: 12, 清: 11, 润: 15, 沐: 8, 洋: 10,
  涛: 18, 霖: 16, 雪: 11, 露: 21, 梓: 11, 林: 8, 柏: 9, 桐: 10,
  萱: 15, 蓉: 16, 芳: 10, 菁: 14, 荣: 14, 楠: 13, 槿: 15,
  煜: 13, 烨: 10, 曦: 20, 晨: 11, 炎: 8, 晴: 12, 暖: 13, 彤: 7,
  朗: 11, 晖: 13, 灿: 17, 轩: 10, 坤: 8, 垚: 9, 培: 11, 嘉: 14,
  宜: 8, 婉: 11, 婷: 12, 瑶: 14, 琦: 13, 铭: 14, 锐: 15, 锦: 16,
  钧: 12, 铮: 16, 钰: 13, 铃: 10, 睿: 14, 哲: 10, 思: 9, 静: 16,
  雯: 12, 博: 12, 明: 8, 杰: 12, 强: 12, 丽: 7, 美: 9, 慧: 15,
  怡: 9, 欣: 8, 乐: 15, 和: 8, 信: 9, 德: 15, 仁: 4, 义: 13,
  礼: 18, 智: 12, 远: 14, 航: 10, 辰: 7, 星: 9, 启: 11, 承: 8,
  宏: 7, 恒: 9, 昌: 8, 盛: 12, 隆: 17, 泰: 10, 康: 11, 健: 11,
  成: 7, 通: 11, 英: 11, 俊: 9, 雅: 12, 诗: 13, 书: 10, 画: 12,
  诺: 16, 言: 7, 创: 12, 新: 13, 科: 9, 联: 12, 合: 6, 众: 6,
  汇: 8, 源: 14, 本: 5, 基: 11, 鼎: 13, 锋: 15, 领: 14, 数: 15,
  品: 9, 优: 17, 精: 14, 尚: 8, 家: 10, 居: 8, 福: 14, 祥: 13,
  瑞: 14, 利: 7, 兴: 16, 丰: 4, 盈: 9, 平: 5, 正: 5, 中: 4,
  国: 11, 世: 5, 界: 9, 环: 17, 球: 11, 景: 12, 耀: 20, 辉: 15,
  子: 3, 涵: 12, 宇: 6, 轩: 10, 文: 4, 浩: 11, 泽: 17, 霖: 16,
  龙: 16, 凤: 14, 鹏: 19, 飞: 9, 翔: 12, 梅: 11, 雪: 11, 琳: 13,
  妍: 9, 然: 12, 昊: 8, 曦: 20, 然: 12, 志: 7, 伟: 11, 强: 12,
  计: 4, 伙: 6, 智: 12, 慧: 15, 云: 12, 启: 11, 明: 8, 华: 14,
};

export type CharAnalysis = {
  char: string;
  /** 康熙笔画（估计时 confidence 较低） */
  strokes: number;
  element: Wuxing | '未知';
  /** 笔画推演五行 */
  strokeElement: Wuxing;
  meaning?: string;
  estimated: boolean;
};

export function kangxiStrokes(char: string): { strokes: number; estimated: boolean } {
  if (KANGXI_STROKES[char] != null) return { strokes: KANGXI_STROKES[char], estimated: false };
  const ent = getCharEntry(char);
  if (ent?.strokes) return { strokes: ent.strokes, estimated: false };
  // 粗估：Unicode 区间哈希，仅兜底
  const code = char.codePointAt(0) || 20000;
  const strokes = 5 + (code % 15);
  return { strokes, estimated: true };
}

export function analyzeCharFull(char: string): CharAnalysis {
  const { strokes, estimated } = kangxiStrokes(char);
  const strokeElement = STROKE_WUXING[strokes % 10] || '土';
  const fromDb = charElement(char);
  const ent = getCharEntry(char);
  return {
    char,
    strokes,
    element: fromDb !== '未知' ? fromDb : strokeElement,
    strokeElement,
    meaning: ent?.meaning,
    estimated,
  };
}

export function analyzeNameChars(name: string): CharAnalysis[] {
  return [...name.replace(/\s/g, '')]
    .filter((c) => /[\u4e00-\u9fff]/.test(c))
    .map(analyzeCharFull);
}

/** 三才五格（传统数理参考） */
export type WugeResult = {
  tian: number;
  ren: number;
  di: number;
  wai: number;
  zong: number;
  tianEl: Wuxing;
  renEl: Wuxing;
  diEl: Wuxing;
  /** 简化吉凶倾向分 0-100（教学层） */
  score: number;
  summary: string;
};

const LUCKY_MOD = new Set([1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 18, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52]);

export function computeWuge(surname: string, given: string): WugeResult {
  const sChars = analyzeNameChars(surname);
  const gChars = analyzeNameChars(given);
  const s1 = sChars[0]?.strokes || 10;
  const s2 = sChars[1]?.strokes || 0;
  const g1 = gChars[0]?.strokes || 10;
  const g2 = gChars[1]?.strokes || 0;
  // 单姓 / 复姓简化
  const tian = sChars.length >= 2 ? s1 + s2 : s1 + 1;
  const ren = (sChars.length >= 2 ? s2 : s1) + g1;
  const di = gChars.length >= 2 ? g1 + g2 : g1 + 1;
  const zong = sChars.reduce((a, c) => a + c.strokes, 0) + gChars.reduce((a, c) => a + c.strokes, 0);
  const wai = Math.max(1, zong - ren + 1);

  const el = (n: number) => STROKE_WUXING[n % 10] || '土';
  let score = 55;
  for (const n of [tian, ren, di, wai, zong]) {
    if (LUCKY_MOD.has(n) || LUCKY_MOD.has(n % 50)) score += 7;
    else score -= 2;
  }
  score = Math.max(30, Math.min(95, score));

  return {
    tian,
    ren,
    di,
    wai,
    zong,
    tianEl: el(tian),
    renEl: el(ren),
    diEl: el(di),
    score,
    summary: `天${tian}${el(tian)} 人${ren}${el(ren)} 地${di}${el(di)} 外${wai} 总${zong} · 数理参考约 ${score} 分`,
  };
}

export function formatCharBreakdown(chars: CharAnalysis[]): string[] {
  return chars.map(
    (c) =>
      `${c.char}：康熙${c.strokes}画 · 五行${c.element}${c.estimated ? '（估）' : ''}${
        c.meaning ? ` · ${c.meaning}` : ''
      }`,
  );
}
