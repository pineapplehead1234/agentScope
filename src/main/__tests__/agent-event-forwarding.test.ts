import { describe, expect, it, vi } from "vitest";
import { bindAgentEventsToWindow, toAgentRuntimeEvent } from "../agent-event-forwarding";

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

  it("rebinds event forwarding after session replacement", async () => {
    const unsubscribeFirst = vi.fn();
    const unsubscribeSecond = vi.fn();
    const firstSession = { subscribe: vi.fn(() => unsubscribeFirst) };
    const secondSession = { subscribe: vi.fn(() => unsubscribeSecond) };
    let replacementListener: (() => void) | undefined;
    const runtimeHandle = { runtime: { session: firstSession } };
    const runtimeService = {
      create: vi.fn(async () => runtimeHandle),
      onSessionReplaced: vi.fn((listener) => {
        replacementListener = listener;
        return vi.fn();
      }),
    };

    await bindAgentEventsToWindow({
      runtimeService,
      window: { webContents: { send: vi.fn() } },
    });
    runtimeHandle.runtime.session = secondSession;
    replacementListener?.();

    expect(unsubscribeFirst).toHaveBeenCalled();
    expect(secondSession.subscribe).toHaveBeenCalled();
  });
});
