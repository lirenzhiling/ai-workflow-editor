import React, { memo } from 'react';
// 1. 引入必要的零件
import { Handle, Position, NodeProps } from 'reactflow';

// 使用 memo 包裹，防止画布拖动时其他不相关的节点重复渲染（性能优化）
const LLMNode = memo(({ data, isConnectable }: NodeProps) => {
  const handleRun = async () => {
    // 1. 先清空之前的输出（这里我们需要一个新的状态来存输出，稍后加）
    // updateNodeData(id, { output: '' });
    console.log("准备起飞！提示词是：", data.prompt);
    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'post',
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: data.prompt }
          ]
        })
      });
      if (!response.body) return;

      // 2. 拿到读取器 (Reader)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      console.log("开始接收流式数据...");

      while (true) {
        // 3. 一点点读数据
        const { done, value } = await reader.read();
        if (done) break;

        // 4. 解码数据
        const chunk = decoder.decode(value);
        
        // 5. 解析 SSE 格式 (data: {...})
        // 后端发来的是：data: {"content":"你好"}\n\n
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // 去掉前面的 "data: "
            if (jsonStr === '[DONE]') break;

            try {
              const dataObj = JSON.parse(jsonStr);
              const content = dataObj.content;
              
              if (content) {
                console.log("收到片段:", content);
                // TODO: 下一步我们要把这个 content 显示在卡片上！
              }
            } catch (e) {
              console.error("解析出错", e);
            }
          }
        }
      }
    } catch (error) {
        console.log('请求失败', error);
    }
    
  };

  return (
    // 外层容器：我已经帮你写好了一个带紫色边框的卡片样式
    <div className="w-64 bg-white rounded-lg border-2 border-indigo-500 shadow-xl overflow-hidden">
      
      {/* 标题栏 */}
      <div className="p-2 text-white flex items-center bg-indigo-500 bg-gradient-to-r">
        <span className="text-xl mr-2">🤖</span>
        <span className="font-bold text-sm">大模型 (LLM)</span>
      </div>

      {/* 内容区域 */}
      <div className="p-4 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">模型选择</div>
        <div className="text-sm font-bold text-gray-700">GPT-4o</div>
        <div className="mt-2 text-xs text-gray-400">
            {/* 这里展示从外面传进来的数据 */}
            状态: {data.label} 
        </div>
      </div>
      <button
        onClick={handleRun}
       className='w-full bg-indigo-500 text-white p-1 rounded hover:bg-indigo-600'
       >运行</button>

      {/* 左边的输出点 */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable} // 这是 reactflow 传下来的开关
        className="w-3 h-3 bg-indigo-500" // 样式：把小圆点变成紫色
      />
      
      {/* 右边的输出点 */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500"
      />
    </div>
  );
});

export default LLMNode;