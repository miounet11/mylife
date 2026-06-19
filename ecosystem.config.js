// PM2配置文件
const fs = require('fs');
const path = require('path');
const ecosystemSecrets = require('./scripts/load-ecosystem-env.js');
// 默认只启动主站。后台任务可显式开启；web/cron 隔离副本已废弃，避免 nginx/PM2 端口漂移。
// 这是个简单网站 + LLM 引擎，默认不该用一堆常驻进程把小机器拖死。
const enableBackgroundWorkers = process.env.ENABLE_BACKGROUND_WORKERS === '1';
const enableWebReplicas = false;
const enableCronTier = false;
const enableWatchdogs = process.env.ENABLE_WATCHDOGS === '1';
const enableContentWorkers = process.env.ENABLE_CONTENT_WORKERS === '1';
const enableKnowledgeWorker = process.env.ENABLE_KNOWLEDGE_WORKER === '1';
const enableAgenticPipeline = process.env.ENABLE_AGENTIC_PIPELINE ?? '0';
const openAgentRuntimeEnabled = process.env.OPEN_AGENT_RUNTIME_ENABLED ?? '0';

function readCurrentBuildId() {
  const processBuildId = `${process.env.LIFE_KLINE_BUILD_ID || ''}`.trim();
  if (processBuildId) return processBuildId;

  try {
    return fs.readFileSync(path.join(__dirname, '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    return '';
  }
}

const currentBuildId = readCurrentBuildId();

// v5-D83: daemon 回调走本机 nginx :8080，让内部请求也经过 upstream 分流。
const INTERNAL_API_HOST = process.env.INTERNAL_API_HOST || '127.0.0.1:8080';
const cronEnv = {
  CONTENT_RADAR_CRON_TOKEN: 'life-kline-radar-local-2026',
  CONTENT_SCHEDULER_CRON_TOKEN: 'life-kline-scheduler-local-2026',
  CONTENT_GENERATION_CRON_TOKEN: 'life-kline-content-generation-local-2026',
  KNOWLEDGE_ACQUISITION_CRON_TOKEN: 'life-kline-knowledge-local-2026',
  REPORT_UPGRADE_CRON_TOKEN: 'life-kline-upgrade-local-2026',
  REPORT_MONTHLY_DIGEST_CRON_TOKEN: 'life-kline-monthly-digest-local-2026',
  EMAIL_RETRY_CRON_TOKEN: 'life-kline-email-retry-local-2026',
  TIMING_EMAIL_CRON_TOKEN: 'life-kline-timing-email-local-2026',
  USER_LIFECYCLE_EMAIL_CRON_TOKEN: 'life-kline-user-lifecycle-local-2026',
};

// v5-D121 (2026-05-25): 全链路统一切 ttqq + auto。
// 上游网关 auto 自动选模型；本地不再维护 fallback 链（空串覆盖 .env.local 默认值）。
// 历史 D21 治理（4.1-mini / gpt-5.2 / gpt-5.5）作废。
const PRIMARY_LLM_MODEL = 'auto';
const LLM_FALLBACK_CHAIN = '';

const nextApp = {
  name: 'life-kline-next',
  script: 'node_modules/next/dist/bin/next',
  args: 'start',
  cwd: '/home/life-kline-next',
  // 单 Next 实例：nginx 负责缓存、限流和长链路 timeout；不要再用端口副本做伪隔离。
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PORT: 3000,
    LIFE_KLINE_BUILD_ID: currentBuildId,
    WEB_TIER_ROLE: 'user',
    ENABLE_AGENTIC_PIPELINE: enableAgenticPipeline,
    DEFAULT_MODEL: PRIMARY_LLM_MODEL,
    OPEN_AGENT_RUNTIME_MODEL: PRIMARY_LLM_MODEL,
    CONTENT_GENERATION_MODEL: PRIMARY_LLM_MODEL,
    // v5-C1 (2026-05-11): 统一文本生成主链路、备用链路与兜底链路。
    MODEL_FALLBACK_CHAIN: LLM_FALLBACK_CHAIN,
    REPORT_MODEL_FALLBACK_CHAIN: LLM_FALLBACK_CHAIN,
    REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN: LLM_FALLBACK_CHAIN,
    CONTENT_GENERATION_MODEL_FALLBACK_CHAIN: LLM_FALLBACK_CHAIN,
    CHAT_LLM_TIMEOUT_MS: process.env.CHAT_LLM_TIMEOUT_MS || '240000',
    OPEN_AGENT_RUNTIME_ENABLED: openAgentRuntimeEnabled,
    // Agent enrichment 只在后台/upgrade 路径补强，默认串行，避免上游 auto 抖动时并发雪崩。
    AGENT_PARALLEL_CONCURRENCY: process.env.AGENT_PARALLEL_CONCURRENCY || '1',
    // v5-A5d (2026-05-09): 熔断阈值放宽 — 之前 IMMEDIATE_OPEN=2 + CONSECUTIVE=3，并发 7 个 agent 同时失败时雪崩
    // 现在 main IMMEDIATE_OPEN=4 + CONSECUTIVE=5 + 冷却缩到 2 分钟，给系统更多自愈空间
    LLM_HEALTH_WINDOW_MINUTES: '15',
    LLM_CIRCUIT_OPEN_MIN_ATTEMPTS: '5',
    LLM_CIRCUIT_OPEN_FAILURE_RATE: '0.7',
    LLM_CIRCUIT_DEGRADE_FAILURE_RATE: '0.50',
    LLM_CIRCUIT_RECOVER_FAILURE_RATE: '0.30',
    LLM_CIRCUIT_OPEN_CONSECUTIVE_FAILURES: '5',
    LLM_CIRCUIT_IMMEDIATE_OPEN_CONSECUTIVE_FAILURES: '4',
    LLM_CIRCUIT_RECOVERY_SUCCESS_STREAK: '1',
    // v5-C2 (2026-05-15): cooldown 2→4 分钟，避免三档同分钟一起 half-open 撞同一上游波动
    LLM_CIRCUIT_OPEN_COOLDOWN_MINUTES: '4',
    // v5-A4 (2026-05-08) 升级队列重试上限收紧：6 → 4
    // 配合 A1 删 'auto' + A2 熔断收紧，避免堆积 retry 风暴
    REPORT_UPGRADE_MAX_ATTEMPTS: '4',
    // 文章漏斗 v1（A 阶段）灰度开关 — A 阶段已 reload 上线 2026-05-10
    // 0 关闭 / 1 启用 inline+sticky+scrollDepth；NEXT_PUBLIC_* 是 build-time 内联，回滚需重 build
    NEXT_PUBLIC_ARTICLE_CTA_V1: process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 || '1',
    // Sub-Spec C (2026-05-10) 命理时间提醒 cron token
    TIMING_EMAIL_CRON_TOKEN: 'life-kline-timing-email-local-2026',
    ...cronEnv,
    CONTENT_RADAR_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/content/radar/cron`,
    CONTENT_RADAR_INTERVAL_MS: '2700000',
    CONTENT_RADAR_REQUEST_TIMEOUT_MS: '60000',
    CONTENT_RADAR_STARTUP_DELAY_MS: '15000',
    CONTENT_RADAR_RETRY_DELAY_MS: '60000',
    CONTENT_RADAR_AUTO_GENERATE: '0',
    CONTENT_RADAR_AUTO_PUBLISH: '0',
  },
  error_file: '/root/.pm2/logs/life-kline-next-error.log',
  out_file: '/root/.pm2/logs/life-kline-next-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '1800M',
  watch: false,
  restart_delay: 4000,
  node_args: '--max-old-space-size=1536 --expose-gc',
  // v5-D52 (2026-05-20): 重启期 502 防护
  // - kill_timeout 15s 给 Next.js 把 inflight 请求处理完（默认 1600ms 太短，长 LLM 请求会被腰斩）
  // - listen_timeout 给冷启动充足时间，避免 PM2 误判后强杀
  // - wait_ready: 依赖 Next.js 显式发 ready 才切流（next start 默认监听后即可，保守开启 = 否）
  kill_timeout: 15000,
  listen_timeout: 30000,
  shutdown_with_message: true,
};

const knowledgeWorker = {
  name: 'life-kline-knowledge',
  script: 'scripts/knowledge-acquisition-daemon.js',
  cwd: '/home/life-kline-next',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    KNOWLEDGE_ACQUISITION_ENABLED: '1',
    KNOWLEDGE_ACQUISITION_CRON_TOKEN: cronEnv.KNOWLEDGE_ACQUISITION_CRON_TOKEN,
    KNOWLEDGE_ACQUISITION_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/knowledge/sources/cron`,
    KNOWLEDGE_ACQUISITION_INTERVAL_MS: '1800000',
    KNOWLEDGE_ACQUISITION_REQUEST_TIMEOUT_MS: '180000',
    KNOWLEDGE_ACQUISITION_STARTUP_DELAY_MS: '25000',
    KNOWLEDGE_ACQUISITION_RETRY_DELAY_MS: '60000',
    KNOWLEDGE_ACQUISITION_LOCK_TTL_MS: '2700000',
    KNOWLEDGE_ACQUISITION_REFRESH_RADAR: '1',
    KNOWLEDGE_ACQUISITION_CORE_LIMIT: '18',
    KNOWLEDGE_ACQUISITION_MAX_DOMAINS_PER_RUN: '3',
    KNOWLEDGE_ACQUISITION_SIGNAL_MIN_SCORE: '18',
    KNOWLEDGE_ACQUISITION_SIGNAL_PROMOTION_LIMIT: '10',
    KNOWLEDGE_ACQUISITION_RADAR_LIMIT_PER_SOURCE: '8',
    KNOWLEDGE_ACQUISITION_FOCUS_DOMAINS: 'metaphysics,psychology,philosophy,history,ai,statistics,programming,astrology,medicine',
    KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH: '1',
    KNOWLEDGE_SYNTHESIS_PUBLISH_THRESHOLD: '78',
    KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES: 'topic-overview,concept-glossary,book-path,book-ladder',
    KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE: '4',
  },
  error_file: '/root/.pm2/logs/life-kline-knowledge-error.log',
  out_file: '/root/.pm2/logs/life-kline-knowledge-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  watch: false,
  restart_delay: 5000,
};

const backgroundWorkers = enableBackgroundWorkers ? [
  {
    name: 'life-kline-email-retry',
    script: 'scripts/email-retry-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      EMAIL_RETRY_ENABLED: '1',
      EMAIL_RETRY_CRON_TOKEN: cronEnv.EMAIL_RETRY_CRON_TOKEN,
      EMAIL_RETRY_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/email/retry/cron`,
      EMAIL_RETRY_INTERVAL_MS: '120000',
      EMAIL_RETRY_BATCH_SIZE: '5',
      EMAIL_RETRY_MAX_ATTEMPTS: '4',
      EMAIL_RETRY_BASE_DELAY_MS: '300000',
      EMAIL_RETRY_REQUEST_TIMEOUT_MS: '60000',
      EMAIL_RETRY_STARTUP_DELAY_MS: '15000',
      EMAIL_RETRY_RETRY_DELAY_MS: '60000',
    },
    error_file: '/root/.pm2/logs/life-kline-email-retry-error.log',
    out_file: '/root/.pm2/logs/life-kline-email-retry-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-radar',
    script: 'scripts/content-radar-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      CONTENT_RADAR_ENABLED: '1',
      CONTENT_RADAR_CRON_TOKEN: cronEnv.CONTENT_RADAR_CRON_TOKEN,
      CONTENT_RADAR_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/content/radar/cron`,
      CONTENT_RADAR_INTERVAL_MS: '2700000',
      CONTENT_RADAR_REQUEST_TIMEOUT_MS: '60000',
      CONTENT_RADAR_STARTUP_DELAY_MS: '15000',
      CONTENT_RADAR_RETRY_DELAY_MS: '60000',
      CONTENT_RADAR_AUTO_GENERATE: '0',
      CONTENT_RADAR_AUTO_PUBLISH: '0',
    },
    error_file: '/root/.pm2/logs/life-kline-radar-error.log',
    out_file: '/root/.pm2/logs/life-kline-radar-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-content-generation',
    script: 'scripts/content-generation-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      CONTENT_GENERATION_ENABLED: '1',
      CONTENT_GENERATION_CRON_TOKEN: cronEnv.CONTENT_GENERATION_CRON_TOKEN,
      CONTENT_GENERATION_JOB_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/content/generate/cron`,
      CONTENT_GENERATION_JOB_INTERVAL_MS: '60000',
      CONTENT_GENERATION_JOB_REQUEST_TIMEOUT_MS: '900000',
      CONTENT_GENERATION_JOB_STARTUP_DELAY_MS: '15000',
      CONTENT_GENERATION_JOB_RETRY_DELAY_MS: '60000',
      CONTENT_GENERATION_JOB_MAX_ATTEMPTS: '3',
      CONTENT_GENERATION_JOB_BATCH_SIZE: '1',
    },
    error_file: '/root/.pm2/logs/life-kline-content-generation-error.log',
    out_file: '/root/.pm2/logs/life-kline-content-generation-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-scheduler',
    script: 'scripts/content-scheduler-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      CONTENT_SCHEDULER_ENABLED: '1',
      CONTENT_RADAR_CRON_TOKEN: cronEnv.CONTENT_RADAR_CRON_TOKEN,
      CONTENT_SCHEDULER_CRON_TOKEN: cronEnv.CONTENT_SCHEDULER_CRON_TOKEN,
      CONTENT_SCHEDULER_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/content/scheduler/cron`,
      CONTENT_SCHEDULER_INTERVAL_MS: '1200000',
      CONTENT_SCHEDULER_REQUEST_TIMEOUT_MS: '900000',
      CONTENT_SCHEDULER_STARTUP_DELAY_MS: '20000',
      CONTENT_SCHEDULER_RETRY_DELAY_MS: '60000',
      CONTENT_SCHEDULER_TIMEZONE_OFFSET_MINUTES: '480',
      CONTENT_SCHEDULER_PUBLISH_HOURS: '10,15,20',
      CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT: '3',
      CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES: '180',
      CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET: '12',
      CONTENT_SCHEDULER_DRAFT_BATCH_SIZE: '3',
      CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES: '240',
      CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS: '4',
      CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT: '10',
      CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT: '14',
      CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT: '8',
    },
    error_file: '/root/.pm2/logs/life-kline-scheduler-error.log',
    out_file: '/root/.pm2/logs/life-kline-scheduler-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-report-upgrader',
    script: 'scripts/report-upgrade-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      REPORT_UPGRADE_ENABLED: '1',
      REPORT_UPGRADE_CRON_TOKEN: cronEnv.REPORT_UPGRADE_CRON_TOKEN,
      REPORT_UPGRADE_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/report-upgrade/cron`,
      REPORT_UPGRADE_INTERVAL_MS: '180000',
      REPORT_UPGRADE_BATCH_SIZE: '2',
      // v5-C2 (2026-05-15): structure(180s)+narrative(90s)+overhead 必须 < daemon fetch 超时
      REPORT_UPGRADE_REQUEST_TIMEOUT_MS: '300000',
      REPORT_UPGRADE_STARTUP_DELAY_MS: '20000',
      REPORT_UPGRADE_RETRY_DELAY_MS: '60000',
      REPORT_MONTHLY_DIGEST_CRON_TOKEN: cronEnv.REPORT_MONTHLY_DIGEST_CRON_TOKEN,
      REPORT_MONTHLY_DIGEST_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/report-monthly-digest/cron`,
      REPORT_MONTHLY_DIGEST_INTERVAL_MS: '21600000',
      REPORT_MONTHLY_DIGEST_BATCH_SIZE: '20',
    },
    error_file: '/root/.pm2/logs/life-kline-report-upgrader-error.log',
    out_file: '/root/.pm2/logs/life-kline-report-upgrader-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-user-lifecycle-email',
    script: 'scripts/user-lifecycle-email-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      USER_LIFECYCLE_EMAIL_ENABLED: '1',
      USER_LIFECYCLE_EMAIL_CRON_TOKEN: cronEnv.USER_LIFECYCLE_EMAIL_CRON_TOKEN,
      USER_LIFECYCLE_EMAIL_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/email/lifecycle/cron`,
      USER_LIFECYCLE_EMAIL_INTERVAL_MS: '21600000',
      USER_LIFECYCLE_EMAIL_BATCH_SIZE: '25',
    },
    error_file: '/root/.pm2/logs/life-kline-user-lifecycle-email-error.log',
    out_file: '/root/.pm2/logs/life-kline-user-lifecycle-email-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-monthly-digest',
    script: 'scripts/report-monthly-digest-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      REPORT_MONTHLY_DIGEST_ENABLED: '1',
      REPORT_MONTHLY_DIGEST_CRON_TOKEN: cronEnv.REPORT_MONTHLY_DIGEST_CRON_TOKEN,
      REPORT_MONTHLY_DIGEST_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/report-monthly-digest/cron`,
      REPORT_MONTHLY_DIGEST_INTERVAL_MS: '21600000',
      REPORT_MONTHLY_DIGEST_BATCH_SIZE: '20',
      REPORT_MONTHLY_DIGEST_TIMEZONE_OFFSET_MINUTES: '480',
    },
    error_file: '/root/.pm2/logs/life-kline-monthly-digest-error.log',
    out_file: '/root/.pm2/logs/life-kline-monthly-digest-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-timing-email',
    script: 'scripts/timing-email-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      TIMING_EMAIL_CRON_TOKEN: cronEnv.TIMING_EMAIL_CRON_TOKEN,
      TIMING_EMAIL_RUN_URL: `http://${INTERNAL_API_HOST}/api/admin/timing/email/cron?mode=auto`,
      TIMING_EMAIL_INTERVAL_MS: '21600000',  // 6 小时
      TIMING_EMAIL_REQUEST_TIMEOUT_MS: '60000',
      TIMING_EMAIL_STARTUP_DELAY_MS: '30000',
      TIMING_EMAIL_RETRY_DELAY_MS: '60000',
    },
    error_file: '/root/.pm2/logs/life-kline-timing-email-error.log',
    out_file: '/root/.pm2/logs/life-kline-timing-email-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
  {
    name: 'life-kline-forum',
    script: 'scripts/forum-daemon.js',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      FORUM_DAILY_TARGET: '300',
      FORUM_TICK_MS: '300000', // 5 min
    },
    error_file: '/root/.pm2/logs/life-kline-forum-error.log',
    out_file: '/root/.pm2/logs/life-kline-forum-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 20,
    min_uptime: '10s',
    watch: false,
    restart_delay: 5000,
  },
] : [];

