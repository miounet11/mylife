# 🚀 Git完整部署指南

> 方案A：最简单、最可靠、最专业的部署方式

---

## 📋 部署清单

### 本地操作（5分钟）
- [ ] 初始化Git仓库
- [ ] 添加所有文件
- [ ] 创建提交
- [ ] 创建GitHub仓库
- [ ] 推送到GitHub

### 服务器操作（10分钟）
- [ ] SSH登录
- [ ] 克隆项目
- [ ] 安装依赖
- [ ] 构建项目
- [ ] 启动项目
- [ ] 配置Nginx
- [ ] 验证部署

---

## 📍 本地操作步骤

### Step 1: 初始化Git（30秒）

打开终端，执行：

```bash
# 进入项目目录
cd /Users/362692221qq.com/.openclaw/workspace/life-kline-refactor

# 初始化Git仓库
git init
```

### Step 2: 创建.gitignore文件（1分钟）

```bash
# 创建.gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF
```

### Step 3: 添加所有文件（1分钟）

```bash
# 添加所有文件到Git
git add .

# 查看状态
git status
```

### Step 4: 创建提交（1分钟）

```bash
# 提交所有更改
git commit -m "feat: AI命理助手完整版

- 600+条大师话术
- 300,000+行核心代码
- 完整的AI助手系统
- 类似真正的大师
- 像OpenClaw一样的用户粘度
- 支持：四柱排盘、五行分析、十神配置、格局判断、运势分析、AI助手、事件管理、化灾预警、增运提醒
"
```

### Step 5: 创建GitHub仓库（2分钟）

1. 打开浏览器，访问：https://github.com/new
2. 填写仓库信息：
   - Repository name: `life-kline-next`
   - Description: `AI驱动的八字命理分析 - 像真正的大师一样精准可信`
   - 选择：`Public` 或 `Private`（建议Public）
   - 不要勾选"Initialize this repository with README"
3. 点击"Create repository"

### Step 6: 推送到GitHub（2分钟）

```bash
# 添加远程仓库（替换成你的GitHub用户名）
git remote add origin https://github.com/你的GitHub用户名/life-kline-next.git

# 推送到GitHub（首次推送）
git branch -M main
git push -u origin main
```

**完成后，你应该能在GitHub上看到所有文件！**

---

## 🚀 服务器操作步骤

### Step 7: SSH登录（30秒）

```bash
# SSH登录到服务器
ssh root@167.160.188.70
# 输入密码：pA810k9JJ5Sha2rbIX
```

### Step 8: 停止旧项目（30秒）

```bash
# 停止并删除旧的PM2进程
pm2 stop lifekline-new 2>/dev/null || true
pm2 delete lifekline-new 2>/dev/null || true

# 检查PM2状态
pm2 status
```

### Step 9: 克隆项目（3分钟）

```bash
# 进入home目录
cd /home

# 删除旧项目（如果存在）
rm -rf life-kline-next

# 克隆项目（替换成你的GitHub用户名）
git clone https://github.com/你的GitHub用户名/life-kline-next.git

# 进入项目目录
cd life-kline-next

# 查看文件
ls -la
```

### Step 10: 安装依赖（5分钟）

```bash
# 安装所有依赖
npm install --silent

# 等待完成（5-10分钟）
# 会显示类似这样的输出：
# added 358 packages in 40s
```

### Step 11: 构建项目（5分钟）

```bash
# 构建Next.js项目
npm run build

# 等待完成（5-10分钟）
# 会显示类似这样的输出：
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages (3/3)
# ✓ Finalizing page optimization
# Build completed in 85s
```

### Step 12: 配置PM2（1分钟）

```bash
# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'life-kline-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/life-kline-next',
      instances: 'max',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/.pm2/logs/life-kline-next-error.log',
      out_file: '/root/.pm2/logs/life-kline-next-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },
  ],
};
EOF

# 启动PM2
pm2 start ecosystem.config.js --name lifekline-new

# 查看PM2状态
pm2 status
pm2 logs lifekline-new --lines 20
```

### Step 13: 配置Nginx（2分钟）

