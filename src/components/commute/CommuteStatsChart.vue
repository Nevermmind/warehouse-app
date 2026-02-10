<template>
  <div class="commute-chart-container">
    <div class="chart-card">
      <div class="chart-header">
        <h3>⏰ {{ chartTitle }}</h3>
        <div class="time-toggle">
          <button
            @click="timeRange = 'week'"
            :class="{ active: timeRange === 'week' }"
            class="toggle-btn"
          >
            近一周
          </button>
          <button
            @click="timeRange = 'monthByWeek'"
            :class="{ active: timeRange === 'monthByWeek' }"
            class="toggle-btn"
          >
            近一个月（按周）
          </button>
          <button
            @click="timeRange = 'month'"
            :class="{ active: timeRange === 'month' }"
            class="toggle-btn"
          >
            近一个月（按天）
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="chartRef"></canvas>
      </div>
      <div class="chart-summary chart-summary-average">
        <span class="summary-label">平均通勤时长：</span>
        <span class="summary-value">{{ averageDuration }} 分钟</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { Chart, registerables } from 'chart.js/auto'

// 注册 Chart.js 组件
Chart.register(...registerables)

const props = defineProps({
  workRecords: {
    type: Array,
    default: () => []
  },
  homeRecords: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    default: 'work'
  }
})

const chartRef = ref(null)
const timeRange = ref('week') // 'week' | 'month'
let chart = null

// 图表标题
const chartTitle = computed(() => {
  return props.activeTab === 'work' ? '上班通勤时长' : '下班通勤时长'
})

