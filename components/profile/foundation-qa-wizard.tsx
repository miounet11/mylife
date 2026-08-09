'use client';

/**
 * 快速问答向导 — 逐步补齐生活参数
 * 填写即自动保存：输入 debounce 写库，无需每次手动点「下一项」才落库。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { fetchJsonWithTimeout } from '@/lib/utils';

type Step = {
  domain: string;
  fieldKey: string;
  label: string;
  question: string;
  chips?: string[];
  placeholder?: string;
};

const STEPS: Step[] = [
  {
    domain: 'goals',
    fieldKey: 'primaryConcern',
    label: '最大困惑',
    question: '这阵子你最想弄清的一件事是什么？',
    placeholder: '如：要不要换城市、是否适合转型',
  },
  {
    domain: 'goals',
    fieldKey: 'twelveMonthGoal',
    label: '12 个月目标',
    question: '未来 12 个月，你最想做成的一件事？',
    placeholder: '如：稳定收入、找到合适伴侣',
  },
  {
    domain: 'career',
    fieldKey: 'industry',
    label: '所在行业',
    question: '你目前所在行业大致是？',
    chips: ['互联网', '金融', '教育', '制造', '自由职业', '体制内', '医疗', '其他'],
  },
  {
    domain: 'career',
    fieldKey: 'role',
    label: '岗位角色',
    question: '岗位角色可以怎么概括？',
    chips: ['管理', '专业岗', '销售', '创业', '在读/待业', '其他'],
  },
  {
    domain: 'relationship',
    fieldKey: 'status',
    label: '关系状态',
    question: '目前的关系状态？',
    chips: ['单身', '恋爱中', '已婚', '其他'],
  },
  {
    domain: 'residence',
    fieldKey: 'currentCity',
    label: '现居城市',
    question: '你现在主要在哪个城市生活或工作？',
    chips: ['北京', '上海', '广州', '深圳', '杭州', '成都', '海外', '其他'],
  },
  {
    domain: 'wealth',
    fieldKey: 'investmentStyle',
    label: '投资风格',
    question: '财务上你更偏哪种风格？',
    chips: ['保守', '均衡', '偏进取', '不便透露'],
  },
  {
    domain: 'health',
    fieldKey: 'focusArea',
    label: '健康关注',
    question: '身体节律上更想先照顾哪一块？（生活层面）',
    chips: ['睡眠', '情绪压力', '运动', '肠胃', '暂无特别'],
  },
];

export function FoundationQaWizard({
  fortuneId,
  onClose,
}: {
  fortuneId: string | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveHint, setAutoSaveHint] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoKeyRef = useRef('');

  const step = STEPS[index];
  const progress = Math.round(((index + (done ? 1 : 0)) / STEPS.length) * 100);
  const answerKey = `${step.domain}.${step.fieldKey}`;

  const savedCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k]).length,
    [answers],
  );

  async function persist(domain: string, fieldKey: string, value: string) {
    const { response, data } = await fetchJsonWithTimeout<{ success: boolean; error?: string }>(
      '/api/profile/foundation/qa',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fortuneId,
          domain,
          fields: { [fieldKey]: value },
        }),
        timeoutMs: 10_000,
        timeoutReason: 'foundation-qa',
      },
    );
    if (!response.ok || !data.success) {
      throw new Error(data.error || '保存失败');
    }
  }

  // Debounced autosave while typing / chip select — no need to tap 下一项 first.
  useEffect(() => {
    if (done) return;
    const v = input.trim();
    if (!v) {
      setAutoSaveHint('');
      return;
    }
    const fingerprint = `${answerKey}:${v}`;
    if (fingerprint === lastAutoKeyRef.current) return;
    if (answers[answerKey] === v) {
      setAutoSaveHint('已保存');
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutoSaveHint('输入将自动保存…');
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          setSaving(true);
          await persist(step.domain, step.fieldKey, v);
          lastAutoKeyRef.current = fingerprint;
          setAnswers((prev) => ({ ...prev, [answerKey]: v }));
          setAutoSaveHint('已自动保存');
          void trackClientEvent({
            eventName: 'foundation_qa_autosaved',
            page: '/profile/foundation',
            meta: { domain: step.domain, fieldKey: step.fieldKey },
          });
        } catch {
          setAutoSaveHint('自动保存失败，可点下一项重试');
        } finally {
          setSaving(false);
        }
      })();
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional step/input-driven autosave
  }, [input, answerKey, done]);

  async function commitCurrent(value: string, skip = false) {
    setError('');
    const v = value.trim();
    if (!skip && !v) {
      setError('请填写或选择一项，也可点跳过');
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setSaving(true);
    try {
      if (!skip && v) {
        // Skip duplicate write if autosave already flushed same value.
        if (answers[answerKey] !== v) {
          await persist(step.domain, step.fieldKey, v);
          setAnswers((prev) => ({ ...prev, [answerKey]: v }));
          lastAutoKeyRef.current = `${answerKey}:${v}`;
        }
        void trackClientEvent({
          eventName: 'foundation_qa_saved',
          page: '/profile/foundation',
          meta: { domain: step.domain, fieldKey: step.fieldKey },
        });
      }
      if (index >= STEPS.length - 1) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setInput('');
        setAutoSaveHint('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-wizard-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[color:var(--hairline)] bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 border-b border-[color:var(--hairline)] bg-white px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 id="qa-wizard-title" className="text-[15px] font-semibold text-[color:var(--ink-1)]">
              快速问答向导
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]"
            >
              关闭
            </button>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
            <div
              className="h-full rounded-full bg-[color:var(--ink-1)] transition-all"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
            {done ? '已完成' : `${index + 1} / ${STEPS.length}`} · 已保存 {savedCount} 项
          </p>
        </div>

        <div className="px-5 py-5">
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-[16px] font-semibold text-[color:var(--ink-1)]">参数已写入底座</p>
              <p className="text-[13px] text-[color:var(--ink-4)]">
                结构报告、对话与工具会优先使用这些固定数值。你可随时在资料设置中修改。
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800"
              >
                回到数据底座
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{step.label}</div>
                <p className="mt-1 text-[16px] font-medium leading-snug text-[color:var(--ink-1)]">
                  {step.question}
                </p>
              </div>

              {step.chips && step.chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setInput(chip);
                        void commitCurrent(chip);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[12px] ${
                        input === chip
                          ? 'border-[color:var(--ink-1)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-1)]'
                          : 'border-[color:var(--hairline)] text-[color:var(--ink-2)] hover:border-[color:var(--ink-4)]'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={step.placeholder || '也可以自己写'}
                className="w-full rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-[14px] text-[color:var(--ink-1)] outline-none focus:border-[color:var(--brand)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void commitCurrent(input);
                  }
                }}
              />

              {(autoSaveHint || error) && (
                <p
                  className={
                    error
                      ? 'text-[12px] text-red-600'
                      : 'text-[11px] text-[color:var(--ink-4)]'
                  }
                  aria-live="polite"
                >
                  {error || autoSaveHint}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void commitCurrent(input, true)}
                  className="flex-1 rounded-lg border border-[color:var(--hairline)] py-2.5 text-[13px] text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)]"
                >
                  跳过
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void commitCurrent(input)}
                  className="flex-[2] rounded-lg bg-[color:var(--brand)] py-2.5 text-[13px] font-medium text-white hover:bg-[color:var(--brand-strong)] disabled:opacity-60"
                >
                  {saving ? '保存中…' : index >= STEPS.length - 1 ? '完成' : '下一项'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
