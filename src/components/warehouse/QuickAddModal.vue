<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ step === 'input' ? '快速添加物品' : '确认物品信息' }}</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <!-- 步骤1: 输入 -->
      <div v-if="step === 'input'" class="modal-body">
        <div class="input-section">
          <textarea
            ref="textareaRef"
            v-model="userInput"
            class="input-textarea"
            placeholder="用自然语言描述你想添加的物品，例如：&#10;- 牛奶，3天后过期&#10;- 添加面包，分类零食，一周后过期&#10;- 我买了苹果，在水果分类，5天后过期"
            rows="5"
            @keydown.enter.prevent="handleEnter"
          ></textarea>

          <div class="input-actions">
            <button
              @click="startVoiceInput"
              class="voice-btn"
              :class="{ listening: isListening }"
              :disabled="!speechRecognitionSupported"
            >
              {{ isListening ? '🎤 正在录音...' : '🎤 语音输入' }}
            </button>

            <button
              @click="parseInput"
              class="parse-btn"
              :disabled="!userInput.trim() || isParsing"
            >
              {{ isParsing ? '解析中...' : '✨ 解析并继续' }}
            </button>
          </div>

          <div v-if="speechRecognitionSupported" class="voice-hint">
            💡 点击"语音输入"按钮，然后说话即可
          </div>
          <div v-else-if="isSafari" class="voice-hint info">
            💡 请点击输入框，使用键盘上的🎤麦克风按钮进行语音输入（iOS/macOS 自带功能）
          </div>
          <div v-else class="voice-hint warning">
            ⚠️ 当前浏览器不支持语音输入，请使用 Chrome 或 Edge 浏览器
          </div>

          <div v-if="parseError" class="error-message">
            {{ parseError }}
          </div>
        </div>
      </div>

      <!-- 步骤2: 确认 -->
      <div v-if="step === 'confirm'" class="modal-body">
        <div class="confirm-form">
          <div class="form-group">
            <label>物品名称</label>
            <input type="text" v-model="parsedItem.name" placeholder="物品名称">
          </div>

          <div class="form-group">
            <label>分类</label>
            <select v-model="parsedItem.categoryId">
              <option value="">请选择分类</option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>保质期到期日</label>
            <input
              type="date"
              v-model="parsedItem.expiryDate"
              :min="today"
            >
          </div>

          <div class="form-group">
            <label>提前提醒天数</label>
            <input
              type="number"
              v-model="parsedItem.reminderDays"
              min="1"
              max="30"
            >
          </div>

          <div class="ai-suggestion">
            💡 AI 已根据你的输入自动填充以上信息，请检查并确认
          </div>
        </div>

        <div class="confirm-actions">
          <button @click="step = 'input'" class="back-btn">返回修改</button>
          <button @click="confirmAdd" class="confirm-btn">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'add-item'])

// 状态
const step = ref('input') // 'input' | 'confirm'
const userInput = ref('')
const isParsing = ref(false)
const isListening = ref(false)
const parseError = ref('')
const textareaRef = ref(null)

// 解析后的物品信息
const parsedItem = ref({
  name: '',
  categoryId: '',
  expiryDate: '',
  reminderDays: 5
})

// 语音识别
let recognition = null

const speechRecognitionSupported = computed(() => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
})

const isSafari = computed(() => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// 初始化语音识别
onMounted(() => {
  if (speechRecognitionSupported.value) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      userInput.value = transcript
      isListening.value = false
    }

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
      parseError.value = '语音识别失败，请重试或使用文字输入'
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }
})

onUnmounted(() => {
  if (recognition) {
    recognition.abort()
  }
})

function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function close() {
  step.value = 'input'
  userInput.value = ''
  parsedItem.value = {
    name: '',
    categoryId: '',
    expiryDate: '',
    reminderDays: 5
  }
  parseError.value = ''
  emit('close')
}

// 处理回车键（Shift+Enter 换行，Enter 解析）
function handleEnter(event) {
  if (!event.shiftKey) {
    parseInput()
  }
}

// 开始语音输入
function startVoiceInput() {
  if (!recognition) return

  isListening.value = true
  parseError.value = ''

  try {
    recognition.start()
  } catch (error) {
    console.error('启动语音识别失败:', error)
    isListening.value = false
    parseError.value = '启动语音识别失败，请重试'
  }
}

