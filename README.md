# 家庭管理系统 (Family Management System)

> **最后更新**: 2026-02-24
> **版本**: v2.3
> **技术栈**: Vue 3 + Vite + Supabase + Netlify

一个综合性的家庭管理 Web 应用，包含仓库管理、放屁记录追踪、上下班通勤时间追踪等功能。

---

## 📋 功能特性

### 1. 📦 仓库管理 (Warehouse Management)
- 物品管理（添加、编辑、删除、搜索）
- 分类管理（自定义分类）
- 过期提醒（自定义提醒天数，默认 5 天）
- 统计卡片（总数、快过期、已过期，可点击筛选）
- 快速添加功能（常用物品一键添加）
- 邮件提醒系统（每天晚 7 点自动检查过期物品）

### 2. 💨 隐藏功能 (Fart Tracker)
- 快速记录（一键记录放屁，自动记录时间）
- 补录功能（批量补录历史记录）
- 声音词管理（自定义"放屁声音"描述词）
- AI 智能分析（DeepSeek API 分析放屁模式）
- 统计图表（每日/每周/每月统计）
- 编辑/删除记录

### 3. ⏰ 上下班时间 (Commute Tracker)
- 上班/下班通勤记录
- 路线管理（上班路线、下班路线分开管理）
- 中小学生寒暑假标记（自动识别寒假 1-3 月、暑假 6-9 月）
- 周报（每周六上午 9 点自动生成）
- 月报（每月 1 日上午 9 点自动生成）
- 天气记录、备注功能

### 4. 🗂️ 类别管理 (Category Management)
- 创建/编辑/删除物品分类
- 分类图标选择
- 分类别统计

### 5. 📋 家庭规定 (Family Rules)
- 家庭规定展示（从数据库加载）
- 支持富文本格式

---

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 (Composition API, `<script setup>`)
- **构建工具**: Vite
- **路由**: Vue Router 4
- **图表**: Chart.js
- **日期处理**: date-fns
- **HTTP 客户端**: Supabase JS Client

### 后端
- **数据库**: Supabase (PostgreSQL)
- **用户认证**: Supabase Auth
- **文件存储**: Supabase Storage (可选)
- **定时任务**: Netlify Functions (Scheduled Functions)
- **邮件服务**: Resend API
- **AI 服务**: DeepSeek API

### 部署
- **前端托管**: Netlify
- **自动化部署**: Git 推送自动部署
- **环境变量**: Netlify Environment Variables

---

## 📁 项目结构

```
warehouse-app/
├── public/                     # 静态资源
│   ├── favicon.ico
│   └── icons/                  # 应用图标
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── apple-touch-icon.png
│
├── src/                        # 源代码
│   ├── assets/                 # 静态资源
│   │   └── main.css
│   │
│   ├── components/             # 组件（按功能分类）
│   │   ├── common/            # 通用组件
│   │   │   ├── AuthForm.vue           # 登录/注册表单
│   │   │   └── Sidebar.vue            # 侧边栏导航
│   │   │
│   │   ├── warehouse/         # 仓库管理相关
│   │   │   ├── AddItemForm.vue        # 添加物品表单
│   │   │   ├── AddItemModal.vue       # 添加物品弹窗
│   │   │   ├── EditItemModal.vue      # 编辑物品弹窗
│   │   │   ├── QuickAddModal.vue      # 快速添加弹窗
│   │   │   ├── ItemList.vue           # 物品列表
│   │   │   └── StatsCard.vue          # 统计卡片
│   │   │
│   │   ├── fart-tracker/      # 放屁记录相关
│   │   │   ├── QuickRecordModal.vue   # 快速记录弹窗
│   │   │   ├── BackfillModal.vue      # 补录弹窗
│   │   │   ├── SoundWordManager.vue   # 声音词管理
│   │   │   ├── RecordList.vue         # 记录列表
│   │   │   ├── StatsChart.vue         # 统计图表
│   │   │   ├── AIAnalysisModal.vue    # AI 分析弹窗
│   │   │   └── EditRecordModal.vue    # 编辑记录弹窗
│   │   │
│   │   ├── commute/           # 上下班通勤相关
│   │   │   ├── CommuteRecords.vue     # 通勤记录组件
│   │   │   └── RouteManager.vue       # 路线管理组件
│   │   │
│   │   └── categories/        # 分类管理相关
│   │       └── CategoryManager.vue    # 分类管理组件
│   │
│   ├── composables/           # 组合式函数 (可复用逻辑)
│   │   ├── useFartRecords.js         # 放屁记录管理
│   │   ├── useSoundWords.js          # 声音词管理
│   │   ├── useCommuteRecords.js      # 通勤记录管理
│   │   └── useCommuteRoutes.js       # 路线管理
│   │
│   ├── utils/                 # 工具函数
│   │   ├── supabase.js               # Supabase 客户端配置
│   │   └── chart-utils.js            # 图表工具函数
│   │
│   ├── views/                 # 页面级组件
│   │   ├── Dashboard.vue            # 主页（仓库管理）
│   │   ├── Warehouse.vue             # 仓库管理页（已弃用，合并到 Dashboard）
│   │   ├── FartTracker.vue           # 放屁记录页
│   │   ├── CommuteTracker.vue        # 上下班时间页
│   │   ├── CategoryManagement.vue    # 类别管理页
│   │   └── Rules.vue                 # 家庭规定页
│   │
│   ├── router/                # 路由配置
│   │   └── index.js                  # 路由定义
│   │
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
│
├── netlify/                   # Netlify Functions
│   └── functions/
│       ├── check-expiry.js            # 过期物品检查（每天晚 7 点）
│       ├── fart-weekly-report.js      # 放屁周报（每周日上午 9 点）
│       └── deepseek.js                # DeepSeek API 代理（生产环境）
│
├── supabase/                  # Supabase 数据库迁移文件
│   └── migrations/
│       ├── 202501XX_create_items_table.sql
│       ├── 202501XX_create_categories_table.sql
│       ├── 202501XX_create_rules_table.sql
│       ├── 202501XX_create_fart_records_table.sql
│       ├── 202501XX_create_sound_words_table.sql
│       ├── 20260204_create_commute_tables.sql
│       └── 20260204_add_school_holiday_field.sql
│
├── .env                       # 环境变量（本地开发）
├── .env.example               # 环境变量示例
├── .gitignore                 # Git 忽略文件
├── netlify.toml               # Netlify 配置
├── vite.config.js             # Vite 配置
├── package.json               # 项目依赖
├── index.html                 # HTML 入口
├── DEPLOYMENT.md              # 部署文档
├── DEPLOYMENT_CHECKLIST.md    # 部署检查清单
├── QUICK_ADD_SETUP.md         # 快速添加功能说明
└── README.md                  # 项目说明（本文件）
```

