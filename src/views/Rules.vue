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
          <h1>家庭规定</h1>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleSignOut" class="signout-btn">退出登录</button>
        </div>
      </div>

      <!-- 添加规定卡片 -->
      <div class="card">
        <h2 class="card-title">添加新规定</h2>
        <form @submit.prevent="addRule" class="add-rule-form">
          <input
            v-model="newRule"
            type="text"
            placeholder="例如：晚上10点熄灯"
            maxlength="100"
            required
          >
          <button type="submit" class="add-btn">添加</button>
        </form>
      </div>

      <!-- 规定列表卡片 -->
      <div class="card">
        <h2 class="card-title">当前规定 ({{ rules.length }})</h2>

        <div v-if="editingRule" class="edit-form">
          <input
            v-model="editingRule.text"
            type="text"
            maxlength="100"
            placeholder="编辑规定..."
          >
          <button @click="saveEdit" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>

        <div v-if="rules.length === 0" class="empty-state">
          还没有规定，快添加一条吧！
        </div>

        <div
          v-for="rule in rules"
          :key="rule.id"
          class="rule-item"
        >
          <span v-if="editingRule?.id !== rule.id" class="rule-text">
            {{ rule.text }}
          </span>

          <div class="rule-actions">
            <button
              v-if="editingRule?.id !== rule.id"
              @click="startEdit(rule)"
              class="edit-btn"
            >
              编辑
            </button>
            <button
              @click="deleteRule(rule.id)"
              class="delete-btn"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'
import AuthForm from '../components/common/AuthForm.vue'
import Sidebar from '../components/common/Sidebar.vue'

const router = useRouter()
const sidebarRef = ref(null)
const user = ref(null)
const rules = ref([])
const newRule = ref('')
const editingRule = ref(null)

// 共享的 user_id
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

function openSidebar() {
  if (sidebarRef.value) {
    sidebarRef.value.open()
  }
}

function handleSidebarToggle(expanded) {
  // 可以在这里处理侧边栏状态变化
}

async function handleAuthSuccess(authUser) {
  user.value = authUser
  if (user.value) {
    await loadRules()
  }
}

// 加载数据
async function loadRules() {
  try {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', SHARED_USER_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (data) {
      rules.value = data
    }
  } catch (error) {
    console.error('加载规定失败:', error.message)
    alert('加载规定失败: ' + error.message)
  }
}

// 添加规定
async function addRule() {
  if (!newRule.value.trim()) return

  try {
    const { data, error } = await supabase
      .from('rules')
      .insert({
        text: newRule.value.trim(),
        user_id: SHARED_USER_ID
      })
      .select()
      .single()

    if (error) throw error
    if (data) {
      rules.value.unshift(data)
      newRule.value = ''
    }
  } catch (error) {
    console.error('添加规定失败:', error.message)
    alert('添加规定失败: ' + error.message)
  }
}

// 开始编辑
function startEdit(rule) {
  editingRule.value = { ...rule }
}

// 保存编辑
async function saveEdit() {
  if (!editingRule.value.text.trim()) return

  try {
    const { error } = await supabase
      .from('rules')
      .update({ text: editingRule.value.text.trim() })
      .eq('id', editingRule.value.id)

    if (error) throw error

    // 更新本地数据
    const index = rules.value.findIndex(r => r.id === editingRule.value.id)
    if (index !== -1) {
      rules.value[index].text = editingRule.value.text
    }

    editingRule.value = null
  } catch (error) {
    console.error('更新规定失败:', error.message)
    alert('更新规定失败: ' + error.message)
  }
}

// 取消编辑
function cancelEdit() {
  editingRule.value = null
}

// 删除规定
async function deleteRule(id) {
  if (!confirm('确定要删除这条规定吗？')) {
    return
  }

  try {
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', id)

    if (error) throw error

    rules.value = rules.value.filter(rule => rule.id !== id)

    // 如果正在编辑的是被删除的规定，取消编辑
    if (editingRule.value?.id === id) {
      editingRule.value = null
    }
  } catch (error) {
    console.error('删除规定失败:', error.message)
    alert('删除规定失败: ' + error.message)
  }
}

async function handleSignOut() {
  await supabase.auth.signOut()
  router.push('/')
}

async function checkUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
  }
}

onMounted(async () => {
  await checkUser()
  if (user.value) {
    await loadRules()
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
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1.2em;
  margin-bottom: 20px;
  color: #1C1C1E;
  font-weight: 600;
}

.add-rule-form {
  display: flex;
  gap: 12px;
}

.add-rule-form input {
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

.add-rule-form input:focus {
  outline: none;
  border-color: #007AFF;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.add-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 17px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  height: 44px;
}

.add-btn:hover {
  background: #0051D5;
}

.add-btn:active {
  background: #004FC4;
}

.edit-form {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  padding: 16px;
  background: #F2F2F7;
  border-radius: 10px;
}

.edit-form input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #C6C6C8;
  border-radius: 8px;
  font-size: 15px;
  background: white;
  color: #1C1C1E;
}

.edit-form input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.save-btn {
  background: #34C759;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #2DB84D;
}

.cancel-btn {
  background: #8E8E93;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #636366;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8E8E93;
  font-size: 15px;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F2F2F7;
  border-radius: 10px;
  margin-bottom: 12px;
  transition: background-color 0.2s;
}

.rule-item:hover {
  background: #E5E5EA;
}

.rule-text {
  flex: 1;
  color: #1C1C1E;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
}

.rule-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #0051D5;
}

.delete-btn {
  background: #FF3B30;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #D70015;
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

  .add-rule-form {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
  }

  .edit-form {
    flex-direction: column;
  }

  .edit-form input,
  .save-btn,
  .cancel-btn {
    width: 100%;
  }

  .rule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }

  .rule-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .edit-btn,
  .delete-btn {
    flex: 1;
  }
}
</style>
