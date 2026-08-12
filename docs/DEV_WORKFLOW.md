# 本地开发与线上部署工作流

> **权威全文：[Claude.md](../Claude.md)**（核心开发工具文件）  
> 本文件为扩展说明；Cursor 常驻摘要：`.cursor/rules/local-production-workflow.mdc`

## 两个环境，各自职责

| | 本地 `/Users/lu/dev/linekline` | 线上 `167.160.188.70:/home/life-kline-next` |
|---|---|---|
| **角色** | 开发沙箱：写 UI、改组件、跑 build 预检 | **唯一运行真相**：用户访问、SQLite、PM2、Redis |
| **数据** | `lib/database.ts` 等 stub，种子内容 | 完整 SQLite（7k+ 行 schema + 补丁） |
| **路由** | ~33 个门户页（子集） | 59+ 页（论坛、admin、world-yi 子站等） |
| **样式** | Tailwind v4 依赖，但 `globals.css` 用 **v3 语法** 以兼容线上 build | Tailwind **v3** + `postcss.config.js` |
| **脚本** | `dev` / `build` / `lint` | `deploy` / `ops:post-deploy-smoke` / 内容管线 80+ |

**原则：本地 build 通过 ≠ 线上已更新。必须显式部署。**

引擎怎么接、一共哪些、五行键约定：**[docs/SYSTEM_ENGINES.md](./SYSTEM_ENGINES.md)**（目录源：`lib/system-engines.ts`）。

---

## 开发模式

### 模式 A：UI 开发（默认）

适合改页面、组件、设计系统（`AppPage`、`FocusHero`、`fb-card` 等）。

```bash
npm run dev          # http://localhost:3000
npm run build        # 部署前必跑
```

- 保持本地 `lib/database.ts` stub，不拉完整 SQLite 逻辑
- 知识/案例列表走 `content-seeds` 或 stub `content-store`
- **不要** bulk 同步 `lib/` 到线上

### 模式 B：业务逻辑开发（parity）

适合改报告引擎、论坛、工具运行、邮件。

```bash
export SSHPASS='...'
bash scripts/sync-from-production.sh    # 拉核心 lib + 配置
npm install
npm run build
```

- 从线上拉 `tools.ts`、`content-store.ts`、`email.ts` 等
- `lib/database.ts` **仍保持本地 stub**（脚本默认不覆盖）
- 复杂逻辑改完后，用**增量文件**部署，不要整目录 rsync

### 模式 C：只读对照

```bash
SYNC_SCOPE=full bash scripts/sync-from-production.sh
```

会备份本地 `app/`、`components/`、`lib/` 到 `_local_backup/`，再拉线上全量。**慎用**，会覆盖未提交的 UI 改动。

---

## 部署到线上

### 标准部署（设计系统 / 门户改动）

```bash
export SSHPASS='...'
bash scripts/deploy-design-system-v1.sh
```

脚本自动：

1. 本地 `npm run build` 预检
2. **恢复线上 `lib/`（git）**，保留 `database.ts` 补丁
3. 同步 `app/`、`components/`
4. 白名单同步新 `lib/` 模块（`design-system.ts`、`content-article-view.ts` 等）
5. **恢复** `next.config.js` / `postcss.config.js`（不覆盖线上构建配置）
6. 远程 `npm run deploy` + 冒烟摘要

### 增量部署（本地有 git 时）

```bash
bash scripts/deploy-changed.sh
```

只同步 `git diff` 中的 `app/` / `components/` / `lib/` 文件，跳过受保护文件。

---

## 禁止同步清单

以下文件**永远不要**从本地覆盖到线上：

| 文件 | 原因 |
|------|------|
| `lib/database.ts` | 线上 SQLite 完整实现 + 运行时补丁 |
| `lib/tools.ts` | 1400+ 行工具引擎 |
| `lib/content-store.ts` | 1400+ 行 CMS + DB |
| `lib/email.ts` | 邮件发送与重试 |
| `lib/user-utils.ts` | 用户/访客 ID |
| `next.config.js` | 线上 buildId、HSTS、超时配置 |
| `postcss.config.mjs` | 本地 v4 插件，线上用 v3 |
| `package.json` | 线上有完整 deploy/ops 脚本 |

`globals.css` 可以同步，但必须使用 **v3 语法**：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

禁止使用 `@import "tailwindcss"`（Tailwind v4，线上 build 会失败）。

---

## 部署后验收

```bash
# 在服务器
cd /home/life-kline-next
npm run ops:post-deploy-smoke

# 浏览器（canonical 域名）
https://www.life-kline.com/analyze
https://www.life-kline.com/knowledge        # 应显示全量数量（如 285 篇）
https://www.life-kline.com/result/<真实id>  # 应含「先看核心结论」
```

冒烟失败常见项：

| 失败 | 处理 |
|------|------|
| `Can't resolve 'tailwindcss'` | 检查 `globals.css` 语法 + 删除 `postcss.config.mjs` |
| `missing snippets: 先看核心结论` | 报告页 Hero / cockpit 需含该文案（SSR 可见）；若 `www` 有而 apex 没有，是 CDN/双域名缓存不同步 |
| import error from `@/lib/tools` | 误覆盖了 `lib/`，在服务器 `git checkout HEAD -- lib/` |

冒烟与验收均以 **`https://www.life-kline.com`** 为准（`OPS_PUBLIC_ORIGIN`）。apex `life-kline.com` 可能跳转，不作为主验收入口。

---

## 内容层兼容

本地种子（`content-seeds.ts`）与线上 DB（`content-store.ts`）字段不同：

| 本地种子 | 线上 DB |
|----------|---------|
| `summary` | `excerpt` |
| `readMinutes` | `readTime` |
| `sections: [heading, body][]` | `sections: { title, paragraphs[] }[]` |

统一用 `lib/content-article-view.ts` 做适配，页面不要直接读 `article.summary`。

---

## 推荐日常节奏

```
1. sync-from-production.sh（每周或改 lib 前）
2. 本地 dev + build
3. deploy-design-system-v1.sh
4. ops:post-deploy-smoke
5. 浏览器 spot-check
```

线上改动应在服务器 `git commit`，再定期拉回本地，避免双轨漂移。