// 将时间字符串转换为分钟数（例如：8:30 -> 510）
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// 将分钟数转换为时间字符串（例如：510 -> 8:30）
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}:${mins.toString().padStart(2, '0')}`
}

// 获取近一周的日期范围（本周一到本周五，如果还没到则用上周的）
function getLastWeekDays() {
  const now = new Date()
  const currentDay = now.getDay()

  // 计算本周一
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + daysToMonday)
  thisMonday.setHours(0, 0, 0, 0)

  // 计算本周五
  const thisFriday = new Date(thisMonday)
  thisFriday.setDate(thisMonday.getDate() + 4)
  thisFriday.setHours(23, 59, 59, 999)

  return { start: thisMonday, end: thisFriday }
}

// 获取近30天的日期范围
function getLast30Days() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  now.setHours(23, 59, 59, 999)
  return { start: thirtyDaysAgo, end: now }
}

// 按星期几分组记录，计算每天的平均出发和到达时间（近一周）
function groupByWeekday(records) {
  const { start, end } = getLastWeekDays()

  // 过滤近一周的记录，只保留周一到周五（0=周日, 6=周六）
  const filteredRecords = records.filter(r => {
    const recordDate = new Date(r.record_date)
    const weekday = recordDate.getDay()
    const isWeekday = weekday >= 1 && weekday <= 5 // 周一到周五
    const inRange = recordDate >= start && recordDate <= end
    return inRange && isWeekday
  })

  // 按星期几分组（1=周一, 2=周二, ..., 5=周五）
  const weekdayGroups = {
    1: [], // 周一
    2: [], // 周二
    3: [], // 周三
    4: [], // 周四
    5: []  // 周五
  }

  filteredRecords.forEach(record => {
    const weekday = new Date(record.record_date).getDay()
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].push(record)
    }
  })

  // 计算每个工作日的平均出发和到达时间
  const averages = {}
  let totalDuration = 0
  let count = 0

  for (let weekday = 1; weekday <= 5; weekday++) {
    const groupRecords = weekdayGroups[weekday]
    if (groupRecords.length > 0) {
      const totalDeparture = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.departure_time), 0)
      const totalArrival = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.arrival_time), 0)

      const avgDeparture = Math.round(totalDeparture / groupRecords.length)
      const avgArrival = Math.round(totalArrival / groupRecords.length)

      averages[weekday] = [avgDeparture, avgArrival]

      // 累计通勤时长
      groupRecords.forEach(r => {
        const duration = timeToMinutes(r.arrival_time) - timeToMinutes(r.departure_time)
        totalDuration += duration
        count++
      })
    } else {
      averages[weekday] = null // 没有数据
    }
  }

  return { averages, averageDuration: count > 0 ? Math.round(totalDuration / count) : 0 }
}

// 按星期几分组记录（近一个月，显示周一到周五的平均值）
function groupByWeekdayFromMonth(records) {
  const { start, end } = getLast30Days()

  // 过滤近30天的记录，只保留周一到周五
  const filteredRecords = records.filter(r => {
    const recordDate = new Date(r.record_date)
    const weekday = recordDate.getDay()
    const isWeekday = weekday >= 1 && weekday <= 5
    const inRange = recordDate >= start && recordDate <= end
    return inRange && isWeekday
  })

  // 按星期几分组
  const weekdayGroups = {
    1: [], // 周一
    2: [], // 周二
    3: [], // 周三
    4: [], // 周四
    5: []  // 周五
  }

  filteredRecords.forEach(record => {
    const weekday = new Date(record.record_date).getDay()
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].push(record)
    }
  })

  // 计算每个工作日的平均出发和到达时间
  const averages = {}
  let totalDuration = 0
  let count = 0

  for (let weekday = 1; weekday <= 5; weekday++) {
    const groupRecords = weekdayGroups[weekday]
    if (groupRecords.length > 0) {
      const totalDeparture = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.departure_time), 0)
      const totalArrival = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.arrival_time), 0)

      const avgDeparture = Math.round(totalDeparture / groupRecords.length)
      const avgArrival = Math.round(totalArrival / groupRecords.length)

      averages[weekday] = [avgDeparture, avgArrival]

      // 累计通勤时长
      groupRecords.forEach(r => {
        const duration = timeToMinutes(r.arrival_time) - timeToMinutes(r.departure_time)
        totalDuration += duration
        count++
      })
    } else {
      averages[weekday] = null // 没有数据
    }
  }

  return { averages, averageDuration: count > 0 ? Math.round(totalDuration / count) : 0 }
}

// 按日期分组记录（近一个月）
function groupByDate(records) {
  const { start, end } = getLast30Days()

  // 过滤近30天的记录
  const filteredRecords = records.filter(r => {
    const recordDate = new Date(r.record_date)
    return recordDate >= start && recordDate <= end
  })

  // 按日期分组
  const dateGroups = {}
  let totalDuration = 0
  let count = 0

  filteredRecords.forEach(record => {
    const dateStr = record.record_date
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = []
    }
    dateGroups[dateStr].push(record)
  })

  // 生成近30天的所有日期
  const dates = []
  const data = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    date.setHours(0, 0, 0, 0)

    // 使用本地日期字符串，避免时区问题
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`

    if (dateGroups[dateStr] && dateGroups[dateStr].length > 0) {
      const groupRecords = dateGroups[dateStr]
      const totalDeparture = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.departure_time), 0)
      const totalArrival = groupRecords.reduce((sum, r) => sum + timeToMinutes(r.arrival_time), 0)

      const avgDeparture = Math.round(totalDeparture / groupRecords.length)
      const avgArrival = Math.round(totalArrival / groupRecords.length)

      dates.push(dayLabel)
      data.push([avgDeparture, avgArrival])

      // 累计通勤时长
      groupRecords.forEach(r => {
        const duration = timeToMinutes(r.arrival_time) - timeToMinutes(r.departure_time)
        totalDuration += duration
        count++
      })
    }
  }

  return { dates, data, averageDuration: count > 0 ? Math.round(totalDuration / count) : 0 }
}

// 计算平均通勤时长
const averageDuration = computed(() => {
  const records = props.activeTab === 'work' ? props.workRecords : props.homeRecords
  if (timeRange.value === 'week') {
    const { averageDuration } = groupByWeekday(records)
    return averageDuration
  } else if (timeRange.value === 'monthByWeek') {
    const { averageDuration } = groupByWeekdayFromMonth(records)
    return averageDuration
  } else {
    const { averageDuration } = groupByDate(records)
    return averageDuration
  }
})

