<template>
  <div class="charts-container">
    <!-- 折线图：每小时分布 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>⏰ 每小时分布</h3>
        <div class="time-toggle">
          <button
            @click="hourlyChartDays = 1"
            :class="{ active: hourlyChartDays === 1 }"
            class="toggle-btn"
          >
            今天
          </button>
          <button
            @click="hourlyChartDays = 7"
            :class="{ active: hourlyChartDays === 7 }"
            class="toggle-btn"
          >
            近七天
          </button>
          <button
            @click="hourlyChartDays = 30"
            :class="{ active: hourlyChartDays === 30 }"
            class="toggle-btn"
          >
            近一个月
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="hourlyChartRef"></canvas>
      </div>
    </div>

    <!-- 折线图：每日数量趋势 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>📈 数量趋势</h3>
        <div class="time-toggle">
          <button
            @click="lineChartDays = 7"
            :class="{ active: lineChartDays === 7 }"
            class="toggle-btn"
          >
            7天
          </button>
          <button
            @click="lineChartDays = 30"
            :class="{ active: lineChartDays === 30 }"
            class="toggle-btn"
          >
            30天
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="lineChartRef"></canvas>
      </div>
    </div>

    <!-- 条形图：拟声词分布 -->
    <div class="chart-card">
      <div class="chart-header">
        <h3>📊 拟声词分布</h3>
        <div class="time-toggle">
          <button
            @click="barChartDays = 7"
            :class="{ active: barChartDays === 7 }"
            class="toggle-btn"
          >
            7天
          </button>
          <button
            @click="barChartDays = 30"
            :class="{ active: barChartDays === 30 }"
            class="toggle-btn"
          >
            30天
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="barChartRef"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js/auto'
import { groupRecordsByDate, groupRecordsBySoundWord, groupSmellyFartsByDate, groupRecordsByHour } from '../../utils/chart-utils'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

// 注册 Chart.js 组件
Chart.register(...registerables)

const lineChartRef = ref(null)
const barChartRef = ref(null)
const hourlyChartRef = ref(null)
const lineChartDays = ref(7)
const barChartDays = ref(7)
const hourlyChartDays = ref(1)

let lineChart = null
let barChart = null
let hourlyChart = null

// 折线图总数
const lineChartTotal = computed(() => {
  const result = groupRecordsByDate(props.records, lineChartDays.value)
  return result.data.reduce((sum, count) => sum + count, 0)
})

// 每小时图表标签
const hourlyChartDaysLabel = computed(() => {
  if (hourlyChartDays.value === 1) return '今天'
  if (hourlyChartDays.value === 7) return '近七天'
  return '近一个月'
})

// 每小时图表总数
const hourlyChartTotal = computed(() => {
  const result = groupRecordsByHour(props.records, hourlyChartDays.value)
  return result.data.reduce((sum, count) => sum + count, 0)
})

// 初始化折线图
function initLineChart() {
  if (!lineChartRef.value) return

  const ctx = lineChartRef.value.getContext('2d')
  const { labels, data: totalData } = groupRecordsByDate(props.records, lineChartDays.value)
  const { data: smellyData } = groupSmellyFartsByDate(props.records, lineChartDays.value)

  if (lineChart) {
    lineChart.destroy()
  }

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '放屁次数',
          data: totalData,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.15)',
          borderWidth: 3,
          fill: '+1', // 填充到下一个数据集（橙色线）
          tension: 0.4,
          pointBackgroundColor: '#1a73e8',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: '臭屁次数',
          data: smellyData,
          borderColor: '#FF9500', // 橙色
          backgroundColor: 'rgba(255, 149, 0, 0.15)',
          borderWidth: 3,
          fill: true, // 填充到X轴
          tension: 0.4,
          pointBackgroundColor: '#FF9500',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} 次`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: 11 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// 初始化条形图
function initBarChart() {
  if (!barChartRef.value) return

  const ctx = barChartRef.value.getContext('2d')
  const { labels, data } = groupRecordsBySoundWord(props.records, barChartDays.value)

  if (barChart) {
    barChart.destroy()
  }

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '次数',
        data,
        backgroundColor: '#1a73e8', // 统一使用蓝色
        borderColor: 'transparent', // 边框透明
        borderWidth: 0,
        borderRadius: 8,
        barPercentage: 0.6 // 条形宽度（0.6 = 60%，默认是0.9）
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              return `次数: ${context.parsed.y} 次`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: 11 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// 初始化每小时分布图
function initHourlyChart() {
  if (!hourlyChartRef.value) return

  const ctx = hourlyChartRef.value.getContext('2d')
  const { labels, data } = groupRecordsByHour(props.records, hourlyChartDays.value)

  if (hourlyChart) {
    hourlyChart.destroy()
  }

  hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '放屁次数',
        data,
        borderColor: '#34C759', // 绿色
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#34C759',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} 次`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// 监听时间范围变化
watch(lineChartDays, () => {
  const { labels, data: totalData } = groupRecordsByDate(props.records, lineChartDays.value)
  const { data: smellyData } = groupSmellyFartsByDate(props.records, lineChartDays.value)
  lineChart.data.labels = labels
  lineChart.data.datasets[0].data = totalData
  lineChart.data.datasets[1].data = smellyData
  lineChart.update()
})

watch(barChartDays, () => {
  const { labels, data } = groupRecordsBySoundWord(props.records, barChartDays.value)
  barChart.data.labels = labels
  barChart.data.datasets[0].data = data
  barChart.update()
})

watch(hourlyChartDays, () => {
  const { labels, data } = groupRecordsByHour(props.records, hourlyChartDays.value)
  hourlyChart.data.labels = labels
  hourlyChart.data.datasets[0].data = data
  hourlyChart.update()
})

// 监听记录变化
watch(() => props.records, () => {
  initLineChart()
  initBarChart()
  initHourlyChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initHourlyChart()
    initLineChart()
    initBarChart()
  })
})
</script>

<style scoped>
.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
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

.time-toggle {
  display: flex;
  gap: 8px;
  background: #F2F2F7;
  padding: 4px;
  border-radius: 10px;
}

.toggle-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
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
  height: 205px;
  margin-bottom: 16px;
}

.chart-summary {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #E5E5EA;
}

.summary-label {
  font-size: 14px;
  color: #8E8E93;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a73e8;
  margin-left: 8px;
}

@media (max-width: 480px) {
  .chart-card {
    padding: 16px;
  }

  .chart-header h3 {
    font-size: 16px;
  }

  .time-toggle {
    gap: 4px;
    padding: 3px;
  }

  .toggle-btn {
    padding: 4px 8px;
    font-size: 11px;
  }

  .chart-wrapper {
    height: 155px;
  }

  .summary-value {
    font-size: 20px;
  }
}
</style>
