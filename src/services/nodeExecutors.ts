// src/services/nodeExecutors.ts
import { Node, Edge } from 'reactflow';
import { isImageUrl } from '../utils/image-utils';
import useStore from '../store';

// 定义一个通用的上下文，因为执行节点时需要用到 store 里的方法
interface ExecutionContext {
    nodeId: string;
    node: Node;
    nodes: Node[];
    edges: Edge[];
    updateNodeData: (id: string, data: any) => void;
    //在store.ts里找好上游节点
    sourceNode: Node | null;

    abortSignal?: AbortSignal;// 停止信号
    prompt?: string; // 提示词
    stopFlow?: () => void; // 停止整个流程的函数
}

// 配置 API 基础路径
const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';
export const config = {
    api: {
        baseUrl: apiBaseUrl,
        image: `${apiBaseUrl}/image`,
        chat: `${apiBaseUrl}/chat`,
        vision: `${apiBaseUrl}/vision`,
    },
};

//通用：获取多个上游输入节点中状态为 success 的节点
const getActiveSourceNode = (nodes: Node[], edges: Edge[], currentNodeId: string) => {
    // 找出所有指向当前节点的连线
    const incomingEdges = edges.filter(edge => edge.target === currentNodeId);

    const sourceNodes = incomingEdges.map(edge =>
        nodes.find(n => n.id === edge.source)
    ).filter(n => n !== undefined) as Node[];

    // 选择'success' 状态的
    const activeNodes = sourceNodes.filter(node =>
        node.data.status === 'success' && node.data.output
    );

    // 如果没找到（可能是刚开始运行），就返回随便一个，防止报错
    if (activeNodes.length === 0) return sourceNodes[0] || null;

    // 如果找到了，返回第一个（对于 If/Else 互斥分支，永远只有 1 个）
    // TODO：如果以后做并行处理，可以将 activeNodes 的 output 拼起来返回一个虚拟节点
    return activeNodes[0];
};

// End 节点的逻辑
export const executeEndNode = async ({ nodes, edges, nodeId, updateNodeData, stopFlow }: ExecutionContext) => {

    const activeSource = getActiveSourceNode(nodes, edges, nodeId);

    if (!activeSource) {
        updateNodeData(nodeId, { output: '等待上游输入...' });
        return;
    }

    updateNodeData(nodeId, {
        // 读取“成功运行”的节点的输出
        output: activeSource.data.output || '上游节点没有输出内容',
        func: activeSource.data.func || 'unknown',// 记录一下是上个节点的功能类型
        status: 'success'
    });
    updateNodeData(nodeId, { status: 'success' });
    stopFlow && stopFlow();
};


// ----------------LLM 节点的逻辑---------------------
export const executeLLMNode = async ({ nodeId, node, nodes, edges, abortSignal, updateNodeData }: ExecutionContext) => {
    // 准备数据
    let prompt = node.data.prompt || '';

    const activeSource = getActiveSourceNode(nodes, edges, nodeId);

    if (activeSource && activeSource.data.output) {
        console.log(`${nodeId}成功连接！接收到上游数据: ${activeSource.data.output.slice(0, 10)}...`);
        prompt = `【上文输入】：\n${activeSource.data.output}\n\n【我的指令】：\n${prompt}`;
    }
    if (!prompt.trim()) {
        alert('节点没有输入，无法运行！');
        return;
    }

    const model = node.data.model || 'Deepseek';

    // 取对应的 Key
    const provider = getProviderByModel(model);
    const allApiKeys = useStore.getState().apiKeys;
    const userApiKey = allApiKeys[provider];

    console.log(`模型: ${model} -> 服务商: ${provider}`);

    const func = node.data.func || 'chat';

    if (func === 'image') {
        console.log("图像生成");

        await executeImage({ nodeId, node, prompt, sourceNode: activeSource, abortSignal, nodes, edges, updateNodeData });
        return;
    }
    if (activeSource && activeSource.data.func === 'image' && isImageUrl(activeSource.data.output)) {
        await executeVision({ nodeId, node, prompt, sourceNode: activeSource, abortSignal, updateNodeData, nodes, edges });
        return;
    }

    // 标记状态：开始运行 (status = 'running')
    // 复用 updateNodeData 来更新状态
    // const { updateNodeData } = get();
    updateNodeData(nodeId, { status: 'running', output: '' });
    const apiUrl = config.api.chat;
    try {
        console.log("发送内容：" + prompt);
        // console.log(userApiKey, provider);

        const response = await fetch(apiUrl, {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
                'x-api-key': userApiKey || '', // 传 Key
                'x-provider': provider
            },
            signal: abortSignal,
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        // 检查 HTTP 状态码
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // 如果不是 JSON，尝试读取文本
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch {
                }
            }
            console.error('API 错误:', errorMessage);
            updateNodeData(nodeId, { status: 'error', output: errorMessage });
            const setIsKeyModalOpen = useStore.getState().setIsKeyModalOpen;
            setIsKeyModalOpen(true);
            return;
        }

        if (!response.body) {
            updateNodeData(nodeId, { status: 'error', output: '响应体为空' });
            return;
        }

        // 拿到读取器 (Reader)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;
        // 临时存一下当前的完整句子
        let currentOutput = '';

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
        if (error instanceof Error && error.name === 'AbortError') {
            updateNodeData(nodeId, { status: 'idle', output: '已手动停止' });
        } else if (error instanceof Error) {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: `运行失败` });
        } else {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: 'Unknown error occurred' });
        }
    }
};

