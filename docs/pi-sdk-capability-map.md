# Pi SDK 能力清单

本文档基于 `https://pi.dev/docs/latest/sdk` 整理。AgentScope v1 决定以 Pi SDK 作为唯一接入方式。

## 1. SDK 在 AgentScope 里的运行位置

Pi SDK 不运行在 React Renderer 中，而运行在 Electron Main Process 中。

```text
React Renderer
  -> Preload contextBridge
  -> IPC
  -> Electron Main Process
  -> Pi SDK Runtime
```

Renderer 只负责 UI，不直接 import `@earendil-works/pi-coding-agent`，不直接接触 Node、文件系统、Shell 或 Pi SDK 对象。

## 2. SDK 接入主线

AgentScope v1 的主链路：

```text
用户输入 prompt
  -> Renderer 调用 window.agentScope.prompt(text)
  -> Preload 发送 IPC
  -> Main 调用 runtime.session.prompt(text)
  -> Pi SDK 执行 Agent Loop
  -> session.subscribe(event) 收到 AgentSessionEvent
  -> Main 通过 IPC 推送 event
  -> Renderer reducer 归并成 ViewModel
  -> 三栏 UI 更新
```

## 3. 核心 API 概览

| 能力域 | SDK API | 对 AgentScope 的意义 |
|---|---|---|
| 创建单个会话 | `createAgentSession()` | 简单接入 AgentSession |
| 创建可替换运行时 | `createAgentSessionRuntime()` | v1 更推荐，用于 new session / switch session |
| 当前运行时 | `AgentSessionRuntime` | 管理 active session replacement |
| 当前会话 | `AgentSession` | prompt、abort、compact、subscribe、读取 messages/state |
| 会话文件 | `SessionManager` | 创建、继续、打开、列出 session |
| 模型运行时 | `ModelRuntime` | 模型和凭证管理 |
| 配置管理 | `SettingsManager` | compaction、retry 等设置 |
| 资源加载 | `DefaultResourceLoader` | extensions、skills、prompts、context files |
| 工具 | `createCodingTools()` / `defineTool()` | 内置工具和自定义工具 |

## 4. `createAgentSession()`

用于创建单个 `AgentSession`。

最小用法：

```ts
const { session } = await createAgentSession();
```

常见配置：

```ts
const { session } = await createAgentSession({
  cwd,
  model,
  thinkingLevel: "medium",
  tools: ["read", "bash", "grep"],
  sessionManager: SessionManager.create(cwd),
  modelRuntime,
  settingsManager,
  resourceLoader,
});
```

适用场景：只需要一个固定 session，不需要频繁替换 active session。

## 5. `createAgentSessionRuntime()`

用于创建可替换 active session 的 runtime。Pi 官方文档说明，`newSession()`、`switchSession()`、`fork()`、`clone/import` 这类 session replacement API 在 `AgentSessionRuntime` 上，而不在单个 `AgentSession` 上。

AgentScope v1 如果要做左侧 Session 区域，建议用 runtime 作为主入口。

重要规则：

```text
runtime.session 会在 newSession / switchSession / fork 后变化。
event subscription 绑定的是某个具体 AgentSession。
session replacement 后需要取消旧订阅，并重新订阅 runtime.session。
```

这会成为 AgentScope Main 层封装的重点。

## 6. `AgentSession` 能力

`AgentSession` 管理 agent 生命周期、消息历史、模型状态、上下文压缩和事件流。

### 6.1 Prompt 和队列

| API | 作用 | v1 建议 |
|---|---|---|
| `session.prompt(text, options?)` | 发送 prompt 并等待 run 完成 | 必做 |
| `session.steer(text)` | 运行中插入 steering message | v2 |
| `session.followUp(text)` | 当前 run 结束后追加消息 | v2 |

`prompt()` 支持：

```text
images
streamingBehavior: "steer" | "followUp"
preflightResult
```

### 6.2 事件订阅

```ts
const unsubscribe = session.subscribe((event) => {
  // AgentSessionEvent
});
```

这是中间 Run Timeline 的核心数据来源。

### 6.3 当前会话状态

可读取：

```text
session.sessionId
session.sessionFile
session.model
session.thinkingLevel
session.messages
session.isStreaming
session.agent
```

### 6.4 模型控制

| API | 作用 | v1 建议 |
|---|---|---|
| `session.setModel(model)` | 设置模型 | v2 |
| `session.setThinkingLevel(level)` | 设置 thinking level | v2 |
| `session.cycleModel()` | 循环模型 | v2 |
| `session.cycleThinkingLevel()` | 循环 thinking level | v2 |

v1 可以先只展示当前模型和 thinking level，不做切换。

### 6.5 上下文压缩

| API | 作用 | v1 建议 |
|---|---|---|
| `session.compact(customInstructions?)` | 手动压缩上下文 | 可做 |
| `session.abortCompaction()` | 中止压缩 | v2 |

