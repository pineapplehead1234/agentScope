# AgentScope 业务理解与架构入门

## 1. 先理解这里的“业务”是什么

AgentScope 的业务不是普通管理后台里的订单、用户、商品，而是 AI Coding Agent 的运行控制链路。

一句话：

```text
用户给 Agent 一个开发任务，Agent 一边生成消息，一边调用本地工具读文件、搜代码、改文件、执行命令；AgentScope 负责把这个过程变成可观察、可中断、可审查的桌面界面。
```

所以 AgentScope 的核心业务链路是：

```text
用户输入任务
  -> Electron Main 调用 Pi SDK prompt
  -> Pi Agent 开始运行
  -> Pi 持续输出消息事件、工具事件、队列事件、压缩事件、重试事件
  -> Main 订阅 Pi SDK 事件流
  -> Renderer 将事件归并成 UI 状态
  -> 用户观察对话、工具调用、会话和上下文状态
  -> 用户必要时 abort / compact / new session
```

## 2. 用户真正关心什么

Agent 客户端的核心用户不是在和普通聊天机器人闲聊，而是在让 Agent 修改真实代码。

用户关心的问题：

```text
Agent 当前是否还在运行？
Agent 正在回答什么？
Agent 有没有在 thinking？
Agent 调用了哪些工具？
Agent 读了哪些文件？
Agent 执行了什么命令？
Agent 是否修改了文件？
工具调用是否失败？
当前会话是哪一个？
上下文是否快满了？
是否发生了自动压缩或重试？
我能不能中断当前任务？
```

AgentScope 的所有功能都应该围绕这些问题展开。

## 3. MVP 的核心业务闭环

MVP 不追求功能完整，只要打通一条完整、可演示、可讲清的闭环。

### 3.1 输入任务

用户在 Chat Input 输入 prompt。

客户端行为：

```text
Renderer 调用 window.agentScope.prompt(text)
Preload 转发到 IPC
Preload 转发到 IPC
Main 调用 Pi SDK 的 session.prompt(text)
```

对应 SDK 调用：

```ts
await runtime.session.prompt("帮我修复测试失败");
```

### 3.2 接收响应

Pi SDK 的 `session.prompt()` 会触发 Agent 运行，同时 `session.subscribe()` 会持续收到 Agent events。

注意：

```text
SDK 的 prompt Promise 会等待已接受的 run 完成，但 UI 不应该只等 Promise 才更新。
流式 UI 应该通过 subscribe 收到的事件实时更新。
```

示例：

```text
event: agent_start
event: message_start
event: message_update
event: tool_execution_start
event: tool_execution_end
event: message_end
event: agent_settled
```

### 3.3 渲染运行过程

Renderer 不直接逐个组件处理原始事件，而是通过 Event Reducer 归并为 ViewModel。

```text
AgentSessionEvent
  -> AgentEventReducer
  -> AgentViewState
  -> Chat Transcript / Tool Timeline / Status Bar / Context Panel
```

### 3.4 用户控制

当前已实现的用户控制：

```text
prompt：提交任务
abort：中断当前任务
```

后续增强的用户控制：

```text
new_session：新建会话
compact：手动上下文压缩
refresh state：刷新会话状态
```

## 4. 核心对象

理解这些对象后，再看架构会清晰很多。

### 4.1 Command

Command 是 Renderer 通过 IPC 发给 Electron Main 的受控操作。

例如：

```text
prompt
abort
getState
getMessages
getSessionStats
newSession
compact
```

这些操作会在 Main Process 内转换成 Pi SDK 调用。

### 4.2 Response

Response 是 Main Process 对某个 IPC command 的返回结果。

例如：

```text
prompt 调用完成或失败
getState 返回当前状态
compact 返回压缩结果
```

流式 UI 的主要数据来源不是 response，而是 AgentSessionEvent。

### 4.3 Event

