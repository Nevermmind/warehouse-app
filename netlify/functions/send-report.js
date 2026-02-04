const fetch = require('node-fetch');

const { RESEND_API_KEY } = process.env;

exports.handler = async function(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, report, days } = JSON.parse(event.body);

    // 验证必需参数
    if (!email || !report) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少必需参数' })
      };
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // 调用 Resend API 发送邮件
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '仓库管理 <noreply@your-domain.com>',  // 需要配置 Resend 域名
        to: email,
        subject: `💨 放屁记录分析报告 (${days}天)`,
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
                <p>时间范围: 近 ${days} 天</p>
              </div>
              <div class="content">
                <div class="report">${report.replace(/\n/g, '<br>')}</div>
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Resend API 错误: ' + error);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        messageId: data.id
      })
    };

  } catch (error) {
    console.error('发送邮件失败:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
