import React from 'react';

type Props = {
    data: any;
    onChange: (key: string, value: any) => void;
};

const StartConfig = ({ data, onChange }: Props) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输入内容</label>
            <textarea
                className="w-full border border-gray-300 rounded p-2 text-sm h-32 mt-2"
                placeholder="请输入提示词..."
                value={data.output || ''}
                onChange={(e) => onChange('output', e.target.value)}
            />
        </div>
    );
};

export default StartConfig;