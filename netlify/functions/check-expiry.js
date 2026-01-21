import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Supabase 配置
const supabaseUrl = 'https://xalchjoarpvtbnegjkqm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbGNoam9hcnB2dGJuZWdqa3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzcxMTYsImV4cCI6MjA4NDQ1MzExNn0.fHwcmg3oykWLdfapItp35CVBlRMN_v0aaXjshoNAjtE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 共享的 user_id
const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

// 初始化 Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export const handler = async (event, context) => {
  // 只允许 cron job 调用
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    console.log('开始检查过期提醒...')

    // 获取当前日期（设置为当天开始）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 获取所有用户
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('获取用户失败:', usersError)
      return { statusCode: 500, body: JSON.stringify({ error: '获取用户失败' }) }
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
      const reminderDays = item.reminder_days || 3
      return diffDays <= reminderDays && diffDays >= -30 // 只提醒30天内过期的物品
    })

    console.log(`找到 ${itemsToRemind.length} 个需要提醒的物品`)

    if (itemsToRemind.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: '没有需要提醒的物品' })
      }
    }

    // 获取第一个已登录用户的邮箱
    const userEmail = users?.[0]?.email

    if (!userEmail) {
      console.log('没有找到用户邮箱')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: '没有找到用户邮箱' })
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
      return diffDays >= 0 && diffDays <= 3
    })

    // 构建 HTML 邮件内容
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>仓库物品过期提醒</title>
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
          .emoji {
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
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
            <p>🤖 这是一封自动提醒邮件</p>
            <p>收到此邮件是因为你有 ${itemsToRemind.length} 个物品需要注意</p>
          </div>
        </div>
      </body>
      </html>
    `

    // 发送邮件
    console.log('发送邮件到:', userEmail)
    const { data, error: emailError } = await resend.emails.send({
      from: '仓库管理 <noreply@yourdomain.com>',
      to: userEmail,
      subject: `📦 仓库物品过期提醒 - ${expiredItems.length} 个已过期, ${warningItems.length} 个快过期`,
      html: emailHtml
    })

    if (emailError) {
      console.error('发送邮件失败:', emailError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '发送邮件失败', details: emailError })
      }
    }

    console.log('邮件发送成功:', data)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '检查完成',
        itemsReminded: itemsToRemind.length,
        emailSent: true
      })
    }

  } catch (error) {
    console.error('处理失败:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
