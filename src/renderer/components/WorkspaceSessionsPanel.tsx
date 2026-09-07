import type { WorkspaceSessionView } from "../../shared/ipc-contract";
import { groupSessionsByWorkspace } from "../state/workspace-sessions-store";
import { WorkspaceGroup } from "./WorkspaceGroup";

export function WorkspaceSessionsPanel(props: {
  currentWorkspacePath: string;
  sessions: WorkspaceSessionView[];
}) {
  const groups = groupSessionsByWorkspace(props.sessions);

  return (
    <aside className="border-r border-zinc-800 bg-zinc-950 px-4 py-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-zinc-100">Workspace Sessions</h2>
        <p className="break-all text-xs leading-5 text-zinc-500">
          Current workspace: {props.currentWorkspacePath}
        </p>
      </div>
      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <WorkspaceGroup
            key={group.workspacePath}
            workspacePath={group.workspacePath}
            sessions={group.sessions}
          />
        ))}
      </div>
    </aside>
  );
}
