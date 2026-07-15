'use client';

import { useState } from 'react';
import type { ProRiskAlert } from '@/lib/report-pro-view';
import { fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';
import { trackClientEvent } from '@/lib/analytics-client';

type SaveResponse = { success?: boolean; error?: string };

/**
 * 重点避险 + 一键记入事件本
 */
export default function ProRiskAlerts({
  alerts,
  reportId,
  canManage = false,
}: {
  alerts: ProRiskAlert[];
  reportId: string;
  canManage?: boolean;
}) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  const saveAlert = async (alert: ProRiskAlert) => {
    if (!canManage || savingKey) return;
    setSavingKey(alert.key);
    setError('');
    try {
      const date =
        alert.dateKey ||
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`;
      const { response, data } = await fetchJsonWithTimeout<SaveResponse>('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: alert.eventType || 'other',
          title: `避险：${alert.when} · ${alert.title}`,
          date,
          description: `${alert.reason}\n建议：${alert.action}`,
          impact: 'negative',
          reminderEnabled: true,
          reminderAdvanceDays: 7,
          reminderMethod: 'app',
          source: 'pro_risk_alert',
          page: `/result/${reportId}`,
          fortuneAnalysis: {
            source: 'pro_risk_alert',
            reportId,
            suggestionKey: alert.key,
            reason: alert.reason,
            title: alert.title,
          },
          followUpAdvice: {
            shortTerm: alert.action,
            longTerm: '到点后回填真实结果，用于校准后续判断。',
          },
        }),
        timeoutMs: 12_000,
        timeoutReason: 'pro-risk-save-timeout',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '保存失败，请稍后重试');
        return;
      }
      setSavedKeys((c) => [...c, alert.key]);
      void trackClientEvent({
        eventName: 'report_risk_saved_from_pro',
        page: `/result/${reportId}`,
        meta: { reportId, riskKey: alert.key, severity: alert.severity },
      });
    } catch (e) {
      setError(isAbortLikeError(e) ? '保存超时，请重试' : '网络异常，保存失败');
    } finally {
      setSavingKey(null);
    }
  };

  if (!alerts.length) {
    return (
      <section id="pro-risks" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">重点避险</h2>
        <p className="mt-2 text-[13px] text-[color:var(--ink-5)]">
          当前未标出特别高压窗口。仍建议关注人生曲线低谷段，避开忌神方向上的大动作。
        </p>
      </section>
    );
  }

  return (
    <section id="pro-risks" className="scroll-mt-header border-y border-[color:var(--hairline)] py-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">重点避险</h2>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
          什么时候别硬冲；可记到事件本到期提醒
        </p>
      </div>

      <ul className="mt-3 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {alerts.map((a) => {
          const saved = savedKeys.includes(a.key);
          return (
            <li key={a.key} className="py-3.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px]">
                <span className="text-[color:var(--ink-5)]">
                  {a.severity === 'high' ? '高优先' : '需留意'}
                </span>
                <span className="font-medium text-[color:var(--ink-1)]">{a.when}</span>
                <span className="text-[color:var(--ink-3)]">· {a.title}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-2)]">
                <span className="text-[color:var(--ink-3)]">发生了什么：</span>
                {a.reason}
              </p>
              {a.why ? (
                <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-5)]">
                  <span className="text-[color:var(--ink-3)]">为什么要避：</span>
                  {a.why}
                </p>
              ) : null}
              <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--ink-1)]">
                现在怎么做：{a.action}
              </p>
              {a.afterHint ? (
                <p className="mt-1 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
                  窗口过后：{a.afterHint}
                </p>
              ) : null}
              {canManage ? (
                <button
                  type="button"
                  disabled={saved || savingKey === a.key}
                  onClick={() => void saveAlert(a)}
                  className={`mt-2 text-[12px] underline-offset-2 hover:underline disabled:opacity-50 ${
                    saved ? 'text-[color:var(--ink-5)]' : 'text-[color:var(--ink-1)]'
                  }`}
                >
                  {saved ? '已记入事件本' : savingKey === a.key ? '保存中…' : '记到事件本'}
                </button>
              ) : (
                <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
                  登录后可一键保存到事件本并设置提醒。
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-2 text-[12px] text-[color:var(--alert)]">{error}</p> : null}
    </section>
  );
}
