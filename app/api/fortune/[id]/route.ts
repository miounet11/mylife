// 命理数据API
import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations } from '@/lib/database';
import { trackServerEvent } from '@/lib/analytics';
import { getCurrentUserId } from '@/lib/user-utils';
import { CURRENT_REPORT_VERSION, regenerateReportFromRecord } from '@/lib/report-pipeline';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { withReportVersionLineage } from '@/lib/report-version-lineage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    const fortuneData = fortuneOperations.getById(reportId);
    const currentUserId = await getCurrentUserId();

    if (!fortuneData) {
      return NextResponse.json(
        { success: false, error: '未找到命理数据' },
        { status: 404 }
      );
    }

    if (fortuneData.isPublic === false && fortuneData.userId !== currentUserId) {
      return NextResponse.json(
        { success: false, error: '该结果已隐藏' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fortuneData,
    });
  } catch (error) {
    console.error('[API] 获取命理数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: '未登录或会话失效' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    const fortuneData = fortuneOperations.getById(reportId);

    if (!fortuneData) {
      return NextResponse.json(
        { success: false, error: '未找到命理数据' },
        { status: 404 }
      );
    }

    if (fortuneData.userId !== currentUserId) {
      return NextResponse.json(
        { success: false, error: '无权修改此结果' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body?.action === 'upgrade') {
      const strategy = typeof body?.strategy === 'string' ? body.strategy : 'immediate';

      if (!['immediate', 'queue', 'defer'].includes(strategy)) {
        return NextResponse.json(
          { success: false, error: '不支持的升级策略' },
          { status: 400 }
        );
      }

      if (strategy === 'queue' || strategy === 'defer') {
        const queuedUpgrade = enqueueReportUpgrade({
          report: fortuneData,
          reason: strategy === 'queue' ? 'manual_queue_upgrade' : 'manual_wait_model_recovery',
          force: strategy === 'defer',
          nextRunAt: strategy === 'defer'
            ? new Date(Date.now() + 1000 * 60 * 30).toISOString()
            : undefined,
          meta: {
            strategy,
            requestedAt: new Date().toISOString(),
          },
        });

        trackServerEvent({
          userId: currentUserId,
          sessionId: currentUserId,
          eventName: 'report_upgrade_requested',
          page: `/result/${reportId}`,
          meta: {
            reportId,
            upgradedFromVersion: fortuneData.reportVersion || 'v1',
            targetVersion: CURRENT_REPORT_VERSION,
            strategy,
            upgradeQueued: queuedUpgrade.queued,
            queueReason: queuedUpgrade.reason,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            id: reportId,
            reportVersion: fortuneData.reportVersion || 'v1',
            strategy,
            llmUsed: !!fortuneData.analysis?.llmUsed,
            qualityAudit: fortuneData.analysis?.qualityAudit,
            upgradeQueued: queuedUpgrade.queued,
            queueReason: queuedUpgrade.reason,
            upgradeJob: queuedUpgrade.job,
          },
        });
      }

      const { result, llmUsed } = await regenerateReportFromRecord(fortuneData);
      result.analysis = withReportVersionLineage({
        previousAnalysis: fortuneData.analysis,
        previousReportVersion: fortuneData.reportVersion || 'v1',
        nextAnalysis: result.analysis,
        nextReportVersion: CURRENT_REPORT_VERSION,
      });

      fortuneOperations.update(reportId, {
        name: fortuneData.name,
        bazi: result.basic,
        fiveElements: result.fiveElements,
        tenGods: result.tenGods || {},
        pattern: result.pattern,
        fortune: result.fortune,
        advice: result.advice,
        evidence: result.evidence,
        analysis: result.analysis,
        klineData: result.klineData,
        dayun: result.dayun,
        shenSha: result.shenSha,
        reportVersion: CURRENT_REPORT_VERSION,
      });
      const refreshed = fortuneOperations.getById(reportId) || fortuneData;
      const queuedUpgrade = enqueueReportUpgrade({
        report: refreshed,
        reason: 'manual_upgrade_followup',
        meta: {
          strategy: 'immediate',
          requestedAt: new Date().toISOString(),
        },
      });

      trackServerEvent({
        userId: currentUserId,
        sessionId: currentUserId,
        eventName: 'report_upgrade_requested',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          upgradedFromVersion: fortuneData.reportVersion || 'v1',
          targetVersion: CURRENT_REPORT_VERSION,
          llmUsed,
          reasoningMode: result.analysis?.reasoningMode || 'engine',
          qualityScore: result.analysis?.qualityAudit?.overallScore || 0,
          qualityGrade: result.analysis?.qualityAudit?.grade || 'C',
          deliveryTier: result.analysis?.qualityAudit?.deliveryTier || 'basic',
          expertTargetAchieved: !!result.analysis?.qualityAudit?.targetAchieved,
          strategy: 'immediate',
          upgradeQueued: queuedUpgrade.queued,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: reportId,
          reportVersion: CURRENT_REPORT_VERSION,
          strategy: 'immediate',
          llmUsed,
          qualityAudit: result.analysis?.qualityAudit,
          upgradeQueued: queuedUpgrade.queued,
          queueReason: queuedUpgrade.reason,
          upgradeJob: queuedUpgrade.job,
        },
      });
    }

    if (typeof body.isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '缺少 isPublic 参数或升级动作' },
        { status: 400 }
      );
    }

    fortuneOperations.update(reportId, { isPublic: body.isPublic });

    return NextResponse.json({
      success: true,
      data: {
        id: reportId,
        isPublic: body.isPublic,
      },
    });
  } catch (error) {
    console.error('[API] 更新公开状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const reportId = data.reportId;
    const fortuneData = data.result;

    if (!reportId || !fortuneData) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 注意：主流程由 /api/analyze 写库，这里仅作为兼容接口保留
    const existing = fortuneOperations.getById(reportId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '请通过分析接口创建报告' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '命理数据已存在',
      reportId,
    });
  } catch (error) {
    console.error('[API] 保存命理数据失败:', error);
    return NextResponse.json(
      { success: false, error: '保存失败' },
      { status: 500 }
    );
  }
}
