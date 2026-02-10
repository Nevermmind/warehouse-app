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
        <div class="modal-content commute-modal" @click.stop>
          <div class="commute-modal-header">
            <h2>{{ commuteFormType === 'work' ? '添加上班通勤' : '添加下班通勤' }}</h2>
            <button @click="showCommuteForm = false" class="commute-close-btn"><span>&times;</span></button>
          </div>

          <form @submit.prevent="handleCommuteSubmit" class="commute-form-fields">
            <div class="commute-field">
              <label class="commute-label">日期</label>
              <input
                v-model="commuteFormData.recordDate"
                type="date"
                required
                class="commute-input"
              >
            </div>

            <div class="commute-field">
              <label class="commute-label">出发时间</label>
              <input
                v-model="commuteFormData.departureTime"
                type="time"
                required
                class="commute-input"
              >
            </div>

            <div class="commute-field">
              <label class="commute-label">到达时间</label>
              <input
                v-model="commuteFormData.arrivalTime"
                type="time"
                required
                class="commute-input"
              >
            </div>

            <div class="commute-field">
              <label class="commute-label">路线（可选）</label>
              <select v-model="commuteFormData.routeId" class="commute-input commute-select">
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

            <div class="commute-field">
              <label class="commute-label">天气（可选）</label>
              <select v-model="commuteFormData.weather" class="commute-input commute-select">
                <option :value="null">不选择</option>
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="雨">雨</option>
                <option value="雪">雪</option>
                <option value="雾">雾</option>
              </select>
            </div>

            <div class="commute-field">
              <label class="commute-label">备注（可选）</label>
              <textarea
                v-model="commuteFormData.notes"
                class="commute-input commute-textarea"
                rows="3"
                maxlength="200"
              ></textarea>
            </div>

            <div class="commute-field">
              <label class="commute-checkbox-label">
                <input
                  type="checkbox"
                  v-model="commuteFormData.isSchoolHoliday"
                  class="commute-checkbox"
                >
                <span class="commute-checkbox-text">🏫 中小学生寒暑假</span>
              </label>
              <span class="commute-checkbox-hint">勾选后根据日期自动标记为寒暑假（1-3月为寒假，6-9月为暑假）</span>
            </div>

            <div class="commute-actions">
              <button type="submit" class="commute-submit-btn">添加</button>
              <button type="button" @click="showCommuteForm = false" class="commute-cancel-btn">取消</button>
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
const { words: soundWords, loadWords } = useSoundWords()
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
    console.log('📦 加载物品数据...')
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
    console.log('📁 加载分类数据...')
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (categoriesData) {
      categories.value = categoriesData
    }

    // 加载放屁记录数据
    console.log('💨 加载放屁记录...')
    await loadRecords(user.value.id)

    // 加载拟声词
    console.log('📝 加载拟声词...')
    await loadWords(user.value.id)
    console.log('✅ 拟声词加载完成，数量:', soundWords.value?.length || 0)

    // 加载通勤路线
    console.log('🛣️ 加载通勤路线...')
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
  // ⭐ 加载路线数据
  loadRoutes()
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
  console.log('🔄 Dashboard onMounted - 开始加载')
  await checkUser()
  console.log('👤 checkUser 完成，user:', user.value?.email || 'null')
  if (user.value) {
    console.log('📊 开始 loadData')
    await loadData()
    console.log('✅ loadData 完成，拟声词数量:', soundWords.value?.length || 0)
  } else {
    console.log('⚠️ 用户未登录，跳过 loadData')
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

/* 通勤表单样式 - 使用 Flexbox + 强制重置原生样式 */
.commute-modal {
  max-width: 90vw;
  width: 100%;
}

/* 修改后的通勤弹窗头部 */
.commute-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 确保子元素在交叉轴（垂直方向）居中 */
  padding: 7px 24px -6px;  /* 上移10px（标题），下移20px（分隔线） */
  border-bottom: 1px solid #E5E5EA;
  min-height: 35px;    /* 相应减少最小高度 */
  box-sizing: border-box;
  margin-bottom: 6px;  /* 抵消负padding，避免布局塌陷 */
}

