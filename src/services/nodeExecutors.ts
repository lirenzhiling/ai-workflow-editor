// src/services/nodeExecutors.ts
import { Node, Edge } from 'reactflow';

// 定义一个通用的上下文，因为执行节点时需要用到 store 里的方法
interface ExecutionContext {
    nodeId: string;
    node: Node;
    nodes: Node[];
    edges: Edge[];
    updateNodeData: (id: string, data: any) => void;
    //在store.ts里找好上游节点
    sourceNode: Node | null;
}

// 配置 API 基础路径
const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';
export const config = {
    api: {
        baseUrl: apiBaseUrl,
        image: `${apiBaseUrl}/image`,
        chat: `${apiBaseUrl}/chat`,
    },
};

// End 节点的逻辑
export const executeEndNode = async ({ nodeId, sourceNode, updateNodeData }: ExecutionContext) => {
    if (!sourceNode) {
        alert('End节点还没连线呢！');
        return;
    }

    // 直接用 sourceNode
    updateNodeData(nodeId, {
        output: sourceNode.data.output || '上游节点还没有输出哦~',
        func: sourceNode.data.func || 'unknown',// 记录一下是上个节点的功能类型
        status: 'success'
    });

};

// LLM 节点的逻辑
export const executeLLMNode = async ({ nodeId, node, nodes, sourceNode, updateNodeData }: ExecutionContext) => {
    // 准备数据
    let prompt = node.data.prompt || '';

    if (sourceNode && sourceNode.data.output) {
        console.log(`成功连接！接收到上游数据: ${sourceNode.data.output.slice(0, 10)}...`);
        prompt = `【上文输入】：\n${sourceNode.data.output}\n\n【我的指令】：\n${prompt}`;
    }
    if (!prompt.trim()) {
        alert('节点没有输入，无法运行！');
        return;
    }

    const func = node.data.func || 'chat';
    console.log(func);

    if (func === 'image') {
        console.log("图像生成");

        await executeImage({ nodeId, node, sourceNode, nodes: [], edges: [], updateNodeData });
        return;
    }

    // 标记状态：开始运行 (status = 'running')
    // 复用 updateNodeData 来更新状态
    // const { updateNodeData } = get();
    updateNodeData(nodeId, { status: 'running', output: '' });
    const apiUrl = config.api.chat;
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
        updateNodeData(nodeId, { status: 'error', output: '运行失败' });
    }
};

// 绘图执行逻辑
export const executeImage = async ({ nodeId, node, sourceNode, updateNodeData }: ExecutionContext) => {
    // 拼接 Prompt：上游输出（可选）+自己的描述
    const upstreamText = sourceNode?.data.output || '';
    const localPrompt = node.data.output || '';

    const finalPrompt = `${upstreamText} ${localPrompt}`.trim();

    if (!finalPrompt) {
        alert('给点图像生成的描述吧！');
        return;
    }

    // 标记为运行中
    updateNodeData(nodeId, { status: 'running', output: '' });

    try {
        // 调用刚才写的后端接口
        // 这里的 replace 是为了复用 Webpack 注入的 API_URL 基础路径
        const apiUrl = config.api.image;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // 成功
        updateNodeData(nodeId, {
            status: 'success',
            output: data.imageUrl
        });

    } catch (error) {
        console.error(error);
        updateNodeData(nodeId, { status: 'error', output: '绘图失败，请检查后端日志' });
    }
};

// 注册表：把类型映射到函数
export const executors: Record<string, Function> = {
    endNode: executeEndNode,
    llmNode: executeLLMNode,
    // 以后加新节点，在这里注册一行
};