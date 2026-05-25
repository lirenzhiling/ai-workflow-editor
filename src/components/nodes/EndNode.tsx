import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flag } from 'lucide-react';
import NodeTemplate from './NodeTemplate';

const EndNode = memo(({ isConnectable, selected }: NodeProps) => {

    return (
        <NodeTemplate
            title="结束节点"
            icon={<Flag />}
            theme="pink"
            selected={selected}
        >
            {/* 内容区 */}
            <div className="p-4 bg-gray-50">
                <label className="text-xs text-gray-500 block mb-1">输出</label>
            </div>

            {/* 只有左边的 Target Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-4 !h-4 !left-[-7px] !bg-pink-500"
            />
        </NodeTemplate>
    );
});

export default EndNode;