export type SourceSurfaceType =
  | 'lifecycle_report_followup'
  | 'lifecycle_tool_interest'
  | 'knowledge_article'
  | 'case_article'
  | 'tool_detail'
  | 'updates_page'
  | 'profile_page'
  | 'history_page'
  | 'events_page'
  | 'result_report_followup'
  | 'tool_result_followup'
  | 'direct'
  | 'unknown';

export interface SourceCtaStrategy {
  strategyKey: string;
  sourceFamily: SourceSurfaceType;
  reportPrimaryLabel: string;
  reportSecondaryLabel: string;
  reportEventLabel: string;
  reportPastEventLabel: string;
  toolPrimaryLabel: string;
  toolChatLabel: string;
  searchAnalyzeLabel: string;
  searchToolLabel: string;
  searchCaseLabel: string;
  actionGuide: string;
}

const defaultSourceCtaStrategy: SourceCtaStrategy = {
  strategyKey: 'default',
  sourceFamily: 'direct',
  reportPrimaryLabel: '去 AI 深问这份报告',
  reportSecondaryLabel: '进入结构追问',
  reportEventLabel: '去事件页继续记录',
  reportPastEventLabel: '直接去标记过去事件',
  toolPrimaryLabel: '立即开始这个工具',
  toolChatLabel: '先去结构追问',
  searchAnalyzeLabel: '先测我的情况',
  searchToolLabel: '直接进对应工具',
  searchCaseLabel: '看相近案例',
  actionGuide: '快速操作',
};

function resolveSourceFamily(rawSource?: string | null): {
  sourceFamily: SourceSurfaceType;
  isLifecycleRecall: boolean;
} {
  const normalized = `${rawSource || ''}`.trim();
  if (!normalized) {
    return { sourceFamily: 'direct', isLifecycleRecall: false };
  }

  if (normalized.startsWith('lifecycle_report_followup:') || normalized.startsWith('lifecycle_tool_interest:')) {
    const originalSource = normalized.replace(/^lifecycle_(report_followup|tool_interest):/, '').trim();
    if (originalSource.startsWith('knowledge_article:')) {
      return { sourceFamily: 'knowledge_article', isLifecycleRecall: true };
    }
    if (originalSource.startsWith('case_article:')) {
      return { sourceFamily: 'case_article', isLifecycleRecall: true };
    }
    return {
      sourceFamily: normalized.startsWith('lifecycle_report_followup:')
        ? 'lifecycle_report_followup'
        : 'lifecycle_tool_interest',
      isLifecycleRecall: true,
    };
  }

  if (normalized.startsWith('knowledge_article:')) {
    return { sourceFamily: 'knowledge_article', isLifecycleRecall: false };
  }
  if (normalized.startsWith('case_article:')) {
    return { sourceFamily: 'case_article', isLifecycleRecall: false };
  }
  if (normalized.startsWith('tool_detail')) {
    return { sourceFamily: 'tool_detail', isLifecycleRecall: false };
  }
  if (normalized === 'profile_page') {
    return { sourceFamily: 'profile_page', isLifecycleRecall: false };
  }
  if (normalized === 'history_page' || normalized === 'history_drift_review') {
    return { sourceFamily: 'history_page', isLifecycleRecall: false };
  }
  if (normalized === 'events_page' || normalized === 'important_events_drift') {
    return { sourceFamily: 'events_page', isLifecycleRecall: false };
  }
  if (normalized === 'updates_page') {
    return { sourceFamily: 'updates_page', isLifecycleRecall: false };
  }
  if (normalized.startsWith('result_report_followup:')) {
    return resolveSourceFamily(normalized.replace(/^result_report_followup:/, '').trim() || 'result_report_followup');
  }
  if (normalized.startsWith('tool_result_followup:')) {
    return resolveSourceFamily(normalized.replace(/^tool_result_followup:/, '').trim() || 'tool_result_followup');
  }

  return { sourceFamily: 'unknown', isLifecycleRecall: false };
}

