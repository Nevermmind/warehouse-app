<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed, mobile: isMobile }">
    <!-- 移动端遮罩层 -->
    <div
        v-if="isMobile && !isCollapsed"
        class="sidebar-overlay"
        @click="toggleSidebar"
    ></div>

    <div class="sidebar-inner">
      <div class="sidebar-header">
        <router-link to="/" class="logo-link" @click="onNavClick">
          <h2 v-if="!isCollapsed || !isMobile">📦 首页</h2>
        </router-link>
        <button class="toggle-btn" @click="toggleSidebar">
          {{ isCollapsed && !isMobile ? '☰' : '✕' }}
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/warehouse" class="nav-item" @click="onNavClick">
          <span class="nav-icon">📦</span>
          <span v-if="!isCollapsed || !isMobile" class="nav-text">仓库管理</span>
        </router-link>

        <router-link to="/categories" class="nav-item" @click="onNavClick">
          <span class="nav-icon">🏷️</span>
          <span v-if="!isCollapsed || !isMobile" class="nav-text">类别管理</span>
        </router-link>

        <router-link to="/fart-tracker" class="nav-item" @click="onNavClick">
          <span class="nav-icon">💨</span>
          <span v-if="!isCollapsed || !isMobile" class="nav-text">隐藏功能</span>
        </router-link>

        <router-link to="/commute-checkins" class="nav-item" @click="onNavClick">
          <span class="nav-icon">🚗</span>
          <span v-if="!isCollapsed || !isMobile" class="nav-text">通勤用时</span>
        </router-link>

        <router-link to="/rules" class="nav-item" @click="onNavClick">
          <span class="nav-icon">📋</span>
          <span v-if="!isCollapsed || !isMobile" class="nav-text">家庭规定</span>
        </router-link>
      </nav>

      <div v-if="!isCollapsed || !isMobile" class="sidebar-footer">
        <div class="user-info">
          <span class="user-email">{{ userEmail }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  userEmail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggle'])

const isCollapsed = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isCollapsed.value = true
  }
}

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  emit('toggle', isCollapsed.value)
}

function onNavClick() {
  // 移动端点击导航后自动收起侧边栏
  if (isMobile.value && !isCollapsed.value) {
    isCollapsed.value = true
    emit('toggle', true)
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 暴露方法给父组件
function open() {
  isCollapsed.value = false
  emit('toggle', false)
}

defineExpose({
  open
})
</script>

<style scoped>
.sidebar {
  position: relative;
}

.sidebar-inner {
  width: 240px;
  background: white;
  border-right: 1px solid #E5E5EA;
  height: calc(100vh - 40px);
  position: sticky;
  top: 20px;
  border-radius: 12px;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.sidebar.collapsed .sidebar-inner {
  width: 70px;
}

.sidebar-header {
  padding: 0 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1C1C1E;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.logo-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
}

.logo-link:hover h2 {
  color: #007AFF;
}

.toggle-btn {
  background: #F2F2F7;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: #E5E5EA;
}

.toggle-btn:active {
  background: #D1D1D6;
}

.sidebar-nav {
  flex: 1;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  margin-bottom: 4px;
  border-radius: 10px;
  color: #1C1C1E;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover {
  background: #F2F2F7;
}

.nav-item.router-link-active {
  background: #1a73e8;
  color: white;
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
}

.nav-text {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #E5E5EA;
}

.user-email {
  color: #8E8E93;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 桌面端：折叠状态 */
@media (min-width: 769px) {
  .sidebar.collapsed .logo-link {
    display: none; /* 隐藏整个 logo-link，让 toggle-btn 居中 */
  }

  .sidebar.collapsed .sidebar-header h2 {
    display: none;
  }

  .sidebar.collapsed .nav-text {
    display: none;
  }

  .sidebar.collapsed .sidebar-footer {
    display: none;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 0;
    justify-content: center;
  }

  .sidebar.collapsed .toggle-btn {
    margin: 0 auto; /* 让 toggle-btn 在收起状态时居中 */
  }

  .sidebar.collapsed .sidebar-nav {
    padding: 0 5px;
  }

  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 12px 0;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar-inner {
    position: fixed;
    left: 0;
    top: 20px; /* 向下移动20px */
    height: calc(100vh - 50px); /* 高度减少50px */
    border-radius: 0;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar:not(.collapsed) .sidebar-inner {
    transform: translateX(50px); /* 移动端打开时向右移动50px */
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .toggle-btn {
    font-size: 18px;
  }

  .sidebar-header {
    padding: 20px;
  }

  .sidebar-header h2 {
    font-size: 20px;
  }
}
</style>
