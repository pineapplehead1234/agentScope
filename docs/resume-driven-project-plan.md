# AgentScope 简历亮点反推项目规划

## 1. 项目定位

AgentScope 是一个面向 AI Coding Agent 的 Electron 桌面控制台，目标是把 CLI/TUI 形态的 Agent 执行过程转化为可观察、可中断、可审查的图形界面。

项目第一版基于 Pi SDK 接入 Agent 运行流，在 Electron Main Process 中封装 Pi Agent runtime，经 Preload + IPC 将消息流、工具调用、会话状态和上下文信息同步到 React Renderer。

项目不是普通 AI Chat 客户端，也不是完整 IDE。它聚焦一个更明确的问题：

```text
让用户看清 AI Coding Agent 正在说什么、想什么、调用了哪些工具、改了哪些文件、当前会话和上下文处于什么状态。
```

## 2. 简历叙事

### 2.1 推荐项目名

```text
AgentScope AI Coding Agent 桌面控制台
```

### 2.2 推荐项目角色

```text
AI前端开发
```

### 2.3 推荐项目简介

```text
项目简介：AgentScope 是一个面向 AI Coding Agent 的 Electron 桌面控制台，基于 Pi SDK 将 CLI/TUI 形态的 Agent 运行过程转化为可观察、可中断、可审查的图形界面。应用在 Electron Main Process 中封装 AgentSessionRuntime，并经 Preload + IPC 将消息流、工具调用、会话状态和上下文信息同步至 React Renderer，用于提升用户对 Agent 执行过程的理解和控制能力。
```

### 2.4 推荐技术栈

```text
Electron、React、TypeScript、Vite、Tailwind CSS、IPC、Pi SDK
```

React 运行方式：

使用 React 现代 Fiber/Concurrent Root 路径，即通过 `createRoot` 挂载应用，不使用 legacy `ReactDOM.render`。Agent 流式事件先进入 reducer / buffer 做归并，再批量提交到 React；对非紧急的 Timeline 和 Context 更新，可按实际性能数据使用 `startTransition` 或 `useDeferredValue`，避免高频 delta 阻塞输入和面板交互。

后续如果真实使用，可以补充：

```text
Vitest、React Testing Library、Zustand / useReducer
```

样式方案第一版采用 Tailwind CSS。Tailwind 主要用于快速搭建桌面控制台的多面板布局、状态色、间距和响应式适配，不作为项目核心亮点。简历重点仍然放在 Agent 事件流归并、Pi SDK runtime 封装、Electron 安全分层和 Tool Timeline 可视化。

## 3. 目标岗位叙事

### 3.1 主定位

AgentScope 的主定位是前端强项目，适合投递中大厂前端实习、AI IDE 前端、开发者工具前端和 Electron 桌面端前端。

核心表达：

```text
我具备 React + TypeScript 复杂状态建模、Electron 安全分层、本地 Agent runtime 接入、开发者工具型 UI 和 AI Agent 产品理解能力。
```

### 3.2 副定位

AgentScope 可以作为未来转 Agent 开发的过渡项目，但第一版不要直接定位成 Agent Infra 项目。

可作为面试深挖点：

```text
阅读 Pi SDK、Agent Loop、TUI 展示层与部分 AgentHarness runtime 源码，理解 prompt、tool call、event stream、session、context compaction、operation state machine 等机制。
```

不要过度包装成：

```text
实现 Agent 框架
实现 Agent Runtime
实现上下文压缩算法
实现工具恢复机制
实现 MCP 框架
```

除非这些能力已经真实完成。

## 4. 简历亮点设计

### 4.1 复杂事件流状态归并

#### 问题

Pi SDK 的 `session.subscribe()` 输出持续的 Agent 事件流，而不是一次性接口响应。`message_update`、`tool_execution_update`、`queue_update`、`compaction`、`retry` 等事件可能交错出现。

