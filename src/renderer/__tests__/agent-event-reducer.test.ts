import { describe, expect, it } from "vitest";
import { reduceAgentEvent } from "../state/agent-event-reducer";

describe("reduceAgentEvent", () => {
  it("merges text_delta into the current assistant message", () => {
    const next = reduceAgentEvent(undefined, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", delta: "Hello" },
    });

    expect(next.messages[0].content).toContain("Hello");
  });

  it("resets stale timeline state when a run starts", () => {
    const next = reduceAgentEvent(
      {
        messages: [{ role: "assistant", content: "Old run" }],
        runningTools: [{ id: "read-1", toolName: "read", status: "success" }],
        isRunning: false,
      },
      { type: "agent_start" },
    );

    expect(next).toEqual({ messages: [], runningTools: [], isRunning: true });
  });

  it("tracks repeated tool calls by tool call id", () => {
    const withFirst = reduceAgentEvent(undefined, {
      type: "tool_execution_start",
      toolCallId: "read-1",
      toolName: "read",
    });
    const withSecond = reduceAgentEvent(withFirst, {
      type: "tool_execution_start",
      toolCallId: "read-2",
      toolName: "read",
    });
    const next = reduceAgentEvent(withSecond, {
      type: "tool_execution_end",
      toolCallId: "read-1",
      toolName: "read",
      isError: false,
    });

    expect(next.runningTools).toEqual([
      { id: "read-1", toolName: "read", status: "success" },
      { id: "read-2", toolName: "read", status: "running" },
    ]);
  });
});
