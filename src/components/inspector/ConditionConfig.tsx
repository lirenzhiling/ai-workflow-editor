import React from 'react';

type Props = {
    nodeId: string;
    data: any;
    onChange: (nodeId: string, newData: any) => void;
}

const ConditionConfig = ({ nodeId, data, onChange }: Props) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-500">
                该节点将检查上游节点的输出内容。
            </div>

            {/* 选择操作符 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">判断条件</label>
                <select
                    value={data.operator || 'contains'}
                    onChange={(e) => onChange(nodeId, { operator: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none"
                >
                    <option value="contains">包含</option>
                    <option value="not_contains">不包含</option>
                </select>
            </div>

            {/* 目标值 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标值</label>
                <input
                    type="text"
                    value={data.targetValue || ''}
                    onChange={(e) => onChange(nodeId, { targetValue: e.target.value })}
                    placeholder="例如：Error, 成功, http..."
                    className="w-full border border-gray-300 rounded p-2 text-sm outline-none"
                />
            </div>
        </div>
    );
};

export default ConditionConfig;