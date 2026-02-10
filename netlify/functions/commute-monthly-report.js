import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

// 辅助函数：格式化本地日期为 YYYY-MM-DD（避免时区问题）
function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async (req, context) => {
  // 支持 POST 和 GET 请求
  if (req.method !== 'POST' && req.method !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    let testUserId = null

    // 如果是 POST 请求，解析 body
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        testUserId = body.test ? body.userId : null
      } catch (e) {
        // 忽略 JSON 解析错误
      }
    }

    // 检查是否是月末最后一天（定时任务会在28-31日都执行，需要检查）
    if (!testUserId) {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)

      // 如果明天是下个月1号，说明今天是最后一天
      if (tomorrow.getMonth() !== now.getMonth()) {
        // 是最后一天，继续执行
      } else {
        // 不是最后一天，跳过执行
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: '不是月末最后一天，跳过执行',
            currentDate: now.toISOString()
          })
        }
      }
    }

    // 获取上个月的日期范围
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // 上个月的第一天
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)

    // 上个月的最后一天（下个月第0天就是本月最后一天）
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    console.log('当前时间:', now.toISOString())
    console.log('上个月开始:', formatLocalDate(lastMonthStart), lastMonthStart.toISOString())
    console.log('上个月结束:', formatLocalDate(lastMonthEnd), lastMonthEnd.toISOString())

    // 如果是测试模式，只处理指定用户
    if (testUserId) {
      console.log('测试模式 - 用户ID:', testUserId)

      const email = await getUserEmail(testUserId)
      if (!email) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '用户不存在' })
        }
      }

      console.log('用户邮箱:', email)
      console.log('日期范围:', formatLocalDate(lastMonthStart), '到', formatLocalDate(lastMonthEnd))

      // 获取上个月上班通勤记录
      const { data: workRecords, error: workError } = await supabase
        .from('commute_records')
        .select('*')
        .eq('user_id', testUserId)
        .eq('commute_type', 'work')
        .gte('record_date', formatLocalDate(lastMonthStart))
        .lte('record_date', formatLocalDate(lastMonthEnd))
        .order('record_date')

      if (workError) {
        console.error('获取上班记录失败:', workError)
        throw new Error(`获取上班记录失败: ${workError.message}`)
      }

      // 获取上个月下班通勤记录
      const { data: homeRecords, error: homeError } = await supabase
        .from('commute_records')
        .select('*')
        .eq('user_id', testUserId)
        .eq('commute_type', 'home')
        .gte('record_date', formatLocalDate(lastMonthStart))
        .lte('record_date', formatLocalDate(lastMonthEnd))
        .order('record_date')

      if (homeError) {
        console.error('获取下班记录失败:', homeError)
        throw new Error(`获取下班记录失败: ${homeError.message}`)
      }

      const results = []

      // 生成上班报告
      if (workRecords && workRecords.length > 0) {
        const workReport = await generateMonthlyReport(workRecords, '上班', lastMonth)
        await sendEmail(email, `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月上班通勤月报`, workReport)
        results.push({ type: 'work', sent: true, count: workRecords.length })
      } else {
        results.push({ type: 'work', sent: false, reason: '无数据' })
      }

      // 生成下班报告
      if (homeRecords && homeRecords.length > 0) {
        const homeReport = await generateMonthlyReport(homeRecords, '下班', lastMonth)
        await sendEmail(email, `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月下班通勤月报`, homeReport)
        results.push({ type: 'home', sent: true, count: homeRecords.length })
      } else {
        results.push({ type: 'home', sent: false, reason: '无数据' })
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: '测试月报发送成功',
          results
        })
      }
    }

    // 生产模式：处理所有用户
    const { data: { users } } = await supabase.auth.admin.listUsers()
    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      const email = user.email
      if (!email) continue

      try {
        // 获取上个月上班通勤记录
        const { data: workRecords, error: workError } = await supabase
          .from('commute_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('commute_type', 'work')
          .gte('record_date', formatLocalDate(lastMonthStart))
          .lte('record_date', formatLocalDate(lastMonthEnd))
          .order('record_date')

        if (workError) {
          console.error(`获取用户 ${user.id} 上班记录失败:`, workError)
          throw new Error(workError.message)
        }

        // 获取上个月下班通勤记录
        const { data: homeRecords, error: homeError } = await supabase
          .from('commute_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('commute_type', 'home')
          .gte('record_date', formatLocalDate(lastMonthStart))
          .lte('record_date', formatLocalDate(lastMonthEnd))
          .order('record_date')

        if (homeError) {
          console.error(`获取用户 ${user.id} 下班记录失败:`, homeError)
          throw new Error(homeError.message)
        }

        // 生成上班报告
        if (workRecords && workRecords.length > 0) {
          const workReport = await generateMonthlyReport(workRecords, '上班', lastMonth)
          await sendEmail(email, `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月上班通勤月报`, workReport)
        }

        // 生成下班报告
        if (homeRecords && homeRecords.length > 0) {
          const homeReport = await generateMonthlyReport(homeRecords, '下班', lastMonth)
          await sendEmail(email, `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月下班通勤月报`, homeReport)
        }

        successCount++
      } catch (error) {
        console.error(`处理用户 ${user.id} 失败:`, error)
        errorCount++
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: '月报发送完成',
        stats: {
          total: users.length,
          success: successCount,
          error: errorCount
        }
      })
    }
  } catch (error) {
    console.error('月报生成失败:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function getUserEmail(userId) {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  return user?.email || null
}

// 带重试机制的 AI 分析调用
async function callDeepSeekAPIWithRetry(prompt, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`DeepSeek API 调用尝试 ${attempt}/${maxRetries}...`)

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
          timeout: 10000 // 10秒超时
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('响应格式错误')
      }

      console.log(`DeepSeek API 调用成功（第 ${attempt} 次尝试）`)
      return { success: true, content: data.choices[0].message.content }

    } catch (error) {
      console.error(`第 ${attempt} 次尝试失败:`, error.message)

      if (attempt === maxRetries) {
        console.error('所有重试均失败')
        return { success: false, error: error.message, prompt }
      }

      // 等待 1 秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

async function generateMonthlyReport(records, type, month) {
  if (!records || records.length === 0) {
    return `⏰ ${month.getFullYear()}年${month.getMonth() + 1}月${type}通勤月报

本月暂无${type}通勤记录。

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  }

  try {
    // 计算统计数据
    const durations = records.map(r => calculateDuration(r.departure_time, r.arrival_time))
    const avgTime = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0
    const minTime = durations.length > 0 ? Math.min(...durations) : 0
    const maxTime = durations.length > 0 ? Math.max(...durations) : 0

    // 路线统计
    const routeStats = {}
    records.forEach(r => {
      const routeName = r.route?.route_name || '未选择'
      if (!routeStats[routeName]) {
        routeStats[routeName] = { count: 0, totalTime: 0 }
      }
      routeStats[routeName].count++
      routeStats[routeName].totalTime += calculateDuration(r.departure_time, r.arrival_time)
    })

    // 按使用频率排序路线
    const sortedRoutes = Object.entries(routeStats)
      .sort((a, b) => b[1].count - a[1].count)

    // 统计有备注的记录数和内容
    const recordsWithNotes = records.filter(r => r.notes && r.notes.trim()).length
    const recordsWithNotesList = records.filter(r => r.notes && r.notes.trim())
      .map(r => {
        const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
        return `${date}: ${r.notes}`
      })
    const notesText = recordsWithNotesList.length > 0
      ? `\n有备注的记录：\n${recordsWithNotesList.join('\n')}`
      : ''

    // 准备统计数据摘要（不包含明细）
    const statsSummary = sortedRoutes.map(([routeName, stats]) => {
      return `- ${routeName}: ${stats.count}次，平均${Math.round(stats.totalTime / stats.count)}分钟`
    }).join('\n')

    const prompt = `你是一个通勤数据分析专家。请根据以下${type}通勤的月度统计数据，生成一份简短的月报：

月份：${month.getFullYear()}年${month.getMonth() + 1}月
通勤类型：${type}
总天数：${records.length} 天
平均通勤时间：${avgTime} 分钟
最快通勤：${minTime} 分钟
最慢通勤：${maxTime} 分钟
有备注记录数：${recordsWithNotes} 条

路线使用统计：
${statsSummary}${notesText}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "本月通勤总结（2-3句话）",
  "averageTime": "平均通勤时间（分钟）",
  "trend": "通勤趋势分析（例如：最常用的路线、时间稳定性）",
  "insights": "洞察和发现（2-3点）",
  "routeAnalysis": "路线使用建议"
}

要求：
1. 报告控制在 300 字以内
2. 重点突出平均时间和路线使用情况
3. 分析不同路线的时间差异
4. 只返回 JSON，不要其他内容`

    const result = await callDeepSeekAPIWithRetry(prompt, 5)

    if (!result.success) {
      throw new Error(`AI 分析失败: ${result.error}`)
    }

    const content = result.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('无法从响应中提取 JSON:', content)
      throw new Error('无法从响应中提取 JSON')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // 格式化报告
    return `⏰ ${month.getFullYear()}年${month.getMonth() + 1}月${type}通勤月报

${analysis.summary}

📊 平均通勤时间：${analysis.averageTime}分钟

📈 趋势分析：${analysis.trend}

💡 洞察发现：
${analysis.insights}

🛣️ 路线分析：${analysis.routeAnalysis}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  } catch (error) {
    console.error('生成月报失败（已重试5次）:', error)

    // 如果重试5次后仍然失败，发送提示词到邮箱
    const userEmail = await getUserEmail(records[0].user_id)

    // 计算统计数据作为备选
    const durations = records.map(r => calculateDuration(r.departure_time, r.arrival_time))
    const avgTime = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0

    // 路线统计
    const routeStats = {}
    records.forEach(r => {
      const routeName = r.route?.route_name || '未选择'
      if (!routeStats[routeName]) {
        routeStats[routeName] = { count: 0, totalTime: 0 }
      }
      routeStats[routeName].count++
      routeStats[routeName].totalTime += calculateDuration(r.departure_time, r.arrival_time)
    })

    const sortedRoutes = Object.entries(routeStats)
      .sort((a, b) => b[1].count - a[1].count)

    const statsSummary = sortedRoutes.map(([routeName, stats]) => {
      return `- ${routeName}: ${stats.count}次，平均${Math.round(stats.totalTime / stats.count)}分钟`
    }).join('\n')

    // 统计有备注的记录数和内容
    const recordsWithNotes = records.filter(r => r.notes && r.notes.trim()).length
    const recordsWithNotesList = records.filter(r => r.notes && r.notes.trim())
      .map(r => {
        const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
        return `${date}: ${r.notes}`
      })
    const notesText = recordsWithNotesList.length > 0
      ? `\n有备注的记录：\n${recordsWithNotesList.join('\n')}`
      : ''

    // 生成提示词
    const promptForEmail = `你是一个通勤数据分析专家。请根据以下${type}通勤的月度统计数据，生成一份简短的月报：

月份：${month.getFullYear()}年${month.getMonth() + 1}月
通勤类型：${type}
总天数：${records.length} 天
平均通勤时间：${avgTime} 分钟
有备注记录数：${recordsWithNotes} 条

路线使用统计：
${statsSummary}${notesText}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "本月通勤总结（2-3句话）",
  "averageTime": "平均通勤时间（分钟）",
  "trend": "通勤趋势分析",
  "insights": "洞察和发现（2-3点）",
  "routeAnalysis": "路线使用建议"
}

要求：
1. 报告控制在 300 字以内
2. 重点突出平均时间和路线使用情况
3. 只返回 JSON，不要其他内容`

    // 发送提示词到用户邮箱
    await sendPromptToEmail(userEmail, `${month.getFullYear()}年${month.getMonth() + 1}月${type}通勤月报 - AI分析超时`, promptForEmail)

    // 返回简化版报告
    return `⏰ ${month.getFullYear()}年${month.getMonth() + 1}月${type}通勤月报

本月共${records.length}天${type}通勤记录

📊 平均通勤时间：${avgTime}分钟

🛣️ 路线统计：
${statsSummary}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
⚠️ AI 分析超时，已发送完整提示词到邮箱，请手动生成报告。`
  }
}