---

## 🗄️ 数据库设计

### 表 1: `items` - 物品表

```sql
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,                          -- 物品名称
  category_id UUID REFERENCES categories(id),  -- 分类 ID
  expiry_date DATE,                            -- 过期日期
  quantity INTEGER DEFAULT 1,                   -- 数量
  unit TEXT,                                   -- 单位
  notes TEXT,                                  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_items_user_expiry` (user_id, expiry_date)
- `idx_items_category` (category_id)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 2: `categories` - 分类表

```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                          -- 分类名称
  icon TEXT,                                   -- 分类图标
  color TEXT,                                  -- 分类颜色
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_categories_name` (name)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 3: `rules` - 家庭规定表

```sql
CREATE TABLE rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,                       -- 规定内容（支持 HTML）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 4: `fart_records` - 放屁记录表

```sql
CREATE TABLE fart_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  record_time TIMESTAMPTZ NOT NULL,            -- 记录时间
  sound_word_id UUID REFERENCES sound_words(id), -- 声音词 ID
  notes TEXT,                                  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_fart_records_user_time` (user_id, record_time)
- `idx_fart_records_sound` (sound_word_id)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 5: `sound_words` - 声音词表

```sql
CREATE TABLE sound_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,                   -- 声音词（唯一）
  emoji TEXT,                                  -- 表情符号
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_sound_words_word` (word)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 6: `commute_routes` - 通勤路线表

```sql
CREATE TABLE commute_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  route_type TEXT NOT NULL CHECK (route_type IN ('work', 'home')),
  route_name TEXT NOT NULL,                    -- 路线名称
  start_point TEXT NOT NULL,                   -- 起点
  end_point TEXT NOT NULL,                     -- 终点
  notes TEXT,                                  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_commute_routes_user_type` (user_id, route_type)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

### 表 7: `commute_records` - 通勤记录表

```sql
CREATE TABLE commute_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  record_date DATE NOT NULL,                   -- 通勤日期
  commute_type TEXT NOT NULL CHECK (commute_type IN ('work', 'home')),
  departure_time TIME NOT NULL,                -- 出发时间
  arrival_time TIME NOT NULL,                  -- 到达时间
  route_id UUID REFERENCES commute_routes(id), -- 路线 ID
  weather TEXT,                                -- 天气
  notes TEXT,                                  -- 备注
  is_school_holiday BOOLEAN DEFAULT false,     -- 是否为寒暑假
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**索引**:
- `idx_commute_records_user_date` (user_id, record_date)
- `idx_commute_records_type` (commute_type)
- `idx_commute_records_route` (route_id)

**RLS 策略**: 所有用户可见，所有用户可编辑

---

## ⚙️ 环境配置

### 本地开发环境变量

创建 `.env` 文件：

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek API (可选，用于本地测试 AI 功能)
VITE_DEEPSEEK_API_KEY=sk-your_deepseek_api_key
```

**获取方式**:
- Supabase: 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目后获取
- DeepSeek API: 在 [DeepSeek Platform](https://platform.deepseek.com/) 获取

---

### Netlify 生产环境变量

在 Netlify Dashboard 配置：

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek API（必需，AI 分析功能）
DEEPSEEK_API_KEY=sk-your_deepseek_api_key

# Resend (邮件服务，可选)
RESEND_API_KEY=re-your_resend_api_key
```

