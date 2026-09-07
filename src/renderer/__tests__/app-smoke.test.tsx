import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import type { AgentRuntimeEvent } from "../../shared/agent-events";

describe("App", () => {
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
});
