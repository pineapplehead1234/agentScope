# AgentScope Demo Checklist

## Startup

- App starts through Electron with `contextIsolation`, `nodeIntegration: false`, and sandboxed renderer enabled.
- React renderer mounts with `createRoot`.
- Three-pane shell is visible: Workspace Sessions, Run Timeline, Context Panel.

## Workspace Sessions

- Current workspace appears in the left panel.
- Sessions are grouped by workspace path.
- Current session is marked without losing renderer-only UI state on refresh.

## Pi SDK Boundary

- Pi SDK imports exist only in Main Process files.
- Renderer uses `window.agentScope` from Preload instead of direct SDK imports.
- Main owns `SessionManager`, runtime creation, and event subscription.

## Run Timeline

- Prompt submission and abort controls call Main Process runtime commands through Preload IPC.
- New session and switch session controls call Main Process session replacement APIs through Preload IPC.
- Runtime state, messages, and session stats are available as serializable Preload IPC calls.
- Main normalizes Pi SDK events and forwards them over IPC.
- Main rebinds event forwarding after session replacement.
- Renderer reducer merges assistant `text_delta` events into a stable assistant message.
- Tool execution cards use `toolCallId` so repeated tools do not collide.
- `agent_start` resets stale timeline state before the next run.

## Context And Preview

- Context Panel shows token usage, cost, context percentage, compaction state, and summary.
- Context Panel loads token/cost/context usage from `getSessionStats()`.
- Markdown preview loads workspace markdown through Main-side file reading and Preload IPC.

## Verification

- `npm test -- --run`
- `npm run typecheck`
- `npm run build`

## Resume Talking Points

- Built a secure Electron Main/Preload/Renderer boundary for local AI agent capabilities.
- Converted high-frequency Pi SDK event streams into reducer-driven React view models.
- Modeled workspace-scoped session navigation, session replacement commands, and replacement-safe event subscription.
- Added typed IPC contracts so SDK/runtime data crossing process boundaries stays explicit.
