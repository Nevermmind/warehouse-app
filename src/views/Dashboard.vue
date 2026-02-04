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
          <h1>欢迎回来 👋</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 4 个大按钮 -->
      <div class="action-buttons">
        <button @click="showAddItemModal = true" class="action-btn warehouse">
          <div class="icon">📦</div>
          <div class="label">快速添加物品</div>
          <div class="count">{{ itemCount }} 个物品 ({{ warningCount }} 快过期)</div>
        </button>

        <button @click="showQuickRecord = true" class="action-btn fart">
          <div class="icon">💨</div>
          <div class="label">快速添加屁</div>
          <div class="count">今日 {{ fartStats.total }} 次</div>
        </button>

        <button @click="showCommuteModal = true" class="action-btn commute">
          <div class="icon">⏰</div>
          <div class="label">快速添加行程</div>
          <div class="count">记录通勤时间</div>
        </button>

        <button @click="showAIAnalysis = true" class="action-btn ai">
          <div class="icon">📊</div>
          <div class="label">AI 分析</div>
          <div class="count">查看统计</div>
        </button>
      </div>

      <!-- 快速统计卡片 -->
      <div class="quick-stats">
        <div class="stat-card">
          <h3>今日统计</h3>
          <p>放屁 {{ fartStats.total }} 次</p>
          <p>其中臭的 {{ fartStats.smelly }} 次</p>
          <p>平均响度 {{ fartStats.avgSoundLevel }} 星</p>
        </div>
        <div class="stat-card">
          <h3>仓库统计</h3>
          <p>总物品 {{ itemCount }} 个</p>
          <p>快过期 {{ warningCount }} 个</p>
          <p>已过期 {{ expiredCount }} 个</p>
        </div>
      </div>

      <!-- 添加方式选择弹窗 -->
      <div v-if="showAddItemModal" class="modal-overlay" @click="showAddItemModal = false">
        <div class="modal-content" @click.stop>
          <h2>选择添加方式</h2>
          <div class="add-options">
            <button @click="showQuickAddModal = true; showAddItemModal = false" class="add-option-btn">
              <div class="option-icon">🎤</div>
              <div class="option-title">快速添加</div>
              <div class="option-desc">语音输入物品信息</div>
            </button>
            <button @click="showManualAddModal = true; showAddItemModal = false" class="add-option-btn">
              <div class="option-icon">✏️</div>
              <div class="option-title">手动添加</div>
              <div class="option-desc">填写表单添加物品</div>
            </button>
          </div>
          <button @click="showAddItemModal = false" class="cancel-btn">取消</button>
        </div>
      </div>

      <!-- 通勤记录选择弹窗 -->
      <div v-if="showCommuteModal" class="modal-overlay" @click="showCommuteModal = false">
        <div class="modal-content" @click.stop>
          <h2>选择通勤类型</h2>
          <div class="add-options">
            <button @click="openCommuteForm('work'); showCommuteModal = false" class="add-option-btn">
              <div class="option-icon">🏢</div>
              <div class="option-title">上班通勤</div>
              <div class="option-desc">记录上班通勤时间</div>
            </button>
            <button @click="openCommuteForm('home'); showCommuteModal = false" class="add-option-btn">
              <div class="option-icon">🏠</div>
              <div class="option-title">下班通勤</div>
              <div class="option-desc">记录下班通勤时间</div>
            </button>
          </div>
          <button @click="showCommuteModal = false" class="cancel-btn">取消</button>
        </div>
      </div>

      <!-- 通勤记录添加弹窗 -->
      <div v-if="showCommuteForm" class="modal-overlay" @click="showCommuteForm = false">
        <div class="modal-content commute-form" @click.stop>
          <div class="modal-header">
            <h2>{{ commuteFormType === 'work' ? '添加上班通勤' : '添加下班通勤' }}</h2>
            <button @click="showCommuteForm = false" class="close-btn">×</button>
          </div>
          <form @submit.prevent="handleCommuteSubmit">
            <div class="form-group">
              <label>日期</label>
              <input
                v-model="commuteFormData.recordDate"
                type="date"
                required
                class="form-input"
              >
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>出发时间</label>
                <input
                  v-model="commuteFormData.departureTime"
                  type="time"
                  required
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label>到达时间</label>
                <input
                  v-model="commuteFormData.arrivalTime"
                  type="time"
                  required
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-group">
              <label>路线（可选）</label>
              <select v-model="commuteFormData.routeId" class="form-input">
                <option :value="null">不选择路线</option>
                <option
                  v-for="route in commuteFormType === 'work' ? workRoutes : homeRoutes"
                  :key="route.id"
                  :value="route.id"
                >
                  {{ route.route_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>天气（可选）</label>
              <select v-model="commuteFormData.weather" class="form-input">
                <option :value="null">不选择</option>
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="雨">雨</option>
                <option value="雪">雪</option>
                <option value="雾">雾</option>
              </select>
            </div>

            <div class="form-group">
              <label>备注（可选）</label>
              <textarea
                v-model="commuteFormData.notes"
                class="form-textarea"
                rows="3"
                maxlength="200"
                placeholder="请输入备注信息..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="commuteFormData.isSchoolHoliday"
                  class="checkbox-input"
                >
                <span>🏫 中小学生寒暑假</span>
              </label>
              <span class="checkbox-hint">勾选后根据日期自动标记为寒暑假（1-3月为寒假，6-9月为暑假）</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="submit-btn">添加</button>
              <button type="button" @click="showCommuteForm = false" class="cancel-btn">取消</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 快速记录弹窗 -->
      <QuickRecordModal
        :show="showQuickRecord"
        :sound-words="soundWords"
        @close="showQuickRecord = false"
        @record="handleQuickRecord"
      />

      <!-- AI 分析弹窗 -->
      <AIAnalysisModal
        :show="showAIAnalysis"
        :records="records"
        @close="showAIAnalysis = false"
      />

      <!-- 添加物品弹窗 -->
      <AddItemModal
        :show="showManualAddModal"
        :categories="categories"
        @close="showManualAddModal = false"
        @add-item="handleAddItem"
      />

      <!-- 快速添加物品弹窗 -->
      <QuickAddModal
        :show="showQuickAddModal"
        :categories="categories"
        @close="showQuickAddModal = false"
        @add-item="handleAddItem"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/common/AuthForm.vue'
import Sidebar from '../components/common/Sidebar.vue'
import QuickRecordModal from '../components/fart-tracker/QuickRecordModal.vue'
import AIAnalysisModal from '../components/fart-tracker/AIAnalysisModal.vue'
import AddItemModal from '../components/warehouse/AddItemModal.vue'
import QuickAddModal from '../components/warehouse/QuickAddModal.vue'
import { useFartRecords } from '../composables/useFartRecords'
import { useSoundWords } from '../composables/useSoundWords'
import { useCommuteRecords } from '../composables/useCommuteRecords'
import { useCommuteRoutes } from '../composables/useCommuteRoutes'

const router = useRouter()

// 响应式数据
const user = ref(null)
const sidebarRef = ref(null)
const items = ref([])
const categories = ref([])

// 弹窗状态
const showAddItemModal = ref(false) // 添加方式选择弹窗
const showManualAddModal = ref(false) // 手动添加弹窗
const showQuickAddModal = ref(false) // 快速添加弹窗
const showQuickRecord = ref(false) // 快速记录屁弹窗
const showAIAnalysis = ref(false) // AI 分析弹窗
const showCommuteModal = ref(false) // 通勤记录选择弹窗
const showCommuteForm = ref(false) // 通勤记录添加弹窗

// 通勤表单数据
const commuteFormType = ref('work') // work or home
const commuteFormData = ref({
  recordDate: new Date().toISOString().split('T')[0],
  departureTime: '',
  arrivalTime: '',
  routeId: null,
  weather: null,
  notes: '',
  isSchoolHoliday: false
})

// Composables
const { records, loadRecords, getStats, quickRecord } = useFartRecords()
const { soundWords, loadSoundWords } = useSoundWords()
const { addRecord } = useCommuteRecords()
const { workRoutes, homeRoutes, loadRoutes } = useCommuteRoutes()

// 统计数据
const fartStats = computed(() => {
  // 确保 records 已加载后再计算统计
  if (records.value.length === 0) {
    return { total: 0, smelly: 0, avgSoundLevel: 0 }
  }
  // getStats(0) 表示只统计今天的数据
  return getStats(0)
})
const itemCount = computed(() => items.value.length)
const warningCount = computed(() => {
  const now = new Date()
  return items.value.filter(item => {
    if (!item.expiry_date) return false
    const expiry = new Date(item.expiry_date)
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 5
  }).length
})
const expiredCount = computed(() => {
  const now = new Date()
  return items.value.filter(item => {
    if (!item.expiry_date) return false
    return new Date(item.expiry_date) < now
  }).length
})

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
    // 加载物品数据
    const { data: itemsData, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (itemsData) {
      items.value = itemsData
    }

    // 加载分类数据
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (categoriesData) {
      categories.value = categoriesData
    }

    // 加载放屁记录数据
    await loadRecords(user.value.id)

    // 加载拟声词
    await loadSoundWords()

    // 加载通勤路线
    await loadRoutes(user.value.id)
  } catch (error) {
    console.error('加载数据失败:', error.message)
  }
}

// 快速记录屁
async function handleQuickRecord(data) {
  try {
    await quickRecord(user.value.id, data.soundLevel, data.isSmelly, data.soundWordId)
  } catch (error) {
    alert('记录失败: ' + error.message)
  }
}

// 添加物品
async function handleAddItem(item) {
  try {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: item.name,
        category: item.category,
        expiry_date: item.expiry_date || null,
        quantity: item.quantity || 1
      })
      .select()
      .single()

    if (error) throw error

    // 添加到列表开头
    items.value.unshift(data)
  } catch (error) {
    alert('添加失败: ' + error.message)
    throw error
  }
}

