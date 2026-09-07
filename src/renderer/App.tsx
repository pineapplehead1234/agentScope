import { startTransition, useEffect, useReducer, useState } from "react";
import { AgentCommandBar } from "./components/AgentCommandBar";
import { ContextPanel } from "./components/ContextPanel";
import { RunTimeline } from "./components/RunTimeline";
import { WorkspaceSessionsPanel } from "./components/WorkspaceSessionsPanel";
import {
  initialContextPanelState,
  type ContextPanelState,
} from "./state/context-store";
import {
  initialAgentTimelineState,
  reduceAgentEvent,
} from "./state/agent-event-reducer";
import {
  createWorkspaceSessionsState,
  updateWorkspaceSessions,
} from "./state/workspace-sessions-store";

export function App() {
  const currentWorkspacePath = "D:/myproject/agentScope";
  const [workspaceState, setWorkspaceState] = useState(() =>
    createWorkspaceSessionsState({
      sessions: [
        {
          id: "current",
          filePath: `${currentWorkspacePath}/sessions/current.jsonl`,
          workspacePath: currentWorkspacePath,
          title: "Current Session",
          summary: "Workspace-scoped Pi SDK session",
          isCurrent: true,
        },
      ],
    }),
  );
  const [contextState, setContextState] = useState<ContextPanelState>(initialContextPanelState);
  const [timelineState, dispatchTimelineEvent] = useReducer(
    reduceAgentEvent,
    initialAgentTimelineState,
  );

  useEffect(() => {
    const api = window.agentScope;

    if (api) {
      const currentSession = api.getCurrentSession();
      if (currentSession) {
        void currentSession.then((session) => {
          startTransition(() => {
            setWorkspaceState((state) => updateWorkspaceSessions(state, [session]));
          });
        }).catch((error: unknown) => {
          console.error("Failed to load current session", error);
        });
      }

      const markdownPreview = api.readMarkdownPreview("README.md");
      if (markdownPreview) {
        void markdownPreview.then((preview) => {
          startTransition(() => {
            setContextState((state) => ({ ...state, markdownPreview: preview }));
          });
        }).catch((error: unknown) => {
          console.error("Failed to load markdown preview", error);
        });
      }
    }
  }, []);

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
        currentWorkspacePath={workspaceState.sessions[0]?.workspacePath ?? currentWorkspacePath}
        sessions={workspaceState.sessions}
      />
      <section className="min-w-0">
        <RunTimeline state={timelineState} />
        <div className="px-6 pb-5">
          <AgentCommandBar />
        </div>
      </section>
      <ContextPanel
        stats={contextState.stats}
        markdownPreview={contextState.markdownPreview}
      />
    </main>
  );
}
