import React from 'react';

type Props = {
    data: any;
};

const EndConfig = ({ data }: Props) => {
    const outputText = data.output || '';
    const hasOutput = Boolean(outputText);

    const handleCopy = () => {
        if (!hasOutput) return;
        navigator.clipboard?.writeText(outputText).catch(() => {
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">输出内容</label>
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
    );
};

export default EndConfig;