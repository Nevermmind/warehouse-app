# 🚀 Netlify 部署指南

## 🔐 环境变量配置

在部署到 Netlify 之前，需要在 Netlify 中配置以下环境变量：

### 1. DeepSeek API Key

**变量名**: `DEEPSEEK_API_KEY`  
**获取方式**: 
1. 访问 https://platform.deepseek.com/api_keys
2. 登录后创建新的 API Key
3. 复制 API Key

**值**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Resend API Key（用于邮件提醒）

**变量名**: `RESEND_API_KEY`  
**获取方式**:
1. 访问 https://resend.com/api-keys
2. 创建新的 API Key
3. 复制 API Key

## 📋 配置步骤

### 方法 1：通过 Netlify Dashboard（推荐）

1. 登录 Netlify Dashboard: https://app.netlify.com/
2. 选择你的项目
3. 进入 **Site settings** → **Environment variables**
4. 点击 **Add a variable** 添加环境变量：
   - Key: `DEEPSEEK_API_KEY`
   - Value: 你的 DeepSeek API Key
   - Key: `RESEND_API_KEY`
   - Value: 你的 Resend API Key
5. 点击 **Save**

### 方法 2：通过 Netlify CLI

```bash
# 安装 Netlify CLI（如果没有安装）
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 添加环境变量
netlify env:set DEEPSEEK_API_KEY sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
netlify env:set RESEND_API_KEY re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 方法 3：通过 netlify.toml 文件（不推荐，会暴露密钥）

```toml
[build]
  command = "npm run build"

[functions]
  node_bundler = "esbuild"

# ⚠️ 不要在 netlify.toml 中硬编码密钥！
# 使用环境变量而不是硬编码
```

## 🔒 安全说明

### ✅ 安全的做法

1. **使用 Netlify Functions 代理 API 调用**
   - DeepSeek API Key 存储在服务端环境变量中
   - 前端通过 Netlify Function 调用，不直接暴露 API Key
   - 已实现：`netlify/functions/deepseek.js`

2. **Supabase Anon Key**
   - Supabase 的 `anon` key 设计为可以安全暴露在客户端
   - 通过 Row Level Security (RLS) 保护数据
   - 每个用户只能访问自己的数据

### ❌ 危险的做法

1. **在 JavaScript 代码中硬编码 API Key**
   ```javascript
   // ❌ 错误！任何人都能看到
   const API_KEY = 'sk-xxxxxxxxxxxx'
   ```

2. **在 .env 文件中提交密钥**
   ```bash
   # ❌ 错误！.env 文件会被提交到 Git
   .env
   ```

3. **在 public 目录下存储密钥**
   ```html
   <!-- ❌ 错误！public 目录下的文件会被直接访问 -->
   <script src="/config.js"></script>
   ```

## 📦 本地开发

1. 克隆项目后，复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 文件中填入你的 API Keys

3. 安装依赖并启动：
   ```bash
   npm install
   npm run dev
   ```

## 🚀 部署到 Netlify

### 自动部署（推荐）

1. 将代码推送到 GitHub
2. 在 Netlify 中连接 GitHub 仓库
3. 配置构建命令和发布目录：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 添加环境变量（见上面的配置步骤）
5. 保存设置，Netlify 会自动部署

### 手动部署

```bash
# 构建项目
npm run build

# 部署到 Netlify
netlify deploy --prod
```

## ✅ 部署后验证

1. 访问部署的网站
2. 打开浏览器开发者工具（F12）
3. 在 Console 中输入：
   ```javascript
   fetch('/.netlify/functions/deepseek', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       messages: [{ role: 'user', content: 'Hello' }]
     })
   }).then(r => r.json()).then(console.log)
   ```
4. 如果返回正常响应，说明 DeepSeek API 配置成功

## 🎯 总结

### DeepSeek API 安全性

| 环境 | API Key 存储位置 | 安全性 |
|------|----------------|--------|
| 开发环境 | `.env` 文件 | ✅ 安全（不提交到 Git） |
| 生产环境 | Netlify 环境变量 | ✅ 安全（通过 Netlify Functions 代理） |
| 前端代码 | JavaScript 硬编码 | ❌ 不安全（已修复） |

### Supabase 安全性

| Key | 暴露在前端 | 安全性 |
|-----|-----------|--------|
| URL | ✅ 是 | ✅ 安全（公开的） |
| Anon Key | ✅ 是 | ✅ 安全（RLS 保护） |
| Service Role Key | ❌ 否 | ✅ 安全（仅服务端） |

现在你的应用已经实现了安全的密钥管理！🎉
