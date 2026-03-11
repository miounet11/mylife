# 性能优化说明

## API 超时控制

### 配置

所有涉及 LLM 调用的 API 路由都设置了 30 秒超时：

- `/api/analyze` - 八字分析
- `/api/chat` - AI 聊天
- `/api/enhancements` - 增运建议

### LLM 超时处理

在 `lib/llm.ts` 中实现了三层超时控制：

```typescript
// 1. OpenAI SDK 超时（25秒）
const openai = new OpenAI({
  timeout: 25000,
});

// 2. 请求级别超时（25秒）
const completion = await openai.chat.completions.create({
  // ...
}, {
  timeout: 25000,
});

// 3. Next.js 路由超时（30秒）
export const maxDuration = 30;
```

### 错误处理

当 LLM 调用超时或失败时：

1. 捕获错误并记录日志
2. 返回基础分析结果（不含 LLM 解读）
3. 设置 `llmUsed: false` 标记
4. 前端可以选择重试或使用基础结果

### 测试

运行测试脚本：

```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行测试
node test-api-timeout.js
```

### Next.js 配置

在 `next.config.js` 中优化了构建性能：

```javascript
experimental: {
  workerThreads: false,  // 避免内存问题
  cpus: 1,               // 限制 CPU 使用
  optimizePackageImports: ['lucide-react']
}
```

## 构建优化

### 内存限制

```json
"build": "node --max-old-space-size=4096 node_modules/.bin/next build"
```

### 图标优化

使用 SVG 图标而非 ICO 格式，减少文件大小并提高兼容性：

```typescript
export const metadata: Metadata = {
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}
```

## 监控建议

1. 监控 API 响应时间
2. 跟踪 LLM 调用成功率
3. 记录超时错误频率
4. 分析用户重试行为