**注意事项**:
- ⚠️ 不需要 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`（前端只需 anon key）
- ⚠️ `VITE_DEEPSEEK_API_KEY` 仅用于本地开发，生产环境使用 `DEEPSEEK_API_KEY`
- ⚠️ `RESEND_API_KEY` 仅在需要邮件提醒时配置

**配置路径**:
Netlify Dashboard → Site Settings → Environment Variables

---

## 🚀 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入真实的 API Key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

### 5. 预览生产构建

```bash
npm run preview
```

---

## 📦 部署

### 自动部署（推荐）

项目已配置 Netlify 自动部署：

1. **推送代码到 Git 仓库**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Netlify 自动部署**
   - 检测到推送后自动开始构建
   - 构建完成后自动部署到生产环境

3. **访问网站**
   - 生产 URL: https://your-site.netlify.app

---

### 手动部署

```bash
# 1. 构建项目
npm run build

# 2. 使用 Netlify CLI 部署
netlify deploy --prod --dir=dist
```

---

## ⏰ 定时任务

### 任务 1: 过期物品检查

**文件**: `netlify/functions/check-expiry.js`

**触发**: 每天晚 7:00（北京时间）

**功能**:
- 检查所有即将过期和已过期的物品
- 发送邮件提醒给所有用户
- 支持自定义提醒天数（默认 5 天）

**Cron 配置**:
```javascript
export const config = {
  schedule: '0 11 * * *',  // UTC 11:00 = 北京时间 19:00
  path: '/.netlify/functions/check-expiry'
}
```

---

### 任务 2: 放屁记录周报

**文件**: `netlify/functions/fart-weekly-report.js`

**触发**: 每周日上午 9:00（北京时间）

**功能**:
- 生成上周放屁记录统计
- 使用 DeepSeek API 分析放屁模式
- 发送邮件报告

**Cron 配置**:
```javascript
export const config = {
  schedule: '0 1 * * 0',  // UTC 1:00 = 北京时间 9:00
  path: '/.netlify/functions/fart-weekly-report'
}
```

---

### 任务 3: 通勤记录报告（已移除）

> **说明**: 通勤周报和月报功能已从 v2.3 版本移除（Netlify Scheduled Functions 不支持自定义路径）

**替代方案**:
- 用户可以在"上下班时间"页面手动查看统计
- 未来考虑使用其他定时任务方案（如 Supabase Edge Functions）

---

## 🔧 测试定时任务

### 本地测试 AI 分析功能

1. **配置 DeepSeek API Key**
   ```bash
   # 在 .env 文件中添加
   VITE_DEEPSEEK_API_KEY=sk-your_deepseek_api_key
   ```

2. **重启开发服务器**
   ```bash
   npm run dev
   ```

3. **点击测试按钮**
   - 在"隐藏功能"页面点击"🤖 AI 分析"按钮
   - 分析报告会显示在弹窗中

**测试原理**:
- 检查 `VITE_DEEPSEEK_API_KEY` 环境变量
- 如果存在：直接调用 DeepSeek API（本地测试）
- 如果不存在：使用 Netlify Functions（生产环境）

**注意**: 通勤周报和月报功能已移除（v2.3），请在页面内手动查看统计

---

## 📊 代码组织原则

### 组件分类

项目采用**功能导向的文件夹结构**：

- **common/**: 通用组件（登录表单、侧边栏）
- **warehouse/**: 仓库管理相关组件
- **fart-tracker/**: 放屁记录相关组件
- **commute/**: 上下班通勤相关组件
- **categories/**: 分类管理相关组件

**优势**:
- ✅ 代码结构清晰，易于查找
- ✅ 新增功能时知道文件放哪里
- ✅ 避免组件名称冲突
- ✅ 便于团队协作（多人开发不冲突）

---

### Composables 模式

使用 Vue 3 Composition API 的 **Composables** 模式封装可复用逻辑：

- **useFartRecords.js**: 放屁记录 CRUD 操作
- **useSoundWords.js**: 声音词管理
- **useCommuteRecords.js**: 通勤记录 CRUD 操作
- **useCommuteRoutes.js**: 路线管理

**优势**:
- ✅ 逻辑复用，避免重复代码
- ✅ 关注点分离（UI vs 逻辑）
- ✅ 易于测试和维护

---

### 测试 vs 生产环境

**AI 功能的本地测试模式**:

```javascript
// 检查是否有本地 API Key
const localApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

