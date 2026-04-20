import {
  extractOpenAgentContentAnalysisPlan,
  extractOpenAgentOpsTriagePlan,
  extractOpenAgentReportReliabilityPlan,
  isRetryableOpenAgentError,
} from '@/lib/open-agent-runtime';

describe('open agent runtime content analysis parser', () => {
  it('extracts structured content analysis plan from json output', () => {
    const plan = extractOpenAgentContentAnalysisPlan(`{
      "summary": "prioritize weak global lane",
      "laneContracts": [
        {
          "lane": "global",
          "sourceType": "public-growth-global",
          "targetKeys": ["global-a", "global-b"],
          "reason": "global lane is under-covered"
        }
      ],
      "queueOverrides": [
        {
          "key": "global-a",
          "reason": "repair global lane first",
          "priority": "critical"
        }
      ],
      "blockedPatterns": ["numerology predictions today"],
      "policySignals": ["consider lane-specific score relaxation"]
    }`);

    expect(plan.summary).toBe('prioritize weak global lane');
    expect(plan.laneContracts).toEqual([
      {
        lane: 'global',
        sourceType: 'public-growth-global',
        targetKeys: ['global-a', 'global-b'],
        reason: 'global lane is under-covered',
      },
    ]);
    expect(plan.queueOverrides[0]).toEqual({
      key: 'global-a',
      reason: 'repair global lane first',
      priority: 'critical',
    });
    expect(plan.blockedPatterns).toEqual(['numerology predictions today']);
    expect(plan.policySignals).toEqual(['consider lane-specific score relaxation']);
  });

  it('normalizes fenced json and falls back missing sourceType from lane', () => {
    const plan = extractOpenAgentContentAnalysisPlan([
      '```json',
      '{',
      '  "summary": "repair weak lanes",',
      '  "laneContracts": [{"lane":"wave2","targetKeys":["wave2-a"],"reason":"repair"}],',
      '  "queueOverrides": [{"key":"wave2-a","priority":"high"}]',
      '}',
      '```',
    ].join('\n'));

    expect(plan.laneContracts).toEqual([
      {
        lane: 'wave2',
        sourceType: 'public-growth-wave2',
        targetKeys: ['wave2-a'],
        reason: 'repair',
      },
    ]);
    expect(plan.queueOverrides[0]).toEqual({
      key: 'wave2-a',
      reason: 'OpenAgent queue override',
      priority: 'high',
    });
  });

  it('parses tagged fallback format when json is unavailable', () => {
    const plan = extractOpenAgentContentAnalysisPlan([
      'SUMMARY: prioritize weak global lane',
      'LANE_CONTRACT: lane=global | keys=global-a,global-b | reason=repair global lane',
      'QUEUE_OVERRIDE: key=global-a | priority=critical | reason=push to front',
      'BLOCKED_PATTERN: numerology predictions today',
      'POLICY_SIGNAL: test lower score in validation only',
    ].join('\n'));

    expect(plan.summary).toBe('prioritize weak global lane');
    expect(plan.laneContracts[0]).toEqual({
      lane: 'global',
      sourceType: 'public-growth-global',
      targetKeys: ['global-a', 'global-b'],
      reason: 'repair global lane',
    });
    expect(plan.queueOverrides[0]).toEqual({
      key: 'global-a',
      priority: 'critical',
      reason: 'push to front',
    });
    expect(plan.blockedPatterns).toEqual(['numerology predictions today']);
    expect(plan.policySignals).toEqual(['test lower score in validation only']);
  });
});

describe('open agent runtime ops triage parser', () => {
  it('extracts structured ops triage plan from json output', () => {
    const plan = extractOpenAgentOpsTriagePlan(`{
      "summary": "publish gate is tighter than recent runtime evidence suggests",
      "alerts": [
        {
          "severity": "warning",
          "title": "ready candidates remain low",
          "detail": "decision ledger shows repeated holds with no ready candidates",
          "source": "decision-ledger"
        }
      ],
      "recommendedActions": [
        {
          "kind": "run_validation",
          "title": "run validation after the next policy overlay refresh",
          "reason": "confirm whether weaker lanes recover without increasing publish risk",
          "autoExecutable": true
        }
      ],
      "policyDiffs": [
        {
          "path": "publishGate.minScore",
          "before": "220",
          "after": "210",
          "reason": "latest content analysis lowered the gate to restore lane throughput"
        }
      ]
    }`);

    expect(plan.summary).toBe('publish gate is tighter than recent runtime evidence suggests');
    expect(plan.alerts).toEqual([
      {
        severity: 'warning',
        title: 'ready candidates remain low',
        detail: 'decision ledger shows repeated holds with no ready candidates',
        source: 'decision-ledger',
      },
    ]);
    expect(plan.recommendedActions).toEqual([
      {
        kind: 'run_validation',
        title: 'run validation after the next policy overlay refresh',
        reason: 'confirm whether weaker lanes recover without increasing publish risk',
        autoExecutable: true,
      },
    ]);
    expect(plan.policyDiffs).toEqual([
      {
        path: 'publishGate.minScore',
        before: '220',
        after: '210',
        reason: 'latest content analysis lowered the gate to restore lane throughput',
      },
    ]);
  });

  it('parses tagged fallback format when triage json is unavailable', () => {
    const plan = extractOpenAgentOpsTriagePlan([
      'SUMMARY: lane reserve recovered but publish readiness is still weak',
      'ALERT: severity=critical | title=publish queue stalled | detail=ready candidates stayed at zero across recent runs | source=cycle-ledger',
      'ACTION: kind=focus_lane | title=front-load diaspora lane repair | reason=queue evidence shows this lane remains underfilled | autoExecutable=false',
      'POLICY_DIFF: path=queueWeights.perLaneQuota | before=2 | after=3 | reason=effective policy is reserving more queue capacity per weak lane',
    ].join('\n'));

    expect(plan.summary).toBe('lane reserve recovered but publish readiness is still weak');
    expect(plan.alerts).toEqual([
      {
        severity: 'critical',
        title: 'publish queue stalled',
        detail: 'ready candidates stayed at zero across recent runs',
        source: 'cycle-ledger',
      },
    ]);
    expect(plan.recommendedActions).toEqual([
      {
        kind: 'focus_lane',
        title: 'front-load diaspora lane repair',
        reason: 'queue evidence shows this lane remains underfilled',
        autoExecutable: false,
      },
    ]);
    expect(plan.policyDiffs).toEqual([
      {
        path: 'queueWeights.perLaneQuota',
        before: '2',
        after: '3',
        reason: 'effective policy is reserving more queue capacity per weak lane',
      },
    ]);
  });
});

