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

// 配置DeepSeek 客户端
const clientDeepSeek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com', // DeepSeek 官方接口地址
});

// 配置豆包生图 客户端
const clientSeedream = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3/images/generations', // 豆包火山引擎接口地址
});


// 文字聊天接口，暂时用ds
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    console.log('收到前端请求:', messages);

    // 发送请求给 DeepSeek
    const completion = await clientDeepSeek.chat.completions.create({
      messages: messages, // 前端传来的历史记录
      model: 'deepseek-chat', // 或者 'deepseek-coder'
      stream: true, // 开启流式传输！
    });

    // 设置响应头，告诉浏览器这是一个流
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
    console.error('DeepSeek API 调用失败:', error);
    res.status(500).json({ error: '服务器出错了' });
  }
});

//图片生成接口，暂时用豆包
app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('申请豆包绘图:', prompt);

    // 准备请求体
    const payload = {
      model: "doubao-seedream-4-5-251128", // 我的模型
      prompt: prompt,
      size: "2048x2048", // 这个模型需要比较大的尺寸，1K都不行
      response_format: "url",
      watermark: true
    };

    // 发送请求到火山引擎 (Ark)
    const response = await fetch(clientSeedream.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 从环境变量读取 Key
        'Authorization': `Bearer ${clientSeedream.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 错误处理
    if (data.error) {
      console.error('豆包报错:', data.error);
      throw new Error(data.error.message || 'API 请求错误');
    }

    // 提取图片 URL
    if (data.data && data.data.length > 0) {
      const imageUrl = data.data[0].url;
      console.log('图片生成成功:', imageUrl);
      res.json({ imageUrl });
    } else {
      throw new Error('返回数据格式异常');
    }

  } catch (error) {
    console.error('绘图失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`后端服务器已启动: http://localhost:${port}`);
});