// 初始化图表
function initChart() {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')

  // 根据当前tab选择对应的数据
  const records = props.activeTab === 'work' ? props.workRecords : props.homeRecords

  let labels, data

  if (timeRange.value === 'week') {
    // 近一周：按星期几分组
    const { averages } = groupByWeekday(records)
    labels = ['周一', '周二', '周三', '周四', '周五']
    data = [1, 2, 3, 4, 5].map(w => averages[w])
  } else if (timeRange.value === 'monthByWeek') {
    // 近一个月（按周）：按星期几分组，但使用近30天的数据
    const { averages } = groupByWeekdayFromMonth(records)
    labels = ['周一', '周二', '周三', '周四', '周五']
    data = [1, 2, 3, 4, 5].map(w => averages[w])
  } else {
    // 近一个月（按天）：按日期分组
    const result = groupByDate(records)
    labels = result.dates
    data = result.data
  }

  // 计算Y轴范围
  const allTimes = data.filter(d => d !== null).flat()
  const minTime = Math.min(...allTimes) - 30 // 提前30分钟
  const maxTime = Math.max(...allTimes) + 30 // 延后30分钟

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '通勤时间',
        data: data,
        backgroundColor: props.activeTab === 'work' ? 'rgba(26, 115, 232, 0.7)' : 'rgba(255, 149, 0, 0.7)',
        borderColor: props.activeTab === 'work' ? '#1a73e8' : '#FF9500',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: timeRange.value === 'month' ? 0.8 : 0.55 // 近一个月（按天）时条形更窄，其他使用正常宽度
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false // 隐藏图例
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              const value = context.raw
              if (value === null || !Array.isArray(value)) {
                return '无数据'
              }
              const [start, end] = value
              const duration = end - start
              return `出发: ${minutesToTime(start)} | 到达: ${minutesToTime(end)} | 时长: ${duration}分钟`
            }
          }
        }
      },
      scales: {
        y: {
          reverse: true, // 反转Y轴，让时间从上到下递增（8点在8点半上面）
          title: {
            display: true,
            text: '时间',
            font: { size: 12, weight: '600' }
          },
          min: minTime,
          max: maxTime,
          ticks: {
            font: { size: 12 },
            stepSize: 30,
            callback: function(value, index, ticks) {
              // 隐藏第一个和最后一个刻度标签
              if (index === 0 || index === ticks.length - 1) {
                return ''
              }
              return minutesToTime(value)
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: timeRange.value === 'month' ? 10 : 13, weight: '500' },
            autoSkip: true,
            maxTicksLimit: timeRange.value === 'month' ? 10 : undefined
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// 监听记录变化、tab切换和时间范围切换
watch(() => [props.workRecords, props.homeRecords, props.activeTab, timeRange.value], () => {
  initChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})
</script>

<style scoped>
.commute-chart-container {
  width: 100%;
  margin-bottom: 25px;
}

.chart-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #1C1C1E;
  font-size: 18px;
  font-weight: 600;
}

/* 时间切换按钮 */
.time-toggle {
  display: flex;
  gap: 8px;
  background: #F2F2F7;
  padding: 4px;
  border-radius: 10px;
}

.toggle-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: #1C1C1E;
}

.toggle-btn.active {
  background: white;
  color: #1a73e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-wrapper {
  position: relative;
  height: 265px;
  margin-bottom: 16px;
}

.chart-summary {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #E5E5EA;
}

.chart-summary-average {
  margin-top: -60px; /* 往上移动60px */
}

/* 桌面端向下移动16px，减少间距 */
@media (min-width: 481px) {
  .chart-summary-average {
    margin-top: -44px; /* -60px + 16px */
    padding-top: 10px; /* 减少与横线和下边界的距离2px */
  }
}

.summary-label {
  font-size: 14px;
  color: #8E8E93;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a73e8;
  margin-left: 8px;
}

@media (max-width: 480px) {
  .chart-card {
    padding: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .chart-header h3 {
    font-size: 16px;
  }

  .time-toggle {
    align-self: flex-end;
  }

  .toggle-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .chart-wrapper {
    height: 200px;
  }

  .summary-label,
  .summary-value {
    font-size: 13px;
  }
}
</style>
