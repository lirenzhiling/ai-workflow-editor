import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

const EndNode = memo(({ data, isConnectable, selected }: NodeProps) => {

    return (
        <div className={`w-64 bg-white rounded-lg border-2 border-pink-500 shadow-xl overflow-hidden transition-shadow duration-200 ${selected ? 'ring-8 ring-pink-400/70 ring-offset-4 shadow-2xl shadow-pink-500/60 scale-105' : ''}`}>
            {/* 标题栏 */}
            <div className="p-2 text-white flex items-center bg-pink-500 bg-gradient-to-r from-pink-500 to-rose-500">
                <span className="text-xl mr-2">🏁</span>
                <span className="font-bold text-sm">结束节点</span>
            </div>

            {/* 内容区 */}
            <div className="p-4 bg-gray-50">
                <label className="text-xs text-gray-500 block mb-1">输出</label>
            </div>

            {/* 只有左边的 Target Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-pink-500"
            />
        </div>
    );
});

export default EndNode;