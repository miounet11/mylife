# 大模型 (LLM) 接入指南

为了让“人生K线”的命理分析具备真正的“大师级”动态解析能力，我们已经为您接入了 LLM 生成流程，并读取了您历史版本中配置的默认模型参数。

## 1. 自动读取的 API 配置
系统现在会自动从 `.env.local` 或 `.env` 读取您历史版本的 LLM 配置：
- **API_BASE_URL**: 默认回退为 `https://ttkk.inping.com/v1`
- **OPENAI_API_KEY / API_KEY**: 自动获取您的专属 Key。
- **DEFAULT_MODEL**: 自动获取（默认 `gemini-3-pro-preview-maxthinking`）。

## 2. 数据库已跑通
1. **数据真实保存**：现在用户在 `/analyze` 填写的表单，经过 LLM 深度解析后，会**真实地保存**到 SQLite 数据库中 (`fortunes` 表)。
2. **结果真实读取**：`/result/[id]` 页面不再显示写死的 Mock 数据，而是根据 URL 中的 `id` 从数据库中实时拉取刚刚生成的那份**独一无二**的报告。
