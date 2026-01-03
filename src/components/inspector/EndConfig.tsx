import React from 'react';

type Props = {
    data: any;
};

const EndConfig = ({ data }: Props) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输出内容</label>
            <div className="bg-gray-100 rounded p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-60">
                {data.output ? (
                    <span>{data.output}</span>
                ) : (
                    <span className="text-gray-400 italic">等待运行...</span>
                )}
            </div>
        </div>
    );
};

export default EndConfig;