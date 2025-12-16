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
    runNode: (nodeId: string) => Promise<void>;
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
    runNode: async (nodeId: string) => {
        // 1. 找到该节点
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return;
        // 2. 准备数据
        let prompt = node.data.prompt || '';
        // 找到连接该节点的上游节点的边
        const incomingEdge = get().edges.find(edge => edge.target === nodeId);
        if (incomingEdge) {
            // 从这个变找到上游节点
            const sourceNode = get().nodes.find(n => n.id === incomingEdge.source);
            if (sourceNode && sourceNode.data.output) {
                console.log(`🔗 成功连接！接收到上游数据: ${sourceNode.data.output.slice(0, 10)}...`);
                prompt = `【上文输入】：\n${sourceNode.data.output}\n\n【我的指令】：\n${prompt}`;
            }
        }
        if (!prompt.trim()) {
            alert('节点没有输入，也没连上游节点，无法运行！');
            return;
        }

        // 3. 标记状态：开始运行 (status = 'running')
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

            // 4. 拿到读取器 (Reader)
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) return;
            // 临时存一下当前的完整句子
            let currentOutput = '';

            // console.log("开始接收流式数据...");

            while (true) {
                // 5. 一点点读数据
                const { done, value } = await reader.read();
                if (done) break;

                // 6. 解码数据
                const chunk = decoder.decode(value);

                // 7. 解析 SSE 格式 (data: {...})
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
            // 8. 标记状态：成功 (status = 'success')
            updateNodeData(nodeId, { status: 'success' });
        } catch (error) {
            console.log('请求失败', error);
            // 标记状态：失败 (status = 'error')
            updateNodeData(nodeId, { status: 'error', output: '❌ 运行失败' });
        }
    }
}));
export default useStore;