// Legacy port replicas are intentionally disabled. Keep the definitions only as an emergency manual template;
// normal production topology is one Next process on 3000 behind nginx cache/rate-limit/timeout controls.
const makeWebReplica = (suffix, port) => ({
  ...nextApp,
  name: `life-kline-next-${suffix}`,
  args: `start -p ${port}`,
  env: { ...nextApp.env, PORT: String(port) },
  error_file: `/root/.pm2/logs/life-kline-next-${suffix}-error.log`,
  out_file: `/root/.pm2/logs/life-kline-next-${suffix}-out.log`,
});

const webReplicas = [
  makeWebReplica('web1', 3001),
  makeWebReplica('web2', 3002),
];

// Legacy cron replica template. Normal daemon/admin traffic goes through nginx :8080 to the same 3000 upstream.
const cronReplicaBase = makeWebReplica('cron', 3004);
const cronReplica = {
  ...cronReplicaBase,
  env: { ...cronReplicaBase.env, WEB_TIER_ROLE: 'cron' },
  // cron 堆满后 event loop 卡死；早于 2200M 重启，避免 daemon 全挂
  max_memory_restart: process.env.CRON_MAX_MEMORY_RESTART || '1100M',
};

// v5-Stability + High-Concurrency Orchestration (2026-05-31 highest-dimension):
// Dedicated content-workers ONLY for heavy work (World Yi v2 elevation, knowledge synthesis,
// growth promote, visual, publication, bulk LLM).
// - User web replicas (life-kline-next-web*) are pure render tier. Heavy work here prevents
//   the "maxSize", 90%+ heap, 70s eventLoop disasters.
// - The high-concurrency-world-yi-generator.ts is now the full orchestrator:
//   supports --worker (queue poll + fallback seeds), advanced circuit/retry/backpressure,
//   v2 rubric gate, direct content-store + schedulePublishedAt + v2 meta.
// - Multiple workers share the DB queue safely via claimNextWorldYiV2Task.
// - Stability-monitor only reloads web* instances (content workers are intentionally heavy).
// - Start workers: pm2 startOrReload ecosystem... --only "life-kline-content-worker-*"
// - To run one-off: pm2 start "node --import tsx scripts/high-concurrency-world-yi-generator.ts --count=20 --concurrency=10 --lane=main" --name temp-v2-gen
const contentWorkers = [
  {
    name: 'life-kline-content-worker-1',
    script: 'scripts/world-yi-worker-entry.js',
    args: '--worker --lane=main',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=4352 --expose-gc',
    env: {
      NODE_ENV: 'production',
      OPENAI_API_KEY: ecosystemSecrets.OPENAI_API_KEY,
      API_BASE_URL: ecosystemSecrets.API_BASE_URL,
      CHAT_API_KEY: ecosystemSecrets.CHAT_API_KEY,
      CHAT_API_URL: process.env.CHAT_API_URL || 'https://ttqq.inping.com/v1/chat/completions',
      CHAT_API_MODEL: process.env.CHAT_API_MODEL || 'auto',
      CONTENT_GEN_CONCURRENCY: '8',
      CONTENT_GEN_MAX_PARALLEL: '40',
      IS_CONTENT_WORKER: '1',
      CONTENT_WORKER_ID: '1',
    },
    error_file: '/root/.pm2/logs/life-kline-content-worker-1-error.log',
    out_file: '/root/.pm2/logs/life-kline-content-worker-1-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 12,
    min_uptime: '45s',
    max_memory_restart: '4350M',
    watch: false,
    restart_delay: 10000,
    kill_timeout: 90000,
  },
  {
    name: 'life-kline-content-worker-2',
    script: 'scripts/world-yi-worker-entry.js',
    args: '--worker --lane=wave2',
    cwd: '/home/life-kline-next',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=4096 --expose-gc',
    env: {
      NODE_ENV: 'production',
      OPENAI_API_KEY: ecosystemSecrets.OPENAI_API_KEY,
      API_BASE_URL: ecosystemSecrets.API_BASE_URL,
      CHAT_API_KEY: ecosystemSecrets.CHAT_API_KEY,
      CHAT_API_URL: process.env.CHAT_API_URL || 'https://ttqq.inping.com/v1/chat/completions',
      CHAT_API_MODEL: process.env.CHAT_API_MODEL || 'auto',
      CONTENT_GEN_CONCURRENCY: '6',
      CONTENT_GEN_MAX_PARALLEL: '30',
      IS_CONTENT_WORKER: '1',
      CONTENT_WORKER_ID: '2',
    },
    error_file: '/root/.pm2/logs/life-kline-content-worker-2-error.log',
    out_file: '/root/.pm2/logs/life-kline-content-worker-2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '30s',
    max_memory_restart: '4100M',
    watch: false,
    restart_delay: 11000,
    kill_timeout: 90000,
  },
];

