const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 400 } = JSON.parse(event.body);

    // 从环境变量获取 API Key
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const requestBody = {
      model: 'deepseek-chat',
      messages,
      temperature,
      // 注意：24小时/7天/30天所有报告都统一使用 max_tokens: 400
      max_tokens: Math.min(max_tokens, 400)  // 强制最大 400 tokens
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'DeepSeek API error');
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('DeepSeek function error:', error);

    // 检查是否超时
    if (error.name === 'AbortError' || error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      // 返回提示词，让用户手动生成
      const { messages } = JSON.parse(event.body || '{}');
      const lastPrompt = messages?.[messages.length - 1]?.content || '';

      return {
        statusCode: 408,  // Request Timeout
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'AI 分析超时',
          prompt: lastPrompt,
          message: '分析超时，您可以复制提示词到其他 AI 软件生成'
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
