describe('env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('builds cron token fallback chains in the expected order', async () => {
    process.env.CONTENT_RADAR_CRON_TOKEN = 'radar-token';
    process.env.CONTENT_SCHEDULER_CRON_TOKEN = 'scheduler-token';
    process.env.CONTENT_GENERATION_CRON_TOKEN = 'generation-token';
    process.env.REPORT_UPGRADE_CRON_TOKEN = 'upgrade-token';
    process.env.EMAIL_RETRY_CRON_TOKEN = 'email-token';

    const {
      getContentRadarCronToken,
      getContentSchedulerCronToken,
      getContentGenerationCronToken,
      getReportUpgradeCronToken,
      getEmailRetryCronToken,
    } = await import('@/lib/env');

    expect(getContentRadarCronToken()).toBe('radar-token');
    expect(getContentSchedulerCronToken()).toBe('scheduler-token');
    expect(getContentGenerationCronToken()).toBe('generation-token');
    expect(getReportUpgradeCronToken()).toBe('upgrade-token');
    expect(getEmailRetryCronToken()).toBe('email-token');
  });

  it('falls back to upstream cron tokens when specific tokens are missing', async () => {
    process.env.CONTENT_RADAR_CRON_TOKEN = 'radar-token';
    process.env.REPORT_UPGRADE_CRON_TOKEN = 'upgrade-token';
    delete process.env.CONTENT_SCHEDULER_CRON_TOKEN;
    delete process.env.CONTENT_GENERATION_CRON_TOKEN;
    delete process.env.EMAIL_RETRY_CRON_TOKEN;
    delete process.env.AUTONOMOUS_GROWTH_CRON_TOKEN;

    const {
      getAutonomousGrowthCronToken,
      getContentSchedulerCronToken,
      getContentGenerationCronToken,
      getEmailRetryCronToken,
    } = await import('@/lib/env');

    expect(getAutonomousGrowthCronToken()).toBe('radar-token');
    expect(getContentSchedulerCronToken()).toBe('radar-token');
    expect(getContentGenerationCronToken()).toBe('radar-token');
    expect(getEmailRetryCronToken()).toBe('upgrade-token');
  });

  it('reads autonomous runtime flags and open agent settings', async () => {
    process.env.AUTONOMOUS_GROWTH_INTERVAL_MINUTES = '3';
    process.env.AUTONOMOUS_GROWTH_ENABLE_MONTHLY_DIGEST = 'false';
    process.env.AUTONOMOUS_GROWTH_ENABLE_EMAIL_RETRY = 'true';
    process.env.OPEN_AGENT_RUNTIME_ENABLED = '1';
    process.env.OPEN_AGENT_RUNTIME_MODEL = 'gpt-5.4-mini';

    const {
      getAutonomousGrowthIntervalMinutes,
      isAutonomousGrowthMonthlyDigestEnabled,
      isAutonomousGrowthEmailRetryEnabled,
      isOpenAgentRuntimeEnabled,
      getOpenAgentRuntimeModel,
    } = await import('@/lib/env');

    expect(getAutonomousGrowthIntervalMinutes()).toBe(5);
    expect(isAutonomousGrowthMonthlyDigestEnabled()).toBe(false);
    expect(isAutonomousGrowthEmailRetryEnabled()).toBe(true);
    expect(isOpenAgentRuntimeEnabled()).toBe(true);
    expect(getOpenAgentRuntimeModel()).toBe('gpt-5.4-mini');
  });

  it('uses unified Claude primary and fallback chain for model helpers by default', async () => {
    delete process.env.DEFAULT_MODEL;
    delete process.env.OPEN_AGENT_RUNTIME_MODEL;
    delete process.env.MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_MODEL_FALLBACK_CHAIN;
    delete process.env.REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN;
    delete process.env.CONTENT_GENERATION_MODEL;
    delete process.env.CONTENT_GENERATION_MODEL_FALLBACK_CHAIN;
    delete process.env.VISUAL_ASSET_API_BASE_URL;
    delete process.env.VISUAL_ASSET_DEFAULT_MODEL;
    delete process.env.VISUAL_ASSET_CORE_MODEL;
    delete process.env.VISUAL_ASSET_NARRATIVE_MODEL;

    const {
      getDefaultModel,
      getOpenAgentRuntimeModel,
      getModelFallbackChainEnv,
      getReportModelFallbackChainEnv,
      getReportNarrativeModelFallbackChainEnv,
      getContentGenerationModel,
      getContentGenerationModelFallbackChainRaw,
      getVisualAssetApiBaseUrl,
      getVisualAssetDefaultModel,
      getVisualAssetCoreModel,
      getVisualAssetNarrativeModel,
    } = await import('@/lib/env');

    expect(getDefaultModel()).toBe('gpt-5.5');
    expect(getOpenAgentRuntimeModel()).toBe('gpt-5.5');
    expect(getModelFallbackChainEnv()).toBe('gpt-5.4-mini,auto');
    expect(getReportModelFallbackChainEnv()).toBe('gpt-5.4-mini,auto');
    expect(getReportNarrativeModelFallbackChainEnv()).toBe('gpt-5.4-mini,auto');
    expect(getContentGenerationModel()).toBe('gpt-5.5');
    expect(getContentGenerationModelFallbackChainRaw()).toBe('gpt-5.4-mini,auto');
    expect(getVisualAssetApiBaseUrl()).toBe('https://www.gemiai.top/v1');
    expect(getVisualAssetDefaultModel()).toBe('gpt-image-2');
    expect(getVisualAssetCoreModel()).toBe('gpt-image-2-pro');
    expect(getVisualAssetNarrativeModel()).toBe('gpt-5.5');
  });

  it('deduplicates system health tokens and evaluates radar flags', async () => {
    process.env.SYSTEM_HEALTH_TOKEN = 'health-token';
    process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN = 'knowledge-token';
    process.env.CONTENT_RADAR_CRON_TOKEN = 'knowledge-token';
    process.env.CONTENT_SCHEDULER_CRON_TOKEN = 'scheduler-token';
    process.env.CONTENT_RADAR_AUTO_GENERATE = '1';
    process.env.CONTENT_RADAR_AUTO_PUBLISH = '0';

    const {
      getSystemHealthTokens,
      isContentRadarAutoGenerateEnabled,
      isContentRadarAutoPublishEnabled,
    } = await import('@/lib/env');

    expect(getSystemHealthTokens()).toEqual(['health-token', 'knowledge-token', 'scheduler-token']);
    expect(isContentRadarAutoGenerateEnabled()).toBe(true);
    expect(isContentRadarAutoPublishEnabled()).toBe(false);
  });

  it('applies numeric defaults and minimum guards for runtime job configs', async () => {
    process.env.CONTENT_GENERATION_MAX_TOKENS = '900';
    process.env.CONTENT_GENERATION_TIMEOUT_MS = '1000';
    process.env.CHAT_LLM_TIMEOUT_MS = '1000';
    process.env.REPORT_UPGRADE_MAX_ATTEMPTS = '1';
    process.env.EMAIL_RETRY_BASE_DELAY_MS = '1000';

    const {
      getContentGenerationMaxTokens,
      getContentGenerationTimeoutMs,
      getChatLlmTimeoutMs,
      getReportUpgradeMaxAttempts,
      getEmailRetryBaseDelayMs,
    } = await import('@/lib/env');

    expect(getContentGenerationMaxTokens()).toBe(1200);
    expect(getContentGenerationTimeoutMs()).toBe(18_000);
    expect(getChatLlmTimeoutMs()).toBe(240_000);
    expect(getReportUpgradeMaxAttempts()).toBe(2);
    expect(getEmailRetryBaseDelayMs()).toBe(60_000);
  });

  it('reads scheduler and knowledge acquisition defaults from env helpers', async () => {
    process.env.KNOWLEDGE_ACQUISITION_REFRESH_RADAR = 'true';
    process.env.KNOWLEDGE_ACQUISITION_FOCUS_DOMAINS = 'ai,statistics';
    process.env.CONTENT_SCHEDULER_PUBLISH_HOURS = '9,14,21';
    process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE = '5';

    const {
      isKnowledgeAcquisitionRefreshRadarEnabled,
      getKnowledgeAcquisitionFocusDomainsRaw,
      getContentSchedulerPublishHoursRaw,
      getContentSchedulerDraftBatchSize,
    } = await import('@/lib/env');

    expect(isKnowledgeAcquisitionRefreshRadarEnabled()).toBe(true);
    expect(getKnowledgeAcquisitionFocusDomainsRaw()).toBe('ai,statistics');
    expect(getContentSchedulerPublishHoursRaw()).toBe('9,14,21');
    expect(getContentSchedulerDraftBatchSize()).toBe(5);
  });

  it('uses high-throughput publishing defaults when env overrides are absent', async () => {
    delete process.env.CONTENT_SCHEDULER_DAILY_PUBLISH_LIMIT;
    delete process.env.CONTENT_SCHEDULER_DRAFT_RESERVE_TARGET;
    delete process.env.CONTENT_SCHEDULER_DRAFT_BATCH_SIZE;
    delete process.env.CONTENT_GENERATION_JOB_BATCH_SIZE;
    delete process.env.AUTONOMOUS_GROWTH_INTERVAL_MINUTES;

    const {
      getContentSchedulerDailyPublishLimit,
      getContentSchedulerDraftReserveTarget,
      getContentSchedulerDraftBatchSize,
      getContentGenerationJobBatchSize,
      getAutonomousGrowthIntervalMinutes,
    } = await import('@/lib/env');

    expect(getContentSchedulerDailyPublishLimit()).toBe(200);
    expect(getContentSchedulerDraftReserveTarget()).toBe(240);
    expect(getContentSchedulerDraftBatchSize()).toBe(24);
    expect(getContentGenerationJobBatchSize()).toBe(24);
    expect(getAutonomousGrowthIntervalMinutes()).toBe(5);
  });

  it('derives auth and contact helpers from environment', async () => {
    process.env = {
      ...process.env,
      NODE_ENV: 'production',
      AUTH_SHOW_CODE: 'false',
      ADMIN_EMAILS: 'admin1@example.com,admin2@example.com',
      PREMIUM_SERVICE_ALERT_EMAILS: 'ops@example.com',
      MAIL_FROM: 'sender@example.com',
    };

    const {
      isProductionEnvironment,
      shouldShowAuthPreviewCode,
      getAdminEmails,
      getPremiumServiceAlertEmails,
    } = await import('@/lib/env');

    expect(isProductionEnvironment()).toBe(true);
    expect(shouldShowAuthPreviewCode()).toBe(false);
    expect(getAdminEmails()).toEqual(['admin1@example.com', 'admin2@example.com']);
    expect(getPremiumServiceAlertEmails()).toEqual([
      'ops@example.com',
      'admin1@example.com',
      'admin2@example.com',
      'sender@example.com',
    ]);
  });

  it('resolves system-level helpers for synthesis, analytics and agent runtime', async () => {
    process.env.KNOWLEDGE_SYNTHESIS_PUBLISH_THRESHOLD = '82';
    process.env.KNOWLEDGE_ACQUISITION_INTERVAL_MS = '10000';
    process.env.ENABLE_AGENTIC_PIPELINE = '0';
    process.env.AGENT_PARALLEL_CONCURRENCY = '4';
    process.env.REPORT_UPGRADE_LOCK_MINUTES = '3';
    process.env.GA4_MEASUREMENT_PROTOCOL_REGION = 'eu';
    process.env.GA4_API_SECRET = 'ga-secret';

    const {
      getKnowledgeSynthesisPublishThreshold,
      getKnowledgeAcquisitionIntervalMs,
      isAgenticPipelineEnabled,
      getAgentParallelConcurrency,
      getReportUpgradeLockMinutes,
      getGoogleAnalyticsMeasurementProtocolEndpoint,
      getGa4ApiSecret,
    } = await import('@/lib/env');

    expect(getKnowledgeSynthesisPublishThreshold()).toBe(82);
    expect(getKnowledgeAcquisitionIntervalMs()).toBe(300000);
    expect(isAgenticPipelineEnabled()).toBe(false);
    expect(getAgentParallelConcurrency()).toBe(4);
    expect(getReportUpgradeLockMinutes()).toBe(5);
    expect(getGoogleAnalyticsMeasurementProtocolEndpoint()).toBe('https://region1.google-analytics.com/mp/collect');
    expect(getGa4ApiSecret()).toBe('ga-secret');
  });
});
