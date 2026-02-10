<template>
  <!-- 未登录：显示登录页面 -->
  <div v-if="!user" class="auth-page">
    <AuthForm @auth-success="handleAuthSuccess" />
  </div>

  <!-- 已登录：显示主应用 -->
  <div v-else class="app-container">
    <!-- 侧边栏 -->
    <Sidebar
        ref="sidebarRef"
        :user-email="user.email"
        @toggle="handleSidebarToggle"
    />

    <!-- 主内容区域 -->
    <div class="main-content">
      <div class="header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="openSidebar">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1>⏰ 上下班时间</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 新增记录按钮 -->
      <div v-if="activeTab === 'work' || activeTab === 'home'" class="quick-add-section">
        <button @click="handleQuickAdd" class="quick-add-btn">
          + 新增{{ activeTab === 'work' ? '上班' : '下班' }}通勤记录
        </button>
      </div>

      <!-- Tab 切换 -->
      <div class="tab-buttons">
        <button
          @click="activeTab = 'work'"
          :class="{ active: activeTab === 'work' }"
          class="tab-btn"
        >
          🏢 上班通勤
        </button>
        <button
          @click="activeTab = 'home'"
          :class="{ active: activeTab === 'home' }"
          class="tab-btn"
        >
          🏠 下班通勤
        </button>
        <button
          @click="activeTab = 'routes'"
          :class="{ active: activeTab === 'routes' }"
          class="tab-btn"
        >
          🛣️ 路线管理
        </button>
      </div>

      <!-- 通勤统计图表 -->
      <CommuteStatsChart
        v-if="activeTab === 'work' || activeTab === 'home'"
        :work-records="workRecords"
        :home-records="homeRecords"
        :active-tab="activeTab"
      />

      <!-- 测试按钮区域 -->
      <div class="test-buttons">
        <button @click="testWeeklyReport" class="test-btn" :disabled="testingReport">
          {{ testingReport ? '生成中...' : '📧 测试周报' }}
        </button>
        <button @click="testMonthlyReport" class="test-btn" :disabled="testingReport">
          {{ testingReport ? '生成中...' : '📧 测试月报' }}
        </button>
      </div>

      <!-- 上班通勤 -->
      <CommuteRecords
        v-if="activeTab === 'work'"
        :records="workRecords"
        :routes="workRoutes"
        commute-type="work"
        :loading="recordsLoading"
        :show-add-trigger="workRecordTrigger"
        :hide-add-button="true"
        @add="handleAddRecord"
        @edit="handleEditRecord"
        @delete="handleDeleteRecord"
      />

      <!-- 下班通勤 -->
      <CommuteRecords
        v-if="activeTab === 'home'"
        :records="homeRecords"
        :routes="homeRoutes"
        commute-type="home"
        :loading="recordsLoading"
        :show-add-trigger="homeRecordTrigger"
        :hide-add-button="true"
        @add="handleAddRecord"
        @edit="handleEditRecord"
        @delete="handleDeleteRecord"
      />

      <!-- 路线管理 -->
      <RouteManager
        v-if="activeTab === 'routes'"
        :work-routes="workRoutes"
        :home-routes="homeRoutes"
        :loading="routesLoading"
        @add-work="handleAddRoute('work', $event)"
        @add-home="handleAddRoute('home', $event)"
        @edit-work="handleEditRoute('work', $event)"
        @edit-home="handleEditRoute('home', $event)"
        @delete-work="handleDeleteRoute('work', $event)"
        @delete-home="handleDeleteRoute('home', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/common/AuthForm.vue'
import Sidebar from '../components/common/Sidebar.vue'
import CommuteRecords from '../components/commute/CommuteRecords.vue'
import CommuteStatsChart from '../components/commute/CommuteStatsChart.vue'
import RouteManager from '../components/commute/RouteManager.vue'
import { useCommuteRecords } from '../composables/useCommuteRecords'
import { useCommuteRoutes } from '../composables/useCommuteRoutes'

