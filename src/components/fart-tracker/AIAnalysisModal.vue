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
          <button
            @click="days = 1"
            :class="{ active: days === 1 }"
            class="day-btn"
          >
            近 24 小时
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

          <!-- 正常生成后的操作按钮 -->
          <div v-if="!showCopyPromptButton" class="result-actions">
            <button @click="copyReport" class="btn-copy-report">
              📋 复制报告
            </button>
            <button @click="sendEmail" :disabled="isSendingEmail" class="btn-send-email">
              <span v-if="!isSendingEmail">📧 发送邮件</span>
              <span v-else>发送中...</span>
            </button>
          </div>

          <!-- 超时后的复制提示词按钮 -->
          <button
            v-if="showCopyPromptButton"
            @click="copyPrompt"
            class="btn-copy-prompt"
          >
            📋 复制提示词
          </button>
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
import { format, subDays, subHours, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { supabase } from '../../utils/supabase'

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
const showCopyPromptButton = ref(false)
const lastPrompt = ref('')
const isSendingEmail = ref(false)

// 过滤指定天数的记录
const filteredRecords = computed(() => {
  if (props.records.length === 0) return []

  const now = new Date()
  let startDate

  // 1天时使用小时级过滤（24小时）
  if (days.value === 1) {
    startDate = subHours(now, 24)
  } else {
    startDate = startOfDay(subDays(now, days.value))
  }

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
  showCopyPromptButton.value = false
  lastPrompt.value = ''
  emit('close')
}

// 分析数据
async function handleAnalyze() {
  if (analyzing.value || filteredRecords.value.length === 0) return

  analyzing.value = true
  analysisResult.value = ''
  showCopyPromptButton.value = false

  try {
    // 准备数据
    const prompt = prepareAnalysisPrompt()
    lastPrompt.value = prompt  // 保存提示词用于超时时复制

    const messages = [
      {
        role: 'system',
        content: '你是一个幽默风趣的放屁数据分析专家，擅长用轻松有趣的语言分析数据，并给出有趣的健康建议。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    let response, data

    // 检查是否有本地 API Key（本地开发模式）
    const localApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

    if (localApiKey) {
      // 本地开发：直接调用 DeepSeek API
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.8,
          max_tokens: 400
        })
      })
    } else {
      // 生产环境：使用 Netlify Functions
      response = await fetch('/.netlify/functions/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          temperature: 0.8,
          max_tokens: 400
        })
      })
    }

    data = await response.json()

    // 检查是否超时
    if (response.status === 408 || data.error === 'AI 分析超时') {
      // 显示提示词和复制按钮
      analysisResult.value = `
=== ⏰ AI 分析超时 ===

由于网络原因，AI 分析超时了。您可以：

1️⃣ 点击下方按钮复制提示词
2️⃣ 粘贴到 ChatGPT/Claude/DeepSeek 等软件
3️⃣ 将生成的结果粘贴回来查看

---

【提示词】：
${data.prompt || lastPrompt.value}

---
      `
      showCopyPromptButton.value = true
      return
    }

    if (!response.ok) {
      throw new Error(data.error?.message || data.error || `API 请求失败: ${response.status}`)
    }

    analysisResult.value = data.choices[0].message.content

  } catch (error) {
    console.error('AI 分析失败:', error)

    // 检查是否超时
    if (error.error === 'AI 分析超时' && error.prompt) {
      analysisResult.value = `
=== ⏰ AI 分析超时 ===

由于网络原因，AI 分析超时了。您可以：

1️⃣ 点击下方按钮复制提示词
2️⃣ 粘贴到 ChatGPT/Claude/DeepSeek 等软件
3️⃣ 将生成的结果粘贴回来查看

---

【提示词】：
${error.prompt}

---
      `
      showCopyPromptButton.value = true
    } else {
      analysisResult.value = `## 😱 分析失败\n\n出错啦：${error.message}\n\n请稍后再试或检查网络连接。`
    }
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

  // 趋势分析
  const now = new Date()
  let trend = '稳定'
  let trendReason = ''

  if (days.value === 1) {
    // 24小时：前12小时 vs 后12小时
    const midPoint = subHours(now, 12)
    const recentRecords = records.filter(r => new Date(r.record_time) >= midPoint)
    const earlierRecords = records.filter(r => new Date(r.record_time) < midPoint)

    if (recentRecords.length > earlierRecords.length) {
      trend = '上升'
      trendReason = '最近12小时比前12小时更频繁'
    } else if (recentRecords.length < earlierRecords.length) {
      trend = '下降'
      trendReason = '最近12小时减少'
    } else {
      trendReason = '最近12小时和前12小时持平'
    }
  } else {
    // 7天/30天：前半段 vs 后半段
    const midPoint = startOfDay(subDays(now, Math.floor(days.value / 2)))
    const recentRecords = records.filter(r => new Date(r.record_time) >= midPoint)
    const earlierRecords = records.filter(r => new Date(r.record_time) < midPoint)

    if (recentRecords.length > earlierRecords.length) {
      trend = '上升'
      trendReason = `最近${Math.floor(days.value / 2)}天比前${Math.floor(days.value / 2)}天更频繁`
    } else if (recentRecords.length < earlierRecords.length) {
      trend = '下降'
      trendReason = `最近${Math.floor(days.value / 2)}天比前${Math.floor(days.value / 2)}天减少`
    } else {
      trendReason = `前后${Math.floor(days.value / 2)}天持平`
    }
  }

  // 时间范围标签
  const timeRangeLabel = days.value === 1 ? '24小时' : `${days.value}天`

  // 构建 prompt
  return `请以轻松有趣的风格分析以下放屁数据：

## 基本信息
- 分析周期：近 ${timeRangeLabel}
- 总次数：${total} 次
- 平均声音等级：${avgSoundLevel} 星
- 臭屁占比：${((smellyCount / total) * 100).toFixed(1)}%
- 趋势：${trend}（${trendReason}）

## 详细数据
### 时间分布
- 高峰时段：${peakHour}:00 - ${peakHour + 1}:00
- 拟声词偏好：${topWord ? topWord[0] + '(' + topWord[1] + '次' : '无'}

### 最近记录样本
${days.value === 1
  ? records.slice(0, 10).map(r => {  // 24小时显示更多样本（10条）
      const time = format(new Date(r.record_time), 'HH:mm', { locale: zhCN })
      const stars = '⭐'.repeat(r.sound_level)
      const smelly = r.is_smelly ? '臭' : '无臭'
      const word = r.sound_word ? r.sound_word.word : '无拟声词'
      return `- ${time} ${stars} ${smelly} ${word}`
    }).join('\n')
  : records.slice(0, 5).map(r => {   // 7天/30天显示5条
      const time = format(new Date(r.record_time), 'MM月dd日 HH:mm', { locale: zhCN })
      const stars = '⭐'.repeat(r.sound_level)
      const smelly = r.is_smelly ? '臭' : '无臭'
      const word = r.sound_word ? r.sound_word.word : '无拟声词'
      return `- ${time} ${stars} ${smelly} ${word}`
    }).join('\n')
}

请从以下几个角度进行分析：
1. **整体评价**：用幽默的方式评价这个数据
2. **趋势分析**：近期是变多了还是变少了，可能的原因
3. **时段洞察**：什么时候最爱放屁，有没有规律
4. **声音分析**：声音等级说明了什么
5. **臭味分析**：臭味占比和健康关联
6. **趣味建议**：给出3-5个有趣又实用的小建议

**注意：24小时/7天/30天所有报告都统一限制在 500 字以内，重点突出关键洞察和幽默解读。**

请用轻松、幽默、有趣的语气，适当使用emoji，让分析结果既专业又好玩！`
}

