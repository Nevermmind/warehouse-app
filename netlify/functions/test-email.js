import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 共享的 user_id
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

// 初始化 Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export const handler = async (event, context) => {
  // 允许 GET 请求（方便浏览器直接访问）
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    console.log('开始发送测试邮件...')

    // 获取当前日期（设置为当天开始）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 获取所有用户
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('获取用户失败:', usersError)
      return { statusCode: 500, body: JSON.stringify({ error: '获取用户失败' }) }
    }

    // 过滤出有邮箱的用户
    const validUsers = users.filter(user => user.email)

    if (validUsers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: '没有找到用户邮箱' })
      }
    }

    // 获取所有需要提醒的物品
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select(`
        *,
        categories (
          name
        )
      `)
      .eq('user_id', SHARED_USER_ID)
      .order('expiry_date', { ascending: true })

    if (itemsError) {
      console.error('获取物品失败:', itemsError)
      return { statusCode: 500, body: JSON.stringify({ error: '获取物品失败' }) }
    }

    // 过滤出需要提醒的物品
    const itemsToRemind = items.filter(item => {
      const expiryDate = new Date(item.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)

      const diffTime = expiryDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 检查是否在提醒天数范围内（包括已经过期的）
      const reminderDays = item.reminder_days || 5
      return diffDays <= reminderDays && diffDays >= -30 // 只提醒30天内过期的物品
    })

    console.log(`找到 ${itemsToRemind.length} 个需要提醒的物品`)

    if (itemsToRemind.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: '没有需要提醒的物品',
          note: '当前没有物品需要提醒。如果这是测试，请添加一些快过期的物品。'
        })
      }
    }

    // 按过期时间分组
    const expiredItems = itemsToRemind.filter(item => {
      const expiryDate = new Date(item.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const diffTime = expiryDate - today
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) < 0
    })

    const warningItems = itemsToRemind.filter(item => {
      const expiryDate = new Date(item.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const diffTime = expiryDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const reminderDays = item.reminder_days || 5
      return diffDays >= 0 && diffDays <= reminderDays
    })

    // 构建 HTML 邮件内容
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>【测试】仓库物品过期提醒</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 {
            color: #667eea;
            margin-bottom: 20px;
            text-align: center;
          }
          .test-banner {
            background: #fff3cd;
            border: 2px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
          }
          .expired {
            color: #f44336;
          }
          .warning {
            color: #ff9800;
          }
          .item {
            background: #f9f9f9;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .item-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .item-details {
            font-size: 14px;
            color: #666;
          }
          .expiry-date {
            font-weight: 500;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="test-banner">🧪 这是一封测试邮件</div>

          <h1>📦 仓库物品过期提醒</h1>

          ${expiredItems.length > 0 ? `
            <div class="section">
              <div class="section-title expired">⚠️ 已过期物品 (${expiredItems.length})</div>
              ${expiredItems.map(item => {
                const expiryDate = new Date(item.expiry_date)
                const diffTime = today - expiryDate
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return `
                  <div class="item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                      分类: ${item.categories?.name || '未分类'} |
                      <span class="expiry-date">已过期 ${diffDays} 天</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          ` : ''}

          ${warningItems.length > 0 ? `
            <div class="section">
              <div class="section-title warning">⏰ 快过期物品 (${warningItems.length})</div>
              ${warningItems.map(item => {
                const expiryDate = new Date(item.expiry_date)
                const diffTime = expiryDate - today
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return `
                  <div class="item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                      分类: ${item.categories?.name || '未分类'} |
                      <span class="expiry-date">${diffDays === 0 ? '今天过期' : diffDays === 1 ? '明天过期' : `${diffDays} 天后过期`}</span>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <p>🧪 测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            <p>如果收到此邮件，说明邮件功能配置正确！</p>
          </div>
        </div>
      </body>
      </html>
    `

    // 给每个用户发送邮件
    const emailPromises = validUsers.map(async (user) => {
      console.log('发送测试邮件到:', user.email)

      const { data, error: emailError } = await resend.emails.send({
        from: '仓库管理 <onboarding@resend.dev>',
        to: user.email,
        subject: `🧪 [测试] 仓库物品过期提醒 - ${expiredItems.length} 个已过期, ${warningItems.length} 个快过期`,
        html: emailHtml
      })

      if (emailError) {
        console.error(`发送邮件到 ${user.email} 失败:`, emailError)
        return { email: user.email, success: false, error: emailError }
      }

      console.log(`测试邮件发送成功到 ${user.email}:`, data)
      return { email: user.email, success: true, data }
    })

    // 等待所有邮件发送完成
    const results = await Promise.all(emailPromises)

    // 统计发送结果
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '测试邮件发送完成',
        itemsReminded: itemsToRemind.length,
        expiredCount: expiredItems.length,
        warningCount: warningItems.length,
        emailsSent: successCount,
        emailsFailed: failCount,
        results,
        timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      }, null, 2)
    }

  } catch (error) {
    console.error('处理失败:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
