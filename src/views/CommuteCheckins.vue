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
          <h1>🚗通勤用时</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <div class="stat-card" v-if="stats">
          <div class="stat-icon stat-icon-blue">🚗</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatDuration(stats.work7Days) }}</div>
            <div class="stat-label">近7天上班平均用时</div>
          </div>
        </div>
        <div class="stat-card" v-if="stats">
          <div class="stat-icon stat-icon-green">🚙</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatDuration(stats.home7Days) }}</div>
            <div class="stat-label">近7天下班平均用时</div>
          </div>
        </div>
        <div class="stat-card" v-if="stats">
          <div class="stat-icon stat-icon-orange">🚕</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatDuration(stats.work30Days) }}</div>
            <div class="stat-label">近30天上班平均用时</div>
          </div>
        </div>
        <div class="stat-card" v-if="stats">
          <div class="stat-icon stat-icon-purple">🚌</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatDuration(stats.home30Days) }}</div>
            <div class="stat-label">近30天下班平均用时</div>
          </div>
        </div>
      </div>

      <!-- 时间线列表 -->
      <CheckinsTimeline
        :groups="groupedCheckins"
        :loading="loading"
        :error="error"
        @retry="loadData"
      />

      <!-- 分页控制 -->
      <PaginationControl
        :currentPage="currentPage"
        :totalPages="totalPages"
        @prev="prevPage"
        @next="nextPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/common/AuthForm.vue'
import Sidebar from '../components/common/Sidebar.vue'
import CheckinsTimeline from '../components/checkins/CheckinsTimeline.vue'
import PaginationControl from '../components/checkins/PaginationControl.vue'
import { useCommuteCheckins } from '../composables/useCommuteCheckins'

// 用户状态
const user = ref(null)

// 侧边栏引用
const sidebarRef = ref(null)

// 侧边栏收起状态
const isSidebarCollapsed = ref(false)

// 使用 composable
const {
  checkins,
  loading,
  error,
  loadCheckins,
  workCheckins,
  homeCheckins,
  groupedCheckins,
  currentPage,
  totalPages,
  prevPage,
  nextPage,
  stats,
  formatDuration
} = useCommuteCheckins()

// 处理认证成功
function handleAuthSuccess(authenticatedUser) {
  user.value = authenticatedUser
  loadData()
}

// 处理退出登录
async function handleSignOut() {
  await supabase.auth.signOut()
  user.value = null
}

// 打开侧边栏
function openSidebar() {
  sidebarRef.value?.open()
}

// 处理侧边栏切换
function handleSidebarToggle(collapsed) {
  isSidebarCollapsed.value = collapsed
}

// 加载数据
async function loadData() {
  if (user.value) {
    await loadCheckins()
  }
}

// 检查用户登录状态
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
    await loadData()
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2F2F7;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #F5F5F7;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.mobile-menu-btn span {
  width: 24px;
  height: 2px;
  background: #1C1C1E;
  border-radius: 1px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1C1C1E;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-email {
  font-size: 14px;
  color: #8E8E93;
}

.signout-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.signout-btn:hover {
  background: #f1f3f4;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px; /* 从 16px 减小到 8px */
  margin-bottom: 20px;
}

/* 侧边栏收起时：1行4列布局 + 图标缩小70% */
.stats-section.sidebar-collapsed {
  grid-template-columns: repeat(4, 1fr);
}

.stats-section.sidebar-collapsed .stat-icon {
  font-size: 10px; /* 33px * 0.3 ≈ 10px，缩小70% */
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px; /* 从 16px 减小到 12px */
  padding: 16px; /* 从 20px 减小到 16px */
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 33px; /* 36px - 3px = 33px */
  line-height: 1;
}

.stat-icon-blue {
  filter: drop-shadow(0 0 2px #4285f4);
}

.stat-icon-green {
  filter: drop-shadow(0 0 2px #34a853);
}

.stat-icon-orange {
  filter: drop-shadow(0 0 2px #fbbc04);
}

.stat-icon-purple {
  filter: drop-shadow(0 0 2px #9c27b0);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 19px; /* 22px - 3px = 19px */
  font-weight: 600;
  color: #1C1C1E;
  line-height: 1;
  margin-bottom: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 11px; /* 14px - 3px = 11px */
  color: #8E8E93;
  font-weight: 500;
  white-space: nowrap; /* 防止文字换行 */
}

@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .main-content {
    padding: 12px;
  }

  .header {
    padding: 16px;
  }

  .header h1 {
    font-size: 20px;
  }

  .user-email {
    display: none;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr); /* 固定为2行 */
  }

  /* 移动端强制覆盖 sidebar-collapsed 状态，保持2x2布局 */
  .stats-section.sidebar-collapsed {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }

  .stat-icon {
    font-size: 9px; /* 36px * 0.25 = 9px */
  }

  .stat-value {
    font-size: 11px; /* 调整为 11px */
  }

  .stat-label {
    font-size: 9px; /* 14px * 0.3 ≈ 4px，但最小可读设为 9px */
  }

  .stat-card {
    padding: 10px; /* 减小内边距 */
    gap: 8px; /* 减小图标和文字的间距 */
  }
}
</style>
