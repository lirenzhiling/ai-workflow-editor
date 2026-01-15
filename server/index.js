const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// 允许跨域 (允许前端 React 访问后端)
app.use(cors());
// 允许接收 JSON 格式的请求体
app.use(express.json());

const PROVIDER_CONFIG = {
  doubao: "https://ark.cn-beijing.volces.com/api/v3",
  deepseek: "https://api.deepseek.com",
};

// 图片处理：将图片转为 Base64（或使用图片 URL）
async function getImageBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`图片下载失败: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}


// 文字聊天接口，暂时用ds或豆包
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // 支持从请求头获取 provider 和 api key
  const provider = req.headers['x-provider'] || 'doubao';
  const userKey = req.headers['x-api-key'];

  let finalApiKey = userKey;
  if (!finalApiKey) {
    return res.status(500).json({ error: `未配置 ${provider} 的 API Key` });
  }

  const baseURL = PROVIDER_CONFIG[provider];
  console.log(`请求转发 -> Provider: ${provider} | URL: ${baseURL}`);

  const client = new OpenAI({
    apiKey: finalApiKey,
    baseURL: baseURL,
  });

  try {
    console.log('收到前端请求:', messages);

    // 先设置响应头，告诉浏览器这是一个流
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let completion;
    if (provider === 'deepseek') {
      // 发送请求给 DeepSeek
      completion = await client.chat.completions.create({
        messages: messages, // 前端传来的历史记录
        model: 'deepseek-chat', // 或者 'deepseek-coder'
        stream: true, // 开启流式传输
      });
    } else {
      // 发送请求给豆包（使用 OpenAI SDK 统一处理）
      completion = await client.chat.completions.create({
        messages: messages, // 前端传来的历史记录
        model: "doubao-seed-1-6-lite-251015", // 豆包模型 ID
        stream: true, // 开启流式传输
      });
    }

    // 处理流式数据
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // SSE 格式：以 data: 开头，双换行结尾
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 结束
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('API 调用失败:', error);
    // 如果响应还没开始发送，返回 JSON 错误
    if (!res.headersSent) {
      return res.status(500).json({ error: '服务器出错了' });
    }
    // 如果已经开始流式传输，通过 SSE 发送错误
    res.write(`data: ${JSON.stringify({ error: error.message || '服务器出错了' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

//图片生成接口，暂时用豆包
app.post('/api/image', async (req, res) => {
  const provider = req.headers['x-provider'] || 'doubao';
  const userKey = req.headers['x-api-key'];

  let finalApiKey = userKey;
  if (!finalApiKey) {
    return res.status(500).json({ error: `未配置 ${provider} 的 API Key` });
  }
  const baseURL = PROVIDER_CONFIG[provider];
  console.log(`请求转发 -> Provider: ${provider} | URL: ${baseURL}`);

  const client = new OpenAI({
    apiKey: finalApiKey,
    baseURL: baseURL,
  });
  try {
    const { prompt } = req.body;
    console.log('申请豆包绘图:', prompt);

    // 发送请求到火山引擎
    const response = await client.images.generate({
      model: "doubao-seedream-4-5-251128", // 我的模型
      prompt: prompt,
      size: "2048x2048", // 这个模型需要比较大的尺寸，1K都不行
      response_format: "url",
      watermark: true
    });

    console.log('图片生成成功:', response.data[0].url);
    res.json({ imageUrl: response.data[0].url });

  } catch (error) {
    console.error('绘图失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

//图片识别接口，暂时用豆包
app.post('/api/vision', async (req, res) => {
  const provider = req.headers['x-provider'] || 'doubao';
  const userKey = req.headers['x-api-key'];

  let finalApiKey = userKey;
  if (!finalApiKey) {
    return res.status(500).json({ error: `未配置 ${provider} 的 API Key` });
  }
  const baseURL = PROVIDER_CONFIG[provider];
  console.log(`请求转发 -> Provider: ${provider} | URL: ${baseURL}`);

  const client = new OpenAI({
    apiKey: finalApiKey,
    baseURL: baseURL,
  });
  try {
    const { prompt, imageUrl } = req.body;
    console.log('申请豆包识图:', prompt);
    // 发送请求到火山引擎 (Ark)
    const completion = await client.responses.create({
      model: "ep-20260113160702-42fmh", // 我的模型
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: imageUrl
            },
            {
              type: 'input_text',
              text: prompt
            },
          ]
        }
      ],
      stream: true,
    });

    for await (const chunk of completion) {
      if (chunk.type === 'response.output_text.delta') {
        const content = chunk.delta || '';
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      } else if (chunk.type === 'response.completed') {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }

    // 结束
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('识图失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`后端服务器已启动: http://localhost:${port}`);
});