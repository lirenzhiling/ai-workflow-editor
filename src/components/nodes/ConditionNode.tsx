import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Split } from 'lucide-react';

const ConditionNode = memo(({ data, selected }: NodeProps) => {
    return (
        <div className={`w-64 bg-white rounded-lg border-2 border-orange-500 shadow-xl overflow-hidden transition-all duration-200 
      ${selected ? 'ring-8 ring-orange-400/70  ring-offset-4 shadow-2xl shadow-indigo-500/60 scale-105' : ''}`}>

            {/* 标题栏 */}
            <div className="p-2 text-white flex items-center bg-orange-500">
                <Split className="w-5 h-5 mr-2" />
                <span className="font-bold text-sm">条件判断 (If-Else)</span>
            </div>

            {/* 左侧输入 Handle */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />
            {/* 内容区 */}
            <div className='p-4 bg-gray-50 flex flex-col gap-2 min-h-[80px]'>
                <div className="flex">
                    <div className="text-xs text-gray-500">
                        条件 <span className="font-bold">{data.operator || '未填写'}</span>
                    </div>
                    <div className="absolute -right-3 flex items-center">
                        <span className="text-xs font-bold mr-4 px-1">if</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="true"
                            className="w-3 h-3 !right-3" // !right-3 是为了调整位置
                        />
                    </div>
                </div>
                <div className="flex">
                    <div className="absolute -right-3 flex items-center">
                        <span className="text-xs font-bold mr-4 px-1">else</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="false"
                            className="w-3 h-3 !right-3"
                        />
                    </div>
                </div>
            </div>

        </div>
    );
});

export default ConditionNode;