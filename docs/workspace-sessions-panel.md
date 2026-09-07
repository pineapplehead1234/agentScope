# Workspace Sessions Panel 功能清单

## 1. 定位

左侧面板命名为 `Workspace Sessions Panel`。

它负责按 workspace folder 管理和展示 Pi SDK session，是 AgentScope 的会话入口。

核心语义：

```text
一个 workspace folder 对应一组 Pi session。
当前已实现：Renderer 可展示传入的 workspace 分组 session 数据，并通过 IPC 加载当前 session。
当前已实现：AgentScope 仍然只有一个 active session。
后续增强：跨 workspace 最近会话列表、session 切换、新建 session 和运行中切换中断确认。
后续增强：session replacement 后重新订阅新的 runtime.session。
```

左侧不负责：

```text
Git worktree
Git branch
完整文件树
多 session 并发运行
Agent 运行详情
上下文统计详情
工具调用详情
```

## 2. 设计原则

### 2.1 多 workspace，不做 worktree

多 workspace 指：用户可以在左侧看到多个项目文件夹，以及每个文件夹下面对应的 Pi session。

示例：

```text
Recent Sessions
  - 设计 AgentScope 架构...
  - 修复 Electron 启动问题...

Workspaces
  D:\myproject\agentScope
    - 设计左侧 Session 面板...
    - 接入 Pi SDK runtime...

  D:\myproject\demo-app
    - 分析 React 组件结构...
    - 修复测试失败...
```

这不是 Git worktree。v1 不关心一个 Git 仓库下有多少分支或多少工作树。

### 2.2 单 active session

Pi SDK 的 `AgentSessionRuntime` 支持切换会话，但它是单 active session 模型。

也就是说：

```text
runtime.session 同一时间只指向一个当前会话。
switchSession 会替换当前 active session。
切换时当前 session 会被 abort / dispose。
切换后必须重新订阅新的 runtime.session。
```

v1 不做：

```text
Session A 后台继续跑
Session B 同时打开查看
多个 session 同时 streaming
多任务并发面板
```

### 2.3 字段展示不是主要复杂度

展示字段多少不是主要复杂度来源。复杂度主要来自：

```text
是否引入 session replacement
是否需要取消旧订阅并绑定新订阅
是否需要处理中断和切换竞态
是否需要跨模块重建 UI 状态
```

因此 v1 可以展示相对完整的只读 session 信息，但要谨慎控制切换、新建、删除、fork 等生命周期操作。

## 3. v1 功能清单

### 3.1 Recent Sessions

顶部展示最近使用的 session。

展示字段：

```text
session 摘要
所属 workspace folder
时间，如果 SDK 返回
当前 active session 标识
```

交互：

```text
点击 session 可以切换
当前 active session 高亮
切换中显示 loading
切换失败显示错误
```

需要 SDK：

```text
SessionManager.listAll(cwd)
runtime.switchSession(sessionPath)
runtime.session
session.subscribe()
session.state.messages
```

复杂度：中高

原因：展示最近会话不难，复杂点来自点击后触发 active session replacement。

简历价值：高

可写方向：

```text
基于 Pi SDK SessionManager 与 AgentSessionRuntime 实现最近会话入口和 active session 切换，在 session replacement 后重建事件订阅和消息状态。
```

### 3.2 Workspace List

展示多个 workspace folder。

展示字段：

```text
workspace path
该 workspace 下 session 数量
是否包含当前 active session
展开 / 收起状态
```

workspace 来源：

```text
v1 可以先来自 SessionManager.listAll(cwd) 返回的 session 所属 cwd。
后续再支持用户手动添加 workspace folder。
```

交互：

```text
展开 workspace
收起 workspace
查看该 workspace 下 sessions
```

v1 不做：

```text
删除 workspace
重命名 workspace
扫描 workspace 文件树
展示 Git branch/worktree
```

需要 SDK：

```text
SessionManager.listAll(cwd)
SessionManager.list(workspaceCwd)
```

复杂度：中

原因：多 workspace 展示本身主要是数据分组；复杂度低于 session switch。

简历价值：中

可写方向：

```text
按 workspace cwd 对历史 session 进行分组展示，帮助用户在多个项目目录间快速定位 Agent 会话。
```

### 3.3 Workspace Sessions

每个 workspace 下展示对应 session 列表。

