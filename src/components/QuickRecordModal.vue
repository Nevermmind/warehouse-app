<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>快速记录</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- AI 智能录入 -->
        <div class="form-section">
          <label class="form-label">🤖 AI 智能录入</label>
          <textarea
            v-model="aiInput"
            class="ai-textarea"
            placeholder="描述一下这次放屁的声音和味道，例如：今天中午吃多了，放了一个很响的屁，声音很大，有点臭..."
            rows="3"
          ></textarea>
          <button
            @click="handleAIAnalyze"
            :disabled="analyzing || !aiInput.trim()"
            class="btn-analyze"
          >
            {{ analyzing ? '🔄 分析中...' : '✨ AI 分析' }}
          </button>
        </div>

        <!-- 拟声词选择器 -->
        <div class="form-section">
          <label class="form-label">拟声词（可选）</label>
          <div class="word-chips">
            <button
              v-for="word in soundWords"
              :key="word.id"
              @click="selectedWordId = word.id"
              :class="{ active: selectedWordId === word.id }"
              class="word-chip"
            >
              {{ word.word }} ({{ getToneLabel(word.tone) }})
            </button>
          </div>
        </div>

        <!-- 声音等级选择器 -->
        <div class="form-section">
          <label class="form-label">声音等级</label>
          <div class="star-rating">
            <button
              v-for="i in 5"
              :key="i"
              @click="soundLevel = i"
              :class="{ active: i <= soundLevel }"
              class="star-btn"
            >
              <span class="star-icon">{{ i <= soundLevel ? '⭐' : '☆' }}</span>
            </button>
          </div>
        </div>

        <!-- 臭/不臭开关 -->
        <div class="form-section">
          <label class="toggle-label">
            <input
              type="checkbox"
              v-model="isSmelly"
              class="toggle-input"
            >
            <span class="toggle-slider"></span>
            <span class="toggle-text">
              {{ isSmelly ? '💩 臭' : '✨ 无臭' }}
            </span>
          </label>
        </div>

        <!-- 按钮组 -->
        <div class="action-buttons">
          <button @click="close" class="btn-cancel">取消</button>
          <button
            @click="handleRecord"
            :disabled="soundLevel === 0"
            class="btn-confirm"
          >
            记录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  soundWords: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'record'])

// 表单数据
const soundLevel = ref(0)
const isSmelly = ref(false)
const selectedWordId = ref(null)
const aiInput = ref('')
const analyzing = ref(false)

// 获取声调标签
function getToneLabel(tone) {
  const toneMap = {
    1: '一声',
    2: '二声',
    3: '三声',
    4: '四声',
    5: '五声'
  }
  return toneMap[tone] || ''
}

// 关闭弹窗
function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function close() {
  soundLevel.value = 0
  isSmelly.value = false
  selectedWordId.value = null
  aiInput.value = ''
  emit('close')
}

// 处理记录
function handleRecord() {
  if (soundLevel.value === 0) return

  emit('record', {
    soundLevel: soundLevel.value,
    isSmelly: isSmelly.value,
    soundWordId: selectedWordId.value
  })

  close()
}

// AI 智能分析
async function handleAIAnalyze() {
  if (!aiInput.value.trim() || analyzing.value) return

  analyzing.value = true

  try {
    // 构建拟声词列表
    const wordList = props.soundWords.map(w => `${w.word}(${w.pinyin},${w.tone}声)`).join('、')

    const prompt = `你是一个放屁数据分析专家。请根据用户的描述，分析以下信息：

用户描述：${aiInput.value}

可用拟声词：${wordList}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "soundLevel": 1-5的数字，表示声音等级（1最轻，5最响）
  "soundWord": "从可用拟声词中选择最合适的一个，只返回汉字，如果没有合适的返回null"
  "isSmelly": true/false，是否有臭味
  "reason": "简要说明判断理由"
}

要求：
1. 声音等级要根据描述中的关键词判断，如"很响"→5级，"不大"→2级等
2. 拟声词要从提供的列表中选择，不要自己创造
3. 有臭味相关的词（臭、味道、难闻等）就是true
4. 只返回 JSON，不要其他内容`

    const response = await fetch('/.netlify/functions/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error('AI 分析失败')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析 AI 返回结果')
    }

    const result = JSON.parse(jsonMatch[0])

    // 应用分析结果
    soundLevel.value = result.soundLevel || 1
    isSmelly.value = result.isSmelly || false

    // 查找匹配的拟声词
    if (result.soundWord) {
      const matchedWord = props.soundWords.find(w => w.word === result.soundWord)
      if (matchedWord) {
        selectedWordId.value = matchedWord.id
      }
    }

    // 显示提示
    alert(`✨ AI 分析完成！\n\n${result.reason || ''}\n\n已自动填充：响度${result.soundLevel}级${result.isSmelly ? '，有臭味' : '，无臭味'}${result.soundWord ? `，拟声词"${result.soundWord}"` : ''}`)

  } catch (error) {
    console.error('AI 分析失败:', error)
    alert('AI 分析失败：' + error.message)
  } finally {
    analyzing.value = false
  }
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
  max-width: 500px;
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

.form-section {
  margin-bottom: 24px;
}

/* AI 输入框 */
.ai-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #E5E5EA;
  background: white;
  border-radius: 10px;
  font-size: 15px;
  color: #1C1C1E;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.ai-textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.ai-textarea::placeholder {
  color: #8E8E93;
}

.btn-analyze {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.btn-analyze:hover:not(:disabled) {
  background: linear-gradient(135deg, #1557b0 0%, #3367d6 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
}

.btn-analyze:active:not(:disabled) {
  transform: translateY(0);
}

.btn-analyze:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}


.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 12px;
}

/* 拟声词 Chip 选择器 */
.word-chips {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.word-chip {
  padding: 12px 16px;
  border: 2px solid #E5E5EA;
  background: white;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
  cursor: pointer;
  transition: all 0.2s;
}

.word-chip:hover {
  border-color: #1a73e8;
  background: #e8f0fe;
}

.word-chip.active {
  border-color: #1a73e8;
  background: #1a73e8;
  color: white;
}

/* 星级评价选择器 */
.star-rating {
  display: flex;
  gap: 8px;
}

.star-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-icon {
  font-size: 32px;
  line-height: 1;
}

.star-btn:not(.active) .star-icon {
  opacity: 0.3;
}

/* Toggle 开关 */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 51px;
  height: 31px;
  background-color: #C6C6C8;
  border-radius: 31px;
  transition: 0.4s;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background-color: #1a73e8;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

/* 按钮组 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.action-buttons button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-cancel:hover {
  background: #f1f3f4;
}

.btn-confirm {
  background: #1a73e8;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #1557b0;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 769px) {
  .word-chips {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
