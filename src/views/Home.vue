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
    <div class="main-content" :class="{ expanded: sidebarExpanded }">
      <div class="header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="openSidebar">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1>仓库管理</h1>
        </div>
        <div class="user-info">
          <button @click="testEmail" class="test-email-btn" :disabled="testingEmail">
            {{ testingEmail ? '发送中' : '测试邮件' }}
          </button>
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

    <!-- 统计卡片 -->
    <div class="stats">
      <StatsCard
          :value="totalItems"
          label="总物品"
          :clickable="emergencyFilter !== null"
          @click="handleTotalClick"
      />
      <StatsCard
          :value="warningItems"
          label="快过期"
          number-class="warning-count"
          :clickable="true"
          :active="emergencyFilter === 'warning'"
          @click="handleWarningClick"
      />
      <StatsCard
          :value="expiredItems"
          label="已过期"
          number-class="expired-count"
          :clickable="true"
          :active="emergencyFilter === 'expired'"
          @click="handleExpiredClick"
      />
    </div>

    <!-- 添加物品按钮 -->
    <div class="add-item-section">
      <button @click="showAddModal = true" class="add-item-btn">
        + 添加新物品
      </button>
      <button @click="showQuickAddModal = true" class="quick-add-btn">
        🎤 快速添加
      </button>
    </div>

    <!-- 物品列表 -->
    <ItemList
        :items="items"
        :categories="categories"
        :selected-category="selectedCategory"
        :emergency-filter="emergencyFilter"
        @filter-category="handleFilterCategory"
        @clear-emergency="handleClearEmergency"
        @edit-item="handleEditItem"
        @delete-item="handleDeleteItem"
    />

    <!-- 编辑物品弹窗 -->
    <EditItemModal
        :show="showEditModal"
        :item="editingItem"
        :categories="categories"
        @close="closeEditModal"
        @save="handleSaveEdit"
    />

    <!-- 添加物品弹窗 -->
    <AddItemModal
        :show="showAddModal"
        :categories="categories"
        @close="closeAddModal"
        @add-item="handleAddItem"
    />

    <!-- 快速添加弹窗 -->
    <QuickAddModal
        :show="showQuickAddModal"
        :categories="categories"
        @close="closeQuickAddModal"
        @add-item="handleAddItem"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/AuthForm.vue'
import Sidebar from '../components/Sidebar.vue'
import StatsCard from '../components/StatsCard.vue'
import ItemList from '../components/ItemList.vue'
import EditItemModal from '../components/EditItemModal.vue'
import AddItemModal from '../components/AddItemModal.vue'
import QuickAddModal from '../components/QuickAddModal.vue'

const router = useRouter()

// 响应式数据
const user = ref(null)
const items = ref([])
const categories = ref([])
const selectedCategory = ref(null)
const emergencyFilter = ref(null)
const sidebarExpanded = ref(false)
const sidebarRef = ref(null)

// 编辑相关
const showEditModal = ref(false)
const editingItem = ref(null)

// 添加物品弹窗
const showAddModal = ref(false)
const showQuickAddModal = ref(false)

// 测试邮件
const testingEmail = ref(false)

// 打开侧边栏
function openSidebar() {
  if (sidebarRef.value) {
    sidebarRef.value.open()
  }
}

// 测试邮件发送功能
async function testEmail() {
  testingEmail.value = true

  try {
    // 调用 Netlify Function
    const response = await fetch('/.netlify/functions/test-email', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (response.ok) {
      alert(`测试邮件发送成功！\n\n找到 ${result.itemsReminded} 个需要提醒的物品\n已过期: ${result.expiredCount} 个\n快过期: ${result.warningCount} 个\n成功发送: ${result.emailsSent} 封`)
      console.log('测试邮件结果:', result)
    } else {
      alert('发送失败: ' + (result.error || '未知错误'))
      console.error('测试邮件失败:', result)
    }
  } catch (error) {
    console.error('测试邮件错误:', error)
    alert('发送测试邮件失败: ' + error.message)
  } finally {
    testingEmail.value = false
  }
}

// 共享的 user_id（所有人都用这个 ID，实现数据共享）
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

// 计算属性
const totalItems = computed(() => items.value.length)
const warningItems = computed(() =>
  items.value.filter(item => {
    const status = getStatus(item.expiry_date)
    return status.status === 'warning'
  }).length
)
const expiredItems = computed(() =>
  items.value.filter(item => {
    const status = getStatus(item.expiry_date)
    return status.status === 'expired'
  }).length
)

// 方法
function getStatus(expiryDate) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', label: '已过期', days: diffDays }
  } else if (diffDays <= 5) {
    return { status: 'warning', label: `快过期 (${diffDays}天)`, days: diffDays }
  } else {
    return { status: 'normal', label: `正常 (${diffDays}天)`, days: diffDays }
  }
}