配合事件：

```text
compaction_start
compaction_end
summarization_retry_*
```

### 6.6 中断和清理

| API | 作用 | v1 建议 |
|---|---|---|
| `session.abort()` | 中断当前运行 | 必做 |
| `session.dispose()` | 清理 session | Main 层内部使用 |

### 6.7 树导航

| API | 作用 | v1 建议 |
|---|---|---|
| `session.navigateTree(targetId, options?)` | 在当前 session 文件内导航/分支 | v2/v3 |

## 7. `AgentSessionEvent` 能力

AgentScope 的 Run Timeline 主要来自 `session.subscribe()` 推送的事件。

核心事件：

```text
agent_start
agent_end
agent_settled
turn_start
turn_end
message_start
message_update
message_end
queue_update
compaction_start
compaction_end
auto_retry_start
auto_retry_end
summarization_retry_scheduled
summarization_retry_attempt_start
summarization_retry_finished
```

`message_update` 内部重点子事件：

```text
text_delta
thinking_delta
```

v1 重点处理：

```text
message_start / message_update / message_end
tool_execution_start / tool_execution_update / tool_execution_end
agent_start / agent_settled
compaction_start / compaction_end
queue_update 只展示
auto_retry_start / auto_retry_end 只展示
```

## 8. SessionManager 能力

`SessionManager` 管理 session 持久化和 session 文件。

### 8.1 创建方式

```ts
SessionManager.inMemory()
SessionManager.create(cwd)
SessionManager.continueRecent(cwd)
SessionManager.open("/path/to/session.jsonl")
```

### 8.2 列表能力

```ts
SessionManager.list(cwd)
SessionManager.listAll(cwd)
```

这适合做左侧 session 列表或历史恢复。

### 8.3 Tree API

SDK 文档中列出的 tree 能力：

```text
getEntries()
getTree()
getPath()
getLeafEntry()
getEntry(id)
getChildren(id)
getLabel(id)
appendLabelChange(id, label)
branch(entryId)
branchWithSummary(id, summary)
createBranchedSession(leafId)
```

v1 不建议直接做完整 Session Tree，但可以为右侧 Conversation Route 留入口。

## 9. ModelRuntime 能力

`ModelRuntime` 负责模型和凭证。

可做能力：

```text
创建模型 runtime
获取 provider 列表
检查 auth 状态
读取可用模型
设置 runtime API key
刷新模型 catalog
```

v1 建议只显示当前模型，不做完整模型设置页。

## 10. Tools 能力

SDK 支持选择内置工具和自定义工具。

内置工具：

```text
read
bash
powershell
edit
write
find
ls
```

默认内置工具：

```text
read
bash
edit
write
```

相关 API：

```text
tools: ["read", "bash", "grep"]
excludeTools: ["..."]
noTools: "all" | "builtin"
defineTool()
customTools
createCodingTools()
createReadOnlyTools()
```

v1 可以先使用 Pi 默认工具，不做自定义工具。Tool Timeline 只消费 tool execution events。

## 11. ResourceLoader 能力

`DefaultResourceLoader` 用于发现：

```text
extensions
skills
prompt templates
context files
AGENTS.md
settings
custom models
credentials
sessions
```

v1 只需要理解它影响 Pi runtime 初始化，不需要做资源管理 UI。

## 12. SettingsManager 能力

`SettingsManager` 管理配置，包括：

```text
compaction
retry
global settings
project settings
in-memory settings
settings persistence
```

v1 可以使用默认配置，最多展示 compaction/retry 状态，不做设置编辑。

## 13. AgentScope v1 候选边界

基于 SDK，当前已优先接入：

```text
createAgentSessionRuntime
runtime.session.prompt
runtime.session.abort
runtime.session.subscribe
sessionId / sessionFile metadata
SessionManager.create / continueRecent
AgentSessionEvent -> EventAdapter -> Reducer
```

后续增强候选：

```text
runtime.session.compact
runtime.newSession
runtime.session.messages
runtime.session.isStreaming
```

v1 可展示但不控制：

```text
current model
thinking level
queue_update
compaction_* events
```

v1 暂不做：

```text
model switcher
thinking level switcher
custom tools
extensions UI
MCP
完整 Session Tree
fork / clone
direct AgentHarness 接入
```

## 14. 需要画的第一版链路图

下一步建议先画这三张图：

```text
1. 一次 prompt 的业务链路图
2. SDK 事件流转图
3. 三栏 UI 数据消费图
```

第一张图的核心节点：

```text
Renderer Input
Preload API
IPC command
PiSdkRuntimeService
runtime.session.prompt
session.subscribe events
EventAdapter
Renderer reducer
Run Timeline / Session Sidebar / Right Panel
```