如果直接在 React 组件中分散处理状态，容易导致消息重复、工具卡片丢失、运行态错误、组件间状态不一致。

#### 技术方案

使用 TypeScript discriminated union 建模 Agent 事件，通过独立 reducer 将 Pi SDK 事件流归并为稳定的前端 ViewModel。

核心 ViewModel 覆盖：

```text
消息列表
Thinking 内容
工具调用时间线
队列状态
重试状态
上下文压缩状态
运行状态
会话状态
```

#### 可写简历点

```text
设计 Agent 事件归并模型，基于 TypeScript 联合类型和 reducer 将 message delta、thinking delta、tool execution、queue、retry、compaction 等异步事件转换为前端 ViewModel，支持流式消息、Thinking 折叠块、工具调用时间线和运行状态展示，解决 Agent 事件交错更新导致的 UI 状态不一致问题。
```

#### 可量化指标

开发完成后记录真实数据：

```text
支持的 Agent event 类型数量
支持的 reducer 状态转移数量
reducer 单测数量
一次真实 Agent run 中处理的事件数量
组件层减少的重复状态处理逻辑数量
```

目标表达示例：

```text
将 10+ 类 AgentSessionEvent 归并为统一 ViewModel，并通过 20+ 条 reducer 单测覆盖流式文本、Thinking、工具调用、重试和上下文压缩等核心状态转移。
```

## 5. Pi SDK Runtime 封装

### 5.1 问题

Pi SDK 提供 `createAgentSession()`、`createAgentSessionRuntime()`、`AgentSession`、`SessionManager`、`ModelRuntime` 等能力。Electron 客户端不能让 Renderer 直接接触这些 Node runtime 对象，否则 UI 层会获得过大的本地能力边界。

如果 React 组件直接依赖 Pi SDK 对象，后续会出现 UI 与 Agent runtime 强耦合、session 替换后订阅失效、Main/Renderer 边界不清晰等问题。

### 5.2 技术方案

在 Electron Main Process 实现 `PiSdkRuntimeService`，当前已封装 Pi SDK 的 session 创建、SessionManager、当前 session metadata、prompt、abort 和事件订阅；`compact`、session replacement 等操作型能力作为后续增强继续接入。

模块职责：

```text
PiSdkRuntimeService：负责创建和持有 AgentSessionRuntime，封装 active session 的生命周期。
AgentIpcService：当前负责 current session、markdown preview、prompt、abort 和 agent event stream；后续负责把 Renderer 的 compact / newSession 等请求转成 Main 内部 runtime 调用。
EventAdapter：负责把 AgentSessionEvent 转成 Renderer 可消费的前端事件。
```

关键能力：

```text
创建 AgentSessionRuntime
维护 active session 引用
后续在 session replacement 后重新订阅事件
当前封装 prompt / abort；后续封装 compact / newSession
当前读取 sessionId / sessionFile；后续读取 messages / isStreaming
接入 SessionManager 进行持久化 session 管理
将 AgentSessionEvent 推送到 Renderer
把 SDK error 收敛为 IPC 层错误
```

### 5.3 可写简历点

```text
当前可写：基于 Pi SDK 在 Electron Main Process 封装 Agent runtime 层，接入 AgentSessionRuntime、SessionManager 和 AgentSessionEvent，将 session metadata、prompt/abort、event subscription 和 typed IPC 与 React Renderer 解耦。

后续完成后再写：在现有 prompt / abort 基础上继续统一管理 compact、新建会话、历史恢复和 session replacement 订阅重建，并通过 Preload + IPC 将完整 Agent 运行态同步至 React Renderer。
```

### 5.4 可量化指标

开发完成后记录真实数据：

```text
封装的 SDK 操作数量
AgentSessionEvent 覆盖数量
session replacement 订阅恢复场景数量
runtime service 单测数量
```

目标表达示例：

