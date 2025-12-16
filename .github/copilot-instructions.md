# Copilot / AI Agent Instructions

Short, actionable guidance to get productive in this codebase.

## Big picture
- Frontend: React + ReactFlow (see `src/index.tsx` and `src/components/FlowEditor.tsx`).
- State: global app state lives in `src/store.ts` (Zustand). Nodes and edges are the canonical source-of-truth.
- Backend: small Express proxy in `server/index.js` that forwards chat requests to a DeepSeek-compatible OpenAI client and streams responses via SSE.

## How data flows (important)
- UI -> `runNode(nodeId)` (defined in `src/store.ts`) triggers fetch to `process.env.API_URL` (default `http://localhost:4000/api/chat`).
- Backend uses `openai` client with `stream: true` and writes SSE `data: {"content": ...}\n\n` chunks to the response.
- Frontend reads `response.body.getReader()` and parses SSE lines starting with `data: `, accumulating `content` into `node.data.output`.

## Key files to inspect
- `server/index.js` – backend SSE implementation and required env var: `DEEPSEEK_API_KEY`.
- `src/store.ts` – Zustand store, node lifecycle, `runNode`, `updateNodeData`, and how streaming is applied.
- `src/components/FlowEditor.tsx` – ReactFlow setup, `nodeTypes` registration, drag/drop coordinate `project()` usage.
- `src/components/nodes/LLMNode.tsx` – example custom node; `runNode(id)` is invoked from the node UI.
- `webpack.config.js` – dev server, Dotenv plugin (`.env`) and build pipeline.

## Env & run instructions (developer workflows)
- Frontend (dev):
  - Install root deps: `npm install` in repository root.
  - Start dev server: `npm run start` (uses `webpack serve --open`).
- Backend (dev):
  - Install server deps: `cd server && npm install`.
  - Start: `node index.js` (ensure `.env` contains `DEEPSEEK_API_KEY`).
- Notes:
  - Frontend reads environment via Webpack Dotenv plugin and also falls back to `API_URL` default `http://localhost:4000/api/chat` in `src/store.ts`.
  - Backend listens on `process.env.PORT || 4000`.

## Project-specific patterns & conventions
- Zustand selectors: code uses `useShallow` selectors (see `FlowEditor.tsx` and `LLMNode.tsx`) to avoid unnecessary renders — follow this pattern when reading or writing selectors.
- Node data shape: nodes store useful fields on `node.data` such as `prompt`, `status`, `output`, and `label`. Use `updateNodeData(nodeId, {...})` to update node state consistently.
- Node registration: add new node components to `nodeTypes` in `FlowEditor.tsx` so the ReactFlow canvas can render your custom node.
- Drag/drop coordinates: use the `project()` call from `useReactFlow()` and the wrapper `getBoundingClientRect()` to convert screen coords -> canvas coords (see `onDrop`).

## Streaming & parsing specifics (must follow precisely)
- Backend writes Server-Sent-Events style chunks: each chunk looks like `data: {"content":"..."}\n\n` and finishes with `data: [DONE]\n\n`.
- Frontend expects a ReadableStream and uses `reader.read()` + `TextDecoder()`; split by newlines and parse lines starting with `data: `, then JSON.parse the payload. See `src/store.ts` for robust parsing example.

## Integration and external deps to be aware of
- `reactflow` (canvas & node graph) — key API: `ReactFlowProvider`, `nodeTypes`, `Handle`, `project()`.
- `zustand` — central state management; prefer selectors to limit re-renders.
- `openai` in `server` — configured to target a DeepSeek-compatible API via `baseURL` and `DEEPSEEK_API_KEY`.

## Quick examples you can reuse
- Update a node's status and output (pattern used across repo):

```
// from store: updateNodeData(nodeId, { status: 'running', output: '' })
```

- Parse SSE chunks (see `src/store.ts`):

```
// chunk -> split('\n') -> for lines starting with 'data: ' -> JSON.parse(line.slice(6))
```

## When to ask for clarification (useful prompts for humans)
- If a node type needs additional fields on `node.data`, confirm the field names with the author (commonly: `prompt`, `status`, `output`).
- If you change streaming semantics (format, encoding), update both `server/index.js` and `src/store.ts` parsing in lockstep.

---
If you want, I can: run tests (none present), add a npm `start` script for the server, or expand examples into a CONTRIBUTING snippet. Any unclear sections to refine?

# Copilot / AI Agent 指令

简短、可操作的指南，助您在此代码库中高效工作。

