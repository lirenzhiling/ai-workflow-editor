import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  // 基础组件
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../store';
import LLMNode from './nodes/LLMNode';
import Sidebar from './Sidebar';
import NodeInspector from './NodeInspector';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';

const nodeTypes = {
  llmNode: LLMNode,
  startNode: StartNode,
  endNode: EndNode,
};


// ==========================================
// 定义初始数据（从 store 里取）
// ==========================================
const FlowEditorContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // 从 Store 取出状态和方法
  // selector 模式：只监听我们需要的数据，避免不必要的渲染
  const { nodes, onNodesChange, edges, onEdgesChange, onConnect, addNode, setSelectedNode, runFlow } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      setSelectedNode: state.setSelectedNode,
      runFlow: state.runFlow,
    }))
  );
  // 获取 ReactFlow 实例（用于坐标转换）
  const { project } = useReactFlow();
  // 处理“拖拽结束” (Drop)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      // 计算坐标：把屏幕坐标转换为画布坐标
      // getBoundingClientRect 获取画布在屏幕上的位置
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (reactFlowBounds) {
        // project 函数把 像素坐标 转换为 ReactFlow 的内部坐标 (X, Y)
        const position = project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        // 创建新节点
        const newNode = {
          id: `${type}-${Date.now()}`, // 生成唯一 ID
          type,
          position,
          data: { label: `${type} 节点` },// 初始数据
        };

        addNode(newNode); // 调用 Store 的方法
      }
    },
    [project, addNode],
  );
  // 允许拖拽经过
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className='flex h-full w-full flex-col'>
      {/* 顶部工具栏 */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10">
        <div className="font-bold text-gray-700 flex items-center gap-2">
          <span>🌊</span>
          <span>AI 工作流编排</span>
        </div>

        <button
          onClick={runFlow}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
        >
          <span>🚀</span>
          <span>一键全局运行</span>
        </button>
      </div>

      <div className='flex-1 flex w-full overflow-hidden'>
        {/* 左侧：工具箱 */}
        <Sidebar />
        {/* 右侧：画布 */}
        {/* ref 绑定到这里，用于计算位置 */}
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes} // 告诉画布自定义了哪些节点类型
            onNodeClick={(event, node) => setSelectedNode(node.id)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <NodeInspector />
      </div>
    </div>
  )
}

const FlowEditor = () => {
  return (
    <ReactFlowProvider>
      <FlowEditorContent />
    </ReactFlowProvider>
  );
};

export default FlowEditor;