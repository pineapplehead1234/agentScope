import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import type { AgentRuntimeEvent } from "../../shared/agent-events";

const idleRuntimeState = {
  isStreaming: false,
  isIdle: true,
  isCompacting: false,
  sessionId: "test-session",
  sessionFile: undefined,
  sessionName: undefined,
};

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
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(async () => idleRuntimeState),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(),
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
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(async () => idleRuntimeState),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(),
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
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("# AgentScope Preview")).toBeInTheDocument();
    });
  });

  it("sends prompt and abort commands through the preload API", async () => {
    const prompt = vi.fn(async () => undefined);
    const abort = vi.fn(async () => undefined);
    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(),
      prompt,
      abort,
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    fireEvent.change(screen.getByLabelText("Agent prompt"), {
      target: { value: "Inspect the reducer" },
    });
    fireEvent.click(screen.getByText("Send"));
    fireEvent.click(screen.getByText("Abort"));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledWith("Inspect the reducer");
      expect(abort).toHaveBeenCalled();
    });
  });

  it("sends new and switch session commands through the preload API", async () => {
    const newSession = vi.fn(async () => ({ cancelled: false }));
    const switchSession = vi.fn(async () => ({ cancelled: false }));
    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(),
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession,
      switchSession,
      getState: vi.fn(),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    fireEvent.click(screen.getByText("New Session"));
    fireEvent.change(screen.getByLabelText("Session path"), {
      target: { value: "D:/sessions/target.jsonl" },
    });
    fireEvent.click(screen.getByText("Switch"));

    await waitFor(() => {
      expect(newSession).toHaveBeenCalled();
      expect(switchSession).toHaveBeenCalledWith("D:/sessions/target.jsonl");
    });
  });

  it("loads context stats from the runtime stats IPC", async () => {
    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(),
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(async () => ({ ...idleRuntimeState, isCompacting: true })),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(async () => ({
        tokens: { total: 9000 },
        cost: 0.33,
        contextUsage: { percent: 71 },
      })),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("9000")).toBeInTheDocument();
      expect(screen.getByText("0.33")).toBeInTheDocument();
      expect(screen.getByText("71%")).toBeInTheDocument();
      expect(screen.getByText("Running")).toBeInTheDocument();
    });
  });

  it("preserves compaction state when stats resolve after runtime state", async () => {
    let resolveStats: ((value: { tokens: { total: number }; cost: number }) => void) | undefined;
    const sessionStats = new Promise<{ tokens: { total: number }; cost: number }>((resolve) => {
      resolveStats = resolve;
    });
    window.agentScope = {
      getCurrentSession: vi.fn(),
      readMarkdownPreview: vi.fn(),
      prompt: vi.fn(),
      abort: vi.fn(),
      newSession: vi.fn(),
      switchSession: vi.fn(),
      getState: vi.fn(async () => ({ ...idleRuntimeState, isCompacting: true })),
      getMessages: vi.fn(),
      getSessionStats: vi.fn(() => sessionStats),
      onAgentEvent: vi.fn(() => vi.fn()),
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Running")).toBeInTheDocument();
    });
    resolveStats?.({ tokens: { total: 12 }, cost: 0.01 });

    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("Running")).toBeInTheDocument();
    });
  });
});
