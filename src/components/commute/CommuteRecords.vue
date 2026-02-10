<template>
  <div class="commute-records-container">
    <!-- 添加记录按钮（当 hideAddButton 为 false 时显示） -->
    <div v-if="!hideAddButton" class="add-section">
      <button @click="showAddModal = true" class="add-btn">
        + 新增{{ typeLabel }}记录
      </button>
    </div>

    <!-- 筛选按钮 -->
    <div v-if="!loading && records.length > 0" class="filter-section">
      <button
        @click="filterType = 'all'"
        :class="['filter-btn', { active: filterType === 'all' }]"
      >
        全部 ({{ records.length }})
      </button>
      <button
        @click="filterType = 'thisWeek'"
        :class="['filter-btn', { active: filterType === 'thisWeek' }]"
      >
        本周 ({{ thisWeekCount }})
      </button>
      <button
        @click="filterType = 'lastWeek'"
        :class="['filter-btn', { active: filterType === 'lastWeek' }]"
      >
        上周 ({{ lastWeekCount }})
      </button>
    </div>

    <!-- 记录列表 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="filteredRecords.length === 0" class="empty-state">
      <p>暂无{{ typeLabel }}记录</p>
    </div>

    <div v-else>
      <div class="records-list">
        <div
          v-for="record in paginatedRecords"
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

    <!-- 分页控件 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} / {{ totalPages }} 页
      </span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal || editingRecord" class="modal-overlay" @click="closeModal">
      <div class="modal-content commute-modal" @click.stop>
        <div class="commute-modal-header">
          <h2>{{ editingRecord ? '编辑' : '新增' }}{{ typeLabel }}记录</h2>
          <button @click="closeModal" class="commute-close-btn">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="commute-form-fields">
          <div class="commute-field">
            <label class="commute-label">日期</label>
            <input
              v-model="formData.recordDate"
              type="date"
              required
              class="commute-input"
            >
          </div>

          <div class="commute-field">
            <label class="commute-label">出发时间</label>
            <input
              v-model="formData.departureTime"
              type="time"
              required
              class="commute-input"
            >
          </div>

          <div class="commute-field">
            <label class="commute-label">到达时间</label>
            <input
              v-model="formData.arrivalTime"
              type="time"
              required
              class="commute-input"
            >
          </div>

          <div class="commute-field">
            <label class="commute-label">路线（可选）</label>
            <select v-model="formData.routeId" class="commute-input commute-select">
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

          <div class="commute-field">
            <label class="commute-label">天气（可选）</label>
            <select v-model="formData.weather" class="commute-input commute-select">
              <option :value="null">不选择</option>
              <option value="晴">晴</option>
              <option value="多云">多云</option>
              <option value="阴">阴</option>
              <option value="雨">雨</option>
              <option value="雪">雪</option>
              <option value="雾">雾</option>
            </select>
          </div>

          <div class="commute-field">
            <label class="commute-label">备注（可选）</label>
            <textarea
              v-model="formData.notes"
              class="commute-input commute-textarea"
              rows="3"
              maxlength="200"
            ></textarea>
          </div>

          <div class="commute-field">
            <label class="commute-checkbox-label">
              <input
                type="checkbox"
                v-model="formData.isSchoolHoliday"
                class="commute-checkbox"
              >
              <span class="commute-checkbox-text">🏫 中小学生寒暑假</span>
            </label>
            <span class="commute-checkbox-hint">勾选后根据日期自动标记为寒暑假（1-3月为寒假，6-9月为暑假）</span>
          </div>

          <div class="commute-actions">
            <button type="submit" class="commute-submit-btn">
              {{ editingRecord ? '保存' : '添加' }}
            </button>
            <button type="button" @click="closeModal" class="commute-cancel-btn">
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
  },
  hideAddButton: {
    type: Boolean,
    default: false
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

// 筛选状态
const filterType = ref('all') // 'all' | 'thisWeek' | 'lastWeek'

// 分页状态
const currentPage = ref(1)
const pageSize = 10

const typeLabel = computed(() => {
  return props.commuteType === 'work' ? '上班通勤' : '下班通勤'
})

// 计算本周的周一和周日
function getThisWeekRange() {
  const now = new Date()
  const currentDay = now.getDay()
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay

  const monday = new Date(now)
  monday.setDate(now.getDate() + daysToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

// 计算上周的周一和周日
function getLastWeekRange() {
  const { monday: thisMonday } = getThisWeekRange()

  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)

  const lastSunday = new Date(thisMonday)
  lastSunday.setDate(thisMonday.getDate() - 1)
  lastSunday.setHours(23, 59, 59, 999)

  return { monday: lastMonday, sunday: lastSunday }
}

// 检查记录是否在指定日期范围内
function isRecordInRange(recordDate, start, end) {
  const date = new Date(recordDate)
  return date >= start && date <= end
}

// 计算本周记录数
const thisWeekCount = computed(() => {
  const { monday, sunday } = getThisWeekRange()
  return props.records.filter(r => isRecordInRange(r.record_date, monday, sunday)).length
})

// 计算上周记录数
const lastWeekCount = computed(() => {
  const { monday, sunday } = getLastWeekRange()
  return props.records.filter(r => isRecordInRange(r.record_date, monday, sunday)).length
})

// 根据筛选类型过滤记录
const filteredRecords = computed(() => {
  if (filterType.value === 'thisWeek') {
    const { monday, sunday } = getThisWeekRange()
    return props.records.filter(r => isRecordInRange(r.record_date, monday, sunday))
  } else if (filterType.value === 'lastWeek') {
    const { monday, sunday } = getLastWeekRange()
    return props.records.filter(r => isRecordInRange(r.record_date, monday, sunday))
  }
  return props.records
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize)
})

// 当前页的记录
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredRecords.value.slice(start, end)
})

