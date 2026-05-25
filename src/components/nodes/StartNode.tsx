import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { Flag } from 'lucide-react';
import NodeTemplate from './NodeTemplate';

const StartNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { updateNodeData } = useStore(
        useShallow((state) => ({ updateNodeData: state.updateNodeData }))
    );

    return (
        <NodeTemplate
            title="开始节点"
            icon={<Flag />}
            theme="pink"
            selected={selected}
        >
            {/* 内容区 */}
            <div className="p-4 bg-gray-50">
                <label className="text-xs text-gray-500 block mb-1">输入</label>
                <textarea
                    className="w-full h-20 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-pink-400 outline-none resize-none"
                    placeholder="例如：输入你的名字，或者一个主题..."
                    value={data.output || ''} // Start 节点的 output 就是用户的输入
                    onChange={(e) => updateNodeData(id, { output: e.target.value })}
                />
            </div>

            {/* 只有右边的 Source Handle */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-4 !h-4 !right-[-7px] !bg-pink-500"
            />
        </NodeTemplate>
    );
});

export default StartNode;