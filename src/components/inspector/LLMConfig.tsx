import React from 'react';
import { MessageSquareMore } from 'lucide-react';

type Props = {
    nodeId: string;
    data: any;
    onChange: (key: string, value: any) => void;
    runNode: (id: string) => void;
};

const LLMConfig = ({ nodeId, data, onChange, runNode }: Props) => {
    const outputText = data.output || '';
    const hasOutput = Boolean(outputText);

    const handleCopy = () => {
        if (!hasOutput) return;
        navigator.clipboard?.writeText(outputText).catch(() => {
        });
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模型型号</label>
            <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={data.model || 'GPT-4o'}
                onChange={(e) => onChange(nodeId, { model: e.target.value })}
            >
                <option value="Deepseek">Deepseek</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="GPT-3.5">GPT-3.5</option>
                <option value="Claude-3">Claude 3.5 Sonnet</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-1">功能选择</label>
            <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={data.func || 'chat'}
                onChange={(e) => onChange(nodeId, { func: e.target.value })}
            >
                <option value="chat">文字聊天</option>
                <option value="image">图片生成</option>
            </select>
            <textarea
                className="w-full border border-gray-300 rounded p-2 text-sm h-32 mt-2"
                placeholder="请输入提示词..."
                value={data.prompt || ''}
                onChange={(e) => onChange(nodeId, { prompt: e.target.value })}
            />
            <div className="border-t border-gray-200 my-4"></div>
            <div className="mt-4 mb-2">
                <button
                    onClick={() => runNode(nodeId)}
                    disabled={data.status === 'running'}
                    className={`w-full py-2 rounded text-white font-medium transition-colors
              ${data.status === 'running' ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
                >
                    {data.status === 'running' ? '正在思考...' : '运行'}
                </button>
            </div>
            {/* 运行结果展示区 */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        <MessageSquareMore className="inline-block w-4 h-4 mr-1" />
                        运行结果
                    </label>
                    <button
                        onClick={handleCopy}
                        disabled={!hasOutput}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${hasOutput ? 'border-indigo-500 text-indigo-600 hover:bg-indigo-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
                    >
                        复制
                    </button>
                </div>
                <div className="bg-gray-100 rounded p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
                    {hasOutput ? (
                        <span>{outputText}</span>
                    ) : (
                        <span className="text-gray-400 italic">等待运行...</span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default LLMConfig;