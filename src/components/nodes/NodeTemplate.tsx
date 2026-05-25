import React, { memo } from 'react';

// 定义支持的主题颜色字典，避免 Tailwind 动态类名无法被打包（Purge）的问题
const themeStyles = {
    indigo: {
        border: 'border-indigo-500',
        ring: 'ring-indigo-400/70 shadow-indigo-500/60',
        header: 'bg-indigo-500 bg-gradient-to-r from-indigo-500 to-indigo-600',
    },
    emerald: {
        border: 'border-emerald-500',
        ring: 'ring-emerald-400/70 shadow-emerald-500/60',
        header: 'bg-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-600',
    },
    pink: {
        border: 'border-pink-500',
        ring: 'ring-pink-400/70 shadow-pink-500/60',
        header: 'bg-pink-500 bg-gradient-to-r from-pink-500 to-rose-500',
    },
    blue: {
        border: 'border-blue-500',
        ring: 'ring-blue-400/70 shadow-blue-500/60',
        header: 'bg-blue-500 bg-gradient-to-r from-blue-500 to-blue-600',
    },
    orange: {
        border: 'border-orange-500',
        ring: 'ring-orange-400/70 shadow-orange-500/60',
        header: 'bg-orange-500 bg-gradient-to-r from-orange-500 to-orange-600',
    },
    gray: {
        border: 'border-gray-500',
        ring: 'ring-gray-400/70 shadow-gray-500/60',
        header: 'bg-gray-500 bg-gradient-to-r from-gray-500 to-gray-600',
    }
};

export type ThemeColor = keyof typeof themeStyles;

export interface NodeTemplateProps {
    title: React.ReactNode;
    icon?: React.ReactNode;
    theme?: ThemeColor;
    selected?: boolean;
    children?: React.ReactNode; // 这是主要的插槽
    className?: string; // 允许追加自定义外部样式
}

const NodeTemplate = memo(({
    title,
    icon,
    theme = 'blue',
    selected = false,
    children,
    className = '',
}: NodeTemplateProps) => {
    const styles = themeStyles[theme];

    return (
        <div className={`w-64 bg-white rounded-lg border-2 shadow-xl overflow-hidden transition-all duration-200 ${styles.border} ${selected ? `ring-8 ring-offset-4 shadow-2xl scale-105 ${styles.ring}` : ''} ${className}`}>
            {/* 标题栏 */}
            <div className={`p-2 text-white flex items-center ${styles.header}`}>
                {icon && <div className="mr-2">{icon}</div>}
                <span className="font-bold text-sm">{title}</span>
            </div>

            {/* 内容插槽：外部传入的标签、按钮或 Handle 都可以包裹在这里 */}
            <div className="bg-gray-50">
                {children}
            </div>
        </div >
    );
});

export default NodeTemplate;
