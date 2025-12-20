import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';

const StartNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { updateNodeData } = useStore(
        useShallow((state) => ({ updateNodeData: state.updateNodeData }))
    );

    return (
        <div className={`w-64 bg-white rounded-lg border-2 border-pink-500 shadow-xl overflow-hidden transition-shadow duration-200 ${selected ? 'ring-8 ring-pink-400/70 ring-offset-4 shadow-2xl shadow-pink-500/60 scale-105' : ''}`}>
            {/* 标题栏 */}
            <div className="p-2 text-white flex items-center bg-pink-500 bg-gradient-to-r from-pink-500 to-rose-500">
                <span className="text-xl mr-2">🏁</span>
                <span className="font-bold text-sm">开始节点</span>
            </div>

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
                className="w-3 h-3 bg-pink-500"
            />
        </div>
    );
});

export default StartNode;