function calculateDuration(departure, arrival) {
  const dep = new Date(`2000-01-01T${departure}`)
  const arr = new Date(`2000-01-01T${arrival}`)
  return Math.round((arr - dep) / 1000 / 60)
}

async function sendEmail(to, subject, report) {
  await resend.emails.send({
    from: '上下班时间追踪 <noreply@yourdomain.com>',
    to: to,
    subject: `⏰ ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; margin-top: 10px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subject}</h2>
          </div>
          <div class="content">${report}</div>
        </div>
      </body>
      </html>
    `
  })
}

// 发送提示词到用户邮箱
async function sendPromptToEmail(to, subject, prompt) {
  await resend.emails.send({
    from: '上下班时间追踪 <noreply@yourdomain.com>',
    to: to,
    subject: `⏰ ${subject} - 请手动生成报告`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff3cd; border-radius: 8px; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; margin-top: 10px; white-space: pre-wrap; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ AI 分析超时 - 请手动生成报告</h2>
          </div>
          <div class="content">
            由于网络原因，AI 分析超时了。请复制以下提示词到 ChatGPT/Claude/DeepSeek 等工具中手动生成报告：

            <hr>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">${prompt}</pre>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

export const config = {
  runtime: 'edge',
  schedule: '0 13 28-31 * *',  // 每月最后一天晚上9点北京时间（UTC+8 = UTC 13:00）
  path: '/.netlify/functions/commute-monthly-report'
}
