<template>
  <!-- 未登录：显示登录页面 -->
  <div v-if="!user" class="auth-page">
    <AuthForm @auth-success="handleAuthSuccess" />
  </div>

  <!-- 已登录：显示主应用 -->
  <div v-else class="container">
    <div class="header">
      <h1>📦 仓库管理 <small style="font-size: 0.5em; opacity: 0.8;">(后端版本)</small></h1>
      <div class="user-info">
        <button @click="goToRules" class="rules-btn">📝 家庭规定</button>
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

    <!-- 分类管理 -->
    <CategoryManager
        :categories="categories"
        :items="items"
        @add-category="handleAddCategory"
        @delete-category="handleDeleteCategory"
    />

    <!-- 添加物品表单 -->
    <AddItemForm
        :categories="categories"
        @add-item="handleAddItem"
    />

    <!-- 物品列表 -->
    <ItemList
        :items="items"
        :categories="categories"
        :selected-category="selectedCategory"
        :emergency-filter="emergencyFilter"
        @filter-category="handleFilterCategory"
        @clear-emergency="handleClearEmergency"
        @delete-item="handleDeleteItem"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/AuthForm.vue'
import StatsCard from '../components/StatsCard.vue'
import CategoryManager from '../components/CategoryManager.vue'
import AddItemForm from '../components/AddItemForm.vue'
import ItemList from '../components/ItemList.vue'

const router = useRouter()

// 响应式数据
const user = ref(null)
const items = ref([])
const categories = ref([])
const selectedCategory = ref(null)
const emergencyFilter = ref(null)

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
  } else if (diffDays <= 3) {
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

// 添加分类
async function handleAddCategory(category) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        user_id: SHARED_USER_ID
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      categories.value.push(data)
    }
  } catch (error) {
    console.error('添加分类失败:', error.message)
    alert('添加分类失败: ' + error.message)
  }
}

// 删除分类
async function handleDeleteCategory(categoryId) {
  try {
    // 先删除该分类下的所有物品
    const { error: itemsError } = await supabase
      .from('items')
      .delete()
      .eq('category_id', categoryId)

    if (itemsError) throw itemsError

    // 再删除分类
    const { error: categoryError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (categoryError) throw categoryError

    // 更新本地状态
    categories.value = categories.value.filter(c => c.id !== categoryId)
    items.value = items.value.filter(item => item.category_id !== categoryId)

    // 如果当前选中的是被删除的分类，清除筛选
    if (selectedCategory.value === categoryId) {
      selectedCategory.value = null
    }
  } catch (error) {
    console.error('删除分类失败:', error.message)
    alert('删除分类失败: ' + error.message)
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
        reminder_days: item.reminderDays || 3,
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.rules-btn {
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.rules-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.4);
}

.user-email {
  color: white;
  font-size: 14px;
  opacity: 0.9;
}

.signout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  width: auto;
}

.signout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .user-info {
    width: 100%;
    flex-wrap: wrap;
  }
}

.container {
  width: 100%;
}
</style>