// Lightweight stability self-healing monitor (Phase 0 from engineering plan)
const stabilityMonitor = {
  name: 'life-kline-stability-monitor',
  script: 'scripts/stability-monitor.js',
  cwd: '/home/life-kline-next',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    WEB_MEMORY_THRESHOLD_MB: '1100',
    WEB_RESTART_THRESHOLD_MB: '1350',
    EVENT_LOOP_P95_MS: '2500',
    CHECK_INTERVAL_MS: '45000',
    RELOAD_COOLDOWN_MS: '300000',
  },
  error_file: '/root/.pm2/logs/life-kline-stability-monitor-error.log',
  out_file: '/root/.pm2/logs/life-kline-stability-monitor-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  max_memory_restart: '256M',
  watch: false,
};

// stability-monitor 默认关闭；主站只护 3000。
const stabilityApps =
  process.env.ENABLE_STABILITY_MONITOR === '1' ? [stabilityMonitor] : [];

const userTierWatchdog = {
  name: 'life-kline-user-tier-watchdog',
  script: 'scripts/user-tier-watchdog.js',
  cwd: '/home/life-kline-next',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    USER_TIER_PORT: '3000',
    CHECK_INTERVAL_MS: '60000',
    RECOVERY_COOLDOWN_MS: '900000',
    FAIL_STREAK_BEFORE_ACT: '3',
  },
  error_file: '/root/.pm2/logs/life-kline-user-tier-watchdog-error.log',
  out_file: '/root/.pm2/logs/life-kline-user-tier-watchdog-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  max_memory_restart: '128M',
  watch: false,
};