## 整体概览
- 前端：React + ReactFlow（参见 `src/index.tsx` 和 `src/components/FlowEditor.tsx`）。
- 状态：全局应用状态位于 `src/store.ts`（使用 Zustand）。节点（Nodes）和边（Edges）是唯一可信源。
- 后端：在 `server/index.js` 中有一个小型的 Express 代理，它将聊天请求转发到与 DeepSeek 兼容的 OpenAI 客户端，并通过 SSE 流式传输响应。

## 数据流（重要）
- 用户界面（UI） -> 调用 `src/store.ts` 中定义的 `runNode(nodeId)` 函数 -> 向 `process.env.API_URL`（默认为 `http://localhost:4000/api/chat`）发起请求。
- 后端使用 `openai` 客户端并设置 `stream: true`，将 SSE 格式的 `data: {"content": ...}\n\n` 数据块写入响应。
- 前端读取 `response.body.getReader()` 并解析以 `data: ` 开头的 SSE 行，将累积的 `content` 存入 `node.data.output`。

## 需要检查的关键文件
- `server/index.js` – 后端的 SSE 实现以及所需的环境变量：`DEEPSEEK_API_KEY`。
- `src/store.ts` – Zustand 状态库，节点的生命周期，`runNode`，`updateNodeData` 函数，以及流式处理是如何应用的。
- `src/components/FlowEditor.tsx` – ReactFlow 设置，`nodeTypes` 注册，拖放操作中的 `project()` 函数用法。
- `src/components/nodes/LLMNode.tsx` – 自定义节点示例；`runNode(id)` 是从节点UI调用的。
- `webpack.config.js` – 开发服务器配置，Dotenv 插件（用于加载 `.env` 文件）和构建管道。

## 环境变量与运行指令（开发者工作流）
- 前端（开发环境）：
  - 安装根目录依赖：在项目根目录下运行 `npm install`。
  - 启动开发服务器：运行 `npm run start`（使用 `webpack serve --open`）。
- 后端（开发环境）：
  - 安装服务器依赖：进入 `server` 目录并运行 `cd server && npm install`。
  - 启动：运行 `node index.js`（确保 `.env` 文件包含 `DEEPSEEK_API_KEY`）。
- 注意：
  - 前端通过 Webpack 的 Dotenv 插件读取环境变量，并且在 `src/store.ts` 中回退到默认的 `API_URL`（即 `http://localhost:4000/api/chat`）。
  - 后端监听 `process.env.PORT` 指定的端口，默认为 4000。

## 项目特定模式与约定
- Zustand 选择器：代码中使用 `useShallow` 选择器（参见 `FlowEditor.tsx` 和 `LLMNode.tsx`）来避免不必要的重新渲染——在读取或写入选择器时请遵循此模式。
- 节点数据结构：节点在 `node.data` 对象上存储有用的字段，例如 `prompt`, `status`, `output`, 和 `label`。使用 `updateNodeData(nodeId, {...})` 函数来一致地更新节点状态。
- 节点注册：将新的节点组件添加到 `FlowEditor.tsx` 中的 `nodeTypes` 对象，这样 ReactFlow 画布才能渲染你的自定义节点。
- 拖放坐标：使用从 `useReactFlow()` 钩子中获取的 `project()` 函数和 `getBoundingClientRect()` 方法将屏幕坐标转换为画布坐标（参见 `onDrop` 事件处理函数）。

## 流式传输与解析细节（必须严格遵守）
- 后端写入服务器发送事件（Server-Sent Events）风格的数据块：每个数据块格式为 `data: {"content":"..."}\n\n`，并以 `data: [DONE]\n\n` 结尾。
- 前端期望一个 ReadableStream，使用 `reader.read()` 和 `TextDecoder()` 进行读取和解码；按换行符分割，解析以 `data: ` 开头的行，然后对有效负载进行 JSON.parse 解析。关于健壮的解析示例，请参见 `src/store.ts`。

## 需要了解的集成与外部依赖
- `reactflow`（画布和节点图）— 关键 API：`ReactFlowProvider`, `nodeTypes`, `Handle`, `project()`。
- `zustand` — 中心化状态管理；推荐使用选择器来限制重新渲染。
- `server` 目录中的 `openai` — 通过 `baseURL` 和 `DEEPSEEK_API_KEY` 配置为指向与 DeepSeek 兼容的 API。

## 可供复用的快速示例
- 更新节点的状态和输出（在代码库中广泛使用的模式）：
