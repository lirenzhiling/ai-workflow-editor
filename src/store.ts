// src/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from "zustand/middleware";
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
    deleteNode: (nodeId: string) => void;
    runNode: (nodeId: string, isRecursive?: boolean) => Promise<void>;
    runFlow: () => void;
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
const useStore = create<RFState>()(
    // persist 中间件自动监听状态变化，用于数据持久化
    persist((set, get) => ({
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
            // 找到该节点
            const node = get().nodes.find((n) => n.id === nodeId);
            if (!node) return;

            // 通用逻辑：找上游节点
            const incomingEdge = get().edges.find(edge => edge.target === nodeId);
            let sourceNode = incomingEdge
                ? get().nodes.find(n => n.id === incomingEdge.source)
                : null;

            // 分支逻辑 ：如果是 EndNode
            if (node.type === 'endNode') {
                if (!sourceNode) {
                    alert('End节点还没连线呢！');
                    return;
                }
                // 直接把上游的 output 搬过来
                get().updateNodeData(nodeId, {
                    output: sourceNode.data.output || '上游节点还没有输出哦~'
                });
                // 标记为成功
                get().updateNodeData(nodeId, { status: 'success' });
                return; // 结束
            }
            // 分支逻辑 ：如果是 LLMNode
            if (node.type === 'llmNode') {
                // 准备数据
                let prompt = node.data.prompt || '';
                // 找到连接该节点的上游节点的边
                // const incomingEdge = get().edges.find(edge => edge.target === nodeId);
                if (incomingEdge) {
                    // 从这个变找到上游节点
                    sourceNode = get().nodes.find(n => n.id === incomingEdge.source);
                    if (sourceNode && sourceNode.data.output) {
                        console.log(`🔗 成功连接！接收到上游数据: ${sourceNode.data.output.slice(0, 10)}...`);
                        prompt = `【上文输入】：\n${sourceNode.data.output}\n\n【我的指令】：\n${prompt}`;
                    }
                }
                if (!prompt.trim()) {
                    alert('节点没有输入，无法运行！');
                    return;
                }



                // 标记状态：开始运行 (status = 'running')
                // 我们复用 updateNodeData 来更新状态
                const { updateNodeData } = get();
                updateNodeData(nodeId, { status: 'running', output: '' });
                const apiUrl = process.env.API_URL || 'http://localhost:4000/api/chat';
                try {
                    console.log("发送内容：" + prompt);

                    const response = await fetch(apiUrl, {
                        method: 'post',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            messages: [
                                { role: 'user', content: prompt }
                            ]
                        })
                    });
                    if (!response.body) return;

                    // 拿到读取器 (Reader)
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    if (!reader) return;
                    // 临时存一下当前的完整句子
                    let currentOutput = '';

                    // console.log("开始接收流式数据...");

                    while (true) {
                        // 一点点读数据
                        const { done, value } = await reader.read();
                        if (done) break;

                        // 解码数据
                        const chunk = decoder.decode(value);

                        // 解析 SSE 格式 (data: {...})
                        // 后端发来的是：data: {"content":"你好"}\n\n
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.slice(6); // 去掉前面的 "data: "
                                if (jsonStr === '[DONE]') break;

                                try {
                                    const dataObj = JSON.parse(jsonStr);
                                    const content = dataObj.content;

                                    if (content) {
                                        // console.log("收到片段:", content);
                                        currentOutput += content;
                                        // 每次收到新内容，就更新节点数据
                                        updateNodeData(nodeId, { output: currentOutput });
                                    }
                                } catch (e) {
                                    console.error("解析出错", e);
                                }
                            }
                        }
                    }
                    // 标记状态：成功 (status = 'success')
                    updateNodeData(nodeId, { status: 'success' });
                } catch (error) {
                    console.log('请求失败', error);
                    // 标记状态：失败 (status = 'error')
                    updateNodeData(nodeId, { status: 'error', output: '❌ 运行失败' });
                }
            }
            try {
                // 只有当 isRecursive 为 true 时，才触发下游
                if (isRecursive) {
                    const outgoingEdges = get().edges.filter(edge => edge.source === nodeId);
                    outgoingEdges.forEach(edge => {
                        // 告诉下游，开启递归模式
                        setTimeout(() => get().runNode(edge.target, true), 500);
                    });
                }
            } catch (error) {
                console.error("运行下游节点时出错", error);
            }
        },
        deleteNode: (nodeId: string) => {
            set({
                // 1. 过滤掉这个节点
                nodes: get().nodes.filter((node) => node.id !== nodeId),
                // 2. 顺便把连在这个节点上的线也剪断 (如果不剪，可能会报错)
                edges: get().edges.filter(
                    (edge) => edge.source !== nodeId && edge.target !== nodeId
                ),
                // 3. 如果删除的是当前选中的节点，取消选中状态
                selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
            });
        },
        runFlow: () => {
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
    }),
        // 持久化配置,存到 LocalStorage
        {
            name: "ai-flow-storage",//key
            storage: createJSONStorage(() => localStorage),//存储方式:LocalStorage
            // 存储内容: 只存 nodes 和 edges
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
            }),

        }
    )
);
export default useStore;