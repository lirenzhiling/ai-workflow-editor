import React from 'react';
import useStore from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { executeImageGenNode } from '../../services/nodeExecutors';

type Props = {
    nodeId: string;
    data: any;
    onChange: (key: string, value: any) => void;
};

const StartConfig = ({ nodeId, data, onChange }: Props) => {
    const { nodes, edges, updateNodeData } = useStore(
        useShallow((state) => ({
            nodes: state.nodes,
            edges: state.edges,
            updateNodeData: state.updateNodeData
        }))
    );

    const handleTestImageGen = async () => {
        // 获取当前节点
        const currentNode = nodes.find(n => n.id === nodeId);
        if (!currentNode) {
            alert('找不到当前节点！');
            return;
        }

        // StartNode 是开始节点，直接使用当前节点的输入
        await executeImageGenNode({
            nodeId,
            node: currentNode,
            nodes,
            edges,
            updateNodeData,
            sourceNode: null
        });
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输入内容</label>
            <textarea
                className="w-full border border-gray-300 rounded p-2 text-sm h-32 mt-2"
                placeholder="请输入提示词..."
                value={data.output || ''}
                onChange={(e) => onChange(nodeId, { output: e.target.value })}
            />
            <button
                onClick={handleTestImageGen}
                className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                🎨 测试图像生成
            </button>
        </div>
    );
};

export default StartConfig;