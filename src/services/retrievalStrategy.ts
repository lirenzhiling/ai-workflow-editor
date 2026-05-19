import { chunkTextWithOverlap } from '../utils/text-chunker';
import { config } from './nodeExecutors';

export interface IRetrieverStrategy {
    retrieve(query: string, documentText: string, topK: number): Promise<string[]>;
}

export class SparseRetriever implements IRetrieverStrategy {
    async retrieve(query: string, documentText: string, topK: number): Promise<string[]> {
        const chunks = chunkTextWithOverlap(documentText, 500, 50);
        if (!query.trim()) return chunks.slice(0, topK);

        // 简单的关键词匹配打分 (TF)
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.trim().length > 0);

        const scoredChunks = chunks.map(chunk => {
            const chunkLower = chunk.toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                // 统计 term 在 chunk 中出现的次数
                const matches = chunkLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
                if (matches) {
                    score += matches.length;
                }
            }
            return { chunk, score };
        });

        // 按得分降序并取 topK
        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.chunk);
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class DenseRetriever implements IRetrieverStrategy {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async getEmbeddings(texts: string[]): Promise<number[][]> {
        const allEmbeddings: number[][] = [];

        // 分批处理，每批最多10条
        for (let i = 0; i < texts.length; i += 10) {
            const batch = texts.slice(i, i + 10);

            // 请求本地后端接口，由后端转发到百炼大模型
            const response = await fetch(config.api.embeddings, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey
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
            allEmbeddings.push(...data.data.map((item: any) => item.embedding));
        }

        return allEmbeddings;
    }

    async retrieve(query: string, documentText: string, topK: number): Promise<string[]> {
        const chunks = chunkTextWithOverlap(documentText, 500, 50);
        if (!query.trim() || chunks.length === 0) return chunks.slice(0, topK);

        // 获取 query 的 embedding 和 chunk 的 embeddings
        const allTexts = [query, ...chunks];

        let allEmbeddings: number[][];
        try {
            allEmbeddings = await this.getEmbeddings(allTexts);
        } catch (e) {
            console.error("Dense retrieval failed, fallback required or handled at upper layer.", e);
            throw e;
        }

        const queryEmbedding = allEmbeddings[0];
        const chunkEmbeddings = allEmbeddings.slice(1);

        const scoredChunks = chunks.map((chunk, index) => {
            const score = cosineSimilarity(queryEmbedding, chunkEmbeddings[index]);
            return { chunk, score };
        });

        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.chunk);
    }
}