Event 是 Pi SDK 在 Agent 运行过程中通过 `session.subscribe()` 持续推送的状态变化。

例如：

```text
agent_start
message_update
queue_update
compaction_start
compaction_end
agent_settled
```

Event 没有固定数量，也不是一次性返回。

### 4.4 ViewModel

ViewModel 是前端真正用于渲染的数据结构。

它不是 Pi SDK 原始事件的简单复制，而是经过归并后的 UI 状态。

例如：

```text
当前运行状态
消息列表
当前 streaming assistant message
Thinking 内容
工具调用列表
session 信息
context usage
队列状态
错误状态
```

### 4.5 Tool Execution

Tool Execution 是 Agent 调用本地工具的过程。

常见工具：

```text
read：读取文件
grep：搜索代码
bash：执行命令
edit/write：修改文件
```

Tool Timeline 要把这些工具调用变成可审查卡片。

### 4.6 Session

Session 是 Agent 的会话。它不是普通聊天数组，背后可能包含消息、工具结果、上下文压缩、分支和元信息。

MVP 不需要完整实现 Session Tree，但需要展示基础会话信息：

```text
sessionId
sessionName
sessionFile
messageCount
```

### 4.7 Context

Context 指模型当前可看到的上下文窗口和相关统计。

MVP 重点展示：

```text
token usage
cost
context usage percent
compaction status
compaction summary
```

## 5. 模块如何相互作用

### 5.1 总体链路

```text
React Renderer
  -> window.agentScope API
  -> Electron Preload
  -> IPC invoke / on
  -> Electron Main
  -> PiSdkRuntimeService
  -> AgentSessionRuntime / AgentSession
```

反向事件流：

```text
Pi SDK session.subscribe(event)
  -> EventAdapter
  -> Electron IPC event
  -> Renderer event buffer
  -> AgentEventReducer
  -> ViewModel
  -> UI components
```

### 5.2 Main Process

Main 是本地能力层。

负责：

```text
创建 AgentSessionRuntime
维护 active session
当前已实现 current session 查询、markdown preview 读取、prompt / abort、newSession / switchSession 和 Agent event 转发
后续增强 compact
当前处理 session replacement 后重新订阅
向 Renderer 推送事件
处理 Renderer 发来的 IPC command
```

Main 不负责 React UI，不负责 DOM，不负责组件状态。

### 5.3 Preload

Preload 是安全桥。

负责：

```text
用 contextBridge 暴露最小 API
隐藏 ipcRenderer 细节
限制 Renderer 能调用的本地能力
```

Renderer 不应该直接拿到 `child_process`、`fs`、`ipcRenderer`。

### 5.4 Renderer

Renderer 是 UI 和交互层。

负责：

```text
展示 Chat Transcript
展示 Tool Timeline
展示 Session Sidebar
展示 Context Panel
展示 Status Bar
处理用户输入和按钮点击
把事件交给 reducer
```

Renderer 不直接接触 Pi SDK runtime。

### 5.5 PiSdkRuntimeService

PiSdkRuntimeService 是 Main Process 中对 Pi SDK 的封装层。

负责：

```text
创建 AgentSessionRuntime
持有当前 runtime.session
当前封装 runtime creation、SessionManager、current session metadata、prompt / abort、newSession / switchSession 和 event subscription
后续封装 compact
后续封装 getState / getMessages / getSessionStats
通过 session.subscribe 接收 AgentSessionEvent
当前在 session replacement 后重新订阅事件
把 event emit 给 Renderer
```

这是项目的核心工程亮点之一。

### 5.6 AgentEventReducer

AgentEventReducer 是状态归并层。

负责：

```text
把 agent_start 转成 running 状态
把 text_delta 追加到当前 assistant message
把 thinking_delta 追加到 Thinking block
把 tool_execution_start 转成 running tool card
把 tool_execution_end 转成 success/error tool card
把 queue_update 更新到队列状态
把 compaction_start/end 更新到 Context Panel
把 agent_settled 转成 idle 状态
```