// 绘图执行逻辑
export const executeImage = async ({ nodeId, prompt, abortSignal, updateNodeData }: ExecutionContext) => {

    console.log('绘图提示词：' + prompt);

    if (!prompt) {
        alert('给点图像生成的描述吧！');
        return;
    }

    // 标记为运行中
    updateNodeData(nodeId, { status: 'running', output: '' });

    //画图只能用指定的ai
    const userApiKey = useStore.getState().apiKeys.doubao;

    try {
        // 调用刚才写的后端接口
        // 这里的 replace 是为了复用 Webpack 注入的 API_URL 基础路径
        const apiUrl = config.api.image;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': userApiKey || '',
                'x-provider': 'doubao'
            },
            signal: abortSignal,
            body: JSON.stringify({ prompt: prompt })
        });
        // 检查 HTTP 状态码
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // 如果不是 JSON，尝试读取文本
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch {
                }
            }
            console.error('API 错误:', errorMessage);
            updateNodeData(nodeId, { status: 'error', output: errorMessage });
            const setIsKeyModalOpen = useStore.getState().setIsKeyModalOpen;
            setIsKeyModalOpen(true);
            return;
        }
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // 成功
        updateNodeData(nodeId, {
            status: 'success',
            output: data.imageUrl
        });

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            updateNodeData(nodeId, { status: 'idle', output: '已手动停止' });
        } else if (error instanceof Error) {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: `运行失败` });
            const setIsKeyModalOpen = useStore.getState().setIsKeyModalOpen;
            setIsKeyModalOpen(true);
        } else {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: 'Unknown error occurred' });
        }
    }
};

// 图像识别逻辑
export const executeVision = async ({ nodeId, prompt, sourceNode, abortSignal, updateNodeData }: ExecutionContext) => {
    const imageUrl = sourceNode?.data.output || '';

    if (!imageUrl || !isImageUrl(imageUrl)) {
        alert('没有图片输入，无法运行视觉识别！');
        return;
    }

    updateNodeData(nodeId, { status: 'running', output: '' });

    //识图只能用指定的ai
    const userApiKey = useStore.getState().apiKeys.doubao;

    try {
        const response = await fetch(config.api.vision, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': userApiKey || '',
                'x-provider': 'doubao'
            },
            signal: abortSignal,
            body: JSON.stringify({
                prompt: prompt || '请描述这张图片的内容',
                imageUrl: imageUrl,
            })
        });

        // 检查 HTTP 状态码
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // 如果不是 JSON，尝试读取文本
                try {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                } catch {
                }
            }
            console.error('API 错误:', errorMessage);
            updateNodeData(nodeId, { status: 'error', output: errorMessage });
            const setIsKeyModalOpen = useStore.getState().setIsKeyModalOpen;
            setIsKeyModalOpen(true);
            return;
        }

        // const data = await response.json();
        // if (data.error) throw new Error(data.error);
        // const outputText = data?.data?.output_text ?? data?.output_text ?? data?.output ?? '';
        if (!response.body) {
            updateNodeData(nodeId, { status: 'error', output: '响应体为空' });
            return;
        }
        // 拿到读取器 (Reader)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;
        // 临时存一下当前的完整句子
        let currentOutput = '';

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
        updateNodeData(nodeId, { status: 'success', output: currentOutput });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            updateNodeData(nodeId, { status: 'idle', output: '已手动停止' });
        } else if (error instanceof Error) {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: '运行失败' });
            const setIsKeyModalOpen = useStore.getState().setIsKeyModalOpen;
            setIsKeyModalOpen(true);
        } else {
            console.error(error);
            updateNodeData(nodeId, { status: 'error', output: 'Unknown error occurred' });
        }
    }
};

const getProviderByModel = (modelName: string): 'doubao' | 'deepseek' => {
    const lower = modelName.toLowerCase();
    if (lower.includes('deepseek')) return 'deepseek';
    if (lower.includes('doubao')) return 'doubao';
    return 'deepseek'; // 默认使用 deepseek
};
// ----------------LLM 节点的逻辑---------------------

//条件节点逻辑
export const executeConditionNode = async ({ nodeId, node, sourceNode, updateNodeData }: ExecutionContext) => {
    const input = sourceNode?.data.output || ''; // 上游输入
    const target = node.data.targetValue || '';  // 设定的目标值
    const operator = node.data.operator || 'contains';

    let result = false;

    // 执行具体的比较逻辑
    switch (operator) {
        case 'contains':
            result = input.includes(target);
            break;
        case 'not_contains':
            result = !input.includes(target);
            break;
        default:
            result = false;
    }

    console.log(`判断节点 ${nodeId}: "${input}" ${operator} "${target}" => ${result}`);

    // 保存状态，还要保存 "selectedPath" (选中的路径 ID)
    // true 对应 ID "true"，false 对应 ID "false"
    updateNodeData(nodeId, {
        status: 'success',
        result: result, // 存个布尔值给 UI 用
        selectedPath: result ? 'true' : 'false', // 存个 handleId 给 Store 用
        output: input // 把输入透传下去，方便下游继续使用
    });
};

// 注册表：把类型映射到函数
export const executors: Record<string, Function> = {
    endNode: executeEndNode,
    llmNode: executeLLMNode,
    conditionNode: executeConditionNode,
};