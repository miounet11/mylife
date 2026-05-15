function readString(name: string, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

function readNumber(name: string, fallback: number, min?: number) {
  const raw = readString(name);
  const value = raw ? Number(raw) : fallback;
  const normalized = Number.isFinite(value) ? value : fallback;

  if (typeof min === 'number') {
    return Math.max(min, normalized);
  }

  return normalized;
}

function readBooleanFlag(name: string, fallback = false) {
  const raw = readString(name);
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export function getApiBaseUrl() {
  return readString('API_BASE_URL', 'https://ttqq.inping.com/v1');
}

export function getVisualAssetApiBaseUrl() {
  return readString('VISUAL_ASSET_API_BASE_URL', 'https://www.gemiai.top/v1');
}

export function normalizeApiKey(value?: string | null) {
  const key = (value || '').trim();
  if (!key || key === 'dummy_key') return null;
  return key;
}

export function getApiKey() {
  return normalizeApiKey(process.env.OPENAI_API_KEY) || normalizeApiKey(process.env.API_KEY);
}

export function getVisualAssetApiKey() {
  return (
    normalizeApiKey(process.env.VISUAL_ASSET_API_KEY)
    || normalizeApiKey(process.env.OPENAI_API_KEY)
    || normalizeApiKey(process.env.API_KEY)
  );
}

const DEFAULT_LLM_MODEL = 'gpt-5.5';
const DEFAULT_LLM_FALLBACK_CHAIN = 'gpt-5.4-mini,auto';

export function getDefaultModel() {
  return readString('DEFAULT_MODEL', DEFAULT_LLM_MODEL);
}

export function getGoogleAnalyticsId() {
  return readString('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-CC5FJRFNFS');
}

export function getKnowledgeAcquisitionLockTtlMs() {
  return readNumber('KNOWLEDGE_ACQUISITION_LOCK_TTL_MS', 1000 * 60 * 45, 60_000);
}

export function getKnowledgeCronToken() {
  return readString('KNOWLEDGE_ACQUISITION_CRON_TOKEN') || readString('CONTENT_RADAR_CRON_TOKEN');
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export function getContentRadarCronToken() {
  return readString('CONTENT_RADAR_CRON_TOKEN');
}

export function getContentSchedulerCronToken() {
  return readString('CONTENT_SCHEDULER_CRON_TOKEN') || getContentRadarCronToken();
}

export function getContentGenerationCronToken() {
  return (
    readString('CONTENT_GENERATION_CRON_TOKEN')
    || getContentSchedulerCronToken()
    || getContentRadarCronToken()
  );
}

export function getSystemHealthTokens() {
  return uniqueStrings([
    readString('SYSTEM_HEALTH_TOKEN'),
    readString('KNOWLEDGE_ACQUISITION_CRON_TOKEN'),
    readString('CONTENT_RADAR_CRON_TOKEN'),
    readString('CONTENT_SCHEDULER_CRON_TOKEN'),
  ]);
}

export function getReportUpgradeCronToken() {
  return readString('REPORT_UPGRADE_CRON_TOKEN');
}

export function getReportMonthlyDigestCronToken() {
  return readString('REPORT_MONTHLY_DIGEST_CRON_TOKEN');
}

export function getEmailRetryCronToken() {
  return readString('EMAIL_RETRY_CRON_TOKEN') || getReportUpgradeCronToken();
}

export function getUserLifecycleEmailCronToken() {
  return readString('USER_LIFECYCLE_EMAIL_CRON_TOKEN') || getEmailRetryCronToken() || getReportUpgradeCronToken();
}

export function getAutonomousGrowthCronToken() {
  return (
    readString('AUTONOMOUS_GROWTH_CRON_TOKEN')
    || getContentSchedulerCronToken()
    || getKnowledgeCronToken()
    || getReportUpgradeCronToken()
  );
}

export function getAutonomousGrowthIntervalMinutes() {
  return readNumber('AUTONOMOUS_GROWTH_INTERVAL_MINUTES', 5, 5);
}

export function isAutonomousGrowthMonthlyDigestEnabled() {
  return readBooleanFlag('AUTONOMOUS_GROWTH_ENABLE_MONTHLY_DIGEST', true);
}

export function isAutonomousGrowthEmailRetryEnabled() {
  return readBooleanFlag('AUTONOMOUS_GROWTH_ENABLE_EMAIL_RETRY', true);
}

export function isAutonomousGrowthUserLifecycleEmailEnabled() {
  return readBooleanFlag('AUTONOMOUS_GROWTH_ENABLE_USER_LIFECYCLE_EMAIL', true);
}

export function isOpenAgentRuntimeEnabled() {
  return readBooleanFlag('OPEN_AGENT_RUNTIME_ENABLED', false);
}

export function getOpenAgentRuntimeModel() {
  return readString('OPEN_AGENT_RUNTIME_MODEL', getDefaultModel());
}

export function getOpenAgentRuntimeMaxRetries() {
  return readNumber('OPEN_AGENT_RUNTIME_MAX_RETRIES', 2, 0);
}

export function getOpenAgentRuntimeRetryDelayMs() {
  return readNumber('OPEN_AGENT_RUNTIME_RETRY_DELAY_MS', 1500, 0);
}

export function getContentRadarSourcesRaw() {
  return readString('CONTENT_RADAR_SOURCES');
}

export function isContentRadarAutoGenerateEnabled() {
  return readString('CONTENT_RADAR_AUTO_GENERATE') === '1';
}

export function isContentRadarAutoPublishEnabled() {
  return readString('CONTENT_RADAR_AUTO_PUBLISH') === '1';
}

export function getModelFallbackChainEnv() {
  return readString('MODEL_FALLBACK_CHAIN', DEFAULT_LLM_FALLBACK_CHAIN);
}

export function getReportModelFallbackChainEnv() {
  return readString('REPORT_MODEL_FALLBACK_CHAIN', getModelFallbackChainEnv());
}

export function getReportNarrativeModelFallbackChainEnv() {
  return readString('REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN', getModelFallbackChainEnv());
}

export function getKnowledgeSynthesisAllowedTypesEnv() {
  return readString('KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES');
}

export function getKnowledgeSynthesisPublishBatchSize() {
  return readNumber('KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE', 4, 1);
}

export function isKnowledgeSynthesisAutoPublishEnabled() {
  return readString('KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH') === '1';
}

export function getKnowledgeAcquisitionFocusDomainsRaw() {
  return readString('KNOWLEDGE_ACQUISITION_FOCUS_DOMAINS');
}

export function isKnowledgeAcquisitionRefreshRadarEnabled() {
  return readBooleanFlag('KNOWLEDGE_ACQUISITION_REFRESH_RADAR');
}

export function getKnowledgeAcquisitionRadarLimitPerSource() {
  return readNumber('KNOWLEDGE_ACQUISITION_RADAR_LIMIT_PER_SOURCE', 8, 1);
}

export function getKnowledgeAcquisitionCoreLimit() {
  return readNumber('KNOWLEDGE_ACQUISITION_CORE_LIMIT', 18, 1);
}

export function getKnowledgeAcquisitionMaxDomainsPerRun() {
  return readNumber('KNOWLEDGE_ACQUISITION_MAX_DOMAINS_PER_RUN', 3, 1);
}

export function getKnowledgeAcquisitionSignalMinScore() {
  return readNumber('KNOWLEDGE_ACQUISITION_SIGNAL_MIN_SCORE', 18, 0);
}

export function getKnowledgeAcquisitionSignalPromotionLimit() {
  return readNumber('KNOWLEDGE_ACQUISITION_SIGNAL_PROMOTION_LIMIT', 10, 1);
}

export function getContentGenerationModel() {
  return readString('CONTENT_GENERATION_MODEL', getDefaultModel());
}

export function getVisualAssetDefaultModel() {
  return readString('VISUAL_ASSET_DEFAULT_MODEL', 'gpt-image-2');
}

export function getVisualAssetCoreModel() {
  return readString('VISUAL_ASSET_CORE_MODEL', 'gpt-image-2-pro');
}

export function getVisualAssetNarrativeModel() {
  return readString('VISUAL_ASSET_NARRATIVE_MODEL', getContentGenerationModel());
}

export function getVisualAssetConcurrencyLimit() {
  return readNumber('VISUAL_ASSET_CONCURRENCY_LIMIT', 6, 1);
}

export function getVisualAssetNarrativeConcurrencyLimit() {
  return readNumber('VISUAL_ASSET_NARRATIVE_CONCURRENCY_LIMIT', 4, 1);
}

export function getVisualAssetGenerationTimeoutMs() {
  return readNumber('VISUAL_ASSET_GENERATION_TIMEOUT_MS', 1000 * 60 * 3, 30_000);
}

export function getVisualAssetRunStatusLimit() {
  return readNumber('VISUAL_ASSET_RUN_STATUS_LIMIT', 500, 1);
}

export function getVisualAssetWorkflowSnapshotItemLimit() {
  return readNumber('VISUAL_ASSET_WORKFLOW_SNAPSHOT_ITEM_LIMIT', 80, 0);
}

export function isVisualAssetWorkflowSnapshotIncludeItemsEnabled() {
  return readBooleanFlag('VISUAL_ASSET_WORKFLOW_SNAPSHOT_INCLUDE_ITEMS', true);
}

export function getContentGenerationModelFallbackChainRaw() {
  return readString('CONTENT_GENERATION_MODEL_FALLBACK_CHAIN', getModelFallbackChainEnv());
}

export function getContentGenerationMaxTokens() {
  return readNumber('CONTENT_GENERATION_MAX_TOKENS', 2200, 1200);
}

export function isContentGenerationSocraticEnabled() {
  return readBooleanFlag('CONTENT_GENERATION_SOCRATIC_ENABLED', true);
}

export function isContentGenerationSegmentedEnabled() {
  return readBooleanFlag('CONTENT_GENERATION_SEGMENTED_ENABLED', true);
}

export function getContentGenerationTimeoutMs() {
  return readNumber('CONTENT_GENERATION_TIMEOUT_MS', 32_000, 18_000);
}

export function getChatLlmTimeoutMs() {
  return readNumber('CHAT_LLM_TIMEOUT_MS', 240_000, 240_000);
}

export function getContentGenerationJobMaxAttempts() {
  return readNumber('CONTENT_GENERATION_JOB_MAX_ATTEMPTS', 3, 1);
}

export function getContentGenerationJobRetryDelayMs() {
  return readNumber('CONTENT_GENERATION_JOB_RETRY_DELAY_MS', 1000 * 60 * 5, 60_000);
}

export function getContentGenerationJobStaleLockMinutes() {
  return readNumber('CONTENT_GENERATION_JOB_STALE_LOCK_MINUTES', 40, 10);
}

export function getContentGenerationJobBatchSize() {
  return readNumber('CONTENT_GENERATION_JOB_BATCH_SIZE', 24, 1);
}

export function getContentSchedulerTimezoneOffsetMinutes() {
  return readNumber('CONTENT_SCHEDULER_TIMEZONE_OFFSET_MINUTES', 480, 0);
}

export function getContentSchedulerPublishHoursRaw() {
  return readString('CONTENT_SCHEDULER_PUBLISH_HOURS', '10,15,20');
}

export function getContentSchedulerDailyPublishLimit() {
  return readNumber('CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT', 200, 1);
}

export function getContentSchedulerMinPublishGapMinutes() {
  return readNumber('CONTENT_SCHEDULER_MIN_PUBLISH_GAP_MINUTES', 180, 30);
}

export function getContentSchedulerDraftReserveTarget() {
  return readNumber('CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET', 240, 3);
}

export function getContentSchedulerDraftBatchSize() {
  return readNumber('CONTENT_SCHEDULER_DRAFT_BATCH_SIZE', 24, 1);
}

export function getContentSchedulerGenerateCooldownMinutes() {
  return readNumber('CONTENT_SCHEDULER_GENERATE_COOLDOWN_MINUTES', 240, 30);
}

export function getContentSchedulerRadarRefreshMaxAgeHours() {
  return readNumber('CONTENT_SCHEDULER_RADAR_REFRESH_MAX_AGE_HOURS', 4, 1);
}

export function getContentSchedulerAdaptiveTypeWeight() {
  return readNumber('CONTENT_SCHEDULER_ADAPTIVE_TYPE_WEIGHT', 10, 0);
}

export function getContentSchedulerAdaptiveRadarSourceWeight() {
  return readNumber('CONTENT_SCHEDULER_ADAPTIVE_RADAR_SOURCE_WEIGHT', 14, 0);
}

export function getContentSchedulerAdaptiveFreshnessWeight() {
  return readNumber('CONTENT_SCHEDULER_ADAPTIVE_FRESHNESS_WEIGHT', 8, 0);
}

export function getReportUpgradeMaxAttempts() {
  return readNumber('REPORT_UPGRADE_MAX_ATTEMPTS', 6, 2);
}

export function getReportUpgradeInitialDelayMs() {
  return readNumber('REPORT_UPGRADE_INITIAL_DELAY_MS', 45_000, 15_000);
}

export function getReportUpgradeRetryDelayMs() {
  return readNumber('REPORT_UPGRADE_RETRY_DELAY_MS', 1000 * 60 * 10, 30_000);
}

export function getReportUpgradeBatchSize() {
  return readNumber('REPORT_UPGRADE_BATCH_SIZE', 2, 1);
}

export function getReportUpgradeProviderDeferMs() {
  return readNumber('REPORT_UPGRADE_PROVIDER_DEFER_MS', 1000 * 60 * 20, 10 * 60 * 1000);
}

export function getReportMonthlyDigestBatchSize() {
  return readNumber('REPORT_MONTHLY_DIGEST_BATCH_SIZE', 20, 1);
}

export function getReportMonthlyDigestTimezoneOffsetMinutes() {
  return readNumber('REPORT_MONTHLY_DIGEST_TIMEZONE_OFFSET_MINUTES', 480);
}

export function getEmailRetryMaxAttempts() {
  return readNumber('EMAIL_RETRY_MAX_ATTEMPTS', 4, 2);
}

export function getEmailRetryBaseDelayMs() {
  return readNumber('EMAIL_RETRY_BASE_DELAY_MS', 1000 * 60 * 5, 60_000);
}

export function getEmailRetryBatchSize() {
  return readNumber('EMAIL_RETRY_BATCH_SIZE', 5, 1);
}

export function getUserLifecycleEmailBatchSize() {
  return readNumber('USER_LIFECYCLE_EMAIL_BATCH_SIZE', 25, 1);
}

export function isProductionEnvironment() {
  return readString('NODE_ENV') === 'production';
}

export function shouldShowAuthPreviewCode() {
  return !isProductionEnvironment() || readBooleanFlag('AUTH_SHOW_CODE');
}

export function getAdminEmails() {
  return uniqueStrings(readString('ADMIN_EMAILS').split(',').map((item) => item.toLowerCase()));
}

export function getPremiumServiceAlertEmails() {
  return uniqueStrings([
    ...readString('PREMIUM_SERVICE_ALERT_EMAILS').split(',').map((item) => item.toLowerCase()),
    ...getAdminEmails(),
    getMailFromAddress().toLowerCase(),
  ]);
}

export function isMailSmtpAuthDisabled() {
  return readBooleanFlag('MAIL_SMTP_DISABLE_AUTH');
}

export function getMailFromAddress() {
  return readString('MAIL_FROM');
}

export function getMailPassword() {
  return readString('MAIL_AUTH_PASSWORD') || readString('MAIL_PASSWORD');
}

export function getMailAuthUser() {
  return readString('MAIL_AUTH_USER') || getMailFromAddress();
}

export function getMailSmtpHost() {
  return readString('MAIL_SMTP_HOST');
}

export function getMailSmtpHostIp() {
  return readString('MAIL_SMTP_HOST_IP');
}

export function getMailAppName() {
  return readString('MAIL_FROM_NAME') || readString('EMAIL_APP_NAME') || '人生K线';
}

export function getAppBaseUrl() {
  return readString('NEXT_PUBLIC_APP_URL', 'https://www.life-kline.com');
}

export function getKnowledgeSynthesisPublishThreshold() {
  return readNumber('KNOWLEDGE_SYNTHESIS_PUBLISH_THRESHOLD', 78);
}

export function getKnowledgeAcquisitionIntervalMs() {
  return readNumber('KNOWLEDGE_ACQUISITION_INTERVAL_MS', 1000 * 60 * 30, 300_000);
}

export function isAgenticPipelineEnabled() {
  return readString('ENABLE_AGENTIC_PIPELINE', '1') !== '0';
}

export function getAgentParallelConcurrency() {
  return readNumber('AGENT_PARALLEL_CONCURRENCY', 2, 1);
}

export function getReportUpgradeLockMinutes() {
  return readNumber('REPORT_UPGRADE_LOCK_MINUTES', 20, 5);
}

export function getGa4ApiSecret() {
  return readString('GA4_API_SECRET');
}

export function getGoogleAnalyticsMeasurementProtocolEndpoint() {
  return readString('GA4_MEASUREMENT_PROTOCOL_REGION').toLowerCase() === 'eu'
    ? 'https://region1.google-analytics.com/mp/collect'
    : 'https://www.google-analytics.com/mp/collect';
}