```text
后续增强目标：在现有 prompt / abort 基础上继续封装 compact、newSession、getState、getMessages、getSessionStats 等核心操作，并覆盖 session replacement 后事件重新订阅、历史消息恢复等关键场景。
```

## 6. Electron 安全分层

### 6.1 问题

Agent 客户端需要接入本地 Pi SDK runtime、文件系统和 Shell 工具能力。如果 Renderer 直接启用 Node 能力或直接 import Pi SDK，UI 层会拥有过大的本地访问权限，安全边界不清晰。

### 6.2 技术方案

采用 Electron Main / Preload / Renderer 三层架构：

```text
Main：本地能力层，管理 Pi SDK runtime、session 生命周期和 IPC handlers。
Preload：安全桥，通过 contextBridge 暴露有限 API。
Renderer：React UI，只消费受控 API，不直接访问 Node、Shell、文件系统或 child_process。
```

Preload 暴露的最小 API 示例：

```text
getCurrentSession()
readMarkdownPreview(path)
prompt(text)
abort()
onAgentEvent(listener)

后续增强：getState() / newSession() / compact()
```

### 6.3 可写简历点

```text
基于 Electron Main / Preload / Renderer 分层实现本地 Agent 客户端，关闭 Renderer Node 访问并启用 contextIsolation，通过 contextBridge 暴露 getCurrentSession、readMarkdownPreview、prompt、abort、onAgentEvent 等当前最小 API，收敛 Pi SDK runtime、文件系统和 Shell 访问边界。
```

### 6.4 可量化指标

开发完成后记录真实数据：

```text
Renderer 暴露 API 数量
Main Process 收敛的本地能力类型
IPC channel 数量
```

目标表达示例：

```text
Renderer 仅暴露 5-7 个受控 Agent API，将 Pi SDK runtime、文件系统路径和 Shell 能力全部收敛至 Main Process。
```

## 7. Tool Timeline 可解释性

### 7.1 问题

AI Coding Agent 的关键价值来自工具调用，但工具调用过程通常隐藏在终端输出或普通消息里。用户很难快速判断 Agent 读取了什么文件、执行了什么命令、是否修改代码、工具是否失败。

### 7.2 技术方案

实现 Tool Timeline，将工具调用抽象为统一执行卡片，并针对不同工具类型生成摘要。

第一版支持工具：

```text
read
bash
edit
write
```

工具卡片展示：

```text
工具名
参数摘要
running / success / error 状态
结果摘要
错误信息
完整输入输出展开
```

架构上预留内部 `ToolRenderer` 注册表，但不做用户插件系统。

### 7.3 可写简历点

```text
实现 Tool Timeline，对 read、grep、bash、edit、write 等工具调用的参数、运行状态、结果摘要和错误信息进行可视化展示，支持展开查看完整输入输出，提高 Coding Agent 执行过程的可解释性。
```

### 7.4 可量化指标

开发完成后记录真实数据：

```text
支持的工具类型数量
工具状态类型数量
工具摘要策略数量
真实 Agent run 中工具调用展示数量
```

目标表达示例：

```text
支持 read、grep、bash、edit、write 等 5 类工具调用的分类摘要和 running/success/error 三态展示，帮助用户审查 Agent 的文件读取、命令执行和代码修改行为。
```

## 8. Session Sidebar 与 Context Panel

### 8.1 问题

Agent 会话不是普通聊天记录。一次会话包含 session id、session name、message count、token/cost、context usage、queue、compaction 等运行态。

如果这些状态不可见，用户无法判断当前 Agent 是否接近上下文上限、是否正在压缩、压缩是否成功、当前会话是否恢复正确。

### 8.2 技术方案

实现 Session Sidebar 和 Context Panel，整合 SDK session state、message history、session stats 和 compaction events。

Session Sidebar 第一版能力：

```text
展示 sessionId
展示 sessionName
展示 sessionFile
展示 messageCount
当前支持 current session 展示
后续支持 new session
后续支持当前会话历史消息恢复
```

