import { createRoot } from "react-dom/client";
import './index.css';

const App = () => {
    return (
       // 用 Tailwind 的类名：h-screen(全屏高), flex(布局), bg-gray-100(背景灰)
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100">
        
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                {/* text-4xl(大字), text-blue-600(蓝字), font-bold(加粗) */}
                <h1 className="text-4xl font-bold text-blue-600 mb-4">
                🚀 AI Workflow Editor
                </h1>
                
                <p className="text-gray-500 mb-6">
                Tailwind CSS 接入成功！样式由 Utility Classes 驱动。
                </p>

                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105">
                ✨ 开始构建 S 级项目
                </button>
            </div>
        
        </div>
    );
}

// 找到 HTML 里的根节点
const container = document.getElementById("root");
const root = createRoot(container!);// 那个 ! 是告诉 TS：我确信 root 一定存在，别报错
// 渲染 App
root.render(<App />);