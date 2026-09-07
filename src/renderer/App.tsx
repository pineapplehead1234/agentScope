import { startTransition, useEffect, useReducer } from "react";
import { RunTimeline } from "./components/RunTimeline";
import { WorkspaceSessionsPanel } from "./components/WorkspaceSessionsPanel";
import {
  initialAgentTimelineState,
  reduceAgentEvent,
} from "./state/agent-event-reducer";

export function App() {
  const currentWorkspacePath = "D:/myproject/agentScope";
  const [timelineState, dispatchTimelineEvent] = useReducer(
    reduceAgentEvent,
    initialAgentTimelineState,
  );

  useEffect(() => {
    return window.agentScope?.onAgentEvent((event) => {
      startTransition(() => {
        dispatchTimelineEvent(event);
      });
    });
  }, []);

  return (
    <main className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)_320px] bg-zinc-950 text-zinc-100">
      <WorkspaceSessionsPanel
        currentWorkspacePath={currentWorkspacePath}
        sessions={[
          {
            id: "current",
            filePath: `${currentWorkspacePath}/sessions/current.jsonl`,
            workspacePath: currentWorkspacePath,
            title: "Current Session",
            summary: "Workspace-scoped Pi SDK session",
            isCurrent: true,
          },
        ]}
      />
      <RunTimeline state={timelineState} />
      <aside>Context Panel</aside>
    </main>
  );
}