.commute-modal-header h2 {
  margin: 0;           /* 彻底清除默认外边距 */
  padding: 0;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;      /* 设置为 1 或者与按钮高度接近的数值 */
  display: flex;
  align-items: center;
}

.commute-close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #8E8E93;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;       /* 使用 flex 居中按钮内的 × 号 */
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
  line-height: 1;
  transform: translateY(-20px);  /* 整个按钮向上移动 20px */
}

.commute-close-btn:hover {
  background: #F2F2F7;
  color: #1C1C1E;
}

/* × 符号不再需要单独微调 */
.commute-close-btn span {
  display: block;
  line-height: 1;
}

.commute-form-fields {
  width: 100%;
  padding-top: 5px;  /* 日期和分隔线之间留出5px空间 */
}

.commute-field {
  margin-bottom: 16px;
  width: 100%;
}

/* 使用 Flexbox 实现并排布局 */
.commute-field-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.commute-field-row .commute-field {
  flex: 1;
  min-width: 0; /* 允许缩小 */
}

.commute-label {
  display: block;
  margin-bottom: 6px;
  color: #1C1C1E;
  font-size: 14px;
  font-weight: 500;
}

/* 所有输入框统一样式 - 强制重置原生样式 */
.commute-input {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px; /* ⭐ 增加最小高度，确保触摸友好 */
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
  background: white;
  display: block;
  /* 强制重置移动端原生样式 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 强制重置 date/time input */
input[type="date"].commute-input,
input[type="time"].commute-input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  /* 移除 iOS 的圆角和阴影 */
  border-radius: 8px;
  /* 确保背景是白色 */
  background-color: #fff;
}

/* 移除 iOS 的高亮背景 */
input[type="date"].commute-input:-webkit-autofill,
input[type="date"].commute-input:-webkit-autofill:hover,
input[type="date"].commute-input:-webkit-autofill:focus,
input[type="time"].commute-input:-webkit-autofill,
input[type="time"].commute-input:-webkit-autofill:hover,
input[type="time"].commute-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px #fff inset;
  -webkit-text-fill-color: #000;
}

/* select 特殊样式 */
.commute-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238E8E93' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

/* textarea 特殊样式 */
.commute-textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

/* 焦点样式 */
.commute-input:focus {
  outline: none;
  border-color: #1a73e8;
}

/* 日期/时间选择器图标优化 */
input[type="date"].commute-input::-webkit-calendar-picker-indicator,
input[type="time"].commute-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  filter: invert(0.5); /* 反转颜色以适应深色模式 */
}

input[type="date"].commute-input::-webkit-calendar-picker-indicator:hover,
input[type="time"].commute-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* 复选框样式 */
.commute-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 6px;
}

.commute-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
}

.commute-checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.commute-checkbox-hint {
  display: block;
  font-size: 12px;
  color: #8E8E93;
  margin-left: 26px;
}

/* 按钮样式 */
.commute-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.commute-submit-btn,
.commute-cancel-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.commute-submit-btn {
  background: #1a73e8;
  color: white;
}

.commute-submit-btn:hover {
  background: #1557b0;
}

.commute-cancel-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.commute-cancel-btn:hover {
  background: #f1f3f4;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .commute-modal {
    max-width: 100%;
  }

  /* Flexbox 在移动端保持不变 */
  .commute-field-row {
    gap: 12px;
  }

  .commute-field {
    margin-bottom: 14px;
  }

  /* 强制重置所有原生输入样式 */
  .commute-input,
  .commute-select,
  .commute-textarea {
    font-size: 16px !important; /* 防止iOS自动缩放 */
    padding: 10px 10px !important;
    /* 强制重置 */
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    border-radius: 8px !important;
    background-color: #fff !important;
    /* 移除 iOS 的默认样式 */
    -webkit-border-radius: 8px !important;
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }

  /* 特别针对 date/time */
  input[type="date"].commute-input,
  input[type="time"].commute-input {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    -webkit-border-radius: 8px !important;
    border-radius: 8px !important;
    background-color: #fff !important;
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }

  .commute-modal-header h2 {
    font-size: 18px;
  }

  .commute-close-btn {
    font-size: 28px;
    width: 28px;
    height: 28px;
  }
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