session item 展示字段：

```text
摘要，优先使用 firstMessage
时间，如果 SDK 返回
sessionId 短 ID
session file path
是否为当前 active session
```

交互：

```text
点击 session 切换
当前 session 高亮
目标 session 切换中显示 loading
```

需要 SDK：

```text
SessionManager.list(workspaceCwd)
runtime.switchSession(sessionPath)
```

复杂度：中高

原因：列表展示中低，点击切换中高。

简历价值：高

可写方向：

```text
支持按 workspace 展示历史会话并切换目标 session，切换后恢复目标会话消息历史和运行状态。
```

### 3.4 Current Session

展示当前 active session 信息。

展示字段：

```text
sessionName，如果 SDK 能稳定读取
sessionId
sessionFile
workspace path
messageCount
isStreaming
isCompacting
```

需要 SDK：

```text
runtime.session.sessionId
runtime.session.sessionFile
runtime.session.state.messages
runtime.session.isStreaming
```

复杂度：低

原因：主要是读取当前 runtime.session 状态并展示。

简历价值：中低

它通常不单独写简历，合并到会话管理能力里。

### 3.5 New Session In Workspace

支持在指定 workspace 下新建 session。

交互：

```text
用户在某个 workspace 下点击 New Session
如果当前 active session idle，直接新建并切换到新 session
如果当前 active session running，弹确认
确认后中断当前任务并新建目标 workspace 的 session
新建成功后刷新 workspace session 列表
中间 Run Timeline 清空
右侧 Context Stats 重置
```

需要注意：

```text
如果新建的是当前 runtime.cwd 下的 session，可以直接使用 runtime.newSession()。
如果新建的是另一个 workspace 下的 session，需要确认 AgentSessionRuntime 是否能用目标 cwd 创建新 runtime。
实现前必须查 SDK 的 createAgentSessionRuntime / SessionManager.create(cwd) 组合方式。
```

v1 可采用保守规则：

```text
只允许在当前 active workspace 下 New Session。
其他 workspace 先只支持展示和切换已有 session。
```

复杂度：中到中高

原因：当前 workspace 新建是中等复杂度；跨 workspace 新建会涉及 cwd-bound runtime 重建，复杂度更高。

建议 v1 选择：

```text
支持当前 active workspace 下 New Session。
跨 workspace New Session 放到 v2。
```

简历价值：中

可写方向：

```text
基于 AgentSessionRuntime 实现当前 workspace 下新建会话，在 active session replacement 后重建事件订阅并刷新 UI 状态，保证新旧会话隔离。
```

### 3.6 Switch Session

支持点击任意历史 session 切换。

交互规则：

```text
点击目标 session
如果目标就是当前 session，不处理
如果当前 session idle，直接切换
如果当前 session running，弹确认
确认后调用 switch session
切换成功后恢复目标 session 的消息历史
切换失败则保留当前 UI，并显示错误
```

运行中确认文案：

```text
当前会话仍在运行。切换会中断当前任务并打开目标会话。
```

按钮：

```text
取消
中断并切换
```

切换后必须处理：

```text
取消旧 session.subscribe
绑定新 runtime.session.subscribe
重建中间 Run Timeline
刷新左侧 current session
刷新右侧 Context Stats
高亮目标 session
清理切换中 loading
```

需要 SDK：

```text
runtime.switchSession(sessionPath)
runtime.setRebindSession() 或自定义 rebind
runtime.session
session.subscribe()
session.state.messages
session.sessionId
session.sessionFile
```

复杂度：高

原因：这是左侧最复杂的功能，复杂度来自 active session replacement 生命周期。

简历价值：高

可写方向：

```text
基于 AgentSessionRuntime.switchSession 实现单 active session 的会话切换，在 session replacement 后重建事件订阅、消息历史和当前会话状态，避免旧 session 事件污染新会话 UI。
```

### 3.7 Session State Sync

左侧状态需要随 Agent 运行同步更新。

同步内容：

```text
当前 session 是否 running
当前 session messageCount
当前 session 是否 compacting
当前 session 高亮
workspace session 列表刷新
切换 loading
错误提示
```

需要 SDK：

```text
session.subscribe()
agent_start
agent_settled
message_start
message_end
compaction_start
compaction_end
```

复杂度：中