// 复制提示词功能
async function copyPrompt() {
  try {
    // 尝试使用现代 API
    await navigator.clipboard.writeText(lastPrompt.value)
    alert('✅ 提示词已复制！请粘贴到 AI 软件生成报告')
  } catch (err) {
    console.error('现代API复制失败，使用降级方案:', err)

    // 降级方案：创建 textarea 并手动复制
    try {
      const textarea = document.createElement('textarea')
      textarea.value = lastPrompt.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        alert('✅ 提示词已复制！')
      } else {
        throw new Error('execCommand 复制失败')
      }
    } catch (fallbackErr) {
      console.error('降级方案也失败:', fallbackErr)
      alert('❌ 复制失败，请手动选择提示词内容复制')

      // 最后的降级方案：显示提示词让用户手动复制
      const result = confirm('复制失败，是否显示提示词内容？\n\n点击"确定"后可手动全选复制')
      if (result) {
        alert(lastPrompt.value)
      }
    }
  }
}

// 复制报告功能
async function copyReport() {
  const reportText = `
💨 放屁记录分析报告 (${days.value === 1 ? '24小时' : days.value + '天'})

${analysisResult.value}

---
生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
  `.trim()

  try {
    // 尝试使用现代 API
    await navigator.clipboard.writeText(reportText)
    alert('✅ 报告已复制到剪贴板！')
  } catch (err) {
    console.error('现代API复制失败，使用降级方案:', err)

    // 降级方案：创建 textarea 并手动复制
    try {
      const textarea = document.createElement('textarea')
      textarea.value = reportText
      textarea.style.position = 'fixed'  // 避免移动端滚动
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        alert('✅ 报告已复制！')
      } else {
        throw new Error('execCommand 复制失败')
      }
    } catch (fallbackErr) {
      console.error('降级方案也失败:', fallbackErr)
      alert('❌ 复制失败，请手动选择报告内容复制')

      // 最后的降级方案：显示报告内容让用户手动复制
      const result = confirm('复制失败，是否显示报告内容？\n\n点击"确定"后可手动全选复制')
      if (result) {
        alert(reportText)
      }
    }
  }
}

