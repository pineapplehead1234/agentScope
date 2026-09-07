import { describe, expect, it } from "vitest";
import { toAgentRuntimeEvent } from "../agent-event-forwarding";

describe("toAgentRuntimeEvent", () => {
  it("keeps Pi SDK tool call ids in renderer events", () => {
    expect(
      toAgentRuntimeEvent({
        type: "tool_execution_start",
        toolCallId: "call-1",
        toolName: "read",
      }),
    ).toEqual({
      type: "tool_execution_start",
      toolCallId: "call-1",
      toolName: "read",
    });
  });
});
