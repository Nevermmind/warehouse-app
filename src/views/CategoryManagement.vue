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
          <h1>类别管理</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 分类管理卡片 -->
      <div class="card">
        <div class="add-category-form">
          <input
            type="text"
            v-model="newCategoryName"
            placeholder="输入新分类名称..."
            @keyup.enter="handleAdd"
          >
          <button @click="handleAdd" :disabled="!newCategoryName.trim()">
            添加分类
          </button>
        </div>

        <div class="category-list">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ getCategoryItemCount(category.id) }} 个物品</span>
            </div>
            <button
              class="delete-category-btn"
              @click="handleDelete(category)"
              :disabled="getCategoryItemCount(category.id) > 0"
              :title="getCategoryItemCount(category.id) > 0 ? '该分类下有物品，无法删除' : '删除分类'"
            >
              删除
            </button>
          </div>

          <div v-if="categories.length === 0" class="empty-state">
            <p>还没有分类，快添加一个吧！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/common/AuthForm.vue'
import Sidebar from '../components/common/Sidebar.vue'

// 响应式数据
const user = ref(null)
const sidebarRef = ref(null)
const categories = ref([])
const items = ref([])
const newCategoryName = ref('')

// 共享的 user_id
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

// 获取分类下的物品数量
function getCategoryItemCount(categoryId) {
  return items.value.filter(item => item.category_id === categoryId).length
}

// 添加分类
async function handleAdd() {
  const name = newCategoryName.value.trim()
  if (!name) return

  if (categories.value.find(c => c.name === name)) {
    alert('该分类已存在')
    return
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name,
        user_id: SHARED_USER_ID
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      categories.value.push(data)
      newCategoryName.value = ''
    }
  } catch (error) {
    console.error('添加分类失败:', error.message)
    alert('添加分类失败: ' + error.message)
  }
}

// 删除分类
async function handleDelete(category) {
  const itemCount = getCategoryItemCount(category.id)

  // 如果分类下有物品，不允许删除
  if (itemCount > 0) {
    alert(`无法删除分类"${category.name}"，该分类下还有 ${itemCount} 个物品。\n\n请先删除或转移这些物品。`)
    return
  }

  if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
    return
  }

  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) throw error

    categories.value = categories.value.filter(c => c.id !== category.id)
  } catch (error) {
    console.error('删除分类失败:', error.message)
    alert('删除分类失败: ' + error.message)
  }
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

function openSidebar() {
  if (sidebarRef.value) {
    sidebarRef.value.open()
  }
}

function handleSidebarToggle(expanded) {
  // 处理侧边栏状态变化
}

// 加载数据
async function loadData() {
  try {
    // 加载分类
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', SHARED_USER_ID)
      .order('name', { ascending: true })

    if (categoriesError) throw categoriesError
    if (categoriesData) {
      categories.value = categoriesData
    }

    // 加载物品
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', SHARED_USER_ID)

    if (itemsError) throw itemsError
    if (itemsData) {
      items.value = itemsData
    }
  } catch (error) {
    console.error('加载数据失败:', error.message)
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
  align-items: flex-start;
}

.main-content {
  flex: 1;
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
  background: #F2F2F7;
  color: #007AFF;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.signout-btn:hover {
  background: #E5E5EA;
}

.signout-btn:active {
  background: #D1D1D6;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.add-category-form {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.add-category-form input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 17px;
  transition: all 0.2s;
  background: #FFFFFF;
  color: #1C1C1E;
  height: 44px;
}

.add-category-form input:focus {
  outline: none;
  border-color: #007AFF;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.add-category-form button {
  width: auto;
  white-space: nowrap;
  background: #007AFF;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 17px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  height: 44px;
}

.add-category-form button:hover:not(:disabled) {
  background: #0051D5;
}

.add-category-form button:active:not(:disabled) {
  background: #004FC4;
}

.add-category-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F2F2F7;
  border-radius: 12px;
  transition: all 0.2s;
}

.category-item:hover {
  background: #E5E5EA;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.category-count {
  font-size: 13px;
  color: #8E8E93;
}

.delete-category-btn {
  background: white;
  color: #FF3B30;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.delete-category-btn:hover:not(:disabled) {
  background: #FF3B30;
  color: white;
}

.delete-category-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.delete-category-btn:disabled {
  background: #E5E5EA;
  color: #C6C6C8;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8E8E93;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

@media (max-width: 600px) {
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

  .add-category-form {
    flex-direction: column;
  }

  .add-category-form button {
    width: 100%;
  }

  .category-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .delete-category-btn {
    width: 100%;
  }

  .app-container {
    flex-direction: column;
  }
}
</style>
