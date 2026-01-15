import React from 'react';
import { isImageUrl } from '../../utils/image-utils';


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
            {hasOutput ? (() => {
                switch (data.func) {
                    case 'image':
                        return <div>
                            {
                                isImageUrl(data.output) ? (
                                    <div className="relative group rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-gray-50">
                                        {/* 大图预览 */}
                                        <img
                                            src={data.output}
                                            alt="Generated Preview"
                                            className="w-full h-auto object-contain"
                                        />
                                        {/* 悬浮操作栏 */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs">2048 x 2048</span>
                                            <a
                                                href={data.output}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-white text-xs bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500 no-underline"
                                            >
                                                下载原图
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">等待图片生成...</span>
                                )
                            }
                        </div>
                    default:
                        return <div className="bg-gray-100 rounded p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
                            <span>{outputText}</span>
                        </div>;
                }

            })() : (
                <span className="text-gray-400 italic">等待运行...</span>
            )}

        </div>
    );
};

export default EndConfig;