if (localApiKey) {
  // 本地开发：直接调用 DeepSeek API
  response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    headers: { 'Authorization': `Bearer ${localApiKey}` }
  })
} else {
  // 生产环境：使用 Netlify Functions
  response = await fetch('/.netlify/functions/deepseek', {...})
}
```

**优势**:
- ✅ 本地开发无需依赖 Netlify Functions
- ✅ 生产环境使用 Netlify Functions 保护 API Key
- ✅ 统一的代码路径，易于维护

---

## 📈 开发历史

### v1.0 - 仓库管理 (2025-01)
- ✅ 物品管理（CRUD）
- ✅ 分类管理
- ✅ 过期提醒
- ✅ 统计卡片

### v1.5 - 放屁记录追踪 (2025-01)
- ✅ 快速记录功能
- ✅ 声音词管理
- ✅ 统计图表
- ✅ AI 智能分析

### v2.0 - 上下班时间追踪 (2026-02)
- ✅ 通勤记录管理
- ✅ 路线管理
- ✅ 寒暑假标记
- ✅ 周报/月报自动生成
- ✅ 代码重构（功能导向的文件夹结构）

### v2.1 - 图表增强与首页优化 (2026-02-04)
- ✅ 放屁记录双线图表（总数 + 臭屁数量）
- ✅ 图表填充效果（蓝色线填充到橙色线，橙色线填充到X轴）
- ✅ 条形图统一样式（统一颜色、无边框、较窄条形）
- ✅ 首页 2×2 快速按钮布局
- ✅ 快速添加行程弹窗（直接在首页，不跳转）
- ✅ 移动端优化（2列统计、表单优化）

### v2.2 - 快速添加行程弹窗完善 (2026-02-04)
- ✅ 添加天气、备注、中小学生假期字段
- ✅ 添加右上角关闭按钮（×）
- ✅ 移动端表单对齐优化（统一所有表单元素padding）
- ✅ 修复日期/时间输入框宽度不一致问题
- ✅ 解决移动端输入框超出对话框边界问题

### v2.3 - 部署修复与 PWA 优化 (2026-02-24)
- ✅ 修复 AI 分析报告截断问题（max_tokens: 400 → 2000）
- ✅ 修复 Netlify MIME Type 错误（添加 base: '/' 和 assets 404 规则）
- ✅ 修复 Netlify Edge Function 502 错误（移除 edge runtime 配置）
- ✅ 修复 iOS PWA 图标不显示问题（添加版本参数 ?v=2）
- ✅ 添加 apple-touch-icon.png 作为 iOS 兜底图标
- ✅ 优化 netlify.toml 配置（移除无效的全局 timeout 配置）
- ✅ 删除通勤周报/月报定时任务（路径配置问题，暂不使用）

---

## 🏗️ 技术架构详解

### 前端架构模式

#### 1. 组件层次结构

```
App.vue (根组件)
├── AuthForm.vue (未登录时显示)
└── Main Layout (已登录时显示)
    ├── Sidebar.vue (侧边栏导航)
    └── 页面级组件 (views/)
        ├── Dashboard.vue (首页 - 仓库管理 + 快速操作)
        │   ├── StatsCard.vue (统计卡片)
        │   ├── ItemList.vue (物品列表)
        │   ├── QuickAddModal.vue (快速添加物品弹窗)
        │   └── QuickCommuteModal.vue (快速添加行程弹窗) ⭐ 新增
        │
        ├── FartTracker.vue (放屁记录页)
        │   ├── QuickRecordModal.vue (快速记录弹窗)
        │   ├── BackfillModal.vue (补录弹窗)
        │   ├── SoundWordManager.vue (声音词管理)
        │   ├── RecordList.vue (记录列表)
        │   ├── StatsChart.vue (统计图表) ⭐ 双线图表
        │   ├── AIAnalysisModal.vue (AI分析弹窗)
        │   └── EditRecordModal.vue (编辑记录弹窗)
        │
        ├── CommuteTracker.vue (上下班时间页)
        │   ├── CommuteRecords.vue (通勤记录组件)
        │   └── RouteManager.vue (路线管理组件)
        │
        ├── CategoryManagement.vue (分类管理页)
        │   └── CategoryManager.vue (分类管理组件)
        │
        └── Rules.vue (家庭规定页)
```

#### 2. 数据流架构

**单向数据流**:
```
用户操作 → 组件事件 → Composable 方法 → Supabase API
                ↓
          更新本地状态
                ↓
          响应式更新 UI
```

**示例：添加放屁记录**:
```javascript
// 1. 用户点击按钮
<button @click="handleQuickRecord">记录</button>

// 2. 组件方法处理
async function handleQuickRecord(soundWordId) {
  // 调用 composable
  await addRecord(user.value.id, {
    recordTime: new Date().toISOString(),
    soundWordId,
    notes: ''
  })
}

// 3. Composable 调用 API
async function addRecord(userId, recordData) {
  const { data, error } = await supabase
    .from('fart_records')
    .insert({...})
    .select()
    .single()

  // 4. 更新本地状态
  records.value.unshift(data)
}

// 5. UI 自动更新（响应式）
// QuickRecordModal.vue 中的列表自动刷新
```

#### 3. 状态管理模式

**本地状态 + Composable 模式**（不使用 Vuex/Pinia）:

```javascript
// useFartRecords.js (Composable)
export function useFartRecords() {
  const records = ref([])           // 本地状态
  const loading = ref(false)
  const error = ref(null)

  async function loadRecords(userId) {
    // 从 Supabase 加载数据
    const { data } = await supabase.from('fart_records').select('*')
    records.value = data
  }

  return {
    records,    // 暴露给组件使用
    loading,
    error,
    loadRecords
  }
}

// 在组件中使用
const { records, loadRecords } = useFartRecords()
```

**优势**:
- ✅ 代码组织清晰，逻辑复用
- ✅ 响应式自动更新
- ✅ 无需额外的状态管理库
- ✅ 易于测试和维护

---

### Chart.js 图表架构

#### 双线图表实现（放屁趋势）

**数据结构**:
```javascript
// chart-utils.js
export function groupRecordsByDate(records, days) {
  // 返回 { labels: ['今天', '昨天', ...], data: [5, 3, ...] }
}

