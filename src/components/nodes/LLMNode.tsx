import React, { memo } from 'react';
// 1. 引入必要的零件
import { Handle, Position, NodeProps } from 'reactflow';

import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

// 使用 memo 包裹，防止画布拖动时其他不相关的节点重复渲染（性能优化）
const LLMNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {

  const { runNode } = useStore(
    /* 在这里写代码 */
    useShallow((state) => ({
      runNode: state.runNode,
    }))
  );


  return (
    // 外层容器：我已经帮你写好了一个带紫色边框的卡片样式
    <div className={`w-64 bg-white rounded-lg border-2 border-indigo-500 shadow-xl overflow-hidden transition-shadow duration-200 ${selected ? 'ring-8 ring-indigo-400/70 ring-offset-4 shadow-2xl shadow-indigo-500/60 scale-105' : ''}`}>

      {/* 标题栏 */}
      <div className="p-2 text-white flex items-center bg-indigo-500 bg-gradient-to-r">
        <span className="text-xl mr-2">🤖</span>
        <span className="font-bold text-sm">大模型 (LLM)</span>
      </div>

      {/* 内容区域 */}
      <div className="p-4 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">模型选择</div>
        <div className="text-sm font-bold text-gray-700" >{data.model || 'GPT-4o'}</div>
      </div>
      <button
        onClick={() => runNode(id)}
        className={`w-full text-white p-1 rounded transition-colors flex items-center justify-center
            ${data.status === 'running' ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}
            ${data.status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
          `}
      >{/* 根据状态显示不同文字 */}
        {(() => {
          switch (data.status) {
            case 'running': return '⏳ 运行中...';
            case 'error': return '❌ 重试';
            default: return '▶ 运行';
          }
        })()}</button>

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