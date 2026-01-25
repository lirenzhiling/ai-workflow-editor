// src/utils/request-utils.ts

interface StreamRequestOptions {
    url: string;
    method?: string;
    func?: "chat" | "image";
    headers?: Record<string, string>;
    body?: any;
    abortSignal?: AbortSignal;
    onData: (text: string) => void; // 回调：每次收到增量内容时触发
    onError?: (error: string) => void; // 回调：出错时触发
}

/**
 * 封装好的 SSE 流式请求工具
 * 负责：Fetch -> 校验状态 -> 读取流 -> 解码 -> 解析 SSE -> 回调
 */
export async function fetchStream({
    url,
    method = 'POST',
    func,
    headers = {},
    body,
    abortSignal,
    onData,
    onError
}: StreamRequestOptions) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            signal: abortSignal,
            body: JSON.stringify(body)
        });

        // 1. 错误处理
        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // 如果不是 JSON，尝试读取文本
                try {
                    errorMessage = await response.text() || errorMessage;
                } catch { }
            }
            if (onError) onError(errorMessage);
            throw new Error(errorMessage);
        }

        if (!response.body) {
            if (onError) onError("响应体为空");
            return;
        }

        // 2. 读取核心逻辑
        if (func === 'image') {
            const data = await response.json();
            onData(data)

        } else if (func === 'chat') {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') break;

                        try {
                            const dataObj = JSON.parse(jsonStr);
                            const content = dataObj.content || dataObj.delta; // 兼容不同后端字段

                            // 触发回调
                            if (content) {
                                onData(content);
                            }
                        } catch (e) {
                            console.warn("SSE 解析忽略非JSON行:", line);
                        }
                    }
                }
            }
        }



    } catch (error: any) {
        // 如果是手动停止，不视为错误，但也可以抛出让外层处理
        if (error.name === 'AbortError') {
            throw error;
        }
        if (onError) onError(error.message || '未知网络错误');
        throw error; // 继续抛出，让外层决定是否要把 status 设为 error
    }
}