// 监听筛选类型变化，重置到第一页
watch(filterType, () => {
  currentPage.value = 1
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

/* 筛选按钮样式 */
.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f1f3f4;
}

.filter-btn.active {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 0;
}

.page-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f3f4;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
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

/* 通勤表单特定样式 */
.commute-modal {
  padding: 0;
}

.commute-modal-header {
  position: relative;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #E5E5EA;
}

.commute-modal-header h2 {
  margin: 0;
  padding: 0;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.commute-close-btn {
  position: absolute;
  top: 50%;
  right: 24px;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  font-size: 28px;
  line-height: 1;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #8E8E93;
  border-radius: 6px;
  -webkit-transition: all 0.2s;
  transition: all 0.2s;
}

.commute-close-btn:hover {
  background: #F2F2F7;
  color: #1C1C1E;
}

.commute-form-fields {
  padding: 24px;
}

.commute-field {
  margin-bottom: 16px;
}

.commute-field-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.commute-field-row .commute-field {
  flex: 1;
  min-width: 0;
}

.commute-label {
  display: block;
  margin-bottom: 6px;
  color: #1C1C1E;
  font-size: 14px;
  font-weight: 500;
}

.commute-input {
  width: 100%;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  background: white;
  display: block;
  transition: border-color 0.2s;
  /* Force reset native mobile styles */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.commute-input:focus {
  outline: none;
  border-color: #1a73e8;
}

.commute-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

.commute-select {
  cursor: pointer;
}

/* 复选框样式 */
.commute-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 6px;
}

.commute-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.commute-checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.commute-checkbox-hint {
  display: block;
  font-size: 12px;
  color: #8E8E93;
  margin-top: 4px;
  margin-left: 26px;
}

/* 按钮样式 */
.commute-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.commute-submit-btn,
.commute-cancel-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.commute-submit-btn {
  background: #1a73e8;
  color: white;
}

.commute-submit-btn:hover {
  background: #1557b0;
}

.commute-cancel-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.commute-cancel-btn:hover {
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
  background: #4a90e2;
}

.holiday-badge.summer {
  background: #ff6b6b;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .filter-section {
    gap: 8px;
  }

  .filter-btn {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
  }

  .pagination {
    gap: 12px;
    padding: 12px 0;
  }

  .page-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .page-info {
    font-size: 13px;
  }

  .add-btn {
    width: 100%;
  }

  .modal-content {
    padding: 0;
    max-height: 95vh;
  }

  .commute-modal-header {
    padding: 16px 20px;
  }

  .commute-modal-header h2 {
    font-size: 18px;
  }

  .commute-form-fields {
    padding: 20px;
  }

  .commute-field-row {
    flex-direction: column;
    gap: 12px;
  }

  /* 统一移动端输入框样式 */
  .commute-input,
  .commute-select,
  .commute-textarea {
    font-size: 16px !important;
    padding: 10px 12px !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    border-radius: 8px !important;
    background-color: #fff !important;
    -webkit-border-radius: 8px !important;
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }

  /* 针对日期和时间输入的特殊处理 */
  input[type="date"].commute-input,
  input[type="time"].commute-input {
    -webkit-appearance: none !important;
    -webkit-border-radius: 8px !important;
    border-radius: 8px !important;
    background-color: #fff !important;
    -webkit-box-shadow: none !important;
    box-shadow: none !important;
  }

  .commute-textarea {
    min-height: 100px !important;
  }

  .commute-actions {
    flex-direction: column;
  }

  .commute-submit-btn,
  .commute-cancel-btn {
    width: 100%;
  }
}
</style>