原因：它依赖全局 Agent runtime 状态，不是左侧孤立状态。

简历价值：中

可合并到 session replacement 或 event reducer 亮点里。

## 4. v1 不做

明确不做：

```text
Git worktree
Git branch
完整文件树
多 session 后台并发运行
多 session 同时 streaming
删除 session
重命名历史 session
session 搜索
session 收藏
session 标签
fork
clone
Session Tree 编辑
拖拽排序
批量操作
跨 workspace 新建 session，v1 先不做
```

## 5. SDK 需求总表

| 功能 | SDK 能力 | 备注 |
|---|---|---|
| 启动恢复最近 session | `SessionManager.continueRecent(cwd)` | 启动时使用 |
| 列出当前 workspace sessions | `SessionManager.list(workspaceCwd)` | 展示 workspace 下 session |
| 顶部 Recent Sessions | `SessionManager.listAll(cwd)` | 用于跨 workspace 最近会话 |
| 新建当前 workspace session | `runtime.newSession()` | v1 只做当前 active workspace |
| 切换 session | `runtime.switchSession(sessionPath)` | 核心生命周期操作 |
| 当前 session 信息 | `runtime.session.sessionId`、`runtime.session.sessionFile` | 左侧当前会话展示 |
| 消息数量/历史恢复 | `runtime.session.state.messages` | 切换后恢复中间时间线 |
| 判断运行中 | `runtime.session.isStreaming` | 运行中切换确认 |
| 事件订阅 | `runtime.session.subscribe()` | 当前 session 事件流 |
| session replacement 后重绑 | `runtime.setRebindSession()` 或自定义 rebind | 防止旧事件污染新 UI |

## 6. 封装建议

需要封装，封装位置在 Electron Main Process。

建议名称：

```text
WorkspaceSessionService
```

职责：

```text
维护当前 active runtime
列出 recent sessions
按 workspace 分组 sessions
读取 current session
执行 new session
执行 switch session
处理 session replacement 后的 rebind
把普通 JSON 数据返回给 Renderer
```

不负责：

```text
Run Timeline 渲染
Tool Timeline 渲染
Context Stats 计算
Markdown Preview
模型设置
工具设置
```

Preload 暴露给 Renderer 的 API 可以是：

```ts
window.agentScope.sessions.listRecent()
window.agentScope.sessions.listWorkspaces()
window.agentScope.sessions.listByWorkspace(workspacePath)
window.agentScope.sessions.current()
window.agentScope.sessions.newCurrentWorkspace()
window.agentScope.sessions.switch(sessionPath)
```

Renderer 不能直接接触：

```text
SessionManager
AgentSessionRuntime
AgentSession
session.subscribe
session.state
```

## 7. 左侧 View 数据

Renderer 只接收普通 JSON。

建议数据结构：

```ts
type WorkspaceView = {
  path: string;
  sessionCount: number;
  isCurrent: boolean;
  isExpanded: boolean;
};

type SessionListItem = {
  id: string;
  filePath: string;
  workspacePath: string;
  title: string;
  summary: string;
  updatedAt?: number;
  isCurrent: boolean;
  isSwitching?: boolean;
};

type CurrentSessionView = {
  id: string;
  filePath?: string;
  workspacePath: string;
  name?: string;
  messageCount: number;
  isStreaming: boolean;
  isCompacting: boolean;
};
```

注意：字段是否真实可用，要在实现前对照 `SessionManager.list()` 返回类型确认。没有稳定字段就不展示，不自行编造。

## 8. 简历亮点

如果左侧按此边界完成，可以写：

```text
当前可写：基于 Pi SDK SessionManager 和 typed IPC 实现当前 workspace session 加载，并在 Renderer 侧完成 workspace 分组展示与 UI-only state 分离，为 session replacement 后的订阅重建和历史恢复预留边界。

后续完成后再写：支持跨项目目录最近会话展示、新建当前会话、会话切换，并针对 SDK 单 active session 模型在 session replacement 后重建事件订阅、消息历史和当前会话状态，避免旧 session 事件污染新会话 UI。
```

可量化指标：

```text
支持 N 个 workspace 的 session 分组展示
支持 N 类会话状态同步
覆盖 new session / switch session / running switch confirm 等 N 类切换场景
```

这些指标必须在真实实现和测试后再写入简历。