export function groupSmellyFartsByDate(records, days) {
  // 返回臭屁数量统计
  // 过滤条件：record.is_smelly === true
}
```

**图表配置** (StatsChart.vue:102-134):
```javascript
datasets: [
  {
    label: '放屁次数',
    data: totalData,           // 总次数
    borderColor: '#1a73e8',    // 蓝色线
    fill: '+1',                // ⭐ 填充到下一个数据集（橙色线）
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    tension: 0.4,              // 平滑曲线
    pointRadius: 5
  },
  {
    label: '臭屁次数',
    data: smellyData,          // 臭屁次数
    borderColor: '#FF9500',    // 橙色线
    fill: true,                // ⭐ 填充到X轴
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    tension: 0.4,
    pointRadius: 5
  }
]
```

**填充效果**:
- 蓝色线和橙色线之间：蓝色阴影
- 橙色线以下：橙色阴影

#### 条形图实现（拟声词分布）

**统一样式配置** (StatsChart.vue:197-209):
```javascript
barChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels,        // ['噗(pu)', '波(bo)', ...]
    datasets: [{
      label: '次数',
      data,         // [15, 12, 8, ...]
      backgroundColor: '#1a73e8',    // ⭐ 统一蓝色
      borderColor: 'transparent',    // ⭐ 无边框
      borderWidth: 0,                // ⭐ 边框宽度0
      borderRadius: 8,               // 圆角
      barPercentage: 0.6             // ⭐ 条形宽度60%
    }]
  }
})
```

---

### 首页布局架构

#### 2×2 快速按钮布局 (Dashboard.vue:171-196)

**HTML 结构**:
```vue
<div class="action-buttons">
  <button @click="showQuickAdd = true" class="action-btn warehouse">
    <div class="icon">📦</div>
    <div class="label">快速添加物品</div>
    <div class="count">{{ expiringCount }} 个快过期</div>
  </button>

  <button @click="showFartModal = true" class="action-btn fart">
    <div class="icon">💨</div>
    <div class="label">快速添加屁</div>
    <div class="count">一键记录</div>
  </button>

  <button @click="showAIAnalysis = true" class="action-btn ai">
    <div class="icon">🤖</div>
    <div class="label">AI 分析</div>
    <div class="count">放屁模式分析</div>
  </button>

  <button @click="showCommuteModal = true" class="action-btn commute">
    <div class="icon">⏰</div>
    <div class="label">快速添加行程</div>
    <div class="count">记录通勤时间</div>
  </button>
</div>
```

**CSS Grid 布局** (Dashboard.vue:333-341):
```css
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);  /* ⭐ 固定2列 */
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 480px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);  /* ⭐ 移动端也是2列 */
    gap: 12px;
  }
}
```

#### 快速添加行程弹窗 (Dashboard.vue:244-290)

**功能**:
- 不跳转页面，直接弹窗
- 选择上班/下班通勤
- 表单字段：日期、出发时间、到达时间、路线（可选）
- 移动端优化：出发时间和到达时间并排显示

**移动端表单优化** (Dashboard.vue:626-640):
```css
@media (max-width: 480px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr);  /* ⭐ 2列布局 */
    gap: 12px;
  }

  .form-input {
    font-size: 16px;  /* ⭐ 防止iOS自动缩放 */
  }
}
```

---

### 通勤记录架构

#### 数据流程

**添加通勤记录流程**:
```
Dashboard.vue (首页点击快速添加行程)
    ↓
选择上班/下班
    ↓
CommuteForm.vue (弹窗表单)
    ↓
handleCommuteSubmit()
    ↓
useCommuteRecords.addRecord()
    ↓
Supabase: INSERT INTO commute_records
    ↓
本地状态更新 + UI 自动刷新
```

**寒暑假自动识别** (CommuteRecords.vue:213-227):
```javascript
function getHolidayType(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1

  // 寒假：1-3月
  if (month >= 1 && month <= 3) {
    return '寒假'
  }
  // 暑假：6-9月
  if (month >= 6 && month <= 9) {
    return '暑假'
  }

  return null
}
```

#### 路线管理

**路线类型**:
- `work`: 上班路线（家 → 公司）
- `home`: 下班路线（公司 → 家）

**路线选择**:
```vue
<select v-model="formData.routeId">
  <option :value="null">不选择路线</option>
  <option
    v-for="route in commuteFormType === 'work' ? workRoutes : homeRoutes"
    :key="route.id"
    :value="route.id"
  >
    {{ route.route_name }}
  </option>
</select>
```

---

### Supabase 集成架构

#### 客户端配置 (utils/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### RLS (Row Level Security) 策略

**所有表采用相同的策略模式**:
```sql
-- 启用 RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 所有用户可读
CREATE POLICY "Enable read access for all users"
  ON table_name FOR SELECT
  USING (true);

-- 所有用户可插入
CREATE POLICY "Enable insert for all users"
  ON table_name FOR INSERT
  WITH CHECK (true);

-- 所有用户可更新
CREATE POLICY "Enable update for all users"
  ON table_name FOR UPDATE
  USING (true);

-- 所有用户可删除
CREATE POLICY "Enable delete for all users"
  ON table_name FOR DELETE
  USING (true);
```

**设计理念**: 家庭共享应用，所有家庭成员可以共同管理数据

---

### 定时任务架构

#### Netlify Scheduled Functions

**配置文件** (netlify.toml):
```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

