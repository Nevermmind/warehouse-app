# ✅ Netlify 部署检查清单

## 🔐 必需的环境变量（4个）

在 Netlify Dashboard 的 **Site settings** → **Environment variables** 中配置：

### 1. DEEPSEEK_API_KEY
- **用途**: AI 智能分析功能
- **使用位置**: `netlify/functions/deepseek.js`
- **获取方式**: https://platform.deepseek.com/api_keys
- **示例**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. RESEND_API_KEY
- **用途**: 邮件提醒功能
- **使用位置**: `netlify/functions/check-expiry.js`
- **获取方式**: https://resend.com/api-keys
- **示例**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. SUPABASE_SERVICE_ROLE_KEY
- **用途**: 服务端数据库操作（绕过 RLS）
- **使用位置**: 所有 Netlify Functions
- **获取方式**: Supabase Dashboard → Settings → API
- **示例**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. SUPABASE_URL
- **用途**: Supabase 项目地址
- **使用位置**: 前端 + Netlify Functions
- **获取方式**: Supabase Dashboard → Settings → API
- **示例**: `https://xxxxxx.supabase.co`

## 📋 可选的环境变量（2个）

### 5. VITE_SUPABASE_URL（可选）
- **用途**: 前端 Supabase 配置
- **使用位置**: `src/utils/supabase.js`
- **说明**: 不配置则使用代码中的默认值
- **建议**: 与 `SUPABASE_URL` 相同

### 6. VITE_SUPABASE_ANON_KEY（可选）
- **用途**: 前端 Supabase 匿名密钥
- **使用位置**: `src/utils/supabase.js`
- **获取方式**: Supabase Dashboard → Settings → API → anon public
- **说明**: 不配置则使用代码中的默认值

## 🎯 功能测试清单

部署后需要测试的功能：

### ✅ 基础功能
- [ ] 用户注册/登录
- [ ] 添加/编辑/删除物品
- [ ] 分类管理
- [ ] 查看统计

### ✅ 放屁记录功能
- [ ] 快速记录
- [ ] 补录功能
- [ ] 拟声词管理
- [ ] 查看记录列表（翻页）
- [ ] 删除记录

### ✅ AI 功能
- [ ] AI 智能录入（根据文字自动填充）
- [ ] AI 数据分析（7天/30天趋势）

### ✅ 图表功能
- [ ] 数量趋势图（折线图）
- [ ] 拟声词分布图（条形图）
- [ ] 7天/30天切换

### ✅ 邮件功能
- [ ] 测试邮件发送
- [ ] 过期提醒（每天晚7点自动执行）

## 🔒 安全检查

### ✅ 已修复的安全问题
1. ✅ 移除了前端代码中的硬编码 API Key
2. ✅ 所有 DeepSeek API 调用都通过 Netlify Functions
3. ✅ API Key 存储在服务端环境变量中
4. ✅ 前端代码无法访问敏感密钥

### ✅ 当前安全状态
- ❌ 前端代码：无敏感信息
- ✅ Netlify Functions：使用环境变量
- ✅ Supabase：RLS 保护用户数据

## 🚀 部署步骤

### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "Security fixes: use Netlify Functions for API calls"
git push
```

### 2. Netlify 自动部署
- Netlify 会自动检测到 Git 推送
- 自动构建项目
- 自动部署到生产环境

### 3. 配置环境变量
如果还没配置，在 Netlify Dashboard 添加：
1. 进入 **Site settings** → **Environment variables**
2. 添加上面列出的环境变量
3. 保存后触发重新部署

### 4. 验证部署
```bash
# 访问你的网站
https://your-site.netlify.app

# 打开浏览器控制台测试 DeepSeek
fetch('/.netlify/functions/deepseek', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }]
  })
}).then(r => r.json()).then(console.log)
```

## 📊 文件结构

```
warehouse-app/
├── netlify/functions/
│   ├── deepseek.js          ✅ DeepSeek API 代理
│   ├── check-expiry.js      ✅ 过期检查（定时任务）
│   └── test-email.js        ✅ 测试邮件
├── src/
│   ├── components/
│   │   ├── QuickRecordModal.vue    ✅ AI 智能录入
│   │   ├── AIAnalysisModal.vue     ✅ AI 数据分析
│   │   └── QuickAddModal.vue       ✅ AI 智能添加（仓库）
│   └── utils/
│       └── supabase.js            ✅ Supabase 客户端
└── .env.example                    ✅ 环境变量示例
```

## 🎉 总结

**你的 Netlify 部署已经准备好了！**

### 最小配置（4个变量）
- ✅ DEEPSEEK_API_KEY
- ✅ RESEND_API_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_URL

### 所有功能
- ✅ 用户认证
- ✅ 数据 CRUD
- ✅ AI 智能分析
- ✅ 图表展示
- ✅ 邮件提醒

### 安全性
- ✅ API Key 不暴露在前端
- ✅ 通过 Netlify Functions 代理
- ✅ Supabase RLS 保护数据

**现在可以安全地部署到 Netlify 了！** 🚀
