// src/components/Sidebar.tsx
import React from 'react';

const Sidebar = () => {
  // 当用户开始拖拽时触发
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // 核心：通过 dataTransfer 传输数据
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 shadow-lg z-10">
      <div className="text-lg font-bold text-gray-700 mb-2">工具箱</div>

      {/* 开始节点模版 */}
      <div
        className="h-16 border-2 border-pink-500 rounded cursor-grab flex items-center justify-center bg-pink-50 hover:bg-pink-100"
        onDragStart={(event) => onDragStart(event, 'startNode')}
        draggable
      >
        <span className="mr-2">🏁</span>
        <span className="font-medium text-pink-700">开始节点</span>
      </div>
      {/* 结束节点模版 */}
      <div
        className="h-16 border-2 border-pink-500 rounded cursor-grab flex items-center justify-center bg-pink-50 hover:bg-pink-100"
        onDragStart={(event) => onDragStart(event, 'endNode')}
        draggable
      >
        <span className="mr-2">🏁</span>
        <span className="font-medium text-pink-700">结束节点</span>
      </div>
      {/* LLM 节点模版 */}
      <div
        className="h-16 border-2 border-indigo-500 rounded cursor-grab flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 transition-colors"
        onDragStart={(event) => onDragStart(event, 'llmNode')}
        draggable // 让他可以拖动
      >
        <span className="mr-2">🤖</span>
        <span className="font-medium text-indigo-700">大模型 LLM</span>
      </div>
    </div>
  );
};

export default Sidebar;