Context Panel 第一版能力：

```text
展示 token usage
展示 cost
展示 context usage percent
当前预留 compaction state 展示字段
后续展示 compaction_start / compaction_end
后续支持 manual compact
后续展示 compaction reason 和 summary
```

### 8.3 可写简历点

```text
当前可写：实现 Session Sidebar 与 Context Panel，展示当前会话标识、token/cost、context usage 和 compaction state，并通过 Main/Preload/Renderer 分层预留 session stats 与 compaction events 接入点。

后续完成后再写：整合 get_state、get_messages、get_session_stats 和 compaction 事件，支持新建会话、历史消息恢复和手动上下文压缩。
```

### 8.4 可量化指标

开发完成后记录真实数据：

```text
展示的 session/context 指标数量
支持的会话操作数量
支持的上下文操作数量
历史消息恢复成功场景数量
```

目标表达示例：

```text
后续增强目标：整合 6+ 类 session/context 指标，支持 new session、get messages、get session stats 和 manual compact 等核心会话操作。
```

## 9. AgentHarness 深挖边界

### 9.1 当前定位

AgentHarness 是 Pi 内部更底层的 durable agent runtime，负责 session、lane、operation、tool settlement、recovery、hooks、resources 等机制。

第一版 AgentScope 不直接接入 AgentHarness，不把它作为主开发依赖。

### 9.2 为什么不放进 MVP

```text
AgentHarness 是 Pi 更底层的 durable runtime，不是第一版客户端最合适的直接接入边界。
Pi SDK 已经提供 AgentSessionRuntime 和 AgentSession 入口，更适合作为 Electron 客户端的第一版接入层。
直接接 AgentHarness 会引入更底层的 storage、lane、operation、tools、Context、hooks、resources 等复杂度，容易拖垮第一版交付。
```

### 9.3 如何体现在项目中

AgentHarness 可以作为源码阅读和面试深挖材料。

第一版可以产出：

```text
AgentHarness 阅读笔记
session / lane / operation 概念图
Pi SDK AgentSessionEvent 与 HarnessEvent 的映射关系
Runtime Inspector 二期设计
```

### 9.4 可写简历点

如果真实完成阅读和设计，可以写：

```text
阅读 Pi AgentHarness runtime 源码，理解 session / lane / operation / tool settlement / recovery 的设计思路，并将其抽象为前端 Runtime Inspector 的状态展示模型。
```

不要写：

```text
实现 AgentHarness
实现 Agent Runtime
实现工具恢复机制
实现持久化 Agent 编排框架
```

## 10. MVP 功能边界

### 10.1 v1 必做

```text
Electron + React + TypeScript 项目骨架
Tailwind CSS 样式体系
Main / Preload / Renderer 安全分层
PiSdkRuntimeService
AgentIpcService
EventAdapter
AgentRuntime 接口抽象
Agent event reducer
Chat Transcript
Thinking 折叠块
Tool Timeline
Session Sidebar
Context Panel
Status Bar
当前 runtime command：prompt / abort
后续 runtime command：getState / newSession / getMessages / getSessionStats / compact
runtime service 单测
reducer 单测
README 架构说明
```

### 10.2 v1 不做

```text
复杂插件系统
完整 MCP Adapter
完整 AgentHarness 接入
完整 IDE 文件树
完整 Diff accept/reject
多 Agent 编排
云端同步
用户系统
权限沙箱
```

### 10.3 v2 可选

```text
Diff Preview
Runtime Inspector
Tool Risk Review
Session Tree 只读展示
模型和 Thinking level 设置
MCP Tool Bridge
```

## 11. 推荐简历核心贡献

完成 v1 后，可以根据真实完成情况从以下内容中选择 4-5 条写入简历。

