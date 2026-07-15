/**
 * 从大众报告 ProReportView 生成可验证预测种子
 * 当用户尚未跑维度 / 无服务端预测时，保证报告内「可验证预测」非空。
 */

import type { ProReportView } from '@/lib/report-pro-view';
import type { Prediction, PredictionCategory } from '@/lib/predictions/types';

const TOPIC_TO_CAT: Record<string, PredictionCategory> = {
  career: 'career',
  wealth: 'wealth',
  marriage: 'marriage',
  health: 'health',
  overall: 'timing',
};

function addMonths(base: Date, months: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function endOfYear(year: number): string {
  return `${year}-12-31`;
}

function checklist(category: PredictionCategory): string[] {
  const base: Record<PredictionCategory, string[]> = {
    career: ['是否出现岗位/项目实质变化？', '工作节奏是否按判断调整？'],
    wealth: ['现金流或收入是否有可观察变化？', '是否避免了高杠杆冲动？'],
    marriage: ['关系边界与沟通是否按建议调整？', '是否出现承诺或冲突节点？'],
    health: ['作息/睡眠/运动是否连续执行？', '压力信号是否有所缓和？'],
    timing: ['该时间窗内整体节奏是否符合判断？', '关键决策结果是否与阶段一致？'],
  };
  return base[category];
}

/**
 * 从 Pro 视图抽出 3–5 条带 dueDate 的预测
 */
export function extractPredictionsFromProView(
  view: ProReportView,
  reportId: string,
  opts?: { referenceDate?: Date }
): Prediction[] {
  const ref = opts?.referenceDate || new Date();
  const year = ref.getFullYear();
  const createdAt = ref.toISOString();
  const out: Prediction[] = [];
  const seen = new Set<string>();

  const push = (partial: {
    category: PredictionCategory;
    statement: string;
    dueDate: string;
    window?: string;
    evidence: string;
    confidence?: number;
  }) => {
    const statement = partial.statement.replace(/\s+/g, ' ').trim();
    if (statement.length < 8 || seen.has(statement)) return;
    seen.add(statement);
    out.push({
      id: `${reportId}-pro-${out.length + 1}`,
      reportId,
      birthSignature: '',
      category: partial.category,
      statement,
      confidence: partial.confidence ?? 0.72,
      dueDate: partial.dueDate,
      window: partial.window,
      evidence: partial.evidence,
      verifyChecklist: checklist(partial.category),
      outcome: 'pending',
      createdAt,
      source: 'report',
    });
  };

  // 1) 现在最该做 → 30 天验证
  if (view.nowAction.doThis) {
    push({
      category: 'timing',
      statement: `未来 30 天优先完成：${view.nowAction.doThis}`,
      dueDate: addMonths(ref, 1),
      window: '未来30天',
      evidence: '决策条 · 现在最该做',
      confidence: 0.8,
    });
  }

  // 2) 议题 push / caution
  for (const topic of view.topics.filter((t) => t.key !== 'overall').slice(0, 4)) {
    const cat = TOPIC_TO_CAT[topic.key] || 'timing';
    if (topic.status === 'push') {
      push({
        category: cat,
        statement: `${year}年内「${topic.title}」宜顺势推进（结构 ${topic.score10}/10）：${topic.summary || topic.tags[0] || '把握窗口'}`,
        dueDate: endOfYear(year),
        window: `${year}年`,
        evidence: `议题 · ${topic.title}`,
        confidence: 0.74,
      });
    } else if (topic.status === 'caution') {
      push({
        category: cat,
        statement: `未来 6 个月「${topic.title}」宜防守收敛（${topic.score10}/10）：${topic.summary || '少硬推'}`,
        dueDate: addMonths(ref, 6),
        window: '未来6个月',
        evidence: `议题 · ${topic.title}`,
        confidence: 0.73,
      });
    }
  }

  // 3) 风险月
  for (const risk of view.riskAlerts.slice(0, 2)) {
    const due =
      risk.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(risk.dateKey)
        ? risk.dateKey
        : addMonths(ref, 3);
    push({
      category: 'timing',
      statement: `${risk.when}需重点避险：${risk.title}。${risk.action || '宜降低硬承诺'}`,
      dueDate: due,
      window: risk.when,
      evidence: '重点避险',
      confidence: risk.severity === 'high' ? 0.78 : 0.7,
    });
  }

  // 4) 时间轴：今年 / 明年
  const yearScore = view.timeScores.find((s) => s.key === 'year');
  if (yearScore) {
    const tone =
      yearScore.level === 'good' ? '偏顺，适合稳中推进主线' : yearScore.level === 'caution' ? '偏紧，宜收敛扩张' : '中平，宜单点验证';
    push({
      category: 'timing',
      statement: `${year}年综合节奏 ${yearScore.score10}/10，${tone}${yearScore.tip ? `：${yearScore.tip}` : ''}`,
      dueDate: endOfYear(year),
      window: `${year}年`,
      evidence: '时间轴 · 今年',
      confidence: 0.71,
    });
  }

  const nextYear = view.timeScores.find((s) => s.key === 'nextYear');
  if (nextYear) {
    push({
      category: 'timing',
      statement: `${year + 1}年展望 ${nextYear.score10}/10：${nextYear.tip || '可提前规划主线'}`,
      dueDate: endOfYear(year + 1),
      window: `${year + 1}年`,
      evidence: '时间轴 · 明年',
      confidence: 0.68,
    });
  }

  // 5) 用神方向半年验证
  if (view.elements.yongShen.length) {
    push({
      category: 'career',
      statement: `未来半年至少完成 1 次「用神 ${view.elements.yongShen.join('、')}」同向的可验证行动（学习/岗位/项目择一）`,
      dueDate: addMonths(ref, 6),
      window: '未来半年',
      evidence: '喜用忌 · 用神',
      confidence: 0.75,
    });
  }

  // 保证至少 3 条
  while (out.length < 3) {
    push({
      category: 'timing',
      statement:
        out.length === 0
          ? `未来 90 天完成 1 次决策复盘，对照报告主轴是否仍成立`
          : out.length === 1
            ? `${year}年下半年再回来对「现在最别做」是否守住打分`
            : `把报告避险事项写入日历，到期评估是否减少了冲动决策`,
      dueDate: addMonths(ref, 3 + out.length),
      window: '结构回访',
      evidence: '兜底',
      confidence: 0.65,
    });
  }

  return out.slice(0, 5);
}
