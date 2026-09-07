# AgentScope Metrics

## Implementation Metrics

| Metric | Current Target | Notes |
| --- | ---: | --- |
| Electron process boundaries | 3 | Main, Preload, Renderer |
| Renderer Pi SDK imports | 0 | Enforced by review/search today |
| IPC API surface | 3 channels | Current session request, markdown preview request, and agent event stream |
| Normalized agent event variants | 5 | Start, settled, message delta, tool start, tool end |
| Test files | 9+ | Renderer, Main, and Shared coverage |

## Resume-Oriented Impact

- Secure local capability boundary: Pi SDK, file system, and shell-adjacent runtime stay in Main Process.
- Event-stream architecture: SDK events are normalized once, then reduced into stable UI state.
- React responsiveness: non-urgent agent event updates enter the UI through reducer updates wrapped in `startTransition`.
- Session UX: workspace-scoped session grouping separates persisted session identity from renderer-only panel state.
- Observability: run timeline, tool cards, context stats, and IPC-backed markdown preview make agent execution reviewable today.

## Follow-Up Metrics To Capture

- Number of real Pi SDK event types normalized after full prompt/abort integration.
- Average text-delta events merged per assistant message.
- Number of repeated tool-call collisions avoided by `toolCallId` tracking.
- Time from app launch to first visible shell.
- Bundle size after replacing sample data with real IPC-driven stores.