**Cron 表达式** (UTC 时间):
```
每天晚7点（北京时间）:  0 11 * * *
每周日上午9点:          0 1 * * 0
每周六上午9点:          0 1 * * 6
每月1日上午9点:         0 1 1 * *
```

#### 任务执行流程

```
Netlify Cron 触发
    ↓
Scheduled Function 执行
    ↓
查询 Supabase 数据库（使用 SERVICE_ROLE_KEY）
    ↓
生成报告内容
    ↓
调用 DeepSeek API（AI 分析）
    ↓
调用 Resend API（发送邮件）
    ↓
返回执行结果
```

**环境变量**:
- `SUPABASE_URL`: Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`: 绕过 RLS 的管理员密钥
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `RESEND_API_KEY`: Resend 邮件服务密钥

---

### 响应式设计架构

#### 断点系统

```css
/* 移动端 */
@media (max-width: 480px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);  /* 2列 */
    gap: 12px;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);  /* 2列 */
  }

  .form-row {
    grid-template-columns: repeat(2, 1fr);  /* 2列 */
    gap: 12px;
  }
}

/* 平板 */
@media (min-width: 481px) and (max-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);  /* 2列 */
  }
}

/* 桌面 */
@media (min-width: 769px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);  /* 2列 */
  }
}
```

#### 移动端优化清单

- ✅ **防止iOS自动缩放**: `font-size: 16px` (小于16px会触发缩放)
- ✅ **触摸友好**: 按钮/输入框高度至少 44px
- ✅ **2列布局**: 快速按钮、统计卡片、表单字段
- ✅ **响应式间距**: 移动端减少 gap（20px → 12px）
- ✅ **底部固定按钮**: 快速记录按钮固定在屏幕底部（放屁记录页）

---

### 开发工作流

#### 本地开发流程

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 API Keys

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 4. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push
# Netlify 自动部署
```

#### 代码规范

**组件命名**:
- PascalCase: `QuickRecordModal.vue`
- 文件夹名: kebab-case: `fart-tracker/`

**代码组织**:
```vue
<script setup>
// 1. Imports
import { ref, computed, onMounted } from 'vue'

// 2. Props & Emits
const props = defineProps({...})
const emit = defineEmits([...])

// 3. Composables
const { records, loadRecords } = useFartRecords()

// 4. Reactive State
const showModal = ref(false)
const formData = ref({...})

// 5. Computed
const filteredRecords = computed(() => ...)

// 6. Methods
function handleSubmit() {...}

// 7. Lifecycle
onMounted(() => {
  loadRecords()
})
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 组件样式 */
</style>
```

---

## 📊 性能优化

### 已实现的优化

1. **懒加载路由**:
   ```javascript
   const FartTracker = () => import('../views/FartTracker.vue')
   const CommuteTracker = () => import('../views/CommuteTracker.vue')
   ```

2. **Chart.js 响应式更新**:
   ```javascript
   // 监听数据变化，只更新图表数据而非重新创建
   watch(() => props.records, () => {
     lineChart.data.labels = newLabels
     lineChart.data.datasets[0].data = newData
     lineChart.update()  // ⭐ 只更新变化部分
   }, { deep: true })
   ```

3. **虚拟列表**: （未来可考虑用于大量记录）

4. **防抖搜索**: （未来可添加到物品搜索）

---

## 💡 开发经验总结

### 移动端表单对齐问题（v2.2）

#### 问题描述
在快速添加通勤记录弹窗中，日期、出发时间、到达时间的输入框右边线比路线、天气、备注的输入框右边线更靠右，无法对齐。

#### 根本原因分析

1. **浏览器默认样式差异**：
   - `input[type="date"]` 和 `input[type="time"]` 有浏览器默认的额外内边距
   - `select` 元素通常需要额外的 `padding-right` 来容纳下拉箭头
   - 不同输入类型的默认 `box-sizing` 可能不一致

2. **CSS 优先级问题**：
   - 通用样式（如 `.form-input`）可能被特定类型样式覆盖
   - 浏览器内置样式优先级可能高于自定义样式

3. **Grid 布局特性**：
   - `form-row` 使用 2 列 Grid 布局
   - Grid 子项默认不会缩小到小于内容宽度
   - 需要显式设置 `min-width: 0` 允许缩小

#### 解决方案

**1. 统一所有表单元素的 padding**（使用 `!important` 强制覆盖）：
```css
input.form-input[type="date"],
input.form-input[type="time"],
textarea.form-textarea,
select.form-input,
select {
  width: 100% !important;
  max-width: 100% !important;
  padding: 10px 12px !important;  /* ⭐ 关键：统一padding */
  box-sizing: border-box !important;
  display: block;
}
```

**2. 移除 select 的特殊 padding-right**：
```css
select {
  appearance: none;
  background-image: url("data:image/svg+xml,...");  /* 下拉箭头 */
  background-position: right 12px center;
  /* ⭐ 移除 padding-right: 36px，使用统一的 padding */
}
```

**3. Grid 布局优化**：
```css
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-row .form-group {
  min-width: 0;  /* ⭐ 允许 Grid 子项缩小 */
}
```

**4. 日期/时间选择器图标绝对定位**：
```css
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  position: absolute;  /* ⭐ 绝对定位，不占用布局空间 */
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
}
```

#### 关键经验

