import { createRoot } from "react-dom/client";
import './index.css';
import FlowEditor from "./components/FlowEditor";

const App = () => {
    return (
       // 用 Tailwind 的类名：h-screen(全屏高), flex(布局), bg-gray-100(背景灰)
        <div className="h-screen w-screen">
            <FlowEditor />
        </div>
    );
}

// 找到 HTML 里的根节点
const container = document.getElementById("root");
const root = createRoot(container!);// ! 是告诉 TS：我确信 root 一定存在，别报错
// 渲染 App
root.render(<App />);