export function buildSourceCtaStrategy(rawSource?: string | null): SourceCtaStrategy {
  const context = resolveSourceFamily(rawSource);
  if (!rawSource || context.sourceFamily === 'direct') {
    return defaultSourceCtaStrategy;
  }

  if (context.isLifecycleRecall) {
    return {
      strategyKey: 'lifecycle_recall_resume',
      sourceFamily: context.sourceFamily,
      reportPrimaryLabel: '继续上次没问完的问题',
      reportSecondaryLabel: '接着上次报告深问',
      reportEventLabel: '把这次回访记成事件',
      reportPastEventLabel: '先确认过去节点',
      toolPrimaryLabel: '继续上次想跑的工具',
      toolChatLabel: '先问这次回访重点',
      searchAnalyzeLabel: '接着上次线索测自己',
      searchToolLabel: '继续上次工具',
      searchCaseLabel: '看相似回访案例',
      actionGuide: '回访后下一步',
    };
  }

  if (context.sourceFamily === 'knowledge_article') {
    return {
      strategyKey: 'knowledge_to_self_judgment',
      sourceFamily: context.sourceFamily,
      reportPrimaryLabel: '围绕这篇文章继续深问',
      reportSecondaryLabel: '把文章问题问到自己身上',
      reportEventLabel: '记录文章触发的现实节点',
      reportPastEventLabel: '对照过去是否发生过',
      toolPrimaryLabel: '用工具验证文章里的问题',
      toolChatLabel: '先问文章对应的自己问题',
      searchAnalyzeLabel: '把文章落到我的结构',
      searchToolLabel: '用工具验证这篇文章',
      searchCaseLabel: '看文章对应案例',
      actionGuide: '从阅读进入判断',
    };
  }

  if (context.sourceFamily === 'case_article') {
    return {
      strategyKey: 'case_to_self_comparison',
      sourceFamily: context.sourceFamily,
      reportPrimaryLabel: '对照这个案例问我的结构',
      reportSecondaryLabel: '拿我的情况对照案例',
      reportEventLabel: '记录和案例相似的节点',
      reportPastEventLabel: '先标记相似过去节点',
      toolPrimaryLabel: '用工具对照这个案例',
      toolChatLabel: '先问我和案例差在哪',
      searchAnalyzeLabel: '测我和案例是否相似',
      searchToolLabel: '用工具复核案例结构',
      searchCaseLabel: '继续看同类案例',
      actionGuide: '从案例进入自己',
    };
  }

  if (context.sourceFamily === 'tool_detail') {
    return {
      strategyKey: 'tool_intent_to_run',
      sourceFamily: context.sourceFamily,
      reportPrimaryLabel: '先把工具问题接回报告',
      reportSecondaryLabel: '用报告校准这个工具',
      reportEventLabel: '记录工具相关节点',
      reportPastEventLabel: '标记工具对应的过去节点',
      toolPrimaryLabel: '直接运行这个工具',
      toolChatLabel: '先问工具该怎么用',
      searchAnalyzeLabel: '先补综合底盘',
      searchToolLabel: '直接跑这个工具',
      searchCaseLabel: '看这个工具对应案例',
      actionGuide: '从工具意图继续',
    };
  }

  if (['profile_page', 'history_page', 'events_page'].includes(context.sourceFamily)) {
    return {
      strategyKey: 'retention_workbench_resume',
      sourceFamily: context.sourceFamily,
      reportPrimaryLabel: '继续接着我的档案深问',
      reportSecondaryLabel: '带着历史上下文追问',
      reportEventLabel: '把这次复访记成事件',
      reportPastEventLabel: '先补回过去验证',
      toolPrimaryLabel: '接着历史问题继续测',
      toolChatLabel: '先问当前最该复盘什么',
      searchAnalyzeLabel: '先补完整个人底盘',
      searchToolLabel: '接着历史问题做工具',
      searchCaseLabel: '看相似复盘案例',
      actionGuide: '从复访工作台继续',
    };
  }

  return defaultSourceCtaStrategy;
}