1. **使用 `!important` 谨慎但必要**：
   - 对于需要强制统一的样式（如表单元素宽度），使用 `!important`
   - 明确标注原因，避免滥用

2. **box-sizing 是关键**：
   - 始终使用 `box-sizing: border-box`
   - 确保 `padding` 和 `border` 计入元素宽度

3. **Grid 布局需要显式设置**：
   - Grid 子项默认 `min-width: auto`，不会缩小到小于内容
   - 设置 `min-width: 0` 允许缩小

4. **绝对定位避免布局影响**：
   - 日期/时间选择器图标使用绝对定位
   - 避免图标占用输入框内部空间

5. **测试多种输入类型**：
   - 测试 `input[type="date"]`、`input[type="time"]`、`select`、`textarea`
   - 确保所有类型的宽度计算一致

#### 相关文件
- `src/views/Dashboard.vue` - 快速添加行程弹窗
- `src/components/commute/CommuteRecords.vue` - 完整通勤记录表单

---

### 部署问题修复总结（v2.3）

#### 问题 1: AI 分析报告截断

**现象**: AI 分析报告显示不完整，内容在中间被截断。

**原因**: `max_tokens` 设置太小（400 tokens）

**解决方案**:
```javascript
// AIAnalysisModal.vue (第 193, 206 行)
max_tokens: 2000  // 从 400 增加到 2000

// netlify/functions/deepseek.js (第 24 行)
max_tokens: max_tokens || 2000  // 默认 2000 tokens
```

**相关文件**:
- `src/components/fart-tracker/AIAnalysisModal.vue`
- `netlify/functions/deepseek.js`

---

#### 问题 2: MIME Type 错误

**现象**: 浏览器控制台报错 `TypeError: 'text/html' is not a valid JavaScript MIME type`

**原因**: SPA 的路由回退规则（`/* → /index.html`）导致浏览器请求不存在的 JS 文件时返回 HTML

**解决方案**:
```javascript
// vite.config.js
export default defineConfig({
  base: '/',  // ⭐ 添加 base 配置，强制使用绝对路径
  plugins: [vue()],
})
```

```toml
# netlify.toml
# ⭐ 在 SPA 回退规则之前添加 assets 404 规则
[[redirects]]
  from = "/assets/*"
  to = "/assets/:splat"
  status = 404

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**关键点**:
- Netlify redirect 规则按顺序匹配，特定规则必须在通用规则之前
- `base: '/'` 确保 Vite 构建时使用绝对路径

**相关文件**:
- `vite.config.js`
- `netlify.toml`

---

#### 问题 3: Edge Function 502 错误

**现象**: Netlify logs 显示 `Function returned an unsupported value. Accepted types are 'Response' or 'undefined'`

**原因**: `deepseek.js` 使用对象返回格式 `{ statusCode, body }`，但配置了 `runtime: 'edge'`

**技术细节**:
- **Edge Functions** 只支持返回 `Response` 对象
- **Node.js Functions** 支持对象返回格式 `{ statusCode, headers, body }`

**解决方案**:
```javascript
// ❌ 删除 netlify/functions/deepseek.js 末尾的配置
export const config = {
  runtime: 'edge'  // 删除此配置
}

// ❌ 删除 netlify.toml 中的配置
[functions.deepseek]
  runtime = "edge"  # 删除此配置

// ✅ 保持 Node.js 兼容的返回格式
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}
```

**相关文件**:
- `netlify/functions/deepseek.js`
- `netlify.toml`

---

#### 问题 4: iOS PWA 图标不显示

**现象**: Safari (iOS) 添加到主屏幕后不显示应用图标

**原因**: iOS 缓存图标文件长达 1 年（netlify.toml 配置），版本更新后图标未刷新

**解决方案**:

**1. 添加版本参数到所有图标链接**:
```html
<!-- index.html -->
<!-- ⭐ 添加 ?v=2 版本参数 -->
<link rel="icon" type="image/png" href="/icons/favicon.png?v=2" />
<link rel="manifest" href="/manifest.json?v=2" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=2" />
```

```json
// public/manifest.json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png?v=2",  // ⭐ 所有图标添加 ?v=2
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**2. 创建兜底图标文件**:
```bash
# 复制 icon-192x192.png 到根目录
cp public/icons/icon-192x192.png public/apple-touch-icon.png
```

**iOS 图标优先级**:
1. fallback icon（无 sizes 属性）← ⭐ 最高优先级
2. sized icons（有 sizes 属性）
3. manifest.json 中的图标

**相关文件**:
- `index.html`
- `public/manifest.json`
- `public/apple-touch-icon.png` (新文件)

---

#### 问题 5: Netlify TOML 语法错误

**现象**: Netlify 部署失败，报错 `Configuration property functions.timeout must be an object`

**原因**: 全局 timeout 配置语法不正确

**解决方案**:
```toml
# ❌ 删除无效配置
[functions]
  timeout = 150  # 此语法无效

# ✅ 正确的配置方式（如需要）
# [functions."function-name"]
#   timeout = 150
```

**相关文件**:
- `netlify.toml`

---

## 🔒 安全性

### 已实现的安全措施

1. **Supabase RLS**: 所有表启用行级安全
2. **环境变量隔离**: 本地 `.env` 不提交到 Git
3. **API Key 保护**: 生产环境使用 Netlify Functions
4. **输入验证**: 所有表单字段进行前端验证
5. **SQL 注入防护**: 使用 Supabase 参数化查询

