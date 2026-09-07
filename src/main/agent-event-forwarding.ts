import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import type { AgentRuntimeEvent } from "../shared/agent-events";
import { ipcChannels } from "../shared/ipc-contract";

type AgentEventTargetWindow = {
  webContents: {
    send: (channel: string, payload: AgentRuntimeEvent) => void;
  };
};

type AgentEventRuntimeHandle = {
  runtime: {
    session: {
      subscribe: (listener: (event: AgentSessionEvent) => void) => () => void;
    };
  };
};

export function toAgentRuntimeEvent(
  event: Pick<AgentSessionEvent, "type"> & Record<string, unknown>,
): AgentRuntimeEvent | null {
  switch (event.type) {
    case "agent_start":
      return { type: "agent_start" };
    case "agent_settled":
      return { type: "agent_settled" };
    case "message_update":
      if (
        typeof event.assistantMessageEvent === "object" &&
        event.assistantMessageEvent !== null &&
        "type" in event.assistantMessageEvent &&
        event.assistantMessageEvent.type === "text_delta" &&
        "delta" in event.assistantMessageEvent &&
        typeof event.assistantMessageEvent.delta === "string"
      ) {
        return {
          type: "message_update",
          assistantMessageEvent: {
            type: "text_delta",
            delta: event.assistantMessageEvent.delta,
          },
        };
      }
      return null;
    case "tool_execution_start":
      if (typeof event.toolCallId === "string" && typeof event.toolName === "string") {
        return {
          type: "tool_execution_start",
          toolCallId: event.toolCallId,
          toolName: event.toolName,
        };
      }
      return null;
    case "tool_execution_end":
      if (
        typeof event.toolCallId === "string" &&
        typeof event.toolName === "string" &&
        typeof event.isError === "boolean"
      ) {
        return {
          type: "tool_execution_end",
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          isError: event.isError,
        };
      }
      return null;
    default:
      return null;
  }
}

export function forwardAgentEventsToWindow(options: {
  runtimeHandle: AgentEventRuntimeHandle;
  window: AgentEventTargetWindow;
}) {
  return options.runtimeHandle.runtime.session.subscribe((event) => {
    const runtimeEvent = toAgentRuntimeEvent(event);

    if (runtimeEvent) {
      options.window.webContents.send(ipcChannels.agentEvent, runtimeEvent);
    }
  });
}

export async function bindAgentEventsToWindow(options: {
  runtimeService: {
    create: () => Promise<AgentEventRuntimeHandle>;
    onSessionReplaced: (listener: () => void) => () => void;
  };
  window: AgentEventTargetWindow;
}) {
  const runtimeHandle = await options.runtimeService.create();
  let unsubscribeSession = forwardAgentEventsToWindow({
    runtimeHandle,
    window: options.window,
  });

  const unsubscribeReplacement = options.runtimeService.onSessionReplaced(() => {
    unsubscribeSession();
    unsubscribeSession = forwardAgentEventsToWindow({
      runtimeHandle,
      window: options.window,
    });
  });

  return () => {
    unsubscribeSession();
    unsubscribeReplacement();
  };
}
