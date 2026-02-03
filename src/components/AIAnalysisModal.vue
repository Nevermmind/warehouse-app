<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>🤖 AI 分析</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 时间范围选择 -->
        <div class="time-selector">
          <button
            @click="days = 7"
            :class="{ active: days === 7 }"
            class="day-btn"
          >
            近 7 天
          </button>
          <button
            @click="days = 30"
            :class="{ active: days === 30 }"
            class="day-btn"
          >
            近 30 天
          </button>
        </div>

        <!-- 分析按钮 -->
        <div class="analyze-section">
          <button
            @click="handleAnalyze"
            :disabled="analyzing || filteredRecords.length === 0"
            class="btn-analyze"
          >
            <span v-if="!analyzing">🚀 开始分析</span>
            <span v-else>🔄 分析中...</span>
          </button>
          <p v-if="filteredRecords.length === 0" class="no-data-hint">
            该时间段暂无数据
          </p>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="analysis-result">
          <div class="result-content" v-html="formattedAnalysis"></div>
        </div>

        <!-- 加载状态 -->
        <div v-if="analyzing" class="loading-state">
          <div class="spinner"></div>
          <p>AI 正在认真分析你的数据...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format, subDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const days = ref(7)
const analyzing = ref(false)
const analysisResult = ref('')

// 过滤指定天数的记录
const filteredRecords = computed(() => {
  if (props.records.length === 0) return []

  const now = new Date()
  const startDate = startOfDay(subDays(now, days.value))
  const startDateStr = startDate.toISOString()

  return props.records.filter(record => {
    return record.record_time >= startDateStr
  })
})

// 格式化分析结果（Markdown 转 HTML）
const formattedAnalysis = computed(() => {
  if (!analysisResult.value) return ''

  // 简单的 Markdown 转 HTML
  return analysisResult.value
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/- (.*)/g, '<li>$1</li>')
})

// 关闭弹窗
function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function close() {
  analysisResult.value = ''
  emit('close')
}

// 分析数据
async function handleAnalyze() {
  if (analyzing.value || filteredRecords.value.length === 0) return

  analyzing.value = true
  analysisResult.value = ''

  try {
    // 准备数据
    const prompt = prepareAnalysisPrompt()

    // 调用 DeepSeek API（通过 Netlify Function）
    const response = await fetch('/.netlify/functions/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是一个幽默风趣的放屁数据分析专家，擅长用轻松有趣的语言分析数据，并给出有趣的健康建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    analysisResult.value = data.choices[0].message.content

  } catch (error) {
    console.error('AI 分析失败:', error)
    analysisResult.value = `## 😱 分析失败\n\n出错啦：${error.message}\n\n请稍后再试或检查网络连接。`
  } finally {
    analyzing.value = false
  }
}

// 准备分析 prompt
function prepareAnalysisPrompt() {
  const records = filteredRecords.value
  const total = records.length

  // 统计数据
  const smellyCount = records.filter(r => r.is_smelly).length
  const avgSoundLevel = total > 0
    ? (records.reduce((sum, r) => sum + r.sound_level, 0) / total).toFixed(1)
    : 0

  // 按小时统计
  const hourlyStats = Array(24).fill(0)
  records.forEach(r => {
    const hour = new Date(r.record_time).getHours()
    hourlyStats[hour]++
  })
  const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats))

  // 拟声词统计
  const wordStats = {}
  records.forEach(r => {
    if (r.sound_word) {
      const key = r.sound_word.word
      wordStats[key] = (wordStats[key] || 0) + 1
    }
  })
  const topWord = Object.entries(wordStats).sort((a, b) => b[1] - a[1])[0]

  // 最近趋势（前3天vs后3天）
  const now = new Date()
  const midPoint = startOfDay(subDays(now, 3))
  const recentRecords = records.filter(r => new Date(r.record_time) >= midPoint)
  const earlierRecords = records.filter(r => new Date(r.record_time) < midPoint)
  const trend = recentRecords.length > earlierRecords.length ? '上升' :
                recentRecords.length < earlierRecords.length ? '下降' : '稳定'

  // 构建 prompt
  return `请以轻松有趣的风格分析以下放屁数据：

## 基本信息
- 分析周期：近 ${days.value} 天
- 总次数：${total} 次
- 平均声音等级：${avgSoundLevel} 星
- 臭屁占比：${((smellyCount / total) * 100).toFixed(1)}%
- 趋势：${trend}

## 详细数据
### 时间分布
- 高峰时段：${peakHour}:00 - ${peakHour + 1}:00
- 拟声词偏好：${topWord ? topWord[0] + '(' + topWord[1] + '次' : '无'}

### 最近记录样本
${records.slice(0, 5).map(r => {
  const time = format(new Date(r.record_time), 'MM月dd日 HH:mm', { locale: zhCN })
  const stars = '⭐'.repeat(r.sound_level)
  const smelly = r.is_smelly ? '臭' : '无臭'
  const word = r.sound_word ? r.sound_word.word : '无拟声词'
  return `- ${time} ${stars} ${smelly} ${word}`
}).join('\n')}

请从以下几个角度进行分析：
1. **整体评价**：用幽默的方式评价这个数据
2. **趋势分析**：近期是变多了还是变少了，可能的原因
3. **时段洞察**：什么时候最爱放屁，有没有规律
4. **声音分析**：声音等级说明了什么
5. **臭味分析**：臭味占比和健康关联
6. **趣味建议**：给出3-5个有趣又实用的小建议

请用轻松、幽默、有趣的语气，适当使用emoji，让分析结果既专业又好玩！`
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
  max-width: 700px;
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

.time-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
}

.day-btn {
  flex: 1;
  padding: 12px 20px;
  background: #F2F2F7;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s;
}

.day-btn:hover {
  background: #E5E5EA;
  color: #1C1C1E;
}

.day-btn.active {
  background: #1a73e8;
  color: white;
}

.analyze-section {
  margin-bottom: 24px;
  text-align: center;
}

.btn-analyze {
  padding: 16px 32px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.btn-analyze:hover:not(:disabled) {
  background: #1557b0;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-analyze:active:not(:disabled) {
  transform: translateY(0);
}

.btn-analyze:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-data-hint {
  margin-top: 12px;
  font-size: 14px;
  color: #8E8E93;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #E5E5EA;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 16px;
  color: #8E8E93;
}

.analysis-result {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.result-content {
  font-size: 15px;
  line-height: 1.8;
  color: #1C1C1E;
}

.result-content h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a73e8;
  margin: 20px 0 12px;
}

.result-content h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 16px 0 8px;
}

.result-content strong {
  color: #1a73e8;
  font-weight: 600;
}

.result-content li {
  margin-left: 20px;
  margin-bottom: 6px;
}

@media (max-width: 480px) {
  .modal-content {
    max-height: 95vh;
  }

  .btn-analyze {
    padding: 14px 24px;
    font-size: 16px;
  }

  .result-content {
    font-size: 14px;
  }
}
</style>
