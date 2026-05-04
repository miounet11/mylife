import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { buildSourceCtaStrategy } from '@/lib/source-cta';
import type { SourceCtaStrategy, SourceSurfaceType } from '@/lib/source-cta';

export { appendSourceToHref } from '@/lib/source-url';
export { buildSourceCtaStrategy };
export type { SourceCtaStrategy, SourceSurfaceType };

export interface SourceContext {
  rawSource: string;
  surfaceType: SourceSurfaceType;
  slug: string | null;
  originalSource: string | null;
  isLifecycleRecall: boolean;
  isContentSource: boolean;
  isKnowledgeSource: boolean;
  isCaseSource: boolean;
  displayLabel: string;
  shortLabel: string;
  guidanceLabel: string;
  reportHeadline: string;
  reportDescription: string;
  toolHeadline: string;
  toolDescription: string;
}

export interface SourceJourneyCopy {
  title: string;
  description: string;
}

export function buildSourceJourneyCopy(rawSource: string | null | undefined, fallback: SourceJourneyCopy): SourceJourneyCopy {
  const context = getSourceContext(rawSource);
  if (!rawSource || context.surfaceType === 'direct') {
    return fallback;
  }

  if (context.isLifecycleRecall) {
    return {
      title: `把这次${context.guidanceLabel}变成真正复访`,
      description: `${context.reportDescription} 下一步入口会继续保留来源上下文，避免回来之后重新从零开始。`,
    };
  }

  if (context.isContentSource) {
    return {
      title: `从“${context.shortLabel}”继续往下走`,
      description: `这次不是泛泛推荐，而是顺着你刚才进入的内容线索，继续接到综合报告、单项工具、相关文章和案例。`,
    };
  }

  if (context.surfaceType === 'tool_detail') {
    return {
      title: '从工具兴趣继续接到完整判断',
      description: '你已经表现出具体问题意图，下一步会保留这条来源，把综合报告、后续工具和内容路径串起来。',
    };
  }

  return {
    title: `顺着${context.shortLabel}继续推进`,
    description: '系统会保留这次来源上下文，把后续报告、工具和内容入口串成一条连续路径，而不是让你重新找入口。',
  };
}

function formatContentLabel(params: {
  surfaceType: 'knowledge_article' | 'case_article';
  slug: string;
}) {
  const entry = getManagedContentEntryBySlug(
    params.surfaceType === 'knowledge_article' ? 'knowledge' : 'case',
    params.slug
  );
  if (!entry) {
    return params.slug;
  }
  return entry.title;
}

function buildContentSourceContext(params: {
  rawSource: string;
  surfaceType: 'knowledge_article' | 'case_article';
  slug: string;
  originalSource?: string | null;
  isLifecycleRecall?: boolean;
}): SourceContext {
  const title = formatContentLabel({
    surfaceType: params.surfaceType,
    slug: params.slug,
  });
  const contentTypeLabel = params.surfaceType === 'knowledge_article' ? '知识文章' : '案例';
  const lifecyclePrefix = params.isLifecycleRecall ? '这是你上次看过后又被重新带回来的入口。' : '';

  return {
    rawSource: params.rawSource,
    surfaceType: params.surfaceType,
    slug: params.slug,
    originalSource: params.originalSource || null,
    isLifecycleRecall: !!params.isLifecycleRecall,
    isContentSource: true,
    isKnowledgeSource: params.surfaceType === 'knowledge_article',
    isCaseSource: params.surfaceType === 'case_article',
    displayLabel: `${contentTypeLabel} · ${title}`,
    shortLabel: title,
    guidanceLabel: `${contentTypeLabel}回流`,
    reportHeadline: `你是从“${title}”这条线索回来的，先把它落回你的真实判断。`,
    reportDescription: `${lifecyclePrefix}不要再泛看一遍结果，优先围绕这条${contentTypeLabel}里最打动你的问题继续追问，再决定要不要记录事件或继续下钻工具。`,
    toolHeadline: `你上次是从“${title}”被带到这个工具，现在最值得直接把它跑完。`,
    toolDescription: `${lifecyclePrefix}既然这条${contentTypeLabel}已经把问题缩小到这里，就不要停在“看懂工具介绍”，直接拿到一个可执行结果。`,
  };
}

