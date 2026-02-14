import { executors } from './nodeExecutors';
import useStore, { RFState } from '../store';

// 定义指挥官类
class WorkflowRunner {
    // 任务清单
    private queue: string[] = [];
    private isRunning: boolean = false;

    // --- 【启动方法】 ---
    // 对应以前的 runFlow，负责一切初始化工作
    public async start() {


        const store = useStore.getState();

        // 初始化变量
        this.queue = []; // 清空清单
        this.isRunning = true; // 标记
        this.resetNodes(store);

        // 初始化控制器
        store.stopFlow();
        const controller = new AbortController();
        useStore.setState({ isRunning: true, abortController: controller });

        // 找到起点
        const startNode = store.nodes.find(n => n.type === 'startNode');
        if (!startNode) {
            alert('找不到开始节点！');
            this.stop();
            return;
        }

        // 把起点加入清单
        this.queue.push(startNode.id);

        // 启动循环引擎
        await this.processQueue();
    }

    // --- 【停止方法】 ---
    public stop() {
        this.isRunning = false; // 标记：停
        this.queue = [];

        const store = useStore.getState();
        store.abortController?.abort(); // 中断网络请求
        useStore.setState({ isRunning: false, abortController: null });
    }


    private async processQueue() {
        // 只要清单里还有任务，就一直循环
        while (this.queue.length > 0 && this.isRunning) {

            //同一层并行执行
            const currentBatch = [...this.queue];

            this.queue = [];


            await Promise.all(currentBatch.map(async (nodeId) => {
                // 并行过程中点了停止
                if (!this.isRunning) return;

                const success = await this.executeNode(nodeId);

                // 如果执行成功，把它的下游节点加入清单（排队到下一层）
                if (success) {
                    this.scheduleNextNodes(nodeId);
                }
            }));
        }

        // 循环结束
        if (this.queue.length === 0) {
            this.stop();
        }
    }

    // --- 【执行单个节点】 ---
    public async runSingleNode(nodeId: string) {
        const store = useStore.getState();

        // 初始化状态 (创建遥控器，标记运行中)
        store.stopFlow(); // 先清理旧的
        const controller = new AbortController();
        useStore.setState({ isRunning: true, abortController: controller });
        this.isRunning = true; // 让 processQueue 里的 check 也能过（虽然单步不走 queue）

        try {
            // 执行节点
            await this.executeNode(nodeId);
        } finally {
            // 跑完立刻清理 (因为不需要触发下游)
            useStore.setState({ isRunning: false, abortController: null });
            this.isRunning = false;
        }
    }

    // --- 【核心引擎：循环处理清单】 ---
    // BFS 循环
    private async executeNode(nodeId: string): Promise<boolean> {

        const store = useStore.getState();

        // 双重保险：如果用户点了停止，这里就不执行了
        if (!store.isRunning) return false;
        const node = store.nodes.find(n => n.id === nodeId);
        if (!node) return false;
        console.log({ node });


        try {
            const handler = executors[node.type || ''];
            if (!handler) return false;
            console.log(2223);
            // 准备上下文
            const incomingEdge = store.edges.find((edge) => edge.target === nodeId);
            const sourceNode = incomingEdge
                ? store.nodes.find((n) => n.id === incomingEdge.source) || null
                : null;

            // 执行
            await handler({
                nodeId,
                node,
                nodes: store.nodes,
                edges: store.edges,
                updateNodeData: store.updateNodeData,
                sourceNode,
                abortSignal: store.abortController?.signal,
                stopFlow: () => this.stop()
            });


            // 检查执行结果：必须重新去 Store 取一次最新状态
            const updatedNode = useStore.getState().nodes.find(n => n.id === nodeId);
            // 只有状态变成 success 才算成功
            return updatedNode?.data?.status === 'success';

        } catch (error) {
            console.error(`节点 ${nodeId} 执行出错:`, error);
            store.updateNodeData(nodeId, { status: 'error', output: '执行异常' });
            return false;
        }
    }

    // 调度下游
    private scheduleNextNodes(nodeId: string) {
        const store = useStore.getState();
        const outgoingEdges = store.edges.filter(edge => edge.source === nodeId);
        const currentNode = store.nodes.find(n => n.id === nodeId);

        outgoingEdges.forEach(edge => {
            // 处理条件节点逻辑 (ConditionNode)
            if (currentNode?.type === 'conditionNode') {
                const selectedPath = currentNode.data.selectedPath;
                if (edge.sourceHandle !== selectedPath) return;
            }

            // 把下游节点的 ID push 进清单
            if (!this.queue.includes(edge.target)) {
                this.queue.push(edge.target);
            }
        });
    }

    // 辅助工具：把所有节点状态重置为 idle
    private resetNodes(store: RFState) {
        const resetNodes = store.nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                status: 'idle',
                output: node.type === 'startNode' ? node.data.output : ''
            }
        }));
        useStore.setState({ nodes: resetNodes });
    }
}

// 导出这个指挥官的实例
export const workflowRunner = new WorkflowRunner();