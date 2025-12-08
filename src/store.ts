// src/store.ts
import { create } from 'zustand';
import { Node, NodeChange, Edge, EdgeChange, Connection, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

// 这是我们的数据结构
interface RFState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // 方法定义
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNode: (id: string | null) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  addNode: (node: Node) => void;
}

// 在这里实现 useStore
// 初始节点（模拟之前的数据）
const initialNodes: Node[] = [
  { 
    id: 'node-1', 
    type: 'llmNode', 
    position: { x: 250, y: 100 }, 
    data: { model: 'GPT-4o', status: 'ready' } 
  },
];
const useStore = create<RFState>((set, get) => ({ 
    nodes: initialNodes,
    edges: [],
    selectedNodeId: null,
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges:addEdge(connection, get().edges),
        });
    },
    setSelectedNode: (id: string | null) => {
        set({ selectedNodeId: id });
    },
    updateNodeData: (nodeId: string, newData: any) => {
        // 获取当前节点列表
        set({
            nodes: get().nodes.map(node => {
                if (node.id === nodeId) {
                    // 返回更新后的节点
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...newData,
                        },
                    };
                }
                return node; // 其他节点不变
            }),
        });
    },
    addNode: (node: Node) => {
        set({
            nodes: [...get().nodes, node],
        });
    }
 }));
export default useStore;