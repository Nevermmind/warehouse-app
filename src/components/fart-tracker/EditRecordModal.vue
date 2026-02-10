<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <h3>编辑记录</h3>

      <!-- 记录时间（只读） -->
      <div class="form-field">
        <label>记录时间</label>
        <input type="text" :value="formatTime(record?.record_time)" disabled class="disabled-input">
      </div>

      <!-- 声音等级 -->
      <div class="form-field">
        <label>声音等级（可选）</label>
        <div class="star-rating">
          <span
            v-for="i in 5"
            :key="i"
            @click="soundLevel = soundLevel === i ? 0 : i"
            :class="{ active: i <= soundLevel }"
            class="star"
          >
            ⭐
          </span>
          <span
            @click="soundLevel = 0"
            :class="{ active: soundLevel === 0 }"
            class="star silent-star"
          >
            🔇 无
          </span>
        </div>
      </div>

      <!-- 臭/不臭 -->
      <div class="form-field">
        <label>味道</label>
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

      <!-- 拟声词选择 -->
      <div class="form-field">
        <label>拟声词</label>
        <div class="sound-word-selector">
          <div
            v-for="word in soundWords"
            :key="word.id"
            @click="soundWordId = word.id"
            :class="{ active: soundWordId === word.id }"
            class="sound-word-chip"
          >
            {{ word.word }}
          </div>
          <div
            @click="soundWordId = null"
            :class="{ active: soundWordId === null }"
            class="sound-word-chip"
          >
            无
          </div>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-field">
        <label>备注（可选）</label>
        <textarea v-model="notes" rows="3" placeholder="添加备注..."></textarea>
      </div>

      <!-- 按钮组 -->
      <div class="button-group">
        <button @click="handleClose" class="btn-cancel">取消</button>
        <button @click="handleSave" class="btn-save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const props = defineProps({
  show: Boolean,
  record: Object,
  soundWords: Array
})

const emit = defineEmits(['close', 'save'])

// 表单字段
const soundLevel = ref(3)
const isSmelly = ref(false)
const notes = ref('')
const soundWordId = ref(null)

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
}

// 监听 record prop 变化，初始化表单
watch(() => props.record, (newRecord) => {
  if (newRecord) {
    soundLevel.value = newRecord.sound_level
    isSmelly.value = newRecord.is_smelly
    notes.value = newRecord.notes || ''
    soundWordId.value = newRecord.sound_word_id
  }
}, { immediate: true })

function handleSave() {
  const updateData = {
    sound_level: soundLevel.value || 0,  // 0 表示无声
    is_smelly: isSmelly.value,
    notes: notes.value,
    sound_word_id: soundWordId.value
  }
  emit('save', props.record.id, updateData)
}

function handleClose() {
  emit('close')
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
  padding: 24px;
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

.modal-content h3 {
  margin: 0 0 20px;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  color: #8E8E93;
  font-size: 14px;
  font-weight: 500;
}

.form-field input[type="text"],
.form-field textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5EA;
  border-radius: 10px;
  font-size: 16px;
  color: #1C1C1E;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-field input[type="text"]:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.disabled-input {
  background: #F2F2F7;
  color: #8E8E93;
  cursor: not-allowed;
}

.star-rating {
  display: flex;
  gap: 8px;
}

.star {
  font-size: 32px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s, transform 0.2s;
}

.star:hover {
  transform: scale(1.1);
}

.star.active {
  opacity: 1;
}

.silent-star {
  font-size: 24px;
  line-height: 32px;
  padding: 0 4px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-top: 5px;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 51px;
  height: 31px;
  background: #E5E5EA;
  border-radius: 15.5px;
  transition: background 0.3s;
  margin-top: -5px;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 27px;
  height: 27px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: linear-gradient(to right, #34C759 20px, #E5E5EA 20px);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 16px;
  color: #1C1C1E;
  margin-left: 60px;
  margin-top: 10px;
}

.sound-word-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sound-word-chip {
  padding: 8px 16px;
  background: #F2F2F7;
  border-radius: 20px;
  font-size: 14px;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s;
}

.sound-word-chip:hover {
  background: #E5E5EA;
}

.sound-word-chip.active {
  background: #007AFF;
  color: white;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.button-group button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #F2F2F7;
  color: #8E8E93;
}

.btn-cancel:hover {
  background: #E5E5EA;
}

.btn-save {
  background: #1a73e8;
  color: white;
}

.btn-save:hover {
  background: #1557b0;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 20px;
  }

  .sound-word-selector {
    gap: 6px;
  }

  .sound-word-chip {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
