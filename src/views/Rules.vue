<template>
  <div v-if="!user" class="loading">
    <p>加载中...</p>
  </div>

  <div v-else class="container">
    <div class="header">
      <h1>📝 家庭规定</h1>
      <div class="user-info">
        <span class="user-email">{{ user.email }}</span>
        <button @click="handleSignOut" class="signout-btn">退出登录</button>
      </div>
    </div>

    <div class="navigation">
      <button @click="goHome" class="nav-btn">📦 返回仓库</button>
    </div>

    <!-- 添加规定表单 -->
    <div class="add-rule-form">
      <h2>添加新规定</h2>
      <form @submit.prevent="addRule">
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

    <!-- 规定列表 -->
    <div class="rules-list">
      <h2>当前规定 ({{ rules.length }})</h2>

      <div v-if="editingRule" class="edit-form">
        <input
          v-model="editingRule.text"
          type="text"
          maxlength="100"
        >
        <button @click="saveEdit" class="save-btn">保存</button>
        <button @click="cancelEdit" class="cancel-btn">取消</button>
      </div>

      <div v-if="rules.length === 0" class="empty">
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
            ✏️ 编辑
          </button>
          <button
            @click="deleteRule(rule.id)"
            class="delete-btn"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../utils/supabase'

const router = useRouter()
const user = ref(null)
const rules = ref([])
const newRule = ref('')
const editingRule = ref(null)

// 共享的 user_id
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

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
  if (confirm('确定要删除这条规定吗？')) {
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
}

function goHome() {
  router.push('/')
}

async function handleSignOut() {
  await supabase.auth.signOut()
  router.push('/')
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session && session.user) {
    user.value = session.user
    await loadRules()
  } else {
    console.log('No session found, redirecting to home')
    router.push('/')
  }
})
</script>

<style scoped>
.loading {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 18px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
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
}

.signout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.navigation {
  margin-bottom: 20px;
}

.nav-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.nav-btn:hover {
  transform: translateY(-2px);
}

.add-rule-form {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
}

.add-rule-form h2 {
  color: white;
  margin-bottom: 16px;
}

.add-rule-form form {
  display: flex;
  gap: 12px;
}

.add-rule-form input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.add-rule-form input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.rules-list {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
}

.rules-list h2 {
  color: white;
  margin-bottom: 20px;
}

.edit-form {
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.edit-form input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}

.save-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  background: #45a049;
}

.cancel-btn {
  background: #757575;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #616161;
}

.empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 40px;
  font-size: 16px;
}

.rule-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.rule-text {
  flex: 1;
  color: #333;
  font-size: 16px;
  line-height: 1.5;
}

.rule-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn, .delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.edit-btn {
  background: #2196f3;
  color: white;
}

.edit-btn:hover {
  background: #0b7dda;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #da190b;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .add-rule-form form {
    flex-direction: column;
  }

  .add-btn {
    width: 100%;
  }

  .edit-form {
    flex-direction: column;
  }

  .edit-form input, .save-btn, .cancel-btn {
    width: 100%;
  }

  .rule-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .rule-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
