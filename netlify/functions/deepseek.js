export default async function(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let parsedBody = null;
  let lastPrompt = '';

  try {
    parsedBody = JSON.parse(event.body || '{}');
    const { messages, temperature = 0.7, max_tokens = 400 } = parsedBody;

    // 保存最后一个消息内容作为提示词（用于超时时）
    if (messages && messages.length > 0) {
      lastPrompt = messages[messages.length - 1].content || '';
    }

    // 从环境变量获取 API Key
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const requestBody = {
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: max_tokens || 2000  // 默认 2000 tokens，确保报告完整
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
      let errorMessage = 'DeepSeek API error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid response from DeepSeek API');
    }

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