function scrollToItemList() {
  nextTick(() => {
    const element = document.getElementById('item-list')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function handleTotalClick() {
  emergencyFilter.value = null
}

function handleWarningClick() {
  emergencyFilter.value = 'warning'
  scrollToItemList()
}

function handleExpiredClick() {
  emergencyFilter.value = 'expired'
  scrollToItemList()
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
}

async function handleSignOut() {
  await supabase.auth.signOut()
  user.value = null
}

function goToRules() {
  router.push('/rules')
}

function handleSidebarToggle(expanded) {
  sidebarExpanded.value = expanded
}

// ============ Supabase CRUD 操作 ============

// 加载数据
async function loadData() {
  try {
    // 加载分类
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', SHARED_USER_ID)

    if (categoriesError) throw categoriesError
    if (categoriesData) {
      categories.value = categoriesData
    }

    // 加载物品
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', SHARED_USER_ID)
      .order('expiry_date', { ascending: true })

    if (itemsError) throw itemsError
    if (itemsData) {
      items.value = itemsData
    }
  } catch (error) {
    console.error('加载数据失败:', error.message)
  }
}

// 添加物品
async function handleAddItem(item) {
  try {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: item.name,
        category_id: item.categoryId,
        expiry_date: item.expiryDate,
        reminder_days: item.reminderDays || 5,
        user_id: SHARED_USER_ID
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      items.value.push(data)
    }
  } catch (error) {
    console.error('添加物品失败:', error.message)
    alert('添加物品失败: ' + error.message)
  }
}

// 删除物品
async function handleDeleteItem(id) {
  if (confirm('确定要删除这个物品吗？')) {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

      if (error) throw error

      items.value = items.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('删除物品失败:', error.message)
      alert('删除物品失败: ' + error.message)
    }
  }
}

// 编辑物品
function handleEditItem(item) {
  editingItem.value = item
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingItem.value = null
}

function closeAddModal() {
  showAddModal.value = false
}

function closeQuickAddModal() {
  showQuickAddModal.value = false
}

// 保存编辑
async function handleSaveEdit(editedData) {
  try {
    const { data, error } = await supabase
      .from('items')
      .update({
        category_id: editedData.categoryId,
        expiry_date: editedData.expiryDate,
        reminder_days: editedData.reminderDays
      })
      .eq('id', editedData.id)
      .select()
      .single()

    if (error) throw error

    // 更新本地数据
    const index = items.value.findIndex(item => item.id === editedData.id)
    if (index !== -1 && data) {
      items.value[index] = data
    }

    closeEditModal()
    alert('物品更新成功！')
  } catch (error) {
    console.error('更新物品失败:', error.message)
    alert('更新物品失败: ' + error.message)
  }
}

function handleFilterCategory(categoryId) {
  selectedCategory.value = categoryId
}

function handleClearEmergency() {
  emergencyFilter.value = null
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
  align-items: flex-start;
}

.main-content {
  flex: 1;
  transition: all 0.3s ease;
}

.main-content.expanded {
  max-width: 100%;
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
  text-shadow: none;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.test-email-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.test-email-btn:hover:not(:disabled) {
  background: #1557b0;
}

.test-email-btn:active:not(:disabled) {
  background: #174ea6;
}

.test-email-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.add-item-section {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.add-item-btn,
.quick-add-btn {
  flex: 1;
  background: #1a73e8;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.quick-add-btn {
  background: #4285f4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.add-item-btn:hover {
  background: #1557b0;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.quick-add-btn:hover {
  background: #3367d6;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.add-item-btn:active {
  background: #004FC4;
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
}

.quick-add-btn:active {
  background: linear-gradient(135deg, #4a5fc4 0%, #52377a 100%);
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(118, 75, 162, 0.2);
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

  .test-email-btn,
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

  .add-item-section {
    flex-direction: column;
  }
}
</style>