export function getSourceContext(rawSource?: string | null): SourceContext {
  const normalized = `${rawSource || ''}`.trim();
  if (!normalized) {
    return {
      rawSource: '',
      surfaceType: 'direct',
      slug: null,
      originalSource: null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '直接访问',
      shortLabel: '直接访问',
      guidanceLabel: '直接访问',
      reportHeadline: '先围绕这份结果继续推进，不要只停在看完。',
      reportDescription: '这份结果真正的价值，不在于多读一遍，而在于继续追问、记录事件、再用现实反馈回头校正。',
      toolHeadline: '现在最值得做的，不是继续浏览，而是直接把这个工具跑完。',
      toolDescription: '免费结果先拿方向，拿到结果后再决定是否继续深问或进入深测，不要停在详情页。',
    };
  }

  if (normalized.startsWith('lifecycle_report_followup:')) {
    const originalSource = normalized.replace(/^lifecycle_report_followup:/, '').trim();
    if (originalSource.startsWith('knowledge_article:')) {
      return buildContentSourceContext({
        rawSource: normalized,
        surfaceType: 'knowledge_article',
        slug: originalSource.replace('knowledge_article:', '').trim(),
        originalSource,
        isLifecycleRecall: true,
      });
    }
    if (originalSource.startsWith('case_article:')) {
      return buildContentSourceContext({
        rawSource: normalized,
        surfaceType: 'case_article',
        slug: originalSource.replace('case_article:', '').trim(),
        originalSource,
        isLifecycleRecall: true,
      });
    }
    return {
      rawSource: normalized,
      surfaceType: 'lifecycle_report_followup',
      slug: null,
      originalSource: originalSource || null,
      isLifecycleRecall: true,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '报告召回',
      shortLabel: '报告召回',
      guidanceLabel: '邮件召回',
      reportHeadline: '你这次是被报告召回带回来的，先把这份结果推进成下一步。',
      reportDescription: '召回不是为了让你再看一遍摘要，而是把这份判断继续推进到聊天、事件和具体动作。',
      toolHeadline: '你是从召回链路重新回到工具的，现在优先把它跑完。',
      toolDescription: '既然已经回来，就直接拿到这次工具结果，再决定是否继续追问和深测。',
    };
  }

  if (normalized.startsWith('lifecycle_tool_interest:')) {
    const originalSource = normalized.replace(/^lifecycle_tool_interest:/, '').trim();
    if (originalSource.startsWith('knowledge_article:')) {
      return buildContentSourceContext({
        rawSource: normalized,
        surfaceType: 'knowledge_article',
        slug: originalSource.replace('knowledge_article:', '').trim(),
        originalSource,
        isLifecycleRecall: true,
      });
    }
    if (originalSource.startsWith('case_article:')) {
      return buildContentSourceContext({
        rawSource: normalized,
        surfaceType: 'case_article',
        slug: originalSource.replace('case_article:', '').trim(),
        originalSource,
        isLifecycleRecall: true,
      });
    }
    return {
      rawSource: normalized,
      surfaceType: 'lifecycle_tool_interest',
      slug: null,
      originalSource: originalSource || null,
      isLifecycleRecall: true,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '工具召回',
      shortLabel: '工具召回',
      guidanceLabel: '工具回流',
      reportHeadline: '你这次是从工具召回回来的，别停在重新浏览。',
      reportDescription: '如果这份报告就是你回来的底盘，优先继续追问当前最卡的问题，再决定要不要补事件和工具动作。',
      toolHeadline: '你这次是被工具召回带回来的，现在先把这个工具真正跑起来。',
      toolDescription: '别停在兴趣层，直接拿到结果，再根据结果决定后续动作。',
    };
  }

  if (normalized.startsWith('knowledge_article:')) {
    return buildContentSourceContext({
      rawSource: normalized,
      surfaceType: 'knowledge_article',
      slug: normalized.replace('knowledge_article:', '').trim(),
    });
  }

  if (normalized.startsWith('case_article:')) {
    return buildContentSourceContext({
      rawSource: normalized,
      surfaceType: 'case_article',
      slug: normalized.replace('case_article:', '').trim(),
    });
  }

  if (normalized.startsWith('result_report_followup:')) {
    const originalSource = normalized.replace(/^result_report_followup:/, '').trim();
    return getSourceContext(originalSource || 'result_report_followup');
  }

  if (normalized.startsWith('tool_result_followup:')) {
    const originalSource = normalized.replace(/^tool_result_followup:/, '').trim();
    return getSourceContext(originalSource || 'tool_result_followup');
  }

  if (normalized.startsWith('tool_detail')) {
    const originalSource = normalized.replace(/^tool_detail:?/, '').trim();
    return {
      rawSource: normalized,
      surfaceType: 'tool_detail',
      slug: null,
      originalSource: originalSource || null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '工具详情页',
      shortLabel: '工具详情页',
      guidanceLabel: '工具承接',
      reportHeadline: '你是从工具详情先回到底盘报告的，现在优先把综合判断看成一条主线。',
      reportDescription: '这份报告不是额外步骤，而是给后续工具一个更准确的底盘。先看主线，再回去下钻工具。',
      toolHeadline: '你已经从工具详情一路走到这里，先把结果拿完整。',
      toolDescription: '现在最值得做的是直接继续深问或回到综合判断，不要跳回浏览状态。',
    };
  }

  if (normalized === 'updates_page') {
    return {
      rawSource: normalized,
      surfaceType: 'updates_page',
      slug: null,
      originalSource: null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '更新中心',
      shortLabel: '更新中心',
      guidanceLabel: '更新回访',
      reportHeadline: '你是从更新中心回来的，先把这份结果推进成真实动作。',
      reportDescription: '既然已经从提醒和更新里回到这里，就不要只确认状态，优先把当前最卡的问题继续问下去。',
      toolHeadline: '你是从更新中心继续回来的，现在先把这个工具真正跑完。',
      toolDescription: '不要停在“想起来了”，直接拿到结果，让这次回访变成真实使用。',
    };
  }

  if (normalized === 'profile_page' || normalized.startsWith('profile_')) {
    return {
      rawSource: normalized,
      surfaceType: 'profile_page',
      slug: null,
      originalSource: null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '个人档案',
      shortLabel: '个人档案',
      guidanceLabel: '档案复访',
      reportHeadline: '你是从个人档案继续回来的，现在优先把历史判断接成下一步。',
      reportDescription: '档案页的价值不是保存记录，而是让报告、事件、工具和更新形成持续复访闭环。',
      toolHeadline: '你是从个人档案进入工具的，现在适合接着历史问题继续下钻。',
      toolDescription: '别重新从零浏览，先沿用档案里的报告和事件上下文，把这次工具结果跑完整。',
    };
  }

  if (normalized === 'history_page' || normalized.startsWith('history_')) {
    return {
      rawSource: normalized,
      surfaceType: 'history_page',
      slug: null,
      originalSource: null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '历史复盘',
      shortLabel: '历史复盘',
      guidanceLabel: '历史复访',
      reportHeadline: '你是从历史复盘继续回来的，现在优先纠偏和验证最关键样本。',
      reportDescription: '历史页最适合把旧报告、事件结果和偏差样本接回聊天，让判断越用越准。',
      toolHeadline: '你是从历史复盘进入工具的，现在适合围绕已验证或待纠偏的问题继续测。',
      toolDescription: '不要只回看旧记录，直接把历史里的偏差、验证和窗口问题转成下一次工具动作。',
    };
  }

  if (normalized === 'events_page' || normalized.startsWith('events_') || normalized.startsWith('important_events_')) {
    return {
      rawSource: normalized,
      surfaceType: 'events_page',
      slug: null,
      originalSource: null,
      isLifecycleRecall: false,
      isContentSource: false,
      isKnowledgeSource: false,
      isCaseSource: false,
      displayLabel: '事件工作台',
      shortLabel: '事件工作台',
      guidanceLabel: '事件复访',
      reportHeadline: '你是从事件工作台继续回来的，现在优先围绕真实节点验证报告。',
      reportDescription: '事件页最适合把现实反馈接回报告和聊天，避免结果停留在一次性阅读。',
      toolHeadline: '你是从事件工作台进入工具的，现在适合围绕真实节点继续下钻。',
      toolDescription: '先把这次事件对应的问题跑完，再回到聊天里校验偏差和下一步动作。',
    };
  }

  return {
    rawSource: normalized,
    surfaceType: 'unknown',
    slug: null,
    originalSource: null,
    isLifecycleRecall: false,
    isContentSource: false,
    isKnowledgeSource: false,
    isCaseSource: false,
    displayLabel: normalized,
    shortLabel: normalized,
    guidanceLabel: '回流来源',
    reportHeadline: '你这次是顺着上一条线索回来的，先把它继续推进。',
    reportDescription: '不要重新泛读，优先继续追问当前最重要的问题，再决定是否记录事件和继续下钻。',
    toolHeadline: '你这次是顺着上一条线索回来的，先把工具跑完。',
    toolDescription: '现在最值得做的是直接拿到结果，而不是继续停在介绍层。',
  };
}