const route = useRoute()
const user = ref(null)
const sidebarRef = ref(null)
const activeTab = ref('work')
const testingReport = ref(false)

// 用于控制通勤记录弹窗的显示
const workRecordTrigger = ref(0)
const homeRecordTrigger = ref(0)

// Composables
const {
  workRecords,
  homeRecords,
  loadRecords,
  addRecord,
  updateRecord,
  deleteRecord
} = useCommuteRecords()

const {
  workRoutes,
  homeRoutes,
  loadRoutes,
  addRoute,
  updateRoute,
  deleteRoute
} = useCommuteRoutes()

// 计算加载状态
const recordsLoading = ref(false)
const routesLoading = ref(false)

// 打开侧边栏
function openSidebar() {
  if (sidebarRef.value) {
    sidebarRef.value.open()
  }
}

function handleSidebarToggle(expanded) {
  // 处理侧边栏状态变化
}

// 认证相关函数
async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
  }
}

async function handleAuthSuccess(authUser) {
  user.value = authUser
  if (user.value) {
    await loadData()
  }
}

async function handleSignOut() {
  await supabase.auth.signOut()
  user.value = null
}

// 加载数据
async function loadData() {
  try {
    recordsLoading.value = true
    routesLoading.value = true
    await Promise.all([
      loadRecords(user.value.id),
      loadRoutes(user.value.id)
    ])
  } catch (error) {
    console.error('加载数据失败:', error.message)
    alert('加载数据失败: ' + error.message)
  } finally {
    recordsLoading.value = false
    routesLoading.value = false
  }
}

// 快速添加记录（从顶部按钮触发）
function handleQuickAdd() {
  if (activeTab.value === 'work') {
    workRecordTrigger.value++
  } else if (activeTab.value === 'home') {
    homeRecordTrigger.value++
  }
}

// 处理通勤记录操作
async function handleAddRecord(data) {
  try {
    await addRecord(user.value.id, data)
  } catch (error) {
    alert('添加失败: ' + error.message)
  }
}

async function handleEditRecord(id, data) {
  try {
    await updateRecord(id, data)
  } catch (error) {
    alert('更新失败: ' + error.message)
  }
}

async function handleDeleteRecord(id) {
  if (!confirm('确定要删除这条记录吗？')) return
  try {
    await deleteRecord(id)
  } catch (error) {
    alert('删除失败: ' + error.message)
  }
}

// 处理路线操作
function handleAddRoute(type, data) {
  return addRoute(user.value.id, type, data)
}

function handleEditRoute(type, data) {
  return updateRoute(data.id, type, data)
}

function handleDeleteRoute(type, id) {
  if (!confirm('确定要删除这条路线吗？')) return
  return deleteRoute(id, type)
}

// 格式化本地日期
function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 测试周报
async function testWeeklyReport() {
  if (testingReport.value) return
  testingReport.value = true

  try {
    // 获取本周一到周五的记录
    const now = new Date()
    const currentDay = now.getDay()
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)

    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    const mondayStr = formatLocalDate(monday)
    const fridayStr = formatLocalDate(friday)

    // 获取上班和下班记录
    const { data: workRecords } = await supabase
      .from('commute_records')
      .select('*, route:commute_routes(*)')
      .eq('commute_type', 'work')
      .gte('record_date', mondayStr)
      .lte('record_date', fridayStr)
      .order('record_date')

    const { data: homeRecords } = await supabase
      .from('commute_records')
      .select('*, route:commute_routes(*)')
      .eq('commute_type', 'home')
      .gte('record_date', mondayStr)
      .lte('record_date', fridayStr)
      .order('record_date')

    if ((!workRecords || workRecords.length === 0) && (!homeRecords || homeRecords.length === 0)) {
      alert('本周暂无通勤记录，无法生成周报。')
      return
    }

    // 生成报告
    let report = ''
    if (workRecords && workRecords.length > 0) {
      report = await generateWeeklyReport(workRecords, '上班')
      alert(`上班通勤周报生成成功！\n\n${report}`)
    }

    if (homeRecords && homeRecords.length > 0) {
      report = await generateWeeklyReport(homeRecords, '下班')
      alert(`下班通勤周报生成成功！\n\n${report}`)
    }
  } catch (error) {
    console.error('测试周报失败:', error)
    alert('测试周报失败: ' + error.message)
  } finally {
    testingReport.value = false
  }
}