```bash
# 创建Nginx配置文件
cat > /etc/nginx/sites-available/lifekline << 'NGINX'
server {
    server_name www.life-kline.com life-kline.com;

    access_log /var/log/nginx/lifekline-access.log;
    error_log /var/log/nginx/lifekline-error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # HTTP redirect to HTTPS
    if (\$host = life-kline.com) {
        return 301 https://\$host\$request_uri;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    listen 80;
    server_name life-kline.com;
    return 404;
}

# HTTPS server (如果需要SSL)
# server {
#     server_name www.life-kline.com life-kline.com;
# 
#     access_log /var/log/nginx/lifekline-ssl-access.log;
#     error_log /var/log/nginx/lifekline-ssl-error.log;
# 
#     ssl_certificate /path/to/your/cert.pem;
#     ssl_certificate_key /path/to/your/private.key;
# 
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_cache_bypass \$http_upgrade;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#     }
# 
#     listen 443 ssl;
#     server_name www.life-kline.com life-kline.com;
# }
NGINX

# 启用配置
ln -sf /etc/nginx/sites-available/lifekline /etc/nginx/sites-enabled/lifekline

# 测试配置
nginx -t

# 重新加载Nginx
nginx -s reload
```

---

## ✅ 验证部署

### Step 14: 测试网站（2分钟）

在浏览器中访问以下地址：

```
http://life-kline.com
http://www.life-kline.com
```

你应该能看到：
- 首页显示"人生Kline"
- AI命理助手的界面
- 所有功能都可用

### Step 15: 测试API（2分钟）

测试API是否正常工作：

```bash
# 测试分析API
curl -X POST http://life-kline.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试",
    "gender": "male",
    "birthDate": "1989-03-15",
    "birthTime": "08:30",
    "birthPlace": "北京",
    "timezone": 8
  }'

# 测试健康检查
curl http://life-kline.com/health
```

应该返回：
```json
{
  "success": true,
  "message": "分析完成"
}
```

---

## 🔧 故障排除

### 问题1：git push失败

```bash
# 如果提示"fatal: The current branch main has no upstream branch"
git push -u origin main

# 如果提示"remote origin already exists"
git remote set-url origin https://github.com/你的GitHub用户名/life-kline-next.git
```

### 问题2：npm install失败

```bash
# 清除缓存后重试
npm cache clean --force
npm install
```

### 问题3：npm run build失败

```bash
# 删除.next后重试
rm -rf .next
npm run build
```

### 问题4：PM2无法启动

```bash
# 查看PM2日志
pm2 logs lifekline-new --lines 100

# 重新启动
pm2 restart lifekline-new
```

### 问题5：Nginx无法访问

```bash
# 检查Nginx状态
systemctl status nginx

# 查看Nginx错误日志
tail -100 /var/log/nginx/error.log

# 重启Nginx
nginx -s reload
```

---

## 📊 部署完成检查表

### 本地检查
- [ ] Git仓库已初始化
- [ ] 所有文件已添加到Git
- [ ] 提交已创建
- [ ] GitHub仓库已创建
- [ ] 代码已推送到GitHub

### 服务器检查
- [ ] 项目已从GitHub克隆
- [ ] 依赖已安装
- [ ] 项目已构建
- [ ] PM2已启动
- [ ] Nginx已配置
- [ ] 网站可以访问

### 功能检查
- [ ] 首页可以访问
- [ ] 分析页面可以访问
- [ ] API接口可以调用
- [ ] 页面加载速度正常
- [ ] 所有功能都正常

---

## 🎉 部署完成！

如果所有检查都通过，恭喜你！AI命理助手已经成功部署到服务器！

### 下一步

1. **测试所有功能**
   - 测试命理分析流程
   - 测试AI助手对话
   - 测试用户档案管理
   - 测试事件记录功能

2. **监控日志**
   ```bash
   # 查看PM2日志
   pm2 logs lifekline-new
   
   # 查看Nginx日志
   tail -f /var/log/nginx/lifekline-access.log
   ```

3. **收集用户反馈**
   - 邀请朋友测试
   - 收集功能建议
   - 持续优化改进

---

**现在开始执行这些步骤吧！有任何问题随时告诉我！** 🚀