这是项目的另一个核心工程亮点。

## 6. 为什么现在先理解业务，再做架构

如果不理解业务，架构会变成抽象名词堆叠：

```text
EventSource
Service
Store
Adapter
Registry
Inspector
```

这些词本身不产生价值。它们必须对应真实问题。

AgentScope 的真实问题是：

```text
Pi SDK runtime 运行在 Main Process，所以需要 runtime service 封装。
Renderer 不能直接接触 Pi SDK，所以需要 Preload 安全桥。
AgentSessionEvent 交错到达，所以需要 reducer。
工具调用不可见，所以需要 Tool Timeline。
上下文状态不可见，所以需要 Context Panel。
```

先把这些问题理解清楚，再设计架构就不会晕。

## 7. 大厂式简历表达怎么反推实现

你提到的大厂表达有一个固定结构：

```text
针对某个高价值问题，通过某种技术方案，将某个指标从 A 优化到 B，支撑某个业务结果。
```

AgentScope 也应该这样设计，但不能编造交易转化率、QPS 这类不属于项目的指标。

应该选择属于 Agent 客户端的真实指标。

## 8. AgentScope 可量化指标设计

### 8.1 Runtime 接入稳定性指标

问题：Pi SDK runtime 运行在 Electron Main Process，session replacement、事件订阅、prompt/abort/compact 等能力需要统一封装，避免 Renderer 直接耦合 SDK 对象。

技术方案：实现 PiSdkRuntimeService、AgentIpcService 和 EventAdapter。

可测指标：

```text
runtime service 单测覆盖场景数
session replacement 后是否重新订阅事件
prompt / abort 错误是否被收敛，后续 compact 错误是否被收敛
历史消息和 session stats 是否能稳定读取
```

未来简历表达模板：

```text
当前可写：针对 Electron Renderer 不能直接接触本地 Agent runtime 的边界问题，基于 Pi SDK 在 Main Process 封装 AgentSessionRuntime、SessionManager、prompt/abort 和事件订阅，通过 Preload + IPC 将 current session、markdown preview、runtime command 和 Agent event stream 暴露给 React Renderer。

后续完成后再写：统一管理 prompt、abort、compact、新建会话、历史恢复和事件订阅，覆盖 session replacement、运行中 abort、历史恢复等 N 类关键场景。
```

### 8.2 渲染性能指标

问题：Agent 流式输出可能产生高频 `message_update`，如果每个 delta 都触发一次 React 状态提交，会造成无效渲染。

技术方案：对 text/thinking delta 做 requestAnimationFrame 批处理，按帧合并事件后再提交 reducer。

可测指标：

```text
mock N 条 message_update
批处理前 state commit 次数
批处理后 state commit 次数
React render 次数下降比例
流式输出期间主界面是否卡顿
```

未来简历表达模板：

```text
针对 Agent 流式输出高频 message_update 导致的渲染抖动问题，基于 requestAnimationFrame 对 text/thinking delta 进行按帧批处理，将 N 次增量事件合并为 M 次状态提交，减少流式输出期间的无效重渲染。
```

### 8.3 大文本渲染指标

问题：bash、grep、read 等工具可能返回大文本，直接渲染完整输出会增加 DOM 和 React 状态压力。

技术方案：Tool Timeline 默认展示 summary/preview，完整输出按需展开；必要时对长文本截断。

可测指标：

```text
默认渲染文本长度
完整输出展开前 DOM 节点数
展开后渲染耗时
长文本截断阈值
```

未来简历表达模板：

```text
针对 bash/read/grep 等工具大文本输出导致的渲染压力，设计 summary/preview/full output 分层展示策略，默认仅渲染参数与结果摘要，完整输出按需展开并进行长度截断，降低长任务场景下的初始渲染成本。
```

### 8.4 状态一致性指标

