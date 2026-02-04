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

    // 获取上个月的日期范围
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999)

    // 如果是测试模式，只处理指定用户
    if (testUserId) {
      const email = await getUserEmail(testUserId)
      if (!email) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: '用户不存在' })
        }
      }

      // 获取上个月上班通勤记录
      const { data: workRecords } = await supabase
        .from('commute_records')
        .select(`
          *,
          route:commute_routes (*)
        `)
        .eq('user_id', testUserId)
        .eq('commute_type', 'work')
        .gte('record_date', lastMonthStart.toISOString().split('T')[0])
        .lte('record_date', lastMonthEnd.toISOString().split('T')[0])
        .order('record_date')

      // 获取上个月下班通勤记录
      const { data: homeRecords } = await supabase
        .from('commute_records')
        .select(`
          *,
          route:commute_routes (*)
        `)
        .eq('user_id', testUserId)
        .eq('commute_type', 'home')
        .gte('record_date', lastMonthStart.toISOString().split('T')[0])
        .lte('record_date', lastMonthEnd.toISOString().split('T')[0])
        .order('record_date')

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
        const { data: workRecords } = await supabase
          .from('commute_records')
          .select(`
            *,
            route:commute_routes (*)
          `)
          .eq('user_id', user.id)
          .eq('commute_type', 'work')
          .gte('record_date', lastMonthStart.toISOString().split('T')[0])
          .lte('record_date', lastMonthEnd.toISOString().split('T')[0])
          .order('record_date')

        // 获取上个月下班通勤记录
        const { data: homeRecords } = await supabase
          .from('commute_records')
          .select(`
            *,
            route:commute_routes (*)
          `)
          .eq('user_id', user.id)
          .eq('commute_type', 'home')
          .gte('record_date', lastMonthStart.toISOString().split('T')[0])
          .lte('record_date', lastMonthEnd.toISOString().split('T')[0])
          .order('record_date')

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

async function generateMonthlyReport(records, type, month) {
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

  const mostUsedRoute = Object.entries(routeStats)
    .sort((a, b) => b[1].count - a[1].count)[0]

  // 格式化报告
  const mostUsedRouteText = mostUsedRoute
    ? `${mostUsedRoute[0]}（${mostUsedRoute[1].count}次，平均${Math.round(mostUsedRoute[1].totalTime / mostUsedRoute[1].count)}分钟）`
    : '无数据'

  return `⏰ ${month.getFullYear()}年${month.getMonth() + 1}月${type}通勤月报

📊 统计概览
• 总通勤天数：${records.length} 天
• 平均通勤时间：${avgTime} 分钟
• 最快通勤：${minTime} 分钟
• 最慢通勤：${maxTime} 分钟

🛣️ 常用路线
${mostUsedRouteText}

📈 详细数据
${records.map(r => {
  const date = new Date(r.record_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  const duration = calculateDuration(r.departure_time, r.arrival_time)
  return `• ${date}: ${r.departure_time} → ${r.arrival_time}, 耗时${duration}分钟, 路线:${r.route?.route_name || '未选择'}`
}).join('\n')}

---
生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`
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
  schedule: '0 1 1 * *',  // 每月1日上午9点北京时间（UTC+8 = UTC 1:00）
  path: '/.netlify/functions/commute-monthly-report'
}
