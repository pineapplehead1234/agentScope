import { WorkspaceSessionsPanel } from "./components/WorkspaceSessionsPanel";

export function App() {
  const currentWorkspacePath = "D:/myproject/agentScope";

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
      <section>Run Timeline</section>
      <aside>Context Panel</aside>
    </main>
  );
}
