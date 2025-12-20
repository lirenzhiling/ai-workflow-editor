// src/components/NodeInspector.tsx
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../store';

const NodeInspector = () => {
  // 1. 从 Store 取出需要的数据和方法
  const { nodes, selectedNodeId, updateNodeData, runNode, deleteNode } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      selectedNodeId: state.selectedNodeId,
      updateNodeData: state.updateNodeData,
      runNode: state.runNode,
      deleteNode: state.deleteNode,
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
    <div className="w-80 bg-white border-l border-gray-200 p-4 shadow-xl z-20 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
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

        {/* 节点种类为 llmNode 时*/}
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
            <div className="border-t border-gray-200 my-4"></div>
            <div className="mt-4 mb-2">
              <button
                onClick={() => runNode(selectedNode.id)}
                disabled={selectedNode.data.status === 'running'}
                className={`w-full py-2 rounded text-white font-medium transition-colors
              ${selectedNode.data.status === 'running' ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
              >
                {selectedNode.data.status === 'running' ? '🚀 正在思考...' : '▶ 运行'}
              </button>
            </div>
            {/* 运行结果展示区 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📺 运行结果
              </label>
              <div className="bg-gray-100 rounded p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
                {selectedNode.data.output ? (
                  <span>{selectedNode.data.output}</span>
                ) : (
                  <span className="text-gray-400 italic">等待运行...</span>
                )}
              </div>

            </div>
          </div>
        )}
        {/* 节点种类为 startNode 时*/}
        {selectedNode.type === 'startNode' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输入内容</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm h-32 mt-2"
              placeholder="请输入提示词..."
              value={selectedNode.data.input || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { input: e.target.value })}
            />
          </div>
        )}
        {/* 节点种类为 endNode 时*/}
        {selectedNode.type === 'endNode' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输出内容</label>
            <div className="bg-gray-100 rounded p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
              {selectedNode.data.output ? (
                <span>{selectedNode.data.output}</span>
              ) : (
                <span className="text-gray-400 italic">等待运行...</span>
              )}
            </div>
          </div>
        )}
      </div>
      {/* 删除节点 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (window.confirm('确定要删除这个节点吗？')) {
              deleteNode(selectedNode.id);
            }
          }}
          className="w-full py-2 text-red-600 border border-red-200 bg-red-50 rounded hover:bg-red-100 transition-colors text-sm font-medium"
        >
          🗑️ 删除选中节点
        </button>
      </div>
    </div>
  );
};

export default NodeInspector;