import { chunkTextWithOverlap } from '../utils/text-chunker';
import { config } from './nodeExecutors';

/**
 * 检索策略接口 (基于“策略模式”设计)
 * 只要实现了这个接口的对象，都可以被当做一种检索方案。
 * 这样做的好处是：当我们要切换不同的检索算法，主流程代码完全不需要修改，符合“开闭原则”。
 */
export interface IRetrieverStrategy {
    // query: 用户的提问词
    // documentText: 用户上传的长文档纯文本内容
    // topK: 我们要筛选出最相关的多少段文本
    retrieve(query: string, documentText: string, topK: number): Promise<string[]>;
}

// ==========================================
// 1. 本地稀疏检索 (不需要 API，完全在浏览器计算)
// ==========================================
export class SparseRetriever implements IRetrieverStrategy {
    async retrieve(query: string, documentText: string, topK: number): Promise<string[]> {
        // 第一步：先用滑动窗口把整篇长文切成一小块一小块（带有一定的相互重叠，防止一句话被硬生生切断）
        const chunks = chunkTextWithOverlap(documentText, 500, 50);

        // 如果用户没填问题，就直接返回文章最开头的 topK 段
        if (!query.trim()) return chunks.slice(0, topK);

        // 第二步：简单粗暴的关键词匹配打分 (即 TF：词频计算)
        // 把问题转小写，然后按空格分割成一个个单独的词(terms)
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.trim().length > 0);

        // 第三步：给每一块文本进行遍历打分
        const scoredChunks = chunks.map(chunk => {
            const chunkLower = chunk.toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                // 统计该词在这个 chunk 里出现了几次。
                // replace 里是为了给特殊符号转义，防止正则报错
                const matches = chunkLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
                if (matches) {
                    score += matches.length; // 出现多少次就加多少分
                }
            }
            return { chunk, score };
        });

        // 第四步：根据得分，从高到低排序，拿到前 topK 个片段，提取出文本返回
        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.chunk);
    }
}

/**
 * 余弦相似度计算 (用于衡量两个向量距离的数学公式)
 * 作用：比较两个高维数组。得到的值区间一般在 -1 到 1，越接近 1 代表两段文本语义越相似。
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0; // 分子：两向量的点积
    let normA = 0;      // 分母：向量 A 的模的平方
    let normB = 0;      // 分母：向量 B 的模的平方
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    // 防止极其特殊情况出现除以0的错误
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ==========================================
// 2. API云端检索 (将文本发给大模型转为向量，利用语义寻找最匹配的段落)
// ==========================================
export class DenseRetriever implements IRetrieverStrategy {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey; // 实例化时必须提供用户输入的密钥
    }

    /**
     * 辅助类方法：调用后端代理服务器并向“阿里百炼”请求文本向量化（Embedding）处理
     */
    private async getEmbeddings(texts: string[]): Promise<number[][]> {
        const allEmbeddings: number[][] = [];

        // 分批处理，因为第三方大模型服务通常会限制一次性传进去的数组长度(比如有的限制 16/50)
        // 这里以最保险的 10 个为一批次 (batch) 进行请求
        for (let i = 0; i < texts.length; i += 10) {
            const batch = texts.slice(i, i + 10);

            // 请求本地的后端接口 (/api/embeddings)，由我们自己的后端转发到百炼去要数据。
            // 为了安全，前端不直接访问 dashscope，这也彻底避开了浏览器的跨域 (CORS) 问题。
            const response = await fetch(config.api.embeddings, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey // 在头部带上密码，由后端拦截提取
                },
                body: JSON.stringify({
                    input: batch
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(`Backend Error: ${data.error}`);
            }

            // 将从后端拿到的这一组批次向量，拆解追加到 allEmbeddings 总结果里
            allEmbeddings.push(...data.data.map((item: any) => item.embedding));
        }

        return allEmbeddings;
    }

    async retrieve(query: string, documentText: string, topK: number): Promise<string[]> {
        // 第一步：同样的，切片
        const chunks = chunkTextWithOverlap(documentText, 500, 50);
        if (!query.trim() || chunks.length === 0) return chunks.slice(0, topK);

        // 第二步：这是一个小优化点！将“用户的提问(query)”和“所有的分块(chunks)”拼接成一个数组去请求向量，
        // 从而最大程度减少网络请求次数！
        const allTexts = [query, ...chunks];

        let allEmbeddings: number[][];
        try {
            allEmbeddings = await this.getEmbeddings(allTexts);
        } catch (e) {
            console.error("Dense retrieval failed, fallback required or handled at upper layer.", e);
            // 抛向外层节点执行器，让其处理报错或实施降级
            throw e;
        }

        // 第三步：将返回的总向量数组，按之前拼接的顺序拆解还原
        const queryEmbedding = allEmbeddings[0]; // 第一个总是 query 的向量
        const chunkEmbeddings = allEmbeddings.slice(1); // 剩下的全是 chunks 的向量

        // 第四步：逐个计算并给文本块打分（计算 query向量 与 每个chunk向量 的空间夹角相似度）
        const scoredChunks = chunks.map((chunk, index) => {
            const score = cosineSimilarity(queryEmbedding, chunkEmbeddings[index]);
            return { chunk, score };
        });

        // 第五步：按照打分情况从高到低排序，并截取最靠前（最相关）的 TopK 返回
        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.chunk);
    }
}