// 快速添加通勤记录
function openCommuteForm(commuteType) {
  commuteFormType.value = commuteType
  // 重置表单
  commuteFormData.value = {
    recordDate: new Date().toISOString().split('T')[0],
    departureTime: '',
    arrivalTime: '',
    routeId: null,
    weather: null,
    notes: '',
    isSchoolHoliday: false
  }
  showCommuteForm.value = true
}

// 提交通勤记录
async function handleCommuteSubmit() {
  try {
    const data = {
      recordDate: commuteFormData.value.recordDate,
      commuteType: commuteFormType.value,
      departureTime: commuteFormData.value.departureTime,
      arrivalTime: commuteFormData.value.arrivalTime,
      routeId: commuteFormData.value.routeId,
      weather: commuteFormData.value.weather || null,
      notes: commuteFormData.value.notes || null,
      isSchoolHoliday: commuteFormData.value.isSchoolHoliday || false
    }

    await addRecord(user.value.id, data)
    showCommuteForm.value = false

    // 重置表单
    commuteFormData.value = {
      recordDate: new Date().toISOString().split('T')[0],
      departureTime: '',
      arrivalTime: '',
      routeId: null,
      weather: null,
      notes: '',
      isSchoolHoliday: false
    }

    alert('添加成功！')
  } catch (error) {
    alert('添加失败: ' + error.message)
  }
}