const cronTierWatchdog = {
  name: 'life-kline-cron-tier-watchdog',
  script: 'scripts/cron-tier-watchdog.js',
  cwd: '/home/life-kline-next',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    CRON_TIER_PORT: '3004',
    CHECK_INTERVAL_MS: '60000',
    RECOVERY_COOLDOWN_MS: '900000',
    FAIL_STREAK_BEFORE_ACT: '3',
  },
  error_file: '/root/.pm2/logs/life-kline-cron-tier-watchdog-error.log',
  out_file: '/root/.pm2/logs/life-kline-cron-tier-watchdog-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  max_memory_restart: '128M',
  watch: false,
};

const publicSurfaceWatchdog = {
  name: 'life-kline-public-surface-watchdog',
  script: 'scripts/public-surface-watchdog.js',
  cwd: '/home/life-kline-next',
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    PUBLIC_SURFACE_HOST: 'www.life-kline.com',
    CHECK_INTERVAL_MS: '45000',
    RECOVERY_COOLDOWN_MS: '600000',
    FAIL_STREAK_BEFORE_ACT: '2',
    PROBE_TIMEOUT_MS: '8000',
    PUBLIC_SURFACE_RECOVERY_PM2: 'life-kline-next-web1,life-kline-next-web2',
  },
  error_file: '/root/.pm2/logs/life-kline-public-surface-watchdog-error.log',
  out_file: '/root/.pm2/logs/life-kline-public-surface-watchdog-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  max_memory_restart: '128M',
  watch: false,
};

const enablePublicSurfaceWatchdog = false;

const watchdogApps = enableWatchdogs ? [
  userTierWatchdog,
] : [];

module.exports = {
  apps: [
    nextApp,
    ...(enableWebReplicas ? webReplicas : []),
    ...(enableCronTier ? [cronReplica] : []),
    ...(enableKnowledgeWorker ? [knowledgeWorker] : []),
    ...backgroundWorkers,
    ...watchdogApps,
    ...stabilityApps,
  ],
};
