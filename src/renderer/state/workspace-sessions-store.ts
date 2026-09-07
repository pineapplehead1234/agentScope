import type { WorkspaceSessionView } from "../../shared/ipc-contract";

export type WorkspaceSessionGroup = {
  workspacePath: string;
  sessions: WorkspaceSessionView[];
};

export type WorkspaceSessionsState = {
  sessions: WorkspaceSessionView[];
  selectedSessionId: string | null;
  expandedWorkspacePaths: string[];
};

export function createWorkspaceSessionsState(
  options: Partial<WorkspaceSessionsState> = {},
): WorkspaceSessionsState {
  return {
    sessions: options.sessions ?? [],
    selectedSessionId: options.selectedSessionId ?? null,
    expandedWorkspacePaths: options.expandedWorkspacePaths ?? [],
  };
}

export function updateWorkspaceSessions(
  state: WorkspaceSessionsState,
  sessions: WorkspaceSessionView[],
): WorkspaceSessionsState {
  return {
    ...state,
    sessions,
  };
}

export function groupSessionsByWorkspace(
  sessions: WorkspaceSessionView[],
): WorkspaceSessionGroup[] {
  const groups = new Map<string, WorkspaceSessionView[]>();

  for (const session of sessions) {
    const workspaceSessions = groups.get(session.workspacePath) ?? [];
    workspaceSessions.push(session);
    groups.set(session.workspacePath, workspaceSessions);
  }

  return Array.from(groups, ([workspacePath, workspaceSessions]) => ({
    workspacePath,
    sessions: workspaceSessions,
  }));
}