// 生成本地周报
async function generateWeeklyReport(records, type) {
  if (!records || records.length === 0) {
    return `本周暂无${type}通勤记录。`
  }

  const startTime = performance.now()
  console.log(`[性能] 开始生成${type}周报，记录数: ${records.length}`)

  try {
    // 准备数据
    const recordsText = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟, 路线:${r.route?.route_name || '未选择'}, 天气:${r.weather || '未记录'}`
    }).join('\n')

    const prompt = `你是一个通勤数据分析专家。请根据以下${type}通勤记录，生成一份简短的周报：

${recordsText}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "本周通勤总结（2-3句话）",
  "averageTime": "平均通勤时间（分钟）",
  "trend": "通勤趋势分析（例如：星期几最短）",
  "insights": "洞察和发现（2-3点）"
}

要求：
1. 报告控制在 300 字以内
2. 重点突出平均时间和趋势
3. 分析星期几的通勤时间差异
4. 只返回 JSON，不要其他内容`

    const messages = [
      {
        role: 'system',
        content: '你是一个通勤数据分析专家，擅长分析通勤时间数据并给出简洁有用的建议。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    // 检查是否有本地 API Key（本地开发模式）
    const localApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

    let response

    if (localApiKey) {
      // 本地开发：直接调用 DeepSeek API
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      })
    } else {
      // 生产环境：使用 Netlify Functions 代理
      response = await fetch('/.netlify/functions/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      })
    }

    if (!response.ok) {
      // 处理超时情况（返回 408 状态码）
      if (response.status === 408) {
        throw new Error('AI 分析超时，请稍后重试')
      }
      throw new Error(`DeepSeek API 错误: ${response.status}`)
    }

    const data = await response.json()

    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // 格式化报告
    return `⏰ ${type}通勤周报

${analysis.summary}

📊 平均通勤时间：${analysis.averageTime}分钟

📈 趋势分析：${analysis.trend}

💡 洞察发现：
${analysis.insights}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  } catch (error) {
    console.error('生成周报失败:', error)

    // 如果 AI 分析失败，返回简化版报告
    const avgTime = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + calculateDuration(r.departure_time, r.arrival_time), 0) / records.length)
      : 0

    const recordsSummary = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `• ${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟`
    }).join('\n')

    return `⏰ ${type}通勤周报（简化版）

本周共${records.length}天${type}通勤记录

📊 平均通勤时间：${avgTime}分钟

📈 详细记录：
${recordsSummary}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
（注：${error.message}）
`
  }
}

function calculateDuration(departure, arrival) {
  const dep = new Date(`2000-01-01T${departure}`)
  const arr = new Date(`2000-01-01T${arrival}`)
  return Math.round((arr - dep) / 1000 / 60)
}

// 检测是否在 Netlify 环境
function isNetlifyEnv() {
  return window.location.hostname.includes('netlify.app') ||
         window.location.hostname === 'localhost' && import.meta.env.MODE === 'production'
}

