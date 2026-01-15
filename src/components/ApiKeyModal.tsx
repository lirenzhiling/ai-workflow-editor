// src/components/ApiKeyModal.tsx
import React, { useState } from 'react';
import useStore from '../store';
import { useShallow } from 'zustand/react/shallow';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const ApiKeyModal = ({ isOpen, onClose }: Props) => {
    const { apiKeys, updateApiKey } = useStore(useShallow(state => ({
        apiKeys: state.apiKeys,
        updateApiKey: state.updateApiKey
    })));

    const [showDoubao, setShowDoubao] = useState(false);
    const [showDeepseek, setShowDeepseek] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[480px] p-6 animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-gray-800 mb-2"><KeyRound className="inline-block mr-2 text-green-500" />配置 API 密钥</h2>
                <p className="text-sm text-gray-500 mb-6">
                    不同的模型需要不同的 Key，请分别配置。数据仅存储在本地。
                </p>

                <div className="flex flex-col gap-4 mb-6">
                    {/* 豆包 / 火山引擎 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                            <span>火山引擎 (豆包/Doubao)</span>
                            <span className="text-gray-400 font-normal">用于画图、识图</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showDoubao ? "text" : "password"}
                                value={apiKeys.doubao}
                                onChange={(e) => updateApiKey('doubao', e.target.value)}
                                placeholder="xxxxxxxx-xxxx (Doubao)"
                                className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:border-green-500 outline-none"
                            />
                            <div
                                className="absolute right-3 top-2 cursor-pointer"
                                onClick={() => setShowDoubao(!showDoubao)}
                            >
                                {showDoubao ? (
                                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Deepseek */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                            <span>Deepseek (深度求索)</span>
                            <span className="text-gray-400 font-normal">用于 V3/R1 对话</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showDeepseek ? "text" : "password"}
                                value={apiKeys.deepseek}
                                onChange={(e) => updateApiKey('deepseek', e.target.value)}
                                placeholder="sk-xxxxxxxx (Deepseek)"
                                className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:border-green-500 outline-none"
                            />
                            <div
                                className="absolute right-3 top-2 cursor-pointer"
                                onClick={() => setShowDeepseek(!showDeepseek)}
                            >
                                {showDeepseek ? (
                                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* OpenAI (预留) */}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;