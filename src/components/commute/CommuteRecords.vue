<template>
  <div class="commute-records-container">
    <!-- 添加记录按钮 -->
    <div class="add-section">
      <button @click="showAddModal = true" class="add-btn">
        + 新增{{ typeLabel }}记录
      </button>
    </div>

    <!-- 记录列表 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="records.length === 0" class="empty-state">
      <p>暂无{{ typeLabel }}记录</p>
    </div>

    <div v-else class="records-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-card"
      >
        <div class="record-header">
          <span class="record-date">{{ formatDate(record.record_date) }}</span>
          <div class="header-right">
            <span v-if="record.is_school_holiday" :class="['holiday-badge', getHolidayType(record.record_date) === '寒假' ? 'winter' : 'summer']">
              🏫 {{ getHolidayType(record.record_date) }}
            </span>
            <span class="record-duration">{{ calculateDuration(record) }} 分钟</span>
          </div>
        </div>

        <div class="record-details">
          <div class="detail-item">
            <span class="detail-label">出发时间：</span>
            <span class="detail-value">{{ record.departure_time }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">到达时间：</span>
            <span class="detail-value">{{ record.arrival_time }}</span>
          </div>
          <div v-if="record.route" class="detail-item">
            <span class="detail-label">路线：</span>
            <span class="detail-value">{{ record.route.route_name }}</span>
          </div>
          <div v-if="record.weather" class="detail-item">
            <span class="detail-label">天气：</span>
            <span class="detail-value">{{ record.weather }}</span>
          </div>
          <div v-if="record.notes" class="detail-item">
            <span class="detail-label">备注：</span>
            <span class="detail-value">{{ record.notes }}</span>
          </div>
        </div>

        <div class="record-actions">
          <button @click="handleEdit(record)" class="action-btn edit-btn">
            编辑
          </button>
          <button @click="handleDelete(record.id)" class="action-btn delete-btn">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal || editingRecord" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingRecord ? '编辑' : '新增' }}{{ typeLabel }}记录</h2>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>日期</label>
            <input
              v-model="formData.recordDate"
              type="date"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>出发时间</label>
            <input
              v-model="formData.departureTime"
              type="time"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>到达时间</label>
            <input
              v-model="formData.arrivalTime"
              type="time"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>路线（可选）</label>
            <select v-model="formData.routeId" class="form-input">
              <option :value="null">不选择路线</option>
              <option
                v-for="route in routes"
                :key="route.id"
                :value="route.id"
              >
                {{ route.route_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>天气（可选）</label>
            <select v-model="formData.weather" class="form-input">
              <option :value="null">不选择</option>
              <option value="晴">晴</option>
              <option value="多云">多云</option>
              <option value="阴">阴</option>
              <option value="雨">雨</option>
              <option value="雪">雪</option>
              <option value="雾">雾</option>
            </select>
          </div>

          <div class="form-group">
            <label>备注（可选）</label>
            <textarea
              v-model="formData.notes"
              class="form-textarea"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.isSchoolHoliday"
                class="checkbox-input"
              >
              <span>🏫 中小学生寒暑假</span>
            </label>
            <span class="checkbox-hint">勾选后根据日期自动标记为寒暑假（1-3月为寒假，6-9月为暑假）</span>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              {{ editingRecord ? '保存' : '添加' }}
            </button>
            <button type="button" @click="closeModal" class="cancel-btn">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  routes: {
    type: Array,
    default: () => []
  },
  commuteType: {
    type: String,
    required: true,
    validator: (value) => ['work', 'home'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  showAddTrigger: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['add', 'edit', 'delete'])

const showAddModal = ref(false)
const editingRecord = ref(null)
const formData = ref({
  recordDate: new Date().toISOString().split('T')[0],
  departureTime: '',
  arrivalTime: '',
  routeId: null,
  weather: null,
  notes: '',
  isSchoolHoliday: false
})

const typeLabel = computed(() => {
  return props.commuteType === 'work' ? '上班通勤' : '下班通勤'
})

function getHolidayType(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1

  // 寒假：1-3月
  if (month >= 1 && month <= 3) {
    return '寒假'
  }
  // 暑假：6-9月
  if (month >= 6 && month <= 9) {
    return '暑假'
  }

  return null
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日 ${weekday}`
}

function calculateDuration(record) {
  const [depHour, depMinute] = record.departure_time.split(':').map(Number)
  const [arrHour, arrMinute] = record.arrival_time.split(':').map(Number)

  const dep = new Date()
  dep.setHours(depHour, depMinute, 0, 0)

  const arr = new Date()
  arr.setHours(arrHour, arrMinute, 0, 0)

  if (arr < dep) {
    arr.setDate(arr.getDate() + 1)
  }

  return Math.round((arr - dep) / 1000 / 60)
}

function handleEdit(record) {
  editingRecord.value = record
  formData.value = {
    recordDate: record.record_date,
    departureTime: record.departure_time,
    arrivalTime: record.arrival_time,
    routeId: record.route_id,
    weather: record.weather,
    notes: record.notes || '',
    isSchoolHoliday: record.is_school_holiday || false
  }
}

function handleDelete(id) {
  emit('delete', id)
}

function closeModal() {
  showAddModal.value = false
  editingRecord.value = null
  formData.value = {
    recordDate: new Date().toISOString().split('T')[0],
    departureTime: '',
    arrivalTime: '',
    routeId: null,
    weather: null,
    notes: '',
    isSchoolHoliday: false
  }
}

function handleSubmit() {
  const data = {
    recordDate: formData.value.recordDate,
    commuteType: props.commuteType,
    departureTime: formData.value.departureTime,
    arrivalTime: formData.value.arrivalTime,
    routeId: formData.value.routeId,
    weather: formData.value.weather,
    notes: formData.value.notes || null,
    isSchoolHoliday: formData.value.isSchoolHoliday || false
  }

  if (editingRecord.value) {
    emit('edit', editingRecord.value.id, data)
  } else {
    emit('add', data)
  }

  closeModal()
}

// 监听外部触发器，自动打开弹窗
watch(() => props.showAddTrigger, (newVal) => {
  if (newVal > 0) {
    showAddModal.value = true
  }
})
</script>

<style scoped>
.commute-records-container {
  width: 100%;
}

.add-section {
  margin-bottom: 20px;
}

.add-btn {
  padding: 12px 24px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #1557b0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #8E8E93;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8E8E93;
}

.records-list {
  display: grid;
  gap: 15px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.record-card:hover {
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-date {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.record-duration {
  font-size: 18px;
  font-weight: 700;
  color: #1a73e8;
}

.record-details {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  font-size: 14px;
}

.detail-label {
  color: #8E8E93;
  min-width: 80px;
}

.detail-value {
  color: #1C1C1E;
  flex: 1;
}

.record-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.edit-btn:hover {
  background: #f1f3f4;
}

.delete-btn {
  background: #fce8e6;
  color: #d93025;
}

.delete-btn:hover {
  background: #fad2cf;
}

/* 弹窗样式 */
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
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
  margin: 0 0 24px;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #1C1C1E;
  font-size: 14px;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1a73e8;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn,
.cancel-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #1a73e8;
  color: white;
}

.submit-btn:hover {
  background: #1557b0;
}

.cancel-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.cancel-btn:hover {
  background: #f1f3f4;
}

/* 寒暑假标签样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.holiday-badge {
  display: inline-block;
  padding: 4px 10px;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.holiday-badge.winter {
  background: #4a90e2; /* 蓝色 - 寒假 */
}

.holiday-badge.summer {
  background: #ff6b6b; /* 红色 - 暑假 */
}

/* 复选框样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 6px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
}

.checkbox-label span:first-of-type {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.checkbox-hint {
  display: block;
  font-size: 12px;
  color: #8E8E93;
  margin-left: 26px;
}

@media (max-width: 768px) {
  .add-btn {
    width: 100%;
  }

  .modal-content {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