---

## 🚀 未来计划

### 短期（1-2周）
- [ ] 添加物品搜索功能
- [ ] 优化图表加载性能
- [ ] 添加数据导出功能（CSV/Excel）
- [ ] 通勤记录统计页面（替代周报/月报）

### 中期（1个月）
- [ ] PWA 离线支持
- [ ] 数据备份/恢复功能
- [ ] 多用户权限管理
- [ ] 使用 Supabase Edge Functions 重构通勤报告功能

### 长期（3个月）
- [ ] 移动端原生应用（Capacitor）
- [ ] 多语言支持（i18n）
- [ ] 数据可视化大屏

---

## 🐛 常见问题

### Q: 本地开发时数据库连接失败？

**A**: 检查 `.env` 文件中的 Supabase URL 和 Key 是否正确：
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### Q: 部署后浏览器控制台报 MIME Type 错误？

**A**: 这是 SPA 路由回退规则导致的问题，已在 v2.3 修复：
1. 确保 `vite.config.js` 中有 `base: '/'` 配置
2. 确保 `netlify.toml` 中 assets 404 规则在 SPA fallback 之前

---

### Q: AI 分析报告显示不完整？

**A**: 这是 max_tokens 设置太小的问题，已在 v2.3 修复：
- 本地开发：检查 `.env` 中是否有 `VITE_DEEPSEEK_API_KEY`
- 生产环境：检查 Netlify 环境变量中是否有 `DEEPSEEK_API_KEY`
- 报告长度限制已增加到 2000 tokens

---

### Q: iOS 添加到主屏幕后不显示图标？

**A**: 这是 iOS 缓存问题，已在 v2.3 修复：
1. 所有图标链接添加了 `?v=2` 版本参数
2. 创建了 `apple-touch-icon.png` 兜底图标
3. 如果仍不显示，尝试清除 Safari 缓存并重新添加

---

### Q: 定时任务没有执行？

**A**: Netlify Scheduled Functions 需要生产环境才能运行：
1. 确保代码已部署到 Netlify
2. 检查 Netlify Dashboard 的 Function logs
3. 确认环境变量已配置（`RESEND_API_KEY`、`DEEPSEEK_API_KEY`）

**注意**: 通勤周报和月报功能已移除（v2.3）

---

### Q: AI 分析功能失败？

**A**: 检查 DeepSeek API Key：
- 本地测试：确保 `.env` 中有 `VITE_DEEPSEEK_API_KEY`
- 生产环境：确保 Netlify 环境变量中有 `DEEPSEEK_API_KEY`
- 检查 Netlify Function logs 查看详细错误信息

---

### Q: 邮件提醒没有收到？

**A**: 检查 Resend API 配置：
1. 确认 Netlify 环境变量中有 `RESEND_API_KEY`
2. 检查 Resend Dashboard 的邮件发送记录
3. 确认发件域名已验证

---

## 📝 开发指南

### 添加新功能

1. **创建功能文件夹**
   ```bash
   cd src/components
   mkdir your-feature
   ```

2. **创建组件**
   ```bash
   touch your-feature/YourComponent.vue
   ```

3. **创建 Composable（如需要）**
   ```bash
   touch src/composables/useYourFeature.js
   ```

4. **添加路由**
   ```javascript
   // src/router/index.js
   {
     path: '/your-feature',
     name: 'YourFeature',
     component: () => import('../views/YourFeature.vue')
   }
   ```

5. **添加侧边栏导航**
   ```vue
   <!-- src/components/common/Sidebar.vue -->
   <router-link to="/your-feature" class="nav-item">
     <span class="nav-icon">🎯</span>
     <span class="nav-text">你的功能</span>
   </router-link>
   ```

---

### 数据库迁移

1. **创建迁移文件**
   ```bash
   touch supabase/migrations/20260204_your_migration.sql
   ```

2. **编写 SQL**
   ```sql
   -- 创建表
   CREATE TABLE your_table (...);

   -- 创建索引
   CREATE INDEX idx_your_table_column ON your_table(column);

   -- 启用 RLS
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

   -- 创建策略
   CREATE POLICY "Enable all access for your_table"
     ON your_table FOR ALL
     USING (true)
     WITH CHECK (true);
   ```

3. **执行迁移**
   - 在 Supabase Dashboard → SQL Editor 中执行
   - 或使用 Supabase CLI: `supabase db push`

---

## 📚 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署详细指南
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署检查清单
- [QUICK_ADD_SETUP.md](./QUICK_ADD_SETUP.md) - 快速添加功能说明

---

## 📄 许可证

本项目为个人家庭管理项目，仅供学习参考。

---

未来想添加的功能：记录上下班通勤分段数据

---

## 👨‍💻 作者

- **GitHub**: dongshangyi
- **项目开始**: 2025-01-15
- **最后更新**: 2026-02-24

---

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Supabase](https://supabase.com/) - 开源 Firebase 替代品
- [Netlify](https://www.netlify.com/) - 现代化部署平台
- [DeepSeek](https://www.deepseek.com/) - AI 分析服务
- [Resend](https://resend.com/) - 邮件服务
