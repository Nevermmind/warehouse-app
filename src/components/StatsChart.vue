<template>
  <div class="charts-container">
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
      <div class="chart-summary">
        <span class="summary-label">近{{ lineChartDays }}天总计：</span>
        <span class="summary-value">{{ lineChartTotal }} 次</span>
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
import { groupRecordsByDate, groupRecordsBySoundWord } from '../utils/chart-utils'

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
const lineChartDays = ref(7)
const barChartDays = ref(7)

let lineChart = null
let barChart = null

// 折线图总数
const lineChartTotal = computed(() => {
  const result = groupRecordsByDate(props.records, lineChartDays.value)
  return result.data.reduce((sum, count) => sum + count, 0)
})

// 初始化折线图
function initLineChart() {
  if (!lineChartRef.value) return

  const ctx = lineChartRef.value.getContext('2d')
  const { labels, data } = groupRecordsByDate(props.records, lineChartDays.value)

  if (lineChart) {
    lineChart.destroy()
  }

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '放屁次数',
        data,
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1a73e8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
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
              return `数量: ${context.parsed.y} 次`
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

  // 生成颜色
  const colors = [
    '#1a73e8', '#4285f4', '#5e97f6', '#7baaf7',
    '#8ab4f8', '#aecbfa', '#d2e3fc', '#e8f0fe'
  ]

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '次数',
        data,
        backgroundColor: colors.map(color => color + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8
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

// 监听时间范围变化
watch(lineChartDays, () => {
  const { labels, data } = groupRecordsByDate(props.records, lineChartDays.value)
  lineChart.data.labels = labels
  lineChart.data.datasets[0].data = data
  lineChart.update()
})

watch(barChartDays, () => {
  const { labels, data } = groupRecordsBySoundWord(props.records, barChartDays.value)
  barChart.data.labels = labels
  barChart.data.datasets[0].data = data
  barChart.update()
})

// 监听记录变化
watch(() => props.records, () => {
  initLineChart()
  initBarChart()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
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
  height: 250px;
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

  .toggle-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .chart-wrapper {
    height: 200px;
  }

  .summary-value {
    font-size: 20px;
  }
}
</style>
