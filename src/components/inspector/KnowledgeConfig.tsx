import React, { useRef } from 'react';
import { BookOpen, Upload, FileText } from 'lucide-react';
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

type Props = {
    nodeId: string;
    data: any;
    onChange: (key: string, value: any) => void;
    runNode: (id: string) => void;
};

const KnowledgeConfig = ({ nodeId, data, onChange, runNode }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { apiKeys, setIsKeyModalOpen } = useStore(
        useShallow(state => ({
            apiKeys: state.apiKeys,
            setIsKeyModalOpen: state.setIsKeyModalOpen
        }))
    );

    const retrievalMode = data.retrievalMode || 'sparse';
    const isDense = retrievalMode === 'dense';
    const isApiKeyMissing = isDense && !apiKeys.dashscope;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            onChange(nodeId, {
                documentText: text,
                fileName: file.name,
                status: 'success', // 读取成功后可标记状态为success
                output: `成功加载文档: ${file.name}\n内容长度: ${text.length} 字符`
            });
        };
        reader.onerror = () => {
            onChange(nodeId, {
                status: 'error',
                output: '文档读取失败'
            });
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">文档上传 (.txt / .md)</label>

            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.md"
                    className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">点击选择或拖拽文件到此处</span>
                {data.fileName && (
                    <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded">
                        <FileText className="w-3 h-3 mr-1" />
                        {data.fileName}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <label className="block text-sm font-medium text-gray-700 mb-2">检索模式</label>
            <div className="flex flex-col gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name={`retrievalMode-${nodeId}`}
                        value="sparse"
                        checked={!isDense}
                        onChange={(e) => onChange(nodeId, { retrievalMode: e.target.value })}
                        className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">稀疏检索 (本地计算，无需 API)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name={`retrievalMode-${nodeId}`}
                        value="dense"
                        checked={isDense}
                        onChange={(e) => onChange(nodeId, { retrievalMode: e.target.value })}
                        className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">向量稠密检索 (高精度，需外部 API)</span>
                </label>
                {isApiKeyMissing && (
                    <div className="mt-1 text-xs text-red-500 bg-red-50 p-2 rounded">
                        检测到未配置 API Key，将降级为本地检索。
                        <button
                            className="text-blue-500 hover:text-blue-600 underline ml-1 cursor-pointer"
                            onClick={() => setIsKeyModalOpen(true)}
                        >
                            去配置密钥
                        </button>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <label className="block text-sm font-medium text-gray-700 mb-1">附加提示词 (可选)</label>
            <textarea
                className="w-full border border-gray-300 rounded p-2 text-sm h-24 outline-none"
                placeholder="例如：请作为总结助手，根据这份文档回答问题..."
                value={data.prompt || ''}
                onChange={(e) => onChange(nodeId, { prompt: e.target.value })}
            />

            <div className="mt-4 mb-2">
                <button
                    onClick={() => runNode(nodeId)}
                    disabled={data.status === 'running' || !data.documentText}
                    className={`w-full py-2 rounded text-white font-medium transition-colors
                        ${data.status === 'running' ? 'bg-emerald-300' :
                            !data.documentText ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
                    `}
                >
                    {data.status === 'running' ? '处理中...' : '测试解析'}
                </button>
            </div>

            {/* 运行结果展示区 */}
            <div>
                <div className="flex items-center justify-between mb-2 mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                        <BookOpen className="inline-block w-4 h-4 mr-1" />
                        文档内容预览
                    </label>
                </div>
                <div className="bg-gray-100 rounded p-3 min-h-[100px] text-xs text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
                    {data.documentText ? (
                        <span>{data.documentText.slice(0, 500)}{data.documentText.length > 500 ? '\n...\n(内容过长已截断预览)' : ''}</span>
                    ) : (
                        <span className="text-gray-400 italic">尚未加载文档数据...</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeConfig;
