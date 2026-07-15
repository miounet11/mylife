/**
 * Autonomous ops loop contract — documents the self-cycling mechanism
 * implemented by scripts/autonomous-ops-loop.js on production PM2.
 */

export type OpsLoopStage =
  | 'disk-guard'
  | 'process-health'
  | 'api-health'
  | 'content-loop'
  | 'remediate'
  | 'report';

export type ContentMissionPillar = 'knowledge' | 'world-yi' | 'kline-cta';

export type AutonomousContentLoopStage =
  | 'radar-signals'
  | 'interest-publish'
  | 'editorial-mission'
  | 'learning-track-link'
  | 'analyze-cta';

export const OPS_LOOP_STAGES: Array<{ stage: OpsLoopStage; responsibility: string }> = [
  { stage: 'disk-guard', responsibility: '监控磁盘水位，清理 .next-previous、/tmp 静态缓存、PM2 日志、SQLite WAL' },
  { stage: 'process-health', responsibility: '确保 life-kline-next / scheduler / radar / forum 守护进程在线' },
  { stage: 'api-health', responsibility: '拉取 /api/admin/system/health 架构快照，识别 critical / warning' },
  { stage: 'content-loop', responsibility: '检测 scheduler 断粮，在发布窗口内手动唤醒兴趣驱动发布' },
  { stage: 'remediate', responsibility: '按严重级别执行清理、PM2 重启、scheduler 补跑' },
  { stage: 'report', responsibility: '输出结构化周期日志，供运维与后续告警接入' },
];

export const CONTENT_AUTONOMOUS_LOOP: Array<{ stage: AutonomousContentLoopStage; cadence: string; owner: string }> = [
  { stage: 'radar-signals', cadence: '每 45 分钟', owner: 'life-kline-radar' },
  { stage: 'interest-publish', cadence: '每 20 分钟（8–21 点窗口）', owner: 'life-kline-scheduler' },
  { stage: 'editorial-mission', cadence: '每次发布', owner: 'content-ops + content-editorial-mission' },
  { stage: 'learning-track-link', cadence: '每次发布', owner: 'content-editorial-mission' },
  { stage: 'analyze-cta', cadence: '每次发布', owner: 'content-editorial-mission' },
];

export const CONTENT_MISSION_PILLARS: Array<{ pillar: ContentMissionPillar; goal: string }> = [
  { pillar: 'knowledge', goal: '普及命理知识，降低理解门槛' },
  { pillar: 'world-yi', goal: '宣传世界易方法论，建立全网差异化认知' },
  { pillar: 'kline-cta', goal: '引导用户生成人生K线报告，完成从阅读到测算的转化' },
];