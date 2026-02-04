<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>补录</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 时间选择器 -->
        <div class="form-section">
          <label class="form-label">时间</label>
          <input
            v-model="recordTime"
            type="datetime-local"
            class="form-input"
            max="9999-12-31T23:59"
          />
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
          <label class="form-label">声音等级（可选，无声可留空）</label>
          <div class="star-rating">
            <button
              v-for="i in 5"
              :key="i"
              @click="soundLevel = soundLevel === i ? 0 : i"
              :class="{ active: i <= soundLevel }"
              class="star-btn"
            >
              <span class="star-icon">{{ i <= soundLevel ? '⭐' : '☆' }}</span>
            </button>
          </div>
          <button
            v-if="soundLevel > 0"
            @click="soundLevel = 0"
            class="btn-clear-sound"
          >
            清除响度（设为无声）
          </button>
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

        <!-- 备注输入框 -->
        <div class="form-section">
          <label class="form-label">备注（可选）</label>
          <textarea
            v-model="notes"
            class="form-textarea"
            placeholder="添加备注信息..."
            rows="3"
          ></textarea>
        </div>

        <!-- 按钮组 -->
        <div class="action-buttons">
          <button @click="close" class="btn-cancel">取消</button>
          <button
            @click="handleBackfill"
            :disabled="!canSubmit"
            class="btn-confirm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const emit = defineEmits(['close', 'backfill'])

// 表单数据
const recordTime = ref('')
const soundLevel = ref(0)
const isSmelly = ref(false)
const selectedWordId = ref(null)
const notes = ref('')

// 是否可以提交（只需要有时间即可）
const canSubmit = computed(() => {
  return recordTime.value !== ''
})

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

// 初始化时间为当前时间
watch(() => props.show, (newVal) => {
  if (newVal) {
    const now = new Date()
    // 格式化为 datetime-local 所需格式: YYYY-MM-DDTHH:mm
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    recordTime.value = `${year}-${month}-${day}T${hours}:${minutes}`
  }
})

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
  notes.value = ''
  recordTime.value = ''
  emit('close')
}

// 处理补录
function handleBackfill() {
  if (!canSubmit.value) return

  emit('backfill', {
    record_time: new Date(recordTime.value).toISOString(),
    sound_level: soundLevel.value || 0,  // 0 表示无声
    is_smelly: isSmelly.value,
    sound_word_id: selectedWordId.value,
    notes: notes.value.trim() || null
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
  overflow-y: auto;
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
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 10px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 16px;
  color: #1C1C1E;
  background: white;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #8E8E93;
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

/* 清除响度按钮 */
.btn-clear-sound {
  margin-top: 8px;
  padding: 6px 12px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-sound:hover {
  background: #f1f3f4;
}

@media (min-width: 769px) {
  .word-chips {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