问题：Agent event 交错到达，组件分散处理容易出现消息重复、工具状态丢失、运行态不一致。

技术方案：统一 AgentEventReducer。

可测指标：

```text
reducer 单测数量
覆盖事件类型数量
覆盖状态转移数量
是否能从任意事件序列恢复稳定 ViewModel
```

未来简历表达模板：

```text
针对 Agent 消息、工具、重试和压缩事件交错到达导致的 UI 状态不一致问题，设计 AgentEventReducer 将 N 类事件归并为统一 ViewModel，并通过 N 条单测覆盖流式消息、工具三态、队列更新和 agent_settled 等核心状态转移。
```

### 8.5 安全边界指标

问题：Agent 客户端需要接触 Pi SDK runtime、本地文件和 Shell 能力，Renderer 直接开放 Node 会扩大风险面。

技术方案：Main / Preload / Renderer 分层，contextBridge 暴露最小 API。

可测指标：

```text
Renderer 暴露 API 数量
IPC channel 数量
nodeIntegration 是否关闭
contextIsolation 是否开启
```

未来简历表达模板：

```text
基于 Electron Main / Preload / Renderer 分层收敛本地能力，关闭 nodeIntegration 并启用 contextIsolation，通过 contextBridge 仅暴露 N 个受控 Agent API，将 Pi SDK runtime、文件系统和 Shell 能力限制在 Main Process。
```

## 9. 接近“大厂表达”的最终简历句式

这些句子要在真实完成和测量后再写入简历。

### 9.1 Runtime 接入稳定性

```text
当前可写：针对 Electron Renderer 不能直接接触本地 Agent runtime 的边界问题，基于 Pi SDK 在 Main Process 封装 AgentSessionRuntime、SessionManager、prompt/abort 和事件订阅，通过 Preload + IPC 收敛 current session、markdown preview、runtime command 和 Agent event stream。

后续完成后再写：统一管理 prompt、abort、compact、新建会话、历史恢复和事件订阅，覆盖 session replacement、运行中 abort、历史恢复等 N 类关键场景。
```

### 9.2 高频流式渲染优化

```text
针对 Agent 流式输出高频 message_update 导致的渲染抖动问题，基于 requestAnimationFrame 对 text/thinking delta 进行按帧批处理，将 N 次增量事件合并为 M 次状态提交，减少流式输出期间的无效重渲染。
```

### 9.3 大文本输出优化

```text
针对 bash/read/grep 等工具大文本输出导致的首屏渲染压力，设计 summary/preview/full output 分层展示策略，默认仅渲染参数与结果摘要，完整输出按需展开并进行长度截断，降低长任务场景下的初始渲染成本。
```

### 9.4 状态一致性

```text
针对 Agent 消息、Thinking、工具调用、队列、重试和上下文压缩事件交错到达导致的 UI 状态不一致问题，设计 AgentEventReducer 将 N 类事件归并为统一 ViewModel，并通过 N 条单测覆盖核心状态转移，降低组件层重复状态处理复杂度。
```

### 9.5 Electron 安全边界

```text
基于 Electron Main / Preload / Renderer 分层实现本地 Agent 客户端，关闭 nodeIntegration 并启用 contextIsolation，通过 contextBridge 仅暴露 N 个受控 Agent API，将 Pi SDK runtime、文件系统和 Shell 能力收敛至 Main Process。
```

## 10. 接下来应该怎么做

当前不要急着搭骨架。建议先按这个顺序推进：

```text
1. 读完本文档，先确认 AgentScope 的业务闭环是否理解。
2. 画出一次 prompt 从 Renderer 到 Pi SDK runtime 再回到 UI 的链路。
3. 写 v1 technical plan，明确模块职责和目录结构。
4. 先做 mock event 版本，让业务闭环在前端跑通。
5. 再接真实 Electron 和 Pi SDK。
```

如果第 2 步画不出来，说明还不适合马上写代码。先把链路讲顺，再设计模块。
