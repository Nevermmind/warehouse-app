<template>
  <div class="record-list-container">
    <div class="list-header">
      <h3>📝 最近记录</h3>
      <span class="record-count">共 {{ totalCount }} 条</span>
    </div>

    <div v-if="paginatedRecords.length === 0" class="empty-state">
      暂无记录，快去添加吧！
    </div>

    <div v-else class="record-list">
      <div
        v-for="record in paginatedRecords"
        :key="record.id"
        class="record-item"
      >
        <div class="record-main">
          <div class="record-time">
            {{ formatTime(record.record_time) }}
          </div>
          <div class="record-stars">
            {{ getStars(record.sound_level) }}
          </div>
        </div>

        <div class="record-details">
          <span v-if="record.sound_word" class="record-word">
            {{ record.sound_word.word }} ({{ getToneLabel(record.sound_word.tone) }})
          </span>
          <span v-if="record.is_smelly" class="record-smelly">💩 臭</span>
          <span v-else class="record-clean">✨ 无臭</span>
          <span v-if="record.notes" class="record-notes">{{ record.notes }}</span>
        </div>

        <button
          @click="handleDelete(record.id)"
          class="btn-delete-record"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['delete'])

const PAGE_SIZE = 10
const currentPage = ref(1)

// 总记录数
const totalCount = computed(() => props.records.length)

// 总页数
const totalPages = computed(() => Math.ceil(totalCount.value / PAGE_SIZE))

// 当前页的记录
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return props.records.slice(start, end)
})

// 格式化时间（使用北京时间 UTC+8）
function formatTime(timeStr) {
  const date = new Date(timeStr)
  const now = new Date()

  // 转换为北京时间（UTC+8）
  const beijingOffset = 8 * 60 // 北京时间是 UTC+8（8小时 = 480分钟）
  const localOffset = now.getTimezoneOffset() // 本地时区偏移（分钟）
  const totalOffset = beijingOffset + localOffset // 总偏移量

  // 调整后的时间
  const beijingDate = new Date(date.getTime() + totalOffset * 60000)
  const beijingNow = new Date(now.getTime() + totalOffset * 60000)

  const diffMs = beijingNow - beijingDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  // 超过7天显示具体日期（使用北京时间）
  return format(beijingDate, 'MM月dd日 HH:mm', { locale: zhCN })
}

// 获取星星
function getStars(level) {
  return '⭐'.repeat(level) + '☆'.repeat(5 - level)
}

// 获取声调标签
function getToneLabel(tone) {
  const toneMap = {
    1: '一声',
    2: '二声',
    3: '三声',
    4: '四声',
    5: '轻声'
  }
  return toneMap[tone] || ''
}

// 处理删除
function handleDelete(id) {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', id)
  }
}

// 监听记录变化，重置到第一页
watch(() => props.records.length, () => {
  currentPage.value = 1
})
</script>

<script>
import { watch } from 'vue'
export default {
  name: 'RecordList'
}
</script>

<style scoped>
.record-list-container {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin: 0;
  color: #1C1C1E;
  font-size: 18px;
  font-weight: 600;
}

.record-count {
  font-size: 14px;
  color: #8E8E93;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #8E8E93;
  font-size: 15px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #F2F2F7;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
}

.record-item:hover {
  background: #E5E5EA;
  transform: translateX(4px);
}

.record-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.record-time {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.record-stars {
  font-size: 14px;
  letter-spacing: 2px;
}

.record-details {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.record-word {
  font-size: 14px;
  color: #1a73e8;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(26, 115, 232, 0.1);
  border-radius: 6px;
}

.record-smelly,
.record-clean {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 6px;
}

.record-smelly {
  color: #FF9500;
  background: rgba(255, 149, 0, 0.1);
}

.record-clean {
  color: #1a73e8;
  background: rgba(26, 115, 232, 0.1);
}

.record-notes {
  font-size: 13px;
  color: #8E8E93;
  font-style: italic;
}

.btn-delete-record {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.record-item:hover .btn-delete-record {
  opacity: 1;
}

.btn-delete-record:hover {
  transform: scale(1.2);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E5EA;
}

.page-btn {
  padding: 8px 16px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #1557b0;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

@media (max-width: 480px) {
  .record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .record-main {
    width: 100%;
  }

  .record-details {
    width: 100%;
  }

  .btn-delete-record {
    position: absolute;
    top: 14px;
    right: 14px;
    opacity: 1;
  }
}
</style>
