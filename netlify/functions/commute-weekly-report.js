import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // 获取本周一到周五的日期范围（北京时间）
    const now = new Date()
    const currentDay = now.getDay()
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)

    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    friday.setHours(23, 59, 59, 999)

    // 如果是测试模式，只处理指定用户
    if (testUserId) {
      const email = await getUserEmail(testUserId)
      if (!email) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '用户不存在' })
        }
      }

      // 获取本周上班通勤记录
      const { data: workRecords } = await supabase
        .from('commute_records')
        .select(`
          *,
          route:commute_routes (*)
        `)
        .eq('user_id', testUserId)
        .eq('commute_type', 'work')
        .gte('record_date', monday.toISOString().split('T')[0])
        .lte('record_date', friday.toISOString().split('T')[0])
        .order('record_date')

      // 获取本周下班通勤记录
      const { data: homeRecords } = await supabase
        .from('commute_records')
        .select(`
          *,
          route:commute_routes (*)
        `)
        .eq('user_id', testUserId)
        .eq('commute_type', 'home')
        .gte('record_date', monday.toISOString().split('T')[0])
        .lte('record_date', friday.toISOString().split('T')[0])
        .order('record_date')

      const results = []

      // 生成上班报告
      if (workRecords && workRecords.length > 0) {
        const workReport = await generateWeeklyReport(workRecords, '上班')
        await sendEmail(email, '本周上班通勤报告', workReport)
        results.push({ type: 'work', sent: true, count: workRecords.length })
      } else {
        results.push({ type: 'work', sent: false, reason: '无数据' })
      }

      // 生成下班报告
      if (homeRecords && homeRecords.length > 0) {
        const homeReport = await generateWeeklyReport(homeRecords, '下班')
        await sendEmail(email, '本周下班通勤报告', homeReport)
        results.push({ type: 'home', sent: true, count: homeRecords.length })
      } else {
        results.push({ type: 'home', sent: false, reason: '无数据' })
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: '测试报告发送成功',
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
        // 获取本周上班通勤记录
        const { data: workRecords } = await supabase
          .from('commute_records')
          .select(`
            *,
            route:commute_routes (*)
          `)
          .eq('user_id', user.id)
          .eq('commute_type', 'work')
          .gte('record_date', monday.toISOString().split('T')[0])
          .lte('record_date', friday.toISOString().split('T')[0])
          .order('record_date')

        // 获取本周下班通勤记录
        const { data: homeRecords } = await supabase
          .from('commute_records')
          .select(`
            *,
            route:commute_routes (*)
          `)
          .eq('user_id', user.id)
          .eq('commute_type', 'home')
          .gte('record_date', monday.toISOString().split('T')[0])
          .lte('record_date', friday.toISOString().split('T')[0])
          .order('record_date')

        // 生成上班报告
        if (workRecords && workRecords.length > 0) {
          const workReport = await generateWeeklyReport(workRecords, '上班')
          await sendEmail(email, '本周上班通勤报告', workReport)
        }

        // 生成下班报告
        if (homeRecords && homeRecords.length > 0) {
          const homeReport = await generateWeeklyReport(homeRecords, '下班')
          await sendEmail(email, '本周下班通勤报告', homeReport)
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
        message: '周报发送完成',
        stats: {
          total: users.length,
          success: successCount,
          error: errorCount
        }
      })
    }
  } catch (error) {
    console.error('周报生成失败:', error)
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

async function generateWeeklyReport(records, type) {
  // 如果没有记录，返回简单的提示
  if (!records || records.length === 0) {
    return `⏰ ${type}通勤周报

本周暂无${type}通勤记录。

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  }

  try {
    // 准备数据
    const recordsText = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟, 路线:${r.route?.route_name || '未选择'}, 天气:${r.weather || '未记录'}`
    }).join('\n')

    const prompt = `你是一个通勤数据分析专家。请根据以下${type}通勤记录，生成一份简短的周报：

${recordsText}

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "本周通勤总结（2-3句话）",
  "averageTime": "平均通勤时间（分钟）",
  "trend": "通勤趋势分析（例如：星期几最短）",
  "insights": "洞察和发现（2-3点）"
}

要求：
1. 报告控制在 300 字以内
2. 重点突出平均时间和趋势
3. 分析星期几的通勤时间差异
4. 只返回 JSON，不要其他内容`

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
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('DeepSeek API 响应格式错误:', data)
      throw new Error('DeepSeek API 响应格式错误')
    }

    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('无法从响应中提取 JSON:', content)
      throw new Error('无法从响应中提取 JSON')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // 格式化报告
    return `⏰ ${type}通勤周报

${analysis.summary}

📊 平均通勤时间：${analysis.averageTime}分钟

📈 趋势分析：${analysis.trend}

💡 洞察发现：
${analysis.insights}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
  } catch (error) {
    console.error('生成周报失败:', error)

    // 如果 AI 分析失败，返回简化版报告
    const avgTime = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + calculateDuration(r.departure_time, r.arrival_time), 0) / records.length)
      : 0

    const recordsSummary = records.map(r => {
      const date = new Date(r.record_date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const duration = calculateDuration(r.departure_time, r.arrival_time)
      return `• ${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟`
    }).join('\n')

    return `⏰ ${type}通勤周报

本周共${records.length}天${type}通勤记录

📊 平均通勤时间：${avgTime}分钟

📈 详细记录：
${recordsSummary}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
（注：AI 分析暂不可用，显示简化版报告）
`
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

export const config = {
  schedule: '0 1 * * 6',  // 每周六上午9点北京时间（UTC+8 = UTC 1:00）
  path: '/.netlify/functions/commute-weekly-report'
}
