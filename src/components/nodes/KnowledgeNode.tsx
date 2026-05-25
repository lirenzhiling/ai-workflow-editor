import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BookOpen } from 'lucide-react';
import { workflowRunner } from '../../services/workflowEngine';
import NodeTemplate from './NodeTemplate';

const KnowledgeNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {

    const handleRun = () => {
        workflowRunner.runSingleNode(id);
    };

    return (
        <NodeTemplate
            title="知识库 (Knowledge)"
            icon={<BookOpen />}
            theme="emerald"
            selected={selected}
        >
            {/* 状态 / 内容区域 */}
            <div className="p-2 bg-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-500">已加载文档</div>
                <div className="text-sm font-bold text-gray-700 truncate max-w-[120px]" title={data.fileName || '未选择'}>
                    {data.fileName || '未选择'}
                </div>
            </div>

            {/* 运行按钮 - 用于独立运行此节点检查解析结果等测试场景 */}
            <button
                onClick={handleRun}
                className={`w-full text-white p-1 transition-colors flex items-center justify-center
            ${data.status === 'running' ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'}
            ${data.status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
          `}
            >
                {(() => {
                    switch (data.status) {
                        case 'running': return '处理中...';
                        case 'success': return '已就绪';
                        case 'error': return '解析失败';
                        default: return '解析文档';
                    }
                })()}
            </button>

            {/* 知识库节点可接受上游输入（例如控制信号等，虽然通常作为起点使用，但保留连理性） */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-4 !h-4 !left-[-7px] !bg-emerald-500"
            />

            {/* 右边的输出点：供 downstream 的 LLM 节点连线 */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-4 !h-4 !right-[-7px] !bg-emerald-500"
            />
        </NodeTemplate>
    );
});

export default KnowledgeNode;
