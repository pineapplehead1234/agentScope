import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceSessionsPanel } from "../components/WorkspaceSessionsPanel";
import {
  createWorkspaceSessionsState,
  updateWorkspaceSessions,
} from "../state/workspace-sessions-store";

describe("WorkspaceSessionsPanel", () => {
  it("shows recent sessions grouped by workspace", () => {
    render(
      <WorkspaceSessionsPanel
        currentWorkspacePath="D:/myproject/agentScope"
        sessions={[
          {
            id: "a",
            filePath: "D:/myproject/agentScope/sessions/a.jsonl",
            workspacePath: "D:/myproject/agentScope",
            title: "Design plan",
            summary: "Design plan",
            isCurrent: true,
          },
          {
            id: "b",
            filePath: "D:/myproject/demo-app/sessions/b.jsonl",
            workspacePath: "D:/myproject/demo-app",
            title: "Fix bug",
            summary: "Fix bug",
            isCurrent: false,
          },
        ]}
      />,
    );

    expect(screen.getByText("D:/myproject/agentScope")).toBeInTheDocument();
    expect(screen.getByText("D:/myproject/demo-app")).toBeInTheDocument();
    expect(screen.getByText("Design plan")).toBeInTheDocument();
    expect(screen.getByText("Fix bug")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("preserves renderer UI state when session data refreshes", () => {
    const initial = createWorkspaceSessionsState({
      sessions: [],
      selectedSessionId: "a",
      expandedWorkspacePaths: ["D:/myproject/agentScope"],
    });

    const next = updateWorkspaceSessions(initial, [
      {
        id: "b",
        filePath: "D:/myproject/agentScope/sessions/b.jsonl",
        workspacePath: "D:/myproject/agentScope",
        title: "New run",
        summary: "New run",
        isCurrent: true,
      },
    ]);

    expect(next.selectedSessionId).toBe("a");
    expect(next.expandedWorkspacePaths).toEqual(["D:/myproject/agentScope"]);
    expect(next.sessions[0].id).toBe("b");
  });
});