describe('open agent runtime report reliability parser', () => {
  it('extracts structured report reliability plan from json output', () => {
    const plan = extractOpenAgentReportReliabilityPlan(`{
      "summary": "recent real reports show quality concentration in viewed basic-tier samples",
      "alerts": [
        {
          "severity": "warning",
          "title": "basic viewed reports remain in the real-user pool",
          "detail": "several recently viewed real reports are still only delivered at the basic tier",
          "source": "data/runtime/report-retro.snapshot.json"
        }
      ],
      "priorityReports": [
        {
          "reportId": "report_123",
          "name": "张三",
          "action": "upgrade",
          "reason": "this report was viewed and still sits below the target quality tier",
          "qualityScore": 82,
          "deliveryTier": "basic"
        }
      ],
      "recommendedActions": [
        {
          "kind": "upgrade_reports",
          "title": "upgrade the top viewed basic-tier reports first",
          "reason": "these reports are the highest-signal real-user sample set",
          "autoExecutable": true
        }
      ]
    }`);

    expect(plan.summary).toBe('recent real reports show quality concentration in viewed basic-tier samples');
    expect(plan.alerts).toEqual([
      {
        severity: 'warning',
        title: 'basic viewed reports remain in the real-user pool',
        detail: 'several recently viewed real reports are still only delivered at the basic tier',
        source: 'data/runtime/report-retro.snapshot.json',
      },
    ]);
    expect(plan.priorityReports).toEqual([
      {
        reportId: 'report_123',
        name: '张三',
        action: 'upgrade',
        reason: 'this report was viewed and still sits below the target quality tier',
        qualityScore: 82,
        deliveryTier: 'basic',
      },
    ]);
    expect(plan.recommendedActions).toEqual([
      {
        kind: 'upgrade_reports',
        title: 'upgrade the top viewed basic-tier reports first',
        reason: 'these reports are the highest-signal real-user sample set',
        autoExecutable: true,
      },
    ]);
  });

  it('parses tagged fallback format when report reliability json is unavailable', () => {
    const plan = extractOpenAgentReportReliabilityPlan([
      'SUMMARY: verify failures are concentrated in a small set of viewed real reports',
      'ALERT: severity=critical | title=verify fail cluster detected | detail=two viewed real reports still carry FAIL verdicts after feedback sync | source=report-retro',
      'REPORT: id=report_456 | name=李四 | action=recompute | reason=the report has a FAIL verdict and repeated drift feedback | score=61 | deliveryTier=basic',
      'ACTION: kind=recompute | title=recompute fail verdict reports after feedback refresh | reason=these reports are the clearest reliability risk in the current real-user pool | autoExecutable=false',
    ].join('\n'));

    expect(plan.summary).toBe('verify failures are concentrated in a small set of viewed real reports');
    expect(plan.alerts).toEqual([
      {
        severity: 'critical',
        title: 'verify fail cluster detected',
        detail: 'two viewed real reports still carry FAIL verdicts after feedback sync',
        source: 'report-retro',
      },
    ]);
    expect(plan.priorityReports).toEqual([
      {
        reportId: 'report_456',
        name: '李四',
        action: 'recompute',
        reason: 'the report has a FAIL verdict and repeated drift feedback',
        qualityScore: 61,
        deliveryTier: 'basic',
      },
    ]);
    expect(plan.recommendedActions).toEqual([
      {
        kind: 'recompute',
        title: 'recompute fail verdict reports after feedback refresh',
        reason: 'these reports are the clearest reliability risk in the current real-user pool',
        autoExecutable: false,
      },
    ]);
  });
});

describe('open agent runtime retry classification', () => {
  it('treats transient transport and rate limit failures as retryable', () => {
    expect(isRetryableOpenAgentError(new Error('fetch failed'))).toBe(true);
    expect(isRetryableOpenAgentError(new Error('socket hang up from upstream'))).toBe(true);
    expect(isRetryableOpenAgentError({
      status: 429,
      message: 'rate limit exceeded',
    })).toBe(true);
    expect(isRetryableOpenAgentError({
      status: 503,
      message: 'service unavailable',
    })).toBe(true);
  });

  it('treats configuration and parsing failures as non-retryable', () => {
    expect(isRetryableOpenAgentError(new Error('OPEN_AGENT_API_KEY_MISSING'))).toBe(false);
    expect(isRetryableOpenAgentError(new Error('open_agent_report_reliability_parse_failed'))).toBe(false);
    expect(isRetryableOpenAgentError({
      status: 400,
      message: 'invalid request body',
    })).toBe(false);
  });
});
