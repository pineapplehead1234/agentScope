import type { WorkspaceSessionView } from "../shared/ipc-contract";

type SessionMetadataSource = {
  getSessionId: () => string;
  getSessionFile: () => string | undefined;
  getSessionName: () => string | undefined;
  getEntries: () => unknown[];
};

export function createWorkspaceSessionService(options: {
  cwd: string;
  sessionManager?: SessionMetadataSource;
}) {
  return {
    async getCurrentSession(): Promise<WorkspaceSessionView> {
      const sessionManager = options.sessionManager;

      if (sessionManager) {
        const entryCount = sessionManager.getEntries().length;

        return {
          id: sessionManager.getSessionId(),
          filePath: sessionManager.getSessionFile() ?? "",
          workspacePath: options.cwd,
          title: sessionManager.getSessionName() ?? "Current Session",
          summary: `${entryCount} session entries`,
          isCurrent: true,
        };
      }

      return {
        id: "stub-session",
        filePath: `${options.cwd}/sessions/stub.jsonl`,
        workspacePath: options.cwd,
        title: "Current Session",
        summary: "Stub session for runtime wiring",
        isCurrent: true,
      };
    },
  };
}

export type WorkspaceSessionService = ReturnType<typeof createWorkspaceSessionService>;
