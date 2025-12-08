const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// 1. 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// 2. 允许跨域 (允许前端 React 访问我)
app.use(cors());
// 允许接收 JSON 格式的请求体
app.use(express.json());

// 3. 初始化 DeepSeek 客户端
//    关键点：baseURL 要改成 DeepSeek 的地址
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com', // DeepSeek 官方接口地址
});

// 4. 定义聊天接口
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    console.log('收到前端请求:', messages);

    // 发送请求给 DeepSeek
    const completion = await client.chat.completions.create({
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

// 5. 启动服务
app.listen(port, () => {
  console.log(`🚀 后端服务器已启动: http://localhost:${port}`);
});