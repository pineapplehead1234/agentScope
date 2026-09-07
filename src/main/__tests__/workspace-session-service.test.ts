import { describe, expect, it } from "vitest";
import { createWorkspaceSessionService } from "../workspace-session-service";

describe("WorkspaceSessionService", () => {
  it("returns a structured current session view", async () => {
    const service = createWorkspaceSessionService({ cwd: "D:/myproject/agentScope" });
    const current = await service.getCurrentSession();

    expect(current).toEqual(
      expect.objectContaining({
        workspacePath: "D:/myproject/agentScope",
        isCurrent: true,
      }),
    );
  });

  it("uses SessionManager metadata when available", async () => {
    const service = createWorkspaceSessionService({
      cwd: "D:/myproject/agentScope",
      sessionManager: {
        getSessionId: () => "real-session",
        getSessionFile: () => "D:/myproject/agentScope/.pi/sessions/real.jsonl",
        getSessionName: () => "Resume Highlights",
        getEntries: () => [{ type: "message" }],
      },
    });

    await expect(service.getCurrentSession()).resolves.toEqual(
      expect.objectContaining({
        id: "real-session",
        filePath: "D:/myproject/agentScope/.pi/sessions/real.jsonl",
        title: "Resume Highlights",
        summary: "1 session entries",
      }),
    );
  });
});
