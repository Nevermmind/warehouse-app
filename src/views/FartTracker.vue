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
          <h1>💨 隐藏功能</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 操作按钮网格（2x2布局） -->
      <div class="action-buttons-grid">
        <button @click="showQuickRecord = true" class="btn-primary">
          + 快速记录
        </button>
        <button @click="showBackfill = true" class="btn-secondary">
          + 补录
        </button>
        <button @click="showSoundWordManager = true" class="btn-tertiary">
          ⚙️ 拟声词管理
        </button>
        <button @click="showAIAnalysis = true" class="btn-ai">
          🤖 AI 分析
        </button>
      </div>

      <!-- 统计卡片行（3个卡片在一行） -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">今日</div>
          <div class="stat-value">{{ todayCount }}</div>
          <div class="stat-unit">次</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">本周</div>
          <div class="stat-value">{{ weekCount }}</div>
          <div class="stat-unit">次</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">本月</div>
          <div class="stat-value">{{ monthCount }}</div>
          <div class="stat-unit">次</div>
        </div>
      </div>

      <!-- 图表 -->
      <StatsChart :records="records" />

      <!-- 记录流水表 -->
      <RecordList
        :records="records"
        @delete="handleDeleteRecord"
      />

      <!-- 快速记录弹窗 -->
      <QuickRecordModal
        :show="showQuickRecord"
        :sound-words="soundWords"
        @close="showQuickRecord = false"
        @record="handleQuickRecord"
      />

      <!-- 补录弹窗 -->
      <BackfillModal
        :show="showBackfill"
        :sound-words="soundWords"
        @close="showBackfill = false"
        @backfill="handleBackfill"
      />

      <!-- 拟声词管理弹窗 -->
      <SoundWordManager
        :show="showSoundWordManager"
        :sound-words="soundWords"
        @close="showSoundWordManager = false"
        @add="handleAddWord"
        @update="handleUpdateWord"
        @delete="handleDeleteWord"
      />

      <!-- AI 分析弹窗 -->
      <AIAnalysisModal
        :show="showAIAnalysis"
        :records="records"
        @close="showAIAnalysis = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/AuthForm.vue'
import Sidebar from '../components/Sidebar.vue'
import QuickRecordModal from '../components/QuickRecordModal.vue'
import BackfillModal from '../components/BackfillModal.vue'
import SoundWordManager from '../components/SoundWordManager.vue'
import RecordList from '../components/RecordList.vue'
import StatsChart from '../components/StatsChart.vue'
import AIAnalysisModal from '../components/AIAnalysisModal.vue'
import { useFartRecords } from '../composables/useFartRecords'
import { useSoundWords } from '../composables/useSoundWords'

const router = useRouter()

// 响应式数据
const user = ref(null)
const sidebarRef = ref(null)
const showQuickRecord = ref(false)
const showBackfill = ref(false)
const showSoundWordManager = ref(false)
const showAIAnalysis = ref(false)

// Composables
const { records, loadRecords, quickRecord, backfill, deleteRecord, getStats } = useFartRecords()
const { words: soundWords, loadWords, addWord, updateWord, deleteWord } = useSoundWords()

// 统计数据
const todayCount = computed(() => getStats(1).total)
const weekCount = computed(() => getStats(7).total)
const monthCount = computed(() => getStats(30).total)

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

// 处理快速记录
async function handleQuickRecord(data) {
  try {
    await quickRecord(user.value.id, data.soundLevel, data.isSmelly, data.soundWordId)
    await loadRecords(user.value.id)
  } catch (error) {
    console.error('记录失败:', error)
    alert('记录失败: ' + error.message)
  }
}

// 处理补录
async function handleBackfill(recordData) {
  try {
    await backfill(user.value.id, recordData)
    await loadRecords(user.value.id)
    alert('补录成功！')
  } catch (error) {
    console.error('补录失败:', error)
    alert('补录失败: ' + error.message)
  }
}

// 加载数据
async function loadData() {
  try {
    await loadWords(user.value.id)
    await loadRecords(user.value.id)
  } catch (error) {
    console.error('加载数据失败:', error.message)
  }
}

// 处理添加拟声词
async function handleAddWord(wordData) {
  try {
    await addWord(user.value.id, wordData)
    await loadWords(user.value.id)
    alert('拟声词添加成功！')
  } catch (error) {
    console.error('添加拟声词失败:', error)
    alert('添加失败: ' + error.message)
  }
}

// 处理更新拟声词
async function handleUpdateWord(id, wordData) {
  try {
    await updateWord(id, wordData)
    await loadWords(user.value.id)
    alert('拟声词更新成功！')
  } catch (error) {
    console.error('更新拟声词失败:', error)
    alert('更新失败: ' + error.message)
  }
}

// 处理删除拟声词
async function handleDeleteWord(id) {
  try {
    await deleteWord(id)
    await loadWords(user.value.id)
    alert('拟声词已删除')
  } catch (error) {
    console.error('删除拟声词失败:', error)
    alert('删除失败: ' + error.message)
  }
}

// 处理删除记录
async function handleDeleteRecord(id) {
  try {
    await deleteRecord(id)
    await loadRecords(user.value.id)
    alert('记录已删除')
  } catch (error) {
    console.error('删除记录失败:', error)
    alert('删除失败: ' + error.message)
  }
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

.signout-btn:active {
  background: #e8eaed;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-label {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #1a73e8;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-unit {
  font-size: 14px;
  color: #8E8E93;
}

/* 操作按钮网格（2x2布局） */
.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.action-buttons-grid button {
  padding: 16px 24px;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.btn-primary {
  background: #1a73e8;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.btn-primary:hover {
  background: #1557b0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  background: #174ea6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-secondary:hover {
  background: #f1f3f4;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-secondary:active {
  background: #e8eaed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.btn-tertiary {
  background: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-tertiary:hover {
  background: #f1f3f4;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-tertiary:active {
  background: #e8eaed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.btn-ai {
  background: #1a73e8;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.btn-ai:hover {
  background: #1557b0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-ai:active {
  background: #174ea6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

  .app-container {
    flex-direction: column;
  }

  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 15px 10px;
  }

  .stat-value {
    font-size: 24px;
  }

  .action-buttons-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .action-buttons-grid button {
    padding: 12px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 12px 8px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-unit {
    font-size: 12px;
  }
}
</style>
