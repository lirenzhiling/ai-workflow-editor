// src/components/NodeInspector.tsx
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../store';

const NodeInspector = () => {
  // 1. 从 Store 取出需要的数据和方法
  const { nodes, selectedNodeId, updateNodeData } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      selectedNodeId: state.selectedNodeId,
      updateNodeData: state.updateNodeData,
    }))
  );

  // 找到当前被选中的那个节点
  const selectedNode = nodes.find((node) => {
    return node.id === selectedNodeId;
  });

  // 如果没有选中节点，就显示个空状态
  if (!selectedNode) {
    return <div className="p-4 text-gray-500 text-sm">请点击画布上的节点进行配置</div>;
  }

  return (
    // 右侧面板容器
    <div className="w-80 bg-white border-l border-gray-200 p-4 shadow-xl z-20 flex flex-col">
      <div className="font-bold mb-4 text-gray-700">⚙️ 节点配置</div>
      
      {/* 调试信息：让你确认选对了没 */}
      <div className="text-xs text-gray-400 mb-4">ID: {selectedNode.id}</div>

      <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>
      
      <input
        type="text"
        className="border rounded p-2 w-full text-sm mb-4"
        // 1. 绑定值：显示当前节点的 label (注意判空，如果没有 label 就给个空字符串 '')
        value={selectedNode.data.label || ''}
        // 2. 绑定事件：输入改变时，通知 Store 更新数据
        onChange={(e) => {
           // 提示：调用 updateNodeData(节点ID, { label: 新值 })
           updateNodeData(selectedNode.id, { label: e.target.value });
        }}
      />
      
      {/* 字段 2：大模型特定配置 (仅当类型为 llmNode 时显示) */}
        {selectedNode.type === 'llmNode' && (
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模型型号</label>
             <select 
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={selectedNode.data.model || 'GPT-4o'}
                onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
             >
                <option value="Deepseek">Deepseek</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="GPT-3.5">GPT-3.5</option>
                <option value="Claude-3">Claude 3.5 Sonnet</option>
             </select>
             <textarea 
                className="w-full border border-gray-300 rounded p-2 text-sm h-32 mt-2" 
                placeholder="请输入提示词..." 
                value={selectedNode.data.prompt || ''} 
                onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
              />
           </div>
        )}
    </div>
  );
};

export default NodeInspector;