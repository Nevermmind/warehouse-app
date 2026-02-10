<template>
  <div class="date-group">
    <!-- 水平时间轴区域 -->
    <div class="horizontal-timeline-section">
      <div class="timelines-container">
        <!-- 上班打卡时间线 -->
        <div v-if="typeGroups['上班'].length > 0" class="timeline-column">
          <CommuteTimeline :records="typeGroups['上班']" :dateLabel="formattedDate" :showDateLabel="true" lineType="work" />
        </div>

        <!-- 下班打卡时间线 -->
        <div v-if="typeGroups['下班'].length > 0" class="timeline-column">
          <CommuteTimeline
            :records="typeGroups['下班']"
            :dateLabel="formattedDate"
            :showDateLabel="typeGroups['上班'].length === 0"
            lineType="home"
          />
        </div>

        <!-- 未知打卡时间线 -->
        <div v-if="typeGroups['未知'].length > 0" class="timeline-column">
          <CommuteTimeline
            :records="typeGroups['未知']"
            :dateLabel="formattedDate"
            :showDateLabel="typeGroups['上班'].length === 0 && typeGroups['下班'].length === 0"
            lineType="unknown"
          />
        </div>
      </div>
    </div>

    <!-- 周分隔线（在周一的时间轴下方） -->
    <div v-if="showWeekDivider" class="week-divider">
      <div class="divider-line"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CommuteTimeline from './CommuteTimeline.vue'

const props = defineProps({
  date: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  showWeekDivider: {
    type: Boolean,
    default: false
  }
})

// 按trigger_type分组
const typeGroups = computed(() => {
  const groups = {
    '上班': [],
    '下班': [],
    '未知': []
  }

  props.items.forEach(item => {
    const type = item.trigger_type || '未知'
    if (groups[type]) {
      groups[type].push(item)
    }
  })

  return groups
})

// 格式化日期显示
const formattedDate = computed(() => {
  const date = new Date(props.date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 重置时间为 00:00:00 以便比较
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const todayReset = new Date(today)
  todayReset.setHours(0, 0, 0, 0)

  const yesterdayReset = new Date(yesterday)
  yesterdayReset.setHours(0, 0, 0, 0)

  const diffTime = todayReset - compareDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else {
    // 格式化为 "1.15"
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}.${day}`
  }
})
</script>

<style scoped>
.date-group {
  margin-bottom: 14px;
  max-width: 100%;
}

/* 周分隔线 */
.week-divider {
  width: 100%;
  padding: 16px 0;
}

.divider-line {
  width: 100%;
  height: 1px;
  background-color: #E5E5EA;
  margin: 0 auto;
}

/* --- 核心修复区域 --- */
.horizontal-timeline-section {
  margin-bottom: 14px;
  padding: 0;
  background: transparent;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.timelines-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-column {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 仅在移动端（屏幕小于 768px）开启水平滚动 */
@media (max-width: 768px) {
  .horizontal-timeline-section {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    /* 移动端稍微给点下边距，防止滚动条贴着内容 */
    padding-bottom: 20px; /* 从 4px 增加到 20px，给下方文字留出空间 */
    /* 缩短与下一个日期组之间的距离 */
    margin-bottom: 4px;
  }
}
/* ------------------ */
</style>