// 测试月报
async function testMonthlyReport() {
  if (testingReport.value) return
  testingReport.value = true

  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('请先登录')
      return
    }

    // 检测环境：本地开发使用本地函数，Netlify 使用 Netlify Function
    if (isNetlifyEnv()) {
      // Netlify 环境：调用 Netlify Function
      const response = await fetch('/.netlify/functions/commute-monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          userId: user.id
        })
      })

      const responseText = await response.text()

      if (!response.ok) {
        alert(`测试月报失败！\n\n状态码: ${response.status}\n\n响应内容:\n${responseText}`)
        return
      }

      const result = JSON.parse(responseText)
      alert(`测试月报发送成功！\n\n结果：\n${JSON.stringify(result.results, null, 2)}`)
    } else {
      // 本地开发环境：使用本地函数
      const now = new Date()
      // 本月1号
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      // 今天
      const thisMonthEnd = new Date()

      const thisMonthStartStr = formatLocalDate(thisMonthStart)
      const thisMonthEndStr = formatLocalDate(thisMonthEnd)

      // 获取上班和下班记录
      const { data: workRecords } = await supabase
        .from('commute_records')
        .select('*, route:commute_routes(*)')
        .eq('commute_type', 'work')
        .gte('record_date', thisMonthStartStr)
        .lte('record_date', thisMonthEndStr)
        .order('record_date')

      const { data: homeRecords } = await supabase
        .from('commute_records')
        .select('*, route:commute_routes(*)')
        .eq('commute_type', 'home')
        .gte('record_date', thisMonthStartStr)
        .lte('record_date', thisMonthEndStr)
        .order('record_date')

      if ((!workRecords || workRecords.length === 0) && (!homeRecords || homeRecords.length === 0)) {
        alert('本月暂无通勤记录，无法生成月报。')
        return
      }

      // 生成报告
      let report = ''
      if (workRecords && workRecords.length > 0) {
        report = await generateMonthlyReport(workRecords, '上班', thisMonthStartStr, thisMonthEndStr)
        alert(`上班通勤月报生成成功！\n\n${report}`)
      }

      if (homeRecords && homeRecords.length > 0) {
        report = await generateMonthlyReport(homeRecords, '下班', thisMonthStartStr, thisMonthEndStr)
        alert(`下班通勤月报生成成功！\n\n${report}`)
      }
    }
  } catch (error) {
    console.error('测试月报失败:', error)
    alert('测试月报失败: ' + error.message)
  } finally {
    testingReport.value = false
  }
}

// 生成本地月报
async function generateMonthlyReport(records, type, startDate, endDate) {
  if (!records || records.length === 0) {
    return `本月暂无${type}通勤记录。`
  }

  try {
    // 准备数据
    const recordsText = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟, 路线:${r.route?.route_name || '未选择'}, 天气:${r.weather || '未记录'}`
    }).join('\n')

    const startDateFormatted = new Date(startDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
    const endDateFormatted = new Date(endDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })

    const prompt = `你是一个通勤数据分析专家。请根据以下${type}通勤记录，生成一份月度报告：

时间范围：${startDateFormatted} 至 ${endDateFormatted}

${recordsText}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "本月通勤总结（3-4句话）",
  "averageTime": "平均通勤时间（分钟）",
  "trend": "通勤趋势分析（与上月对比，星期几差异）",
  "insights": "洞察和发现（3-5点）",
  "statistics": "统计数据（总天数、最快时间、最慢时间）"
}

要求：
1. 报告控制在 500 字以内
2. 重点突出平均时间、趋势和统计数据
3. 分析星期几的通勤时间差异
4. 提供有价值的洞察和建议
5. 只返回 JSON，不要其他内容`

    const messages = [
      {
        role: 'system',
        content: '你是一个通勤数据分析专家，擅长分析通勤时间数据并给出简洁有用的建议。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    // 检查是否有本地 API Key（本地开发模式）
    const localApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

    let response

    if (localApiKey) {
      // 本地开发：直接调用 DeepSeek API
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      })
    } else {
      // 生产环境：使用 Netlify Functions 代理
      response = await fetch('/.netlify/functions/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      })
    }

    if (!response.ok) {
      // 处理超时情况（返回 408 状态码）
      if (response.status === 408) {
        throw new Error('AI 分析超时，请稍后重试')
      }
      throw new Error(`DeepSeek API 错误: ${response.status}`)
    }

    const data = await response.json()

    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // 计算统计数据
    const durations = records.map(r => calculateDuration(r.departure_time, r.arrival_time))
    const fastest = Math.min(...durations)
    const slowest = Math.max(...durations)

    // 格式化报告
    return `⏰ ${type}通勤月报

${analysis.summary}

📊 平均通勤时间：${analysis.averageTime}分钟

📈 趋势分析：${analysis.trend}

💡 洞察发现：
${analysis.insights}

📉 统计数据：
• 总通勤天数：${records.length}天
• 最快通勤：${fastest}分钟
• 最慢通勤：${slowest}分钟

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  } catch (error) {
    console.error('生成月报失败:', error)

    // 如果 AI 分析失败，返回简化版报告
    const avgTime = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + calculateDuration(r.departure_time, r.arrival_time), 0) / records.length)
      : 0

    const durations = records.map(r => calculateDuration(r.departure_time, r.arrival_time))
    const fastest = Math.min(...durations)
    const slowest = Math.max(...durations)

    const recordsSummary = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `• ${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟`
    }).join('\n')

    return `⏰ ${type}通勤月报（简化版）

本月共${records.length}天${type}通勤记录

📊 平均通勤时间：${avgTime}分钟

📈 详细记录：
${recordsSummary}

📉 统计数据：
• 最快通勤：${fastest}分钟
• 最慢通勤：${slowest}分钟

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
（注：${error.message}）
`
  }
}

