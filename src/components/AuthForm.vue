<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isLogin ? '登录' : '注册' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="your@email.com"
            required
          >
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="至少6位字符"
            minlength="6"
            required
          >
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            placeholder="再次输入密码"
            minlength="6"
            required
          >
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="toggle-mode">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <a @click="toggleMode">{{ isLogin ? '立即注册' : '去登录' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

const emit = defineEmits(['auth-success'])

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      // 登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })

      if (error) throw error

      emit('auth-success', data.user)
    } else {
      // 注册
      if (password.value !== confirmPassword.value) {
        throw new Error('两次输入的密码不一致')
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })

      if (error) throw error

      emit('auth-success', data.user)
    }
  } catch (error) {
    errorMessage.value = error.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #F2F2F7;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #1C1C1E;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #1C1C1E;
  font-weight: 500;
  font-size: 14px;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 17px;
  transition: all 0.2s;
  background: #FFFFFF;
  color: #1C1C1E;
  height: 44px;
}

input[type="email"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

button {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 17px;
  cursor: pointer;
  width: 100%;
  font-weight: 600;
  transition: all 0.2s;
  height: 48px;
}

button:hover:not(:disabled) {
  background: #1557b0;
}

button:active:not(:disabled) {
  background: #174ea6;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #FFF0F0;
  color: #FF3B30;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #FF3B30;
}

.toggle-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 15px;
  color: #8E8E93;
}

.toggle-mode a {
  color: #1a73e8;
  cursor: pointer;
  font-weight: 500;
  margin-left: 5px;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .auth-card {
    padding: 30px 20px;
  }
}
</style>
