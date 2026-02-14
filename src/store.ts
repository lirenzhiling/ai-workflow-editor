// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";
import { Node, NodeChange, Edge, EdgeChange, Connection, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
// import { workflowEngine } from './services/workflowEngine';

// 数据结构
export interface RFState {
    nodes: Node[];
    edges: Edge[];
    selectedNodeId: string | null;

    isRunning: boolean;
    abortController: AbortController | null;// 让运行中的节点停止对象

    //用户的 API Key 存储
    apiKeys: {
        doubao: string;
        deepseek: string;
    };
    updateApiKey: (provider: keyof RFState['apiKeys'], value: string) => void;
    //api设置
    isKeyModalOpen: boolean;
    setIsKeyModalOpen: (isOpen: boolean) => void;

    // 方法定义
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setSelectedNode: (id: string | null) => void;
    updateNodeData: (nodeId: string, newData: any) => void;
    addNode: (node: Node) => void;
    deleteNode: (nodeId: string) => void;
    stopFlow: () => void; // 停止方法
}

// 在这里实现 useStore
// 初始节点（模拟之前的数据）
const useStore = create<RFState>()(
    // persist 中间件自动监听状态变化，用于数据持久化
    persist((set, get) => ({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        isRunning: false,
        abortController: null,
        apiKeys: {
            doubao: '',
            deepseek: '',
        },
        isKeyModalOpen: false,
        setIsKeyModalOpen: (isOpen: boolean) => set({ isKeyModalOpen: isOpen }),
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
                edges: addEdge(connection, get().edges),
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
        },
        deleteNode: (nodeId: string) => {
            set({
                // 过滤掉这个节点
                nodes: get().nodes.filter((node) => node.id !== nodeId),
                // 顺便把连在这个节点上的线也剪断
                edges: get().edges.filter(
                    (edge) => edge.source !== nodeId && edge.target !== nodeId
                ),
                // 如果删除的是当前选中的节点，取消选中状态
                selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
            });
        },
        stopFlow: () => {
            const { abortController } = get();
            if (abortController) {
                abortController.abort(); // 这一步会触发 fetch 的 reject ('AbortError')
            }
            set({ isRunning: false, abortController: null });
        },
        updateApiKey: (provider, value) => {
            set((state) => ({
                apiKeys: {
                    ...state.apiKeys,
                    [provider]: value
                }
            }));
        },
    }),
        // 持久化配置,存到 LocalStorage
        {
            name: "ai-flow-storage",//key
            storage: createJSONStorage(() => localStorage),//存储方式:LocalStorage
            // 存储内容: 只存 nodes、edges、apiKeys
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                apiKeys: state.apiKeys,
            }),

        }
    )
);
export default useStore;