// 发送邮件功能（使用 Resend）
async function sendEmail() {
  // 从 Supabase 获取当前用户
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) {
    alert('请先登录')
    return
  }

  isSendingEmail.value = true

  try {
    const localApiKey = import.meta.env.VITE_RESEND_API_KEY
    let response, data

    if (localApiKey) {
      // 本地开发：直接调用 Resend API
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: '仓库管理 <noreply@your-domain.com>',
          to: session.user.email,
          subject: `💨 放屁记录分析报告 (${days.value === 1 ? '24小时' : days.value + '天'})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007AFF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .report { white-space: pre-wrap; background: white; padding: 15px; border-radius: 8px; margin-top: 15px; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>💨 放屁记录分析报告</h2>
                  <p>时间范围: 近 ${days.value === 1 ? '24小时' : days.value + '天'}</p>
                </div>
                <div class="content">
                  <div class="report">${analysisResult.value.replace(/\n/g, '<br>')}</div>
                </div>
                <div class="footer">
                  <p>生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
                  <p>此邮件由仓库管理系统自动发送</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error('Resend API 错误: ' + errorText)
      }

      data = await response.json()
      alert('✅ 报告已发送到 ' + session.user.email)
    } else {
      // 生产环境：使用 Netlify Functions
      response = await fetch('/.netlify/functions/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          report: analysisResult.value,
          days: days.value
        })
      })

      data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      alert('✅ 报告已发送到 ' + session.user.email)
    }
  } catch (error) {
    console.error('发送邮件失败:', error)

    // 本地开发且没有 API Key 时的提示
    if (error.message.includes('fetch failed') || error.message.includes('404')) {
      alert('⚠️ 邮件功能仅在部署到 Netlify 后可用\n\n本地开发请配置 VITE_RESEND_API_KEY 环境变量')
    } else {
      alert('❌ 发送失败: ' + error.message)
    }
  } finally {
    isSendingEmail.value = false
  }
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

.result-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-copy-report,
.btn-send-email {
  flex: 1;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-copy-report:hover,
.btn-send-email:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-send-email:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-copy-prompt {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: opacity 0.2s;
  width: 100%;
}

.btn-copy-prompt:hover {
  opacity: 0.9;
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