```text
- 阅读 Pi SDK、Agent Loop、TUI 展示层与部分 AgentHarness runtime 源码，梳理 prompt、tool call、event stream、session、context compaction 的核心流程，并据此设计 AgentScope 的桌面控制台信息架构。
- 基于 Electron Main / Preload / Renderer 分层实现本地 Agent 客户端，关闭 Renderer Node 访问并启用 contextIsolation，通过 contextBridge 暴露 getCurrentSession、readMarkdownPreview、prompt、abort、onAgentEvent 等当前最小 API，收敛 Pi SDK runtime、文件系统和 Shell 访问边界。
- 基于 Pi SDK 在 Electron Main Process 封装 Agent runtime 层，接入 AgentSessionRuntime、SessionManager 和 AgentSessionEvent，管理当前 session metadata、runtime creation、prompt/abort 和事件订阅，并将 Agent event stream 转发至 React Renderer。
- 设计 Agent 事件归并模型，基于 TypeScript 联合类型和 reducer 将 message delta、thinking delta、tool execution、queue、retry、compaction 等异步事件转换为前端 ViewModel，支持流式消息、Thinking 折叠块、工具调用时间线和运行状态展示。
- 实现 Tool Timeline、Session Sidebar 与 Context Panel，展示工具调用、会话信息、token/cost、context usage 和 compaction 状态；new session、manual compact 与历史消息恢复属于后续增强。
```

## 12. 量化指标记录表

开发过程中需要主动记录真实数据，最终只把真实完成的数据写入简历。

| 指标                            |     目标 | 实际结果 |
| ------------------------------- | -------: | -------: |
| 封装的 Pi SDK 操作数量          |       7+ |   待记录 |
| 支持的 Agent event 类型数量     |      10+ |   待记录 |
| 支持的工具类型数量              |       5+ |   待记录 |
| runtime service 单测数量        |       8+ |   待记录 |
| Event reducer 单测数量          |      15+ |   待记录 |
| Renderer 暴露的最小 API 数量    |      5-7 |   待记录 |
| 一次真实 Agent run 处理事件数量 | 真实测量 |   待记录 |
| 会话/上下文展示指标数量         |       6+ |   待记录 |

## 13. README 与面试展示材料

### 13.1 README 必须包含

```text
项目定位
为什么不是普通 Chat UI
架构图：Renderer -> Preload -> Main -> Pi SDK Runtime
功能截图或录屏
核心模块说明
运行方式
测试方式
Roadmap
```

### 13.2 面试必须能讲清

```text
为什么用 Pi SDK，而不是直接改 Pi 内部 Harness
AgentSessionRuntime 和 AgentSession 分别负责什么
为什么 message_update 需要 reducer 归并
为什么 agent_settled 才能认为会话彻底空闲
Electron 为什么要关闭 nodeIntegration
Tool Timeline 如何从工具事件生成可审查 UI
Context Panel 解决了 Agent 使用中的什么问题
AgentHarness 的 session / lane / operation 大概是什么
```

## 14. 第一阶段执行顺序

```text
1. 写 README 初稿和架构规划。
2. 搭 Electron + React + TypeScript 骨架。
3. 用 MockEventSource 打通 Chat、Tool Timeline、Status Bar。
4. 实现 agent-event-reducer 和单测。
5. 实现 PiSdkRuntimeService 和单测。
6. 实现 AgentIpcService 与 EventAdapter。
7. 接入真实 Pi SDK prompt / abort / getState。
8. 补 Session Sidebar 和 Context Panel。
9. 补 Tool Timeline 展开态、错误态和工具摘要。
10. 补 README、截图、录屏和最终简历描述。
```

## 15. 当前原则

```text
先做可展示、可测试、可讲清的 v1。
不为了显得高级而提前做 MCP、插件系统或完整 AgentHarness 接入。
所有简历量化结果必须来自真实实现和真实测试。
项目主线保持前端强项目，同时保留 Agent Runtime 深挖入口。
```
