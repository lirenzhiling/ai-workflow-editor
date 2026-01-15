// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";
import { Node, NodeChange, Edge, EdgeChange, Connection, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { executors } from './services/nodeExecutors';

// 数据结构
interface RFState {
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
    runNode: (nodeId: string, isRecursive?: boolean) => Promise<void>;
    runFlow: () => void;
    stopFlow: () => void; // 停止方法
}

// 在这里实现 useStore
// 初始节点（模拟之前的数据）
const initialNodes: Node[] = [
    {
        id: 'node-1',
        type: 'llmNode',
        position: { x: 250, y: 100 },
        data: { model: 'Deepseek', status: 'ready' }
    },
];
const useStore = create<RFState>()(
    // persist 中间件自动监听状态变化，用于数据持久化
    persist((set, get) => ({
        nodes: initialNodes,
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
        runNode: async (nodeId: string, isRecursive = false) => {
            // 全局拦截
            if (isRecursive && !get().isRunning) return;

            //单点运行
            if (!isRecursive) {
                get().stopFlow(); // 先清理旧状态，防止冲突
                const tempController = new AbortController();
                set({ isRunning: true, abortController: tempController });
            }

            // 找到该节点
            const node = get().nodes.find((n) => n.id === nodeId);
            if (!node) return;

            try {

                // 通用逻辑：找上游节点
                const incomingEdge = get().edges.find(edge => edge.target === nodeId);
                let sourceNode = incomingEdge
                    ? get().nodes.find(n => n.id === incomingEdge.source)
                    : null;


                //打包数据
                const handler = executors[node.type || ''];
                if (handler) {
                    await handler({
                        nodeId,
                        node,      // 把当前节点也传进去，方便取 data
                        nodes: get().nodes,
                        edges: get().edges,
                        updateNodeData: get().updateNodeData,
                        sourceNode,
                        abortSignal: get().abortController?.signal,// 传递停止信号
                        stopFlow: get().stopFlow // 传递停止流程的函数
                    });
                } else {
                    console.warn(`未知的节点类型: ${node.type}`);
                }
            } catch (error) {
                console.error("运行节点时出错", error);
            }

            try {
                // 只有当 isRecursive 为 true 时，才触发下游
                if (isRecursive && get().isRunning) {
                    const outgoingEdges = get().edges.filter(edge => edge.source === nodeId);
                    // 获取当前节点
                    const currentNode = get().nodes.find(n => n.id === nodeId);
                    outgoingEdges.forEach(edge => {
                        // 逐个判断是否符合条件
                        if (currentNode?.type === 'conditionNode') {
                            const selectedPath = currentNode.data.selectedPath;

                            // 如果这根线的ID不等于选中的路径，就跳过
                            if (edge.sourceHandle !== selectedPath) {
                                console.log(`不符合条件: 期望走 ${selectedPath}, 但这根线是 ${edge.sourceHandle}`);
                                return;
                            }
                        }

                        // 正常触发
                        // 告诉下游，开启递归模式
                        setTimeout(() => get().runNode(edge.target, true), 500);
                    });
                }


            } catch (error) {
                console.error("运行下游节点时出错", error);
            } finally {
                // 如果是单点调试，跑完这一个节点，就自动把isRunning关掉。
                if (!isRecursive) {
                    set({ isRunning: false, abortController: null });
                }
            }
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
        runFlow: () => {
            //先停掉之前的
            get().stopFlow();

            //重置节点
            const resetNodes = get().nodes.map(node => ({
                ...node,
                data: { ...node.data, status: 'idle' } // 清空状态和输出
            }));
            useStore.setState({ nodes: resetNodes });

            // 创建新的控制器
            const controller = new AbortController();
            set({ isRunning: true, abortController: controller });

            const { nodes, runNode } = get();
            // 找到 Start 节点
            const startNode = nodes.find(n => n.type === 'startNode');
            if (!startNode) {
                alert('找不到开始节点！');
                return;
            }

            // TODO:清空所有节点的运行状态（为了体验更好）
            // ... (如果要清空，可以遍历 nodes 把 output 设为空，这里先略过)

            // 开启runNode持续执行
            runNode(startNode.id, true);
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