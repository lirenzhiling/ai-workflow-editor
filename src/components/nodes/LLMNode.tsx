import React, { memo } from 'react';
// 引入必要的零件
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot } from 'lucide-react';

import { workflowRunner } from '../../services/workflowEngine';
import NodeTemplate from './NodeTemplate';

// 使用 memo 包裹，防止画布拖动时其他不相关的节点重复渲染（性能优化）
const LLMNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {

  const funcLabels: Record<string, string> = {
    chat: '文字聊天',
    image: '图片生成',
  };
  const handleRun = () => {
    workflowRunner.runSingleNode(id);
  };


  const funcLabel = funcLabels[data.func] || funcLabels.chat;

  return (
    // 外层容器：一个带紫色边框的卡片样式
    <NodeTemplate
      title="大模型 (LLM)"
      icon={<Bot />}
      theme="indigo"
      selected={selected}
    >
      {/* 内容区域 */}
      <div className="p-2 bg-gray-50 flex items-center">
        <div className="text-xs text-gray-500 mr-2">模型选择</div>
        <div className="text-sm font-bold text-gray-700" >{data.model || 'Deepseek'}</div>
      </div>
      <div className="p-2 bg-gray-50 flex items-center">
        <div className="text-xs text-gray-500 mr-2">功能选择</div>
        <div className="text-sm font-bold text-gray-700" >{funcLabel}</div>
      </div>
      <button
        onClick={handleRun}
        className={`w-full text-white p-1 transition-colors flex items-center justify-center
            ${data.status === 'running' ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}
            ${data.status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
          `}
      >{/* 根据状态显示不同文字 */}
        {(() => {
          switch (data.status) {
            case 'running': return '运行中...';
            case 'error': return '重试';
            default: return '运行';
          }
        })()}</button>

      {/* 左边的输出点 */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable} // 这是 reactflow 传下来的开关
        className="!w-4 !h-4 !left-[-7px] !bg-indigo-500" // 加上感叹号强制生效（这里改回合适的圆形宽高 !w-4 !h-4）
      />

      {/* 右边的输出点 */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-4 !h-4 !right-[-7px] !bg-indigo-500"
      />
    </NodeTemplate>
  );
});

export default LLMNode;