// 解析输入
async function parseInput() {
  if (!userInput.value.trim()) return

  isParsing.value = true
  parseError.value = ''

  try {
    // 构建分类列表
    const categoryList = props.categories.map(c => c.name).join('、')

    // 构建 AI 提示词
    const prompt = `你是一个物品信息提取助手。请从用户的自然语言输入中提取物品信息，并以 JSON 格式返回。

用户输入：${userInput.value}

可用分类：${categoryList || '（无分类，请用户指定）'}

请提取以下信息：
{
  "name": "物品名称",
  "category": "分类名称（必须从可用分类中选择，如果用户说的分类不在列表中，返回空字符串）",
  "expiryDate": "过期日期（必须是 YYYY-MM-DD 格式，或者计算相对日期，比如用户说"3天后"，请计算具体日期。今天的日期是 ${today.value}）",
  "reminderDays": 提醒天数（数字，如果用户没说就返回 5）
}

**重要规则**：
1. 日期必须是 YYYY-MM-DD 格式
2. 分类必须从可用分类中选择，如果匹配不到就返回空字符串
3. 只返回 JSON，不要其他文字

现在开始分析：`

    // 调用 DeepSeek API（通过 Netlify Function）
    const response = await fetch('/.netlify/functions/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'API 请求失败')
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()

    // 解析 AI 返回的 JSON
    let parsed
    try {
      // 尝试提取 JSON（可能包含在代码块中）
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content]

      parsed = JSON.parse(jsonMatch[1] || content)
    } catch (error) {
      console.error('JSON 解析失败:', content)
      throw new Error('AI 返回格式错误，请重试')
    }

    // 验证解析结果
    if (!parsed.name) {
      throw new Error('未能识别物品名称，请重新描述')
    }

    // 计算过期日期
    let expiryDate = parsed.expiryDate
    if (!expiryDate) {
      // 如果 AI 没有返回日期，默认 7 天后
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 7)
      expiryDate = defaultDate.toISOString().split('T')[0]
    }

    // 匹配分类
    let categoryId = ''
    if (parsed.category) {
      const matchedCategory = props.categories.find(
        c => c.name.toLowerCase() === parsed.category.toLowerCase()
      )
      if (matchedCategory) {
        categoryId = matchedCategory.id
      }
    }

    // 填充解析结果
    parsedItem.value = {
      name: parsed.name,
      categoryId: categoryId,
      expiryDate: expiryDate,
      reminderDays: parsed.reminderDays || 5
    }

    // 进入确认步骤
    step.value = 'confirm'

  } catch (error) {
    console.error('解析失败:', error)
    parseError.value = error.message || '解析失败，请重试'
  } finally {
    isParsing.value = false
  }
}

// 确认添加
function confirmAdd() {
  if (!parsedItem.value.name || !parsedItem.value.expiryDate) {
    parseError.value = '请填写完整信息'
    return
  }

  emit('add-item', {
    id: Date.now(),
    name: parsedItem.value.name.trim(),
    categoryId: parsedItem.value.categoryId,
    expiryDate: parsedItem.value.expiryDate,
    reminderDays: parsedItem.value.reminderDays || 5,
    createdAt: new Date().toISOString()
  })

  close()
}
</script>

<style scoped>
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
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
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
  padding: 24px 24px 20px;
  border-bottom: 1px solid #E5E5EA;
}

.modal-header h2 {
  margin: 0;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #8E8E93;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #F2F2F7;
  color: #1C1C1E;
}

.modal-body {
  padding: 24px;
}

.input-textarea {
  width: 100%;
  padding: 14px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s;
}

.input-textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.voice-btn,
.parse-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-btn {
  background: #F2F2F7;
  color: #1a73e8;
}

.voice-btn:hover:not(:disabled) {
  background: #E5E5EA;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn.listening {
  background: #FF3B30;
  color: white;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.parse-btn {
  background: #1a73e8;
  color: white;
}

.parse-btn:hover:not(:disabled) {
  background: #1557b0;
}

.parse-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: #F0F9FF;
  border-radius: 8px;
  font-size: 14px;
  color: #1a73e8;
}

.voice-hint.info {
  background: #F0F9FF;
  color: #1a73e8;
}

.voice-hint.warning {
  background: #FFF9F0;
  color: #FF9500;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #FFF0F0;
  color: #FF3B30;
  border-radius: 8px;
  font-size: 14px;
}

.confirm-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.form-group input,
.form-group select {
  padding: 12px 14px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.ai-suggestion {
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
  font-size: 14px;
  color: #667eea;
  border: 1px solid #667eea30;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.confirm-actions button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn {
  background: #F2F2F7;
  color: #1a73e8;
}

.back-btn:hover {
  background: #E5E5EA;
}

.confirm-btn {
  background: #1a73e8;
  color: white;
}

.confirm-btn:hover {
  background: #1557b0;
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .modal-body {
    padding: 20px;
  }

  .input-actions {
    flex-direction: column;
  }

  .confirm-actions {
    flex-direction: column;
  }
}
</style>
