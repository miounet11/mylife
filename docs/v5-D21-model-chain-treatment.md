# v5-D21 — LLM 模型链路按 baseline 数据治理

**时间**：2026-05-17
**触发**：`docs/baseline-2026-05-17.md` 红线
**变更范围**：`.env.local`（未进版本控制，下面是 diff 留档）

## 数据依据（30 天 baseline）

| Model | Attempts | Success% | p50 ms | p95 ms | 处置 |
|---|---:|---:|---:|---:|---|
| gpt-4.1-mini-2025-04-14 | 1340 | **92.84** | **5663** | **8763** | ✅ 提为 primary |
| gpt-5.2 | 10648 | 77.28 | 25638 | 35357 | 兜底（慢但质量高） |
| gpt-5.5 | 3275 | 58.11 | 29574 | 43225 | 兜底 |
| grok-420-fast | 5382 | 30.62 | 14502 | 29001 | ❌ 移除 |
| auto | 2907 | 9.25 | 7202 | 19322 | ❌ 移除（坏调度） |
| gpt-5.4-mini | 1574 | 23.51 | 13124 | 25571 | ❌ 移除 |
| gpt-5.4-mini-my | 671 | 44.26 | 13065 | 34806 | ❌ 移除 |
| claude-opus-4-7-high | 538 | 27.88 | 15981 | 36199 | ❌ 移除 |
| gpt-5.4 | 382 | 42.41 | 9804 | 20557 | ❌ 移除 |
| lingsi1.0 | 189 | **0** | 12002 | 33885 | ❌ 移除 |
| gpt-5.2-codex | 112 | **0** | 495 | 2035 | ❌ 移除 |

## .env.local 改动

```diff
- DEFAULT_MODEL=gpt-5.2
+ DEFAULT_MODEL=gpt-4.1-mini-2025-04-14

- MODEL_FALLBACK_CHAIN=grok-420-fast
- REPORT_MODEL_FALLBACK_CHAIN=grok-420-fast
- REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN=grok-420-fast
+ MODEL_FALLBACK_CHAIN=gpt-5.2,gpt-5.5
+ REPORT_MODEL_FALLBACK_CHAIN=gpt-5.2,gpt-5.5
+ REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN=gpt-5.2,gpt-5.5

- CONTENT_GENERATION_MODEL=gpt-5.2
- CONTENT_GENERATION_MODEL_FALLBACK_CHAIN=grok-420-fast,auto
+ CONTENT_GENERATION_MODEL=gpt-4.1-mini-2025-04-14
+ CONTENT_GENERATION_MODEL_FALLBACK_CHAIN=gpt-5.2,gpt-5.5

- OPEN_AGENT_RUNTIME_MODEL=gpt-5.2
+ OPEN_AGENT_RUNTIME_MODEL=gpt-4.1-mini-2025-04-14
```

`VISUAL_ASSET_NARRATIVE_MODEL=grok-420-fast` 未动（图像生成是独立 surface，不在文本 baseline 范围内）。

## 预期影响

- LLM 总体成功率 52.82% → 估计 85%+（grok/auto/0% 三家被移除，占 21% 流量）
- Chat send 成功率 35% → 估计 85%+（chat 用默认链路）
- 报告生成时延 p50 应从 ~26s 降到 ~6s（primary 命中率涨）
- 模型熔断次数应大幅下降
- 内容生成、agent runtime 同步受益

## 验证

- `pm2 reload life-kline-next --update-env` 已执行
- `curl /` `/chat` HTTP 200
- `POST /api/chat` 实际跑通：`success=true, llmUsed=true`，返回"模型链路正常，随时待命。"
- **2 小时后回跑 `npm run system:baseline` 对照新红线**

## 后续动作

1. T+2h 重跑 baseline，确认 LLM 成功率回升、chat send 成功率回升
2. 同步把 `.env.example` 的注释指向新链路（让新部署默认走对）
3. premium_request=0 的链路独立排查（埋点 vs 真无人下单）
4. result_cta meta cta 字段标准化