// 导航函数
function goToWarehouse() {
  router.push('/warehouse')
}

function goToFartTracker() {
  router.push('/fart-tracker')
}

function goToAIAnalysis() {
  router.push('/fart-tracker')
  // TODO: 滚动到 AI 分析部分（需要实现）
}

// 组件挂载时检查登录状态并加载数据
onMounted(async () => {
  await checkUser()
  if (user.value) {
    await loadData()
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
  font-size: 24px;
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

.signout-btn:active {
  background: #e8eaed;
}

/* 操作按钮网格 */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 固定2列 */
  gap: 20px;
  margin-bottom: 30px;
}

.action-btn {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 40px 30px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.action-btn:active {
  transform: translateY(-2px);
}

.action-btn .icon {
  font-size: 64px;
  line-height: 1;
}

.action-btn .label {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
}

.action-btn .count {
  font-size: 14px;
  color: #8E8E93;
}

.action-btn.warehouse {
  border-color: #4285f4;
}

.action-btn.warehouse:hover {
  background: #e8f0fe;
  border-color: #4285f4;
}

.action-btn.fart {
  border-color: #ea4335;
}

.action-btn.fart:hover {
  background: #fce8e6;
  border-color: #ea4335;
}

.action-btn.ai {
  border-color: #34a853;
}

.action-btn.ai:hover {
  background: #e6f4ea;
  border-color: #34a853;
}

.action-btn.commute {
  border-color: #ff9500;
}

.action-btn.commute:hover {
  background: #fff3e0;
  border-color: #ff9500;
}

/* 快速统计卡片 */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 固定2列 */
  gap: 15px;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card h3 {
  margin: 0 0 12px;
  color: #1C1C1E;
  font-size: 16px;
  font-weight: 600;
}

.stat-card p {
  margin: 6px 0;
  color: #8E8E93;
  font-size: 14px;
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
    font-size: 18px;
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

  .app-container {
    flex-direction: column;
  }

  .action-buttons {
    grid-template-columns: repeat(2, 1fr); /* 移动端也是2列 */
    gap: 12px;
  }

  .action-btn {
    padding: 30px 20px;
  }

  .action-btn .icon {
    font-size: 48px;
  }

  .action-btn .label {
    font-size: 18px;
  }
}

/* 通勤表单样式 */
.commute-form {
  max-width: 500px;
}

.commute-form form {
  width: 100%;
  max-width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-row .form-group {
  min-width: 0;  /* 允许grid项目缩小 */
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #1C1C1E;
  font-size: 14px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

/* 强制所有input类型使用相同的宽度计算 */
input.form-input[type="date"],
input.form-input[type="time"],
textarea.form-textarea,
select.form-input,
select {
  width: 100% !important;  /* 强制100%宽度 */
  max-width: 100% !important;
  padding: 10px 12px !important;  /* 统一padding，强制覆盖select的特殊设置 */
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box !important;  /* 强制border-box */
  background: white;
  display: block;
}

/* 调整日期和时间选择器，使用绝对定位图标避免占用空间 */
input.form-input[type="date"],
input.form-input[type="time"] {
  padding: 10px 12px;  /* 保持与其他输入框相同的padding */
  position: relative;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
}

select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238E8E93' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
  /* 移除 padding-right，使用统一的 padding: 10px 12px */
}

select option {
  padding: 8px;
}

.form-input:focus {
  outline: none;
  border-color: #1a73e8;
}

input[type="date"]:focus,
input[type="time"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #1a73e8;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: #1a73e8;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 6px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
}

.checkbox-label span:first-of-type {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.checkbox-hint {
  display: block;
  font-size: 12px;
  color: #8E8E93;
  margin-left: 26px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn,
.cancel-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #1a73e8;
  color: white;
}

.submit-btn:hover {
  background: #1557b0;
}

.cancel-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.cancel-btn:hover {
  background: #f1f3f4;
}

@media (max-width: 480px) {
  .action-buttons {
    gap: 10px;
  }

  .action-btn {
    padding: 20px 15px;
  }

  .action-btn .icon {
    font-size: 36px;
  }

  .action-btn .label {
    font-size: 15px;
  }

  .action-btn .count {
    font-size: 11px;
  }

  .quick-stats {
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-card h3 {
    font-size: 14px;
  }

  .stat-card p {
    font-size: 13px;
  }

  /* 通勤表单移动端优化 */
  .commute-form {
    max-width: 100%;
    padding: 20px 20px; /* 增加左右padding到20px */
  }

  .commute-form form {
    width: 100%;
    max-width: 100%;
  }

  .modal-header h2 {
    font-size: 18px;
  }

  .close-btn {
    font-size: 28px;
    width: 28px;
    height: 28px;
  }

  .form-row {
    grid-template-columns: repeat(2, 1fr); /* 2列 */
    gap: 10px;
  }

  .form-row .form-group {
    min-width: 0;
  }

  .form-group {
    margin-bottom: 14px;
  }

  /* 强制所有表单元素宽度一致 */
  .form-input,
  input.form-input[type="date"],
  input.form-input[type="time"],
  textarea.form-textarea,
  select {
    font-size: 16px; /* 防止iOS自动缩放 */
    padding: 10px 8px; /* 减少左右padding到8px */
    box-sizing: border-box; /* 确保padding不增加元素宽度 */
    width: 100% !important; /* 强制100%宽度 */
    max-width: 100% !important;
  }

  select {
    /* 移动端也使用统一padding，不需要额外的padding-right */
  }

  /* 调整日期和时间选择器图标 - 移动端 */
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
  }

  input.form-input[type="date"],
  input.form-input[type="time"] {
    position: relative;
  }

  .form-textarea {
    min-height: 60px;
  }

  /* 减少弹窗外边距，给更多空间 */
  .modal-overlay {
    padding: 12px 10px; /* 左右10px，上下12px */
  }
}

/* 添加方式选择弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 14px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  box-sizing: border-box;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #8E8E93;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #1C1C1E;
}

.modal-content h2 {
  margin: 0 0 24px;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.add-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.add-option-btn {
  padding: 24px 20px;
  border: 2px solid #E5E5EA;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.add-option-btn:hover {
  border-color: #1a73e8;
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
}

.option-icon {
  font-size: 48px;
  line-height: 1;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.option-desc {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
}

.cancel-btn {
  width: 100%;
  padding: 14px 24px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f1f3f4;
}

@media (max-width: 480px) {
  .add-options {
    grid-template-columns: 1fr;
  }

  .modal-content {
    padding: 24px 20px;
  }
}
</style>
