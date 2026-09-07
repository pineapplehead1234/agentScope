# agentScope

AgentScope is an Electron + React desktop client for Pi SDK. It turns a CLI-style
agent run into a three-pane desktop console for session navigation, live run
inspection, and context visibility. The first slice also includes Main-side and
Renderer-side building blocks for local markdown preview.

## Layout

- Left: Workspace Sessions grouped by workspace folder.
- Middle: Run Timeline with assistant deltas and tool execution cards.
- Right: Context Panel for token/cost/context status, with a Markdown Preview component ready for IPC wiring.

## Runtime

Pi SDK runs in the Electron Main Process. Renderer code never imports the SDK and
does not receive Node, file system, or shell access. The Renderer talks to Main
through a narrow Preload + IPC API exposed with `contextBridge`.

## Engineering Highlights

- React mounts through `createRoot`, keeping the renderer on React's Fiber/Concurrent Root path.
- Pi SDK runtime creation, `SessionManager`, and SDK event subscription are isolated in Main Process services.
- Agent events are normalized into typed `AgentRuntimeEvent` objects before crossing IPC.
- The renderer reducer merges high-frequency `text_delta` events into stable timeline state before React rendering.
- Repeated tool calls are tracked by SDK `toolCallId`, avoiding duplicate-key and status-collision bugs.
- Browser windows use `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.

## Scripts

- `npm run dev`: start the Electron development shell.
- `npm test -- --run`: run unit tests.
- `npm run typecheck`: run TypeScript checks.
- `npm run build`: compile Electron Main, Preload, and Renderer bundles.
