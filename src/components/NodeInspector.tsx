// src/components/NodeInspector.tsx
import { useShallow } from 'zustand/react/shallow';
import useStore from '../store';

import LLMConfig from './inspector/LLMConfig';
import StartConfig from './inspector/StartConfig';
import EndConfig from './inspector/EndConfig';
import ConditionConfig from './inspector/ConditionConfig';
import { Settings, Trash2 } from 'lucide-react';
import { workflowRunner } from '../services/workflowEngine';

const configComponents: Record<string, React.FC<any>> = {
  startNode: StartConfig,
  llmNode: LLMConfig,
  endNode: EndConfig,
  conditionNode: ConditionConfig,
};

const NodeInspector = () => {
  // 从 Store 取出需要的数据和方法
  const { selectedNode, updateNodeData, deleteNode } = useStore(
    useShallow((state) => ({
      updateNodeData: state.updateNodeData,
      // runNode: state.runNode,
      deleteNode: state.deleteNode,
      selectedNode: state.nodes.find((n) => n.id === state.selectedNodeId)
    }))
  );

  // 如果没有选中节点，就显示个空状态
  if (!selectedNode) {
    return <div className="p-4 text-gray-500 text-sm">请点击画布上的节点进行配置</div>;
  }

  // 动态获取对应的配置组件
  const ConfigComponent = configComponents[selectedNode.type || ''];

  // 定义一个新的运行节点函数
  const handleRunNode = async (nodeId: string) => {
    // 调用刚才公开的 executeNode 方法
    // 这里的逻辑是：只运行这一个，不触发后续流程，非常适合调试
    await workflowRunner.runSingleNode(nodeId);
  };

  return (
    // 右侧面板容器
    <div className="w-full h-full bg-white p-4 z-20 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className='mb-4'>
          <Settings className="inline-block mr-2 text-gray-500" />
          <div className="font-bold inline-block text-gray-700">节点配置</div>
        </div>
        {/* 确认选对 */}
        <div className="text-xs text-gray-400 mb-4">ID: {selectedNode.id}</div>

        <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>

        <input
          type="text"
          className="border rounded p-2 w-full text-sm mb-4"
          // 绑定值：显示当前节点的 label (注意判空，如果没有 label 就给个空字符串 '')
          value={selectedNode.data.label || ''}
          // 绑定事件：输入改变时，通知 Store 更新数据
          onChange={(e) => {
            // 提示：调用 updateNodeData(节点ID, { label: 新值 })
            updateNodeData(selectedNode.id, { label: e.target.value });
          }}
        />

        <div className="flex-1 overflow-y-auto">
          {ConfigComponent ? (
            <ConfigComponent
              // 把所有需要的参数都传进去
              nodeId={selectedNode.id}
              data={selectedNode.data}
              onChange={updateNodeData}
              runNode={handleRunNode}
            />
          ) : (
            <div className="text-gray-400 italic">该节点类型暂无配置项</div>
          )}
        </div>
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
          <Trash2 className="inline-block w-4 h-4 mr-2" />删除节点
        </button>
      </div>
    </div>
  );
};

export default NodeInspector;