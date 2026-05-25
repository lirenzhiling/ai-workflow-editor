import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Split } from 'lucide-react';
import NodeTemplate from './NodeTemplate';

const ConditionNode = memo(({ data, selected }: NodeProps) => {
    return (
        <NodeTemplate
            title="条件判断 (If-Else)"
            icon={<Split />}
            theme="orange"
            selected={selected}
        >
            {/* 左侧输入 Handle */}
            <Handle type="target" position={Position.Left} className="!w-4 !h-4 !left-[-7px] !bg-orange-500" />

            {/* 内容区 */}
            <div className='p-4 bg-gray-50 flex flex-col gap-2 min-h-[80px]'>
                <div className="flex">
                    <div className="text-xs text-gray-500">
                        条件 <span className="font-bold">{(data.operator || '未填写') + ' ' + data.targetValue}</span>
                    </div>
                    <div className="absolute -right-3 flex items-center">
                        <span className="text-xs font-bold mr-5 px-1">if</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="true"
                            className="!w-4 !h-4 !right-[5px] !bg-orange-500" // !right-3 是为了调整位置
                        />
                    </div>
                </div>
                <div className="flex">
                    <div className="absolute -right-3 flex items-center">
                        <span className="text-xs font-bold mr-5 px-1">else</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="false"
                            className="!w-4 !h-4 !right-[5px] !bg-orange-500"
                        />
                    </div>
                </div>
            </div>
        </NodeTemplate>
    );
});

export default ConditionNode;