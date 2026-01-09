import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CirclePlay } from 'lucide-react';
import workflow from "../assets/workflow.svg";
import remToPx from '../utils/style';
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

  //让工具栏和节点配置面板可调节宽度
  const [sidebarWidth, setSidebarWidth] = useState(250);   // 工具栏默认宽度
  const [sidebarOffsetX, setSidebarOffsetX] = useState(0);
  const [inspectorWidth, setInspectorWidth] = useState(300); // 节点配置默认宽度
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const lastUpdateTime = useRef(0);

  // 从 Store 取出状态和方法
  // selector 模式：只监听我们需要的数据，避免不必要的渲染
  const { nodes, onNodesChange, edges, onEdgesChange, onConnect, addNode, setSelectedNode, selectedNodeId, runFlow } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      selectedNodeId: state.selectedNodeId,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      setSelectedNode: state.setSelectedNode,
      runFlow: state.runFlow,
    }))
  );

  // 节点id变了自动打开节点配置面板
  useEffect(() => {
    if (selectedNodeId && inspectorWidth === 0) {
      setInspectorWidth(300);
    }
  }, [selectedNodeId]);

  //拖拽监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 获取当前时间
      const now = Date.now();

      // 节流
      // 只有当距离上次更新超过 20ms时才执行
      // 这个频率足够防止ResizeObserver报错
      if (now - lastUpdateTime.current < 20) {
        return;
      }

      // 更新时间戳
      lastUpdateTime.current = now;

      // 处理左侧
      if (isResizingLeft.current) {
        const newWidth = e.clientX + remToPx(0.25); // 考虑边框宽度
        if (newWidth > 150 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }

      // 处理右侧
      if (isResizingRight.current) {
        const windowWidth = window.innerWidth;
        const newWidth = windowWidth - e.clientX + remToPx(0.25); // 考虑边框宽度
        if (newWidth > 180 && newWidth < 800) {
          setInspectorWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 开始拖拽左边
  const startResizeLeft = (e: React.MouseEvent) => {
    isResizingLeft.current = true;
    e.preventDefault(); // 阻止默认行为（选中文本、原生拖拽等）
    e.stopPropagation(); // 阻止事件冒泡，保险
    document.body.style.cursor = 'col-resize'; // 鼠标变成双箭头
  };

  // 开始拖拽右边
  const startResizeRight = (e: React.MouseEvent) => {
    isResizingRight.current = true;
    e.preventDefault(); // 阻止默认行为（选中文本、原生拖拽等）
    e.stopPropagation(); // 阻止事件冒泡，保险
    document.body.style.cursor = 'col-resize';
  };

  // 快捷开关：点击按钮时，如果在展开就收起(设为0)，如果在收起就恢复默认
  const toggleSidebar = () => setSidebarWidth(prev => prev === 0 ? 250 : 0);
  const toggleInspector = () => setInspectorWidth(prev => prev === 0 ? 300 : 0);

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
          <img src={workflow} alt="Workflow" className='w-8 h-8' />
          <span>AI 工作流编排</span>
        </div>

        <button
          onClick={runFlow}
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors shadow-md flex items-center gap-2"
        >
          <CirclePlay className="w-5 h-5" />
          <span>一键全局运行</span>
        </button>
      </div>

      <div className='flex-1 flex w-full overflow-hidden'>
        {/* 左侧：工具箱 */}
        <div
          className="relative flex flex-col w-full border-r border-gray-200 shadow-lg"
          style={{ width: sidebarWidth }}
        >
          <div className="w-full h-full overflow-hidden bg-white">
            <Sidebar />
          </div>


          {/* 左侧拖拽手柄*/}
          <div
            onMouseDown={startResizeLeft}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-green-500 transition-colors z-20 group"
          >
          </div>
          <div
            className="absolute top-1/2 -right-5 w-5 h-10 border border-gray-200 bg-white cursor-pointer flex items-center justify-center z-20 shadow-[1px_0px_4px_0px_rgba(0,0,0,0.1)] group">
            <ChevronRight
              onClick={toggleSidebar}
              className="text-gray-400 group-hover:text-green-500 z-20" />
          </div>
        </div>
        {/* 中间：画布 */}
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
        {/* 右侧：工具箱 */}
        <div
          className="relative flex flex-col border-l border-gray-200 shadow-lg"
          style={{ width: inspectorWidth }}
        >
          <div className="w-full h-full overflow-hidden bg-white">
            <NodeInspector />
          </div>

          {/* 右侧拖拽手柄*/}
          <div
            onMouseDown={startResizeRight}
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-green-500 transition-colors z-20 group"
          >

          </div>
          <div
            className="absolute top-1/2 -left-5 w-5 h-10 border border-gray-200 bg-white cursor-pointer flex items-center justify-center z-20 shadow-[-1px_0px_4px_0px_rgba(0,0,0,0.1)] group">
            <ChevronLeft
              onClick={toggleInspector}
              className="text-gray-400 group-hover:text-green-500 z-20" />
          </div>
        </div>
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