// 组件挂载时检查登录状态并加载数据
onMounted(async () => {
  await checkUser()
  if (user.value) {
    await loadData()

    // 检查 URL 参数，自动打开弹窗
    if (route.query.action === 'add') {
      const type = route.query.type // 'work' or 'home'
      if (type === 'work') {
        activeTab.value = 'work'
        // 延迟触发，确保组件已挂载
        setTimeout(() => {
          workRecordTrigger.value++
        }, 100)
      } else if (type === 'home') {
        activeTab.value = 'home'
        setTimeout(() => {
          homeRecordTrigger.value++
        }, 100)
      }
    }
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
}

.app-container {
  display: flex;
  gap: 20px;
  align-items: stretch;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  min-width: 0;
  transition: all 0.3s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.mobile-menu-btn span {
  width: 20px;
  height: 2px;
  background: #1C1C1E;
  border-radius: 1px;
  transition: all 0.3s;
}

.header h1 {
  color: #1C1C1E;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-email {
  color: #8E8E93;
  font-size: 13px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signout-btn {
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.signout-btn:hover {
  background: #f1f3f4;
}

/* Tab 切换按钮 */
.tab-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1; /* 让三个按钮平分宽度 */
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #007AFF;
}

.tab-btn.active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}

/* 快速添加按钮 */
.quick-add-section {
  margin-bottom: 16px;
}

.quick-add-btn {
  width: 100%;
  padding: 12px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.quick-add-btn:hover {
  background: #0051D5;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  transform: translateY(-1px);
}

.quick-add-btn:active {
  transform: translateY(0);
}

/* 测试按钮 */
.test-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.test-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #f1f3f4;
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .header {
    flex-direction: row;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left {
    flex: 1;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .header h1 {
    font-size: 17px;
  }

  .user-info {
    gap: 6px;
  }

  .signout-btn {
    font-size: 12px;
    padding: 5px 10px;
  }

  .user-email {
    display: none;
  }

  .quick-add-btn {
    font-size: 15px;
    padding: 10px 16px;
  }

  .app-container {
    flex-direction: column;
  }

  .tab-buttons {
    flex-wrap: wrap;
  }

  .tab-btn {
    width: calc(33.333% - 7px);
    font-size: 13px;
    padding: 8px 4px;
  }

  .test-buttons {
    flex-wrap: wrap;
  }

  .test-btn {
    width: calc(50% - 5px);
    font-size: 13px;
    padding: 8px 4px;
  }
}
</style>
