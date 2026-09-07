import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import type { AgentRuntimeEvent } from "../../shared/agent-events";

describe("App", () => {
  afterEach(() => {
    cleanup();
    window.agentScope = undefined;
  });

  it("renders the three-pane shell", () => {
    render(<App />);

    expect(screen.getByText("Workspace Sessions")).toBeInTheDocument();
    expect(screen.getByText("Run Timeline")).toBeInTheDocument();
    expect(screen.getByText("Context Panel")).toBeInTheDocument();
  });

  it("renders timeline updates from the preload agent event stream", async () => {
    let listener: ((event: AgentRuntimeEvent) => void) | undefined;
    const unsubscribe = vi.fn();

    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(),
      onAgentEvent: vi.fn((nextListener) => {
        listener = nextListener;
        return unsubscribe;
      }),
    };

    render(<App />);

    await act(async () => {
      listener?.({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "Hello from Pi" },
      });
    });

    expect(screen.getByText("Hello from Pi")).toBeInTheDocument();
  });

  it("loads current session from the preload API", async () => {
    window.agentScope = {
      getCurrentSession: vi.fn(async () => ({
        id: "real-session",
        filePath: "D:/myproject/agentScope/.pi/sessions/real.jsonl",
        workspacePath: "D:/myproject/agentScope",
        title: "Real Pi Session",
        summary: "Loaded from Main IPC",
        isCurrent: true,
      })),
      readMarkdownPreview: vi.fn(),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Real Pi Session")).toBeInTheDocument();
    });
  });

  it("loads markdown preview through the preload API", async () => {
    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(async () => ({
        path: "README.md",
        content: "# AgentScope Preview",
      })),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("# AgentScope Preview")).toBeInTheDocument();
    });
  });
});
