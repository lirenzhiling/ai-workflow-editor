/**
 * 纯前端工业级文本切分工具 (滑动窗口算法)
 * @param text 原始长文本
 * @param chunkSize 每个切块的最大长度 (默认 500 字)
 * @param overlap 相邻切块的重叠长度 (默认 50 字，防止上下文断裂)
 * @returns 切分后的文本数组
 */
export const chunkTextWithOverlap = (text: string, chunkSize: number = 500, overlap: number = 50): string[] => {
    if (!text || text.trim() === '') return [];

    const chunks: string[] = [];
    let startIndex = 0;

    // 滑动窗口开始切割
    while (startIndex < text.length) {
        // 计算当前这刀切到哪里
        const endIndex = startIndex + chunkSize;
        // 把切下来的丢进数组
        chunks.push(text.slice(startIndex, endIndex));

        // 下一次切的时候，往后退一点（减去 overlap），保证两块文本有交集
        startIndex += (chunkSize - overlap);
    }

    return chunks;
};